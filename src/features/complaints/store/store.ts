import { create } from "zustand"
import type { Complaint as ComplaintType, ComplaintStatus } from "../../../shared/types"
import { useNotificationStore } from "@/platform/notification"
import { complaintsApi } from "@/api/client"
import { syncAction } from "@/api/sync"

type ComplaintState = {
  complaints: ComplaintType[]
  complaintPhone: string
  createComplaint: (complaint: Omit<ComplaintType, "id" | "createdAt" | "status">) => Promise<void>
  updateComplaintPhone: (phone: string) => void
  resolveWithResult: (id: string, result: string) => Promise<void>
  reject: (id: string, reason: string) => Promise<void>
}

export const useComplaintStore = create<ComplaintState>((set, get) => ({
  complaints: [],
  complaintPhone: "0888-123456",
  createComplaint: async (c) => {
    const item = { ...c, status: "C10" as ComplaintStatus }
    await syncAction("createComplaint", () => complaintsApi.create(item), (result) => {
      set((s) => ({ complaints: [result, ...s.complaints] }))
    })
  },
  updateComplaintPhone: (phone) => set({ complaintPhone: phone }),
  resolveWithResult: async (id, result_text) => {
    await syncAction("complaint.resolve", () => complaintsApi.resolve(id, result_text), (result) => {
      set((s) => ({ complaints: s.complaints.map((c) => (c.id === id ? result : c)) }))
    })

    const complaint = get().complaints.find((c) => c.id === id)
    if (complaint) {
      useNotificationStore.getState().addNotification({
        type: "system",
        title: "投诉已处理",
        summary: `您的投诉「${complaint.type}」已处理完成。处理结果：${result_text}`,
        targetUrl: `/c/complaints/${id}`,
      })
    }
  },
  reject: async (id, reason) => {
    await syncAction("complaint.reject", () => complaintsApi.reject(id, reason), (result) => {
      set((s) => ({ complaints: s.complaints.map((c) => (c.id === id ? result : c)) }))
    })

    const complaint = get().complaints.find((c) => c.id === id)
    if (complaint) {
      useNotificationStore.getState().addNotification({
        type: "system",
        title: "投诉被驳回",
        summary: `您的投诉「${complaint.type}」已被驳回。原因：${reason}`,
        targetUrl: `/c/complaints/${id}`,
      })
    }
  },
}))

export type { Complaint } from "../../../shared/types"
