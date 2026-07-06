// 便民服务状态机 — 从前端 transitions.ts 迁移
const TRANSITIONS = {
  S10: { dispatch: "A10", cancel: "S50" },
  A10: { assign: "A20", cancel: "S50", autoFail: "S90" },
  A20: { accept: "A30", reject: "A10" },
  A30: { quote: "A35", payTimeout: "S90" },
  A35: { pay: "A40", payTimeout: "S90", approveQuote: "A40", rejectQuote: "A30" },
  A40: { startService: "S48" },
  S48: { complete: "S55" },
  S55: { confirm: "S40", autoConfirm: "S40", confirmPayment: "S40" },
  S90: { reDispatch: "A10", forceCancel: "S50" },
}

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