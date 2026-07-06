import { create } from "zustand"
import { api } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { Checkin } from "../../../shared/types"
import { usePointsStore } from "../../points/store"

type CheckinState = {
  checkins: Checkin[]
  addCheckin: (checkin: Omit<Checkin, "id" | "createdAt" | "status">) => Promise<void>
  updateStatus: (id: string, status: Checkin["status"]) => void
  getMyCheckins: (userId: string) => Checkin[]
  canCheckin: (userId: string, courtyardId: string) => { allowed: boolean; reason?: string }
}

export const useCheckinStore = create<CheckinState>((set, get) => ({
  checkins: [],
  addCheckin: async (input) => {
    await syncAction(
      "checkin.add",
      () => api.create<Checkin>("checkins", input),
      (result) => {
        set((s) => ({ checkins: [result, ...s.checkins] }))
        // 跨域联动：打卡成功 → 积分入账（显式调用，非事件总线）
        usePointsStore.getState().transact(input.userId, "courtyard_checkin", result.id)
      }
    )
  },
  updateStatus: (id, status) => set((s) => ({ checkins: s.checkins.map((c) => (c.id === id ? { ...c, status } : c)) })),
  getMyCheckins: (userId) => get().checkins.filter((c) => c.userId === userId),
  canCheckin: (userId, courtyardId) => {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const existing = get().checkins.find(
      (c) =>
        c.userId === userId &&
        c.courtyardId === courtyardId &&
        new Date(c.createdAt.replace(/\//g, "-")).getTime() >= start &&
        new Date(c.createdAt.replace(/\//g, "-")).getTime() < start + 86400000
    )
    return existing ? { allowed: false, reason: "今日已打卡" } : { allowed: true }
  },
}))

// export type { Checkin } from "../../../shared/types"
