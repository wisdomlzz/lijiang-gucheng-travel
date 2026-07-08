import { useState, useEffect, useMemo } from "react"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Skeleton } from "../../../../shared/components/ui/skeleton"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { usePagination } from "@/shared/hooks/usePagination"
import { api } from "@/api/client"
import { CheckCircle, Search } from "lucide-react"
import { toast } from "sonner"

export default function BookingManagePage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "verified">("all")

  useEffect(() => {
    api.list("bookings", { pageSize: 200 }).then((res: any) => {
      setBookings(res.items || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = bookings
    if (filterTab === "pending") list = list.filter((b) => !b.verified)
    else if (filterTab === "verified") list = list.filter((b) => b.verified)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((b) => b.id.toLowerCase().includes(q) || (b.courtyardName || "").toLowerCase().includes(q) || (b.courtyardId || "").toLowerCase().includes(q))
    }
    return list
  }, [bookings, filterTab, searchQuery])

  const pagination = usePagination(filtered, 10)
  const stats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter((b) => !b.verified).length,
    verified: bookings.filter((b) => b.verified).length,
  }), [bookings])

  if (loading) {
    return (
      <PageLayout title="预约管理" description="院落预约核销与查询">
        <div className="space-y-3 p-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="预约管理" description="院落预约核销与查询">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">总预约</div><div className="text-2xl font-semibold mt-1">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">待核销</div><div className="text-2xl font-semibold mt-1 text-amber-600">{stats.pending}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">已核销</div><div className="text-2xl font-semibold mt-1 text-emerald-600">{stats.verified}</div></CardContent></Card>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索订单号、院落..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "verified"] as const).map((t) => (
            <button key={t} onClick={() => setFilterTab(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterTab === t ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"}`}>
              {t === "all" ? "全部" : t === "pending" ? "待核销" : "已核销"}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单号</TableHead>
              <TableHead>院落</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>预约日期</TableHead>
              <TableHead>人数</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedItems.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">暂无预约数据</TableCell></TableRow>
            )}
            {pagination.paginatedItems.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs">{b.id.slice(0, 16)}...</TableCell>
                <TableCell>{b.courtyardName || b.courtyardId || "-"}</TableCell>
                <TableCell>{b.userId}</TableCell>
                <TableCell className="text-xs">{b.visitDate || b.createdAt}</TableCell>
                <TableCell>{b.visitors || 1}</TableCell>
                <TableCell><Badge variant={b.verified ? "default" : "secondary"}>{b.verified ? "已核销" : "待核销"}</Badge></TableCell>
                <TableCell className="text-right">
                  {!b.verified && (
                    <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-200"
                      onClick={async () => {
                        try {
                          await api.post("bookings", `/${b.id}/check`, { code: "manual" })
                          const res: any = await api.list("bookings", { pageSize: 200 })
                          setBookings(res.items || [])
                          toast.success("已核销")
                        } catch { toast.error("核销失败") }
                      }}>
                      <CheckCircle className="size-3 mr-1" /> 核销
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-3 border-t pt-3">
          <PaginationBar page={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} pageSize={10} onPageSizeChange={() => {}} total={pagination.total} />
        </div>
      </Card>
    </PageLayout>
  )
}