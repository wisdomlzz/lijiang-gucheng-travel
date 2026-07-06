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
const SEED_RULES: ScoreRule[] = []

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
  rules: [],
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