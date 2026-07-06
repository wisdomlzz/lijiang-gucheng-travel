import { create } from "zustand"
import { useAuthStore } from "@/platform/auth"
import { useContentMerchantStore } from "../../content/store/merchant-store"
import { useNotificationStore } from "@/platform/notification"
import { merchantRegApi } from "@/api/client"
import { syncAction } from "@/api/sync"

// ============================================================
// 古城商户认领 & 入驻申请
// C端游客提交认领/入驻申请 → 桌面端审核 → 通过后获得 supplier 角色 + 商家入库
// ============================================================

export interface ShopClaimRequest {
  id: string
  type: "claim" | "new_shop" // 认领已有店铺 OR 新建店铺
  userId: string
  userName: string
  userPhone: string

  // claim 场景：用户声称的店铺
  claimedShopId?: string // 用户声称的店铺 ID
  claimedShopName?: string // 用户声称的店铺名

  // new_shop 场景：用户提交的新店铺信息
  newShopName?: string
  newCategory?: string
  newAddress?: string
  newPhone?: string
  newDescription?: string
  newHours?: string

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
  }) => void
  /** 提交入驻申请（店铺不存在，新建） */
  submitRegistration: (input: {
    userId: string
    userName: string
    userPhone: string
    newShopName: string
    newCategory: string
    newAddress: string
    newPhone: string
    newDescription: string
    newHours: string
  }) => void
  approveRegistration: (id: string, reviewer: string) => void
  rejectRegistration: (id: string, reviewer: string, reason: string) => void
}

export const useMerchantRegistrationStore = create<RegistrationState>((set, get) => ({
  requests: [],

  getPending: () => get().requests.filter((r) => r.status === "pending"),

  getByUserId: (userId) => get().requests.filter((r) => r.userId === userId),

  submitClaim: (input) => {
    const item: ShopClaimRequest = {
      id: `claim_${Date.now()}`,
      type: "claim",
      userId: input.userId,
      userName: input.userName,
      userPhone: input.userPhone,
      claimedShopId: input.claimedShopId,
      claimedShopName: input.claimedShopName,
      status: "pending",
      submittedAt: new Date().toLocaleString("zh-CN"),
    }
    syncAction("submitClaim", () => merchantRegApi.create(item), () => {})
    set((s) => ({ requests: [item, ...s.requests] }))
  },

  submitRegistration: (input) => {
    const item: ShopClaimRequest = {
      id: `reg_${Date.now()}`,
      type: "new_shop",
      userId: input.userId,
      userName: input.userName,
      userPhone: input.userPhone,
      newShopName: input.newShopName,
      newCategory: input.newCategory,
      newAddress: input.newAddress,
      newPhone: input.newPhone,
      newDescription: input.newDescription,
      newHours: input.newHours,
      status: "pending",
      submittedAt: new Date().toLocaleString("zh-CN"),
    }
    syncAction("submitRegistration", () => merchantRegApi.create(item), () => {})
    set((s) => ({ requests: [item, ...s.requests] }))
  },

  approveRegistration: (id, reviewer) => {
    const req = get().requests.find((r) => r.id === id)
    if (!req) return

    // 1. 更新申请状态
    set((s) => ({
      requests: s.requests.map((r) =>
        r.id === id ? { ...r, status: "approved", reviewedAt: new Date().toLocaleString("zh-CN"), reviewer } : r
      ),
    }))

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
        name: req.newShopName ?? "",
        category: req.newCategory ?? "",
        source: "商家提交",
        reviewStatus: "通过",
        publishedAt: new Date().toLocaleString("zh-CN"),
        logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop",
        cover: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
        description: req.newDescription ?? "",
        address: req.newAddress ?? "",
        phone: req.newPhone ?? "",
        hours: req.newHours ?? "",
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
      summary: `您的店铺「${req.type === "claim" ? req.claimedShopName : req.newShopName}」已审核通过，您现在可以管理店铺信息了。`,
      targetUrl: "/c/my-shop",
    })
  },

  rejectRegistration: (id, reviewer, reason) => {
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
        title: "店铺认领审核未通过",
        summary: `您的申请未通过。原因：${reason}。`,
        targetUrl: "/c/merchant-services",
      })
    }
  },
}))
