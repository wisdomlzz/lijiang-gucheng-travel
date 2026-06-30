import { create } from "zustand"
import type { HeritageItem, HeritageType } from "../types"
import { heritageData } from "../../c-end/data/heritage"

export const heritageTypeMeta: Record<HeritageType, { label: string; icon: string }> = {
  road: { label: "街巷", icon: "navigation" },
  water: { label: "水系", icon: "droplets" },
  well: { label: "古井", icon: "circle" },
  bridge: { label: "桥梁", icon: "landmark" },
  "ancient-tree": { label: "古树", icon: "tree-pine" },
  "protected-house": { label: "民居", icon: "house" },
  "historic-building": { label: "历史建筑", icon: "building" },
  "human-environment": { label: "人文环境", icon: "users" },
}

type HeritageManageState = {
  items: Record<HeritageType, HeritageItem[]>
  activeType: HeritageType
  setActiveType: (type: HeritageType) => void
  createItem: (type: HeritageType, item: Omit<HeritageItem, "id" | "type">) => void
  updateItem: (type: HeritageType, id: string, updates: Partial<HeritageItem>) => void
  deleteItem: (type: HeritageType, id: string) => void
}

export const useHeritageManageStore = create<HeritageManageState>((set) => ({
  items: heritageData as Record<HeritageType, HeritageItem[]>,
  activeType: "road",
  setActiveType: (type) => set({ activeType: type }),
  createItem: (type, item) => set((s) => ({ items: { ...s.items, [type]: [{ ...item, id: `H${Date.now()}`, type } as HeritageItem, ...(s.items[type] || [])] } })),
  updateItem: (type, id, updates) => set((s) => ({ items: { ...s.items, [type]: (s.items[type] || []).map((h) => h.id === id ? { ...h, ...updates } : h) } })),
  deleteItem: (type, id) => set((s) => ({ items: { ...s.items, [type]: (s.items[type] || []).filter((h) => h.id !== id) } })),
}))

export type { HeritageType } from "../types"
