// 便民服务状态机 — 从前端 transitions.ts 迁移
//
// 状态说明:
//   S10 待派单(用户刚下单)
//   A10 派单中(调度池,尚未指派 staff)
//   A20 已派单(staff 已指派,待接单)
//   A30 已接单(staff 已接单,准备核价)
//   A35 已核价(等用户支付)
//   A40 已支付(准备开始服务)
//   S48 服务中(staff 上门)
//   S55 服务完成(等待用户确认)
//   S40 已完成
//   S50 已取消
//   S90 待人工(支付超时/系统失败,进入人工兜底)
//
// cancel 分两种:
//   - S10 / A10:transition action=cancel → 直接 S50
//   - A20+:transition action=requestCancel → 保持当前 status,但设 cancelRequested=1
//           管理员后续 approveCancel(→ S50) / rejectCancel(清 cancelRequested)
//
// requestCancel/approveCancel/rejectCancel 是「元动作」,不改 status,仅改 cancelRequested 字段。
// 由 routes/orders.js 的 transition 端点特殊处理。
const TRANSITIONS = {
  S10: { dispatch: "A10", cancel: "S50" },
  A10: { assign: "A20", cancel: "S50", autoFail: "S90" },
  A20: { accept: "A30", reject: "A10", forceCancel: "S50" },
  A30: { quote: "A35", payTimeout: "S90", forceCancel: "S50" },
  A35: { pay: "A40", payTimeout: "S90", approveQuote: "A40", rejectQuote: "A30", forceCancel: "S50" },
  A40: { startService: "S48", forceCancel: "S50" },
  S48: { complete: "S55", confirmPayment: "S40" },
  S55: { confirm: "S40", autoConfirm: "S40", confirmPayment: "S40" },
  S90: { reDispatch: "A10", forceCancel: "S50" },
}

// 元动作:改 cancelRequested 但不改 status
export const META_ACTIONS = new Set(["requestCancel", "rejectCancel"])

// approveCancel = cancelRequested=0 + status=S50(实际是 cancel 的一种)
export const APPROVE_CANCEL = "approveCancel"

// 需要校验操作人是否为指派服务人员的动作
export const STAFF_OWNERSHIP_ACTIONS = new Set([
  "accept", "reject", "quote", "startService", "complete",
  "arriveCheckin",
])

export function canTransition(from, action) {
  return TRANSITIONS[from]?.[action] ?? null
}

export function transition(from, action) {
  const next = canTransition(from, action)
  if (!next) return null
  return next
}

export function getValidActions(from) {
  return Object.keys(TRANSITIONS[from] ?? {})
}