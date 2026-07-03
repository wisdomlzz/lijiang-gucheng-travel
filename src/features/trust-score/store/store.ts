import { create } from "zustand"

// ====== Trust-score types (colocated, removed from shared/types) ======
type ServiceRoleTag = "便民服务人员" | "讲解员" | "包车司机" | "旅拍"

export const TRUST_SCORE_CONFIG = {
  maxScore: 100, minScore: 0, observationThreshold: 60,
  bonusRating5: 1, bonusRating4: 0.5,
  deductionComplaint: { normal: -3, serious: -6, severe: -10 } as Record<string, number>,
  deductionRejection: -2, rejectionThreshold: 3,
  adminAdjustMin: -5, adminAdjustMax: 5,
} as const

export interface ScoreChangeRecord {
  id: string; date: string; change: number; reason: string
  orderId?: string; complaintId?: string
}
export interface ScoreAdjustRecord {
  id: string; staffId: string; operatorId: string; operatorName: string
  beforeScore: number; afterScore: number; reason: string; createdAt: string
}
export interface TrustScore {
  staffId: string; supplierId: string; name: string; roleTag: ServiceRoleTag
  trustScore: number; status: "正常" | "观察期"
  totalOrders: number; totalRatings: number
  rating5Count: number; rating4Count: number; rating3Count: number; rating2Count: number; rating1Count: number
  complaintCount: number; rejectionCount: number
  observationStartAt?: string; lastComplaintAt?: string
  scoreHistory?: ScoreChangeRecord[]
}

const SEED_SCORES: TrustScore[] = [
  { staffId: "s1", supplierId: "sup_001", name: "李师傅", roleTag: "便民服务人员", trustScore: 78, status: "正常", totalOrders: 156, totalRatings: 142, rating5Count: 98, rating4Count: 35, rating3Count: 5, rating2Count: 3, rating1Count: 1, complaintCount: 3, rejectionCount: 1, scoreHistory: [{ id: "h1", date: "2026-05-01", change: -3, reason: "服务迟到投诉" }, { id: "h2", date: "2026-04-20", change: -4, reason: "服务态度投诉" }] },
  { staffId: "s2", supplierId: "sup_001", name: "王导游", roleTag: "讲解员", trustScore: 95, status: "正常", totalOrders: 89, totalRatings: 85, rating5Count: 72, rating4Count: 10, rating3Count: 2, rating2Count: 1, rating1Count: 0, complaintCount: 0, rejectionCount: 0, scoreHistory: [] },
  { staffId: "s3", supplierId: "sup_001", name: "张司机", roleTag: "包车司机", trustScore: 88, status: "正常", totalOrders: 234, totalRatings: 220, rating5Count: 180, rating4Count: 30, rating3Count: 6, rating2Count: 3, rating1Count: 1, complaintCount: 5, rejectionCount: 2, scoreHistory: [] },
  { staffId: "s4", supplierId: "sup_001", name: "赵旅拍", roleTag: "旅拍", trustScore: 52, status: "观察期", totalOrders: 67, totalRatings: 62, rating5Count: 45, rating4Count: 12, rating3Count: 3, rating2Count: 1, rating1Count: 1, complaintCount: 6, rejectionCount: 3, observationStartAt: "2026-04-11", lastComplaintAt: "2026-05-01", scoreHistory: [{ id: "h5", date: "2026-05-02", change: -6, reason: "成片质量差投诉" }, { id: "h6", date: "2026-04-22", change: -5, reason: "修图过度投诉" }] },
]

// ====== Supplier rating data (merged from supplier-rating.ts) ======
type SupplierRatingData = { totalRatings: number; rating5Count: number; rating4Count: number; rating3Count: number; rating2Count: number; rating1Count: number }
const SEED_SUPPLIER_RATINGS: Record<string, SupplierRatingData> = {
  sup_001: { totalRatings: 1234, rating5Count: 980, rating4Count: 200, rating3Count: 30, rating2Count: 15, rating1Count: 9 },
  sup_002: { totalRatings: 356, rating5Count: 280, rating4Count: 50, rating3Count: 18, rating2Count: 6, rating1Count: 2 },
  sup_003: { totalRatings: 512, rating5Count: 390, rating4Count: 80, rating3Count: 28, rating2Count: 10, rating1Count: 4 },
  sup_004: { totalRatings: 128, rating5Count: 95, rating4Count: 22, rating3Count: 7, rating2Count: 3, rating1Count: 1 },
  sup_005: { totalRatings: 203, rating5Count: 160, rating4Count: 30, rating3Count: 8, rating2Count: 4, rating1Count: 1 },
  self: { totalRatings: 5420, rating5Count: 4800, rating4Count: 500, rating3Count: 80, rating2Count: 30, rating1Count: 10 },
}
function computeSupplierRating(data: SupplierRatingData) {
  if (data.totalRatings === 0) return { avgRating: 0, goodRate: 0, creditScore: 0 }
  const avgRating = Math.round((data.rating5Count * 5 + data.rating4Count * 4 + data.rating3Count * 3 + data.rating2Count * 2 + data.rating1Count * 1) / data.totalRatings * 10) / 10
  const goodRate = Math.round((data.rating5Count + data.rating4Count) / data.totalRatings * 100)
  return { avgRating, goodRate, creditScore: goodRate }
}
function incrCounts(d: SupplierRatingData, star: number): SupplierRatingData {
  return { ...d, totalRatings: d.totalRatings + 1, [`rating${star}Count`]: (d as any)[`rating${star}Count`] + 1 }
}

type TrustScoreState = {
  scores: TrustScore[]
  adjustRecords: ScoreAdjustRecord[]
  getScore: (staffId: string) => TrustScore | undefined
  getScoresBySupplier: (supplierId: string) => TrustScore[]
  addRatingBonus: (staffId: string, rating: number) => void
  addComplaintDeduction: (staffId: string, level: string) => void
  adminAdjust: (staffId: string, operatorId: string, operatorName: string, change: number, reason: string) => void

  // Supplier rating (merged from supplier-rating)
  supplierRatings: Record<string, SupplierRatingData>
  addSupplierRating: (supplierId: string, rating: number) => void
  getSupplierRating: (supplierId: string) => { avgRating: number; goodRate: number; creditScore: number; totalRatings: number }
  getAllSupplierRatings: () => [string, SupplierRatingData & { avgRating: number; goodRate: number; creditScore: number }][]
}

function nowStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export const useTrustScoreStore = create<TrustScoreState>((set, get) => ({
  scores: SEED_SCORES,
  adjustRecords: [],
  supplierRatings: SEED_SUPPLIER_RATINGS,

  getScore: (staffId) => get().scores.find((s) => s.staffId === staffId),
  getScoresBySupplier: (supplierId) => get().scores.filter((s) => s.supplierId === supplierId),

  addRatingBonus: (staffId, rating) => set((s) => ({ scores: s.scores.map((sc) => sc.staffId !== staffId ? sc : { ...sc, trustScore: Math.min(100, sc.trustScore + (rating >= 5 ? TRUST_SCORE_CONFIG.bonusRating5 : rating >= 4 ? TRUST_SCORE_CONFIG.bonusRating4 : 0)), totalRatings: sc.totalRatings + 1, [`rating${rating}Count`]: (sc as any)[`rating${rating}Count`] + 1, scoreHistory: [{ id: `h${Date.now()}`, date: nowStr(), change: rating >= 5 ? TRUST_SCORE_CONFIG.bonusRating5 : rating >= 4 ? TRUST_SCORE_CONFIG.bonusRating4 : 0, reason: `用户${rating}星评价` }, ...(sc.scoreHistory || [])] }) })),

  addComplaintDeduction: (staffId, level) => set((s) => ({ scores: s.scores.map((sc) => sc.staffId !== staffId ? sc : (() => { const deduction = TRUST_SCORE_CONFIG.deductionComplaint[level] || -3; const newScore = Math.max(0, sc.trustScore + deduction); return { ...sc, trustScore: newScore, status: newScore < 60 ? "观察期" : "正常", complaintCount: sc.complaintCount + 1, lastComplaintAt: nowStr(), observationStartAt: newScore < 60 && sc.status !== "观察期" ? nowStr() : sc.observationStartAt, scoreHistory: [{ id: `h${Date.now()}`, date: nowStr(), change: deduction, reason: `投诉成立(${level})` }, ...(sc.scoreHistory || [])] } })()) })),

  adminAdjust: (staffId, operatorId, operatorName, change, reason) => {
    const clamped = Math.max(-5, Math.min(5, change))
    set((s) => { const sc = s.scores.find((x) => x.staffId === staffId); if (!sc) return s; return { scores: s.scores.map((x) => x.staffId === staffId ? { ...x, trustScore: Math.max(0, Math.min(100, x.trustScore + clamped)), scoreHistory: [{ id: `h${Date.now()}`, date: nowStr(), change: clamped, reason: `管理员调整: ${reason}` }, ...(x.scoreHistory || [])] } : x), adjustRecords: [...s.adjustRecords, { id: `adj${Date.now()}`, staffId, operatorId, operatorName, beforeScore: sc.trustScore, afterScore: sc.trustScore + clamped, reason, createdAt: nowStr() }] } })
  },

  addSupplierRating: (supplierId, rating) => {
    const star = Math.round(rating)
    if (star < 1 || star > 5) return
    set((s) => {
      const cur = s.supplierRatings[supplierId]
      return { supplierRatings: { ...s.supplierRatings, [supplierId]: cur ? incrCounts(cur, star) : incrCounts({ totalRatings: 0, rating5Count: 0, rating4Count: 0, rating3Count: 0, rating2Count: 0, rating1Count: 0 }, star) } }
    })
  },
  getSupplierRating: (supplierId) => {
    const data = get().supplierRatings[supplierId]
    if (!data) return { avgRating: 0, goodRate: 0, creditScore: 0, totalRatings: 0 }
    return { ...data, ...computeSupplierRating(data) }
  },
  getAllSupplierRatings: () => Object.entries(get().supplierRatings).map(([id, data]) => [id, { ...data, ...computeSupplierRating(data) }]),
}))
