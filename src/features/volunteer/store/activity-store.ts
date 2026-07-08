import { api, volunteerApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import { useNotificationStore } from "@/platform/notification"
import type { VolunteerActivity, VolunteerActivityStatus } from "@/shared/types"
import { fmt, actTransition } from "./helpers"
import { registerActTimers, clearActTimers, settleActivity, clearAllTimers as clearAllTimerEntries } from "./timers"

export function createActivitySlice(set: any, get: any) {
  return {

    addActivity: (act: Omit<VolunteerActivity, "id" | "createdAt" | "status">) => {
      const id = `act-${Date.now()}`
      const fullAct = {
        ...act,
        id,
        status: "draft" as VolunteerActivityStatus,
        createdAt: fmt(new Date()),
      }
      void syncAction(
        "addActivity",
        () => volunteerApi.activities.create(fullAct),
        (result: VolunteerActivity) => {
          set((s: any) => ({ activities: [...s.activities, result] }))
        }
      )
      return id
    },

    editActivity: (activityId: string, fields: Partial<Omit<VolunteerActivity, "id" | "createdAt" | "status">>) => {
      const act = get().activities.find((a: VolunteerActivity) => a.id === activityId)
      if (!act) return
      if (act.status !== "draft") {
        const allowed = Object.fromEntries(
          Object.entries(fields).filter(([k]) => ["description", "maxParticipants"].includes(k))
        )
        if (Object.keys(allowed).length) {
          void syncAction(
            "editActivity",
            () => api.update<VolunteerActivity>("volunteer-activities", activityId, allowed),
            (result) => {
              set((s: any) => ({ activities: s.activities.map((a: VolunteerActivity) => (a.id === activityId ? result : a)) }))
            }
          )
        }
        return
      }
      void syncAction(
        "editActivity",
        () => api.update<VolunteerActivity>("volunteer-activities", activityId, fields),
        (result) => {
          set((s: any) => ({ activities: s.activities.map((a: VolunteerActivity) => (a.id === activityId ? result : a)) }))
        }
      )
    },

    publishActivity: (activityId: string) => {
      const act = get().activities.find((a: VolunteerActivity) => a.id === activityId)
      if (!act) return { ok: false, msg: "活动不存在" }
      const next = actTransition(act.status, "publish")
      if (!next) return { ok: false, msg: "当前状态无法发布" }
      if (!act.title || !act.location || !act.startTime || !act.endTime || !act.signUpDeadline)
        return { ok: false, msg: "请填写完整信息后再发布" }
      set((s: any) => ({
        activities: s.activities.map((a: VolunteerActivity) =>
          a.id === activityId ? { ...a, status: next } : a
        ),
      }))
      registerActTimers(activityId)
      useNotificationStore.getState().addNotification({
        type: "system",
        title: "新志愿活动发布",
        summary: `活动「${act.title}」已开放报名，欢迎参与。`,
        targetUrl: "/c/volunteer/activities",
      })
      return { ok: true, msg: "活动已发布" }
    },

    cancelActivity: (activityId: string) => {
      const act = get().activities.find((a: VolunteerActivity) => a.id === activityId)
      if (!act) return { ok: false, msg: "活动不存在" }
      const next = actTransition(act.status, "cancel")
      if (!next) return { ok: false, msg: "当前状态无法取消" }
      clearActTimers(activityId)
      set((s: any) => ({
        activities: s.activities.map((a: VolunteerActivity) =>
          a.id === activityId ? { ...a, status: next as VolunteerActivityStatus } : a
        ),
      }))
      useNotificationStore.getState().addNotification({
        type: "system",
        title: "志愿活动已取消",
        summary: `活动「${act.title}」已取消，请关注其他活动。`,
        targetUrl: "/c/volunteer/activities",
      })
      return { ok: true, msg: "活动已取消" }
    },

    forceEndActivity: (activityId: string) => {
      const act = get().activities.find((a: VolunteerActivity) => a.id === activityId)
      if (!act) return { ok: false, msg: "活动不存在" }
      const next = actTransition(act.status, "forceEnd")
      if (!next) return { ok: false, msg: "当前状态无法结束" }
      clearActTimers(activityId)
      set((s: any) => ({
        activities: s.activities.map((a: VolunteerActivity) =>
          a.id === activityId ? { ...a, status: next, endTime: fmt(new Date()) } : a
        ),
      }))
      settleActivity(activityId)
      return { ok: true, msg: "活动已结束" }
    },

    deleteActivity: (activityId: string) => {
      clearActTimers(activityId)
      void syncAction(
        "deleteActivity",
        () => api.remove("volunteer-activities", activityId),
        () => {
          set((s: any) => ({
            activities: s.activities.filter((a: VolunteerActivity) => a.id !== activityId),
            signUps: s.signUps.filter((su: any) => su.activityId !== activityId),
            dailyRecords: s.dailyRecords.filter((dr: any) => dr.activityId !== activityId),
          }))
        }
      )
    },

    startActivityTimers: () => {
      get().activities.forEach((act: VolunteerActivity) => {
        if (act.status === "published" || act.status === "in_progress") registerActTimers(act.id)
      })
    },

    clearAllTimers: () => {
      clearAllTimerEntries()
    },
  }
}