import { useEffect, useRef, useState } from "react"
import { Phone, MapPin, Wallet, Camera, Clock, AlertTriangle, User, CheckCircle2, AlertCircle } from "lucide-react"
import { DetailLayout, InfoRow, SectionCard } from "../components/DetailLayout"
import { StatusBadge } from "@/shared/components/ui/status-badge"
import { ConfirmModal, Toast } from "../components/Sheet"
import { QuoteAndPhotoFlow } from "./QuoteAndPhotoFlow"
import { useConvenienceStore } from "../../store"
import type { ConvenienceStatus } from "../../../../shared/types"
import type { BServiceState } from "../../shared/service-state"
import { convToBState, B_SERVICE_STATE_META, B_SERVICE_STAGES, B_STATE_TRANSITIONS } from "../../shared/service-state"

export type ServiceState = BServiceState

export type ServiceOrder = {
  id: string
  state: ServiceState
  type: string
  typeColor: string
  addr: string
  buyer: string
  buyerPhone: string
  time: string
  ref: string
  amount?: string
  pay?: "online" | "cash"
  note?: string
  cancelReason?: string
  cancelTime?: string
  images?: string[]
  paymentProof?: string
  completionPhotos?: string[]
  pricingMode?: "postQuote" | "fixed"
}

const STATE_META = B_SERVICE_STATE_META
const CONV_STAGES = B_SERVICE_STAGES

function convStatusToServiceState(status?: ConvenienceStatus): BServiceState | null {
  return status ? convToBState(status) : null
}

export function ServiceOrderDetail({
  order,
  onClose,
  onStateChange,
}: {
  order: ServiceOrder | null
  onClose: () => void
  onStateChange?: (id: string, next: ServiceState, pricingMode?: "postQuote" | "fixed") => void
}) {
  const [flow, setFlow] = useState<"quote" | "photo" | "proof" | null>(null)
  const [hasPaymentProof, setHasPaymentProof] = useState(false)
  const [confirm, setConfirm] = useState<
    null | "accept" | "start" | "approve-cancel" | "reject-cancel" | "manual-resolve"
  >(null)
  const [toast, setToast] = useState("")
  const liveOrder = useConvenienceStore((s) => (order ? s.orders.find((item) => item.id === order.id) : undefined))

  useEffect(() => {
    setFlow(null)
    setHasPaymentProof(false)
    setConfirm(null)
    return () => clearTimeout(toastTimerRef.current)
  }, [order?.id])

  if (!order) return null
  const liveState = convStatusToServiceState(liveOrder?.status)
  const cur = liveState ?? order.state
  const meta = STATE_META[cur]
  const stages = CONV_STAGES
  const stageIndex = stages.findIndex((s) => s.key === cur)
  const hasUploadedPaymentProof = hasPaymentProof || Boolean(order.paymentProof) || Boolean(liveOrder?.paymentProof)
  const isFixed = order.pricingMode === "fixed"

  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const showToast = (t: string) => {
    clearTimeout(toastTimerRef.current)
    setToast(t)
    toastTimerRef.current = setTimeout(() => setToast(""), 1600)
  }

  const VALID_TRANSITIONS = B_STATE_TRANSITIONS

  const change = (next: ServiceState, msg: string) => {
    const allowed = VALID_TRANSITIONS[cur] ?? []
    if (!allowed.includes(next)) {
      showToast(`非法状态转换: ${cur} → ${next}`)
      return
    }
    // Apply store transitions for actions that need them
    if (next === "accepted") {
      useConvenienceStore.getState().acceptOrder(order.id)
    } else if (next === "serving") {
      useConvenienceStore.getState().startService(order.id)
    } else if (next === "cancelled") {
      useConvenienceStore.getState().approveCancelRequest(order.id)
    }
    // Only notify parent if store actually applied the transition
    const updatedOrder = useConvenienceStore.getState().orders.find((item) => item.id === order.id)
    const updatedState = updatedOrder ? convStatusToServiceState(updatedOrder.status) : null
    if (updatedState === next || !updatedState) {
      onStateChange?.(order.id, next, order.pricingMode)
    }
    showToast(msg)
  }

  const banner =
    cur === "manual"
      ? {
          bg: "#FEE2E2",
          fg: "#9F1239",
          icon: <AlertCircle className="size-4" />,
          text: "异常订单，请联系客服处理",
        }
      : null

  const renderFooter = () => {
    switch (cur) {
      case "pending":
        return (
          <div className="flex gap-2">
            <button
              onClick={() => {
                useConvenienceStore.getState().rejectOrder(order.id, "")
                onClose()
              }}
              className="flex-1 h-11 rounded-2xl bg-white border border-slate-200 text-text-secondary text-[14px]"
            >
              暂不接单
            </button>
            <button
              onClick={() => setConfirm("accept")}
              className="flex-1 h-11 rounded-2xl text-white text-[14px] font-medium shadow-[0_4px_12px_rgba(245,158,11,0.32)]"
              style={{ background: "#F59E0B" }}
            >
              确认接单
            </button>
          </div>
        )

      case "accepted":
        return (
          <div className="flex flex-col gap-2">
            {!liveOrder?.arrivedAt ? (
              <button
                onClick={() => {
                  useConvenienceStore.getState().arriveCheckin(order.id)
                  showToast("已到场打卡")
                }}
                className="w-full h-11 rounded-2xl text-white text-[14px] font-medium"
                style={{ background: "#059669", boxShadow: "0 4px 12px rgba(5,150,105,0.32)" }}
              >
                <span className="inline-flex items-center gap-1.5">📍 到场打卡</span>
              </button>
            ) : (
              <div className="text-[12px] text-emerald-600 text-center py-1">
                已到场打卡 {new Date(liveOrder.arrivedAt).toLocaleString()}
              </div>
            )}
            <button
              onClick={() => setFlow("quote")}
              className="w-full h-11 rounded-2xl text-white text-[14px] font-medium shadow-[0_4px_12px_rgba(245,158,11,0.32)] disabled:opacity-40"
              style={{ background: liveOrder?.arrivedAt ? "#F59E0B" : "#9CA3AF" }}
              disabled={!liveOrder?.arrivedAt}
            >
              {liveOrder?.arrivedAt ? "录入金额 / 报价" : "请先到场打卡"}
            </button>
          </div>
        )

      case "quoted":
        // 现金支付:显示确认收款按钮;线上支付:等待
        if (liveOrder?.paymentMethod === "cash" || order.pay === "cash") {
          return (
            <button
              onClick={() => {
                useConvenienceStore.getState().confirmCash(order.id)
                showToast("已确认现金收款")
              }}
              className="w-full h-11 rounded-2xl text-white text-[14px] font-medium shadow-[0_4px_12px_rgba(16,185,129,0.32)]"
              style={{ background: "#10B981" }}
            >
              <span className="inline-flex items-center gap-1.5">💵 确认现金已收 ¥{order.amount?.replace("¥", "") || liveOrder?.priceQuote || ""}</span>
            </button>
          )
        }
        return (
          <div className="w-full h-11 rounded-2xl bg-gray-100 text-text-tertiary text-[14px] flex items-center justify-center">
            等待用户线上支付
          </div>
        )

      case "paid":
        if (order.pay === "cash" && !hasUploadedPaymentProof) {
          return (
            <button
              onClick={() => setFlow("proof")}
              className="w-full h-11 rounded-2xl text-white text-[14px] font-medium shadow-[0_4px_12px_rgba(16,185,129,0.32)]"
              style={{ background: "#10B981" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Camera className="size-4" /> 上传支付凭证
              </span>
            </button>
          )
        }
        return (
          <button
            onClick={() => setConfirm("start")}
            className="w-full h-11 rounded-2xl text-white text-[14px] font-medium shadow-[0_4px_12px_rgba(37,99,235,0.32)]"
            style={{ background: "#2563EB" }}
          >
            开始服务
          </button>
        )

      case "serving":
        return (
          <button
            onClick={() => setFlow("photo")}
            className="w-full h-11 rounded-2xl text-white text-[14px] font-medium shadow-[0_4px_12px_rgba(245,158,11,0.32)]"
            style={{ background: "#F59E0B" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Camera className="size-4" /> 完工拍照
            </span>
          </button>
        )

      case "confirming":
        return (
          <div className="w-full h-11 rounded-2xl bg-gray-100 text-text-tertiary text-[14px] flex items-center justify-center">
            等待用户确认完成
          </div>
        )

      case "manual":
        return (
          <button
            onClick={() => setConfirm("manual-resolve")}
            className="w-full h-11 rounded-2xl text-white text-[14px] font-medium"
            style={{ background: "#9F1239", boxShadow: "0 4px 12px rgba(159,18,57,0.32)" }}
          >
            联系客服 / 标记已处理
          </button>
        )

      default:
        return null
    }
  }

  return (
    <DetailLayout open onClose={onClose} title="订单详情" tint="#F59E0B" footer={renderFooter()}>
      {banner && (
        <div
          className="px-4 py-2.5 flex items-center gap-2 sticky top-0 z-10"
          style={{ background: banner.bg, color: banner.fg }}
        >
          {banner.icon}
          <span className="text-[12px] flex-1">{banner.text}</span>
          {/* @ts-expect-error: cancelReview is not in BServiceState union but valid at runtime */}
          {cur === "cancelReview" && order.cancelTime && (
            <span className="text-[10px] opacity-80">{order.cancelTime}</span>
          )}
        </div>
      )}

      <div className="space-y-3 px-4 py-3">
        {/* Status + source badge */}
        <div className="flex items-center gap-2">
          <StatusBadge kind={meta.kind}>{meta.label}</StatusBadge>
          <span className="text-[11px] text-text-tertiary">订单 #{order.id}</span>
        </div>

        {/* Stage progress */}
        {/* @ts-expect-error: cancelReview is not in BServiceState but valid at runtime */}
        {stageIndex >= 0 && cur !== "cancelled" && cur !== "cancelReview" && (
          <SectionCard>
            <div className="flex items-center justify-between">
              {stages.map((s, i) => {
                const passed = i <= stageIndex
                const active = i === stageIndex
                return (
                  <div key={s.key} className="flex-1 flex flex-col items-center relative">
                    <div
                      className="size-7 rounded-full flex items-center justify-center text-[11px] font-medium transition"
                      style={{
                        background: passed ? "#F59E0B" : "#F1F5F9",
                        color: passed ? "white" : "var(--text-tertiary)",
                        boxShadow: active ? "0 0 0 4px rgba(245,158,11,0.18)" : "none",
                      }}
                    >
                      {passed ? <CheckCircle2 className="size-4" /> : i + 1}
                    </div>
                    <div className="mt-1 text-[10px]" style={{ color: passed ? "#F59E0B" : "var(--text-tertiary)" }}>
                      {s.label}
                    </div>
                    {i < stages.length - 1 && (
                      <div
                        className="absolute top-[14px] left-[60%] right-[-40%] h-0.5"
                        style={{ background: i < stageIndex ? "#F59E0B" : "var(--surface-strong)" }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </SectionCard>
        )}

        {/* Service/product info */}
        <SectionCard>
          <div className="flex items-center gap-1.5 mb-1">
            <div
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px]"
              style={{ background: `${order.typeColor}14`, color: order.typeColor }}
            >
              {order.type}
            </div>
          </div>
          <div className="flex items-start gap-1.5 text-[15px] text-text-heading mt-2">
            <MapPin className="size-4 text-text-tertiary mt-0.5 shrink-0" />
            <span>{order.addr}</span>
          </div>
          <div className="mt-2 space-y-1 text-[12px] text-text-secondary">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-text-tertiary" /> {order.time}
            </div>
            {order.ref && <div className="text-[11px] text-text-tertiary">{order.ref}</div>}
          </div>
        </SectionCard>

        {/* Images (convenience) */}
        {order.images && order.images.length > 0 && (
          <SectionCard title="现场照片（用户上传）">
            <div className="grid grid-cols-3 gap-2">
              {order.images.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} alt={`照片 ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Payment proof */}
        {order.paymentProof && (
          <SectionCard title="支付凭证">
            <div className="w-full h-32 rounded-xl overflow-hidden bg-gray-100">
              <img src={order.paymentProof} alt="支付凭证" className="w-full h-full object-cover" />
            </div>
          </SectionCard>
        )}

        {/* Completion photos */}
        {order.completionPhotos && order.completionPhotos.length > 0 && (
          <SectionCard title="完工照片">
            <div className="grid grid-cols-2 gap-2">
              {order.completionPhotos.map((img, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} alt={`完工照片 ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Amount */}
        {order.amount && (
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)]">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              <span className="text-[13px] text-text-heading">{order.pay === "online" ? "线上支付" : "现金收款"}</span>
              <span className="ml-auto text-[20px] text-text-heading font-medium">{order.amount}</span>
            </div>
          </div>
        )}

        {/* Cancel reason */}
        {/* @ts-expect-error: cancelReview is not in BServiceState but valid at runtime */}
        {(cur === "cancelled" || cur === "cancelReview") && order.cancelReason && (
          <div className="rounded-2xl p-4 bg-gray-100">
            <div className="text-[12px] text-text-tertiary">取消原因</div>
            <div className="mt-1 text-[13px] text-text-heading">{order.cancelReason}</div>
            {order.cancelTime && <div className="mt-1 text-[11px] text-text-tertiary">{order.cancelTime}</div>}
          </div>
        )}

        {/* Buyer */}
        <SectionCard title="用户信息">
          <InfoRow
            label="用户"
            value={
              <span className="inline-flex items-center gap-1">
                <User className="size-3.5 text-text-tertiary" /> {order.buyer}
              </span>
            }
            strong
          />
          <InfoRow label="联系电话" value={order.buyerPhone} mono />
          <button className="mt-2 w-full h-9 rounded-xl bg-primary-50 text-primary text-[12px] flex items-center justify-center gap-1.5">
            <Phone className="size-3.5" /> 拨打电话
          </button>
        </SectionCard>

        {order.note && (
          <SectionCard title="用户备注">
            <div className="text-[12px] text-text-secondary leading-relaxed">{order.note}</div>
          </SectionCard>
        )}

        <SectionCard title="订单信息">
          <InfoRow label="订单号" value={order.id} mono />
          <InfoRow label="下单时间" value={order.time} />
          <InfoRow label="计费方式" value="后报价" />
          {order.pay && <InfoRow label="支付方式" value={order.pay === "online" ? "线上预付" : "现金收款"} />}
        </SectionCard>
      </div>

      <ConfirmModal
        open={confirm === "accept"}
        onClose={() => setConfirm(null)}
        title="确认接单？"
        desc="接单后请尽快到达现场，超时未到将影响诚信分。"
        tint="#F59E0B"
        cancel="再想想"
        confirm="确认接单"
        onConfirm={() => change("accepted", "已接单")}
      />
      <ConfirmModal
        open={confirm === "start"}
        onClose={() => setConfirm(null)}
        title="开始服务？"
        desc={isFixed ? "确认开始服务，完成后用户自动确认。" : "点击后订单将进入「服务中」，并开始计时。"}
        tint="#2563EB"
        cancel="取消"
        confirm="开始"
        onConfirm={() => change("serving", "服务已开始")}
      />
      <ConfirmModal
        open={confirm === "approve-cancel"}
        onClose={() => setConfirm(null)}
        title="同意取消该订单？"
        desc="同意后订单将被取消。"
        tint="#F59E0B"
        cancel="再想想"
        confirm="同意取消"
        onConfirm={() => change("cancelled", "订单已取消")}
      />
      <ConfirmModal
        open={confirm === "reject-cancel"}
        onClose={() => setConfirm(null)}
        title="拒绝取消申请？"
        desc="拒绝后订单将继续服务流程。"
        cancel="取消"
        confirm="拒绝"
        onConfirm={() => {
          useConvenienceStore.getState().rejectCancelRequest(order.id)
          showToast("已拒绝取消")
          setConfirm(null)
        }}
      />
      <ConfirmModal
        open={confirm === "manual-resolve"}
        onClose={() => setConfirm(null)}
        title="标记为已处理？"
        desc="确认已与客服沟通完毕并完成线下结算。"
        tint="#9F1239"
        cancel="取消"
        confirm="标记已处理"
        onConfirm={() => change("done", "已标记处理")}
      />
      <ConfirmModal
        open={(confirm as string) === "reject-pending"}
        onClose={() => setConfirm(null)}
        title="已收到取消申请"
        desc="该订单用户申请了取消，如需处理请前往桌面端。"
        cancel="知道了"
        confirm="知道了"
        onConfirm={() => setConfirm(null)}
      />

      <QuoteAndPhotoFlow
        open={flow !== null}
        initial={flow ?? "quote"}
        order={{
          id: order.id,
          serviceType: order.type,
          address: order.addr ? order.addr.split(" → ")[0] : "",
          addressTo: order.addr?.includes("→") ? order.addr.split(" → ")[1] : undefined,
          pay: order.pay,
          refPrice: liveOrder?.refPrice,
          amount: order.amount,
        }}
        onClose={() => {
          const finishedFlow = flow
          setFlow(null)
          if (finishedFlow === "quote") {
            showToast("已提交报价，等待用户支付")
          } else if (finishedFlow === "proof") {
            if ((liveOrder?.payMethod ?? order.pay) !== "online") {
              useConvenienceStore.getState().markPaid(order.id, "cash")
            }
            setHasPaymentProof(true)
            showToast("已上传支付凭证")
          } else if (finishedFlow === "photo") {
            showToast("已上传完工照片，等待用户确认")
          }
        }}
      />
      <Toast show={!!toast} text={toast} />
    </DetailLayout>
  )
}
