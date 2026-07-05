import { create } from "zustand"

// ============================================================
// 院落预约 —— 预约闭环（选时段 → 预约码 → 核销 → 我的预约）
// ============================================================

export interface Booking {
  id: string
  courtyardId: string
  courtyardName: string
  userId: string
  userName: string
  userPhone: string
  date: string // 预约日期 YYYY-MM-DD
  slot: string // 时段 "09:00-10:00"
  visitors: number // 参观人数
  code: string // 核销码
  status: "pending" | "checked" | "cancelled" | "expired"
  createdAt: string
  checkedAt?: string
}

// 预约时段（每院落每日通用）
export const BOOKING_SLOTS = ["09:00-10:00", "10:00-11:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"]

type BookingState = {
  bookings: Booking[]
  getBookingsByUser: (userId: string) => Booking[]
  getBooking: (id: string) => Booking | undefined
  getBookingsByCourtyard: (courtyardId: string, date: string) => Booking[]
  // 预约入口
  createBooking: (input: Omit<Booking, "id" | "code" | "status" | "createdAt">) => {
    ok: boolean
    msg: string
    booking?: Booking
  }
  // 核销
  checkByCode: (code: string) => { ok: boolean; msg: string }
  cancelBooking: (id: string) => void
}

function genCode(): string {
  return "YY" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10)
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [
    {
      id: "bk1",
      courtyardId: "1",
      courtyardName: "木府",
      userId: "u_c_001",
      userName: "张小游",
      userPhone: "138****1001",
      date: "2026-06-30",
      slot: "09:00-10:00",
      visitors: 2,
      code: "YY280601",
      status: "pending",
      createdAt: "2026-06-28 10:00",
    },
    {
      id: "bk2",
      courtyardId: "3",
      courtyardName: "纳西古乐会",
      userId: "u_c_001",
      userName: "张小游",
      userPhone: "138****1001",
      date: "2026-06-15",
      slot: "20:00-21:30",
      visitors: 1,
      code: "YY150615",
      status: "checked",
      createdAt: "2026-06-10 14:00",
      checkedAt: "2026-06-15 20:05",
    },
  ],

  getBookingsByUser: (userId) => get().bookings.filter((b) => b.userId === userId),
  getBooking: (id) => get().bookings.find((b) => b.id === id),
  getBookingsByCourtyard: (courtyardId, date) =>
    get().bookings.filter((b) => b.courtyardId === courtyardId && b.date === date && b.status !== "cancelled"),

  createBooking: (input) => {
    // 同日同时段容量校验（Demo：每时段最多 20 人）
    const sameSlot = get()
      .getBookingsByCourtyard(input.courtyardId, input.date)
      .filter((b) => b.slot === input.slot)
    const used = sameSlot.reduce((s, b) => s + b.visitors, 0)
    if (used + input.visitors > 20) return { ok: false, msg: "该时段已约满" }

    const booking: Booking = {
      ...input,
      id: `bk${Date.now()}`,
      code: genCode(),
      status: "pending",
      createdAt: new Date().toLocaleString("zh-CN"),
    }
    set((s) => ({ bookings: [booking, ...s.bookings] }))
    return { ok: true, msg: "预约成功", booking }
  },

  checkByCode: (code) => {
    const booking = get().bookings.find((b) => b.code === code)
    if (!booking) return { ok: false, msg: "核销码无效" }
    if (booking.status === "checked") return { ok: false, msg: "该预约已核销" }
    if (booking.status === "cancelled") return { ok: false, msg: "该预约已取消" }
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === booking.id ? { ...b, status: "checked", checkedAt: new Date().toLocaleString("zh-CN") } : b
      ),
    }))
    return { ok: true, msg: `${booking.courtyardName} 核销成功` }
  },

  cancelBooking: (id) =>
    set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)) })),
}))
