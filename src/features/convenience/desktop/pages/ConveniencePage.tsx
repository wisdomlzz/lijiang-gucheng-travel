import { useMemo, useState } from "react"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "../../../../shared/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Button } from "../../../../shared/components/ui/button"
import { Badge } from "../../../../shared/components/ui/badge"
import { Input } from "../../../../shared/components/ui/input"
import { Textarea } from "../../../../shared/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../../shared/components/ui/dialog"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { StatusBadge } from "@/shared/components/ui/status-badge"
import { useConvenienceStore, useStaffStore } from "../../store"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  XCircle,
  Eye,
  Ban,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { ConvenienceServiceType, ConvenienceOrder } from "../../../../shared/types"

// ====== Tab label config ======
type TabKey = "all" | "pending-review" | "cancel-approval" | "price-review" | "payment-proof"
const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "全部订单" },
  { key: "pending-review", label: "待审核" },
  { key: "cancel-approval", label: "取消审批" },
  { key: "price-review", label: "报价审核" },
  { key: "payment-proof", label: "付款凭证" },
]

export default function ConveniencePage() {
  const orders = useConvenienceStore((s) => s.orders)
  const staffList = useStaffStore((s) => s.staff)
  const dispatchLog = useConvenienceStore((s) => s.dispatchLog)
  const autoDispatchOrder = useConvenienceStore((s) => s.autoDispatchOrder)
  const manualDispatch = useConvenienceStore((s) => s.manualDispatch)
  const approveCancelRequest = useConvenienceStore((s) => s.approveCancelRequest)
  const rejectCancelRequest = useConvenienceStore((s) => s.rejectCancelRequest)

  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Manual dispatch
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [manualTarget, setManualTarget] = useState<string | null>(null)
  const [staffSearch, setStaffSearch] = useState("")

  // Cancel approve/reject reason dialog
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null)

  // ---- Derived data ----
  const allOrders = orders
  const pendingReviewOrders = useMemo(() => orders.filter((o) => o.status === "S90" || o.status === "S10" || o.status === "A10"), [orders])
  const cancelRequestOrders = useMemo(() => orders.filter((o) => o.cancelRequested), [orders])
  const priceReviewOrders = useMemo(() => orders.filter((o) => o.status === "A35" && !o.cancelRequested), [orders])
  const paymentProofOrders = useMemo(() => orders.filter((o) => o.paymentProof && o.status !== "S40" && o.status !== "S50"), [orders])

  const getActiveOrders = (): ConvenienceOrder[] => {
    switch (activeTab) {
      case "pending-review": return pendingReviewOrders
      case "cancel-approval": return cancelRequestOrders
      case "price-review": return priceReviewOrders
      case "payment-proof": return paymentProofOrders
      default: return allOrders
    }
  }

  const filteredOrders = useMemo(() => {
    let list = getActiveOrders()
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.serviceType as string).toLowerCase().includes(q) ||
          (o.address || "").toLowerCase().includes(q) ||
          (o.staffName || "").toLowerCase().includes(q)
      )
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, searchQuery, activeTab])

  const pagination = usePagination(filteredOrders, 10)

  // ---- Handlers ----
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
    setStaffSearch("")
  }

  const handleAutoRetry = (orderId: string) => {
    autoDispatchOrder(orderId)
    toast.success("已重新尝试自动派单")
  }

  const handleApproveCancel = (orderId: string) => {
    approveCancelRequest(orderId)
    toast.success("已同意取消")
  }

  const handleRejectCancel = () => {
    if (!rejectDialogId) return
    rejectCancelRequest(rejectDialogId)
    toast.success(rejectReason ? `已拒绝取消（原因：${rejectReason}）` : "已拒绝取消")
    setRejectDialogId(null)
    setRejectReason("")
  }

  const handleApprovePrice = (orderId: string) => {
    toast.success("报价已通过")
  }

  const handleRejectPrice = (orderId: string) => {
    toast.success("报价已驳回")
  }

  const handleApprovePayment = (orderId: string) => {
    toast.success("付款凭证已确认")
  }

  const handleRejectPayment = (orderId: string) => {
    toast.success("付款凭证已驳回")
  }

  // Manual dispatch candidates
  const manualCandidates = useMemo(() => {
    if (!manualTarget) return []
    const order = orders.find((o) => o.id === manualTarget)
    if (!order) return []
    return staffList.filter(
      (s) => s.enabled && s.status === "online" && s.serviceTypes?.includes(order.serviceType as ConvenienceServiceType)
    )
  }, [manualTarget, orders, staffList])

  const filteredCandidates = useMemo(() => {
    if (!staffSearch.trim()) return manualCandidates
    const q = staffSearch.trim().toLowerCase()
    return manualCandidates.filter((s) => s.name.toLowerCase().includes(q) || s.phone.includes(q))
  }, [manualCandidates, staffSearch])

  // ---- Filter chips per tab ----
  const TabFilters = () => (
    <div className="relative w-56">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        placeholder="搜索订单号、地址、人员..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9 h-9 text-sm"
      />
    </div>
  )

  // ---- Count badges for tabs ----
  const tabBadge = (key: TabKey): number | undefined => {
    switch (key) {
      case "pending-review": return pendingReviewOrders.length || undefined
      case "cancel-approval": return cancelRequestOrders.length || undefined
      case "price-review": return priceReviewOrders.length || undefined
      case "payment-proof": return paymentProofOrders.length || undefined
      default: return undefined
    }
  }

  const detailOrder = detailOrderId ? orders.find((o) => o.id === detailOrderId) : null

  return (
    <PageLayout title="订单管理" description="便民服务订单全生命周期管理">
      {/* Tab 导航 + 筛选 */}
      <div className="flex items-center justify-between mb-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="relative">
                {tab.label}
                {tabBadge(tab.key) && (
                  <Badge className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0">
                    {tabBadge(tab.key)}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <TabFilters />
      </div>

      {/* ===== Tab 1: 全部订单 ===== */}
      {activeTab === "all" && (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>服务人员</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{o.address}</TableCell>
                  <TableCell><StatusBadge status={o.status} kind="order" /></TableCell>
                  <TableCell>{o.staffName || "-"}</TableCell>
                  <TableCell>{o.priceQuote ? `¥${o.priceQuote}` : "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{o.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDetailOrderId(o.id)} title="详情">
                        <Eye className="size-3.5" />
                      </Button>
                      {(o.status === "S10" || o.status === "A10" || o.status === "S90") && (
                        <>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleManualDispatch(o.id)}>
                            派单
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleAutoRetry(o.id)} title="重试">
                            <RefreshCw className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {searchQuery.trim() ? "无匹配订单" : "暂无订单"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-3 border-t pt-3">
            <PaginationBar
              page={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
              pageSize={10}
              onPageSizeChange={() => {}}
              total={pagination.total}
            />
          </div>
        </Card>
      )}

      {/* ===== Tab 2: 待审核 ===== */}
      {activeTab === "pending-review" && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="size-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">以下订单需要管理员审核处理</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>当前状态</TableHead>
                <TableHead>原因</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{o.address}</TableCell>
                  <TableCell><StatusBadge status={o.status} kind="order" /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {o.status === "S90" ? "需人工干预" : o.status === "S10" ? "待派单" : "待处理"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-200"
                        onClick={() => { handleAutoRetry(o.id); toast.success("审核通过，已重新派单") }}>
                        <CheckCircle2 className="size-3 mr-1" /> 通过
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 border-red-200"
                        onClick={() => toast.success("已驳回该订单")}>
                        <XCircle className="size-3 mr-1" /> 驳回
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <CheckCircle2 className="size-5 text-emerald-500 inline mr-1" /> 暂无待审核订单
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-3 border-t pt-3">
            <PaginationBar
              page={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
              pageSize={10}
              onPageSizeChange={() => {}}
              total={pagination.total}
            />
          </div>
        </Card>
      )}

      {/* ===== Tab 3: 取消审批 ===== */}
      {activeTab === "cancel-approval" && (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>当前状态</TableHead>
                <TableHead>服务人员</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{o.address}</TableCell>
                  <TableCell><StatusBadge status={o.status} kind="order" /></TableCell>
                  <TableCell>{o.staffName || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-200"
                        onClick={() => handleApproveCancel(o.id)}>
                        <CheckCircle2 className="size-3 mr-1" /> 同意
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 border-red-200"
                        onClick={() => { setRejectDialogId(o.id); setRejectReason("") }}>
                        <XCircle className="size-3 mr-1" /> 拒绝
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <CheckCircle2 className="size-5 text-emerald-500 inline mr-1" /> 暂无取消申请
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-3 border-t pt-3">
            <PaginationBar
              page={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
              pageSize={10}
              onPageSizeChange={() => {}}
              total={pagination.total}
            />
          </div>
        </Card>
      )}

      {/* ===== Tab 4: 报价审核 ===== */}
      {activeTab === "price-review" && (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>服务人员</TableHead>
                <TableHead>报价</TableHead>
                <TableHead>参考价</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{o.address}</TableCell>
                  <TableCell>{o.staffName || "-"}</TableCell>
                  <TableCell className="font-medium">
                    <span className="text-blue-600">¥{o.priceQuote ?? "-"}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.refPrice ? `¥${o.refPrice}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-200"
                        onClick={() => handleApprovePrice(o.id)}>
                        <CheckCircle2 className="size-3 mr-1" /> 通过
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 border-red-200"
                        onClick={() => handleRejectPrice(o.id)}>
                        <Ban className="size-3 mr-1" /> 驳回
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <CheckCircle2 className="size-5 text-emerald-500 inline mr-1" /> 暂无待审核报价
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-3 border-t pt-3">
            <PaginationBar
              page={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
              pageSize={10}
              onPageSizeChange={() => {}}
              total={pagination.total}
            />
          </div>
        </Card>
      )}

      {/* ===== Tab 5: 付款凭证 ===== */}
      {activeTab === "payment-proof" && (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>服务人员</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>凭证</TableHead>
                <TableHead>上传时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{o.address}</TableCell>
                  <TableCell>{o.staffName || "-"}</TableCell>
                  <TableCell className="font-medium">¥{o.priceQuote ?? "-"}</TableCell>
                  <TableCell>
                    {o.paymentProof ? (
                      <a href={o.paymentProof} target="_blank" rel="noopener noreferrer">
                        <ImageIcon className="size-5 text-blue-500 cursor-pointer hover:text-blue-700" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{o.completedAt || o.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-200"
                        onClick={() => handleApprovePayment(o.id)}>
                        <CheckCircle2 className="size-3 mr-1" /> 确认
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 border-red-200"
                        onClick={() => handleRejectPayment(o.id)}>
                        <XCircle className="size-3 mr-1" /> 驳回
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    <CheckCircle2 className="size-5 text-emerald-500 inline mr-1" /> 暂无待审核付款凭证
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-3 border-t pt-3">
            <PaginationBar
              page={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
              pageSize={10}
              onPageSizeChange={() => {}}
              total={pagination.total}
            />
          </div>
        </Card>
      )}

      {/* 手动派单弹窗 */}
      <Dialog open={manualDialogOpen} onOpenChange={(open) => { setManualDialogOpen(open); if (!open) setStaffSearch("") }}>
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
                  onClick={() => confirmManualDispatch(s.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 grid place-items-center text-blue-700 text-xs font-medium">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.phone} · 今日接单 {s.assignedOrders}
                      </div>
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
            <Button variant="outline" onClick={() => setManualDialogOpen(false)}>取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝取消弹窗 */}
      <Dialog open={rejectDialogId !== null} onOpenChange={(open) => !open && setRejectDialogId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>拒绝取消</DialogTitle>
            <DialogDescription>请输入拒绝取消的原因</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="请输入拒绝原因..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleRejectCancel}>确认拒绝</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 订单详情弹窗 */}
      <Dialog open={detailOrderId !== null} onOpenChange={(open) => !open && setDetailOrderId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><span className="text-muted-foreground">订单号：</span><span className="font-mono">{detailOrder.id}</span></div>
                <div><span className="text-muted-foreground">服务类型：</span><span>{detailOrder.serviceType}</span></div>
                <div><span className="text-muted-foreground">地址：</span><span>{detailOrder.address}</span></div>
                <div><span className="text-muted-foreground">状态：</span><StatusBadge status={detailOrder.status} kind="order" /></div>
                <div><span className="text-muted-foreground">服务人员：</span><span>{detailOrder.staffName || "未指派"}</span></div>
                <div><span className="text-muted-foreground">金额：</span><span>{detailOrder.priceQuote ? `¥${detailOrder.priceQuote}` : "未报价"}</span></div>
                <div><span className="text-muted-foreground">下单时间：</span><span>{detailOrder.createdAt}</span></div>
                <div><span className="text-muted-foreground">支付方式：</span><span>{detailOrder.payMethod === "online" ? "线上支付" : detailOrder.payMethod === "cash" ? "现金" : "未支付"}</span></div>
              </div>
              {detailOrder.note && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">备注：</div>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">{detailOrder.note}</div>
                </div>
              )}
              {detailOrder.completionPhotos && detailOrder.completionPhotos.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">完工照片：</div>
                  <div className="flex gap-2">
                    {detailOrder.completionPhotos.map((url, i) => (
                      <img key={i} src={url} alt={`完工照${i + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                    ))}
                  </div>
                </div>
              )}
              {detailOrder.paymentProof && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">付款凭证：</div>
                  <a href={detailOrder.paymentProof} target="_blank" rel="noopener noreferrer">
                    <img src={detailOrder.paymentProof} alt="付款凭证" className="w-40 h-auto rounded-lg border" />
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}