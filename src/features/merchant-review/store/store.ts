import { create } from "zustand"
import { useContentMerchantStore } from "../../content/store/merchant-store"
import { useNotificationStore } from "@/platform/notification"

// ============================================================
// 商家信息审核 —— 商户自助提交店铺变更 + PC 审核
// 商家入驻闭环：入驻审核(已有 supplier) → 我的店铺 → 信息变更 → 此处审核
// 审核通过后自动更新 merchant-store 中对应商家数据
// ============================================================

export interface MerchantChangeRequest {
  id: string
  supplierId: string
  supplierName: string
  merchantName: string // 店铺名
  fields: { field: string; label: string; oldValue: string; newValue: string }[]
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewer?: string
  rejectReason?: string
}

type MerchantReviewState = {
  requests: MerchantChangeRequest[]
  getPending: () => MerchantChangeRequest[]
  getBySupplier: (supplierId: string) => MerchantChangeRequest[]
  /** 商户提交变更（C端我的店铺调用） */
  submitChange: (input: Omit<MerchantChangeRequest, "id" | "status" | "submittedAt">) => void
  /** 审核通过：更新请求状态 + 将变更应用到 merchant-store */
  approve: (id: string, reviewer: string) => void
  reject: (id: string, reviewer: string, reason: string) => void
}

const SEED: MerchantChangeRequest[] = [
  {
    id: "mcr1",
    supplierId: "sup_001",
    supplierName: "古城文创·王老板",
    merchantName: "古城文创集合店",
    fields: [
      { field: "hours", label: "营业时间", oldValue: "09:00-22:00", newValue: "08:30-23:00" },
      { field: "phone", label: "联系电话", oldValue: "139-8888-3456", newValue: "139-8888-9999" },
    ],
    status: "pending",
    submittedAt: "2026-06-27 15:30",
  },
  {
    id: "mcr2",
    supplierId: "sup_002",
    supplierName: "丽江云味餐厅",
    merchantName: "纳西人家餐厅",
    fields: [
      {
        field: "description",
        label: "店铺简介",
        oldValue: "主营纳西特色餐饮",
        newValue: "主营纳西特色餐饮，新增腊排骨火锅套餐",
      },
    ],
    status: "pending",
    submittedAt: "2026-06-28 10:00",
  },
  {
    id: "mcr3",
    supplierId: "sup_001",
    supplierName: "古城文创·王老板",
    merchantName: "雪山清吧",
    fields: [{ field: "barType", label: "酒吧类型", oldValue: "民谣清吧", newValue: "民谣驻唱+精酿啤酒" }],
    status: "approved",
    submittedAt: "2026-06-20 11:00",
    reviewedAt: "2026-06-21 09:30",
    reviewer: "管理员",
  },
]

export const useMerchantReviewStore = create<MerchantReviewState>((set, get) => ({
  requests: SEED,
  getPending: () => get().requests.filter((r) => r.status === "pending"),
  getBySupplier: (supplierId) => get().requests.filter((r) => r.supplierId === supplierId),
  submitChange: (input) =>
    set((s) => ({
      requests: [
        { ...input, id: `mcr${Date.now()}`, status: "pending", submittedAt: new Date().toLocaleString("zh-CN") },
        ...s.requests,
      ],
    })),

  approve: (id, reviewer) => {
    const req = get().requests.find((r) => r.id === id)
    if (!req) return

    // 1. 更新请求状态
    set((s) => ({
      requests: s.requests.map((r) =>
        r.id === id ? { ...r, status: "approved", reviewedAt: new Date().toLocaleString("zh-CN"), reviewer } : r
      ),
    }))

    // 2. 将变更应用到 merchant-store
    const merchantStore = useContentMerchantStore.getState()
    const merchant = merchantStore.merchants.find((m) => m.name === req.merchantName)
    if (merchant) {
      const updates: Record<string, string> = {}
      req.fields.forEach((f) => {
        updates[f.field] = f.newValue
      })
      merchantStore.updateMerchant(merchant.id, updates)
    }

    // 3. 通知申请人
    if (req) {
      useNotificationStore.getState().addNotification({
        type: "system",
        title: "店铺信息变更已通过",
        summary: `您提交的「${req.merchantName}」信息变更已审核通过。`,
        targetUrl: "/c/my-shop",
      })
    }
  },

  reject: (id, reviewer, reason) => {
    set((s) => ({
      requests: s.requests.map((r) =>
        r.id === id
          ? { ...r, status: "rejected", reviewedAt: new Date().toLocaleString("zh-CN"), reviewer, rejectReason: reason }
          : r
      ),
    }))

    const req = get().requests.find((r) => r.id === id)
    if (req) {
      useNotificationStore.getState().addNotification({
        type: "system",
        title: "店铺信息变更未通过",
        summary: `「${req.merchantName}」的信息变更未通过。原因：${reason}。`,
        targetUrl: "/c/my-shop",
      })
    }
  },
}))
