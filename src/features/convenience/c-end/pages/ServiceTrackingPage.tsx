import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { StatusProgress } from "../components/StatusProgress"
import { toast } from "sonner"
import { Phone, Clock, AlertCircle, User, Star } from "lucide-react"
import { useConvenienceStore } from "../../store"
import type { ConvenienceStatus } from "../../../../shared/types"

const STATUS_STEPS: ConvenienceStatus[] = ["S10", "A30", "A35", "A40", "S48", "S55", "S40"]
const STEP_LABELS = ["已下单", "已接单", "已核价", "已收款", "服务中", "待验收", "已完成"]

export function ServiceTrackingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const order = useConvenienceStore((s) => s.orders.find((o) => o.id === id))
  const markPaid = useConvenienceStore((s) => s.markPaid)
  const completeService = useConvenienceStore((s) => s.completeService)
  const requestCancel = useConvenienceStore((s) => s.requestCancel)
  const [countdown, setCountdown] = useState(15 * 60)
  const [showPaymentMethod, setShowPaymentMethod] = useState(false)
  const [showCashConfirm, setShowCashConfirm] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [waitTime, setWaitTime] = useState(0)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)

  const statusSteps = useMemo(() => {
    const stateIdx = STATUS_STEPS.indexOf(order?.status ?? "S10")
    return STEP_LABELS.map((label, idx) => ({
      label,
      completed: order?.status === "S50" || (stateIdx >= 0 && idx < stateIdx),
    }))
  }, [order?.status])

  // Countdown timer
  useEffect(() => {
    if (order?.status === "A35") {
      // 15分钟倒计时
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (order?.status === "S55") {
      // 24小时倒计时（从订单完成时间计算）
      const completedAt = order.completedAt ? new Date(order.completedAt).getTime() : Date.now()
      const autoConfirmAt = completedAt + 24 * 60 * 60 * 1000
      const tick = () => {
        const remaining = Math.max(0, Math.floor((autoConfirmAt - Date.now()) / 1000))
        setCountdown(remaining)
        if (remaining <= 0 && timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
      tick()
      timerRef.current = setInterval(tick, 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [order?.status, order?.completedAt])

  // Simulate wait time
  useEffect(() => {
    if (order?.status === "S10" || order?.status === "A10") {
      const t = setInterval(() => setWaitTime((prev) => prev + 1), 10000)
      return () => clearInterval(t)
    } else {
      setWaitTime(0)
    }
  }, [order?.status])

  const formatCountdown = (seconds: number) => {
    if (seconds >= 24 * 60 * 60) {
      // 24小时以上显示 "XX天XX:XX:XX"
      const days = Math.floor(seconds / (24 * 60 * 60))
      const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
      const mins = Math.floor((seconds % (60 * 60)) / 60)
      return `${days}天${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
    }
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const isUrgent = countdown > 0 && countdown < 180

  const handleCallStaff = () => {
    toast.info(`正在拨号 ${order?.staffPhone || "139****6666"}...`)
  }

  const handleConfirmPayment = () => {
    setShowPaymentMethod(true)
  }

  const handlePayOnline = () => {
    markPaid(order!.id, "online")
    toast.success("支付成功")
    setShowPaymentMethod(false)
  }

  const handlePayCash = () => {
    setShowPaymentMethod(false)
    setShowCashConfirm(true)
  }

  const handleConfirmCashPay = () => {
    markPaid(order!.id, "cash")
    toast.success("已确认现金支付")
    setShowCashConfirm(false)
  }

  const handleCancelOrder = () => {
    useConvenienceStore.getState().requestCancel(order!.id)
    if (order?.status === "S10" || order?.status === "A10") {
      toast("订单已取消")
    } else {
      toast.info("取消申请已提交，等待管理员审批")
    }
  }

  const handleApplyCancel = () => {
    useConvenienceStore.getState().requestCancel(order!.id)
    toast.info("取消申请已提交，等待审批")
  }

  const handleViewDetail = () => {
    if (order) navigate(`/c/orders/${order.id}`)
  }

  const handleReview = () => {
    if (order) setShowRating(true)
  }

  const handleSubmitRating = (stars: number) => {
    if (!order) return
    useConvenienceStore.getState().rateOrder(order.id, stars)
    setShowRating(false)
    toast.success("评价成功")
  }

  // --- Bottom action bar ---

  const renderBottomBar = () => {
    const status = order?.status
    if (!status) return null
    if (["S10", "A10"].includes(status)) {
      return (
        <button
          onClick={handleCancelOrder}
          className="w-full h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
        >
          取消订单
        </button>
      )
    }
    if (["A20", "A30"].includes(status)) {
      return (
        <div className="flex gap-3">
          <button
            onClick={handleApplyCancel}
            className="flex-1 h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
          >
            申请取消
          </button>
          <button onClick={handleCallStaff} className="flex-1 h-11 rounded-full bg-primary text-white text-[14px]">
            联系服务人员
          </button>
        </div>
      )
    }
    if (status === "A35") {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <button
              onClick={handleApplyCancel}
              className="flex-1 h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
            >
              申请取消
            </button>
            <button
              onClick={handleCallStaff}
              className="flex-1 h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
            >
              联系服务人员
            </button>
          </div>
          <button onClick={handleConfirmPayment} className="w-full h-11 rounded-full bg-primary text-white text-[14px]">
            完成支付（{formatCountdown(countdown)}）
          </button>
        </div>
      )
    }
    if (["A40", "S48", "S55"].includes(status)) {
      return (
        <button onClick={handleCallStaff} className="w-full h-11 rounded-full bg-primary text-white text-[14px]">
          联系服务人员
        </button>
      )
    }
    if (status === "S40") {
      return (
        <div className="flex gap-3">
          <button
            onClick={handleViewDetail}
            className="flex-1 h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
          >
            查看详情
          </button>
          <button onClick={handleReview} className="flex-1 h-11 rounded-full bg-primary text-white text-[14px]">
            评价
          </button>
        </div>
      )
    }
    if (["S50"].includes(status)) {
      return (
        <button
          onClick={() => navigate(`/c/orders/${order?.id ?? "cancelled"}`)}
          className="w-full h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
        >
          查看详情
        </button>
      )
    }
    return null
  }

  const showStaffCard = order?.status && !["S10", "A10", "S50"].includes(order.status) && order.status !== "S50"

  if (!order) {
    return (
      <div className="bg-surface-page min-h-full pb-[80px]">
        <PageHeader title="订单跟踪" />
        <div className="p-6 text-center text-text-tertiary">订单不存在</div>
      </div>
    )
  }

  return (
    <div className="bg-surface-page min-h-full pb-[80px]">
      <PageHeader title="订单跟踪" />

      <div className="px-3 pt-3 space-y-3">
        {/* Status progress bar */}
        <div className="bg-white rounded-2xl p-3">
          <StatusProgress steps={statusSteps} compact />
        </div>

        {/* Cancelled order card */}
        {(order?.status === "S50" || order?.cancelRequested) && (
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-[28px] text-gray-400">{order?.status === "S50" ? "!" : "⏳"}</span>
            </div>
            <p className="text-[15px] text-gray-500 font-medium">
              {order?.status === "S50" ? "订单已取消" : "取消申请已提交，等待审批"}
            </p>
            <p className="text-[13px] text-gray-400 mt-2">如有疑问请联系客服</p>
          </div>
        )}

        {/* Waiting experience area — shown before staff assignment */}
        {(order?.status === "S10" || order?.status === "A10") && (
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
              <div
                className="w-4 h-4 rounded-full bg-primary"
                style={{ animation: "pulse-soft 2s ease-in-out infinite" }}
              />
            </div>
            {waitTime < 5 && (
              <>
                <p className="text-[15px] text-text-heading font-medium">正在为您安排服务人员...</p>
                <p className="text-[13px] text-text-tertiary mt-2">通常5分钟内为您安排</p>
              </>
            )}
            {waitTime >= 5 && waitTime < 15 && (
              <>
                <p className="text-[15px] text-text-heading font-medium">当前服务人员较忙，继续为您寻找中...</p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setWaitTime(0)}
                    className="flex-1 h-10 rounded-full border border-border-light text-text-body text-[13px] bg-white"
                  >
                    继续等待
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    className="flex-1 h-10 rounded-full bg-primary text-white text-[13px]"
                  >
                    取消订单
                  </button>
                </div>
              </>
            )}
            {waitTime >= 15 && (
              <>
                <p className="text-[15px] text-text-heading font-medium">暂无空闲服务人员</p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setWaitTime(0)}
                    className="flex-1 h-10 rounded-full border border-border-light text-text-body text-[13px] bg-white"
                  >
                    继续等待（进人工队列）
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    className="flex-1 h-10 rounded-full bg-primary text-white text-[13px]"
                  >
                    取消订单
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Service staff card — shown after matching */}
        {showStaffCard && (
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center gap-3">
              {/* Avatar placeholder */}
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <User size={24} className="text-primary" />
              </div>

              {/* Staff info */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-text-heading font-medium">{order?.staffName || "服务人员"}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[13px] text-text-secondary">{order?.staffPhone || "暂无电话"}</span>
                </div>
              </div>

              {/* Phone button */}
              <button
                onClick={handleCallStaff}
                className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
              >
                <Phone size={16} className="text-primary" />
              </button>
            </div>
          </div>
        )}

        {/* Price confirmation card — shown in prepay state only */}
        {order?.status === "A35" && (
          <div className="bg-white rounded-2xl p-4">
            <p className="text-[13px] text-text-body">服务人员已确认价格</p>

            {/* Amount display */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[32px] text-primary font-medium">¥{(order.priceQuote ?? 0).toFixed(2)}</span>
              {order.refPrice != null && order.priceQuote != null && order.priceQuote > order.refPrice && (
                <span className="px-2 py-0.5 rounded-full text-[11px] text-orange-600 bg-orange-50 border border-orange-200">
                  高于参考价
                </span>
              )}
            </div>

            {/* Reference price hint */}
            {order.refPrice != null && (
              <p className="text-[12px] text-text-tertiary mt-1">
                该服务参考价为≤¥{order.refPrice.toFixed(2)}（仅供参考）
              </p>
            )}

            {/* Action buttons */}
            <div className="mt-4 space-y-3">
              <button
                onClick={handleConfirmPayment}
                className="w-full h-11 rounded-full bg-primary text-white text-[14px] active:opacity-90 transition-opacity"
              >
                确认支付
              </button>
              <button
                onClick={handleApplyCancel}
                className="w-full h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white active:bg-surface-page transition-colors"
              >
                申请取消
              </button>
            </div>
          </div>
        )}

        {/* 15-min countdown — shown in A35 (quote pending) state */}
        {order?.status === "A35" && (
          <div className="bg-white rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              {isUrgent ? (
                <AlertCircle size={18} className="text-red-500" />
              ) : (
                <Clock size={18} className="text-primary" />
              )}
              <span className="text-[13px] text-text-secondary">支付剩余时间</span>
            </div>

            <p
              className={`text-[42px] font-mono mt-2 font-medium tracking-wider ${
                isUrgent ? "text-red-500" : "text-text-heading"
              }`}
            >
              {formatCountdown(countdown)}
            </p>

            <p className="text-[12px] text-text-tertiary mt-1">请尽快完成支付，超时订单将进入待人工处理</p>
          </div>
        )}

        {/* 24-hour countdown — shown in S55 (confirming) state */}
        {order?.status === "S55" && countdown > 0 && (
          <div className="bg-white rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock size={18} className="text-primary" />
              <span className="text-[13px] text-text-secondary">自动确认剩余时间</span>
            </div>

            <p className="text-[36px] font-mono mt-2 font-medium tracking-wider text-text-heading">
              {formatCountdown(countdown)}
            </p>

            <p className="text-[12px] text-text-tertiary mt-1">超时未确认将自动确认服务完成</p>
          </div>
        )}

        {/* Rating dialog */}
        {showRating && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden p-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                  <Star size={24} className="text-primary" />
                </div>
                <h3 className="text-[17px] text-text-body font-medium mb-2">评价服务</h3>
                <p className="text-[14px] text-text-secondary mb-4">请对本次服务进行评分</p>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform active:scale-110"
                    >
                      <Star size={32} className={star <= rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-gray-300"} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRating(false)
                      setRating(0)
                    }}
                    className="flex-1 h-11 rounded-full border border-border-light text-text-body text-[14px]"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleSubmitRating(rating)}
                    disabled={rating === 0}
                    className="flex-1 h-11 rounded-full bg-primary text-white text-[14px] disabled:opacity-50"
                  >
                    提交评价
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment method selection */}
        {showPaymentMethod && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
            <div className="bg-white rounded-t-2xl w-full overflow-hidden">
              <div className="p-4 text-center border-b border-border-light">
                <p className="text-[15px] text-text-body font-medium">选择支付方式</p>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={handlePayOnline}
                  className="w-full h-12 rounded-xl bg-primary text-white text-[14px] flex items-center justify-center gap-2"
                >
                  <span className="text-lg">💳</span> 微信支付
                </button>
                <button
                  onClick={handlePayCash}
                  className="w-full h-12 rounded-xl bg-[#10B981] text-white text-[14px] flex items-center justify-center gap-2"
                >
                  <span className="text-lg">💵</span> 现金支付
                </button>
              </div>
              <button
                onClick={() => setShowPaymentMethod(false)}
                className="w-full h-12 text-[14px] text-text-secondary border-t border-border-light"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Cash payment confirmation */}
        {showCashConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                  <span className="text-2xl">💵</span>
                </div>
                <h3 className="text-[17px] text-text-body font-medium mb-2">确认现金支付？</h3>
                <p className="text-[14px] text-text-secondary">您将使用现金支付给服务人员，请确认收到服务后再支付</p>
              </div>
              <div className="flex border-t border-border-light">
                <button
                  onClick={() => setShowCashConfirm(false)}
                  className="flex-1 h-12 text-[15px] text-text-secondary border-r border-border-light"
                >
                  再考虑
                </button>
                <button onClick={handleConfirmCashPay} className="flex-1 h-12 text-[15px] text-[#10B981] font-medium">
                  确认现金支付
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-border-light px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {renderBottomBar()}
      </div>
    </div>
  )
}
