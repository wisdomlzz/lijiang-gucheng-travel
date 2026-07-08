import { create } from "zustand"
import { contentApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { Merchant } from "../../shared/types/content-types"

type State = {
  merchants: Merchant[]
  addMerchant: (item: Merchant) => Promise<void>
  updateMerchant: (id: string, fields: Partial<Merchant>) => Promise<void>
  deleteMerchant: (id: string) => Promise<void>
}

export const useContentMerchantStore = create<State>((set) => ({
  merchants: [],
  addMerchant: async (item) => {
    await syncAction("merchant.add", () => contentApi.merchants.create(item), (result) => {
      set((s) => ({ merchants: [result, ...s.merchants] }))
    })
  },
  updateMerchant: async (id, fields) => {
    await syncAction("merchant.update", () => contentApi.merchants.update(id, fields), (result) => {
      set((s) => ({ merchants: s.merchants.map((m) => (m.id === id ? result : m)) }))
    })
  },
  deleteMerchant: async (id) => {
    await syncAction("merchant.delete", () => contentApi.merchants.remove(id), () => {
      set((s) => ({ merchants: s.merchants.filter((m) => m.id !== id) }))
    })
  },
}))