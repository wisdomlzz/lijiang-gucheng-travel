import { create } from "zustand"
import type { FavoriteItem } from "../../../shared/types"
import { favoritesApi } from "@/api/client"
import { syncAction } from "@/api/sync"

type FavoriteState = {
  favorites: FavoriteItem[]
  getByUser: (userId: string) => FavoriteItem[]
  isFavorited: (userId: string, type: FavoriteItem["type"], itemId: number | string) => boolean
  add: (item: Omit<FavoriteItem, "id" | "savedAt">) => Promise<void>
  remove: (id: string) => Promise<void>
  toggle: (item: Omit<FavoriteItem, "id" | "savedAt">) => Promise<void>
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],

  getByUser: (userId) => get().favorites.filter((f) => f.userId === userId),
  isFavorited: (userId, type, itemId) => {
    const numId = typeof itemId === "string" ? Number(itemId) : itemId
    return get().favorites.some((f) => f.userId === userId && f.type === type && f.itemId === numId)
  },
  add: async (item) => {
    const payload = {
      ...item,
      itemId: typeof item.itemId === "string" ? Number(item.itemId) : item.itemId,
    }
    await syncAction("addFavorite", () => favoritesApi.create(payload), (result) => {
      set((s) => ({ favorites: [result, ...s.favorites] }))
    })
  },
  remove: async (id) => {
    await syncAction("removeFavorite", () => favoritesApi.remove(id), () => {
      set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) }))
    })
  },
  toggle: async (item) => {
    const state = get()
    const numId = typeof item.itemId === "string" ? Number(item.itemId) : item.itemId
    const existing = state.favorites.find((f) => f.userId === item.userId && f.type === item.type && f.itemId === numId)
    if (existing) {
      await state.remove(existing.id)
    } else {
      await state.add(item)
    }
  },
}))

export type { FavoriteItem } from "../../../shared/types"
