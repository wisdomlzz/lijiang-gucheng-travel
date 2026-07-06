import { create } from "zustand"

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

const SEED: HousingItem[] = [
  { id: 1, name: "光义街9号公房", addr: "丽江市古城区光义街9号（铺面）", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["267.74㎡", "特色食品", "砖木结构"] },
  { id: 2, name: "新院巷63号公房", addr: "丽江市古城区新院巷63号", status: "idle", statusText: "未出租", area: "gucheng", areaName: "古城区", meta: ["185.50㎡", "闲置", "木结构"] },
  { id: 3, name: "五一街32号公房", addr: "丽江市古城区五一街32号", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["156.30㎡", "饰品", "砖混结构"] },
  { id: 4, name: "兴文巷18号公房", addr: "丽江市古城区兴文巷18号", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["320.00㎡", "餐饮", "砖木结构"] },
  { id: 5, name: "七一街8号公房", addr: "丽江市古城区七一街8号", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["420.00㎡", "客栈", "砖木结构"] },
]

export const useHousingStore = create<HousingState>((set) => ({
  houses: SEED,
  addHouse: (item) => set((s) => ({ houses: [...s.houses, item] })),
  updateHouse: (id, fields) => set((s) => ({ houses: s.houses.map((h) => (h.id === id ? { ...h, ...fields } : h)) })),
  deleteHouse: (id) => set((s) => ({ houses: s.houses.filter((h) => h.id !== id) })),
}))