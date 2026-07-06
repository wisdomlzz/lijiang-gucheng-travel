import { create } from "zustand"
import { contentApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { NewsItem } from "../../../shared/types/content-types"

const DEFAULT: NewsItem[] = []

type State = {
  news: NewsItem[]
  addNews: (item: NewsItem) => void
  updateNews: (id: string, fields: Partial<NewsItem>) => void
  deleteNews: (id: string) => void
}

export const useContentNewsStore = create<State>((set) => ({
  news: [],
  addNews: (item) => {
    syncAction("news.add", () => contentApi.news.create(item), () => {})
    set((s) => ({ news: [...s.news, item] }))
  },
  updateNews: (id, fields) => {
    syncAction("news.update", () => contentApi.news.update(id, fields), () => {})
    set((s) => ({ news: s.news.map((n) => (n.id === id ? { ...n, ...fields } : n)) }))
  },
  deleteNews: (id) => {
    syncAction("news.delete", () => contentApi.news.remove(id), () => {})
    set((s) => ({ news: s.news.filter((n) => n.id !== id) }))
  },
}))
