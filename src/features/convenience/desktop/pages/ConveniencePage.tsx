import { useMemo, useState } from "react"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { useConvenienceStore, useStaffStore } from "../../store"
import { usePagination } from "@/shared/hooks/usePagination"
import { toast } from "sonner"
import type { ConvenienceServiceType, ConvenienceOrder } from "../../../../shared/types"
import { TabNavigation } from "./orders/TabNavigation"
import { OrderTableTab } from "./orders/OrderTableTab"
import { OrderDialogs } from "./orders/OrderDialogs"
import { type TabKey } from "./orders/tab-config"

export default function ConveniencePage() {
  // ---- Store selectors ----
  const orders = useConvenienceStore((s) => s.orders)
  const staffList = useStaffStore((s) => s.staff)
  const dispatchLog = useConvenienceStore((s) => s.dispatchLog)
  const autoDispatchOrder = useConvenienceStore((s) => s.autoDispatchOrder)
  const manualDispatch = useConvenienceStore((s) => s.manualDispatch)
  const approveCancelRequest = useConvenienceStore((s) => s.approveCancelRequest)
  const rejectCancelRequest = useConvenienceStore((s) => s.rejectCancelRequest)
  const approvePriceQuote = useConvenienceStore((s) => s.approvePriceQuote)
  const rejectPriceQuote = useConvenienceStore((s) => s.rejectPriceQuote)
  const confirmPaymentProof = useConvenienceStore((s) => s.confirmPaymentProof)
  const rejectPaymentProof = useConvenienceStore((s) => s.rejectPaymentProof)
  const reDispatch = useConvenienceStore((s) => s.reDispatch)
  const forceCancel = useConvenienceStore((s) => s.forceCancel)
  const forceCancelWithReason = useConvenienceStore((s) => s.forceCancelWithReason)
  const restoreQuote = useConvenienceStore((s) => s.restoreQuote)

  // ---- State declarations ----
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

  // Force cancel dialog
  const [forceCancelTarget, setForceCancelTarget] = useState<string | null>(null)
  const [forceCancelReason, setForceCancelReason] = useState("")

  // ---- Derived data ----
  const allOrders = orders
  const pendingReviewOrders = useMemo(
    () => orders.filter((o) => o.status === "S90" || o.status === "S10" || o.status === "A10"),
    [orders],
  )
  const manualOrders = useMemo(() => orders.filter((o) => o.status === "S90"), [orders])
  const cancelRequestOrders = useMemo(() => orders.filter((o) => o.cancelRequested), [orders])
  const priceReviewOrders = useMemo(
    () => orders.filter((o) => o.status === "A35" && !o.cancelRequested),
    [orders],
  )
  const paymentProofOrders = useMemo(
    () => orders.filter((o) => o.paymentProof && o.status !== "S40" && o.status !== "S50"),
    [orders],
  )

  const getActiveOrders = (): ConvenienceOrder[] => {
    switch (activeTab) {
      case "pending-review":
        return pendingReviewOrders
      case "manual":
        return manualOrders
      case "cancel-approval":
        return cancelRequestOrders
      case "price-review":
        return priceReviewOrders
      case "payment-proof":
        return paymentProofOrders
      default:
        return allOrders
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
          (o.staffName || "").toLowerCase().includes(q),
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
    approvePriceQuote(orderId)
    toast.success("报价已通过，订单继续流转")
  }

  const handleRejectPrice = (orderId: string) => {
    rejectPriceQuote(orderId)
    toast.success("报价已驳回，将重新报价")
  }

  const handleApprovePayment = (orderId: string) => {
    confirmPaymentProof(orderId)
    toast.success("付款凭证已确认，订单已完成")
  }

  const handleRejectPayment = (orderId: string) => {
    rejectPaymentProof(orderId)
    toast.success("付款凭证已驳回，请重新上传")
  }

  const handleResolvePendingReview = (orderId: string, status: string) => {
    if (status === "S90") {
      reDispatch(orderId)
      toast.success("已重新派单")
    } else {
      autoDispatchOrder(orderId)
      toast.success("审核通过，已重新派单")
    }
  }

  const handleOpenForceCancelDialog = (orderId: string) => {
    setForceCancelTarget(orderId)
    setForceCancelReason("")
  }

  const handleForceCancelDirect = (orderId: string) => {
    forceCancel(orderId)
    toast.success("已驳回该订单")
  }

  const handleForceCancelWithReason = () => {
    if (!forceCancelTarget) return
    if (!forceCancelReason.trim()) {
      toast.error("请输入取消理由")
      return
    }
    forceCancelWithReason(forceCancelTarget, forceCancelReason)
    setForceCancelTarget(null)
    setForceCancelReason("")
    toast.success("已强制取消")
  }

  const handleRestoreQuote = (orderId: string) => {
    restoreQuote(orderId)
    toast.success("已恢复报价状态")
  }

  // ---- Manual dispatch candidates ----
  const manualCandidates = useMemo(() => {
    if (!manualTarget) return []
    const order = orders.find((o) => o.id === manualTarget)
    if (!order) return []
    return staffList.filter(
      (s) =>
        s.enabled &&
        s.status === "online" &&
        s.serviceTypes?.includes(order.serviceType as ConvenienceServiceType),
    )
  }, [manualTarget, orders, staffList])

  const filteredCandidates = useMemo(() => {
    if (!staffSearch.trim()) return manualCandidates
    const q = staffSearch.trim().toLowerCase()
    return manualCandidates.filter(
      (s) => s.name.toLowerCase().includes(q) || s.phone.includes(q),
    )
  }, [manualCandidates, staffSearch])

  // ---- Count badges for tabs ----
  const tabBadge = (key: TabKey): number | undefined => {
    switch (key) {
      case "pending-review":
        return pendingReviewOrders.length || undefined
      case "manual":
        return manualOrders.length || undefined
      case "cancel-approval":
        return cancelRequestOrders.length || undefined
      case "price-review":
        return priceReviewOrders.length || undefined
      case "payment-proof":
        return paymentProofOrders.length || undefined
      default:
        return undefined
    }
  }

  const detailOrder = detailOrderId ? orders.find((o) => o.id === detailOrderId) : null

  return (
    <PageLayout title="订单管理" description="便民服务订单全生命周期管理">
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        tabBadge={tabBadge}
      />
      <OrderTableTab
        activeTab={activeTab}
        paginatedItems={pagination.paginatedItems}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setCurrentPage}
        total={pagination.total}
        filteredOrders={filteredOrders}
        searchQuery={searchQuery}
        onViewDetail={setDetailOrderId}
        onManualDispatch={handleManualDispatch}
        onAutoRetry={handleAutoRetry}
        onForceCancelDialog={handleOpenForceCancelDialog}
        onResolvePendingReview={handleResolvePendingReview}
        onForceCancel={handleForceCancelDirect}
        onApproveCancel={handleApproveCancel}
        onRejectCancelDialog={setRejectDialogId}
        onApprovePrice={handleApprovePrice}
        onRejectPrice={handleRejectPrice}
        onApprovePayment={handleApprovePayment}
        onRejectPayment={handleRejectPayment}
        onRestoreQuote={handleRestoreQuote}
      />
      <OrderDialogs
        manualDialogOpen={manualDialogOpen}
        setManualDialogOpen={setManualDialogOpen}
        staffSearch={staffSearch}
        setStaffSearch={setStaffSearch}
        filteredCandidates={filteredCandidates}
        confirmManualDispatch={confirmManualDispatch}
        rejectDialogId={rejectDialogId}
        setRejectDialogId={setRejectDialogId}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        handleRejectCancel={handleRejectCancel}
        detailOrderId={detailOrderId}
        setDetailOrderId={setDetailOrderId}
        detailOrder={detailOrder}
        forceCancelTarget={forceCancelTarget}
        setForceCancelTarget={setForceCancelTarget}
        forceCancelReason={forceCancelReason}
        setForceCancelReason={setForceCancelReason}
        handleForceCancel={handleForceCancelWithReason}
      />
    </PageLayout>
  )
}