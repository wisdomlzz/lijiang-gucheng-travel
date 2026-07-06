import { create } from "zustand"
import { reviewsApi } from "@/api/client"
import { syncAction } from "@/api/sync"

// ====== Types ======
export interface ReviewData {
  id: string
  orderId: string
  serviceType: string
  staffId: string
  staffName: string
  userId: string
  userName: string
  rating: number
  content: string
  images: string[]
  createdAt: string
  repliedAt?: string
  replyContent?: string
  autoRated?: boolean
  followUp?: boolean
}

export interface ReviewStats {
  total: number
  positiveRate: number
  pendingReply: number
  negativeCount: number
}

export type ReviewFilter = {
  ratingMin?: number
  ratingMax?: number
  dateFrom?: string
  dateTo?: string
  replyStatus?: "all" | "replied" | "unreplied"
  serviceType?: string
}

function calcPositiveRate(reviews: ReviewData[]): number {
  if (reviews.length === 0) return 0
  const positive = reviews.filter((r) => r.rating >= 4).length
  return Math.round((positive / reviews.length) * 100)
}

// ====== Store ======
type ReviewStoreState = {
  reviews: ReviewData[]

  // Queries
  getStats: () => ReviewStats
  getFiltered: (filter: ReviewFilter) => ReviewData[]
  getReview: (id: string) => ReviewData | undefined

  // Actions
  replyReview: (id: string, content: string) => Promise<void>
  markFollowUp: (id: string) => Promise<void>
}

export const useReviewStore = create<ReviewStoreState>((set, get) => ({
  reviews: [],

  getStats: () => {
    const reviews = get().reviews
    return {
      total: reviews.length,
      positiveRate: calcPositiveRate(reviews),
      pendingReply: reviews.filter((r) => !r.replyContent).length,
      negativeCount: reviews.filter((r) => r.rating <= 2).length,
    }
  },

  getFiltered: (filter) => {
    let list = get().reviews
    if (filter.ratingMin !== undefined) list = list.filter((r) => r.rating >= filter.ratingMin!)
    if (filter.ratingMax !== undefined) list = list.filter((r) => r.rating <= filter.ratingMax!)
    if (filter.dateFrom) list = list.filter((r) => r.createdAt >= filter.dateFrom!)
    if (filter.dateTo) list = list.filter((r) => r.createdAt <= filter.dateTo!)
    if (filter.replyStatus === "replied") list = list.filter((r) => r.replyContent)
    if (filter.replyStatus === "unreplied") list = list.filter((r) => !r.replyContent)
    if (filter.serviceType) list = list.filter((r) => r.serviceType === filter.serviceType)
    return list
  },

  getReview: (id) => get().reviews.find((r) => r.id === id),

  replyReview: async (id, content) => {
    await syncAction<ReviewData>(
      "replyReview",
      () => reviewsApi.update(id, { replyContent: content, repliedAt: new Date().toISOString() }),
      (result) => {
        set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? result : r)) }))
      },
    )
  },

  markFollowUp: async (id) => {
    const current = get().reviews.find((r) => r.id === id)
    const next = !current?.followUp
    await syncAction<ReviewData>(
      "markFollowUp",
      () => reviewsApi.update(id, { followUp: next }),
      (result) => {
        set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? result : r)) }))
      },
    )
  },
}))