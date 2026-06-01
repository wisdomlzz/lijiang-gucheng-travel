import { create } from "zustand"
import type { ConvenienceServiceType, StaffZoneAssignment, ConvenienceOrder, ConvenienceStatus, DispatchLogEntry } from "../types"
import { isPointToPoint, isZoneBased } from "../types"
import { createMachine, startTimeout, stopTimeout } from "./engine"
import { seedConvenienceOrders } from "./seed"
import { useStaffStore } from "./staff"
import { useZoneStore } from "./zones"
import { resolveStaff } from "../orders/staff"

const convenienceMachine = createMachine<ConvenienceStatus>({
  states: ["S10", "A10", "A20", "A30", "A35", "A38", "A40", "S48", "S55", "S40", "S50", "R80", "S90"],
  transitions: [
    { from: "S10", to: "A10", on: "dispatch" },
    { from: "A10", to: "A20", on: "assign" },
    { from: "A20", to: "A30", on: "accept" },
    { from: "A20", to: "A10", on: "reject" },
    { from: "A30", to: "A35", on: "quote" },
    { from: "A35", to: "A40", on: "pay" },
    { from: "A35", to: "A38", on: "priceDispute" },
    { from: "A40", to: "S48", on: "startService" },
    { from: "S48", to: "S55", on: "complete" },
    { from: "S48", to: "S40", on: "autoComplete" },
    { from: "S55", to: "S40", on: "confirm" },
    { from: "S10", to: "S50", on: "cancel" },
    { from: "A10", to: "S50", on: "cancel" },
    { from: "A20", to: "R80", on: "cancelRequest" },
    { from: "A30", to: "R80", on: "cancelRequest" },
    { from: "A35", to: "R80", on: "cancelRequest" },
    { from: "R80", to: "S50", on: "approveCancel" },
    { from: "R80", to: "S48", on: "rejectCancel" },
    { from: "A38", to: "A35", on: "overrideQuote" },
    { from: "A38", to: "S50", on: "adminCancel" },
    { from: "A35", to: "S90", on: "payTimeout" },
    { from: "A38", to: "S90", on: "negotiateTimeout" },
    { from: "S90", to: "A10", on: "reDispatch" },
    { from: "S90", to: "S50", on: "forceCancel" },
  ],
  timeouts: [
    { from: "A35", afterMs: 15 * 60 * 1000, to: "S90", on: "payTimeout" },
    { from: "A38", afterMs: 30 * 60 * 1000, to: "S90", on: "negotiateTimeout" },
    { from: "S55", afterMs: 24 * 60 * 60 * 1000, to: "S40", on: "autoConfirm" },
  ],
})

// ---- distance helpers (mock: euclidean on lat/lng) ----
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function distanceBand(distKm: number): number {
  const meters = distKm * 1000
  if (meters <= 200) return 0
  if (meters <= 500) return 1
  return 2
}

type ConvenienceState = {
  orders: ConvenienceOrder[]
  dispatchLog: DispatchLogEntry[]

  getOrdersByUser: (userId: string) => ConvenienceOrder[]
  getOrdersByStaff: (staffId: string) => ConvenienceOrder[]
  getOrder: (id: string) => ConvenienceOrder | undefined
  getPending: () => ConvenienceOrder[]
  getCancelPending: () => ConvenienceOrder[]
  getManualPending: () => ConvenienceOrder[]
  createOrder: (order: ConvenienceOrder) => void

  dispatchOrder: (orderId: string, staffId: string) => void
  assignToStaff: (orderId: string, staffId: string) => void
  autoDispatchOrder: (orderId: string) => void
  manualDispatch: (orderId: string, staffId: string) => void

  acceptOrder: (orderId: string) => void
  submitQuote: (orderId: string, price: number) => void
  priceDispute: (orderId: string) => void
  submitPriceDispute: (orderId: string, dispute: {
    targetPrice?: number
    reason?: string
    images?: string[]
  }) => void
  resolvePriceDispute: (orderId: string, action: "override" | "cancel", newPrice?: number, remark?: string) => void
  markPaid: (orderId: string, method: "online" | "cash") => void
  startService: (orderId: string) => void
  uploadPaymentProof: (orderId: string, url: string) => void
  completeService: (orderId: string, photos: string[]) => void
  confirmComplete: (orderId: string) => void
  rateOrder: (orderId: string, rating: number) => void

  requestCancel: (orderId: string) => void
  approveCancel: (orderId: string) => void
  rejectCancel: (orderId: string) => void
  forceCancel: (orderId: string) => void
  reDispatch: (orderId: string, staffId: string) => void
}

function rankStaffForOrder(order: ConvenienceOrder): { staffId: string; distance: number }[] {
  const staff = useStaffStore.getState().staff
  const available = staff.filter(
    (s) => s.enabled && s.status === "online" && s.serviceTypes?.includes(order.serviceType as ConvenienceServiceType)
  )
  if (available.length === 0) return []

  if (isPointToPoint(order.serviceType)) {
    const orderLat = order.lat ?? 26.874
    const orderLng = order.lng ?? 100.234
    const scored = available
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => ({
        staffId: s.id,
        distance: distanceKm(orderLat, orderLng, s.lat!, s.lng!),
        assignedOrders: s.assignedOrders,
      }))
    // group by distance band, within band pick fewest assignedOrders
    const bandMap = new Map<number, typeof scored>()
    for (const s of scored) {
      const band = distanceBand(s.distance)
      if (!bandMap.has(band)) bandMap.set(band, [])
      bandMap.get(band)!.push(s)
    }
    const sortedBands = [...bandMap.entries()].sort((a, b) => a[0] - b[0])
    const bestBand = sortedBands[0][1].sort((a, b) => a.assignedOrders - b.assignedOrders)
    return bestBand.map((s) => ({ staffId: s.staffId, distance: s.distance }))
  }

  if (isZoneBased(order.serviceType)) {
    const zoneStore = useZoneStore.getState()
    const zone = zoneStore.getZoneByAddress(order.address)
    if (!zone) return []
    const zoneStaff = available.filter((s) => s.zoneIds?.includes(zone.id))
    return zoneStaff
      .sort((a, b) => a.assignedOrders - b.assignedOrders)
      .map((s) => ({ staffId: s.id, distance: 0 }))
  }

  return available.map((s) => ({ staffId: s.id, distance: 0 }))
}

export const useConvenienceStore = create<ConvenienceState>((set, get) => ({
  orders: seedConvenienceOrders,
  dispatchLog: [],

  getOrdersByUser: (userId) => get().orders.filter((o) => o.userId === userId),
  getOrdersByStaff: (staffId) => get().orders.filter((o) => o.staffId === staffId),
  getOrder: (id) => get().orders.find((o) => o.id === id),
  getPending: () => get().orders.filter((o) => o.status === "S10" || o.status === "A10"),
  getCancelPending: () => get().orders.filter((o) => o.status === "R80"),
  getManualPending: () => get().orders.filter((o) => o.status === "S10" || o.status === "A10" || o.status === "S90"),

  createOrder: (order) => {
    const newOrder = { ...order, status: "S10" as ConvenienceStatus }
    set((s) => ({ orders: [newOrder, ...s.orders] }))
    // trigger auto dispatch
    setTimeout(() => get().autoDispatchOrder(newOrder.id), 500)
  },

  // ---- auto-dispatch engine ----
  autoDispatchOrder: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId)
    if (!order) return
    if (!["S10", "A10", "S90"].includes(order.status)) return

    if (order.status === "S10") {
      if (!convenienceMachine.canTransition(order.status, "A10", "dispatch")) return
      set((s) => ({
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: "A10" as ConvenienceStatus } : o)),
      }))
    }

    if (order.status === "S90") {
      if (!convenienceMachine.canTransition(order.status, "A10", "reDispatch")) return
      set((s) => ({
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: "A10" as ConvenienceStatus } : o)),
      }))
    }

    const ranked = rankStaffForOrder(order)
    if (ranked.length === 0) {
      get()._logDispatch(orderId, "auto_fail", undefined, "无可用服务人员")
      return
    }

    // try up to 3 different staff
    const triedIds = new Set<string>()
    const maxAttempts = Math.min(3, ranked.length)
    let assigned = false

    for (let i = 0; i < maxAttempts; i++) {
      const candidate = ranked[i]
      if (triedIds.has(candidate.staffId)) continue
      triedIds.add(candidate.staffId)

      // simulate 70% accept chance on first try, 50% on retry, 30% on third
      const acceptChance = i === 0 ? 0.7 : i === 1 ? 0.5 : 0.3
      if (Math.random() < acceptChance) {
        const staff = resolveStaff(candidate.staffId)
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "A20" as ConvenienceStatus,
                  staffId: candidate.staffId,
                  staffName: staff?.name ?? "",
                  staffPhone: staff?.phone ?? "",
                }
              : o
          ),
        }))
        get()._logDispatch(orderId, "auto_success", candidate.staffId, staff?.name ?? "")
        assigned = true
        break
      } else {
        get()._logDispatch(orderId, "retry", candidate.staffId, `第${i + 1}次被拒`)
      }
    }

    if (!assigned) {
      // all 3 rejected → stays at A10 for manual dispatch
      get()._logDispatch(orderId, "auto_fail", undefined, "3次自动派单均被拒，等待人工处理")
    }
  },

  _logDispatch: (orderId, type, staffId, reason) => {
    const staff = staffId ? resolveStaff(staffId) : undefined
    set((s) => ({
      dispatchLog: [
        { orderId, type, staffId, staffName: staff?.name, reason, timestamp: new Date().toISOString() },
        ...s.dispatchLog,
      ],
    }))
  },

  // ---- manual dispatch fallback ----
  manualDispatch: (orderId, staffId) => {
    const staff = resolveStaff(staffId)
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o
        const canAssign = convenienceMachine.canTransition(o.status, "A20", "assign")
        const canDispatchThenAssign = convenienceMachine.canTransition(o.status, "A10", "dispatch")
          && convenienceMachine.canTransition("A10", "A20", "assign")
        const canRedispatchThenAssign = convenienceMachine.canTransition(o.status, "A10", "reDispatch")
          && convenienceMachine.canTransition("A10", "A20", "assign")
        return canAssign || canDispatchThenAssign || canRedispatchThenAssign
          ? { ...o, status: "A20" as ConvenienceStatus, staffId, staffName: staff?.name ?? "", staffPhone: staff?.phone ?? "" }
          : o
      }),
    }))
    get()._logDispatch(orderId, "manual", staffId, staff?.name)
  },

  dispatchOrder: (orderId, staffId) =>
    set((s) => {
      const staff = resolveStaff(staffId)
      return {
        orders: s.orders.map((o) => {
          if (o.id !== orderId) return o
          if (convenienceMachine.canTransition(o.status, "A10", "dispatch")) {
            return { ...o, status: "A10" as ConvenienceStatus, staffId, staffName: staff?.name ?? "", staffPhone: staff?.phone ?? "" }
          }
          return o
        }),
      }
    }),

  assignToStaff: (orderId, staffId) =>
    set((s) => {
      const staff = resolveStaff(staffId)
      return {
        orders: s.orders.map((o) =>
          o.id === orderId && convenienceMachine.canTransition(o.status, "A20", "assign")
            ? { ...o, status: "A20" as ConvenienceStatus, staffId, staffName: staff?.name ?? "", staffPhone: staff?.phone ?? "" }
            : o
        ),
      }
    }),

  acceptOrder: (orderId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && convenienceMachine.canTransition(o.status, "A30", "accept")
          ? { ...o, status: "A30" as ConvenienceStatus }
          : o
      ),
    })),

  submitQuote: (orderId, price) => {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && convenienceMachine.canTransition(o.status, "A35", "quote")
          ? { ...o, status: "A35" as ConvenienceStatus, priceQuote: price }
          : o
      ),
    }))
    const order = get().orders.find((o) => o.id === orderId)
    if (order?.status === "A35") {
      const timeout = convenienceMachine.timeoutMap.get("A35:payTimeout")
      if (timeout) {
        startTimeout(`conv:${orderId}:pay`, timeout.afterMs, () => {
          const current = useConvenienceStore.getState().orders.find((o) => o.id === orderId)
          if (current?.status === "A35") {
            useConvenienceStore.setState((s) => ({
              orders: s.orders.map((o) =>
                o.id === orderId ? { ...o, status: "S90" as ConvenienceStatus } : o
              ),
            }))
          }
        })
      }
    }
  },

  priceDispute: (orderId) => {
    stopTimeout(`conv:${orderId}:pay`)
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && convenienceMachine.canTransition(o.status, "A38", "priceDispute")
          ? { ...o, status: "A38" as ConvenienceStatus }
          : o
      ),
    }))
    const order = get().orders.find((o) => o.id === orderId)
    if (order?.status === "A38") {
      const timeout = convenienceMachine.timeoutMap.get("A38:negotiateTimeout")
      if (timeout) {
        startTimeout(`conv:${orderId}:negotiate`, timeout.afterMs, () => {
          const current = useConvenienceStore.getState().orders.find((o) => o.id === orderId)
          if (current?.status === "A38") {
            useConvenienceStore.setState((s) => ({
              orders: s.orders.map((o) =>
                o.id === orderId ? { ...o, status: "S90" as ConvenienceStatus } : o
              ),
            }))
          }
        })
      }
    }
  },

  resolvePriceDispute: (orderId, action, newPrice, remark) => {
    stopTimeout(`conv:${orderId}:negotiate`)
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o
        if (action === "override" && convenienceMachine.canTransition(o.status, "A35", "overrideQuote")) {
          return { ...o, status: "A35" as ConvenienceStatus, priceQuote: newPrice ?? o.priceQuote, arbitrationRemark: remark || o.arbitrationRemark }
        }
        if (action === "cancel" && convenienceMachine.canTransition(o.status, "S50", "adminCancel")) {
          return { ...o, status: "S50" as ConvenienceStatus, arbitrationRemark: remark || o.arbitrationRemark }
        }
        return o
      }),
    }))
    if (action === "override") {
      const order = get().orders.find((o) => o.id === orderId)
      if (order?.status === "A35") {
        const timeout = convenienceMachine.timeoutMap.get("A35:payTimeout")
        if (timeout) {
          startTimeout(`conv:${orderId}:pay`, timeout.afterMs, () => {
            const current = useConvenienceStore.getState().orders.find((o) => o.id === orderId)
            if (current?.status === "A35") {
              useConvenienceStore.setState((s) => ({
                orders: s.orders.map((o) =>
                  o.id === orderId ? { ...o, status: "S90" as ConvenienceStatus } : o
                ),
              }))
            }
          })
        }
      }
    }
  },

  markPaid: (orderId, method) => {
    stopTimeout(`conv:${orderId}:pay`)
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o
        return convenienceMachine.canTransition(o.status, "A40", "pay")
          ? { ...o, status: "A40" as ConvenienceStatus, payMethod: method }
          : o
      }),
    }))
  },

  startService: (orderId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && convenienceMachine.canTransition(o.status, "S48", "startService")
          ? { ...o, status: "S48" as ConvenienceStatus }
          : o
      ),
    })),

  uploadPaymentProof: (orderId, url) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, paymentProof: url } : o
      ),
    })),

  completeService: (orderId, photos) => {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && convenienceMachine.canTransition(o.status, "S55", "complete")
          ? { ...o, status: "S55" as ConvenienceStatus, completionPhotos: photos }
          : o
      ),
    }))
    const order = get().orders.find((o) => o.id === orderId)
    if (order?.status === "S55") {
      const timeout = convenienceMachine.timeoutMap.get("S55:autoConfirm")
      if (timeout) {
        startTimeout(`conv:${orderId}:autoConfirm`, timeout.afterMs, () => {
          const current = useConvenienceStore.getState().orders.find((o) => o.id === orderId)
          if (current?.status === "S55") {
            useConvenienceStore.getState().confirmComplete(orderId)
          }
        })
      }
    }
  },

  confirmComplete: (orderId) => {
    stopTimeout(`conv:${orderId}:autoConfirm`)
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && convenienceMachine.canTransition(o.status, "S40", "confirm")
          ? { ...o, status: "S40" as ConvenienceStatus, completedAt: new Date().toISOString() }
          : o
      ),
    }))
  },

  rateOrder: (orderId, rating) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, rating, ratedAt: new Date().toISOString() } : o
      ),
    })),

  submitPriceDispute: (orderId, dispute) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "A38" as ConvenienceStatus,
              priceDispute: {
                targetPrice: dispute.targetPrice,
                reason: dispute.reason,
                images: dispute.images,
                submittedAt: new Date().toISOString(),
              },
            }
          : o
      ),
    })),

  requestCancel: (orderId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && (convenienceMachine.canTransition(o.status, "S50", "cancel")
          ? { ...o, status: "S50" as ConvenienceStatus }
          : convenienceMachine.canTransition(o.status, "R80", "cancelRequest")
            ? { ...o, status: "R80" as ConvenienceStatus, previousStatus: o.status }
            : o)
      ),
    })),

  approveCancel: (orderId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && convenienceMachine.canTransition(o.status, "S50", "approveCancel")
          ? { ...o, status: "S50" as ConvenienceStatus }
          : o
      ),
    })),

  rejectCancel: (orderId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && o.status === "R80"
          ? { ...o, status: (o.previousStatus ?? "S48") as ConvenienceStatus, previousStatus: undefined }
          : o
      ),
    })),

  forceCancel: (orderId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && convenienceMachine.canTransition(o.status, "S50", "forceCancel")
          ? { ...o, status: "S50" as ConvenienceStatus }
          : o
      ),
    })),

  reDispatch: (orderId, staffId) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId && convenienceMachine.canTransition(o.status, "A10", "reDispatch")
          ? { ...o, status: "A10" as ConvenienceStatus, staffId }
          : o
      ),
    })),
}))
