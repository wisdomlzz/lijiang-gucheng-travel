import { create } from "zustand"
import { aiKnowledgeApi } from "@/api/client"
import { syncAction } from "@/api/sync"

interface KnowledgeItem {
  id: string
  question: string
  answer: string
  status: "enabled" | "disabled"
  createdAt: string
  updatedAt: string
}

type AIKnowledgeState = {
  items: KnowledgeItem[]
  addItem: (question: string, answer: string) => Promise<string | undefined>
  updateItem: (id: string, fields: Partial<Pick<KnowledgeItem, "question" | "answer" | "status">>) => Promise<void>
  removeItem: (id: string) => Promise<void>
  batchImport: (data: { question: string; answer: string }[]) => Promise<{ success: number; failed: number }>
  search: (keyword: string) => KnowledgeItem[]
}

export const useAIKnowledgeStore = create<AIKnowledgeState>((set, get) => ({
  items: [],
  addItem: async (question, answer) => {
    let newId: string | undefined
    await syncAction(
      "knowledge.add",
      () => aiKnowledgeApi.create({ question, answer }),
      (result) => {
        newId = result.id
        set((s) => ({ items: [result, ...s.items] }))
      },
    )
    return newId
  },
  updateItem: async (id, fields) => {
    await syncAction(
      "knowledge.update",
      () => aiKnowledgeApi.update(id, fields),
      (result) => {
        set((s) => ({ items: s.items.map((item) => (item.id === id ? result : item)) }))
      },
    )
  },
  removeItem: async (id) => {
    await syncAction("knowledge.remove", () => aiKnowledgeApi.remove(id), () => {
      set((s) => ({ items: s.items.filter((item) => item.id !== id) }))
    })
  },
  batchImport: async (data) => {
    let success = 0
    let failed = 0
    for (const item of data) {
      if (!item.question || !item.answer) {
        failed++
        continue
      }
      const result = await syncAction(
        "knowledge.batchImport",
        () => aiKnowledgeApi.create({ question: item.question, answer: item.answer }),
        (r) => {
          set((s) => ({ items: [r, ...s.items] }))
        },
      )
      if (result) success++
      else failed++
    }
    return { success, failed }
  },
  search: (keyword) =>
    keyword.trim()
      ? get().items.filter((item) => item.question.includes(keyword) || item.answer.includes(keyword))
      : get().items,
}))
