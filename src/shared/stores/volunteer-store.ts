import { create } from "zustand"
import type { Volunteer, VolunteerActivity, VolunteerSignUp } from "../types"

function pad2(n: number) { return String(n).padStart(2, "0") }

function fmt(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function offsetDate(daysOffset = 0, hours?: number, minutes?: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  if (hours !== undefined) d.setHours(hours, minutes ?? 0, 0, 0)
  return d
}

const now = new Date()

function minutesAgo(mins: number) {
  return fmt(new Date(Date.now() - mins * 60000))
}

const seedVolunteers: Volunteer[] = [
  { id: "sv-1", userId: "sv-1", name: "张大民", phone: "13800001111", politicalStatus: "中共党员", workUnit: "古城保护管理局", createdAt: fmt(offsetDate(-30)) },
  { id: "sv-2", userId: "sv-2", name: "李小华", phone: "13800002222", politicalStatus: "共青团员", workUnit: "丽江师范学院", createdAt: fmt(offsetDate(-20)) },
  { id: "sv-3", userId: "sv-3", name: "王丽萍", phone: "13800003333", politicalStatus: "群众", workUnit: "自由职业", createdAt: fmt(offsetDate(-15)) },
  { id: "sv-4", userId: "sv-4", name: "赵国强", phone: "13800004444", politicalStatus: "中共党员", workUnit: "丽江文旅局", createdAt: fmt(offsetDate(-10)) },
  { id: "sv-5", userId: "sv-5", name: "陈思雨", phone: "13800005555", politicalStatus: "其他", workUnit: "古城客栈", createdAt: fmt(offsetDate(-5)) },
  { id: "sv-6", userId: "sv-6", name: "刘明辉", phone: "13800006666", politicalStatus: "群众", workUnit: "个体经营户", createdAt: fmt(offsetDate(-2)) },
]

const seedSignUps: VolunteerSignUp[] = [
  // act-ongoing: checked out / checked in / signed up
  { id: "ss-1", volunteerId: "sv-1", activityId: "act-ongoing", signUpTime: minutesAgo(1440), checkInTime: minutesAgo(60), checkOutTime: minutesAgo(30), serviceHours: 0.5, status: "checked_out" },
  { id: "ss-2", volunteerId: "sv-2", activityId: "act-ongoing", signUpTime: minutesAgo(1440), checkInTime: minutesAgo(30), status: "checked_in" },
  { id: "ss-3", volunteerId: "sv-3", activityId: "act-ongoing", signUpTime: minutesAgo(1440), status: "signed_up" },
  // act-upcoming: 2 signed up
  { id: "ss-4", volunteerId: "sv-4", activityId: "act-upcoming", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  { id: "ss-5", volunteerId: "sv-1", activityId: "act-upcoming", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  // act-ended: 1 checked out, 1 missed
  { id: "ss-6", volunteerId: "sv-5", activityId: "act-ended", signUpTime: fmt(offsetDate(-3)), checkInTime: fmt(offsetDate(-2, 8, 30)), checkOutTime: fmt(offsetDate(-2, 12)), serviceHours: 3.5, status: "checked_out" },
  { id: "ss-7", volunteerId: "sv-6", activityId: "act-ended", signUpTime: fmt(offsetDate(-3)), status: "signed_up" },
]

const seedActivities: VolunteerActivity[] = [
  {
    id: "act-ended",
    title: "古城环境清洁日",
    description: "参与古城街道清洁、垃圾分类宣传志愿服务（活动已结束）",
    images: [],
    location: "丽江古城四方街",
    startTime: fmt(offsetDate(-2, 8)),
    endTime: fmt(offsetDate(-2, 12)),
    signUpDeadline: fmt(offsetDate(-3)),
    maxParticipants: 20,
    status: "ended",
    createdAt: fmt(offsetDate(-10)),
  },
  {
    id: "act-ongoing",
    title: "端午文化节志愿服务",
    description: "协助端午文化节活动组织、游客引导、秩序维护等工作（进行中，可报名）",
    images: [],
    location: "丽江古城玉河广场",
    startTime: fmt(offsetDate(0, now.getHours() - 2)),
    endTime: fmt(offsetDate(0, now.getHours() + 3)),
    signUpDeadline: fmt(offsetDate(-1)),
    maxParticipants: 15,
    status: "published",
    createdAt: fmt(offsetDate(-5)),
  },
  {
    id: "act-upcoming",
    title: "暑期古城导览志愿服务",
    description: "为游客提供古城导览、景点介绍、游览路线建议服务（即将开始）",
    images: [],
    location: "丽江古城大水车",
    startTime: fmt(offsetDate(3, 9)),
    endTime: fmt(offsetDate(3, 17)),
    signUpDeadline: fmt(offsetDate(2)),
    maxParticipants: 20,
    status: "published",
    createdAt: fmt(offsetDate(-1)),
  },
  {
    id: "act-full",
    title: "摄影志愿活动",
    description: "为游客提供免费拍照服务，记录美好瞬间（名额已满）",
    images: [],
    location: "丽江古城四方街",
    startTime: fmt(offsetDate(5, 9)),
    endTime: fmt(offsetDate(5, 12)),
    signUpDeadline: fmt(offsetDate(4)),
    maxParticipants: 0,
    status: "published",
    createdAt: fmt(offsetDate(-2)),
  },
  {
    id: "act-deadline",
    title: "文化讲座志愿服务",
    description: "协助文化讲座现场秩序维护、签到引导工作（报名已截止）",
    images: [],
    location: "丽江古城文化馆",
    startTime: fmt(offsetDate(7, 14)),
    endTime: fmt(offsetDate(7, 18)),
    signUpDeadline: fmt(offsetDate(-1)),
    maxParticipants: 30,
    status: "published",
    createdAt: fmt(offsetDate(-3)),
  },
]

function isOverlapping(a1: string, a2: string, b1: string, b2: string) {
  return a1 < b2 && a2 > b1
}

export const useVolunteerStore = create<{
  volunteers: Volunteer[]
  activities: VolunteerActivity[]
  signUps: VolunteerSignUp[]
  register: (userId: string, name: string, phone: string, politicalStatus: string, workUnit: string) => { ok: boolean; msg: string }
  getByUserId: (userId: string) => Volunteer | undefined
  signUp: (volunteerId: string, activityId: string) => { ok: boolean; msg: string }
  checkIn: (signUpId: string) => { ok: boolean; msg: string }
  checkOut: (signUpId: string) => { ok: boolean; msg: string }
  endActivity: (activityId: string) => void
  addActivity: (act: Omit<VolunteerActivity, "id" | "createdAt" | "status">) => string
  editActivity: (activityId: string, fields: Partial<Omit<VolunteerActivity, "id" | "createdAt" | "status">>) => void
  deleteActivity: (activityId: string) => void
  getSignUpCount: (activityId: string) => number
  getActiveSignUps: (volunteerId: string) => VolunteerSignUp[]
  searchVolunteers: (keyword: string) => Volunteer[]
}>((set, get) => ({
  volunteers: seedVolunteers,
  activities: seedActivities,
  signUps: seedSignUps,

  register: (userId, name, phone, politicalStatus, workUnit) => {
    const existing = get().volunteers.find((v) => v.userId === userId)
    if (existing) return { ok: false, msg: "您已完成注册，无需重复注册" }
    const id = `v-${Date.now()}`
    set((s) => ({
      volunteers: [...s.volunteers, { id, userId, name, phone, politicalStatus, workUnit, createdAt: fmt(new Date()) }],
    }))
    return { ok: true, msg: "注册成功" }
  },

  getByUserId: (userId) => get().volunteers.find((v) => v.userId === userId),

  signUp: (volunteerId, activityId) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    if (act.status !== "published") return { ok: false, msg: "活动未开放报名" }
    if (new Date() > new Date(act.signUpDeadline)) return { ok: false, msg: "报名已截止" }
    const count = get().signUps.filter((s) => s.activityId === activityId).length
    if (count >= act.maxParticipants) return { ok: false, msg: "名额已满" }
    const already = get().signUps.find((s) => s.volunteerId === volunteerId && s.activityId === activityId)
    if (already) return { ok: false, msg: "您已报名此活动" }

    const mySignUps = get().signUps.filter((s) => s.volunteerId === volunteerId)
    for (const su of mySignUps) {
      const otherAct = get().activities.find((a) => a.id === su.activityId)
      if (otherAct && isOverlapping(act.startTime, act.endTime, otherAct.startTime, otherAct.endTime)) {
        return { ok: false, msg: `与活动"${otherAct.title}"时间冲突` }
      }
    }

    const id = `su-${Date.now()}`
    set((s) => ({
      signUps: [...s.signUps, { id, volunteerId, activityId, signUpTime: fmt(new Date()), status: "signed_up" }],
    }))
    return { ok: true, msg: "报名成功" }
  },

  checkIn: (signUpId) => {
    const su = get().signUps.find((s) => s.id === signUpId)
    if (!su) return { ok: false, msg: "报名记录不存在" }
    if (su.status !== "signed_up") return { ok: false, msg: su.status === "checked_in" ? "已签到，无需重复签到" : "已签退，无法签到" }
    const act = get().activities.find((a) => a.id === su.activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    const now = new Date()
    if (now < new Date(act.startTime)) return { ok: false, msg: "活动尚未开始" }
    if (now > new Date(act.endTime)) return { ok: false, msg: "活动已结束，无法签到" }
    set((s) => ({
      signUps: s.signUps.map((x) => x.id === signUpId ? { ...x, checkInTime: fmt(new Date()), status: "checked_in" } : x),
    }))
    return { ok: true, msg: "签到成功" }
  },

  checkOut: (signUpId) => {
    const su = get().signUps.find((s) => s.id === signUpId)
    if (!su) return { ok: false, msg: "报名记录不存在" }
    if (su.status !== "checked_in") return { ok: false, msg: su.status === "signed_up" ? "请先签到" : "已签退，无需重复签退" }
    if (!su.checkInTime) return { ok: false, msg: "签到记录异常" }
    const hours = Math.round((Date.now() - new Date(su.checkInTime).getTime()) / 3600000 * 10) / 10
    set((s) => ({
      signUps: s.signUps.map((x) => x.id === signUpId ? { ...x, checkOutTime: fmt(new Date()), serviceHours: Math.max(hours, 0.5), status: "checked_out" } : x),
    }))
    return { ok: true, msg: `签退成功，本次服务 ${Math.max(hours, 0.5)} 小时` }
  },

  endActivity: (activityId) => {
    const now = new Date()
    const nowStr = fmt(now)
    set((s) => ({
      activities: s.activities.map((a) =>
        a.id === activityId
          ? { ...a, status: "ended", endTime: a.endTime < nowStr ? a.endTime : nowStr }
          : a
      ),
    }))
  },

  addActivity: (act) => {
    const id = `act-${Date.now()}`
    set((s) => ({
      activities: [...s.activities, { ...act, id, status: "published", createdAt: fmt(new Date()) }],
    }))
    return id
  },

  editActivity: (activityId, fields) => {
    set((s) => ({
      activities: s.activities.map((a) =>
        a.id === activityId ? { ...a, ...fields } : a
      ),
    }))
  },

  deleteActivity: (activityId) => {
    set((s) => ({
      activities: s.activities.filter((a) => a.id !== activityId),
      signUps: s.signUps.filter((su) => su.activityId !== activityId),
    }))
  },

  getSignUpCount: (activityId) => get().signUps.filter((s) => s.activityId === activityId).length,

  getActiveSignUps: (volunteerId) => get().signUps.filter((s) => s.volunteerId === volunteerId),

  searchVolunteers: (keyword) => {
    if (!keyword.trim()) return get().volunteers
    const kw = keyword.toLowerCase()
    return get().volunteers.filter((v) => v.name.includes(kw) || v.phone.includes(kw))
  },
}))
