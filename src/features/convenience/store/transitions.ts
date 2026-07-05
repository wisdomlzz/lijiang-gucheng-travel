import type { ConvenienceStatus } from "../../../shared/types"

/**
 * State machine transition table.
 * Returns the next status for a given (from, action), or null if invalid.
 */
export function transition(from: ConvenienceStatus, action: string): ConvenienceStatus | null {
  const table: Record<string, Record<string, ConvenienceStatus>> = {
    S10: { dispatch: "A10", cancel: "S50" },
    A10: { assign: "A20", cancel: "S50", autoFail: "S90" },
    A20: { accept: "A30", reject: "A10" },
    A30: { quote: "A35", payTimeout: "S90" },
    A35: { pay: "A40", payTimeout: "S90" },
    A40: { startService: "S48" },
    S48: { complete: "S55" },
    S55: { confirm: "S40", autoConfirm: "S40" },
    S90: { reDispatch: "A10", forceCancel: "S50" },
  }
  return table[from]?.[action] ?? null
}
