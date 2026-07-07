import { create } from "zustand"
import { api } from "@/api/client"
import { syncAction } from "@/api/sync"
import { usePointsStore } from "../../points/store/points-store"

// ============================================================
// 纳西人打卡 —— "今天我想做纳西人"活动
// 穿纳西族服饰拍照打卡，连续7天累计积分
// 跨域联动：连续达成 → 调 points.transact(uid, "naxi_streak")
// ============================================================

export interface NaxiCheckin {
  id: string
  userId: string
  photo: string
  location: string
  createdAt: string
}

type NaxiCheckinState = {
  checkins: NaxiCheckin[]
  getMyCheckins: (userId: string) => NaxiCheckin[]
  getStreak: (userId: string) => number // 当前连续天数
  getTotalDays: (userId: string) => number // 累计打卡天数
  canCheckinToday: (userId: string) => boolean
  addCheckin: (
    input: Omit<NaxiCheckin, "id" | "createdAt">
  ) => Promise<{ ok: boolean; msg: string; streakBonus?: boolean }>
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function isYesterday(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr)
  const y = new Date(ref)
  y.setDate(y.getDate() - 1)
  return d.toDateString() === y.toDateString()
}

export const useNaxiCheckinStore = create<NaxiCheckinState>((set, get) => ({
  checkins: [],

  getMyCheckins: (userId) => get().checkins.filter((c) => c.userId === userId),

  getStreak: (userId) => {
    const mine = get()
      .getMyCheckins(userId)
      .map((c) => c.createdAt.slice(0, 10))
      .sort()
      .reverse()
    if (mine.length === 0) return 0
    // 从今天或昨天起倒推连续天数
    let streak = 0
    const ref = new Date()
    if (mine[0] !== todayStr()) {
      if (!isYesterday(mine[0], ref)) return 0
    }
    for (let i = 0; i < mine.length; i++) {
      const expected = new Date(ref)
      expected.setDate(expected.getDate() - i)
      if (mine[i] === expected.toISOString().slice(0, 10)) streak++
      else break
    }
    return streak
  },

  getTotalDays: (userId) =>
    new Set(
      get()
        .getMyCheckins(userId)
        .map((c) => c.createdAt.slice(0, 10))
    ).size,

  canCheckinToday: (userId) =>
    !get()
      .getMyCheckins(userId)
      .some((c) => c.createdAt.slice(0, 10) === todayStr()),

  addCheckin: async (input) => {
    if (!get().canCheckinToday(input.userId)) return { ok: false, msg: "今日已打卡" }
    const result = await syncAction(
      "naxi.add",
      () =>
        api.create<NaxiCheckin>("naxi-checkins", {
          userId: input.userId,
          photo: input.photo,
          location: input.location,
        }),
      (r) => {
        set((s) => ({ checkins: [r, ...s.checkins] }))
      }
    )
    if (!result) return { ok: false, msg: "打卡失败" }
    const newStreak = get().getStreak(input.userId)
    const streakBonus = newStreak > 0 && newStreak % 7 === 0
    if (streakBonus) {
      usePointsStore.getState().transact(input.userId, "naxi_streak", result.id)
    }
    return { ok: true, msg: "打卡成功", streakBonus }
  },
}))
