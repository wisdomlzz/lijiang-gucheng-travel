import { create } from "zustand"
import { api } from "@/api/client"
import { syncAction } from "@/api/sync"

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
  recordIncome: (record: Omit<IncomeRecord, "completedAt"> & { completedAt?: string }) => Promise<void>

  // 提现
  requestWithdrawal: (staffId: string, staffName: string, amount: number) => Promise<{ ok: boolean; msg: string }>
  approveWithdrawal: (id: string, reviewer: string) => Promise<void>
  rejectWithdrawal: (id: string, reviewer: string, reason: string) => Promise<void>
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export const useSettlementStore = create<SettlementState>((set, get) => ({
  incomes: [],
  withdrawals: [],

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
  recordIncome: async (record) => {
    await syncAction(
      "recordIncome",
      () =>
        api.create<IncomeRecord>("incomes", {
          ...record,
          completedAt: record.completedAt ?? new Date().toISOString(),
        }),
      (result) => {
        set((s) => ({ incomes: [result, ...s.incomes] }))
      }
    )
  },

  requestWithdrawal: async (staffId, staffName, amount) => {
    if (amount <= 0) return { ok: false, msg: "提现金额需大于 0" }
    const summary = get().getStaffSummary(staffId)
    const pendingAmount = get()
      .withdrawals.filter((w) => w.staffId === staffId && w.status === "pending")
      .reduce((s, w) => s + w.amount, 0)
    if (summary.total - pendingAmount < amount) return { ok: false, msg: "可提现余额不足" }
    const result = await syncAction(
      "requestWithdrawal",
      () =>
        api.create<WithdrawalRequest>("withdrawals", {
          staffId,
          staffName,
          amount,
          status: "pending",
        }),
      (r) => {
        set((s) => ({ withdrawals: [r, ...s.withdrawals] }))
      }
    )
    return result ? { ok: true, msg: "提现申请已提交" } : { ok: false, msg: "提交失败" }
  },

  approveWithdrawal: async (id, reviewer) => {
    await syncAction(
      "approveWithdrawal",
      () =>
        api.update<WithdrawalRequest>("withdrawals", id, {
          status: "approved",
          reviewedAt: new Date().toLocaleString("zh-CN"),
          reviewer,
        }),
      (result) => {
        set((s) => ({ withdrawals: s.withdrawals.map((w) => (w.id === id ? result : w)) }))
      }
    )
  },

  rejectWithdrawal: async (id, reviewer, reason) => {
    await syncAction(
      "rejectWithdrawal",
      () =>
        api.update<WithdrawalRequest>("withdrawals", id, {
          status: "rejected",
          reviewedAt: new Date().toLocaleString("zh-CN"),
          reviewer,
          rejectReason: reason,
        }),
      (result) => {
        set((s) => ({ withdrawals: s.withdrawals.map((w) => (w.id === id ? result : w)) }))
      }
    )
  },
}))
