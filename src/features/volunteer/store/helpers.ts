import type { VolunteerActivity, VolunteerActivityStatus } from "@/shared/types"

// ── helpers ──

export function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}
export function minutesAgo(m: number) {
  return fmt(new Date(Date.now() - m * 60000))
}
export function offsetDate(days = 0, h?: number, m?: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  if (h !== undefined) d.setHours(h, m ?? 0, 0, 0)
  return d
}
export function isOverlap(a1: string, a2: string, b1: string, b2: string) {
  return a1 < b2 && a2 > b1
}

/** 根据活动的 timeMode 生成每日时段列表
 *  single → [{ date, start, end }] 只一天
 *  multi  → [{ date, start, end }] × N 天
 */
export function getDaySlots(
  act: Pick<VolunteerActivity, "startTime" | "endTime" | "timeMode" | "dailyStartTime" | "dailyEndTime">
): { date: string; dayStart: string; dayEnd: string }[] {
  const start = new Date(act.startTime)
  const end = new Date(act.endTime)

  if (act.timeMode === "single") {
    return [{ date: start.toISOString().slice(0, 10), dayStart: act.startTime, dayEnd: act.endTime }]
  }

  // multi: 首尾日期区间，每天用 dailyStartTime/dailyEndTime
  const [dh, dm] = (act.dailyStartTime || "09:00").split(":").map(Number)
  const [deh, dem] = (act.dailyEndTime || "17:00").split(":").map(Number)
  const slots: { date: string; dayStart: string; dayEnd: string }[] = []
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  while (cur <= last) {
    const ds = new Date(cur)
    ds.setHours(dh, dm, 0, 0)
    const de = new Date(cur)
    de.setHours(deh, dem, 0, 0)
    slots.push({ date: cur.toISOString().slice(0, 10), dayStart: fmt(ds), dayEnd: fmt(de) })
    cur.setDate(cur.getDate() + 1)
  }
  return slots
}

export const NOW = new Date()

// ── activity transition table ──

export function actTransition(from: VolunteerActivityStatus, action: string): VolunteerActivityStatus | null {
  const table: Record<VolunteerActivityStatus, Record<string, VolunteerActivityStatus>> = {
    draft: { publish: "published", cancel: "cancelled" },
    published: { cancel: "cancelled", forceEnd: "ended" },
    in_progress: { forceEnd: "ended", cancel: "cancelled" },
    ended: {},
    cancelled: {},
  }
  return table[from]?.[action] ?? null
}