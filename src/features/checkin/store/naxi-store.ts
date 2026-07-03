import { create } from "zustand"

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
  getStreak: (userId: string) => number       // 当前连续天数
  getTotalDays: (userId: string) => number    // 累计打卡天数
  canCheckinToday: (userId: string) => boolean
  addCheckin: (input: Omit<NaxiCheckin, "id" | "createdAt">) => { ok: boolean; msg: string; streakBonus?: boolean }
}

function todayStr() { return new Date().toISOString().slice(0, 10) }
function isYesterday(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr); const y = new Date(ref); y.setDate(y.getDate() - 1)
  return d.toDateString() === y.toDateString()
}

export const useNaxiCheckinStore = create<NaxiCheckinState>((set, get) => ({
  checkins: [
    { id: "nx1", userId: "u_c_001", photo: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400", location: "五一街文治巷", createdAt: "2026-06-26 10:00" },
    { id: "nx2", userId: "u_c_001", photo: "https://images.unsplash.com/photo-1552526881-5517a57c17ae?w=400", location: "四方街", createdAt: "2026-06-27 11:00" },
    { id: "nx3", userId: "u_c_001", photo: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", location: "木府前", createdAt: "2026-06-28 09:30" },
  ],

  getMyCheckins: (userId) => get().checkins.filter((c) => c.userId === userId),

  getStreak: (userId) => {
    const mine = get().getMyCheckins(userId).map((c) => c.createdAt.slice(0, 10)).sort().reverse()
    if (mine.length === 0) return 0
    // 从今天或昨天起倒推连续天数
    let streak = 0
    const ref = new Date()
    if (mine[0] !== todayStr()) {
      if (!isYesterday(mine[0], ref)) return 0
    }
    for (let i = 0; i < mine.length; i++) {
      const expected = new Date(ref); expected.setDate(expected.getDate() - i)
      if (mine[i] === expected.toISOString().slice(0, 10)) streak++
      else break
    }
    return streak
  },

  getTotalDays: (userId) => new Set(get().getMyCheckins(userId).map((c) => c.createdAt.slice(0, 10))).size,

  canCheckinToday: (userId) => !get().getMyCheckins(userId).some((c) => c.createdAt.slice(0, 10) === todayStr()),

  addCheckin: (input) => {
    if (!get().canCheckinToday(input.userId)) return { ok: false, msg: "今日已打卡" }
    const prevStreak = get().getStreak(input.userId)
    set((s) => ({ checkins: [{ ...input, id: `nx${Date.now()}`, createdAt: new Date().toLocaleString("zh-CN") }, ...s.checkins] }))
    const newStreak = get().getStreak(input.userId)
    // 连续 7 天达成 → 触发积分奖励（跨域联动由调用方执行 transact）
    const streakBonus = newStreak > 0 && newStreak % 7 === 0 && newStreak > prevStreak
    return { ok: true, msg: streakBonus ? `连续打卡 ${newStreak} 天，获得额外积分奖励！` : `打卡成功，已连续 ${newStreak} 天`, streakBonus }
  },
}))
