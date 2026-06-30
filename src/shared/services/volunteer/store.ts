import { create } from "zustand"
import type { Volunteer, VolunteerActivity, VolunteerSignUp, VolunteerStatus, VolunteerActivityStatus, VolunteerSignUpStatus } from "../types"
import { usePointsStore } from "../points"

// ── helpers ──

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}
function minutesAgo(m: number) { return fmt(new Date(Date.now() - m * 60000)) }
function offsetDate(days = 0, h?: number, m?: number) {
  const d = new Date(); d.setDate(d.getDate() + days)
  if (h !== undefined) d.setHours(h, m ?? 0, 0, 0)
  return d
}
function isOverlap(a1: string, a2: string, b1: string, b2: string) { return a1 < b2 && a2 > b1 }

const NOW = new Date()

// ── activity transition table ──

function actTransition(from: VolunteerActivityStatus, action: string): VolunteerActivityStatus | null {
  const table: Record<VolunteerActivityStatus, Record<string, VolunteerActivityStatus>> = {
    draft:           { submit: "pending_review", cancel: "cancelled" },
    pending_review:  { approve: "published", reject: "draft", cancel: "cancelled" },
    published:       { cancel: "cancelled" },
    in_progress:     { forceEnd: "ended" },
    ended:           {},
    cancelled:       {},
  }
  return table[from]?.[action] ?? null
}

// ── timer map (same pattern as convenience store) ──

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function setTimer(key: string, ms: number, cb: () => void) {
  clearTimer(key)
  if (ms <= 0) { cb(); return }
  timers.set(key, setTimeout(cb, ms))
}
function clearTimer(key: string) {
  const t = timers.get(key)
  if (t) { clearTimeout(t); timers.delete(key) }
}
function clearActTimers(actId: string) {
  for (const k of timers.keys()) if (k.startsWith(`vol:act:${actId}:`)) clearTimer(k)
}

// ── seed data ──
// 排序约定：活动按生命周期(草稿→审核→已发布→进行中→已结束→已取消)分组；
//           报名记录按「活动」聚合，每条标注演示状态；志愿者按状态分组。

const seedVolunteers: Volunteer[] = [
  // 演示主账号（C端登录的张小游，pending 以演示注册→审核流程）
  { id: "sv-demo", userId: "u_c_001", name: "张小游", phone: "13800001001", politicalStatus: "群众", workUnit: "游客", credentialImages: ["https://images.unsplash.com/photo-1586953208270-767889fa9b0e?w=400"], status: "pending", createdAt: fmt(offsetDate(-30)) },
  // 已通过志愿者
  { id: "sv-1", userId: "sv-1", name: "张大民", phone: "13800001111", politicalStatus: "中共党员", workUnit: "古城保护管理局", credentialImages: ["https://images.unsplash.com/photo-1586953208270-767889fa9b0e?w=400"], status: "approved", createdAt: fmt(offsetDate(-30)) },
  { id: "sv-2", userId: "sv-2", name: "李小华", phone: "13800002222", politicalStatus: "共青团员", workUnit: "丽江师范学院", credentialImages: [], status: "approved", createdAt: fmt(offsetDate(-20)) },
  { id: "sv-3", userId: "sv-3", name: "王丽萍", phone: "13800003333", politicalStatus: "群众", workUnit: "自由职业", credentialImages: [], status: "approved", createdAt: fmt(offsetDate(-15)) },
  { id: "sv-4", userId: "sv-4", name: "赵国强", phone: "13800004444", politicalStatus: "中共党员", workUnit: "丽江文旅局", credentialImages: [], status: "approved", createdAt: fmt(offsetDate(-10)) },
  { id: "sv-5", userId: "sv-5", name: "陈思雨", phone: "13800005555", politicalStatus: "其他", workUnit: "古城客栈", credentialImages: [], status: "approved", createdAt: fmt(offsetDate(-5)) },
  { id: "sv-8", userId: "sv-8", name: "孙伟杰", phone: "13800008888", politicalStatus: "中共党员", workUnit: "丽江古城管理局", credentialImages: [], status: "approved", createdAt: fmt(offsetDate(-8)) },
  { id: "sv-9", userId: "sv-9", name: "吴美玲", phone: "13800009999", politicalStatus: "共青团员", workUnit: "丽江大学", credentialImages: [], status: "approved", createdAt: fmt(offsetDate(-4)) },
  // 待审核志愿者
  { id: "sv-6", userId: "sv-6", name: "刘明辉", phone: "13800006666", politicalStatus: "群众", workUnit: "个体经营户", credentialImages: [], status: "pending", createdAt: fmt(offsetDate(-2)) },
  // 已驳回志愿者（带驳回原因）
  { id: "sv-7", userId: "sv-7", name: "周静雅", phone: "13800007777", politicalStatus: "共青团员", workUnit: "丽江文旅协会", credentialImages: ["https://images.unsplash.com/photo-1586953208270-767889fa9b0e?w=400"], status: "rejected", reviewNote: "资质图片不清晰，请重新上传", reviewedAt: fmt(offsetDate(-1)), createdAt: fmt(offsetDate(-3)) },
]

const seedActivities: VolunteerActivity[] = [
  // ── 1. 编排中：草稿 / 待审核 ──
  { id: "act-draft", title: "国庆志愿服务（草稿）", description: "国庆期间古城秩序维护、游客引导", images: [], location: "丽江古城", startTime: fmt(offsetDate(10, 8)), endTime: fmt(offsetDate(10, 18)), signUpDeadline: fmt(offsetDate(9)), maxParticipants: 50, status: "draft", createdAt: fmt(offsetDate(0)) },
  { id: "act-review", title: "中秋晚会志愿服务", description: "协助中秋晚会现场布置、秩序维护", images: [], location: "丽江古城玉河广场", startTime: fmt(offsetDate(6, 18)), endTime: fmt(offsetDate(6, 22)), signUpDeadline: fmt(offsetDate(5)), maxParticipants: 25, status: "pending_review", createdAt: fmt(offsetDate(-1)) },

  // ── 2. 可报名：已发布、未开始 ──
  // 报名窗口即将关闭（2小时后截止，名额紧张）
  { id: "act-enroll-urgent", title: "周末应急疏散演练", description: "配合古城应急疏散演练，引导游客有序撤离（名额紧张）", images: [], location: "丽江古城四方街", startTime: fmt(offsetDate(2, 14)), endTime: fmt(offsetDate(2, 17)), signUpDeadline: fmt(offsetDate(0, NOW.getHours() + 2)), maxParticipants: 5, status: "published", createdAt: fmt(offsetDate(-1)) },
  // 热门快满（7/8）
  { id: "act-enroll-hot", title: "纳西古乐传承志愿服务", description: "协助纳西古乐会现场秩序、引导观众就座，体验世界文化遗产", images: [], location: "丽江古城纳西古乐会", startTime: fmt(offsetDate(4, 19)), endTime: fmt(offsetDate(4, 21)), signUpDeadline: fmt(offsetDate(3, 20)), maxParticipants: 8, status: "published", createdAt: fmt(offsetDate(-2)) },
  // 名额充足（2/20）
  { id: "act-enroll-normal", title: "古城文明旅游引导", description: "在古城主要入口引导游客文明游览、解答问询、维护秩序", images: [], location: "丽江古城入口", startTime: fmt(offsetDate(6, 9)), endTime: fmt(offsetDate(6, 12)), signUpDeadline: fmt(offsetDate(5, 18)), maxParticipants: 20, status: "published", createdAt: fmt(offsetDate(-3)) },
  // 张小游已报名·签到窗口已开（开始前30分钟）
  { id: "act-soon", title: "古城快闪志愿服务", description: "参与古城快闪活动，协助现场布置与游客互动", images: [], location: "丽江古城四方街", startTime: fmt(offsetDate(0, NOW.getHours(), NOW.getMinutes() + 6)), endTime: fmt(offsetDate(0, NOW.getHours() + 4)), signUpDeadline: fmt(offsetDate(0, NOW.getHours(), NOW.getMinutes() + 60)), maxParticipants: 10, status: "published", createdAt: fmt(offsetDate(-2)) },
  // 张小游已报名·等待开始（3天后）
  { id: "act-upcoming", title: "暑期古城导览志愿服务", description: "为游客提供古城导览、景点介绍、游览路线建议服务", images: [], location: "丽江古城大水车", startTime: fmt(offsetDate(3, 9)), endTime: fmt(offsetDate(3, 17)), enrollStartTime: fmt(offsetDate(1, 9)), signUpDeadline: fmt(offsetDate(2)), maxParticipants: 20, status: "published", createdAt: fmt(offsetDate(-1)) },
  // 边界：满员 / 截止
  { id: "act-full", title: "摄影志愿活动", description: "为游客提供免费拍照服务，记录美好瞬间", images: [], location: "丽江古城四方街", startTime: fmt(offsetDate(5, 9)), endTime: fmt(offsetDate(5, 12)), signUpDeadline: fmt(offsetDate(4)), maxParticipants: 0, status: "published", createdAt: fmt(offsetDate(-2)) },
  { id: "act-deadline", title: "文化讲座志愿服务（已截止）", description: "协助文化讲座现场秩序维护、签到引导工作", images: [], location: "丽江古城文化馆", startTime: fmt(offsetDate(7, 14)), endTime: fmt(offsetDate(7, 18)), signUpDeadline: fmt(offsetDate(-1)), maxParticipants: 30, status: "published", createdAt: fmt(offsetDate(-3)) },

  // ── 3. 进行中：已开始未结束（张小游可签退）──
  { id: "act-ongoing", title: "端午文化节志愿服务", description: "协助端午文化节活动组织、游客引导、秩序维护等工作", images: [], location: "丽江古城玉河广场", startTime: fmt(offsetDate(0, NOW.getHours() - 2)), endTime: fmt(offsetDate(0, NOW.getHours() + 3)), signUpDeadline: fmt(offsetDate(-1)), maxParticipants: 15, status: "in_progress", createdAt: fmt(offsetDate(-5)) },

  // ── 4. 已结束：正常完成 / 异常待处理 ──
  { id: "act-done-checkedout", title: "古城导览志愿服务", description: "为游客提供古城导览、景点介绍服务", images: [], location: "丽江古城大水车", startTime: fmt(offsetDate(-3, 9)), endTime: fmt(offsetDate(-3, 12)), signUpDeadline: fmt(offsetDate(-4)), maxParticipants: 20, status: "ended", createdAt: fmt(offsetDate(-10)) },
  { id: "act-done-overdue", title: "文化讲座志愿服务", description: "协助文化讲座现场秩序维护、签到引导工作", images: [], location: "丽江古城文化馆", startTime: fmt(offsetDate(-4, 14)), endTime: fmt(offsetDate(-4, 17)), signUpDeadline: fmt(offsetDate(-5)), maxParticipants: 30, status: "ended", createdAt: fmt(offsetDate(-8)) },
  { id: "act-done-noshow", title: "古城环境清洁日（第二批）", description: "参与古城七一街街道清洁志愿服务", images: [], location: "丽江古城七一街", startTime: fmt(offsetDate(-5, 8)), endTime: fmt(offsetDate(-5, 11)), signUpDeadline: fmt(offsetDate(-6)), maxParticipants: 15, status: "ended", createdAt: fmt(offsetDate(-12)) },
  { id: "act-ended", title: "古城环境清洁日", description: "参与古城街道清洁、垃圾分类宣传志愿服务", images: [], location: "丽江古城四方街", startTime: fmt(offsetDate(-2, 8)), endTime: fmt(offsetDate(-2, 12)), signUpDeadline: fmt(offsetDate(-3)), maxParticipants: 20, status: "ended", createdAt: fmt(offsetDate(-10)) },

  // ── 5. 已取消 ──
  { id: "act-cancelled", title: "取消的测试活动", description: "该活动已取消——仅供后台展示", images: [], location: "丽江古城", startTime: fmt(offsetDate(15, 9)), endTime: fmt(offsetDate(15, 17)), signUpDeadline: fmt(offsetDate(14)), maxParticipants: 10, status: "cancelled", createdAt: fmt(offsetDate(-5)) },
]

const seedSignUps: VolunteerSignUp[] = [
  // ═══ 张小游 (sv-demo) —— 全 5 种签到状态覆盖，按操作优先级排序 ═══
  // ① checked_in 进行中·可签退（迟到 90min）
  { id: "ss-demo-1", volunteerId: "sv-demo", activityId: "act-ongoing", signUpTime: minutesAgo(1440), checkInTime: minutesAgo(30), isLate: true, lateMinutes: 90, status: "checked_in" },
  // ② signed_up 已报名·签到窗口已开（6分钟后开始）
  { id: "ss-demo-6", volunteerId: "sv-demo", activityId: "act-soon", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  // ③ signed_up 已报名·等待开始
  { id: "ss-demo-2", volunteerId: "sv-demo", activityId: "act-upcoming", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  // ④ checked_out 已完成（服务 3.2h）
  { id: "ss-demo-3", volunteerId: "sv-demo", activityId: "act-done-checkedout", signUpTime: fmt(offsetDate(-5)), checkInTime: fmt(offsetDate(-3, 8, 50)), checkOutTime: fmt(offsetDate(-3, 12)), serviceHours: 3.2, status: "checked_out" },
  // ⑤ checkout_overdue 异常·未签退（后台可处理）
  { id: "ss-demo-5", volunteerId: "sv-demo", activityId: "act-done-overdue", signUpTime: fmt(offsetDate(-6)), checkInTime: fmt(offsetDate(-4, 14, 10)), isLate: true, lateMinutes: 10, status: "checkout_overdue" },
  // ⑥ no_show 异常·缺席
  { id: "ss-demo-4", volunteerId: "sv-demo", activityId: "act-done-noshow", signUpTime: fmt(offsetDate(-6)), status: "no_show" },

  // ═══ 其他志愿者 —— 用于填充活动报名进度 & 后台管理展示 ═══
  // act-ongoing（进行中）
  { id: "ss-1", volunteerId: "sv-1", activityId: "act-ongoing", signUpTime: minutesAgo(1440), checkInTime: minutesAgo(60), checkOutTime: minutesAgo(30), serviceHours: 0.5, status: "checked_out" },
  { id: "ss-2", volunteerId: "sv-2", activityId: "act-ongoing", signUpTime: minutesAgo(1440), checkInTime: minutesAgo(30), status: "checked_in" },
  { id: "ss-3", volunteerId: "sv-3", activityId: "act-ongoing", signUpTime: minutesAgo(1440), status: "signed_up" },
  // act-upcoming（等待开始）
  { id: "ss-1b", volunteerId: "sv-1", activityId: "act-upcoming", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  { id: "ss-4", volunteerId: "sv-4", activityId: "act-upcoming", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  // act-ended 系列（后台异常处理展示）
  { id: "ss-2b", volunteerId: "sv-2", activityId: "act-ended", signUpTime: fmt(offsetDate(-3)), checkInTime: fmt(offsetDate(-2, 8)), status: "checkout_overdue" },
  { id: "ss-5", volunteerId: "sv-5", activityId: "act-ended", signUpTime: fmt(offsetDate(-3)), checkInTime: fmt(offsetDate(-2, 8, 30)), checkOutTime: fmt(offsetDate(-2, 12)), serviceHours: 3.5, status: "checked_out" },
  { id: "ss-6", volunteerId: "sv-6", activityId: "act-ended", signUpTime: fmt(offsetDate(-3)), status: "no_show" },
  // act-enroll-hot（7/8 热门）
  { id: "ss-8a", volunteerId: "sv-1", activityId: "act-enroll-hot", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  { id: "ss-8b", volunteerId: "sv-2", activityId: "act-enroll-hot", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  { id: "ss-8c", volunteerId: "sv-3", activityId: "act-enroll-hot", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  { id: "ss-8d", volunteerId: "sv-4", activityId: "act-enroll-hot", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  { id: "ss-8e", volunteerId: "sv-5", activityId: "act-enroll-hot", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  { id: "ss-8f", volunteerId: "sv-8", activityId: "act-enroll-hot", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  { id: "ss-8g", volunteerId: "sv-9", activityId: "act-enroll-hot", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  // act-enroll-normal（2/20 充足）
  { id: "ss-9a", volunteerId: "sv-1", activityId: "act-enroll-normal", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  { id: "ss-9b", volunteerId: "sv-2", activityId: "act-enroll-normal", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  // act-enroll-urgent（2/5 紧凑）
  { id: "ss-10a", volunteerId: "sv-3", activityId: "act-enroll-urgent", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
  { id: "ss-10b", volunteerId: "sv-9", activityId: "act-enroll-urgent", signUpTime: fmt(offsetDate(-1)), status: "signed_up" },
]

// ── store ──

type VolunteerState = {
  volunteers: Volunteer[]
  activities: VolunteerActivity[]
  signUps: VolunteerSignUp[]

  // volunteer certification
  register: (userId: string, name: string, phone: string, politicalStatus: string, workUnit: string, credentialImages: string[]) => { ok: boolean; msg: string }
  getByUserId: (userId: string) => Volunteer | undefined
  approveVolunteer: (volunteerId: string) => { ok: boolean; msg: string }
  rejectVolunteer: (volunteerId: string, reason: string) => { ok: boolean; msg: string }
  resubmitVolunteer: (volunteerId: string, credentialImages: string[]) => { ok: boolean; msg: string }
  searchVolunteers: (keyword: string) => Volunteer[]
  demoApprove: (volunteerId: string) => { ok: boolean; msg: string }

  // activity lifecycle
  addActivity: (act: Omit<VolunteerActivity, "id" | "createdAt" | "status" | "reviewNote" | "reviewedAt">) => string
  editActivity: (activityId: string, fields: Partial<Omit<VolunteerActivity, "id" | "createdAt" | "status">>) => void
  submitActivity: (activityId: string) => { ok: boolean; msg: string }
  approveActivity: (activityId: string) => { ok: boolean; msg: string }
  rejectActivity: (activityId: string, reason: string) => { ok: boolean; msg: string }
  cancelActivity: (activityId: string) => { ok: boolean; msg: string }
  forceEndActivity: (activityId: string) => { ok: boolean; msg: string }
  deleteActivity: (activityId: string) => void

  // sign-up / check-in / check-out
  signUp: (volunteerId: string, activityId: string) => { ok: boolean; msg: string }
  checkIn: (signUpId: string) => { ok: boolean; msg: string }
  checkOut: (signUpId: string) => { ok: boolean; msg: string }

  // admin resolve abnormal
  resolveAbnormal: (signUpId: string, serviceHours: number, reviewNote: string) => { ok: boolean; msg: string }

  // helpers
  getSignUpCount: (activityId: string) => number
  getActiveSignUps: (volunteerId: string) => VolunteerSignUp[]
  startActivityTimers: () => void
  clearAllTimers: () => void
}

export const useVolunteerStore = create<VolunteerState>((set, get) => ({
  volunteers: seedVolunteers,
  activities: seedActivities,
  signUps: seedSignUps,

  // ── volunteer certification ──

  register: (userId, name, phone, politicalStatus, workUnit, credentialImages) => {
    if (get().volunteers.find((v) => v.userId === userId)) return { ok: false, msg: "您已提交注册，无需重复注册" }
    if (!credentialImages.length) return { ok: false, msg: "请上传资质图片" }
    set((s) => ({ volunteers: [...s.volunteers, { id: `v-${Date.now()}`, userId, name, phone, politicalStatus, workUnit, credentialImages, status: "pending", createdAt: fmt(new Date()) }] }))
    return { ok: true, msg: "注册提交成功，请等待审核" }
  },

  getByUserId: (userId) => get().volunteers.find((v) => v.userId === userId),

  approveVolunteer: (volunteerId) => {
    const v = get().volunteers.find((x) => x.id === volunteerId)
    if (!v) return { ok: false, msg: "志愿者不存在" }
    if (v.status !== "pending") return { ok: false, msg: "当前状态无法审核" }
    set((s) => ({ volunteers: s.volunteers.map((x) => x.id === volunteerId ? { ...x, status: "approved" as VolunteerStatus, reviewedAt: fmt(new Date()) } : x) }))
    return { ok: true, msg: "审核通过" }
  },

  rejectVolunteer: (volunteerId, reason) => {
    const v = get().volunteers.find((x) => x.id === volunteerId)
    if (!v) return { ok: false, msg: "志愿者不存在" }
    if (v.status !== "pending") return { ok: false, msg: "当前状态无法审核" }
    if (!reason.trim()) return { ok: false, msg: "请填写驳回原因" }
    set((s) => ({ volunteers: s.volunteers.map((x) => x.id === volunteerId ? { ...x, status: "rejected" as VolunteerStatus, reviewNote: reason.trim(), reviewedAt: fmt(new Date()) } : x) }))
    return { ok: true, msg: "已驳回" }
  },

  resubmitVolunteer: (volunteerId, credentialImages) => {
    const v = get().volunteers.find((x) => x.id === volunteerId)
    if (!v) return { ok: false, msg: "志愿者不存在" }
    if (v.status !== "rejected") return { ok: false, msg: "当前状态无法重新提交" }
    if (!credentialImages.length) return { ok: false, msg: "请上传资质图片" }
    set((s) => ({ volunteers: s.volunteers.map((x) => x.id === volunteerId ? { ...x, status: "pending" as VolunteerStatus, credentialImages, reviewNote: undefined, reviewedAt: undefined } : x) }))
    return { ok: true, msg: "重新提交成功，请等待审核" }
  },

  searchVolunteers: (keyword) => keyword.trim() ? get().volunteers.filter((v) => v.name.includes(keyword) || v.phone.includes(keyword)) : get().volunteers,

  demoApprove: (volunteerId) => {
    const v = get().volunteers.find((x) => x.id === volunteerId)
    if (!v) return { ok: false, msg: "志愿者不存在" }
    if (v.status === "approved") return { ok: false, msg: "已通过审核" }
    set((s) => ({ volunteers: s.volunteers.map((x) => x.id === volunteerId ? { ...x, status: "approved" as VolunteerStatus, reviewedAt: fmt(new Date()) } : x) }))
    return { ok: true, msg: "演示：审核已通过" }
  },

  // ── activity lifecycle ──

  addActivity: (act) => {
    const id = `act-${Date.now()}`
    set((s) => ({ activities: [...s.activities, { ...act, id, status: "draft", createdAt: fmt(new Date()) }] }))
    return id
  },

  editActivity: (activityId, fields) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return
    // only draft can be fully edited; published can edit minor fields
    if (act.status !== "draft" && act.status !== "pending_review") {
      // published/in_progress: only allow description and maxParticipants
      const allowed = Object.fromEntries(Object.entries(fields).filter(([k]) => ["description", "maxParticipants"].includes(k)))
      if (Object.keys(allowed).length) set((s) => ({ activities: s.activities.map((a) => a.id === activityId ? { ...a, ...allowed } : a) }))
      return
    }
    set((s) => ({ activities: s.activities.map((a) => a.id === activityId ? { ...a, ...fields } : a) }))
  },

  submitActivity: (activityId) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    const next = actTransition(act.status, "submit")
    if (!next) return { ok: false, msg: "当前状态无法提交审核" }
    if (!act.title || !act.location || !act.startTime || !act.endTime || !act.signUpDeadline)
      return { ok: false, msg: "请填写完整信息后再提交" }
    set((s) => ({ activities: s.activities.map((a) => a.id === activityId ? { ...a, status: next } : a) }))
    return { ok: true, msg: "已提交审核" }
  },

  approveActivity: (activityId) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    const next = actTransition(act.status, "approve")
    if (!next) return { ok: false, msg: "当前状态无法审核" }
    set((s) => ({ activities: s.activities.map((a) => a.id === activityId ? { ...a, status: next, reviewedAt: fmt(new Date()) } : a) }))
    // register timers for auto-progression
    registerActTimers(activityId)
    return { ok: true, msg: "审核通过，活动已发布" }
  },

  rejectActivity: (activityId, reason) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    const next = actTransition(act.status, "reject")
    if (!next) return { ok: false, msg: "当前状态无法驳回" }
    if (!reason.trim()) return { ok: false, msg: "请填写驳回原因" }
    set((s) => ({ activities: s.activities.map((a) => a.id === activityId ? { ...a, status: next, reviewNote: reason.trim(), reviewedAt: fmt(new Date()) } : a) }))
    return { ok: true, msg: "已驳回" }
  },

  cancelActivity: (activityId) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    const next = actTransition(act.status, "cancel")
    if (!next) return { ok: false, msg: "当前状态无法取消" }
    if (act.status === "published" || act.status === "in_progress") {
      const suCount = get().signUps.filter((s) => s.activityId === activityId).length
      if (suCount > 0) return { ok: false, msg: "已有报名，无法取消" }
    }
    clearActTimers(activityId)
    set((s) => ({ activities: s.activities.map((a) => a.id === activityId ? { ...a, status: next as VolunteerActivityStatus } : a) }))
    return { ok: true, msg: "活动已取消" }
  },

  forceEndActivity: (activityId) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    const next = actTransition(act.status, "forceEnd")
    if (!next) return { ok: false, msg: "当前状态无法结束" }
    clearActTimers(activityId)
    set((s) => ({ activities: s.activities.map((a) => a.id === activityId ? { ...a, status: next, endTime: fmt(new Date()) } : a) }))
    settleActivity(activityId)
    return { ok: true, msg: "活动已结束" }
  },

  deleteActivity: (activityId) => {
    clearActTimers(activityId)
    set((s) => ({ activities: s.activities.filter((a) => a.id !== activityId), signUps: s.signUps.filter((su) => su.activityId !== activityId) }))
  },

  // ── sign-up / check-in / check-out ──

  signUp: (volunteerId, activityId) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    if (act.status !== "published" && act.status !== "in_progress") return { ok: false, msg: "活动未开放报名" }
    // check enrollStartTime
    if (act.enrollStartTime && new Date() < new Date(act.enrollStartTime)) return { ok: false, msg: "报名尚未开始" }
    if (new Date() > new Date(act.signUpDeadline)) return { ok: false, msg: "报名已截止" }
    const count = get().signUps.filter((s) => s.activityId === activityId).length
    if (count >= act.maxParticipants) return { ok: false, msg: "名额已满" }
    if (get().signUps.find((s) => s.volunteerId === volunteerId && s.activityId === activityId)) return { ok: false, msg: "您已报名此活动" }
    const mySignUps = get().signUps.filter((s) => s.volunteerId === volunteerId)
    for (const su of mySignUps) {
      const otherAct = get().activities.find((a) => a.id === su.activityId)
      if (otherAct && isOverlap(act.startTime, act.endTime, otherAct.startTime, otherAct.endTime)) return { ok: false, msg: `与活动"${otherAct.title}"时间冲突` }
    }
    set((s) => ({ signUps: [...s.signUps, { id: `su-${Date.now()}`, volunteerId, activityId, signUpTime: fmt(new Date()), status: "signed_up" }] }))
    return { ok: true, msg: "报名成功" }
  },

  checkIn: (signUpId) => {
    const su = get().signUps.find((s) => s.id === signUpId)
    if (!su) return { ok: false, msg: "报名记录不存在" }
    if (su.status !== "signed_up") return { ok: false, msg: "当前状态无法签到" }
    const act = get().activities.find((a) => a.id === su.activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    const now = new Date()
    const start = new Date(act.startTime)
    const end = new Date(act.endTime)
    // must be within [start-30min, end]
    if (now < new Date(start.getTime() - 30 * 60000)) return { ok: false, msg: "活动尚未开始，请在开始前30分钟内签到" }
    if (now > end) return { ok: false, msg: "活动已结束" }
    // late check: >30min after start
    const isLate = now > new Date(start.getTime() + 30 * 60000)
    const lateMinutes = isLate ? Math.round((now.getTime() - start.getTime()) / 60000) : undefined
    set((s) => ({
      signUps: s.signUps.map((x) => x.id === signUpId
        ? { ...x, checkInTime: fmt(now), status: "checked_in" as VolunteerSignUpStatus, isLate, lateMinutes }
        : x),
    }))
    return { ok: true, msg: isLate ? `签到成功（迟到 ${lateMinutes} 分钟）` : "签到成功，已验证您在活动地点附近" }
  },

  checkOut: (signUpId) => {
    const su = get().signUps.find((s) => s.id === signUpId)
    if (!su) return { ok: false, msg: "报名记录不存在" }
    if (su.status !== "checked_in") return { ok: false, msg: "请先签到" }
    if (!su.checkInTime) return { ok: false, msg: "签到记录异常" }
    const hours = Math.round((Date.now() - new Date(su.checkInTime).getTime()) / 3600000 * 10) / 10
    const realHours = Math.max(hours, 0.5)
    set((s) => ({
      signUps: s.signUps.map((x) => x.id === signUpId
        ? { ...x, checkOutTime: fmt(new Date()), serviceHours: realHours, status: "checked_out" as VolunteerSignUpStatus }
        : x),
    }))
    // cross-domain: award points
    const volunteer = get().volunteers.find((v) => v.id === su.volunteerId)
    if (volunteer) usePointsStore.getState().transact(volunteer.userId, "volunteer_service", signUpId, Math.round(realHours * 2))
    return { ok: true, msg: `签退成功，本次服务 ${realHours} 小时` }
  },

  // ── admin resolve abnormal ──

  resolveAbnormal: (signUpId, serviceHours, reviewNote) => {
    const su = get().signUps.find((s) => s.id === signUpId)
    if (!su) return { ok: false, msg: "报名记录不存在" }
    if (su.status !== "no_show" && su.status !== "checkout_overdue") return { ok: false, msg: "当前状态无需处理" }
    if (!reviewNote.trim()) return { ok: false, msg: "请填写处理备注" }
    set((s) => ({
      signUps: s.signUps.map((x) => x.id === signUpId
        ? {
            ...x,
            status: "checked_out" as VolunteerSignUpStatus,
            serviceHours,
            checkOutTime: serviceHours > 0 ? fmt(new Date()) : undefined,
            isManual: true,
            reviewNote: reviewNote.trim(),
            resolvedAt: fmt(new Date()),
          }
        : x),
    }))
    // award points if hours > 0
    if (serviceHours > 0) {
      const volunteer = get().volunteers.find((v) => v.id === su.volunteerId)
      if (volunteer) usePointsStore.getState().transact(volunteer.userId, "volunteer_service", signUpId, Math.round(serviceHours * 2))
    }
    return { ok: true, msg: "已处理" }
  },

  // ── helpers ──

  getSignUpCount: (activityId) => get().signUps.filter((s) => s.activityId === activityId).length,
  getActiveSignUps: (volunteerId) => get().signUps.filter((s) => s.volunteerId === volunteerId),

  // ── timers ──

  startActivityTimers: () => {
    // register timers for all published/in_progress activities
    get().activities.forEach((act) => {
      if (act.status === "published" || act.status === "in_progress") registerActTimers(act.id)
    })
  },

  clearAllTimers: () => {
    for (const k of timers.keys()) clearTimer(k)
  },
}))

// ── timer helpers (outside store) ──

function registerActTimers(actId: string) {
  const act = useVolunteerStore.getState().activities.find((a) => a.id === actId)
  if (!act) return
  const now = Date.now()

  // published → in_progress at startTime
  if (act.status === "published") {
    const ms = new Date(act.startTime).getTime() - now
    if (ms > 0) {
      setTimer(`vol:act:${actId}:start`, ms, () => {
        useVolunteerStore.setState((s) => ({
          activities: s.activities.map((a) => a.id === actId ? { ...a, status: "in_progress" as VolunteerActivityStatus } : a),
        }))
        registerActTimers(actId) // re-register for end timer
      })
    } else {
      // already past startTime, transition immediately
      useVolunteerStore.setState((s) => ({
        activities: s.activities.map((a) => a.id === actId ? { ...a, status: "in_progress" as VolunteerActivityStatus } : a),
      }))
      registerActTimers(actId)
    }
  }

  // in_progress → ended at endTime
  if (act.status === "in_progress") {
    const ms = new Date(act.endTime).getTime() - now
    if (ms > 0) {
      setTimer(`vol:act:${actId}:end`, ms, () => {
        useVolunteerStore.setState((s) => ({
          activities: s.activities.map((a) => a.id === actId ? { ...a, status: "ended" as VolunteerActivityStatus, endTime: fmt(new Date()) } : a),
        }))
        settleActivity(actId)
      })
    } else {
      // already past endTime
      useVolunteerStore.setState((s) => ({
        activities: s.activities.map((a) => a.id === actId ? { ...a, status: "ended" as VolunteerActivityStatus } : a),
      }))
      settleActivity(actId)
    }
  }
}

function settleActivity(actId: string) {
  // mark abnormal sign-ups
  const signUps = useVolunteerStore.getState().signUps.filter((s) => s.activityId === actId)
  const updates: VolunteerSignUp[] = []
  for (const su of signUps) {
    if (su.status === "signed_up") {
      updates.push({ ...su, status: "no_show" })
    } else if (su.status === "checked_in") {
      updates.push({ ...su, status: "checkout_overdue" })
    }
  }
  if (updates.length) {
    useVolunteerStore.setState((s) => ({
      signUps: s.signUps.map((su) => {
        const u = updates.find((x) => x.id === su.id)
        return u || su
      }),
    }))
  }
}

// auto-start timers on first import
if (typeof window !== "undefined") {
  useVolunteerStore.getState().startActivityTimers()
}
