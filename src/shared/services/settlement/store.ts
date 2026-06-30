import { create } from "zustand"

// ============================================================
// 结算管理 —— 便民服务结算闭环
// 订单完成 → 自动生成收入记录 → 服务人员收入统计 / 提现 / 评价
// ============================================================

export interface IncomeRecord {
  orderId: string
  staffId: string
  staffName: string
  serviceType: string
  amount: number
  payMethod: "online" | "cash"
  completedAt: string
}

export interface WithdrawalRequest {
  id: string
  staffId: string
  staffName: string
  amount: number
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  reviewedAt?: string
  reviewer?: string
  rejectReason?: string
}

type SettlementState = {
  incomes: IncomeRecord[]
  withdrawals: WithdrawalRequest[]

  // 收入查询
  getIncomesByStaff: (staffId: string) => IncomeRecord[]
  getStaffSummary: (staffId: string) => { total: number; online: number; cash: number; monthTotal: number }
  getAllSummary: () => { totalStaff: number; totalIncome: number; monthIncome: number; pendingWithdraw: number }

  // 录入收入（订单完成时调用——跨域联动入口）
  recordIncome: (record: Omit<IncomeRecord, "completedAt"> & { completedAt?: string }) => void

  // 提现
  requestWithdrawal: (staffId: string, staffName: string, amount: number) => { ok: boolean; msg: string }
  approveWithdrawal: (id: string, reviewer: string) => void
  rejectWithdrawal: (id: string, reviewer: string, reason: string) => void
}

// 种子：从已完成的便民订单衍生（staffId 对应 staff service）
const SEED_INCOMES: IncomeRecord[] = [
  { orderId: "CO20260509001", staffId: "s1", staffName: "李师傅", serviceType: "行李搬运", amount: 60, payMethod: "online", completedAt: "2026-05-09T12:00:00.000Z" },
  { orderId: "CO20260507002", staffId: "s6", staffName: "张环卫", serviceType: "生活垃圾清运", amount: 45, payMethod: "cash", completedAt: "2026-05-07T18:00:00.000Z" },
  { orderId: "CO20260508001", staffId: "s8", staffName: "送水工老赵", serviceType: "送水服务", amount: 40, payMethod: "cash", completedAt: "2026-05-08T10:00:00.000Z" },
  { orderId: "CO20260510003", staffId: "s8", staffName: "送水工老赵", serviceType: "送水服务", amount: 40, payMethod: "online", completedAt: "2026-06-15T11:00:00.000Z" },
  { orderId: "CO20260509001", staffId: "s1", staffName: "李师傅", serviceType: "行李搬运", amount: 55, payMethod: "online", completedAt: "2026-06-20T15:00:00.000Z" },
  { orderId: "CO20260507002", staffId: "s6", staffName: "张环卫", serviceType: "生活垃圾清运", amount: 30, payMethod: "cash", completedAt: "2026-06-22T09:00:00.000Z" },
  { orderId: "CO20260508001", staffId: "s8", staffName: "送水工老赵", serviceType: "送水服务", amount: 35, payMethod: "online", completedAt: "2026-06-25T14:00:00.000Z" },
]

const SEED_WITHDRAWALS: WithdrawalRequest[] = [
  { id: "wd1", staffId: "s1", staffName: "李师傅", amount: 500, status: "approved", requestedAt: "2026-06-10 10:00", reviewedAt: "2026-06-11 14:00", reviewer: "管理员" },
  { id: "wd2", staffId: "s8", staffName: "送水工老赵", amount: 300, status: "pending", requestedAt: "2026-06-26 09:30" },
  { id: "wd3", staffId: "s6", staffName: "张环卫", amount: 200, status: "pending", requestedAt: "2026-06-27 16:00" },
]

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr); const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export const useSettlementStore = create<SettlementState>((set, get) => ({
  incomes: SEED_INCOMES,
  withdrawals: SEED_WITHDRAWALS,

  getIncomesByStaff: (staffId) => get().incomes.filter((i) => i.staffId === staffId),

  getStaffSummary: (staffId) => {
    const list = get().incomes.filter((i) => i.staffId === staffId)
    return {
      total: list.reduce((s, i) => s + i.amount, 0),
      online: list.filter((i) => i.payMethod === "online").reduce((s, i) => s + i.amount, 0),
      cash: list.filter((i) => i.payMethod === "cash").reduce((s, i) => s + i.amount, 0),
      monthTotal: list.filter((i) => isThisMonth(i.completedAt)).reduce((s, i) => s + i.amount, 0),
    }
  },

  getAllSummary: () => {
    const incomes = get().incomes
    const staffIds = new Set(incomes.map((i) => i.staffId))
    return {
      totalStaff: staffIds.size,
      totalIncome: incomes.reduce((s, i) => s + i.amount, 0),
      monthIncome: incomes.filter((i) => isThisMonth(i.completedAt)).reduce((s, i) => s + i.amount, 0),
      pendingWithdraw: get().withdrawals.filter((w) => w.status === "pending").length,
    }
  },

  // 跨域联动入口：订单完成时录入收入
  recordIncome: (record) => set((s) => ({
    incomes: [{ ...record, completedAt: record.completedAt ?? new Date().toISOString() }, ...s.incomes],
  })),

  requestWithdrawal: (staffId, staffName, amount) => {
    if (amount <= 0) return { ok: false, msg: "提现金额需大于 0" }
    const summary = get().getStaffSummary(staffId)
    const pendingAmount = get().withdrawals.filter((w) => w.staffId === staffId && w.status === "pending").reduce((s, w) => s + w.amount, 0)
    if (summary.total - pendingAmount < amount) return { ok: false, msg: "可提现余额不足" }
    set((s) => ({ withdrawals: [{ id: `wd${Date.now()}`, staffId, staffName, amount, status: "pending", requestedAt: new Date().toLocaleString("zh-CN") }, ...s.withdrawals] }))
    return { ok: true, msg: "提现申请已提交" }
  },

  approveWithdrawal: (id, reviewer) => set((s) => ({ withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: "approved", reviewedAt: new Date().toLocaleString("zh-CN"), reviewer } : w) })),
  rejectWithdrawal: (id, reviewer, reason) => set((s) => ({ withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: "rejected", reviewedAt: new Date().toLocaleString("zh-CN"), reviewer, rejectReason: reason } : w) })),
}))
