import { create } from "zustand"
import { useAuthStore } from "@/platform/auth"
import { useContentMerchantStore } from "../../../platform/content/merchant-store"
import { useNotificationStore } from "@/platform/notification"
import { api, merchantRegApi } from "@/api/client"
import { syncAction } from "@/api/sync"

// ============================================================
// 古城商户认领 & 入驻申请
// C端游客提交认领/入驻申请 → 桌面端审核 → 通过后获得 supplier 角色 + 商家入库
// ============================================================

export interface ShopClaimRequest {
  id: string
  type: "claim" | "new_shop"
  userId: string
  userName: string
  userPhone: string

  // claim 场景：用户声称的店铺
  claimedShopId?: string
  claimedShopName?: string

  // claim 场景：用户编辑的字段（FINDING 1）
  claimedCategory?: string
  claimedPhone?: string
  claimedDesc?: string

  // new_shop 场景：用户提交的新店铺信息
  merchantName?: string
  category?: string
  address?: string
  phone?: string
  description?: string

  // 资质证明图片（base64 data url 数组）
  credentialImages?: string[]
  lat?: number
  lng?: number

  // new_shop 封面（FINDING 2）
  coverImage?: string

  // 审核信息
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewer?: string
  rejectReason?: string
}

type RegistrationState = {
  requests: ShopClaimRequest[]
  getPending: () => ShopClaimRequest[]
  getByUserId: (userId: string) => ShopClaimRequest[]
  /** 提交认领申请（店铺已存在，用户认领） */
  submitClaim: (input: {
    userId: string
    userName: string
    userPhone: string
    claimedShopId: string
    claimedShopName: string
    credentialImages?: string[]
    claimedCategory?: string
    claimedPhone?: string
    claimedDesc?: string
  }) => Promise<void>
  /** 提交入驻申请（店铺不存在，新建） */
  submitRegistration: (input: {
    userId: string
    userName: string
    userPhone: string
    merchantName: string
    category: string
    address: string
    phone: string
    description: string
    credentialImages?: string[]
    lat?: number
    lng?: number
    coverImage?: string
  }) => Promise<void>
  approveRegistration: (id: string, reviewer: string) => Promise<void>
  rejectRegistration: (id: string, reviewer: string, reason: string) => Promise<void>
}

export const useMerchantRegistrationStore = create<RegistrationState>((set, get) => ({
  requests: [],

  getPending: () => get().requests.filter((r) => r.status === "pending"),

  getByUserId: (userId) => get().requests.filter((r) => r.userId === userId),

  submitClaim: async (input) => {
    const payload = {
      type: "claim" as const,
      userId: input.userId,
      userName: input.userName,
      userPhone: input.userPhone,
      claimedShopId: input.claimedShopId,
      claimedShopName: input.claimedShopName,
      credentialImages: input.credentialImages,
      status: "pending" as const,
    }
    await syncAction("submitClaim", () => merchantRegApi.create(payload), (result) => {
      set((s) => ({ requests: [result, ...s.requests] }))
    })
  },

  submitRegistration: async (input) => {
    const payload = {
      type: "new_shop" as const,
      userId: input.userId,
      userName: input.userName,
      userPhone: input.userPhone,
      merchantName: input.merchantName,
      category: input.category,
      address: input.address,
      contactName: input.userName,
      contactPhone: input.userPhone,
      credentialImages: input.credentialImages,
      lat: input.lat,
      lng: input.lng,
      status: "pending" as const,
    }
    await syncAction("submitRegistration", () => merchantRegApi.create(payload), (result) => {
      set((s) => ({ requests: [result, ...s.requests] }))
    })
  },

  approveRegistration: async (id, reviewer) => {
    const req = get().requests.find((r) => r.id === id)
    if (!req) return

    // 1. 更新申请状态（走 API）
    await syncAction(
      "approveRegistration",
      () => api.update("merchant-registrations", id, { status: "approved", reviewer }),
      (result) => {
        set((s) => ({
          requests: s.requests.map((r) => (r.id === id ? result : r)),
        }))
      },
    )

    // 2. 认领场景：更新已有商家的认领状态
    const merchantStore = useContentMerchantStore.getState()
    if (req.type === "claim" && req.claimedShopId) {
      const merchant = merchantStore.merchants.find((m) => m.id === req.claimedShopId)
      if (merchant) {
        merchantStore.updateMerchant(merchant.id, {
          claimStatus: "claimed",
          claimedBy: req.userId,
          claimedAt: new Date().toLocaleString("zh-CN"),
          relatedUser: req.userName,
        })
      }
    }

    // 3. 入驻场景：创建新商家，状态设为 claimed
    if (req.type === "new_shop") {
      merchantStore.addMerchant({
        id: `m_${Date.now()}`,
        name: req.merchantName ?? "",
        category: req.category ?? "",
        source: "商家提交",
        reviewStatus: "通过",
        publishedAt: new Date().toLocaleString("zh-CN"),
        logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop",
        cover: req.coverImage || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
        description: req.description ?? "",
        address: req.address ?? "",
        phone: req.phone ?? "",
        hours: "",
        rating: 5.0,
        reviewCount: 0,
        creditScore: 80,
        openYear: new Date().getFullYear(),
        gallery: [],
        certificates: [],
        relatedUser: req.userName,
        claimStatus: "claimed",
        claimedBy: req.userId,
        claimedAt: new Date().toLocaleString("zh-CN"),
        contactName: req.userName,
        contactPhone: req.userPhone,
        businessLicense: req.credentialImages?.[0],
        detailImages: [],
      })
    }

    // 4. 两种场景都追加 supplier 角色
    const authState = useAuthStore.getState()
    const user = authState.user
    if (user && user.id === req.userId && !user.roles.includes("supplier")) {
      useAuthStore.getState().updateUser({
        roles: [...user.roles, "supplier"],
        supplierId: `sup_${req.id}`,
      })
    }

    // 5. 通知申请人审核通过
    useNotificationStore.getState().addNotification({
      type: "system",
      title: "店铺认领审核通过",
      summary: `您的店铺「${req.type === "claim" ? req.claimedShopName : req.merchantName}」已审核通过，您现在可以管理店铺信息了。`,
      targetUrl: "/c/my-shop",
    })
  },

  rejectRegistration: async (id, reviewer, reason) => {
    await syncAction(
      "rejectRegistration",
      () => api.update("merchant-registrations", id, { status: "rejected", reviewer, rejectReason: reason }),
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
        title: "店铺认领审核未通过",
        summary: `您的申请未通过。原因：${reason}。`,
        targetUrl: "/c/merchant-services",
      })
    }
  },
}))