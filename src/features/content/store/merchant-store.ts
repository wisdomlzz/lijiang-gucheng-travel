import { create } from "zustand"
import { contentApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { Merchant } from "../../../shared/types/content-types"

const DEFAULT: Merchant[] = []

type State = {
  merchants: Merchant[]
  addMerchant: (item: Merchant) => void
  updateMerchant: (id: string, fields: Partial<Merchant>) => void
  deleteMerchant: (id: string) => void
}

export const useContentMerchantStore = create<State>((set) => ({
  merchants: [],
  addMerchant: (item) => {
    syncAction("merchant.add", () => contentApi.merchants.create(item), () => {})
    set((s) => ({ merchants: [...s.merchants, item] }))
  },
  updateMerchant: (id, fields) => {
    syncAction("merchant.update", () => contentApi.merchants.update(id, fields), () => {})
    set((s) => ({ merchants: s.merchants.map((m) => (m.id === id ? { ...m, ...fields } : m)) }))
  },
  deleteMerchant: (id) => {
    syncAction("merchant.delete", () => contentApi.merchants.remove(id), () => {})
    set((s) => ({ merchants: s.merchants.filter((m) => m.id !== id) }))
  },
}))
