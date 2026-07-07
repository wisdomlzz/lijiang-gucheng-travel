import db from "../db/connection.js"

/**
 * 根据订单状态和金额计算取消费
 * @param {string} status - 当前订单状态
 * @param {number} amount - 订单金额(priceQuote)
 * @param {object} [overrideRules] - 可选覆盖配置
 * @returns {{ cancelFee: number, rules: object }}
 */
export function calcCancelFee(status, amount, overrideRules = null) {
  const raw = overrideRules || getCancelFeeRules()
  const rules = typeof raw === "string" ? tryParse(raw) : raw

  const ratio =
    status === "S10" || status === "A10" || status === "A20"
      ? rules.beforeAccept ?? 0
      : status === "A30" || status === "A35"
        ? rules.afterAccept ?? 0.1
        : rules.afterPay ?? 0.2

  let cancelFee = Math.round((amount || 0) * ratio * 100) / 100
  const minAmount = rules.minAmount ?? 5
  const maxAmount = rules.maxAmount ?? 50
  if (cancelFee < minAmount) cancelFee = minAmount
  if (cancelFee > maxAmount) cancelFee = maxAmount
  return { cancelFee, rules }
}

function getCancelFeeRules() {
  const row = db.prepare("SELECT configValue FROM system_configs WHERE configKey = ?").get("cancelFeeRules")
  if (!row) return { beforeAccept: 0, afterAccept: 0.1, afterPay: 0.2, minAmount: 5, maxAmount: 50 }
  return tryParse(row.configValue)
}

function tryParse(v) {
  try {
    return JSON.parse(v)
  } catch {
    return { beforeAccept: 0, afterAccept: 0.1, afterPay: 0.2, minAmount: 5, maxAmount: 50 }
  }
}