import { create } from "zustand"
import type { ConvenienceServiceType, ConvenienceOrder, ConvenienceStatus, DispatchLogEntry } from "../types"
import { isPointToPoint, isZoneBased } from "../types"
import { useSettlementStore } from "../settlement"

// ---- Simplified status transition table ----
// Returns the next status for a given (from, action), or null if invalid
function transition(from: ConvenienceStatus, action: string): ConvenienceStatus | null {
  const table: Record<string, Record<string, ConvenienceStatus>> = {
    S10: { dispatch: "A10", cancel: "S50" },
    A10: { assign: "A20", cancel: "S50", autoFail: "S90" },
    A20: { accept: "A30", reject: "A10", cancelRequest: "R80" },
    A30: { quote: "A35", cancelRequest: "R80" },
    A35: { pay: "A40", priceDispute: "A38", payTimeout: "S90" },
    A38: { overrideQuote: "A35", adminCancel: "S50", negotiateTimeout: "S90" },
    A40: { startService: "S48" },
    S48: { complete: "S55" },
    S55: { confirm: "S40", autoConfirm: "S40" },
    R80: { approveCancel: "S50", rejectCancel: "S48" },
    S90: { reDispatch: "A10", forceCancel: "S50" },
  }
  return table[from]?.[action] ?? null
}

// ---- Simplified dispatch: pick the first online staff for this service type ----
function pickStaff(orderServiceType: string): { id: string; name: string; phone: string } | null {
  // We import inline to avoid circular dependency. Store uses a simple static list.
  const STAFF = [
    { id: "s1", name: "李师傅", phone: "139****6666", types: ["行李搬运", "送货服务"] as ConvenienceServiceType[], zones: [] as string[], online: true },
    { id: "s5", name: "王师傅", phone: "139****6670", types: ["行李搬运", "送货服务"], zones: [], online: true },
    { id: "s2", name: "赵丹", phone: "139****6667", types: ["行李搬运", "送货服务"], zones: [], online: true },
    { id: "s6", name: "张环卫", phone: "139****6671", types: ["生活垃圾清运", "建筑垃圾清运"], zones: ["zone_core", "zone_south"], online: true },
    { id: "s7", name: "刘环卫", phone: "139****6672", types: ["生活垃圾清运"], zones: ["zone_inn"], online: true },
    { id: "s3", name: "马师傅", phone: "139****6668", types: ["生活垃圾清运", "建筑垃圾清运"], zones: ["zone_core"], online: true },
    { id: "s8", name: "送水工老赵", phone: "139****6673", types: ["送水服务"], zones: ["zone_core", "zone_inn"], online: true },
    { id: "s9", name: "送水工小陈", phone: "139****6674", types: ["送水服务"], zones: ["zone_south"], online: true },
    { id: "s4", name: "小陈", phone: "139****6669", types: ["布草配送", "送水服务"], zones: ["zone_inn"], online: true },
    { id: "s10", name: "布草老黄", phone: "139****6675", types: ["布草配送"], zones: ["zone_core", "zone_inn"], online: true },
    { id: "s11", name: "建筑垃圾老王", phone: "139****6676", types: ["建筑垃圾清运"], zones: ["zone_outskirt"], online: true },
  ]
  const match = STAFF.find((s) => s.online && s.types.includes(orderServiceType as ConvenienceServiceType))
  return match ? { id: match.id, name: match.name, phone: match.phone } : null
}

// ---- Seed orders (from seed.ts, simplified to essential fields) ----
const SEED: ConvenienceOrder[] = [
  // S10 - 已下单
  { id: "CO20260511005", userId: "u_c_001", serviceType: "送货服务", address: "五一街文治巷88号", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], note: "一箱饮料，约15kg", preferredTime: "尽快", status: "S10", createdAt: "2026-05-11 15:30", lat: 26.878, lng: 100.239 },
  { id: "CO20260512001", userId: "u_c_001", serviceType: "送货服务", address: "新华街黄山下段45号", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], note: "米面粮油，约20kg", preferredTime: "上午", status: "S10", createdAt: "2026-05-12 08:00", lat: 26.875, lng: 100.233 },
  { id: "CO20260512006", userId: "u_c_001", serviceType: "布草配送", address: "茶马古道客栈·五一街", images: ["https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400"], note: "布草配送，20套", preferredTime: "14:00", status: "S10", createdAt: "2026-05-12 09:00", lat: 26.880, lng: 100.240 },
  // A10 - 待派单
  { id: "CO20260511006", userId: "u_c_001", serviceType: "建筑垃圾清运", address: "新华街翠文段22号", images: ["https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400"], note: "装修废料，约8袋", preferredTime: "14:00", status: "A10", createdAt: "2026-05-11 14:00", lat: 26.875, lng: 100.232 },
  { id: "CO20260512004", userId: "u_c_001", serviceType: "生活垃圾清运", address: "五一街文治巷", images: ["https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400"], note: "约2袋", preferredTime: "09:00", status: "A10", createdAt: "2026-05-12 08:30", lat: 26.879, lng: 100.238 },
  { id: "CO20260512005", userId: "u_c_001", serviceType: "布草配送", address: "御客栈·总店", images: ["https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400"], note: "更换床单被套，共15套", preferredTime: "尽快", status: "A10", createdAt: "2026-05-12 06:00", lat: 26.876, lng: 100.238 },
  { id: "CO20260512003", userId: "u_c_001", serviceType: "建筑垃圾清运", address: "民主路68号工地", images: ["https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400"], note: "装修垃圾约15袋", preferredTime: "上午", status: "S10", createdAt: "2026-05-12 07:00", lat: 26.863, lng: 100.226 },
  // A20 - 已指派
  { id: "CO20260511001", userId: "u_c_001", serviceType: "行李搬运", address: "古城南门入口处", addressTo: "五一街兴仁巷12号", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "两个28寸行李箱", preferredTime: "尽快", status: "A20", createdAt: "2026-05-11 09:12", staffId: "s1", staffName: "李师傅", staffPhone: "139****6666", lat: 26.868, lng: 100.234 },
  // A30 - 已接单
  { id: "CO20260512007", userId: "u_c_001", serviceType: "行李搬运", address: "七一街兴文巷32号", addressTo: "五一街振兴巷18号", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "2个行李箱", preferredTime: "10:00", status: "A30", createdAt: "2026-05-12 08:00", staffId: "s1", staffName: "王师傅", staffPhone: "138****1234", lat: 26.870, lng: 100.236 },
  // A35 - 已核价
  { id: "CO20260511007", userId: "u_c_001", serviceType: "送水服务", address: "光义街现文巷15号", images: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400"], note: "3桶矿泉水", preferredTime: "16:00-17:00", status: "A35", priceQuote: 45, refPrice: 35, payMethod: "online", createdAt: "2026-05-11 11:00", staffId: "s8", staffName: "送水工老赵", staffPhone: "139****6673", lat: 26.874, lng: 100.234 },
  // A38 - 协商中
  { id: "CO20260510010", userId: "u_c_001", serviceType: "行李搬运", address: "古城南门", addressTo: "七一街崇仁巷", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "4件行李，用户对价格有异议", preferredTime: "尽快", status: "A38", priceQuote: 100, refPrice: 80, payMethod: "online", createdAt: "2026-05-10 16:00", staffId: "s1", staffName: "李师傅", staffPhone: "139****6666", lat: 26.868, lng: 100.234 },
  // A40 - 已收款
  { id: "CO20260512008", userId: "u_c_001", serviceType: "送水服务", address: "光义街现文巷28号", images: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400"], note: "2桶矿泉水", preferredTime: "14:00-15:00", status: "A40", priceQuote: 30, refPrice: 25, payMethod: "online", createdAt: "2026-05-12 11:00", staffId: "s8", staffName: "送水工老赵", staffPhone: "139****5678", lat: 26.874, lng: 100.234 },
  // S48 - 服务中
  { id: "CO20260510003", userId: "u_c_001", serviceType: "送水服务", address: "新华街翠文段8号", images: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400"], note: "4桶矿泉水", preferredTime: "10:00-11:00", status: "S48", priceQuote: 40, refPrice: 35, payMethod: "online", createdAt: "2026-05-10 10:30", staffId: "s8", staffName: "送水工老赵", staffPhone: "139****5678", lat: 26.875, lng: 100.232 },
  // S55 - 完工待确认
  { id: "CO20260509000", userId: "u_c_001", serviceType: "行李搬运", address: "古城北门 → 四方街", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "3个行李箱，需要推车", preferredTime: "尽快", status: "S55", priceQuote: 80, refPrice: 70, payMethod: "online", createdAt: "2026-05-09 10:00", staffId: "s1", staffName: "李师傅", staffPhone: "139****6666", completionPhotos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], lat: 26.872, lng: 100.230 },
  // S40 - 已完成
  { id: "CO20260509001", userId: "u_c_001", serviceType: "行李搬运", address: "古城东门 → 七一街", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "", preferredTime: "上午", status: "S40", priceQuote: 60, refPrice: 50, payMethod: "online", createdAt: "2026-05-09 08:42", completedAt: "2026-05-09T12:00:00.000Z", staffId: "s1", staffName: "李师傅", lat: 26.870, lng: 100.237 },
  { id: "CO20260507002", userId: "u_c_001", serviceType: "生活垃圾清运", address: "光义街·茶马客栈", images: ["https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400"], note: "约3袋生活垃圾", preferredTime: "下午", status: "S40", priceQuote: 45, refPrice: 30, payMethod: "cash", createdAt: "2026-05-07 16:12", completedAt: "2026-05-07T18:00:00.000Z", staffId: "s6", staffName: "张环卫", lat: 26.874, lng: 100.233 },
  { id: "CO20260508001", userId: "u_c_001", serviceType: "送水服务", address: "御客栈·三号院", images: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400"], note: "2桶矿泉水", preferredTime: "尽快", status: "S40", priceQuote: 40, refPrice: 35, payMethod: "cash", createdAt: "2026-05-08 07:30", completedAt: "2026-05-08T10:00:00.000Z", staffId: "s8", lat: 26.879, lng: 100.238 },
  // S50 - 已取消
  { id: "CO20260507003", userId: "u_c_001", serviceType: "行李搬运", address: "古城南门 → 七一街", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "改约时间", preferredTime: "上午", status: "S50", createdAt: "2026-05-07 10:25", staffId: "s1", lat: 26.868, lng: 100.234 },
  // R80 - 取消审批中
  { id: "CO20260509005", userId: "u_c_001", serviceType: "送水服务", address: "御客栈·二号院", images: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400"], note: "2桶矿泉水，用户申请取消", preferredTime: "尽快", status: "R80", priceQuote: 30, refPrice: 25, payMethod: "online", createdAt: "2026-05-09 14:00", staffId: "s8", lat: 26.879, lng: 100.238 },
  // S90 - 待人工处理
  { id: "CO20260508003", userId: "u_c_001", serviceType: "行李搬运", address: "古城北门", addressTo: "五一街振兴巷", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "3个行李箱，在线支付超时", preferredTime: "上午", status: "S90", priceQuote: 70, refPrice: 60, payMethod: "online", createdAt: "2026-05-08 09:00", staffId: "s1", lat: 26.872, lng: 100.230 },
]

// ---- Timeout manager (simplified) ----
const timers = new Map<string, ReturnType<typeof setTimeout>>()
function setTimer(key: string, ms: number, cb: () => void) { clearTimeout(key); timers.set(key, setTimeout(cb, ms)) }
function clearTimeout(key: string) { const t = timers.get(key); if (t) { clearInterval(t); timers.delete(key) } }

// ---- Store ----
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
  dispatchOrder: (orderId: string) => void                     // S10→A10
  autoDispatchOrder: (orderId: string) => void                 // S10→A10→A20 auto assign
  assignToStaff: (orderId: string) => void                     // A10/A90→A20
  manualDispatch: (orderId: string, staffId: string) => void   // A10→A20 with specific staff
  acceptOrder: (orderId: string) => void                       // A20→A30
  submitQuote: (orderId: string, price: number) => void        // A30→A35
  markPaid: (orderId: string, method: "online" | "cash") => void  // A35→A40
  startService: (orderId: string) => void                      // A40→S48
  completeService: (orderId: string, photos: string[]) => void  // S48→S55
  confirmComplete: (orderId: string) => void                   // S55→S40
  rateOrder: (orderId: string, rating: number) => void

  priceDispute: (orderId: string) => void                     // A35→A38
  resolvePriceDispute: (orderId: string, action: "override" | "cancel", newPrice?: number) => void
  submitPriceDispute: (orderId: string, dispute: { targetPrice?: number; reason?: string; images?: string[] }) => void

  requestCancel: (orderId: string) => void                    // →S50 or →R80
  approveCancel: (orderId: string) => void                    // R80→S50
  rejectCancel: (orderId: string) => void                     // R80→S48
  forceCancel: (orderId: string) => void                      // S90→S50
  reDispatch: (orderId: string) => void                       // S90→A10

  uploadPaymentProof: (orderId: string, url: string) => void
}

export const useConvenienceStore = create<ConvenienceState>((set, get) => ({
  orders: SEED,
  dispatchLog: [],

  getOrdersByUser: (userId) => get().orders.filter((o) => o.userId === userId),
  getOrdersByStaff: (staffId) => get().orders.filter((o) => o.staffId === staffId),
  getOrder: (id) => get().orders.find((o) => o.id === id),
  getPending: () => get().orders.filter((o) => o.status === "S10" || o.status === "A10"),
  getCancelPending: () => get().orders.filter((o) => o.status === "R80"),
  getManualPending: () => get().orders.filter((o) => ["S10", "A10", "S90"].includes(o.status)),

  // ---- Order lifecycle ----
  createOrder: (order) => {
    const newOrder = { ...order, status: "S10" as ConvenienceStatus }
    set((s) => ({ orders: [newOrder, ...s.orders] }))
    // Auto-dispatch after 500ms demo delay
    setTimeout(() => get().dispatchOrder(newOrder.id), 500)
  },

  dispatchOrder: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId)
    if (!order) return
    if (!transition(order.status, "dispatch")) return
    const next = transition(order.status, "dispatch")!
    set((s) => ({ orders: s.orders.map((o) => o.id === orderId ? { ...o, status: next } : o) }))
  },

  assignToStaff: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId)
    if (!order) return
    const valid = transition(order.status, "assign") || transition(order.status, "reDispatch")
    if (!valid) return
    const next = (order.status === "S90") ? transition(order.status, "reDispatch")! : transition(order.status, "assign")!
    const staff = pickStaff(order.serviceType)
    set((s) => ({ orders: s.orders.map((o) => o.id === orderId ? { ...o, status: next, staffId: staff?.id ?? "", staffName: staff?.name ?? "", staffPhone: staff?.phone ?? "" } : o) }))
    set((s) => ({ dispatchLog: [{ orderId, type: "manual", staffId: staff?.id, staffName: staff?.name, reason: "手动指派", timestamp: new Date().toISOString() }, ...s.dispatchLog] }))
  },

  // S10→A10→A20: auto-dispatch pipeline
  autoDispatchOrder: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    // S10 → A10
    const next = transition(o.status, "dispatch")
    if (!next) return
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: next } : x) }))
    // A10 → A20 auto-assign
    get().assignToStaff(orderId)
  },

  // Force assign to a specific staff member
  manualDispatch: (orderId, staffId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    const STAFF = [
      { id: "s1", name: "李师傅", phone: "139****6666" }, { id: "s5", name: "王师傅", phone: "139****6670" },
      { id: "s2", name: "赵丹", phone: "139****6667" }, { id: "s6", name: "张环卫", phone: "139****6671" },
      { id: "s7", name: "刘环卫", phone: "139****6672" }, { id: "s3", name: "马师傅", phone: "139****6668" },
      { id: "s8", name: "送水工老赵", phone: "139****6673" }, { id: "s9", name: "送水工小陈", phone: "139****6674" },
      { id: "s4", name: "小陈", phone: "139****6669" }, { id: "s10", name: "布草老黄", phone: "139****6675" },
      { id: "s11", name: "建筑垃圾老王", phone: "139****6676" },
    ]
    const staff = STAFF.find((s) => s.id === staffId)
    const valid = transition(o.status, "assign") || transition(o.status, "reDispatch")
    if (!valid) return
    const next = transition(o.status, "assign") || transition(o.status, "reDispatch")!
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: next, staffId, staffName: staff?.name ?? "", staffPhone: staff?.phone ?? "" } : x) }))
    set((s) => ({ dispatchLog: [{ orderId, type: "manual", staffId, staffName: staff?.name, reason: "手动指派", timestamp: new Date().toISOString() }, ...s.dispatchLog] }))
  },

  acceptOrder: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "accept")) return
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: transition(o.status, "accept")! } : x) }))
  },

  submitQuote: (orderId, price) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "quote")) return
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: transition(o.status, "quote")!, priceQuote: price } : x) }))
    // Simulate payment timeout (15s for demo)
    setTimer(`conv:${orderId}:pay`, 15000, () => {
      const order = get().orders.find((o) => o.id === orderId)
      if (order?.status === "A35") { set((s) => ({ orders: s.orders.map((o) => o.id === orderId ? { ...o, status: "S90" as ConvenienceStatus } : o) })) }
    })
  },

  markPaid: (orderId, method) => {
    clearTimeout(`conv:${orderId}:pay`); clearTimeout(`conv:${orderId}:negotiate`)
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "pay")) return
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: transition(o.status, "pay")!, payMethod: method } : x) }))
  },

  startService: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "startService")) return
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: transition(o.status, "startService")! } : x) }))
  },

  completeService: (orderId, photos) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "complete")) return
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: transition(o.status, "complete")!, completionPhotos: photos } : x) }))
    // Auto-confirm after 30s for demo
    setTimer(`conv:${orderId}:autoConfirm`, 30000, () => get().confirmComplete(orderId))
  },

  confirmComplete: (orderId) => {
    clearTimeout(`conv:${orderId}:autoConfirm`)
    const o = get().orders.find((x) => x.id === orderId)
    const next = transition(o?.status ?? "S55", "confirm") || transition(o?.status ?? "S55", "autoConfirm")
    if (!next) return
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: next, completedAt: new Date().toISOString() } : x) }))
    // 跨域联动：订单完成 → 自动录入结算收入
    if (o && o.priceQuote && o.staffId) {
      useSettlementStore.getState().recordIncome({
        orderId: o.id, staffId: o.staffId, staffName: o.staffName ?? "",
        serviceType: String(o.serviceType), amount: o.priceQuote,
        payMethod: o.payMethod ?? "online",
      })
    }
  },

  rateOrder: (orderId, rating) => set((s) => ({ orders: s.orders.map((o) => o.id === orderId ? { ...o, rating, ratedAt: new Date().toISOString() } : o) })),

  // ---- Price dispute ----
  priceDispute: (orderId) => {
    clearTimeout(`conv:${orderId}:pay`)
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "priceDispute")) return
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: transition(o.status, "priceDispute")! } : x) }))
    setTimer(`conv:${orderId}:negotiate`, 30000, () => {
      const order = get().orders.find((o) => o.id === orderId)
      if (order?.status === "A38") { set((s) => ({ orders: s.orders.map((o) => o.id === orderId ? { ...o, status: "S90" as ConvenienceStatus } : o) })) }
    })
  },

  resolvePriceDispute: (orderId, action, newPrice) => {
    clearTimeout(`conv:${orderId}:negotiate`)
    const order = get().orders.find((o) => o.id === orderId)
    if (!order || order.status !== "A38") return
    if (action === "override") {
      const next = transition("A38", "overrideQuote")
      set((s) => ({ orders: s.orders.map((o) => o.id === orderId ? { ...o, status: next ?? "A35", priceQuote: newPrice ?? o.priceQuote } : o) }))
      setTimer(`conv:${orderId}:pay`, 15000, () => {
        const current = get().orders.find((o) => o.id === orderId)
        if (current?.status === "A35") { set((s) => ({ orders: s.orders.map((o) => o.id === orderId ? { ...o, status: "S90" as ConvenienceStatus } : o) })) }
      })
    } else {
      const next = transition("A38", "adminCancel")
      if (next) set((s) => ({ orders: s.orders.map((o) => o.id === orderId ? { ...o, status: next } : o) }))
    }
  },

  submitPriceDispute: (orderId, dispute) => set((s) => ({ orders: s.orders.map((o) => o.id === orderId ? { ...o, status: "A38" as ConvenienceStatus, priceDispute: { ...dispute, submittedAt: new Date().toISOString() } } : o) })),

  // ---- Cancel flow ----
  requestCancel: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o) return
    // S10 or A10 → direct cancel
    const directCancel = transition(o.status, "cancel")
    if (directCancel) { set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: directCancel } : x) })); return }
    // A20+ → cancel request (R80)
    const cancelReq = transition(o.status, "cancelRequest")
    if (cancelReq) { set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: cancelReq, previousStatus: o.status } : x) })) }
  },

  approveCancel: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || o.status !== "R80" || !transition("R80", "approveCancel")) return
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: "S50" as ConvenienceStatus } : x) }))
  },

  rejectCancel: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || o.status !== "R80") return
    const next = transition("R80", "rejectCancel")
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: (next ?? (o.previousStatus ?? "S48")) as ConvenienceStatus, previousStatus: undefined } : x) }))
  },

  forceCancel: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || !transition(o.status, "forceCancel")) return
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: "S50" as ConvenienceStatus } : x) }))
  },

  reDispatch: (orderId) => {
    clearTimeout(`conv:${orderId}:pay`); clearTimeout(`conv:${orderId}:negotiate`)
    const o = get().orders.find((x) => x.id === orderId)
    if (!o || o.status !== "S90" || !transition("S90", "reDispatch")) return
    set((s) => ({ orders: s.orders.map((x) => x.id === orderId ? { ...x, status: "A10" as ConvenienceStatus } : x) }))
  },

  uploadPaymentProof: (orderId, url) => set((s) => ({ orders: s.orders.map((o) => o.id === orderId ? { ...o, paymentProof: url } : o) })),
}))
