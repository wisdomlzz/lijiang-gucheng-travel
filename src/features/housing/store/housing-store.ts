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
  addHouse: (item: HousingItem) => void
  updateHouse: (id: number, fields: Partial<HousingItem>) => void
  deleteHouse: (id: number) => void
}

const SEED: HousingItem[] = []

export const useHousingStore = create<HousingState>((set) => ({
  houses: [],
  addHouse: (item) => {
    syncAction("house.add", () => contentApi.housing.create(item), () => {})
    set((s) => ({ houses: [...s.houses, item] }))
  },
  updateHouse: (id, fields) => {
    syncAction("house.update", () => contentApi.housing.update(id, fields), () => {})
    set((s) => ({ houses: s.houses.map((h) => (h.id === id ? { ...h, ...fields } : h)) }))
  },
  deleteHouse: (id) => {
    syncAction("house.delete", () => contentApi.housing.remove(id), () => {})
    set((s) => ({ houses: s.houses.filter((h) => h.id !== id) }))
  },
}))