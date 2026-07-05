import { create } from "zustand"

// ====== Types ======
export interface ScoreRule {
  id: string
  type: "deduct" | "reward"
  name: string
  condition: string
  scoreChange: number // positive = reward, negative = deduct
  enabled: boolean
  description: string
}

export interface TrustThreshold {
  defaultScore: number
  delinquentThreshold: number
  autoRecover: boolean
  recoverScore: number
}

// ====== Default config ======
export const DEFAULT_THRESHOLD: TrustThreshold = {
  defaultScore: 100,
  delinquentThreshold: 60,
  autoRecover: true,
  recoverScore: 70,
}

// ====== Seed Rules ======
const SEED_RULES: ScoreRule[] = [
  {
    id: "rule_01",
    type: "deduct",
    name: "差评扣分",
    condition: "用户评价 ≤ 2 星",
    scoreChange: -5,
    enabled: true,
    description: "每次获得差评（1-2星）扣除诚信分",
  },
  {
    id: "rule_02",
    type: "deduct",
    name: "取消订单扣分",
    condition: "已接单后取消",
    scoreChange: -3,
    enabled: true,
    description: "接单后主动取消或无故缺席扣除诚信分",
  },
  {
    id: "rule_03",
    type: "deduct",
    name: "投诉扣分（一般）",
    condition: "投诉成立（一般）",
    scoreChange: -3,
    enabled: true,
    description: "一般投诉核实成立后扣除诚信分",
  },
  {
    id: "rule_04",
    type: "deduct",
    name: "投诉扣分（严重）",
    condition: "投诉成立（严重）",
    scoreChange: -6,
    enabled: true,
    description: "严重投诉核实成立后扣除诚信分",
  },
  {
    id: "rule_05",
    type: "deduct",
    name: "投诉扣分（非常严重）",
    condition: "投诉成立（非常严重）",
    scoreChange: -10,
    enabled: true,
    description: "非常严重投诉核实成立后扣除诚信分",
  },
  {
    id: "rule_06",
    type: "reward",
    name: "5星好评加分",
    condition: "用户评价 5 星",
    scoreChange: 1,
    enabled: true,
    description: "获得5星好评每次加诚信分",
  },
  {
    id: "rule_07",
    type: "reward",
    name: "4星好评加分",
    condition: "用户评价 4 星",
    scoreChange: 0.5,
    enabled: true,
    description: "获得4星好评每次加诚信分",
  },
  {
    id: "rule_08",
    type: "reward",
    name: "连续无差评奖励",
    condition: "连续 30 天无差评",
    scoreChange: 2,
    enabled: true,
    description: "连续30天没有差评记录时奖励诚信分",
  },
]

// ====== Store ======
type RulesStoreState = {
  rules: ScoreRule[]
  threshold: TrustThreshold

  getRules: () => ScoreRule[]
  getEnabledRules: () => ScoreRule[]

  addRule: (rule: Omit<ScoreRule, "id">) => void
  updateRule: (id: string, patch: Partial<ScoreRule>) => void
  removeRule: (id: string) => void
  toggleRule: (id: string) => void

  updateThreshold: (patch: Partial<TrustThreshold>) => void
  resetThreshold: () => void
  resetRules: () => void
}

export const useRulesStore = create<RulesStoreState>((set, get) => ({
  rules: SEED_RULES,
  threshold: { ...DEFAULT_THRESHOLD },

  getRules: () => get().rules,
  getEnabledRules: () => get().rules.filter((r) => r.enabled),

  addRule: (rule) =>
    set((s) => ({
      rules: [...s.rules, { ...rule, id: `rule_${Date.now()}` }],
    })),

  updateRule: (id, patch) =>
    set((s) => ({
      rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),

  removeRule: (id) =>
    set((s) => ({
      rules: s.rules.filter((r) => r.id !== id),
    })),

  toggleRule: (id) =>
    set((s) => ({
      rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    })),

  updateThreshold: (patch) =>
    set((s) => ({
      threshold: { ...s.threshold, ...patch },
    })),

  resetThreshold: () => set({ threshold: { ...DEFAULT_THRESHOLD } }),
  resetRules: () => set({ rules: SEED_RULES }),
}))