// 服务人员角色标签
export type ServiceRoleTag = "便民服务人员" | "讲解员" | "包车司机" | "旅拍"

// 诚信分配置
export const TRUST_SCORE_CONFIG = {
  maxScore: 100,
  minScore: 0,
  observationThreshold: 60,

  // 加分
  bonusRating5: 1,
  bonusRating4: 0.5,
  bonusNoComplaintDays: 30,
  bonusNoComplaintPoints: 3,

  // 扣分
  deductionComplaint: {
    normal: -3,
    serious: -6,
    severe: -10,
  } as Record<string, number>,
  deductionRejection: -2,
  rejectionThreshold: 3,

  // 管理员调整范围
  adminAdjustMin: -5,
  adminAdjustMax: 5,
} as const

// 诚信分记录
export interface TrustScore {
  staffId: string
  supplierId: string
  name: string
  roleTag: ServiceRoleTag

  trustScore: number
  status: "正常" | "观察期"

  totalOrders: number
  totalRatings: number
  rating5Count: number
  rating4Count: number
  rating3Count: number
  rating2Count: number
  rating1Count: number
  complaintCount: number
  rejectionCount: number

  observationStartAt?: string
  lastComplaintAt?: string
  scoreHistory?: ScoreChangeRecord[]
}

export interface ScoreChangeRecord {
  id: string
  date: string
  change: number
  reason: string
  orderId?: string
  complaintId?: string
}

export interface ScoreAdjustRecord {
  id: string
  staffId: string
  operatorId: string
  operatorName: string
  beforeScore: number
  afterScore: number
  reason: string
  createdAt: string
}
