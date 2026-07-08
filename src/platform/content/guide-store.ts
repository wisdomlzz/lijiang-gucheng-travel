import { create } from "zustand"
import { contentApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { TravelGuide } from "../../shared/types/content-types"

type State = {
  guides: TravelGuide[]
  addGuide: (item: TravelGuide) => Promise<void>
  updateGuide: (id: string, fields: Partial<TravelGuide>) => Promise<void>
  deleteGuide: (id: string) => Promise<void>
}

export const useContentGuideStore = create<State>((set) => ({
  guides: [],
  addGuide: async (item) => {
    await syncAction("guide.add", () => contentApi.routes.create(item), (result) => {
      set((s) => ({ guides: [result, ...s.guides] }))
    })
  },
  updateGuide: async (id, fields) => {
    await syncAction("guide.update", () => contentApi.routes.update(id, fields), (result) => {
      set((s) => ({ guides: s.guides.map((g) => (g.id === id ? result : g)) }))
    })
  },
  deleteGuide: async (id) => {
    await syncAction("guide.delete", () => contentApi.routes.remove(id), () => {
      set((s) => ({ guides: s.guides.filter((g) => g.id !== id) }))
    })
  },
}))