import { create } from "zustand"
import { usePointsStore } from "@/features/points/store"
import type {
  Volunteer,
  VolunteerActivity,
  VolunteerSignUp,
  VolunteerDailyRecord,
  VolunteerDailyStatus,
  VolunteerStatus,
  VolunteerActivityStatus,
  VolunteerReviewRecord,
} from "../../../shared/types"

// ── helpers ──

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}
function minutesAgo(m: number) {
  return fmt(new Date(Date.now() - m * 60000))
}
function offsetDate(days = 0, h?: number, m?: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  if (h !== undefined) d.setHours(h, m ?? 0, 0, 0)
  return d
}
function isOverlap(a1: string, a2: string, b1: string, b2: string) {
  return a1 < b2 && a2 > b1
}

/** 根据活动的 timeMode 生成每日时段列表
 *  single → [{ date, start, end }] 只一天
 *  multi  → [{ date, start, end }] × N 天
 */
function getDaySlots(
  act: Pick<VolunteerActivity, "startTime" | "endTime" | "timeMode" | "dailyStartTime" | "dailyEndTime">
): { date: string; dayStart: string; dayEnd: string }[] {
  const start = new Date(act.startTime)
  const end = new Date(act.endTime)

  if (act.timeMode === "single") {
    return [{ date: start.toISOString().slice(0, 10), dayStart: act.startTime, dayEnd: act.endTime }]
  }

  // multi: 首尾日期区间，每天用 dailyStartTime/dailyEndTime
  const [dh, dm] = (act.dailyStartTime || "09:00").split(":").map(Number)
  const [deh, dem] = (act.dailyEndTime || "17:00").split(":").map(Number)
  const slots: { date: string; dayStart: string; dayEnd: string }[] = []
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  while (cur <= last) {
    const ds = new Date(cur)
    ds.setHours(dh, dm, 0, 0)
    const de = new Date(cur)
    de.setHours(deh, dem, 0, 0)
    slots.push({ date: cur.toISOString().slice(0, 10), dayStart: fmt(ds), dayEnd: fmt(de) })
    cur.setDate(cur.getDate() + 1)
  }
  return slots
}

const NOW = new Date()

// ── activity transition table ──

function actTransition(from: VolunteerActivityStatus, action: string): VolunteerActivityStatus | null {
  const table: Record<VolunteerActivityStatus, Record<string, VolunteerActivityStatus>> = {
    draft: { publish: "published", cancel: "cancelled" },
    published: { cancel: "cancelled", forceEnd: "ended" },
    in_progress: { forceEnd: "ended", cancel: "cancelled" },
    ended: {},
    cancelled: {},
  }
  return table[from]?.[action] ?? null
}

// ── timer map ──

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function setTimer(key: string, ms: number, cb: () => void) {
  clearTimer(key)
  if (ms <= 0) {
    cb()
    return
  }
  timers.set(key, setTimeout(cb, ms))
}
function clearTimer(key: string) {
  const t = timers.get(key)
  if (t) {
    clearTimeout(t)
    timers.delete(key)
  }
}
function clearActTimers(actId: string) {
  for (const k of timers.keys()) if (k.startsWith(`vol:act:${actId}:`)) clearTimer(k)
}

// ── seed data ──

const seedVolunteers: Volunteer[] = [
  // ── 待审核 ──
  {
    id: "sv-p1",
    userId: "sv-p1",
    name: "赵小明",
    phone: "13800009001",
    politicalStatus: "群众",
    workUnit: "古城区社区居民",
    credentialImages: ["https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400"],
    status: "pending",
    createdAt: fmt(offsetDate(-1)),
  },
  {
    id: "sv-p2",
    userId: "sv-p2",
    name: "钱小华",
    phone: "13800009002",
    politicalStatus: "共青团员",
    workUnit: "丽江师范学院",
    credentialImages: ["https://images.unsplash.com/photo-1586953208270-767889fa9b0e?w=400"],
    status: "pending",
    createdAt: fmt(offsetDate(0)),
  },
  // ── 已驳回 ──
  {
    id: "sv-r",
    userId: "sv-r",
    name: "孙小红",
    phone: "13800009003",
    politicalStatus: "群众",
    workUnit: "古城客栈",
    credentialImages: ["https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400"],
    status: "rejected",
    reviewNote: "资质图片模糊，请重新上传清晰的资质照片",
    reviewHistory: [
      { action: "rejected", note: "资质图片模糊，请重新上传清晰的资质照片", reviewedAt: fmt(offsetDate(-1)) },
    ],
    reviewedAt: fmt(offsetDate(-1)),
    createdAt: fmt(offsetDate(-3)),
  },
  // ── 已通过 ──
  {
    id: "sv-2",
    userId: "u_a_001",
    name: "李小华",
    phone: "13800002222",
    politicalStatus: "共青团员",
    workUnit: "丽江师范学院",
    credentialImages: ["https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400"],
    status: "approved",
    createdAt: fmt(offsetDate(-45)),
  },
  {
    id: "sv-3",
    userId: "u_b_001",
    name: "王丽萍",
    phone: "13800003333",
    politicalStatus: "群众",
    workUnit: "古城区人民医院",
    credentialImages: [],
    status: "approved",
    createdAt: fmt(offsetDate(-30)),
  },
  {
    id: "sv-4",
    userId: "sv-4",
    name: "赵国强",
    phone: "13800004444",
    politicalStatus: "中共党员",
    workUnit: "丽江市文旅局",
    credentialImages: ["https://images.unsplash.com/photo-1586953208270-767889fa9b0e?w=400"],
    status: "approved",
    createdAt: fmt(offsetDate(-20)),
  },
  {
    id: "sv-5",
    userId: "sv-5",
    name: "陈思雨",
    phone: "13800005555",
    politicalStatus: "其他",
    workUnit: "古城客栈联盟",
    credentialImages: [],
    status: "approved",
    createdAt: fmt(offsetDate(-15)),
  },
  {
    id: "sv-6",
    userId: "sv-6",
    name: "孙伟杰",
    phone: "13800006666",
    politicalStatus: "中共党员",
    workUnit: "丽江古城管理局",
    credentialImages: ["https://images.unsplash.com/photo-1586953208270-767889fa9b0e?w=400"],
    status: "approved",
    createdAt: fmt(offsetDate(-10)),
  },
  {
    id: "sv-7",
    userId: "sv-7",
    name: "吴美玲",
    phone: "13800007777",
    politicalStatus: "共青团员",
    workUnit: "丽江文化旅游职业学院",
    credentialImages: [],
    status: "approved",
    createdAt: fmt(offsetDate(-5)),
  },
]

const seedActivities: VolunteerActivity[] = [
  // ═══ 1. 进行中·单天 ═══
  {
    id: "act-ongoing",
    title: "端午文化节·古城志愿服务",
    description: "协助端午文化节活动组织，包括赛龙舟观赛区秩序维护、游客引导、文化体验区志愿服务。",
    images: [],
    location: "丽江古城玉河广场主会场",
    startTime: fmt(offsetDate(0, NOW.getHours() - 2)),
    endTime: fmt(offsetDate(0, NOW.getHours() + 3)),
    timeMode: "multi",
    dailyStartTime: "09:00",
    dailyEndTime: "12:00",
    signUpDeadline: fmt(offsetDate(-1)),
    maxParticipants: 15,
    status: "in_progress",
    createdAt: fmt(offsetDate(-1)),
  },

  // ═══ 2. 已发布·即将开始 ═══
  {
    id: "act-soon",
    title: "古城文化快闪·志愿者招募",
    description: "参与古城文化快闪活动，协助现场布置、道具搬运、游客互动引导。",
    images: [],
    location: "丽江古城四方街广场",
    startTime: fmt(offsetDate(0, NOW.getHours(), NOW.getMinutes() + 8)),
    endTime: fmt(offsetDate(0, NOW.getHours() + 4)),
    timeMode: "multi",
    dailyStartTime: "10:00",
    dailyEndTime: "14:00",
    signUpDeadline: fmt(offsetDate(0, NOW.getHours(), NOW.getMinutes() + 60)),
    maxParticipants: 10,
    status: "published",
    createdAt: fmt(offsetDate(-2)),
  },

  // ═══ 3. 已发布·热招 ═══
  {
    id: "act-hot",
    title: "纳西古乐传承·志愿导赏",
    description: "在世界文化遗产纳西古乐会现场，协助观众签到入场、秩序维护，并学习了解纳西古乐的历史与传承。",
    images: [],
    location: "丽江古城纳西古乐会（东大街）",
    startTime: fmt(offsetDate(3, 19)),
    endTime: fmt(offsetDate(3, 21)),
    timeMode: "multi",
    dailyStartTime: "19:00",
    dailyEndTime: "21:00",
    signUpDeadline: fmt(offsetDate(2, 20)),
    maxParticipants: 8,
    status: "published",
    createdAt: fmt(offsetDate(-3)),
  },

  // ═══ 4. 已发布·多天 ═══
  {
    id: "act-multi",
    title: "古城文明旅游宣传周",
    description: "在古城主要景点设置宣传点，向游客发放文明旅游手册，劝导不文明行为。需连续服务3天。",
    images: [],
    location: "丽江古城木府前广场",
    startTime: fmt(offsetDate(4, 14)),
    endTime: fmt(offsetDate(6, 17)),
    timeMode: "multi",
    dailyStartTime: "14:00",
    dailyEndTime: "17:00",
    signUpDeadline: fmt(offsetDate(3)),
    maxParticipants: 20,
    status: "published",
    createdAt: fmt(offsetDate(-1)),
  },

  // ═══ 5. 进行中·多天（第2天） ═══
  {
    id: "act-multi-ongoing",
    title: "暑期古城秩序维护",
    description: "暑期旅游高峰期，协助古城各入口秩序维护、人流疏导。连续3天每天上午。",
    images: [],
    location: "丽江古城游客服务中心",
    startTime: fmt(offsetDate(-1, 9)),
    endTime: fmt(offsetDate(1, 12)),
    timeMode: "multi",
    dailyStartTime: "09:00",
    dailyEndTime: "12:00",
    signUpDeadline: fmt(offsetDate(-2)),
    maxParticipants: 10,
    status: "in_progress",
    createdAt: fmt(offsetDate(-1)),
  },

  // ═══ 6. 草稿 ═══
  {
    id: "act-draft",
    title: "国庆黄金周古城秩序维护",
    description: "国庆假期游客高峰期，协助古城各入口秩序维护、人流疏导。10月1-3日每天上午8:00-12:00。",
    images: [],
    location: "丽江古城游客服务中心",
    startTime: fmt(offsetDate(20, 8)),
    endTime: fmt(offsetDate(22, 12)),
    timeMode: "multi",
    dailyStartTime: "08:00",
    dailyEndTime: "12:00",
    signUpDeadline: fmt(offsetDate(18)),
    maxParticipants: 50,
    status: "draft",
    createdAt: fmt(offsetDate(0)),
  },

  // ═══ 7. 已结束·全部正常 ═══
  {
    id: "act-ended-ok",
    title: "古城公益导览·第三期",
    description: "第三期古城公益导览活动，为来丽游客提供免费导览服务，讲解古城历史与纳西文化。",
    images: [],
    location: "丽江古城大水车集合点",
    startTime: fmt(offsetDate(-3, 9)),
    endTime: fmt(offsetDate(-3, 12)),
    timeMode: "multi",
    dailyStartTime: "09:00",
    dailyEndTime: "12:00",
    signUpDeadline: fmt(offsetDate(-4)),
    maxParticipants: 20,
    status: "ended",
    createdAt: fmt(offsetDate(-20)),
  },

  // ═══ 8. 已结束·有异常 ═══
  {
    id: "act-ended-abnormal",
    title: "古城环境清洁日",
    description: "参与古城街道清洁、垃圾分类宣传志愿服务。",
    images: [],
    location: "丽江古城四方街",
    startTime: fmt(offsetDate(-2, 8)),
    endTime: fmt(offsetDate(-2, 12)),
    timeMode: "multi",
    dailyStartTime: "08:00",
    dailyEndTime: "12:00",
    signUpDeadline: fmt(offsetDate(-3)),
    maxParticipants: 20,
    status: "ended",
    createdAt: fmt(offsetDate(-15)),
  },

  // ═══ 9. 已结束·多天 ═══
  {
    id: "act-ended-multi",
    title: "东巴文化传承讲座",
    description: "协助东巴文化传承讲座现场秩序维护、签到引导工作。连续3天下午场。",
    images: [],
    location: "丽江古城文化馆三楼报告厅",
    startTime: fmt(offsetDate(-5, 14)),
    endTime: fmt(offsetDate(-3, 17)),
    timeMode: "multi",
    dailyStartTime: "14:00",
    dailyEndTime: "17:00",
    signUpDeadline: fmt(offsetDate(-6)),
    maxParticipants: 30,
    status: "ended",
    createdAt: fmt(offsetDate(-18)),
  },

  // ═══ 10. 已取消·有报名记录 ═══
  {
    id: "act-cancelled",
    title: "古城摄影志愿服务",
    description: "因天气原因取消。原计划在古城各景点为游客提供免费拍照服务。",
    images: [],
    location: "丽江古城万古楼观景台",
    startTime: fmt(offsetDate(2, 9)),
    endTime: fmt(offsetDate(2, 12)),
    timeMode: "multi",
    dailyStartTime: "09:00",
    dailyEndTime: "12:00",
    signUpDeadline: fmt(offsetDate(1)),
    maxParticipants: 10,
    status: "cancelled",
    createdAt: fmt(offsetDate(-10)),
  },
]

// ── seed sign-ups ──

const seedSignUps: VolunteerSignUp[] = [
  // act-ongoing: 7人报名
  { id: "ss-og-1", volunteerId: "u_c_001", activityId: "act-ongoing", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-og-2", volunteerId: "sv-2", activityId: "act-ongoing", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-og-3", volunteerId: "sv-3", activityId: "act-ongoing", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-og-4", volunteerId: "sv-4", activityId: "act-ongoing", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-og-5", volunteerId: "sv-5", activityId: "act-ongoing", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-og-6", volunteerId: "sv-6", activityId: "act-ongoing", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-og-7", volunteerId: "sv-7", activityId: "act-ongoing", signUpTime: fmt(offsetDate(-2)) },

  // act-soon: 5人报名（含u_c_001）
  { id: "ss-soon-1", volunteerId: "u_c_001", activityId: "act-soon", signUpTime: fmt(offsetDate(-1)) },
  { id: "ss-soon-2", volunteerId: "sv-5", activityId: "act-soon", signUpTime: fmt(offsetDate(-1)) },
  { id: "ss-soon-3", volunteerId: "sv-6", activityId: "act-soon", signUpTime: fmt(offsetDate(-1)) },
  { id: "ss-soon-4", volunteerId: "sv-7", activityId: "act-soon", signUpTime: fmt(offsetDate(-1)) },

  // act-hot: 7人报名（名额8，热招）
  { id: "ss-ht-1", volunteerId: "u_c_001", activityId: "act-hot", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-ht-2", volunteerId: "sv-2", activityId: "act-hot", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-ht-3", volunteerId: "sv-3", activityId: "act-hot", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-ht-4", volunteerId: "sv-4", activityId: "act-hot", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-ht-5", volunteerId: "sv-5", activityId: "act-hot", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-ht-6", volunteerId: "sv-6", activityId: "act-hot", signUpTime: fmt(offsetDate(-2)) },
  { id: "ss-ht-7", volunteerId: "sv-7", activityId: "act-hot", signUpTime: fmt(offsetDate(-2)) },

  // act-multi（多天即将开始）: 4人报名
  { id: "ss-mu-1", volunteerId: "u_c_001", activityId: "act-multi", signUpTime: fmt(offsetDate(-1)) },
  { id: "ss-mu-2", volunteerId: "sv-4", activityId: "act-multi", signUpTime: fmt(offsetDate(-1)) },
  { id: "ss-mu-3", volunteerId: "sv-6", activityId: "act-multi", signUpTime: fmt(offsetDate(-1)) },
  { id: "ss-mu-4", volunteerId: "sv-7", activityId: "act-multi", signUpTime: fmt(offsetDate(-1)) },

  // act-multi-ongoing: 3人报名
  { id: "ss-mg-1", volunteerId: "u_c_001", activityId: "act-multi-ongoing", signUpTime: fmt(offsetDate(-3)) },
  { id: "ss-mg-2", volunteerId: "sv-2", activityId: "act-multi-ongoing", signUpTime: fmt(offsetDate(-3)) },
  { id: "ss-mg-3", volunteerId: "sv-4", activityId: "act-multi-ongoing", signUpTime: fmt(offsetDate(-3)) },

  // act-ended-ok: 4人，全部正常
  { id: "ss-ek-1", volunteerId: "u_c_001", activityId: "act-ended-ok", signUpTime: fmt(offsetDate(-4)) },
  { id: "ss-ek-2", volunteerId: "sv-3", activityId: "act-ended-ok", signUpTime: fmt(offsetDate(-4)) },
  { id: "ss-ek-3", volunteerId: "sv-5", activityId: "act-ended-ok", signUpTime: fmt(offsetDate(-4)) },
  { id: "ss-ek-4", volunteerId: "sv-6", activityId: "act-ended-ok", signUpTime: fmt(offsetDate(-4)) },

  // act-ended-abnormal: 4人，含异常
  { id: "ss-ea-1", volunteerId: "u_c_001", activityId: "act-ended-abnormal", signUpTime: fmt(offsetDate(-3)) },
  { id: "ss-ea-2", volunteerId: "sv-2", activityId: "act-ended-abnormal", signUpTime: fmt(offsetDate(-3)) },
  { id: "ss-ea-3", volunteerId: "sv-5", activityId: "act-ended-abnormal", signUpTime: fmt(offsetDate(-3)) },
  { id: "ss-ea-4", volunteerId: "sv-7", activityId: "act-ended-abnormal", signUpTime: fmt(offsetDate(-3)) },

  // act-ended-multi（已结束多天）: 4人，混合状态
  { id: "ss-em-1", volunteerId: "u_c_001", activityId: "act-ended-multi", signUpTime: fmt(offsetDate(-7)) },
  { id: "ss-em-2", volunteerId: "sv-4", activityId: "act-ended-multi", signUpTime: fmt(offsetDate(-7)) },
  { id: "ss-em-3", volunteerId: "sv-6", activityId: "act-ended-multi", signUpTime: fmt(offsetDate(-7)) },
  { id: "ss-em-4", volunteerId: "sv-2", activityId: "act-ended-multi", signUpTime: fmt(offsetDate(-7)) },

  // act-cancelled: 3人报名（用于测试取消后的展示）
  { id: "ss-cl-1", volunteerId: "u_c_001", activityId: "act-cancelled", signUpTime: fmt(offsetDate(-3)) },
  { id: "ss-cl-2", volunteerId: "sv-3", activityId: "act-cancelled", signUpTime: fmt(offsetDate(-3)) },
  { id: "ss-cl-3", volunteerId: "sv-5", activityId: "act-cancelled", signUpTime: fmt(offsetDate(-3)) },
]

function buildSeedDailyRecords(): VolunteerDailyRecord[] {
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

const seedDailyRecords = buildSeedDailyRecords()

// ── store ──

type VolunteerState = {
  volunteers: Volunteer[]
  activities: VolunteerActivity[]
  signUps: VolunteerSignUp[]
  dailyRecords: VolunteerDailyRecord[]

  // volunteer certification
  register: (
    userId: string,
    name: string,
    phone: string,
    politicalStatus: string,
    workUnit: string,
    credentialImages: string[]
  ) => { ok: boolean; msg: string }
  getByUserId: (userId: string) => Volunteer | undefined
  approveVolunteer: (volunteerId: string) => { ok: boolean; msg: string }
  rejectVolunteer: (volunteerId: string, reason: string) => { ok: boolean; msg: string }
  resubmitVolunteer: (volunteerId: string, credentialImages: string[]) => { ok: boolean; msg: string }
  searchVolunteers: (keyword: string) => Volunteer[]
  demoApprove: (volunteerId: string) => { ok: boolean; msg: string }

  // activity lifecycle
  addActivity: (act: Omit<VolunteerActivity, "id" | "createdAt" | "status">) => string
  editActivity: (activityId: string, fields: Partial<Omit<VolunteerActivity, "id" | "createdAt" | "status">>) => void
  publishActivity: (activityId: string) => { ok: boolean; msg: string }
  cancelActivity: (activityId: string) => { ok: boolean; msg: string }
  forceEndActivity: (activityId: string) => { ok: boolean; msg: string }
  deleteActivity: (activityId: string) => void

  // sign-up (creates daily records)
  signUp: (volunteerId: string, activityId: string) => { ok: boolean; msg: string }
  cancelSignUp: (signUpId: string) => { ok: boolean; msg: string }

  // daily check-in / check-out
  checkIn: (dailyRecordId: string) => { ok: boolean; msg: string }
  checkOut: (dailyRecordId: string) => { ok: boolean; msg: string }

  // admin resolve daily abnormal
  resolveAbnormal: (
    dailyRecordId: string,
    checkInTime: string,
    checkOutTime: string,
    reviewNote: string
  ) => { ok: boolean; msg: string }

  // helpers
  getSignUpCount: (activityId: string) => number
  getActiveSignUps: (volunteerId: string) => VolunteerSignUp[]
  getDailyRecords: (signUpId: string) => VolunteerDailyRecord[]
  getDailyRecordsByActivity: (activityId: string) => VolunteerDailyRecord[]
  getServiceHours: (volunteerId: string, activityId: string) => number
  getTimeConflicts: (volunteerId: string, activityId: string) => string[]

  startActivityTimers: () => void
  clearAllTimers: () => void
}

export const useVolunteerStore = create<VolunteerState>((set, get) => ({
  volunteers: seedVolunteers,
  activities: seedActivities,
  signUps: seedSignUps,
  dailyRecords: seedDailyRecords,

  // ── volunteer certification ──

  register: (userId, name, phone, politicalStatus, workUnit, credentialImages) => {
    if (get().volunteers.find((v) => v.userId === userId)) return { ok: false, msg: "您已提交注册，无需重复注册" }
    if (!credentialImages.length) return { ok: false, msg: "请上传资质图片" }
    set((s) => ({
      volunteers: [
        ...s.volunteers,
        {
          id: userId,
          userId,
          name,
          phone,
          politicalStatus,
          workUnit,
          credentialImages,
          status: "pending",
          createdAt: fmt(new Date()),
        },
      ],
    }))
    return { ok: true, msg: "注册提交成功，请等待审核" }
  },

  getByUserId: (userId) => get().volunteers.find((v) => v.userId === userId),

  approveVolunteer: (volunteerId) => {
    const v = get().volunteers.find((x) => x.id === volunteerId)
    if (!v) return { ok: false, msg: "志愿者不存在" }
    if (v.status !== "pending") return { ok: false, msg: "当前状态无法审核" }
    const now = fmt(new Date())
    const record: VolunteerReviewRecord = { action: "approved", reviewedAt: now }
    set((s) => ({
      volunteers: s.volunteers.map((x) =>
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
    return { ok: true, msg: "审核通过" }
  },

  rejectVolunteer: (volunteerId, reason) => {
    const v = get().volunteers.find((x) => x.id === volunteerId)
    if (!v) return { ok: false, msg: "志愿者不存在" }
    if (v.status !== "pending") return { ok: false, msg: "当前状态无法审核" }
    if (!reason.trim()) return { ok: false, msg: "请填写驳回原因" }
    const now = fmt(new Date())
    const record: VolunteerReviewRecord = { action: "rejected", note: reason.trim(), reviewedAt: now }
    set((s) => ({
      volunteers: s.volunteers.map((x) =>
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
    return { ok: true, msg: "已驳回" }
  },

  resubmitVolunteer: (volunteerId, credentialImages) => {
    const v = get().volunteers.find((x) => x.id === volunteerId)
    if (!v) return { ok: false, msg: "志愿者不存在" }
    if (v.status !== "rejected") return { ok: false, msg: "当前状态无法重新提交" }
    if (!credentialImages.length) return { ok: false, msg: "请上传资质图片" }
    const now = fmt(new Date())
    const record: VolunteerReviewRecord = { action: "resubmitted", reviewedAt: now }
    set((s) => ({
      volunteers: s.volunteers.map((x) =>
        x.id === volunteerId
          ? {
              ...x,
              status: "pending" as VolunteerStatus,
              credentialImages,
              reviewNote: undefined,
              reviewedAt: undefined,
              reviewHistory: [...(x.reviewHistory || []), record],
            }
          : x
      ),
    }))
    return { ok: true, msg: "重新提交成功，请等待审核" }
  },

  searchVolunteers: (keyword) =>
    keyword.trim()
      ? get().volunteers.filter((v) => v.name.includes(keyword) || v.phone.includes(keyword))
      : get().volunteers,

  demoApprove: (volunteerId) => {
    const v = get().volunteers.find((x) => x.id === volunteerId)
    if (!v) return { ok: false, msg: "志愿者不存在" }
    if (v.status === "approved") return { ok: false, msg: "已通过审核" }
    const now = fmt(new Date())
    const record: VolunteerReviewRecord = { action: "approved", note: "演示快捷通过", reviewedAt: now }
    set((s) => ({
      volunteers: s.volunteers.map((x) =>
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

  // ── activity lifecycle ──

  addActivity: (act) => {
    const id = `act-${Date.now()}`
    set((s) => ({ activities: [...s.activities, { ...act, id, status: "draft", createdAt: fmt(new Date()) }] }))
    return id
  },

  editActivity: (activityId, fields) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return
    if (act.status !== "draft") {
      const allowed = Object.fromEntries(
        Object.entries(fields).filter(([k]) => ["description", "maxParticipants"].includes(k))
      )
      if (Object.keys(allowed).length)
        set((s) => ({ activities: s.activities.map((a) => (a.id === activityId ? { ...a, ...allowed } : a)) }))
      return
    }
    set((s) => ({ activities: s.activities.map((a) => (a.id === activityId ? { ...a, ...fields } : a)) }))
  },

  publishActivity: (activityId) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    const next = actTransition(act.status, "publish")
    if (!next) return { ok: false, msg: "当前状态无法发布" }
    if (!act.title || !act.location || !act.startTime || !act.endTime || !act.signUpDeadline)
      return { ok: false, msg: "请填写完整信息后再发布" }
    set((s) => ({ activities: s.activities.map((a) => (a.id === activityId ? { ...a, status: next } : a)) }))
    registerActTimers(activityId)
    return { ok: true, msg: "活动已发布" }
  },

  cancelActivity: (activityId) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    const next = actTransition(act.status, "cancel")
    if (!next) return { ok: false, msg: "当前状态无法取消" }
    clearActTimers(activityId)
    set((s) => ({
      activities: s.activities.map((a) =>
        a.id === activityId ? { ...a, status: next as VolunteerActivityStatus } : a
      ),
    }))
    return { ok: true, msg: "活动已取消" }
  },

  forceEndActivity: (activityId) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    const next = actTransition(act.status, "forceEnd")
    if (!next) return { ok: false, msg: "当前状态无法结束" }
    clearActTimers(activityId)
    set((s) => ({
      activities: s.activities.map((a) => (a.id === activityId ? { ...a, status: next, endTime: fmt(new Date()) } : a)),
    }))
    settleActivity(activityId)
    return { ok: true, msg: "活动已结束" }
  },

  deleteActivity: (activityId) => {
    clearActTimers(activityId)
    set((s) => ({
      activities: s.activities.filter((a) => a.id !== activityId),
      signUps: s.signUps.filter((su) => su.activityId !== activityId),
      dailyRecords: s.dailyRecords.filter((dr) => dr.activityId !== activityId),
    }))
  },

  // ── sign-up ──

  signUp: (volunteerId, activityId) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return { ok: false, msg: "活动不存在" }
    if (act.status !== "published" && act.status !== "in_progress") return { ok: false, msg: "活动未开放报名" }
    if (act.enrollStartTime && new Date() < new Date(act.enrollStartTime)) return { ok: false, msg: "报名尚未开始" }
    if (new Date() > new Date(act.signUpDeadline)) return { ok: false, msg: "报名已截止" }
    const count = get().signUps.filter((s) => s.activityId === activityId).length
    if (count >= act.maxParticipants) return { ok: false, msg: "名额已满" }
    if (get().signUps.find((s) => s.volunteerId === volunteerId && s.activityId === activityId))
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

    set((s) => ({
      signUps: [...s.signUps, { id: signUpId, volunteerId, activityId, signUpTime: fmt(new Date()) }],
      dailyRecords: [...s.dailyRecords, ...newDailyRecords],
    }))
    return { ok: true, msg: "报名成功" }
  },

  // ── cancel sign-up ──

  cancelSignUp: (signUpId) => {
    const su = get().signUps.find((s) => s.id === signUpId)
    if (!su) return { ok: false, msg: "报名记录不存在" }
    const drs = get().dailyRecords.filter((d) => d.signUpId === signUpId)
    // 只要有已签到/已签退的记录就不能取消
    if (drs.some((d) => d.status === "checked_in" || d.status === "checked_out")) {
      return { ok: false, msg: "已有服务记录，无法取消报名" }
    }
    set((s) => ({
      signUps: s.signUps.filter((x) => x.id !== signUpId),
      dailyRecords: s.dailyRecords.filter((d) => d.signUpId !== signUpId),
    }))
    return { ok: true, msg: "报名已取消" }
  },

  // ── daily check-in ──

  checkIn: (dailyRecordId) => {
    const dr = get().dailyRecords.find((d) => d.id === dailyRecordId)
    if (!dr) return { ok: false, msg: "记录不存在" }
    if (dr.status !== "pending") return { ok: false, msg: "当前状态无法签到" }
    const now = new Date()
    const start = new Date(dr.dayStartTime)
    const end = new Date(dr.dayEndTime)
    // 签到窗口：开始前30分钟 ~ 结束
    if (now < new Date(start.getTime() - 30 * 60000)) return { ok: false, msg: "请在活动开始前30分钟内签到" }
    if (now > end) return { ok: false, msg: "今日活动已结束" }
    // 迟到：开始后30分钟
    const isLate = now > new Date(start.getTime() + 30 * 60000)
    const lateMinutes = isLate ? Math.round((now.getTime() - start.getTime()) / 60000) : undefined
    set((s) => ({
      dailyRecords: s.dailyRecords.map((x) =>
        x.id === dailyRecordId
          ? { ...x, checkInTime: fmt(now), status: "checked_in" as VolunteerDailyStatus, isLate, lateMinutes }
          : x
      ),
    }))
    return { ok: true, msg: isLate ? `签到成功（迟到 ${lateMinutes} 分钟）` : "签到成功" }
  },

  // ── daily check-out ──

  checkOut: (dailyRecordId) => {
    const dr = get().dailyRecords.find((d) => d.id === dailyRecordId)
    if (!dr) return { ok: false, msg: "记录不存在" }
    if (dr.status !== "checked_in") return { ok: false, msg: "请先签到" }
    if (!dr.checkInTime) return { ok: false, msg: "签到记录异常" }
    const now = new Date()
    // 时长 = min(签退-签到, 当天时段总时长)，不超过当天活动时长
    const dayDurationMs = new Date(dr.dayEndTime).getTime() - new Date(dr.dayStartTime).getTime()
    const rawHours = (now.getTime() - new Date(dr.checkInTime).getTime()) / 3600000
    const maxHours = dayDurationMs / 3600000
    const realHours = Math.min(Math.max(Math.round(rawHours * 10) / 10, 0.5), Math.round(maxHours * 10) / 10)

    set((s) => ({
      dailyRecords: s.dailyRecords.map((x) =>
        x.id === dailyRecordId
          ? { ...x, checkOutTime: fmt(now), serviceHours: realHours, status: "checked_out" as VolunteerDailyStatus }
          : x
      ),
    }))
    usePointsStore.getState().transact(dr.volunteerId, "volunteer_service", dr.id)
    return { ok: true, msg: `签退成功，本次服务 ${realHours} 小时` }
  },

  // ── admin resolve daily abnormal ──

  resolveAbnormal: (dailyRecordId, checkInTime, checkOutTime, reviewNote) => {
    const dr = get().dailyRecords.find((d) => d.id === dailyRecordId)
    if (!dr) return { ok: false, msg: "记录不存在" }
    if (dr.status !== "no_show" && dr.status !== "checkout_overdue") return { ok: false, msg: "当前状态无需处理" }
    if (!reviewNote.trim()) return { ok: false, msg: "请填写补录备注" }
    // 签到签退时间不能为空，且签退≥签到
    if (!checkInTime || !checkOutTime) return { ok: false, msg: "请填写签到和签退时间" }
    const ci = new Date(checkInTime),
      co = new Date(checkOutTime)
    if (co <= ci) return { ok: false, msg: "签退时间必须晚于签到时间" }
    // 时间不早于当天开始、不晚于当天结束
    const dayStart = new Date(dr.dayStartTime),
      dayEnd = new Date(dr.dayEndTime)
    const clampedCi = ci < dayStart ? dayStart : ci > dayEnd ? dayEnd : ci
    const clampedCo = co < clampedCi ? new Date(clampedCi.getTime() + 60000) : co > dayEnd ? dayEnd : co
    // 时长计算：min(签退-签到, 当天时段长)
    const dayDurationMs = dayEnd.getTime() - dayStart.getTime()
    const rawHours = (clampedCo.getTime() - clampedCi.getTime()) / 3600000
    const realHours = Math.min(
      Math.max(Math.round(rawHours * 10) / 10, 0.5),
      Math.round((dayDurationMs / 3600000) * 10) / 10
    )

    set((s) => ({
      dailyRecords: s.dailyRecords.map((x) =>
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

  getSignUpCount: (activityId) => get().signUps.filter((s) => s.activityId === activityId).length,
  getActiveSignUps: (volunteerId) => get().signUps.filter((s) => s.volunteerId === volunteerId),
  getDailyRecords: (signUpId) => get().dailyRecords.filter((d) => d.signUpId === signUpId),
  getDailyRecordsByActivity: (activityId) => get().dailyRecords.filter((d) => d.activityId === activityId),
  getServiceHours: (volunteerId, activityId) => {
    return get()
      .dailyRecords.filter(
        (d) =>
          d.volunteerId === volunteerId && d.activityId === activityId && d.status === "checked_out" && d.serviceHours
      )
      .reduce((sum, d) => sum + (d.serviceHours || 0), 0)
  },

  getTimeConflicts: (volunteerId, activityId) => {
    const act = get().activities.find((a) => a.id === activityId)
    if (!act) return []
    const conflicts: string[] = []
    const mySUs = get().signUps.filter((s) => s.volunteerId === volunteerId && s.activityId !== activityId)
    for (const su of mySUs) {
      const otherAct = get().activities.find((a) => a.id === su.activityId)
      if (!otherAct) continue
      // 只检测仍有效的已报名活动（未结束、未取消）
      if (otherAct.status === "ended" || otherAct.status === "cancelled") continue
      if (isOverlap(act.startTime, act.endTime, otherAct.startTime, otherAct.endTime)) {
        conflicts.push(otherAct.title)
      }
    }
    return conflicts
  },

  // ── timers ──

  startActivityTimers: () => {
    get().activities.forEach((act) => {
      if (act.status === "published" || act.status === "in_progress") registerActTimers(act.id)
    })
  },

  clearAllTimers: () => {
    for (const k of timers.keys()) clearTimer(k)
  },
}))

// ── timer helpers ──

function registerActTimers(actId: string) {
  const act = useVolunteerStore.getState().activities.find((a) => a.id === actId)
  if (!act) return
  const now = Date.now()

  if (act.status === "published") {
    const ms = new Date(act.startTime).getTime() - now
    if (ms > 0) {
      setTimer(`vol:act:${actId}:start`, ms, () => {
        useVolunteerStore.setState((s) => ({
          activities: s.activities.map((a) =>
            a.id === actId ? { ...a, status: "in_progress" as VolunteerActivityStatus } : a
          ),
        }))
        registerActTimers(actId)
      })
    } else {
      useVolunteerStore.setState((s) => ({
        activities: s.activities.map((a) =>
          a.id === actId ? { ...a, status: "in_progress" as VolunteerActivityStatus } : a
        ),
      }))
      registerActTimers(actId)
    }
  }

  if (act.status === "in_progress") {
    // 多天活动：每天结束时独立结算当日记录
    if (act.timeMode === "multi") {
      const slots = getDaySlots(act)
      for (const slot of slots) {
        const dayEndMs = new Date(slot.dayEnd).getTime()
        if (dayEndMs > now) {
          setTimer(`vol:act:${actId}:day:${slot.date}`, dayEndMs - now, () => {
            settleActivity(actId)
          })
        }
      }
    }
    // 活动最终结束：endTime 是最后一天的结束时刻
    const ms = new Date(act.endTime).getTime() - now
    if (ms > 0) {
      setTimer(`vol:act:${actId}:end`, ms, () => {
        useVolunteerStore.setState((s) => ({
          activities: s.activities.map((a) =>
            a.id === actId ? { ...a, status: "ended" as VolunteerActivityStatus, endTime: fmt(new Date()) } : a
          ),
        }))
        settleActivity(actId)
      })
    } else {
      useVolunteerStore.setState((s) => ({
        activities: s.activities.map((a) =>
          a.id === actId ? { ...a, status: "ended" as VolunteerActivityStatus } : a
        ),
      }))
      settleActivity(actId)
    }
  }
}

function settleActivity(actId: string) {
  // 每天的日记录独立结算
  const records = useVolunteerStore.getState().dailyRecords.filter((d) => d.activityId === actId)
  const now = Date.now()
  const updates: VolunteerDailyRecord[] = []
  for (const dr of records) {
    // 只结算已过去的日期
    if (now < new Date(dr.dayEndTime).getTime()) continue
    if (dr.status === "pending") {
      updates.push({ ...dr, status: "no_show" })
    } else if (dr.status === "checked_in") {
      updates.push({ ...dr, status: "checkout_overdue" })
    }
  }
  if (updates.length) {
    useVolunteerStore.setState((s) => ({
      dailyRecords: s.dailyRecords.map((dr) => {
        const u = updates.find((x) => x.id === dr.id)
        return u || dr
      }),
    }))
  }
}

// auto-start timers
if (typeof window !== "undefined") {
  useVolunteerStore.getState().startActivityTimers()
}
