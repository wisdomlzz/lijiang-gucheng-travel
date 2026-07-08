import type { VolunteerActivity, VolunteerSignUp, VolunteerDailyRecord, VolunteerDailyStatus } from "@/shared/types"
import { fmt, getDaySlots, isOverlap } from "./helpers"

export function createSignUpSlice(set: any, get: any) {
  return {

    signUp: (volunteerId: string, activityId: string) => {
      const act = get().activities.find((a: VolunteerActivity) => a.id === activityId)
      if (!act) return { ok: false, msg: "活动不存在" }
      if (act.status !== "published" && act.status !== "in_progress")
        return { ok: false, msg: "活动未开放报名" }
      if (act.enrollStartTime && new Date() < new Date(act.enrollStartTime))
        return { ok: false, msg: "报名尚未开始" }
      if (new Date() > new Date(act.signUpDeadline)) return { ok: false, msg: "报名已截止" }
      const count = get().signUps.filter((s: VolunteerSignUp) => s.activityId === activityId).length
      if (count >= act.maxParticipants) return { ok: false, msg: "名额已满" }
      if (get().signUps.find((s: VolunteerSignUp) => s.volunteerId === volunteerId && s.activityId === activityId))
        return { ok: false, msg: "您已报名此活动" }

      // create sign-up + daily records
      const signUpId = `su-${Date.now()}`
      const slots = getDaySlots(act)
      const newDailyRecords: VolunteerDailyRecord[] = slots.map((slot) => ({
        id: `dr-${Date.now()}-${slot.date}`,
        signUpId,
        volunteerId,
        activityId,
        date: slot.date,
        dayStartTime: slot.dayStart,
        dayEndTime: slot.dayEnd,
        status: "pending" as VolunteerDailyStatus,
      }))

      set((s: any) => ({
        signUps: [
          ...s.signUps,
          { id: signUpId, volunteerId, activityId, signUpTime: fmt(new Date()) },
        ],
        dailyRecords: [...s.dailyRecords, ...newDailyRecords],
      }))
      return { ok: true, msg: "报名成功" }
    },

    cancelSignUp: (signUpId: string) => {
      const su = get().signUps.find((s: VolunteerSignUp) => s.id === signUpId)
      if (!su) return { ok: false, msg: "报名记录不存在" }
      const drs = get().dailyRecords.filter((d: VolunteerDailyRecord) => d.signUpId === signUpId)
      if (drs.some((d: VolunteerDailyRecord) => d.status === "checked_in" || d.status === "checked_out")) {
        return { ok: false, msg: "已有服务记录，无法取消报名" }
      }
      set((s: any) => ({
        signUps: s.signUps.filter((x: VolunteerSignUp) => x.id !== signUpId),
        dailyRecords: s.dailyRecords.filter((d: VolunteerDailyRecord) => d.signUpId !== signUpId),
      }))
      return { ok: true, msg: "报名已取消" }
    },

    // ── helpers ──

    getSignUpCount: (activityId: string) =>
      get().signUps.filter((s: VolunteerSignUp) => s.activityId === activityId).length,

    getActiveSignUps: (volunteerId: string) =>
      get().signUps.filter((s: VolunteerSignUp) => s.volunteerId === volunteerId),

    getTimeConflicts: (volunteerId: string, activityId: string) => {
      const act = get().activities.find((a: VolunteerActivity) => a.id === activityId)
      if (!act) return []
      const conflicts: string[] = []
      const mySUs = get().signUps.filter(
        (s: VolunteerSignUp) => s.volunteerId === volunteerId && s.activityId !== activityId
      )
      for (const su of mySUs) {
        const otherAct = get().activities.find((a: VolunteerActivity) => a.id === su.activityId)
        if (!otherAct) continue
        if (otherAct.status === "ended" || otherAct.status === "cancelled") continue
        if (isOverlap(act.startTime, act.endTime, otherAct.startTime, otherAct.endTime)) {
          conflicts.push(otherAct.title)
        }
      }
      return conflicts
    },
  }
}