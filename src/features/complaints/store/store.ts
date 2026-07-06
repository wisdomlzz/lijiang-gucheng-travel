import { create } from "zustand"
import type { Complaint as ComplaintType, ComplaintStatus } from "../../../shared/types"
import { useNotificationStore } from "@/platform/notification"
import { complaintsApi } from "@/api/client"
import { syncAction } from "@/api/sync"

type ComplaintState = {
  complaints: ComplaintType[]
  complaintPhone: string
  createComplaint: (complaint: Omit<ComplaintType, "id" | "createdAt" | "status">) => void
  updateComplaintPhone: (phone: string) => void
  resolveWithResult: (id: string, result: string) => void
  reject: (id: string, reason: string) => void
}

const SEED: ComplaintType[] =[]

export const useComplaintStore = create<ComplaintState>((set, get) => ({
  complaints: [],
  complaintPhone: "0888-123456",
  createComplaint: (c) => {
    const item = { ...c, id: `CP${Date.now()}`, status: "C10" as ComplaintStatus, createdAt: new Date().toISOString() }
    syncAction("createComplaint", () => complaintsApi.create(item), () => {})
    set((s) => ({ complaints: [item, ...s.complaints] }))
  },
  updateComplaintPhone: (phone) => set({ complaintPhone: phone }),
  resolveWithResult: (id, result) => {
    set((s) => ({
      complaints: s.complaints.map((c) =>
        c.id === id
          ? { ...c, status: "C40" as ComplaintStatus, result, handledAt: new Date().toLocaleString("zh-CN") }
          : c
      ),
    }))

    const complaint = get().complaints.find((c) => c.id === id)
    if (complaint) {
      useNotificationStore.getState().addNotification({
        type: "system",
        title: "投诉已处理",
        summary: `您的投诉「${complaint.type}」已处理完成。处理结果：${result}`,
        targetUrl: `/c/complaints/${id}`,
      })
    }
  },
  reject: (id, reason) => {
    set((s) => ({
      complaints: s.complaints.map((c) =>
        c.id === id
          ? { ...c, status: "CR" as ComplaintStatus, result: reason, handledAt: new Date().toLocaleString("zh-CN") }
          : c
      ),
    }))

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
