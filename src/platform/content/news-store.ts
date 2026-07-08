import { create } from "zustand"
import { contentApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { NewsItem } from "../../shared/types/content-types"

type State = {
  news: NewsItem[]
  addNews: (item: NewsItem) => Promise<void>
  updateNews: (id: string, fields: Partial<NewsItem>) => Promise<void>
  deleteNews: (id: string) => Promise<void>
}

export const useContentNewsStore = create<State>((set) => ({
  news: [],
  addNews: async (item) => {
    await syncAction("news.add", () => contentApi.news.create(item), (result) => {
      set((s) => ({ news: [result, ...s.news] }))
    })
  },
  updateNews: async (id, fields) => {
    await syncAction("news.update", () => contentApi.news.update(id, fields), (result) => {
      set((s) => ({ news: s.news.map((n) => (n.id === id ? result : n)) }))
    })
  },
  deleteNews: async (id) => {
    await syncAction("news.delete", () => contentApi.news.remove(id), () => {
      set((s) => ({ news: s.news.filter((n) => n.id !== id) }))
    })
  },
}))