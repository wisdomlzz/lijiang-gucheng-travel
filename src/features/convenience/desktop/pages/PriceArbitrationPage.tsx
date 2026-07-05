import { useMemo, useState } from "react"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { useConvenienceStore } from "../../store"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { ConvenienceStatusLabel } from "../../../../shared/types"

export default function PriceArbitrationPage() {
  const orders = useConvenienceStore((s) => s.orders)
  const approveCancelRequest = useConvenienceStore((s) => s.approveCancelRequest)
  const rejectCancelRequest = useConvenienceStore((s) => s.rejectCancelRequest)

  const cancelRequests = useMemo(() => orders.filter((o) => o.cancelRequested), orders)

  const resolvedPagination = usePagination(cancelRequests, 10)

  const handleApprove = (orderId: string) => {
    approveCancelRequest(orderId)
    toast.success("已同意取消")
  }

  const handleReject = (orderId: string) => {
    rejectCancelRequest(orderId)
    toast.success("已拒绝取消")
  }

  return (
    <PageLayout title="取消审批" description="处理便民服务的取消申请">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">待审批</span>
            </div>
            <div className="text-2xl font-semibold mt-1">{cancelRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">待人工处理</div>
            <div className="text-2xl font-semibold mt-1">{orders.filter((o) => o.status === "S90").length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">取消申请列表 ({cancelRequests.length})</h3>
        {cancelRequests.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">暂无待处理的取消申请</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>服务类型</TableHead>
                  <TableHead>当前状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedPagination.paginatedItems.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell>{o.serviceType}</TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-700">{ConvenienceStatusLabel[o.status]}</Badge>
                    </TableCell>
                    <TableCell className="space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-200"
                        onClick={() => handleApprove(o.id)}
                      >
                        <CheckCircle2 className="size-3 mr-1" />
                        同意
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 border-rose-200"
                        onClick={() => handleReject(o.id)}
                      >
                        <XCircle className="size-3 mr-1" />
                        拒绝
                      </Button>
                    </TableCell>
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
    </PageLayout>
  )
}
