import { create } from "zustand"
import type { Review } from "../types"

type ReviewState = {
  reviews: Review[]
  getByProduct: () => Review[]
  getByUser: (userId: string) => Review[]
  add: (review: Review) => void
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [
    { orderId: "CO20260509001", userId: "u_c_001", rating: 5, staffRating: 5, content: "行李搬运很及时，服务人员沟通清楚，整体体验很好。", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], createdAt: "2026-05-11 20:12", reply: "感谢您的反馈，我们会持续优化便民服务体验。" },
  ],

  getByProduct: () => get().reviews,
  getByUser: (userId) => get().reviews.filter((r) => r.userId === userId),

  add: (review) =>
    set((s) => ({
      reviews: [review, ...s.reviews.filter((r) => r.orderId !== review.orderId)],
    })),
}))
