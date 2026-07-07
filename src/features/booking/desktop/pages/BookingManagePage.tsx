import { useState, useEffect } from "react"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { api } from "@/api/client"
import { CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function BookingManagePage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.list("bookings", { pageSize: 200 }).then((res: any) => {
      setBookings(res.items || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <PageLayout title="预约管理" description="院落预约核销与查询">
        <div className="text-center text-muted-foreground py-8">加载中...</div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="预约管理" description="院落预约核销与查询">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">总预约</div>
            <div className="text-2xl font-semibold mt-1">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">待核销</div>
            <div className="text-2xl font-semibold mt-1 text-amber-600">
              {bookings.filter((b) => !b.verified).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">已核销</div>
            <div className="text-2xl font-semibold mt-1 text-emerald-600">
              {bookings.filter((b) => b.verified).length}
            </div>
          </CardContent>
        </Card>
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
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">暂无预约数据</TableCell>
              </TableRow>
            )}
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs">{b.id.slice(0, 16)}...</TableCell>
                <TableCell>{b.courtyardName || b.courtyardId || "-"}</TableCell>
                <TableCell>{b.userId}</TableCell>
                <TableCell className="text-xs">{b.visitDate || b.createdAt}</TableCell>
                <TableCell>{b.visitors || 1}</TableCell>
                <TableCell>
                  <Badge variant={b.verified ? "default" : "secondary"}>
                    {b.verified ? "已核销" : "待核销"}
                  </Badge>
                </TableCell>
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
      </Card>
    </PageLayout>
  )
}