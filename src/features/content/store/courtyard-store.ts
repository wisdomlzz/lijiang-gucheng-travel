import { create } from "zustand"
import { contentApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { Courtyard } from "../../../shared/types/content-types"

type State = {
  courtyards: Courtyard[]
  addCourtyard: (item: Courtyard) => Promise<void>
  updateCourtyard: (id: string, fields: Partial<Courtyard>) => Promise<void>
  deleteCourtyard: (id: string) => Promise<void>
}

export const useContentCourtyardStore = create<State>((set) => ({
  courtyards: [],
  addCourtyard: async (item) => {
    await syncAction("courtyard.add", () => contentApi.courtyards.create(item), (result) => {
      set((s) => ({ courtyards: [result, ...s.courtyards] }))
    })
  },
  updateCourtyard: async (id, fields) => {
    await syncAction("courtyard.update", () => contentApi.courtyards.update(id, fields), (result) => {
      set((s) => ({ courtyards: s.courtyards.map((c) => (c.id === id ? result : c)) }))
    })
  },
  deleteCourtyard: async (id) => {
    await syncAction("courtyard.delete", () => contentApi.courtyards.remove(id), () => {
      set((s) => ({ courtyards: s.courtyards.filter((c) => c.id !== id) }))
    })
  },
}))
