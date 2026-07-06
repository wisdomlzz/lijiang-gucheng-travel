import { create } from "zustand"
import { contentApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { Courtyard } from "../../../shared/types/content-types"

const DEFAULT: Courtyard[] = []

type State = {
  courtyards: Courtyard[]
  addCourtyard: (item: Courtyard) => void
  updateCourtyard: (id: string, fields: Partial<Courtyard>) => void
  deleteCourtyard: (id: string) => void
}

export const useContentCourtyardStore = create<State>((set) => ({
  courtyards: [],
  addCourtyard: (item) => {
    syncAction("courtyard.add", () => contentApi.courtyards.create(item), () => {})
    set((s) => ({ courtyards: [...s.courtyards, item] }))
  },
  updateCourtyard: (id, fields) => {
    syncAction("courtyard.update", () => contentApi.courtyards.update(id, fields), () => {})
    set((s) => ({ courtyards: s.courtyards.map((c) => (c.id === id ? { ...c, ...fields } : c)) }))
  },
  deleteCourtyard: (id) => {
    syncAction("courtyard.delete", () => contentApi.courtyards.remove(id), () => {})
    set((s) => ({ courtyards: s.courtyards.filter((c) => c.id !== id) }))
  },
}))
