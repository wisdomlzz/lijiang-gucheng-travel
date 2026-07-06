import { create } from "zustand"
import type { SupplierApplication } from "../../../shared/types"
import { useNotificationStore } from "@/platform/notification"
import { api, supplierApi } from "@/api/client"
import { syncAction } from "@/api/sync"

type SupplierState = {
  applications: SupplierApplication[]
  addApplication: (app: Omit<SupplierApplication, "id" | "submittedAt" | "status">) => Promise<void>
  updateStatus: (id: string, status: SupplierApplication["status"], reviewer: string, rejectReason?: string) => Promise<void>
  getByPhone: (phone: string) => SupplierApplication[]
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  applications: [],
  addApplication: async (app) => {
    const payload = { ...app, status: "pending" as const }
    await syncAction("addApplication", () => supplierApi.create(payload), (result) => {
      set((s) => ({ applications: [result as SupplierApplication, ...s.applications] }))
    })
  },
  updateStatus: async (id, status, reviewer, rejectReason) => {
    const patch = {
      status,
      reviewer,
      rejectReason: status === "rejected" ? rejectReason : undefined,
    }
    await syncAction(
      "updateSupplierStatus",
      () => api.update("supplier-applications", id, patch),
      (result) => {
        set((s) => ({
          applications: s.applications.map((a) => (a.id === id ? result : a)),
        }))
      },
    )

    if (status === "approved" || status === "rejected") {
      const app = get().applications.find((a) => a.id === id)
      if (app) {
        useNotificationStore.getState().addNotification({
          type: "system",
          title: status === "approved" ? "供应商入驻审核通过" : "供应商入驻审核未通过",
          summary:
            status === "approved"
              ? `您的供应商入驻申请已通过，您现在可以登录桌面端管理商品了。`
              : `您的供应商入驻申请未通过。原因：${rejectReason ?? "未知"}。`,
          targetUrl: "/c/merchant-services",
        })
      }
    }
  },
  getByPhone: (phone) => get().applications.filter((a) => a.phone === phone),
}))

export type { SupplierApplication } from "../../../shared/types"
