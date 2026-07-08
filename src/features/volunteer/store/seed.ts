import { fmt, minutesAgo, offsetDate, getDaySlots, NOW } from "./helpers"
import type { Volunteer, VolunteerActivity, VolunteerSignUp, VolunteerDailyRecord, VolunteerDailyStatus } from "@/shared/types"

// ── seed data ──

export const seedVolunteers: Volunteer[] = []

export const seedActivities: VolunteerActivity[] = []

export const seedSignUps: VolunteerSignUp[] = []

export function buildSeedDailyRecords(): VolunteerDailyRecord[] {
  if (seedActivities.length === 0) return []
  const records: VolunteerDailyRecord[] = []
  let rid = 0
  const id = () => `dr-${++rid}`
  const act = (aid: string) => seedActivities.find((a) => a.id === aid)!

  // ── act-ongoing（进行中·单天）──
  // u_c_001 已签到 | sv-2,3,4 已签退 | sv-5,6 已签到 | sv-7 待签到
  {
    const a = act("act-ongoing")
    const su = seedSignUps.filter((s) => s.activityId === "act-ongoing")
    for (let i = 0; i < su.length; i++) {
      const vId = su[i].volunteerId
      if (vId === "u_c_001")
        records.push({
          id: id(),
          signUpId: su[i].id,
          volunteerId: vId,
          activityId: "act-ongoing",
          date: a.startTime.slice(0, 10),
          dayStartTime: a.startTime,
          dayEndTime: a.endTime,
          checkInTime: minutesAgo(80),
          status: "checked_in",
        })
      else if (i < 4)
        // sv-2~4: 已签退
        records.push({
          id: id(),
          signUpId: su[i].id,
          volunteerId: vId,
          activityId: "act-ongoing",
          date: a.startTime.slice(0, 10),
          dayStartTime: a.startTime,
          dayEndTime: a.endTime,
          checkInTime: minutesAgo(130 - i * 10),
          checkOutTime: minutesAgo(40 - i * 10),
          serviceHours: 1.5,
          status: "checked_out",
        })
      else if (i < 6)
        // sv-5,6: 已签到
        records.push({
          id: id(),
          signUpId: su[i].id,
          volunteerId: vId,
          activityId: "act-ongoing",
          date: a.startTime.slice(0, 10),
          dayStartTime: a.startTime,
          dayEndTime: a.endTime,
          checkInTime: minutesAgo(90 - (i - 4) * 20),
          status: "checked_in",
        })
      else
        // sv-7: 待签到
        records.push({
          id: id(),
          signUpId: su[i].id,
          volunteerId: vId,
          activityId: "act-ongoing",
          date: a.startTime.slice(0, 10),
          dayStartTime: a.startTime,
          dayEndTime: a.endTime,
          status: "pending",
        })
    }
  }

  // ── act-soon（即将开始）── 全部 pending
  {
    const a = act("act-soon")
    for (const su of seedSignUps.filter((s) => s.activityId === "act-soon"))
      records.push({
        id: id(),
        signUpId: su.id,
        volunteerId: su.volunteerId,
        activityId: "act-soon",
        date: a.startTime.slice(0, 10),
        dayStartTime: a.startTime,
        dayEndTime: a.endTime,
        status: "pending",
      })
  }

  // ── act-hot / act-multi ── 全部 pending（未开始）
  for (const aid of ["act-hot", "act-multi"]) {
    const a = act(aid)
    const slots = getDaySlots(a)
    for (const su of seedSignUps.filter((s) => s.activityId === aid))
      for (const slot of slots)
        records.push({
          id: id(),
          signUpId: su.id,
          volunteerId: su.volunteerId,
          activityId: aid,
          date: slot.date,
          dayStartTime: slot.dayStart,
          dayEndTime: slot.dayEnd,
          status: "pending",
        })
  }

  // ── act-multi-ongoing（进行中·多天，Day2 today）──
  {
    const a = act("act-multi-ongoing")
    const slots = getDaySlots(a) // [-1天, 今天, +1天]
    const su = seedSignUps.filter((s) => s.activityId === "act-multi-ongoing")
    for (const s of su) {
      for (let di = 0; di < slots.length; di++) {
        const slot = slots[di]
        const base = {
          id: id(),
          signUpId: s.id,
          volunteerId: s.volunteerId,
          activityId: "act-multi-ongoing",
          date: slot.date,
          dayStartTime: slot.dayStart,
          dayEndTime: slot.dayEnd,
        }
        if (s.volunteerId === "u_c_001") {
          if (di === 0)
            records.push({
              ...base,
              checkInTime: fmt(offsetDate(-1, 8, 50)),
              checkOutTime: fmt(offsetDate(-1, 12, 0)),
              serviceHours: 3,
              status: "checked_out",
            })
          else if (di === 1)
            records.push({ ...base, checkInTime: fmt(offsetDate(0, NOW.getHours() - 1)), status: "checked_in" })
          else records.push({ ...base, status: "pending" })
        } else if (s.volunteerId === "sv-2") {
          if (di === 0)
            records.push({
              ...base,
              checkInTime: fmt(offsetDate(-1, 9, 5)),
              checkOutTime: fmt(offsetDate(-1, 11, 50)),
              serviceHours: 2.8,
              status: "checked_out",
            })
          else records.push({ ...base, status: "pending" })
        } else if (s.volunteerId === "sv-4") {
          if (di === 0)
            records.push({
              ...base,
              checkInTime: fmt(offsetDate(-1, 8, 55)),
              checkOutTime: fmt(offsetDate(-1, 12, 0)),
              serviceHours: 3,
              status: "checked_out",
            })
          else if (di === 1)
            records.push({ ...base, checkInTime: fmt(offsetDate(0, NOW.getHours() - 0.5)), status: "checked_in" })
          else records.push({ ...base, status: "pending" })
        }
      }
    }
  }

  // ── act-ended-ok（已结束·全部正常）──
  {
    const a = act("act-ended-ok")
    for (const su of seedSignUps.filter((s) => s.activityId === "act-ended-ok")) {
      const vIdx = seedVolunteers.findIndex((v) => v.id === su.volunteerId)
      records.push({
        id: id(),
        signUpId: su.id,
        volunteerId: su.volunteerId,
        activityId: "act-ended-ok",
        date: a.startTime.slice(0, 10),
        dayStartTime: a.startTime,
        dayEndTime: a.endTime,
        checkInTime: fmt(offsetDate(-3, 8, 55 + vIdx * 2)),
        checkOutTime: fmt(offsetDate(-3, 12, 0)),
        serviceHours: Math.round(((180 - vIdx * 2) / 60) * 10) / 10,
        status: "checked_out",
      })
    }
  }

  // ── act-ended-abnormal（已结束·有异常）──
  // u_c_001: 未参与 | sv-2: 已签到未签退 | sv-5: 未参与 | sv-7: 未参与（可补录）
  {
    const a = act("act-ended-abnormal")
    const su = seedSignUps.filter((s) => s.activityId === "act-ended-abnormal")
    for (const s of su) {
      if (s.volunteerId === "u_c_001")
        records.push({
          id: id(),
          signUpId: s.id,
          volunteerId: s.volunteerId,
          activityId: "act-ended-abnormal",
          date: a.startTime.slice(0, 10),
          dayStartTime: a.startTime,
          dayEndTime: a.endTime,
          status: "no_show",
        })
      else if (s.volunteerId === "sv-2")
        records.push({
          id: id(),
          signUpId: s.id,
          volunteerId: s.volunteerId,
          activityId: "act-ended-abnormal",
          date: a.startTime.slice(0, 10),
          dayStartTime: a.startTime,
          dayEndTime: a.endTime,
          checkInTime: fmt(offsetDate(-2, 8, 10)),
          status: "checkout_overdue",
        })
      else if (s.volunteerId === "sv-5")
        records.push({
          id: id(),
          signUpId: s.id,
          volunteerId: s.volunteerId,
          activityId: "act-ended-abnormal",
          date: a.startTime.slice(0, 10),
          dayStartTime: a.startTime,
          dayEndTime: a.endTime,
          status: "no_show",
        })
      else if (s.volunteerId === "sv-7")
        records.push({
          id: id(),
          signUpId: s.id,
          volunteerId: s.volunteerId,
          activityId: "act-ended-abnormal",
          date: a.startTime.slice(0, 10),
          dayStartTime: a.startTime,
          dayEndTime: a.endTime,
          status: "no_show",
        })
    }
  }

  // ── act-ended-multi（已结束·多天3天）──
  // u_c_001: 第1天签退，第2天未签退，第3天缺席 | sv-4: 逐渐消失 | sv-6: 全勤 | sv-2: 第1天缺席后全勤
  {
    const a = act("act-ended-multi")
    const slots = getDaySlots(a)
    const su = seedSignUps.filter((s) => s.activityId === "act-ended-multi")
    for (const s of su) {
      for (let di = 0; di < slots.length; di++) {
        const slot = slots[di]
        const d = offsetDate(-5 + di)
        const ds = fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 14, 0))
        const de = fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 17, 0))
        const base = {
          id: id(),
          signUpId: s.id,
          volunteerId: s.volunteerId,
          activityId: "act-ended-multi",
          date: slot.date,
          dayStartTime: ds,
          dayEndTime: de,
        }
        if (s.volunteerId === "u_c_001") {
          if (di === 0)
            records.push({
              ...base,
              checkInTime: fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 13, 55)),
              checkOutTime: fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 17, 0)),
              serviceHours: 3,
              status: "checked_out",
            })
          else if (di === 1)
            records.push({
              ...base,
              checkInTime: fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 14, 10)),
              status: "checkout_overdue",
            })
          else records.push({ ...base, status: "no_show" })
        } else if (s.volunteerId === "sv-4") {
          if (di === 0)
            records.push({
              ...base,
              checkInTime: fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 14, 5)),
              checkOutTime: fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 17, 0)),
              serviceHours: 2.9,
              status: "checked_out",
            })
          else if (di === 1)
            records.push({
              ...base,
              checkInTime: fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 14, 10)),
              status: "checkout_overdue",
            })
          else records.push({ ...base, status: "no_show" })
        } else if (s.volunteerId === "sv-6") {
          records.push({
            ...base,
            checkInTime: fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 14, 0)),
            checkOutTime: fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 17, 0)),
            serviceHours: 3,
            status: "checked_out",
          })
        } else if (s.volunteerId === "sv-2") {
          if (di === 0) records.push({ ...base, status: "no_show" })
          else
            records.push({
              ...base,
              checkInTime: fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 14, 0)),
              checkOutTime: fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 17, 0)),
              serviceHours: 3,
              status: "checked_out",
            })
        }
      }
    }
  }

  // ── act-cancelled（已取消）── 保持 pending，取消活动本身已处理
  {
    const a = act("act-cancelled")
    for (const su of seedSignUps.filter((s) => s.activityId === "act-cancelled"))
      records.push({
        id: id(),
        signUpId: su.id,
        volunteerId: su.volunteerId,
        activityId: "act-cancelled",
        date: a.startTime.slice(0, 10),
        dayStartTime: a.startTime,
        dayEndTime: a.endTime,
        status: "pending",
      })
  }

  return records
}

export const seedDailyRecords = buildSeedDailyRecords()