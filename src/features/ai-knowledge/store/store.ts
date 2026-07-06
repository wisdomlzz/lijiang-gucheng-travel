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

const SEED: KnowledgeItem[] = []

type AIKnowledgeState = {
  items: KnowledgeItem[]
  addItem: (question: string, answer: string) => string
  updateItem: (id: string, fields: Partial<Pick<KnowledgeItem, "question" | "answer" | "status">>) => void
  removeItem: (id: string) => void
  batchImport: (data: { question: string; answer: string }[]) => { success: number; failed: number }
  search: (keyword: string) => KnowledgeItem[]
}

export const useAIKnowledgeStore = create<AIKnowledgeState>((set, get) => ({
  items: [],
  addItem: (question, answer) => {
    syncAction("knowledge.add", () => aiKnowledgeApi.create({ question, answer }), () => {})
    const id = `k-new-${Date.now()}`
    set((s) => ({
      items: [
        ...s.items,
        {
          id,
          question,
          answer,
          status: "enabled",
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        },
      ],
    }))
    return id
  },
  updateItem: (id, fields) => {
    syncAction("knowledge.update", () => aiKnowledgeApi.update(id, fields), () => {})
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, ...fields, updatedAt: new Date().toISOString().slice(0, 10) } : item
      ),
    }))
  },
  removeItem: (id) => {
    syncAction("knowledge.remove", () => aiKnowledgeApi.remove(id), () => {})
    set((s) => ({ items: s.items.filter((item) => item.id !== id) }))
  },
  batchImport: (data) => {
    let success = 0,
      failed = 0
    const newItems: KnowledgeItem[] = []
    for (const item of data) {
      if (!item.question || !item.answer) {
        failed++
        continue
      }
      newItems.push({
        id: `k-import-${Date.now()}-${success}`,
        question: item.question,
        answer: item.answer,
        status: "enabled",
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      })
      success++
    }
    if (newItems.length) set((s) => ({ items: [...s.items, ...newItems] }))
    return { success, failed }
  },
  search: (keyword) =>
    keyword.trim()
      ? get().items.filter((item) => item.question.includes(keyword) || item.answer.includes(keyword))
      : get().items,
}))
