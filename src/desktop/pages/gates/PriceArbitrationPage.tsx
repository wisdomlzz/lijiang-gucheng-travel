import { useMemo, useState } from "react"
import { Card, CardContent } from "../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { Badge } from "../../../shared/components/ui/badge"
import { Button } from "../../../shared/components/ui/button"
import { Input } from "../../../shared/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../shared/components/ui/dialog"
import { PageLayout } from "../../components/common/PageLayout"
import { useConvenienceStore } from "../../../shared/mock"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { AlertTriangle, CheckCircle2, XCircle, Search } from "lucide-react"
import { toast } from "sonner"
import { ConvenienceStatusLabel } from "../../../shared/types"

export default function PriceArbitrationPage() {
  const orders = useConvenienceStore((s) => s.orders)
  const resolvePriceDispute = useConvenienceStore((s) => s.resolvePriceDispute)

  const [searchQuery, setSearchQuery] = useState("")
  const [arbDialog, setArbDialog] = useState<{ orderId: string; action: "override" | "cancel" } | null>(null)
  const [arbRemark, setArbRemark] = useState("")

  const disputed = useMemo(() => {
    const base = orders.filter((o) => o.status === "A38")
    if (!searchQuery.trim()) return base
    const q = searchQuery.trim().toLowerCase()
    return base.filter((o) => o.id.toLowerCase().includes(q))
  }, [orders, searchQuery])

  const recentResolved = useMemo(() => orders.filter((o) => o.status === "A35" || o.status === "S50"), [orders])
  const resolvedPagination = usePagination(recentResolved, 10)

  const handleArbitrate = () => {
    if (!arbDialog) return
    if (arbDialog.action === "override") {
      const order = orders.find((o) => o.id === arbDialog.orderId)
      resolvePriceDispute(arbDialog.orderId, "override", order?.priceQuote, arbRemark)
      toast.success(arbRemark ? `已强制执行报价（备注：${arbRemark}）` : "已强制执行报价")
    } else {
      resolvePriceDispute(arbDialog.orderId, "cancel", undefined, arbRemark)
      toast.success(arbRemark ? `已取消订单（原因：${arbRemark}）` : "已取消订单")
    }
    setArbDialog(null)
    setArbRemark("")
  }

  return (
    <PageLayout title="价格仲裁" description="处理便民服务的价格争议">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2"><AlertTriangle className="size-5 text-rose-500" /><span className="text-sm text-muted-foreground">待仲裁</span></div>
          <div className="text-2xl font-semibold mt-1">{orders.filter((o) => o.status === "A38").length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-sm text-muted-foreground">协商超时待处理</div>
          <div className="text-2xl font-semibold mt-1">{orders.filter((o) => o.status === "S90").length}</div>
        </CardContent></Card>
      </div>

      {/* Disputed orders */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">待处理价格争议 ({disputed.length})</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索订单号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
        {disputed.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            {searchQuery.trim() ? "无匹配的争议订单" : "暂无待处理的价格争议"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>报价</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputed.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell>¥{o.priceQuote ?? "?"}</TableCell>
                  <TableCell><Badge className="bg-rose-100 text-rose-700">{ConvenienceStatusLabel[o.status]}</Badge></TableCell>
                  <TableCell className="space-x-1">
                    <Button size="sm" onClick={() => { setArbDialog({ orderId: o.id, action: "override" }); setArbRemark("") }}>
                      <CheckCircle2 className="size-3 mr-1" />执行报价
                    </Button>
                    <Button size="sm" variant="outline" className="text-rose-600" onClick={() => { setArbDialog({ orderId: o.id, action: "cancel" }); setArbRemark("") }}>
                      <XCircle className="size-3 mr-1" />取消订单
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Recently resolved */}
      <Card className="p-4 mt-4">
        <h3 className="text-sm font-medium mb-3">已处理记录 ({recentResolved.length})</h3>
        {recentResolved.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">暂无已处理记录</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>服务类型</TableHead>
                  <TableHead>报价</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedPagination.paginatedItems.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell>{o.serviceType}</TableCell>
                    <TableCell>¥{o.priceQuote ?? "?"}</TableCell>
                    <TableCell><Badge className={o.status === "A35" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>{ConvenienceStatusLabel[o.status]}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-3 border-t pt-3">
              <PaginationBar
                page={resolvedPagination.currentPage}
                totalPages={resolvedPagination.totalPages}
                onPageChange={resolvedPagination.setCurrentPage}
                pageSize={10}
                onPageSizeChange={() => {}}
                total={resolvedPagination.total}
              />
            </div>
          </>
        )}
      </Card>

      {/* Arbitration remark dialog */}
      <Dialog open={!!arbDialog} onOpenChange={(open) => { if (!open) { setArbDialog(null); setArbRemark("") } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{arbDialog?.action === "override" ? "执行报价" : "取消订单"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              订单号：<span className="font-mono">{arbDialog?.orderId}</span>
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">
                {arbDialog?.action === "override" ? "备注（可选）" : "取消原因（可选）"}
              </label>
              <textarea
                value={arbRemark}
                onChange={(e) => setArbRemark(e.target.value)}
                placeholder={arbDialog?.action === "override" ? "请输入仲裁备注..." : "请输入取消原因..."}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setArbDialog(null); setArbRemark("") }}>取消</Button>
            <Button
              variant={arbDialog?.action === "cancel" ? "destructive" : "default"}
              onClick={handleArbitrate}
            >
              {arbDialog?.action === "override" ? "确认执行" : "确认取消"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
