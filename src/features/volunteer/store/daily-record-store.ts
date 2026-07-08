import type { VolunteerDailyRecord, VolunteerDailyStatus } from "@/shared/types"
import { fmt } from "./helpers"
import { usePointsStore } from "@/platform/points/points-store"

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function createDailyRecordSlice(set: any, get: any) {
  return {

    // ── daily check-in ──

    checkIn: async (dailyRecordId: string) => {
      const dr = get().dailyRecords.find((d: VolunteerDailyRecord) => d.id === dailyRecordId)
      if (!dr) throw new Error("记录不存在")

      // 位置校验
      let savedLat: number | undefined
      let savedLng: number | undefined
      const activity = get().activities.find((a: any) => a.id === dr.activityId)
      if (activity?.lat != null && activity?.lng != null) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            })
          })
          const distance = haversineDistance(
            pos.coords.latitude, pos.coords.longitude,
            activity.lat, activity.lng
          )
          const radius = activity.geoRadius || 500
          if (distance > radius) {
            throw new Error(`您不在活动地点范围内（距活动地点约 ${Math.round(distance)} 米）`)
          }
          savedLat = pos.coords.latitude
          savedLng = pos.coords.longitude
        } catch (err: any) {
          if (err.code === 1 || err.code === 2) {
            console.warn("Geolocation unavailable, check-in allowed without location verification")
          } else {
            throw err
          }
        }
      }

      if (dr.status !== "pending") throw new Error("当前状态无法签到")
      const now = new Date()
      const start = new Date(dr.dayStartTime)
      const end = new Date(dr.dayEndTime)
      if (now < new Date(start.getTime() - 30 * 60000))
        throw new Error("请在活动开始前30分钟内签到")
      if (now > end) throw new Error("今日活动已结束")
      const isLate = now > new Date(start.getTime() + 30 * 60000)
      const lateMinutes = isLate ? Math.round((now.getTime() - start.getTime()) / 60000) : undefined
      set((s: any) => ({
        dailyRecords: s.dailyRecords.map((x: VolunteerDailyRecord) =>
          x.id === dailyRecordId
            ? {
                ...x,
                checkInTime: fmt(now),
                status: "checked_in" as VolunteerDailyStatus,
                isLate,
                lateMinutes,
                ...(savedLat !== undefined ? { checkInLat: savedLat, checkInLng: savedLng } : {}),
              }
            : x
        ),
      }))
      return isLate ? `签到成功（迟到 ${lateMinutes} 分钟）` : "签到成功"
    },

    // ── daily check-out ──

    checkOut: async (dailyRecordId: string) => {
      const dr = get().dailyRecords.find((d: VolunteerDailyRecord) => d.id === dailyRecordId)
      if (!dr) throw new Error("记录不存在")

      // 位置校验
      let savedLat: number | undefined
      let savedLng: number | undefined
      const activity = get().activities.find((a: any) => a.id === dr.activityId)
      if (activity?.lat != null && activity?.lng != null) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            })
          })
          const distance = haversineDistance(
            pos.coords.latitude, pos.coords.longitude,
            activity.lat, activity.lng
          )
          const radius = activity.geoRadius || 500
          if (distance > radius) {
            throw new Error(`您不在活动地点范围内（距活动地点约 ${Math.round(distance)} 米）`)
          }
          savedLat = pos.coords.latitude
          savedLng = pos.coords.longitude
        } catch (err: any) {
          if (err.code === 1 || err.code === 2) {
            console.warn("Geolocation unavailable, check-out allowed without location verification")
          } else {
            throw err
          }
        }
      }

      if (dr.status !== "checked_in") throw new Error("请先签到")
      if (!dr.checkInTime) throw new Error("签到记录异常")
      const now = new Date()
      const dayDurationMs = new Date(dr.dayEndTime).getTime() - new Date(dr.dayStartTime).getTime()
      const rawHours = (now.getTime() - new Date(dr.checkInTime).getTime()) / 3600000
      const maxHours = dayDurationMs / 3600000
      const realHours = Math.min(
        Math.max(Math.round(rawHours * 10) / 10, 0.5),
        Math.round(maxHours * 10) / 10
      )

      set((s: any) => ({
        dailyRecords: s.dailyRecords.map((x: VolunteerDailyRecord) =>
          x.id === dailyRecordId
            ? {
                ...x,
                checkOutTime: fmt(now),
                serviceHours: realHours,
                status: "checked_out" as VolunteerDailyStatus,
                ...(savedLat !== undefined ? { checkOutLat: savedLat, checkOutLng: savedLng } : {}),
              }
            : x
        ),
      }))
      usePointsStore.getState().transact(dr.volunteerId, "volunteer_service", dr.id)
      return `签退成功，本次服务 ${realHours} 小时`
    },

    // ── admin resolve daily abnormal ──

    resolveAbnormal: (dailyRecordId: string, checkInTime: string, checkOutTime: string, reviewNote: string) => {
      const dr = get().dailyRecords.find((d: VolunteerDailyRecord) => d.id === dailyRecordId)
      if (!dr) return { ok: false, msg: "记录不存在" }
      if (dr.status !== "no_show" && dr.status !== "checkout_overdue")
        return { ok: false, msg: "当前状态无需处理" }
      if (!reviewNote.trim()) return { ok: false, msg: "请填写补录备注" }
      if (!checkInTime || !checkOutTime) return { ok: false, msg: "请填写签到和签退时间" }
      const ci = new Date(checkInTime),
        co = new Date(checkOutTime)
      if (co <= ci) return { ok: false, msg: "签退时间必须晚于签到时间" }
      const dayStart = new Date(dr.dayStartTime),
        dayEnd = new Date(dr.dayEndTime)
      const clampedCi = ci < dayStart ? dayStart : ci > dayEnd ? dayEnd : ci
      const clampedCo =
        co < clampedCi ? new Date(clampedCi.getTime() + 60000) : co > dayEnd ? dayEnd : co
      const dayDurationMs = dayEnd.getTime() - dayStart.getTime()
      const rawHours = (clampedCo.getTime() - clampedCi.getTime()) / 3600000
      const realHours = Math.min(
        Math.max(Math.round(rawHours * 10) / 10, 0.5),
        Math.round((dayDurationMs / 3600000) * 10) / 10
      )

      set((s: any) => ({
        dailyRecords: s.dailyRecords.map((x: VolunteerDailyRecord) =>
          x.id === dailyRecordId
            ? {
                ...x,
                status: "checked_out" as VolunteerDailyStatus,
                checkInTime: fmt(clampedCi),
                checkOutTime: fmt(clampedCo),
                serviceHours: realHours,
                isManual: true,
                reviewNote: reviewNote.trim(),
                resolvedAt: fmt(new Date()),
              }
            : x
        ),
      }))
      return { ok: true, msg: "已处理" }
    },

    // ── helpers ──

    getDailyRecords: (signUpId: string) =>
      get().dailyRecords.filter((d: VolunteerDailyRecord) => d.signUpId === signUpId),

    getDailyRecordsByActivity: (activityId: string) =>
      get().dailyRecords.filter((d: VolunteerDailyRecord) => d.activityId === activityId),

    getServiceHours: (volunteerId: string, activityId: string) => {
      return get()
        .dailyRecords.filter(
          (d: VolunteerDailyRecord) =>
            d.volunteerId === volunteerId &&
            d.activityId === activityId &&
            d.status === "checked_out" &&
            d.serviceHours
        )
        .reduce((sum: number, d: VolunteerDailyRecord) => sum + (d.serviceHours || 0), 0)
    },
  }
}