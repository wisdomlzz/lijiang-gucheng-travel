import { create } from "zustand"
import type { TrustScore, ScoreChangeRecord, ScoreAdjustRecord } from "../types/trust-score"
import { TRUST_SCORE_CONFIG } from "../types/trust-score"

const SEED_TRUST_SCORES: TrustScore[] = [
  { staffId: "s1", supplierId: "sup_001", name: "李师傅", roleTag: "便民服务人员", trustScore: 78, status: "正常", totalOrders: 156, totalRatings: 142, rating5Count: 98, rating4Count: 35, rating3Count: 5, rating2Count: 3, rating1Count: 1, complaintCount: 3, rejectionCount: 1, scoreHistory: [{ id: "h1", date: "2026-05-01", change: -3, reason: "服务迟到投诉" }, { id: "h2", date: "2026-04-20", change: -4, reason: "服务态度投诉" }] },
  { staffId: "s2", supplierId: "sup_001", name: "王导游", roleTag: "讲解员", trustScore: 95, status: "正常", totalOrders: 89, totalRatings: 85, rating5Count: 72, rating4Count: 10, rating3Count: 2, rating2Count: 1, rating1Count: 0, complaintCount: 0, rejectionCount: 0, scoreHistory: [{ id: "h3", date: "2026-04-15", change: 3, reason: "讲解细致获赞" }] },
  { staffId: "s3", supplierId: "sup_001", name: "张司机", roleTag: "包车司机", trustScore: 88, status: "正常", totalOrders: 234, totalRatings: 220, rating5Count: 180, rating4Count: 30, rating3Count: 6, rating2Count: 3, rating1Count: 1, complaintCount: 5, rejectionCount: 2, scoreHistory: [{ id: "h4", date: "2026-04-28", change: -5, reason: "绕路投诉" }] },
  { staffId: "s4", supplierId: "sup_001", name: "赵旅拍", roleTag: "旅拍", trustScore: 52, status: "观察期", totalOrders: 67, totalRatings: 62, rating5Count: 45, rating4Count: 12, rating3Count: 3, rating2Count: 1, rating1Count: 1, complaintCount: 6, rejectionCount: 3, observationStartAt: "2026-04-11", lastComplaintAt: "2026-05-01", scoreHistory: [{ id: "h5", date: "2026-05-02", change: -6, reason: "成片质量差投诉" }, { id: "h6", date: "2026-04-22", change: -5, reason: "修图过度投诉" }] },
]

const SEED_ADJUST_RECORDS: ScoreAdjustRecord[] = []

function nowStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function makeHistoryId() { return `h${Date.now()}${Math.random().toString(36).slice(2, 6)}` }

type TrustScoreState = {
  scores: TrustScore[]
  adjustRecords: ScoreAdjustRecord[]
  getScore: (staffId: string) => TrustScore | undefined
  getScoresBySupplier: (supplierId: string) => TrustScore[]
  addRatingBonus: (staffId: string, rating: number, orderId: string) => void
  addComplaintDeduction: (staffId: string, level: string, complaintId: string) => void
  addRejectionDeduction: (staffId: string) => void
  adminAdjust: (staffId: string, operatorId: string, operatorName: string, change: number, reason: string) => void
  getAdjustRecords: (staffId: string) => ScoreAdjustRecord[]
}

export const useTrustScoreStore = create<TrustScoreState>((set, get) => ({
  scores: SEED_TRUST_SCORES,
  adjustRecords: SEED_ADJUST_RECORDS,

  getScore: (staffId) => get().scores.find(s => s.staffId === staffId),

  getScoresBySupplier: (supplierId) => get().scores.filter(s => s.supplierId === supplierId),

  addRatingBonus: (staffId, rating, orderId) => {
    const bonus = rating === 5 ? TRUST_SCORE_CONFIG.bonusRating5 : rating === 4 ? TRUST_SCORE_CONFIG.bonusRating4 : 0
    set(s => ({
      scores: s.scores.map(sc => {
        if (sc.staffId !== staffId) return sc
        return {
          ...sc,
          trustScore: Math.min(100, sc.trustScore + bonus),
          totalRatings: sc.totalRatings + 1,
          rating5Count: rating === 5 ? sc.rating5Count + 1 : sc.rating5Count,
          rating4Count: rating === 4 ? sc.rating4Count + 1 : sc.rating4Count,
          rating3Count: rating === 3 ? sc.rating3Count + 1 : sc.rating3Count,
          rating2Count: rating === 2 ? sc.rating2Count + 1 : sc.rating2Count,
          rating1Count: rating === 1 ? sc.rating1Count + 1 : sc.rating1Count,
          scoreHistory: [{ id: makeHistoryId(), date: nowStr(), change: bonus, reason: `用户${rating}星评价`, orderId }, ...(sc.scoreHistory || [])],
        }
      })
    }))
  },

  addComplaintDeduction: (staffId, level, complaintId) => {
    const deduction = TRUST_SCORE_CONFIG.deductionComplaint[level] || -3
    set(s => ({
      scores: s.scores.map(sc => {
        if (sc.staffId !== staffId) return sc
        const newScore = Math.max(0, sc.trustScore + deduction)
        const newStatus = newScore < 60 ? "观察期" : "正常"
        return {
          ...sc,
          trustScore: newScore,
          status: newStatus,
          complaintCount: sc.complaintCount + 1,
          observationStartAt: newStatus === "观察期" && sc.status !== "观察期" ? nowStr() : sc.observationStartAt,
          lastComplaintAt: nowStr(),
          scoreHistory: [{ id: makeHistoryId(), date: nowStr(), change: deduction, reason: `投诉成立(${level})`, complaintId }, ...(sc.scoreHistory || [])],
        }
      })
    }))
  },

  addRejectionDeduction: (staffId) => {
    set(s => ({
      scores: s.scores.map(sc => {
        if (sc.staffId !== staffId) return sc
        if (sc.rejectionCount + 1 < TRUST_SCORE_CONFIG.rejectionThreshold) {
          return { ...sc, rejectionCount: sc.rejectionCount + 1 }
        }
        const deduction = TRUST_SCORE_CONFIG.deductionRejection
        const newScore = Math.max(0, sc.trustScore + deduction)
        return {
          ...sc,
          rejectionCount: 0,
          trustScore: newScore,
          status: newScore < 60 ? "观察期" : "正常",
          scoreHistory: [{ id: makeHistoryId(), date: nowStr(), change: deduction, reason: "当日拒单≥3次" }, ...(sc.scoreHistory || [])],
        }
      })
    }))
  },

  adminAdjust: (staffId, operatorId, operatorName, change, reason) => {
    const clamped = Math.max(TRUST_SCORE_CONFIG.adminAdjustMin, Math.min(TRUST_SCORE_CONFIG.adminAdjustMax, change))
    set(s => {
      const sc = s.scores.find(x => x.staffId === staffId)
      if (!sc) return s
      return {
        scores: s.scores.map(x => x.staffId === staffId ? { ...x, trustScore: Math.max(0, Math.min(100, x.trustScore + clamped)), scoreHistory: [{ id: makeHistoryId(), date: nowStr(), change: clamped, reason: `管理员调整: ${reason}` }, ...(x.scoreHistory || [])] } : x),
        adjustRecords: [...s.adjustRecords, { id: `adj${Date.now()}`, staffId, operatorId, operatorName, beforeScore: sc.trustScore, afterScore: sc.trustScore + clamped, reason, createdAt: nowStr() }]
      }
    })
  },

  getAdjustRecords: (staffId) => get().adjustRecords.filter(r => r.staffId === staffId),
}))
