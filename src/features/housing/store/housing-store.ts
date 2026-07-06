import { create } from "zustand"
import { contentApi } from "@/api/client"
import { syncAction } from "@/api/sync"

export interface HousingItem {
  id: number
  name: string
  addr: string
  status: "rented" | "idle"
  statusText: string
  area: string
  areaName: string
  meta: string[]
}

interface HousingState {
  houses: HousingItem[]
  addHouse: (item: HousingItem) => Promise<void>
  updateHouse: (id: number, fields: Partial<HousingItem>) => Promise<void>
  deleteHouse: (id: number) => Promise<void>
}

export const useHousingStore = create<HousingState>((set) => ({
  houses: [],
  addHouse: async (item) => {
    await syncAction("house.add", () => contentApi.housing.create(item), (result) => {
      set((s) => ({ houses: [result, ...s.houses] }))
    })
  },
  updateHouse: async (id, fields) => {
    await syncAction("house.update", () => contentApi.housing.update(id, fields), (result) => {
      set((s) => ({ houses: s.houses.map((h) => (h.id === id ? result : h)) }))
    })
  },
  deleteHouse: async (id) => {
    await syncAction("house.delete", () => contentApi.housing.remove(id), () => {
      set((s) => ({ houses: s.houses.filter((h) => h.id !== id) }))
    })
  },
}))
