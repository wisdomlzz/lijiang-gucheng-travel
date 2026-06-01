import type { ConvenienceStatus, ConvenienceOrder } from "../types"

export const ALL_CONVENIENCE_STATUSES: ConvenienceStatus[] = [
  "S10", "A10", "A20", "A30", "A35", "A38", "A40",
  "S48", "S55", "S40", "S50", "R80", "S90",
]

export function missingConvenienceStatuses(existing: ConvenienceOrder[]): ConvenienceStatus[] {
  const covered = new Set(existing.map((o) => o.status))
  return ALL_CONVENIENCE_STATUSES.filter((s) => !covered.has(s))
}

export function validateSeedCoverage(convExisting: ConvenienceOrder[]) {
  const convMissing = missingConvenienceStatuses(convExisting)

  if (convMissing.length > 0) {
    console.warn(`[seed] 便民订单缺失状态: ${convMissing.join(", ")}`)
  } else {
    console.log(`[seed] 便民订单全部 ${ALL_CONVENIENCE_STATUSES.length} 个状态已覆盖`)
  }

  return { convMissing }
}
