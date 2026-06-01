import { useMemo, useState } from "react"
import { Card, CardContent } from "../../../shared/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../shared/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { Button } from "../../../shared/components/ui/button"
import { Badge } from "../../../shared/components/ui/badge"
import { Input } from "../../../shared/components/ui/input"
import { PageLayout } from "../../components/common/PageLayout"
import { StatusBadge } from "@/shared/components/ui/status-badge"
import { useConvenienceStore, useStaffStore, useZoneStore } from "../../../shared/mock"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../../../shared/components/ui/dialog"
import {
  AlertTriangle, CheckCircle2, Clock, Users, Truck, Package, Trash2,
  Droplets, Shirt, RefreshCw, Play, XCircle, Search,
} from "lucide-react"
import { toast } from "sonner"
import type { DispatchLogEntry, StaffItem, ConvenienceServiceType } from "../../../shared/types"
import { ALL_CONVENIENCE_TYPES, isPointToPoint } from "../../../shared/types"

const SERVICE_ICONS: Record<string, any> = {
  "送货服务": Package,
  "行李搬运": Truck,
  "建筑垃圾清运": Trash2,
  "生活垃圾清运": Trash2,
  "送水服务": Droplets,
  "布草配送": Shirt,
}

export default function ConveniencePage() {
  const orders = useConvenienceStore((s) => s.orders)
  const staffList = useStaffStore((s) => s.staff)
  const dispatchLog = useConvenienceStore((s) => s.dispatchLog)
  const zones = useZoneStore((s) => s.zones)
  const autoDispatchOrder = useConvenienceStore((s) => s.autoDispatchOrder)
  const manualDispatch = useConvenienceStore((s) => s.manualDispatch)

  const [activeTab, setActiveTab] = useState("overview")
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [manualTarget, setManualTarget] = useState<string | null>(null)
  const [dispatchSearch, setDispatchSearch] = useState("")
  const [staffSearch, setStaffSearch] = useState("")

  // ---- stats ----
  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.status === "S10" || o.status === "A10").length
    const inProgress = orders.filter((o) => ["A20", "A30", "A35", "A38", "A40", "S48", "S55"].includes(o.status)).length
    const completed = orders.filter((o) => o.status === "S40").length
    const manualIntervention = orders.filter((o) => o.status === "S90").length
    return { total, pending, inProgress, completed, manualIntervention }
  }, [orders])

  // ---- service type breakdown ----
  const serviceBreakdown = useMemo(() => {
    return ALL_CONVENIENCE_TYPES.map((type) => {
      const typeOrders = orders.filter((o) => o.serviceType === type)
      const onlineStaff = staffList.filter(
        (s) => s.enabled && s.status === "online" && s.serviceTypes?.includes(type)
      )
      return {
        type,
        total: typeOrders.length,
        pending: typeOrders.filter((o) => o.status === "S10" || o.status === "A10").length,
        inProgress: typeOrders.filter((o) => ["A20", "A30", "A35", "A38", "A40", "S48", "S55"].includes(o.status)).length,
        completed: typeOrders.filter((o) => o.status === "S40").length,
        onlineStaff: onlineStaff.length,
        totalStaff: staffList.filter((s) => s.serviceTypes?.includes(type)).length,
        dispatchMode: isPointToPoint(type) ? "点对点" : "片区式",
      }
    })
  }, [orders, staffList])

  // ---- orders pending manual dispatch ----
  const manualPendingOrders = useMemo(
    () => orders.filter((o) => o.status === "S10" || o.status === "A10" || o.status === "S90"),
    [orders]
  )

  const handleManualDispatch = (orderId: string) => {
    setManualTarget(orderId)
    setManualDialogOpen(true)
  }

  const confirmManualDispatch = (staffId: string) => {
    if (!manualTarget) return
    manualDispatch(manualTarget, staffId)
    toast.success("已手动派单")
    setManualDialogOpen(false)
    setManualTarget(null)
  }

  const handleAutoRetry = (orderId: string) => {
    autoDispatchOrder(orderId)
    toast.success("已重新尝试自动派单")
  }

  // ---- zone-based dispatch candidates for manual dialog ----
  const manualCandidates = useMemo(() => {
    if (!manualTarget) return []
    const order = orders.find((o) => o.id === manualTarget)
    if (!order) return []
    return staffList.filter(
      (s) =>
        s.enabled &&
        s.status === "online" &&
        s.serviceTypes?.includes(order.serviceType as ConvenienceServiceType)
    )
  }, [manualTarget, orders, staffList])

  // ---- dispatch search ----
  const filteredManualPending = useMemo(() => {
    if (!dispatchSearch.trim()) return manualPendingOrders
    const q = dispatchSearch.trim().toLowerCase()
    return manualPendingOrders.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      (o.serviceType as string).toLowerCase().includes(q) ||
      (o.address || "").toLowerCase().includes(q)
    )
  }, [manualPendingOrders, dispatchSearch])

  // ---- pagination ----
  const dispatchLogPagination = usePagination(dispatchLog, 10)
  const pendingPagination = usePagination(filteredManualPending, 10)

  // ---- manual dialog staff search ----
  const filteredCandidates = useMemo(() => {
    if (!staffSearch.trim()) return manualCandidates
    const q = staffSearch.trim().toLowerCase()
    return manualCandidates.filter((s) =>
      s.name.toLowerCase().includes(q) || s.phone.includes(q)
    )
  }, [manualCandidates, staffSearch])

  // ---- render convenience staff tab ----
  const convenienceStaff = useMemo(
    () => staffList.filter((s) => s.serviceTypes && s.serviceTypes.length > 0),
    [staffList]
  )

  return (
    <PageLayout title="便民服务管理" description="服务运营监控 · 自动派单 · 片区管理 · 服务人员">

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">服务概览</TabsTrigger>
          <TabsTrigger value="dispatch">
            派单管理
            {stats.pending + stats.manualIntervention > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">{stats.pending + stats.manualIntervention}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="zones">片区管理</TabsTrigger>
          <TabsTrigger value="staff">服务人员</TabsTrigger>
        </TabsList>

        {/* ===================== TAB: 服务概览 ===================== */}
        <TabsContent value="overview" className="space-y-6">
          {/* 顶部统计 */}
          <div className="grid grid-cols-5 gap-4">
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-xs text-muted-foreground mt-1">待派单</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-xs text-muted-foreground mt-1">进行中</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
              <div className="text-xs text-muted-foreground mt-1">今日完成</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-rose-600">{stats.manualIntervention}</div>
              <div className="text-xs text-muted-foreground mt-1">人工干预</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-700">{stats.total}</div>
              <div className="text-xs text-muted-foreground mt-1">总订单</div>
            </CardContent></Card>
          </div>

          {/* 服务类型矩阵 */}
          <div className="grid grid-cols-3 gap-4">
            {serviceBreakdown.map((svc) => {
              const Icon = SERVICE_ICONS[svc.type] || Package
              return (
                <Card key={svc.type}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="size-5 text-primary" />
                        <span className="font-medium text-sm">{svc.type}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {svc.dispatchMode}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div>
                        <div className="font-semibold text-amber-600">{svc.pending}</div>
                        <div className="text-muted-foreground">待派</div>
                      </div>
                      <div>
                        <div className="font-semibold text-blue-600">{svc.inProgress}</div>
                        <div className="text-muted-foreground">进行中</div>
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-600">{svc.completed}</div>
                        <div className="text-muted-foreground">已完成</div>
                      </div>
                      <div>
                        <div className="font-semibold">{svc.onlineStaff}/{svc.totalStaff}</div>
                        <div className="text-muted-foreground">在线</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ===================== TAB: 派单管理 ===================== */}
        <TabsContent value="dispatch" className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索订单号、服务类型、地址..."
              value={dispatchSearch}
              onChange={(e) => setDispatchSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* 派单流水 */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <RefreshCw className="size-4" /> 派单流水
            </h3>
            {dispatchLog.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">暂无派单记录</div>
            ) : (
              <>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {dispatchLogPagination.paginatedItems.map((log, i) => (
                    <div key={`${dispatchLogPagination.currentPage}-${i}`} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-slate-50">
                      {log.type === "auto_success" ? (
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      ) : log.type === "retry" ? (
                        <Clock className="size-3.5 text-amber-500 shrink-0" />
                      ) : log.type === "manual" ? (
                        <Play className="size-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="size-3.5 text-rose-500 shrink-0" />
                      )}
                      <span className="text-muted-foreground font-mono">{log.orderId}</span>
                      {log.staffName && <span>→ {log.staffName}</span>}
                      {log.reason && <span className="text-muted-foreground">({log.reason})</span>}
                      <span className="ml-auto text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t pt-3">
                  <PaginationBar
                    page={dispatchLogPagination.currentPage}
                    totalPages={dispatchLogPagination.totalPages}
                    onPageChange={dispatchLogPagination.setCurrentPage}
                    pageSize={10}
                    onPageSizeChange={() => {}}
                    total={dispatchLogPagination.total}
                  />
                </div>
              </>
            )}
          </Card>

          {/* 待人工处理 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" /> 待人工处理
              </h3>
              <span className="text-xs text-muted-foreground">{filteredManualPending.length} 单</span>
            </div>
            {filteredManualPending.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" /> {dispatchSearch.trim() ? "无匹配订单" : "所有订单均正常流转"}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单号</TableHead>
                      <TableHead>服务类型</TableHead>
                      <TableHead>地址</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPagination.paginatedItems.map((o) => {
                      const isS90 = o.status === "S90"
                      return (
                        <TableRow key={o.id} className={isS90 ? "bg-rose-50/50" : "bg-amber-50/50"}>
                          <TableCell className="font-mono text-xs">{o.id}</TableCell>
                          <TableCell>{o.serviceType}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{o.address}</TableCell>
                          <TableCell>
                            <StatusBadge status={o.status} kind="order" />
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button size="sm" variant="outline" onClick={() => handleManualDispatch(o.id)}>
                              手动派单
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleAutoRetry(o.id)}>
                              <RefreshCw className="size-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <div className="mt-3 border-t pt-3">
                  <PaginationBar
                    page={pendingPagination.currentPage}
                    totalPages={pendingPagination.totalPages}
                    onPageChange={pendingPagination.setCurrentPage}
                    pageSize={10}
                    onPageSizeChange={() => {}}
                    total={pendingPagination.total}
                  />
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        {/* ===================== TAB: 片区管理 ===================== */}
        <TabsContent value="zones" className="space-y-4">
          {zones.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">暂无片区配置</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {zones.map((zone) => (
                <Card key={zone.id}>
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-semibold">{zone.name}</h3>
                    <div className="space-y-2">
                      {zone.stations.map((st) => {
                        const Icon = SERVICE_ICONS[st.serviceType] || Package
                        return (
                          <div key={st.id} className="flex items-center gap-3 p-2 rounded bg-slate-50">
                            <Icon className="size-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm">{st.name}</div>
                              <div className="text-[11px] text-muted-foreground">{st.address}</div>
                            </div>
                            <Badge variant="outline" className="text-[10px]">{st.serviceType}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===================== TAB: 服务人员 ===================== */}
        <TabsContent value="staff">
          <Card className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>服务类型</TableHead>
                  <TableHead>所属片区</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-center">今日接单</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {convenienceStaff.map((s) => {
                  const staffZones = s.zoneIds
                    ? s.zoneIds.map((zid) => zones.find((z) => z.id === zid)?.name).filter(Boolean)
                    : []
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.phone}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {s.serviceTypes?.map((st) => (
                            <Badge key={st} variant="outline" className="text-[10px]">{st}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {staffZones.length > 0 ? staffZones.join("、") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          s.status === "online" ? "bg-emerald-100 text-emerald-700" :
                          s.status === "busy" ? "bg-amber-100 text-amber-700" :
                          s.status === "rest" ? "bg-slate-100 text-slate-700" :
                          "bg-rose-100 text-rose-700"
                        }>
                          {s.status === "online" ? "在线" : s.status === "busy" ? "忙碌" : s.status === "rest" ? "休息" : "离线"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{s.assignedOrders}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Manual dispatch dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>手动派单</DialogTitle>
            <DialogDescription>选择服务人员进行手工派单</DialogDescription>
          </DialogHeader>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索姓名或手机号..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredCandidates.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                {staffSearch.trim() ? "无匹配的服务人员" : "无可用服务人员"}
              </div>
            ) : (
              filteredCandidates.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors text-left"
                  onClick={() => { confirmManualDispatch(s.id); setStaffSearch("") }}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 grid place-items-center text-blue-700 text-xs font-medium">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.phone} · 今日接单 {s.assignedOrders}</div>
                    </div>
                  </div>
                  <Badge className={s.status === "online" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                    {s.status === "online" ? "在线" : "忙碌"}
                  </Badge>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setManualDialogOpen(false); setStaffSearch("") }}>取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
