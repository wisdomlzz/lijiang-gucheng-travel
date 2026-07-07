import { create } from "zustand"
import { ordersApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { ConvenienceOrder, ConvenienceStatus, DispatchLogEntry } from "../../../shared/types"
import { transition } from "./transitions"
import { setTimer, clearTimer } from "./timers"
import { notifyConvenience } from "./notification"
import { usePointsStore } from "@/features/points/store/points-store"

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
  createOrder: (order: ConvenienceOrder) => Promise<void>
  autoDispatchOrder: (orderId: string) => Promise<void>
  assignToStaff: (orderId: string) => Promise<void>
  manualDispatch: (orderId: string, staffId: string) => Promise<void>
  acceptOrder: (orderId: string) => Promise<void>
  submitQuote: (orderId: string, price: number) => Promise<void>
  markPaid: (orderId: string, method: "online" | "cash") => Promise<void>
  startService: (orderId: string) => Promise<void>
  completeService: (orderId: string, photos: string[]) => Promise<void>
  confirmComplete: (orderId: string) => Promise<void>
  rateOrder: (orderId: string, rating: number, content?: string, images?: string[]) => Promise<void>

  // Cancel
  requestCancel: (orderId: string) => Promise<void>
  approveCancelRequest: (orderId: string) => Promise<void>
  rejectCancelRequest: (orderId: string) => Promise<void>
  forceCancel: (orderId: string) => Promise<void>
  forceCancelWithReason: (orderId: string, reason: string) => Promise<void>
  reDispatch: (orderId: string) => Promise<void>
  rejectOrder: (orderId: string, reason: string) => Promise<void>

  uploadPaymentProof: (orderId: string, url: string) => Promise<void>

  // MVP 新增
  arriveCheckin: (orderId: string) => Promise<void>
  lockPayment: (orderId: string, paymentMethod: "online" | "cash") => Promise<void>
  payOnline: (orderId: string) => Promise<void>
  confirmCash: (orderId: string) => Promise<void>
  rejectQuote: (orderId: string, reason: string) => Promise<void>
  restoreQuote: (orderId: string) => Promise<void>

  // Admin review actions
  approvePriceQuote: (orderId: string) => Promise<void>
  rejectPriceQuote: (orderId: string) => Promise<void>
  confirmPaymentProof: (orderId: string) => Promise<void>
  rejectPaymentProof: (orderId: string) => Promise<void>
}

// ---- Helpers ----
function replaceOrder(orders: ConvenienceOrder[], id: string, replacement: ConvenienceOrder): ConvenienceOrder[] {
  return orders.map((o) => (o.id === id ? { ...o, ...replacement } : o))
}

function notify(order: ConvenienceOrder, title: string, summary: string, targetUrl: string) {
  notifyConvenience(order.id, String(order.serviceType), title, summary, targetUrl)
}

// ---- Store ----
export const useConvenienceStore = create<ConvenienceState>((set, get) => ({
  orders: [],
  dispatchLog: [],

  // Queries
  getOrdersByUser: (userId) => get().orders.filter((o) => o.userId === userId),
  getOrdersByStaff: (staffId) => get().orders.filter((o) => o.staffId === staffId),
  getOrder: (id) => get().orders.find((o) => o.id === id),
  getPending: () => get().orders.filter((o) => o.status === "S10" || o.status === "A10"),
  getManualPending: () => get().orders.filter((o) => ["S10", "A10", "S90"].includes(o.status)),
  getCancelPendingOrders: () => get().orders.filter((o) => o.cancelRequested),

  // ---- Order lifecycle ----
  createOrder: async (order) => {
    await syncAction<ConvenienceOrder>(
      "createOrder",
      () => ordersApi.create(order),
      (result) => {
        set((s) => ({ orders: [result, ...s.orders] }))
        notify(
          result,
          "便民服务订单已提交",
          `您的${result.serviceType}订单已提交，正在为您安排服务人员`,
          `/c/orders/${result.id}`,
        )
        // 全自动派单
        setTimeout(() => get().autoDispatchOrder(result.id), 500)
      },
    )
  },

  autoDispatchOrder: async (orderId) => {
    await syncAction<ConvenienceOrder>(
      "autoDispatch",
      () => ordersApi.dispatch(orderId, "auto"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        if (result.staffName) {
          notify(
            result,
            "便民服务已派单",
            `${result.serviceType}订单已指派${result.staffName}，请留意电话联系`,
            `/b/service/tasks`,
          )
        }
      },
    )
  },

  assignToStaff: async (orderId) => {
    await syncAction<ConvenienceOrder>(
      "assignToStaff",
      () => ordersApi.dispatch(orderId, "auto"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
      },
    )
  },

  manualDispatch: async (orderId, staffId) => {
    await syncAction<ConvenienceOrder>(
      "manualDispatch",
      () => ordersApi.dispatch(orderId, "manual", staffId),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        if (result.staffName) {
          notify(
            result,
            "便民服务已派单",
            `${result.serviceType}订单已指派${result.staffName}，请留意电话联系`,
            `/b/service/tasks`,
          )
        }
      },
    )
  },

  acceptOrder: async (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "acceptOrder",
      () => ordersApi.transition(orderId, "accept"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        notify(o, "服务人员已接单", `${o.staffName ?? "服务人员"}已接单，即将联系您确认服务`, `/c/orders/${orderId}`)
      },
    )
  },

  submitQuote: async (orderId, price) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "submitQuote",
      () => ordersApi.transition(orderId, "quote", { priceQuote: price }),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        notify(o, "服务已核价", `您的${o.serviceType}订单已报价 ¥${price}，请在时间内确认支付`, `/c/orders/${orderId}`)
        setTimer(`conv:${orderId}:pay`, 15000, async () => {
          const order = get().orders.find((oo) => oo.id === orderId)
          if (order?.status === "A35") {
            // 支付超时:走 transition API
            await syncAction<ConvenienceOrder>(
              "payTimeout",
              () => ordersApi.transition(orderId, "payTimeout"),
              (r) => {
                set((s) => ({ orders: replaceOrder(s.orders, orderId, r) }))
                notifyConvenience(
                  orderId,
                  order.serviceType,
                  "支付超时",
                  "支付超时，订单已转入待人工处理",
                  `/desktop/convenience`,
                )
              },
            )
          }
        })
      },
    )
  },

  markPaid: async (orderId, method) => {
    clearTimer(`conv:${orderId}:pay`)
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "markPaid",
      () => ordersApi.transition(orderId, "pay", { payMethod: method }),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        notify(
          o,
          "支付成功",
          `${o.serviceType}订单已${method === "online" ? "在线" : "现金"}支付成功，服务人员即将开始服务`,
          `/c/orders/${orderId}`,
        )
      },
    )
  },

  startService: async (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "startService",
      () => ordersApi.transition(orderId, "startService"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        notify(o, "服务进行中", `${o.serviceType}订单开始服务`, `/c/orders/${orderId}`)
      },
    )
  },

  completeService: async (orderId, photos) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "completeService",
      () => ordersApi.transition(orderId, "complete", { completionPhotos: photos }),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        notify(o, "服务已完成", `您的${o.serviceType}订单服务已完成，请确认完成`, `/c/orders/${orderId}`)
        setTimer(`conv:${orderId}:autoConfirm`, 30000, () => get().confirmComplete(orderId))
      },
    )
  },

  confirmComplete: async (orderId) => {
    clearTimer(`conv:${orderId}:autoConfirm`)
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "confirmComplete",
      () => ordersApi.transition(orderId, "confirm"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        // recordIncome 已由 server 在 transition 到 S40 时自动生成
        notify(o, "订单已完成", "服务已完成，欢迎评价", `/c/orders/${orderId}`)
        usePointsStore.getState().transact(o.userId, "mall_purchase", orderId)
      },
    )
  },

  rateOrder: async (orderId, rating, content, images) => {
    await syncAction<ConvenienceOrder>(
      "rateOrder",
      () => ordersApi.rate(orderId, { rating, content, images }),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
      },
    )
  },

  // ---- Cancel flow ----
  requestCancel: async (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "requestCancel",
      () => ordersApi.transition(orderId, "requestCancel"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        if (result.cancelRequested) {
          notify(o, "用户申请取消", `${o.serviceType}订单用户申请取消，请处理`, `/desktop/convenience`)
        }
      },
    )
  },

  approveCancelRequest: async (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !o.cancelRequested) return
    await syncAction<ConvenienceOrder>(
      "approveCancelRequest",
      () => ordersApi.transition(orderId, "approveCancel"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        notify(o, "取消已同意", `您的${o.serviceType}订单取消已同意`, `/c/orders/${orderId}`)
      },
    )
  },

  rejectCancelRequest: async (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !o.cancelRequested) return
    await syncAction<ConvenienceOrder>(
      "rejectCancelRequest",
      () => ordersApi.transition(orderId, "rejectCancel"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        notify(o, "取消已拒绝", `您的${o.serviceType}订单取消申请已被拒绝，服务继续`, `/c/orders/${orderId}`)
      },
    )
  },

  forceCancel: async (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "forceCancel",
      () => ordersApi.transition(orderId, "forceCancel"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
      },
    )
  },

  reDispatch: async (orderId) => {
    clearTimer(`conv:${orderId}:pay`)
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || o.status !== "S90") return
    await syncAction<ConvenienceOrder>(
      "reDispatch",
      () => ordersApi.transition(orderId, "reDispatch"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
      },
    )
  },

  uploadPaymentProof: async (orderId, url) => {
    await syncAction<ConvenienceOrder>(
      "uploadPaymentProof",
      () => ordersApi.update(orderId, { paymentProof: url }),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
      },
    )
  },

  // ---- MVP 新增 actions ----
  arriveCheckin: async (orderId) => {
    await syncAction<ConvenienceOrder>(
      "arriveCheckin",
      () => ordersApi.arriveCheckin(orderId),
      (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
    )
  },

  lockPayment: async (orderId, paymentMethod) => {
    await syncAction<ConvenienceOrder>(
      "lockPayment",
      () => ordersApi.lockPayment(orderId, paymentMethod),
      (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
    )
  },

  payOnline: async (orderId) => {
    await syncAction<ConvenienceOrder>(
      "payOnline",
      () => ordersApi.payOnline(orderId),
      (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
    )
  },

  confirmCash: async (orderId) => {
    await syncAction<ConvenienceOrder>(
      "confirmCash",
      () => ordersApi.confirmCash(orderId),
      (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
    )
  },

  rejectQuote: async (orderId, reason) => {
    await syncAction<ConvenienceOrder>(
      "rejectQuote",
      () => ordersApi.rejectQuote(orderId, reason),
      (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
    )
  },

  restoreQuote: async (orderId) => {
    await syncAction<ConvenienceOrder>(
      "restoreQuote",
      () => ordersApi.restoreQuote(orderId),
      (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
    )
  },

  rejectOrder: async (orderId, reason) => {
    await syncAction<ConvenienceOrder>(
      "rejectOrder",
      () => ordersApi.transition(orderId, "reject", { reason }),
      (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
    )
  },

  forceCancelWithReason: async (orderId, reason) => {
    await syncAction<ConvenienceOrder>(
      "forceCancel",
      () => ordersApi.transition(orderId, "forceCancel", { arbitrationRemark: reason }),
      (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
    )
  },

  // ---- Admin review actions ----
  approvePriceQuote: async (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "approvePriceQuote",
      () => ordersApi.transition(orderId, "approveQuote"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        notify(o, "报价审核通过", `${o.serviceType}订单报价已审核通过，服务继续`, `/c/orders/${orderId}`)
      },
    )
  },

  rejectPriceQuote: async (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "rejectPriceQuote",
      () => ordersApi.transition(orderId, "rejectQuote"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        notify(o, "报价审核驳回", `${o.serviceType}订单报价被驳回，请重新报价`, `/b/service/tasks`)
      },
    )
  },

  confirmPaymentProof: async (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "confirmPaymentProof",
      () => ordersApi.transition(orderId, "confirmPayment"),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        // recordIncome 已由 server 在 transition 到 S40 时自动生成
        notify(o, "付款凭证已确认", `${o.serviceType}订单收款确认，订单已完成`, `/c/orders/${orderId}`)
      },
    )
  },

  rejectPaymentProof: async (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    await syncAction<ConvenienceOrder>(
      "rejectPaymentProof",
      () => ordersApi.update(orderId, { paymentProof: null }),
      (result) => {
        set((s) => ({ orders: replaceOrder(s.orders, orderId, result) }))
        notify(o, "付款凭证驳回", `${o.serviceType}订单付款凭证被驳回，请重新上传`, `/b/service/tasks`)
      },
    )
  },
}))