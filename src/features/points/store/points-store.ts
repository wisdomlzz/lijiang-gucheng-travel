import { create } from "zustand"
import { pointsApi } from "@/api/client"
import { syncAction } from "@/api/sync"

// ============================================================
// 积分服务 —— 「账户 + 流水 + 规则」三件套
// 借鉴有赞/微盟会员积分 + 支付宝/银行流水记账
// 核心封闭：新增来源只加规则 + 调用方，不改 transact()
// ============================================================

// ---- ① 积分规则（PC 端可配置）----
export interface PointRule {
  code: string // 场景编码，字符串非枚举（前向兼容）
  label: string // 展示名
  points: number // 基础分值
  dailyLimit?: number // 每日上限（防刷）
  direction: "IN" | "OUT" // 赚取 / 消耗
  enabled: boolean
}

// ---- ② 积分账户（当前状态）----
export interface PointAccount {
  userId: string
  balance: number
  totalEarned: number
  totalUsed: number
}

// ---- ③ 积分流水（不可变日志）----
export interface PointLedger {
  id: string
  userId: string
  direction: "IN" | "OUT"
  delta: number // 正数
  sourceCode: string // 对应 PointRule.code
  sourceLabel: string // 展示快照（规则改名不影响历史）
  refId?: string // 关联单据（打卡ID/订单号）
  balanceAfter: number // 流水后余额快照
  createdAt: string
}

type PointsState = {
  accounts: Record<string, PointAccount>
  ledgers: PointLedger[]
  rules: PointRule[]

  // 账户查询
  getAccount: (userId: string) => PointAccount
  getLedgers: (userId: string) => PointLedger[]

  // ★ 唯一入口：所有来源都走这里
  transact: (
    userId: string,
    sourceCode: string,
    refId?: string,
    customDelta?: number
  ) => Promise<{ ok: boolean; msg: string; delta?: number }>

  // 规则管理（PC 端）
  addRule: (rule: PointRule) => Promise<void>
  updateRule: (code: string, patch: Partial<PointRule>) => Promise<void>
  removeRule: (code: string) => Promise<void>
}

export const usePointsStore = create<PointsState>((set, get) => ({
  accounts: {},
  ledgers: [],
  rules: [],

  getAccount: (userId) => get().accounts[userId] ?? { userId, balance: 0, totalEarned: 0, totalUsed: 0 },
  getLedgers: (userId) => get().ledgers.filter((l) => l.userId === userId),

  // ★ 核心入口：服务端 authoritative,server 校验规则/上限/余额并返回更新后的账户
  transact: async (userId, sourceCode, refId, customDelta) => {
    const result = await syncAction(
      "points.transact",
      () => pointsApi.transact({ userId, sourceCode, refId, customDelta }),
      (account) => {
        set((s) => ({ accounts: { ...s.accounts, [userId]: account } }))
      }
    )
    if (!result) return { ok: false, msg: "积分操作失败" }
    // 服务端 transact 只返回 account,ledger 通过重查 account 端点获取
    try {
      const accountWithLedgers: any = await pointsApi.account(userId)
      set((s) => ({
        accounts: { ...s.accounts, [userId]: accountWithLedgers },
        ledgers: accountWithLedgers.ledgers || s.ledgers,
      }))
      const msg =
        (accountWithLedgers.lastDelta ?? 0) >= 0
          ? `获得 ${Math.abs(accountWithLedgers.lastDelta ?? 0)} 积分`
          : `消耗 ${Math.abs(accountWithLedgers.lastDelta ?? 0)} 积分`
      return { ok: true, msg, delta: (result as any).balance }
    } catch {
      return { ok: true, msg: "积分操作成功", delta: (result as any).balance }
    }
  },

  addRule: async (rule) => {
    await syncAction("points.addRule", () => pointsApi.rules.create(rule), (result) => {
      set((s) => ({ rules: [...s.rules.filter((r) => r.code !== (result as PointRule).code), result] }))
    })
  },
  updateRule: async (code, patch) => {
    await syncAction("points.updateRule", () => pointsApi.rules.update(code, patch), (result) => {
      set((s) => ({ rules: s.rules.map((r) => (r.code === code ? result : r)) }))
    })
  },
  removeRule: async (code) => {
    await syncAction("points.removeRule", () => pointsApi.rules.remove(code), () => {
      set((s) => ({ rules: s.rules.filter((r) => r.code !== code) }))
    })
  },
}))
