import { create } from "zustand"
import { trustApi } from "@/api/client"
import { syncAction } from "@/api/sync"

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

// ====== Store ======
type RulesStoreState = {
  rules: ScoreRule[]
  threshold: TrustThreshold

  getRules: () => ScoreRule[]
  getEnabledRules: () => ScoreRule[]

  addRule: (rule: Omit<ScoreRule, "id">) => Promise<void>
  updateRule: (id: string, patch: Partial<ScoreRule>) => Promise<void>
  removeRule: (id: string) => Promise<void>
  toggleRule: (id: string) => Promise<void>

  updateThreshold: (patch: Partial<TrustThreshold>) => Promise<void>
  resetThreshold: () => Promise<void>
  resetRules: () => void
}

export const useRulesStore = create<RulesStoreState>((set, get) => ({
  rules: [],
  threshold: { ...DEFAULT_THRESHOLD },

  getRules: () => get().rules,
  getEnabledRules: () => get().rules.filter((r) => r.enabled),

  addRule: async (rule) => {
    await syncAction("trust.addRule", () => trustApi.rules.create(rule), (result) => {
      set((s) => ({ rules: [...s.rules, result] }))
    })
  },

  updateRule: async (id, patch) => {
    await syncAction("trust.updateRule", () => trustApi.rules.update(id, patch), (result) => {
      set((s) => ({ rules: s.rules.map((r) => (r.id === id ? result : r)) }))
    })
  },

  removeRule: async (id) => {
    await syncAction("trust.removeRule", () => trustApi.rules.remove(id), () => {
      set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }))
    })
  },

  toggleRule: async (id) => {
    const current = get().rules.find((r) => r.id === id)
    if (!current) return
    await syncAction(
      "trust.toggleRule",
      () => trustApi.rules.update(id, { enabled: !current.enabled }),
      (result) => {
        set((s) => ({ rules: s.rules.map((r) => (r.id === id ? result : r)) }))
      }
    )
  },

  updateThreshold: async (patch) => {
    await syncAction("trust.updateThreshold", () => trustApi.threshold.update(patch), (result) => {
      set({ threshold: result })
    })
  },

  resetThreshold: async () => {
    await syncAction(
      "trust.resetThreshold",
      () =>
        trustApi.threshold.update({
          defaultScore: 100,
          delinquentThreshold: 60,
          autoRecover: true,
          recoverScore: 70,
        }),
      (result) => {
        set({ threshold: result })
      }
    )
  },

  resetRules: () => set({ rules: [] }),
}))