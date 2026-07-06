import { create } from "zustand"
import { contentApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { TravelGuide } from "../../../shared/types/content-types"

const DEFAULT: TravelGuide[] = []

type State = {
  guides: TravelGuide[]
  addGuide: (item: TravelGuide) => void
  updateGuide: (id: string, fields: Partial<TravelGuide>) => void
  deleteGuide: (id: string) => void
}

export const useContentGuideStore = create<State>((set) => ({
  guides: [],
  addGuide: (item) => {
    syncAction("guide.add", () => contentApi.routes.create(item), () => {})
    set((s) => ({ guides: [...s.guides, item] }))
  },
  updateGuide: (id, fields) => {
    syncAction("guide.update", () => contentApi.routes.update(id, fields), () => {})
    set((s) => ({ guides: s.guides.map((g) => (g.id === id ? { ...g, ...fields } : g)) }))
  },
  deleteGuide: (id) => {
    syncAction("guide.delete", () => contentApi.routes.remove(id), () => {})
    set((s) => ({ guides: s.guides.filter((g) => g.id !== id) }))
  },
}))
