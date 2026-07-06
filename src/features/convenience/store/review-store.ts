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

// ====== Seed Data ======
const SEED_REVIEWS: ReviewData[] = [
  {
    id: "rev_001",
    orderId: "CO20260511001",
    serviceType: "行李搬运",
    staffId: "s1",
    staffName: "李师傅",
    userId: "u_c_001",
    userName: "张小游",
    rating: 5,
    content: "李师傅服务特别好，准时到达，行李搬运非常小心，还帮我提到了房间里，点赞！",
    images: [],
    createdAt: "2026-05-11 16:30",
    repliedAt: "2026-05-11 17:00",
    replyContent: "谢谢您的评价，祝您在丽江玩得开心！",
  },
  {
    id: "rev_002",
    orderId: "CO20260512002",
    serviceType: "送货服务",
    staffId: "s2",
    staffName: "赵丹",
    userId: "u_c_001",
    userName: "张小游",
    rating: 4,
    content: "送货速度很快，不过饮料有一瓶有点漏了，希望包装再加强一些。",
    images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"],
    createdAt: "2026-05-12 14:20",
    repliedAt: "2026-05-12 15:00",
    replyContent: "抱歉给您带来不便，已反馈给配送团队加强包装。",
  },
  {
    id: "rev_003",
    orderId: "CO20260513003",
    serviceType: "建筑垃圾清运",
    staffId: "s3",
    staffName: "张环卫",
    userId: "u_c_s_001",
    userName: "张老板",
    rating: 3,
    content: "清运还算及时，但师傅没有把现场打扫干净，地上留了一些灰尘和碎屑。",
    images: [],
    createdAt: "2026-05-13 10:00",
    followUp: true,
  },
  {
    id: "rev_004",
    orderId: "CO20260514004",
    serviceType: "生活垃圾清运",
    staffId: "s4",
    staffName: "马师傅",
    userId: "u_c_s_001",
    userName: "张老板",
    rating: 5,
    content: "马师傅非常负责，每天准时来清运，垃圾房周边也打扫得很干净。",
    images: [],
    createdAt: "2026-05-14 08:00",
    repliedAt: "2026-05-14 09:00",
    replyContent: "应该的，感谢您的认可！",
  },
  {
    id: "rev_005",
    orderId: "CO20260515005",
    serviceType: "送水服务",
    staffId: "s5",
    staffName: "杨送水",
    userId: "u_c_s_001",
    userName: "张老板",
    rating: 2,
    content: "送水晚了将近一个小时，打电话催了好几次，态度也一般。希望能够改进。",
    images: [],
    createdAt: "2026-05-15 11:30",
    followUp: true,
  },
  {
    id: "rev_006",
    orderId: "CO20260516006",
    serviceType: "布草配送",
    staffId: "s6",
    staffName: "周布草",
    userId: "u_c_s_001",
    userName: "张老板",
    rating: 4,
    content: "布草配送准时，数量也准确，但有一件床单有轻微污渍，希望能加强清洗检查。",
    images: ["https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400"],
    createdAt: "2026-05-16 09:15",
  },
  {
    id: "rev_007",
    orderId: "CO20260517007",
    serviceType: "行李搬运",
    staffId: "s1",
    staffName: "李师傅",
    userId: "u_c_s_001",
    userName: "张老板",
    rating: 5,
    content: "客栈客人行李多，李师傅一趟趟搬完还帮忙分类摆放，非常敬业。",
    images: [],
    createdAt: "2026-05-17 14:00",
    repliedAt: "2026-05-17 15:00",
    replyContent: "多谢老板夸奖，随时为您服务！",
  },
  {
    id: "rev_008",
    orderId: "CO20260518008",
    serviceType: "送货服务",
    staffId: "s2",
    staffName: "赵丹",
    userId: "u_c_s_001",
    userName: "张老板",
    rating: 4,
    content: "送货上门，比较及时，满意。",
    images: [],
    createdAt: "2026-05-18 16:45",
  },
  {
    id: "rev_009",
    orderId: "CO20260519009",
    serviceType: "生活垃圾清运",
    staffId: "s3",
    staffName: "张环卫",
    userId: "u_c_001",
    userName: "张小游",
    rating: 1,
    content: "垃圾车噪音太大，早上六点多就在巷子里作业，影响休息。希望能调整作业时间。",
    images: [],
    createdAt: "2026-05-19 07:00",
    followUp: true,
  },
  {
    id: "rev_010",
    orderId: "CO20260520010",
    serviceType: "送水服务",
    staffId: "s5",
    staffName: "杨送水",
    userId: "u_c_001",
    userName: "张小游",
    rating: 5,
    content: "杨师傅态度很好，还帮忙把水桶安装到饮水机上，服务周到！",
    images: [],
    createdAt: "2026-05-20 10:30",
    repliedAt: "2026-05-20 11:00",
    replyContent: "谢谢，您太客气了！",
  },
  {
    id: "rev_011",
    orderId: "CO20260521011",
    serviceType: "布草配送",
    staffId: "s6",
    staffName: "周布草",
    userId: "u_c_001",
    userName: "张小游",
    rating: 4,
    content: "配送很快，布草质量也不错。",
    images: [],
    createdAt: "2026-05-21 13:00",
  },
  {
    id: "rev_012",
    orderId: "CO20260522012",
    serviceType: "建筑垃圾清运",
    staffId: "s4",
    staffName: "马师傅",
    userId: "u_c_s_001",
    userName: "张老板",
    rating: 3,
    content: "清运速度还可以，但价格偏高，希望能更合理一些。",
    images: [],
    createdAt: "2026-05-22 15:30",
  },
]

// ====== Helpers ======
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
  replyReview: (id: string, content: string) => void
  markFollowUp: (id: string) => void
}

export const useReviewStore = create<ReviewStoreState>((set, get) => ({
  reviews: SEED_REVIEWS,

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

  replyReview: (id, content) => {
    syncAction("replyReview", () => reviewsApi.update(id, { replyContent: content }), () => {})
    set((s) => ({
      reviews: s.reviews.map((r) =>
        r.id === id ? { ...r, replyContent: content, repliedAt: new Date().toLocaleString("zh-CN") } : r
      ),
    }))
  },

  markFollowUp: (id) => {
    const current = get().reviews.find((r) => r.id === id)
    const next = !current?.followUp
    syncAction("markFollowUp", () => reviewsApi.update(id, { followUp: next }), () => {})
    set((s) => ({
      reviews: s.reviews.map((r) => (r.id === id ? { ...r, followUp: next } : r)),
    }))
  },
}))