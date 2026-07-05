import { create } from "zustand"

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

const SEED_RULES: PointRule[] = [
  { code: "courtyard_checkin", label: "院落打卡", points: 5, dailyLimit: 10, direction: "IN", enabled: true },
  { code: "naxi_streak", label: "纳西人连续打卡", points: 50, dailyLimit: 1, direction: "IN", enabled: true },
  { code: "volunteer_service", label: "志愿服务", points: 2, dailyLimit: 100, direction: "IN", enabled: true },
  { code: "mall_purchase", label: "商城消费", points: 1, direction: "IN", enabled: true },
  { code: "mall_redeem", label: "积分兑换", points: 1, direction: "OUT", enabled: true },
]

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
  ) => { ok: boolean; msg: string; delta?: number }

  // 规则管理（PC 端）
  addRule: (rule: PointRule) => void
  updateRule: (code: string, patch: Partial<PointRule>) => void
  removeRule: (code: string) => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export const usePointsStore = create<PointsState>((set, get) => ({
  accounts: {
    u_c_001: { userId: "u_c_001", balance: 320, totalEarned: 380, totalUsed: 60 },
    u_b_001: { userId: "u_b_001", balance: 150, totalEarned: 200, totalUsed: 50 },
  },
  ledgers: [
    {
      id: "pl1",
      userId: "u_c_001",
      direction: "IN",
      delta: 5,
      sourceCode: "courtyard_checkin",
      sourceLabel: "院落打卡",
      refId: "chk-1",
      balanceAfter: 5,
      createdAt: "2026-05-10 10:20",
    },
    {
      id: "pl2",
      userId: "u_c_001",
      direction: "IN",
      delta: 50,
      sourceCode: "naxi_streak",
      sourceLabel: "纳西人连续打卡",
      balanceAfter: 55,
      createdAt: "2026-05-15 09:00",
    },
    {
      id: "pl3",
      userId: "u_c_001",
      direction: "IN",
      delta: 8,
      sourceCode: "volunteer_service",
      sourceLabel: "志愿服务",
      balanceAfter: 63,
      createdAt: "2026-05-20 16:00",
    },
    {
      id: "pl4",
      userId: "u_c_001",
      direction: "IN",
      delta: 257,
      sourceCode: "courtyard_checkin",
      sourceLabel: "院落打卡",
      balanceAfter: 320,
      createdAt: "2026-06-01 14:30",
    },
    {
      id: "pl5",
      userId: "u_c_001",
      direction: "OUT",
      delta: 60,
      sourceCode: "mall_redeem",
      sourceLabel: "积分兑换",
      refId: "mall-order-001",
      balanceAfter: 260,
      createdAt: "2026-06-10 11:00",
    },
    {
      id: "pl6",
      userId: "u_c_001",
      direction: "IN",
      delta: 60,
      sourceCode: "courtyard_checkin",
      sourceLabel: "院落打卡",
      balanceAfter: 320,
      createdAt: "2026-06-20 10:00",
    },
  ],
  rules: SEED_RULES,

  getAccount: (userId) => get().accounts[userId] ?? { userId, balance: 0, totalEarned: 0, totalUsed: 0 },
  getLedgers: (userId) => get().ledgers.filter((l) => l.userId === userId),

  // ★ 核心入口：查规则 → 校验上限 → 写流水 → 更新账户
  transact: (userId, sourceCode, refId, customDelta) => {
    const rule = get().rules.find((r) => r.code === sourceCode && r.enabled)
    if (!rule) return { ok: false, msg: `积分规则 ${sourceCode} 不存在或已停用` }

    // 每日上限校验（防刷）
    if (rule.dailyLimit) {
      const todayStr = today()
      const todayUsed = get()
        .ledgers.filter((l) => l.userId === userId && l.sourceCode === sourceCode && l.createdAt.startsWith(todayStr))
        .reduce((sum, l) => sum + l.delta, 0)
      if (todayUsed >= rule.dailyLimit) return { ok: false, msg: `今日「${rule.label}」已达上限` }
    }

    // 计算实际变动
    let delta = customDelta ?? rule.points
    if (rule.direction === "OUT") delta = -Math.abs(delta)
    else delta = Math.abs(delta)

    const account = get().getAccount(userId)
    if (rule.direction === "OUT" && account.balance + delta < 0) {
      return { ok: false, msg: "积分余额不足" }
    }

    const newBalance = account.balance + delta
    const ledger: PointLedger = {
      id: `pl${Date.now()}`,
      userId,
      direction: rule.direction,
      delta: Math.abs(delta),
      sourceCode,
      sourceLabel: rule.label,
      refId,
      balanceAfter: newBalance,
      createdAt: new Date().toLocaleString("zh-CN"),
    }

    set((s) => ({
      ledgers: [ledger, ...s.ledgers],
      accounts: {
        ...s.accounts,
        [userId]: {
          userId,
          balance: newBalance,
          totalEarned: account.totalEarned + (delta > 0 ? delta : 0),
          totalUsed: account.totalUsed + (delta < 0 ? Math.abs(delta) : 0),
        },
      },
    }))

    return { ok: true, msg: `${delta > 0 ? "获得" : "消耗"} ${Math.abs(delta)} 积分`, delta }
  },

  addRule: (rule) => set((s) => ({ rules: [...s.rules.filter((r) => r.code !== rule.code), rule] })),
  updateRule: (code, patch) => set((s) => ({ rules: s.rules.map((r) => (r.code === code ? { ...r, ...patch } : r)) })),
  removeRule: (code) => set((s) => ({ rules: s.rules.filter((r) => r.code !== code) })),
}))
