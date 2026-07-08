import { api } from "@/api/client"
import { syncAction } from "@/api/sync"
import { useNotificationStore } from "@/platform/notification"
import type { Volunteer, VolunteerStatus, VolunteerReviewRecord } from "@/shared/types"
import { fmt } from "./helpers"

export function createVolunteerSlice(set: any, get: any) {
  return {

    register: (
      userId: string,
      name: string,
      phone: string,
      politicalStatus: string,
      workUnit: string,
      credentialImages: string[]
    ) => {
      if (get().volunteers.find((v: Volunteer) => v.userId === userId))
        return { ok: false, msg: "您已提交注册，无需重复注册" }
      if (!credentialImages.length) return { ok: false, msg: "请上传资质图片" }
      const newVolunteer = {
        id: userId,
        userId,
        name,
        phone,
        politicalStatus,
        workUnit,
        credentialImages,
        status: "pending" as VolunteerStatus,
        createdAt: fmt(new Date()),
      }
      void syncAction(
        "registerVolunteer",
        () => api.create<Volunteer>("volunteers", newVolunteer),
        (result) => {
          set((s: any) => ({ volunteers: [...s.volunteers, result] }))
        }
      )
      return { ok: true, msg: "注册提交成功，请等待审核" }
    },

    getByUserId: (userId: string) => get().volunteers.find((v: Volunteer) => v.userId === userId),

    approveVolunteer: (volunteerId: string) => {
      const v = get().volunteers.find((x: Volunteer) => x.id === volunteerId)
      if (!v) return { ok: false, msg: "志愿者不存在" }
      if (v.status !== "pending") return { ok: false, msg: "当前状态无法审核" }
      const now = fmt(new Date())
      const record: VolunteerReviewRecord = { action: "approved", reviewedAt: now }
      set((s: any) => ({
        volunteers: s.volunteers.map((x: Volunteer) =>
          x.id === volunteerId
            ? {
                ...x,
                status: "approved" as VolunteerStatus,
                reviewedAt: now,
                reviewHistory: [...(x.reviewHistory || []), record],
              }
            : x
        ),
      }))
      useNotificationStore.getState().addNotification({
        type: "system",
        title: "志愿者审核通过",
        summary: "您已通过志愿者审核，欢迎参与古城志愿服务。",
        targetUrl: "/c/volunteer",
      })
      return { ok: true, msg: "审核通过" }
    },

    rejectVolunteer: (volunteerId: string, reason: string) => {
      const v = get().volunteers.find((x: Volunteer) => x.id === volunteerId)
      if (!v) return { ok: false, msg: "志愿者不存在" }
      if (v.status !== "pending") return { ok: false, msg: "当前状态无法审核" }
      if (!reason.trim()) return { ok: false, msg: "请填写驳回原因" }
      const now = fmt(new Date())
      const record: VolunteerReviewRecord = { action: "rejected", note: reason.trim(), reviewedAt: now }
      set((s: any) => ({
        volunteers: s.volunteers.map((x: Volunteer) =>
          x.id === volunteerId
            ? {
                ...x,
                status: "rejected" as VolunteerStatus,
                reviewNote: reason.trim(),
                reviewedAt: now,
                reviewHistory: [...(x.reviewHistory || []), record],
              }
            : x
        ),
      }))
      useNotificationStore.getState().addNotification({
        type: "system",
        title: "志愿者审核未通过",
        summary: `您的志愿者申请未通过。原因：${reason}。`,
        targetUrl: "/c/volunteer",
      })
      return { ok: true, msg: "已驳回" }
    },

    resubmitVolunteer: (volunteerId: string, credentialImages: string[]) => {
      const v = get().volunteers.find((x: Volunteer) => x.id === volunteerId)
      if (!v) return { ok: false, msg: "志愿者不存在" }
      if (v.status !== "rejected") return { ok: false, msg: "当前状态无法重新提交" }
      if (!credentialImages.length) return { ok: false, msg: "请上传资质图片" }
      const now = fmt(new Date())
      const record: VolunteerReviewRecord = { action: "resubmitted", reviewedAt: now }
      void syncAction(
        "resubmitVolunteer",
        () =>
          api.update<Volunteer>("volunteers", volunteerId, {
            credentialImages,
            status: "pending",
            reviewNote: null,
            reviewedAt: null,
            reviewHistory: [...(v.reviewHistory || []), record],
          }),
        (result) => {
          set((s: any) => ({
            volunteers: s.volunteers.map((x: Volunteer) => (x.id === volunteerId ? result : x)),
          }))
        }
      )
      return { ok: true, msg: "重新提交成功，请等待审核" }
    },

    searchVolunteers: (keyword: string) =>
      keyword.trim()
        ? get().volunteers.filter((v: Volunteer) => v.name.includes(keyword) || v.phone.includes(keyword))
        : get().volunteers,

    demoApprove: (volunteerId: string) => {
      const v = get().volunteers.find((x: Volunteer) => x.id === volunteerId)
      if (!v) return { ok: false, msg: "志愿者不存在" }
      if (v.status === "approved") return { ok: false, msg: "已通过审核" }
      const now = fmt(new Date())
      const record: VolunteerReviewRecord = { action: "approved", note: "演示快捷通过", reviewedAt: now }
      set((s: any) => ({
        volunteers: s.volunteers.map((x: Volunteer) =>
          x.id === volunteerId
            ? {
                ...x,
                status: "approved" as VolunteerStatus,
                reviewedAt: now,
                reviewHistory: [...(x.reviewHistory || []), record],
              }
            : x
        ),
      }))
      return { ok: true, msg: "演示：审核已通过" }
    },
  }
}