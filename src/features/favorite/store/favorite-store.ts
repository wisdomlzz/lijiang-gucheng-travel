import { create } from "zustand"
import type { FavoriteItem } from "../../../shared/types"

type FavoriteState = {
  favorites: FavoriteItem[]
  getByUser: (userId: string) => FavoriteItem[]
  isFavorited: (userId: string, type: FavoriteItem["type"], itemId: number | string) => boolean
  add: (item: Omit<FavoriteItem, "id" | "savedAt">) => void
  remove: (id: string) => void
  toggle: (item: Omit<FavoriteItem, "id" | "savedAt">) => void
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [
    { id: "fav1", userId: "u_c_001", type: "merchant", itemId: 1, name: "纳西人家餐厅", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400", shop: "餐饮商家", savedAt: "2026-05-08" },
    { id: "fav2", userId: "u_c_001", type: "route", itemId: 1, name: "古城经典一日游", img: "https://images.unsplash.com/photo-1528127269322-7c8d1f6e4c1f?w=400", savedAt: "2026-05-07" },
    { id: "fav3", userId: "u_c_001", type: "article", itemId: 3, name: "东巴纸：从树皮到文字的千年工艺", img: "https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400", savedAt: "2026-05-06" },
  ],

  getByUser: (userId) => get().favorites.filter((f) => f.userId === userId),
  isFavorited: (userId, type, itemId) => {
    const numId = typeof itemId === "string" ? Number(itemId) : itemId
    return get().favorites.some((f) => f.userId === userId && f.type === type && f.itemId === numId)
  },
  add: (item) => set((s) => ({ favorites: [{ ...item, itemId: typeof item.itemId === "string" ? Number(item.itemId) : item.itemId, id: `fav_${Date.now()}`, savedAt: new Date().toISOString().slice(0, 10) }, ...s.favorites] })),
  remove: (id) => set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),
  toggle: (item) => {
    const state = get()
    const numId = typeof item.itemId === "string" ? Number(item.itemId) : item.itemId
    const existing = state.favorites.find((f) => f.userId === item.userId && f.type === item.type && f.itemId === numId)
    existing ? state.remove(existing.id) : state.add(item)
  },
}))

export type { FavoriteItem } from "../../../shared/types"
