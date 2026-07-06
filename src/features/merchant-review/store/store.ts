import { create } from "zustand"
import { useContentMerchantStore } from "../../content/store/merchant-store"
import { useNotificationStore } from "@/platform/notification"
import { api } from "@/api/client"
import { syncAction } from "@/api/sync"

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
  submitChange: (input: Omit<MerchantChangeRequest, "id" | "status" | "submittedAt">) => Promise<void>
  /** 审核通过：更新请求状态 + 将变更应用到 merchant-store */
  approve: (id: string, reviewer: string) => Promise<void>
  reject: (id: string, reviewer: string, reason: string) => Promise<void>
}

export const useMerchantReviewStore = create<MerchantReviewState>((set, get) => ({
  requests: [],
  getPending: () => get().requests.filter((r) => r.status === "pending"),
  getBySupplier: (supplierId) => get().requests.filter((r) => r.supplierId === supplierId),
  submitChange: async (input) => {
    const payload = { ...input, status: "pending" as const }
    await syncAction(
      "submitMerchantChange",
      () => api.create("merchant-reviews", payload),
      (result) => {
        set((s) => ({ requests: [result, ...s.requests] }))
      },
    )
  },

  approve: async (id, reviewer) => {
    const req = get().requests.find((r) => r.id === id)
    if (!req) return

    // 1. 更新请求状态
    await syncAction(
      "approveMerchantChange",
      () => api.update("merchant-reviews", id, { status: "approved", reviewer }),
      (result) => {
        set((s) => ({
          requests: s.requests.map((r) => (r.id === id ? result : r)),
        }))
      },
    )

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
    useNotificationStore.getState().addNotification({
      type: "system",
      title: "店铺信息变更已通过",
      summary: `您提交的「${req.merchantName}」信息变更已审核通过。`,
      targetUrl: "/c/my-shop",
    })
  },

  reject: async (id, reviewer, reason) => {
    await syncAction(
      "rejectMerchantChange",
      () => api.update("merchant-reviews", id, { status: "rejected", reviewer, rejectReason: reason }),
      (result) => {
        set((s) => ({
          requests: s.requests.map((r) => (r.id === id ? result : r)),
        }))
      },
    )

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
