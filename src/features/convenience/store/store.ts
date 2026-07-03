import { create } from "zustand"
import type { ConvenienceOrder, ConvenienceStatus, DispatchLogEntry } from "../../../../shared/types"
import { transition } from "./transitions"
import { pickStaff, lookupStaff } from "./dispatch"
import { setTimer, clearTimer } from "./timers"
import { SEED_ORDERS } from "./seed"
import { notifyConvenience } from "./notification"
import { useSettlementStore } from "./settlement-store"

// ---- Store types ----
type ConvenienceState = {
  orders: ConvenienceOrder[]
  dispatchLog: DispatchLogEntry[]

  // Queries
  getOrdersByUser: (userId: string) => ConvenienceOrder[]
  getOrdersByStaff: (staffId: string) => ConvenienceOrder[]
  getOrder: (id: string) => ConvenienceOrder | undefined
  getPending: () => ConvenienceOrder[]
  getManualPending: () => ConvenienceOrder[]
  getCancelPendingOrders: () => ConvenienceOrder[]

  // Lifecycle
  createOrder: (order: ConvenienceOrder) => void
  dispatchOrder: (orderId: string) => void
  autoDispatchOrder: (orderId: string) => void
  assignToStaff: (orderId: string) => void
  manualDispatch: (orderId: string, staffId: string) => void
  acceptOrder: (orderId: string) => void
  submitQuote: (orderId: string, price: number) => void
  markPaid: (orderId: string, method: "online" | "cash") => void
  startService: (orderId: string) => void
  completeService: (orderId: string, photos: string[]) => void
  confirmComplete: (orderId: string) => void
  rateOrder: (orderId: string, rating: number) => void

  // Cancel
  requestCancel: (orderId: string) => void
  approveCancelRequest: (orderId: string) => void
  rejectCancelRequest: (orderId: string) => void
  forceCancel: (orderId: string) => void
  reDispatch: (orderId: string) => void

  uploadPaymentProof: (orderId: string, url: string) => void
}

// ---- Helpers (pure, not exported) ----
function updateOrder(
  orders: ConvenienceOrder[],
  id: string,
  patch: Partial<ConvenienceOrder>,
): ConvenienceOrder[] {
  return orders.map((o) => (o.id === id ? { ...o, ...patch } : o))
}

function notify(
  order: ConvenienceOrder,
  title: string,
  summary: string,
  targetUrl: string,
) {
  notifyConvenience(order.id, String(order.serviceType), title, summary, targetUrl)
}

function logDispatch(
  log: DispatchLogEntry[],
  entry: Omit<DispatchLogEntry, "timestamp">,
): DispatchLogEntry[] {
  return [{ ...entry, timestamp: new Date().toISOString() }, ...log]
}

// ---- Store ----
export const useConvenienceStore = create<ConvenienceState>((set, get) => ({
  orders: SEED_ORDERS,
  dispatchLog: [],

  // Queries
  getOrdersByUser: (userId) => get().orders.filter((o) => o.userId === userId),
  getOrdersByStaff: (staffId) => get().orders.filter((o) => o.staffId === staffId),
  getOrder: (id) => get().orders.find((o) => o.id === id),
  getPending: () => get().orders.filter((o) => o.status === "S10" || o.status === "A10"),
  getManualPending: () => get().orders.filter((o) => ["S10", "A10", "S90"].includes(o.status)),
  getCancelPendingOrders: () => get().orders.filter((o) => o.cancelRequested),

  // ---- Order lifecycle ----
  createOrder: (order) => {
    const newOrder = { ...order, status: "S10" as ConvenienceStatus }
    set((s) => ({ orders: [newOrder, ...s.orders] }))
    notify(newOrder, "便民服务订单已提交", `您的${newOrder.serviceType}订单已提交，正在为您安排服务人员`, `/c/orders/${newOrder.id}`)
    setTimeout(() => get().dispatchOrder(newOrder.id), 500)
  },

  dispatchOrder: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId)
    if (!order) return
    const next = transition(order.status, "dispatch")
    if (!next) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { status: next }) }))
  },

  assignToStaff: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId)
    if (!order) return
    const valid = transition(order.status, "assign") || transition(order.status, "reDispatch")
    if (!valid) return
    const next = (order.status === "S90") ? transition(order.status, "reDispatch")! : transition(order.status, "assign")!
    const staff = pickStaff(order.serviceType, order.lat, order.lng)
    const sid = staff?.id ?? ""
    set((s) => ({
      orders: updateOrder(s.orders, orderId, { status: next, staffId: sid, staffName: staff?.name ?? "", staffPhone: staff?.phone ?? "" }),
      dispatchLog: logDispatch(s.dispatchLog, { orderId, type: "manual", staffId: sid, staffName: staff?.name, reason: "系统指派" }),
    }))
    if (staff) notify(order, "便民服务已派单", `${order.serviceType}订单已指派${staff.name}，请留意电话联系`, `/b/service/tasks`)
  },

  autoDispatchOrder: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    const next = transition(o.status, "dispatch")
    if (!next) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { status: next }) }))
    get().assignToStaff(orderId)
  },

  manualDispatch: (orderId, staffId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    const valid = transition(o.status, "assign") || transition(o.status, "reDispatch")
    if (!valid) return
    const next = transition(o.status, "assign") || transition(o.status, "reDispatch")!
    const staff = lookupStaff(staffId)
    set((s) => ({
      orders: updateOrder(s.orders, orderId, { status: next, staffId, staffName: staff?.name ?? "", staffPhone: staff?.phone ?? "" }),
      dispatchLog: logDispatch(s.dispatchLog, { orderId, type: "manual", staffId, staffName: staff?.name, reason: "手动指派" }),
    }))
    if (staff) notify(o, "便民服务已派单", `${o.serviceType}订单已指派${staff.name}，请留意电话联系`, `/b/service/tasks`)
  },

  acceptOrder: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "accept")) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { status: transition(o.status, "accept")! }) }))
    notify(o, "服务人员已接单", `${o.staffName ?? "服务人员"}已接单，即将联系您确认服务`, `/c/orders/${orderId}`)
  },

  submitQuote: (orderId, price) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "quote")) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { status: transition(o.status, "quote")!, priceQuote: price }) }))
    notify(o, "服务已核价", `您的${o.serviceType}订单已报价 ¥${price}，请在时间内确认支付`, `/c/orders/${orderId}`)
    setTimer(`conv:${orderId}:pay`, 15000, () => {
      const order = get().orders.find((o) => o.id === orderId)
      if (order?.status === "A35") {
        set((s) => ({ orders: updateOrder(s.orders, orderId, { status: "S90" }) }))
        notifyConvenience(orderId, order.serviceType, "支付超时", "支付超时，订单已转入待人工处理", `/desktop/convenience`)
      }
    })
  },

  markPaid: (orderId, method) => {
    clearTimer(`conv:${orderId}:pay`)
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "pay")) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { status: transition(o.status, "pay")!, payMethod: method }) }))
    notify(o, "支付成功", `${o.serviceType}订单已${method === "online" ? "在线" : "现金"}支付成功，服务人员即将开始服务`, `/c/orders/${orderId}`)
  },

  startService: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "startService")) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { status: transition(o.status, "startService")! }) }))
    notify(o, "服务进行中", `${o.serviceType}订单开始服务`, `/c/orders/${orderId}`)
  },

  completeService: (orderId, photos) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "complete")) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { status: transition(o.status, "complete")!, completionPhotos: photos }) }))
    notify(o, "服务已完成", `您的${o.serviceType}订单服务已完成，请确认完成`, `/c/orders/${orderId}`)
    setTimer(`conv:${orderId}:autoConfirm`, 30000, () => get().confirmComplete(orderId))
  },

  confirmComplete: (orderId) => {
    clearTimer(`conv:${orderId}:autoConfirm`)
    const o = get().orders.find((x) => x.id === orderId)
    const next = transition(o?.status ?? "S55", "confirm") || transition(o?.status ?? "S55", "autoConfirm")
    if (!next || !o) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { status: next, completedAt: new Date().toISOString() }) }))
    if (o.priceQuote && o.staffId) {
      useSettlementStore.getState().recordIncome({
        orderId: o.id, staffId: o.staffId, staffName: o.staffName ?? "",
        serviceType: String(o.serviceType), amount: o.priceQuote,
        payMethod: o.payMethod ?? "online",
      })
    }
    notify(o, "订单已完成", "服务已完成，欢迎评价", `/c/orders/${orderId}`)
  },

  rateOrder: (orderId, rating) => set((s) => ({ orders: updateOrder(s.orders, orderId, { rating, ratedAt: new Date().toISOString() }) })),

  // ---- Cancel flow ----
  requestCancel: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    const directCancel = transition(o.status, "cancel")
    if (directCancel) {
      set((s) => ({ orders: updateOrder(s.orders, orderId, { status: directCancel }) }))
      return
    }
    set((s) => ({ orders: updateOrder(s.orders, orderId, { cancelRequested: true }) }))
    notify(o, "用户申请取消", `${o.serviceType}订单用户申请取消，请处理`, `/desktop/convenience`)
  },

  approveCancelRequest: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !o.cancelRequested) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { status: "S50", cancelRequested: false }) }))
    notify(o, "取消已同意", `您的${o.serviceType}订单取消已同意`, `/c/orders/${orderId}`)
  },

  rejectCancelRequest: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !o.cancelRequested) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { cancelRequested: false }) }))
    notify(o, "取消已拒绝", `您的${o.serviceType}订单取消申请已被拒绝，服务继续`, `/c/orders/${orderId}`)
  },

  forceCancel: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "forceCancel")) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { status: "S50" }) }))
  },

  reDispatch: (orderId) => {
    clearTimer(`conv:${orderId}:pay`)
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || o.status !== "S90" || !transition("S90", "reDispatch")) return
    set((s) => ({ orders: updateOrder(s.orders, orderId, { status: "A10" }) }))
  },

  uploadPaymentProof: (orderId, url) => set((s) => ({ orders: updateOrder(s.orders, orderId, { paymentProof: url }) })),
}))