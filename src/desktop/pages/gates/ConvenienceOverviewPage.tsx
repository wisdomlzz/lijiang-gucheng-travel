import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/components/ui/card"
import { PageLayout } from "../../components/common/PageLayout"
import { useConvenienceStore, useStaffStore, useZoneStore } from "../../../shared/mock"
import { CheckCircle2, Clock, Users, Map, AlertTriangle } from "lucide-react"

export default function ConvenienceOverviewPage() {
  const orders = useConvenienceStore((s) => s.orders)
  const staff = useStaffStore((s) => s.staff)
  const zones = useZoneStore((s) => s.zones)

  const stats = useMemo(() => {
    const totalOrders = orders.length
    const completed = orders.filter((o) => o.status === "S40").length
    const pending = orders.filter((o) => o.status === "S10" || o.status === "A10" || o.status === "S90").length
    const inService = orders.filter((o) => o.status === "S48" || o.status === "S55").length
    const priceDisputes = orders.filter((o) => o.status === "A38").length
    const onlineStaff = staff.filter((s) => s.status === "online").length
    const busyStaff = staff.filter((s) => s.status === "busy").length
    const completionRate = totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 0
    return { totalOrders, completed, pending, inService, priceDisputes, onlineStaff, busyStaff, completionRate, totalZones: zones.length }
  }, [orders, staff, zones])

  return (
    <PageLayout title="服务概览" description="便民服务整体运营数据">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">总订单量</span><Clock className="size-4 text-muted-foreground" /></div>
          <div className="text-2xl font-semibold mt-1">{stats.totalOrders}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">已完成</span><CheckCircle2 className="size-4 text-emerald-500" /></div>
          <div className="text-2xl font-semibold mt-1">{stats.completed}</div>
          <div className="text-xs text-muted-foreground mt-1">完成率 {stats.completionRate}%</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">待处理</span><AlertTriangle className="size-4 text-amber-500" /></div>
          <div className="text-2xl font-semibold mt-1">{stats.pending}</div>
          <div className="text-xs text-muted-foreground mt-1">已下单 + 待派单 + 待人工处理</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">服务中</span><Clock className="size-4 text-blue-500" /></div>
          <div className="text-2xl font-semibold mt-1">{stats.inService}</div>
        </CardContent></Card>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">服务人员</CardTitle></CardHeader><CardContent>
          <div className="text-3xl font-semibold">{stats.onlineStaff + stats.busyStaff}</div>
          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" />在线 {stats.onlineStaff}</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" />忙碌 {stats.busyStaff}</span>
          </div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">片区</CardTitle></CardHeader><CardContent>
          <div className="flex items-center gap-2">
            <Map className="size-5 text-muted-foreground" />
            <span className="text-3xl font-semibold">{stats.totalZones}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">个服务片区</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">价格仲裁</CardTitle></CardHeader><CardContent>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-rose-500" />
            <span className="text-3xl font-semibold">{stats.priceDisputes}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">笔待处理价格争议</div>
        </CardContent></Card>
      </div>
    </PageLayout>
  )
}
