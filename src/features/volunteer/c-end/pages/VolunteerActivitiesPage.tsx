import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router"
import {
  Heart, MapPin, ChevronRight, Calendar, ArrowRight, AlertCircle, RefreshCw,
  Clock, Search, Sparkles, CheckCircle2, AlertTriangle, X, XCircle,
} from "lucide-react"
import { PageHeader } from "../../../../c-end/components/PageHeader"
import { useVolunteerStore } from "../../store"
import { useAuthStore } from "../../../../platform/auth"
import { useSearch } from "../../../../shared/hooks/useSearch"
import { useLoadMore } from "../../../../shared/hooks/useLoadMore"
import { motion, AnimatePresence } from "motion/react"

const BS_SESSION_KEY = "vol-demo-bs-shown"

// ── Helpers ──

function fmtTimeRange(start: string, end: string) {
  const s = new Date(start), e = new Date(end)
  const isSameDay = s.toDateString() === e.toDateString()
  const sm = s.getMonth() + 1, sd = s.getDate()
  const sh = String(s.getHours()).padStart(2, "0"), smin = String(s.getMinutes()).padStart(2, "0")
  const eh = String(e.getHours()).padStart(2, "0"), emin = String(e.getMinutes()).padStart(2, "0")
  if (isSameDay) return `${sm}月${sd}日 ${sh}:${smin}-${eh}:${emin}`
  return `${sm}月${sd}日 ${sh}:${smin} ~ ${e.getMonth() + 1}月${e.getDate()}日 ${eh}:${emin}`
}

function fmtDate(d: string) {
  const date = new Date(d)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// ── Status helpers ──

const STATUS_META: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  signed_up:        { label: "已报名",   bg: "#DBEAFE", fg: "#2563EB", dot: "#2563EB" },
  checked_in:       { label: "已签到",   bg: "#D1FAE5", fg: "#059669", dot: "#059669" },
  checked_out:      { label: "已签退",   bg: "#F1F5F9", fg: "#64748B", dot: "#94A3B8" },
  no_show:          { label: "未参与",   bg: "#FEF3C7", fg: "#B45309", dot: "#D97706" },
  checkout_overdue: { label: "待补签退", bg: "#FEF3C7", fg: "#D97706", dot: "#D97706" },
  pending:          { label: "待签到",   bg: "#DBEAFE", fg: "#2563EB", dot: "#2563EB" },
  cancelled:        { label: "已取消",   bg: "#F1F5F9", fg: "#94A3B8", dot: "#CBD5E1" },
}

function StatusDot({ status }: { status: string }) {
  const m = STATUS_META[status] || { dot: "#CBD5E1" }
  return <span className="inline-block size-1.5 rounded-full" style={{ background: m.dot }} />
}

function StatusBadge({ status, compact }: { status: string; compact?: boolean }) {
  const m = STATUS_META[status] || { label: status, bg: "#F1F5F9", fg: "#64748B" }
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap ${
      compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-1"
    }`} style={{ background: m.bg, color: m.fg }}>
      <StatusDot status={status} />
      {m.label}
    </span>
  )
}

// ── Discover Activity Card ──

function DiscoverCard({ act, count, mySignUp, myDailyStatus, myTotalHours, onClick, index }: {
  act: any; count: number; mySignUp: any; myDailyStatus?: string; myTotalHours?: number; onClick: () => void; index: number
}) {
  const now = new Date()
  const full = count >= act.maxParticipants
  const deadlinePassed = now > new Date(act.signUpDeadline)
  const enrollNotStarted = act.enrollStartTime ? now < new Date(act.enrollStartTime) : false
  const progress = act.maxParticipants > 0 ? count / act.maxParticipants : 1

  const alreadySigned = !!mySignUp

  // ── Badge（右上角 · 你与活动的关系）──
  const badgeInfo = alreadySigned
    ? { label: "已报名", bg: "#DBEAFE", fg: "#2563EB" }
    : act.status === "cancelled"
    ? { label: "已取消", bg: "#F1F5F9", fg: "#94A3B8" }
    : act.status === "ended"
    ? { label: "已结束", bg: "#F1F5F9", fg: "#94A3B8" }
    : { label: "报名中", bg: "#D1FAE5", fg: "#059669" }

  // ── Footer text（底部 · 操作引导）──
  let footer: { text: string; color: string } | null = null

  if (alreadySigned) {
    if (myDailyStatus === "checked_in") {
      footer = { text: "签退", color: "#D97706" }
    } else if (myDailyStatus === "pending") {
      const start = new Date(act.startTime)
      const windowOpen = now >= new Date(start.getTime() - 30 * 60000)
      if (windowOpen && act.status !== "ended") {
        footer = { text: "签到", color: "#2563EB" }
      } else {
        footer = { text: "等待活动开始", color: "#2563EB" }
      }
    } else if (myDailyStatus === "checkout_overdue") {
      footer = { text: "联系管理员", color: "#DC2626" }
    } else if (myDailyStatus === "checked_out") {
      footer = { text: `已完成 · ${myTotalHours || 0}h`, color: "#64748B" }
    }
    // no_show → 无底部文字
  } else if (act.status !== "cancelled" && act.status !== "ended") {
    if (enrollNotStarted) footer = { text: "报名未开启", color: "#D97706" }
    else if (full) footer = { text: `名额已满 (${count}/${act.maxParticipants})`, color: "#DC2626" }
    else if (deadlinePassed) footer = { text: "报名已截止", color: "#94A3B8" }
    else footer = { text: "立即报名", color: "#059669" }
  }

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-[0_1px_8px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all"
    >
      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-[14px] font-medium text-slate-800 leading-snug flex-1 min-w-0">
            {act.title}
          </h3>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0" style={{ background: badgeInfo.bg, color: badgeInfo.fg }}>
            {badgeInfo.label}
          </span>
        </div>

        {/* Description */}
        {act.description && (
          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-2.5">{act.description}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1"><MapPin size={11} />{act.location}</span>
          <span className="inline-flex items-center gap-1"><Calendar size={11} />{fmtTimeRange(act.startTime, act.endTime)}</span>
        </div>

        {/* Capacity bar */}
        <div>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-slate-300">报名</span>
              <span className="font-medium" style={{ color: full ? "#DC2626" : "#059669" }}>{count}/{act.maxParticipants}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress * 100, 100)}%` }}
                transition={{ duration: 0.6, delay: index * 0.06 }}
                className="h-full rounded-full"
                style={{ background: full ? "#DC2626" : progress > 0.8 ? "#F59E0B" : "#059669" }}
              />
            </div>
          </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-50">
            <span className="text-[11px] font-medium" style={{ color: footer.color }}>
              {footer.text === "立即报名" && <Heart size={11} className="inline fill-emerald-500 mr-1 -mt-0.5" />}
              {footer.text}
            </span>
            <ChevronRight size={13} className="text-slate-300" />
          </div>
        )}
      </div>
    </motion.button>
  )
}

// ── Bottom Sheet ──

function ActivityBottomSheet({
  items, visible, onClose, onItemClick,
}: {
  items: any[]
  visible: boolean
  onClose: () => void
  onItemClick: (id: string) => void
}) {
  // 三级排序：需操作(0) > 等待中(1) > 已结束/取消(2)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const pri = (item: any) => {
        const now = new Date()
        const started = now >= new Date(item.startTime)
        const ended = now > new Date(item.endTime)
        const s = item.summaryStatus
        if (s === "cancelled") return 2
        if (ended) return 2
        if (s === "checked_out") return 1
        if (s === "no_show" || s === "checkout_overdue") return 1
        if (s === "pending" && !started) return 1
        return 0 // checked_in 或 pending 已开始 = 需操作
      }
      return pri(a) - pri(b)
    })
  }, [items])
  // handle: spring animation
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [offsetY, setOffsetY] = useState(0)

  const handlePointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY
    setDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    setOffsetY(Math.max(0, e.clientY - startY.current))
  }

  const handlePointerUp = () => {
    if (dragging) {
      setDragging(false)
      if (offsetY > 80) {
        onClose()
      }
      setOffsetY(0)
    }
  }

  useEffect(() => {
    if (!visible) {
      setOffsetY(0)
      setDragging(false)
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: offsetY }}
            exit={{ y: "100%" }}
            transition={dragging ? { duration: 0 } : { type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] max-h-[70vh] flex flex-col"
          >
            {/* Handle */}
            <div
              onPointerDown={handlePointerDown}
              className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
              style={{ touchAction: "none" }}
            >
              <div className="w-9 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart size={12} className="text-primary" />
                </div>
                <span className="text-[15px] font-semibold text-slate-800">我的活动</span>
                <span className="text-[11px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{items.length}</span>
              </div>
              <button onClick={onClose} className="size-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X size={13} className="text-slate-400" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2.5">
              {sortedItems.length === 0 ? (
                <div className="text-center py-10">
                  <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                    <Sparkles size={18} className="text-slate-300" />
                  </div>
                  <p className="text-[13px] text-slate-400">暂未报名活动</p>
                </div>
              ) : (
                sortedItems.map((item, i) => {
                  const m = STATUS_META[item.summaryStatus] || { bg: "#F1F5F9", fg: "#64748B" }
                  const now = new Date()
                  const started = now >= new Date(item.startTime)
                  const ended = now > new Date(item.endTime)
                  const canCheckIn = started && !ended && item.summaryStatus === "pending"
                  const canCheckOut = started && !ended && item.summaryStatus === "checked_in"

                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => { onClose(); onItemClick(item.id) }}
                      className="w-full text-left bg-white rounded-2xl border border-slate-100 p-3.5 active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Status indicator bar */}
                        <div className="w-1 shrink-0 rounded-full self-stretch" style={{ background: m.fg }} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-[13px] font-medium text-slate-800 truncate">{item.title}</h4>
                            <StatusBadge status={item.summaryStatus} compact />
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-1"><MapPin size={10} />{item.location}</span>
                            <span className="text-slate-200">·</span>
                            <span className="inline-flex items-center gap-1"><Calendar size={10} />{fmtDate(item.startTime)}</span>
                          </div>

                          {/* Action hint */}
                          {canCheckIn && (
                            <div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-primary">
                              <Clock size={12} />
                              待签到
                              <ArrowRight size={13} className="ml-auto" />
                            </div>
                          )}
                          {canCheckOut && (
                            <div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-amber-600">
                              <Clock size={12} />
                              待签退
                              <ArrowRight size={13} className="ml-auto" />
                            </div>
                          )}
                          {item.summaryStatus === "checked_out" && (
                            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                              <CheckCircle2 size={12} />
                              {item.totalCount > 1 ? `已完成 ${item.doneCount}/${item.totalCount} 天` : "已完成"} · {item.totalHours ?? 0}h
                            </div>
                          )}
                          {item.summaryStatus === "cancelled" && (
                            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                              <XCircle size={12} />活动已取消
                            </div>
                          )}
                          {item.summaryStatus === "no_show" && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600">
                              <AlertCircle size={12} />未参与
                            </div>
                          )}
                          {item.summaryStatus === "checkout_overdue" && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600">
                              <AlertTriangle size={12} />待补签退
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  )
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Floating Action Button ──

function FAB({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-4 z-30 flex items-center gap-2 h-11 pl-4 pr-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-[0_4px_20px_rgba(0,0,0,0.18)] active:scale-[0.95] transition-all hover:shadow-[0_6px_24px_rgba(0,0,0,0.24)]"
    >
      <Heart size={15} className="text-amber-300" />
      <span className="text-[13px] font-medium">我的活动</span>
      {count > 0 && (
        <span className="ml-0.5 min-w-[20px] h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1.5">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  )
}

// ── Page ──

export function VolunteerActivitiesPage() {
  const navigate = useNavigate()
  const activities = useVolunteerStore((s) => s.activities)
  const signUps = useVolunteerStore((s) => s.signUps)
  const dailyRecords = useVolunteerStore((s) => s.dailyRecords)
  const getSignUpCount = useVolunteerStore((s) => s.getSignUpCount)
  const getByUserId = useVolunteerStore((s) => s.getByUserId)
  const user = useAuthStore((s) => s.user)

  const volunteer = user ? getByUserId(user.id) : undefined
  const [bsOpen, setBsOpen] = useState(false)

  // Auto-show bottom sheet on first visit (only if has active activities)
  useEffect(() => {
    if (!volunteer || volunteer.status !== "approved") return
    if (sessionStorage.getItem(BS_SESSION_KEY)) return

    const mySignUps = signUps.filter((s) => s.volunteerId === volunteer.id)
    const hasActive = mySignUps.some((su) => {
      return dailyRecords.some((d) => d.signUpId === su.id && (d.status === "pending" || d.status === "checked_in"))
    })

    if (hasActive) setBsOpen(true)
  }, [volunteer, signUps, activities])

  // Redirect if not approved
  useEffect(() => {
    if (!volunteer) navigate("/c/volunteer", { replace: true })
  }, [volunteer, navigate])

  const now = new Date()
  const visibleActivities = useMemo(() =>
    activities.filter((a) => a.status !== "draft"),
  [activities])

  // signed-up activities for bottom sheet
  const signedUpActs = useMemo(() => {
    if (!volunteer) return []
    const my = signUps.filter((s) => s.volunteerId === volunteer.id)
    return my.map((su) => {
      const act = activities.find((a) => a.id === su.activityId)
      if (!act) return null
      // 从日记录汇总状态
      const drs = dailyRecords.filter(d => d.signUpId === su.id)
      // 已取消的活动直接显示取消状态
      if (act.status === "cancelled") {
        return { ...act, signUp: su, summaryStatus: "cancelled", doneCount: 0, totalCount: drs.length, totalHours: 0 }
      }
      const hasCheckedIn = drs.some(d => d.status === "checked_in")
      const allCheckedOut = drs.length > 0 && drs.every(d => d.status === "checked_out")
      const hasAbnormal = drs.some(d => d.status === "no_show" || d.status === "checkout_overdue")
      // 优先级：可操作(checked_in) > 已完成(checked_out) > 有异常 > 待签到
      const summaryStatus = hasCheckedIn ? "checked_in" : allCheckedOut ? "checked_out" : hasAbnormal ? "no_show" : "pending"
      const doneCount = drs.filter(d => d.status === "checked_out").length
      const totalCount = drs.length
      const totalHours = drs.reduce((sum, d) => sum + (d.serviceHours || 0), 0)
      return { ...act, signUp: su, summaryStatus, doneCount, totalCount, totalHours }
    }).filter(Boolean)
  }, [volunteer, signUps, activities, dailyRecords])

  // ── Volunteer summary stats ──
  const volStats = useMemo(() => {
    if (!volunteer) return null
    const mySignUps = signUps.filter((s) => s.volunteerId === volunteer.id)
    const myRecords = dailyRecords.filter((d) => mySignUps.some((su) => su.id === d.signUpId))
    const totalHours = Math.round(myRecords.reduce((sum, d) => sum + (d.serviceHours || 0), 0) * 10) / 10
    const activityCount = mySignUps.length
    return { totalHours, activityCount }
  }, [volunteer, signUps, dailyRecords])

  // discover list
  const searchFn = useCallback(
    (act: any, q: string) => act.title.includes(q) || act.description.includes(q) || act.location.includes(q),
    [],
  )
  const { query, setQuery, filtered: searchedPublished } = useSearch(visibleActivities, searchFn)
  const { visible, hasMore, loadMore, total } = useLoadMore(searchedPublished, 10)

  const handleBsClose = useCallback(() => {
    setBsOpen(false)
    sessionStorage.setItem(BS_SESSION_KEY, "1")
  }, [])

  // ── Volunteer status gate ──
  if (volunteer && volunteer.status !== "approved") {
    const isRejected = volunteer.status === "rejected"
    return (
      <div className="min-h-screen bg-[#F8F6F3]">
        <PageHeader title="志愿活动" back="/c/home" />
        <div className="px-4 py-16 flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-white p-8 shadow-[0_8px_28px_rgba(139,111,92,0.08)] max-w-[280px]">
            <div className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: isRejected ? "#FEE2E2" : "#FEF3C7" }}>
              <AlertCircle size={28} style={{ color: isRejected ? "#DC2626" : "#D97706" }} />
            </div>
            <h3 className="text-[16px] font-semibold text-slate-800 mb-2">
              {isRejected ? "认证未通过" : "认证审核中"}
            </h3>
            <p className="text-[13px] text-slate-400 leading-relaxed mb-5">
              {isRejected ? "您的志愿者认证未通过，请重新提交申请。" : "审核通过后即可查看活动列表。"}
            </p>
            <button onClick={() => navigate("/c/volunteer", { replace: true })}
              className="w-full h-10 rounded-2xl bg-primary text-white text-[13px] font-medium flex items-center justify-center gap-2">
              {isRejected ? <RefreshCw size={14} /> : null}
              {isRejected ? "重新认证" : "返回认证中心"}
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] pb-20">
      <PageHeader title="志愿活动" back="/c/home" />

      <div className="pt-5 px-4 space-y-3">
        {/* Activity count */}
        {total > 0 && (
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[15px] font-semibold text-slate-800">发现活动</h2>
            <span className="text-[11px] text-slate-400">{total} 个活动</span>
          </div>
        )}

        {/* Volunteer stats */}
        {volStats && (
          <div className="rounded-xl bg-white border border-slate-100 px-4 py-2.5 flex items-center gap-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-1.5 text-[12px]">
              <span className="text-slate-400">累计</span>
              <span className="font-semibold text-emerald-600">{volStats.totalHours}h</span>
            </div>
            <div className="w-px h-4 bg-slate-100" />
            <div className="flex items-center gap-1.5 text-[12px]">
              <span className="text-slate-400">参与</span>
              <span className="font-semibold text-primary">{volStats.activityCount} 场</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索活动名称、地点..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-[13px] placeholder:text-slate-300 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {/* Activity list */}
        {total === 0 ? (
          <div className="text-center py-14">
            <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={22} className="text-slate-300" />
            </div>
            <p className="text-[13px] text-slate-400">
              {query ? "换个关键词试试" : "暂无可报名活动"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visible.map((act, i) => {
                const count = getSignUpCount(act.id)
                const mySignUp = volunteer ? signUps.find((s) => s.volunteerId === volunteer.id && s.activityId === act.id) : undefined
                // 取该报名最近一条需要操作的日记录状态
                const myDailyStatus = mySignUp
                  ? (() => {
                      const drs = dailyRecords.filter(d => d.signUpId === mySignUp.id).sort((a, b) => a.date.localeCompare(b.date))
                      // 优先：checked_in > pending > 其他
                      return drs.find(d => d.status === "checked_in")?.status
                        || drs.find(d => d.status === "pending")?.status
                        || drs[drs.length - 1]?.status
                    })()
                  : undefined
                const myTotalHours = mySignUp
                  ? dailyRecords.filter(d => d.signUpId === mySignUp.id).reduce((s, d) => s + (d.serviceHours || 0), 0)
                  : 0
                return (
                  <DiscoverCard
                    key={act.id}
                    act={act}
                    count={count}
                    mySignUp={mySignUp}
                    myDailyStatus={myDailyStatus}
                    myTotalHours={myTotalHours}
                    onClick={() => navigate(`/c/volunteer/activities/${act.id}`)}
                    index={i}
                  />
                )
              })}
            </AnimatePresence>

            {hasMore && (
              <button onClick={loadMore}
                className="w-full py-3 rounded-2xl bg-white text-[13px] font-medium text-primary shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all">
                加载更多
              </button>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <FAB count={signedUpActs.length} onClick={() => setBsOpen(true)} />

      {/* Bottom Sheet */}
      <ActivityBottomSheet
        items={signedUpActs}
        visible={bsOpen}
        onClose={handleBsClose}
        onItemClick={(id) => navigate(`/c/volunteer/activities/${id}`)}
      />
    </div>
  )
}
