// ── timer map ──
// Set after store creation to avoid circular dependency
import type { VolunteerActivityStatus, VolunteerDailyRecord } from "@/shared/types"
import { fmt, getDaySlots } from "./helpers"

let _store: {
  getState: () => any
  setState: (fn: (s: any) => any) => void
} | null = null

export function initTimerStore(store: { getState: () => any; setState: (fn: (s: any) => any) => void }) {
  _store = store
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function setTimer(key: string, ms: number, cb: () => void) {
  clearTimer(key)
  if (ms <= 0) {
    cb()
    return
  }
  timers.set(key, setTimeout(cb, ms))
}
export function clearTimer(key: string) {
  const t = timers.get(key)
  if (t) {
    clearTimeout(t)
    timers.delete(key)
  }
}
export function clearActTimers(actId: string) {
  for (const k of timers.keys()) if (k.startsWith(`vol:act:${actId}:`)) clearTimer(k)
}

export function clearAllTimers() {
  for (const [, t] of timers) clearTimeout(t)
  timers.clear()
}

// ── timer helpers (require _store to be initialized) ──

export function registerActTimers(actId: string) {
  const act = _store!.getState().activities.find((a: any) => a.id === actId)
  if (!act) return
  const now = Date.now()

  if (act.status === "published") {
    const ms = new Date(act.startTime).getTime() - now
    if (ms > 0) {
      setTimer(`vol:act:${actId}:start`, ms, () => {
        _store!.setState((s: any) => ({
          activities: s.activities.map((a: any) =>
            a.id === actId ? { ...a, status: "in_progress" as VolunteerActivityStatus } : a
          ),
        }))
        registerActTimers(actId)
      })
    } else {
      _store!.setState((s: any) => ({
        activities: s.activities.map((a: any) =>
          a.id === actId ? { ...a, status: "in_progress" as VolunteerActivityStatus } : a
        ),
      }))
      registerActTimers(actId)
    }
  }

  if (act.status === "in_progress") {
    // 多天活动：每天结束时独立结算当日记录
    if (act.timeMode === "multi") {
      const slots = getDaySlots(act)
      for (const slot of slots) {
        const dayEndMs = new Date(slot.dayEnd).getTime()
        if (dayEndMs > now) {
          setTimer(`vol:act:${actId}:day:${slot.date}`, dayEndMs - now, () => {
            settleActivity(actId)
          })
        }
      }
    }
    // 活动最终结束：endTime 是最后一天的结束时刻
    const ms = new Date(act.endTime).getTime() - now
    if (ms > 0) {
      setTimer(`vol:act:${actId}:end`, ms, () => {
        _store!.setState((s: any) => ({
          activities: s.activities.map((a: any) =>
            a.id === actId ? { ...a, status: "ended" as VolunteerActivityStatus, endTime: fmt(new Date()) } : a
          ),
        }))
        settleActivity(actId)
      })
    } else {
      _store!.setState((s: any) => ({
        activities: s.activities.map((a: any) =>
          a.id === actId ? { ...a, status: "ended" as VolunteerActivityStatus } : a
        ),
      }))
      settleActivity(actId)
    }
  }
}

export function settleActivity(actId: string) {
  const records = _store!.getState().dailyRecords.filter((d: any) => d.activityId === actId)
  const now = Date.now()
  const updates: VolunteerDailyRecord[] = []
  for (const dr of records) {
    // 只结算已过去的日期
    if (now < new Date(dr.dayEndTime).getTime()) continue
    if (dr.status === "pending") {
      updates.push({ ...dr, status: "no_show" })
    } else if (dr.status === "checked_in") {
      updates.push({ ...dr, status: "checkout_overdue" })
    }
  }
  if (updates.length) {
    _store!.setState((s: any) => ({
      dailyRecords: s.dailyRecords.map((dr: any) => {
        const u = updates.find((x) => x.id === dr.id)
        return u || dr
      }),
    }))
  }
}