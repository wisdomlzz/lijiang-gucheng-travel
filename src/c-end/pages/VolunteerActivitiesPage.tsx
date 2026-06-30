import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router"
import {
  Heart, MapPin, ChevronRight, Calendar, ArrowRight, AlertCircle, RefreshCw,
  Clock, Search, Sparkles, CheckCircle2, AlertTriangle, X, List,
} from "lucide-react"
import { PageHeader } from "../components/PageHeader"
import { useVolunteerStore } from "../../shared/services/volunteer"
import { useAuthStore } from "../../shared/stores/auth-store"
import { useSearch } from "../../shared/hooks/useSearch"
import { useLoadMore } from "../../shared/hooks/useLoadMore"
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
  checked_out:      { label: "已完成",   bg: "#F1F5F9", fg: "#64748B", dot: "#94A3B8" },
  no_show:          { label: "缺席",     bg: "#FEE2E2", fg: "#DC2626", dot: "#DC2626" },
  checkout_overdue: { label: "待处理",   bg: "#FEF3C7", fg: "#D97706", dot: "#D97706" },
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

function DiscoverCard({ act, count, mySignUp, onClick, index }: {
  act: any; count: number; mySignUp: any; onClick: () => void; index: number
}) {
  const now = new Date()
  const full = count >= act.maxParticipants
  const deadlinePassed = now > new Date(act.signUpDeadline)
  const enrollNotStarted = act.enrollStartTime ? now < new Date(act.enrollStartTime) : false
  const progress = act.maxParticipants > 0 ? count / act.maxParticipants : 1

  const alreadySigned = !!mySignUp

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
            {alreadySigned && <span className="inline-block size-1.5 rounded-full bg-primary align-middle mr-1.5" />}
            {act.title}
          </h3>
          {alreadySigned && <StatusBadge status={mySignUp.status} compact />}
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
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-50">
          {alreadySigned ? (
            <span className="text-[11px] font-medium text-primary">已报名</span>
          ) : enrollNotStarted ? (
            <span className="text-[11px] font-medium" style={{ color: "#D97706" }}>报名未开启</span>
          ) : full ? (
            <span className="text-[11px] font-medium" style={{ color: "#DC2626" }}>名额已满</span>
          ) : deadlinePassed ? (
            <span className="text-[11px] font-medium" style={{ color: "#94A3B8" }}>报名已截止</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <Heart size={11} className="fill-emerald-500" />
              立即报名
            </span>
          )}
          <ChevronRight size={13} className="text-slate-300" />
        </div>
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
            style={{ touchAction: "none" }}
          >
            {/* Handle */}
            <div
              onPointerDown={handlePointerDown}
              className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
            >
              <div className="w-9 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-lg bg-primary/10 flex items-center justify-center">
                  <List size={12} className="text-primary" />
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
              {items.length === 0 ? (
                <div className="text-center py-10">
                  <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                    <Sparkles size={18} className="text-slate-300" />
                  </div>
                  <p className="text-[13px] text-slate-400">暂未报名活动</p>
                </div>
              ) : (
                items.map((item, i) => {
                  const m = STATUS_META[item.signUp.status] || { bg: "#F1F5F9", fg: "#64748B" }
                  const now = new Date()
                  const started = now >= new Date(item.startTime)
                  const ended = now > new Date(item.endTime)
                  const canCheckIn = started && !ended && item.signUp.status === "signed_up"
                  const canCheckOut = started && !ended && item.signUp.status === "checked_in"

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
                            <StatusBadge status={item.signUp.status} compact />
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
                          {item.signUp.status === "checked_out" && (
                            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                              <CheckCircle2 size={12} />
                              已完成 · {item.signUp.serviceHours ?? 0}h
                            </div>
                          )}
                          {item.signUp.status === "no_show" && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-500">
                              <AlertCircle size={12} />未签到
                            </div>
                          )}
                          {item.signUp.status === "checkout_overdue" && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600">
                              <AlertTriangle size={12} />未签退
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
      className="fixed bottom-6 right-5 z-30 h-11 rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.12)] flex items-center gap-2 pl-4 pr-3.5 active:scale-[0.95] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.16)]"
    >
      <span className="text-[13px] font-medium text-slate-700">我的活动</span>
      <div className="relative flex items-center">
        <List size={16} className="text-slate-400" />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 size-4.5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shadow-sm shadow-primary/30 min-w-[18px] px-1">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </div>
    </button>
  )
}

// ── Page ──

export function VolunteerActivitiesPage() {
  const navigate = useNavigate()
  const activities = useVolunteerStore((s) => s.activities)
  const signUps = useVolunteerStore((s) => s.signUps)
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
    const hasActive = mySignUps.some((s) => {
      const act = activities.find((a) => a.id === s.activityId)
      return act && (s.status === "signed_up" || s.status === "checked_in")
    })

    if (hasActive) setBsOpen(true)
  }, [volunteer, signUps, activities])

  // Redirect if not approved
  useEffect(() => {
    if (!volunteer) navigate("/c/volunteer", { replace: true })
  }, [volunteer, navigate])

  const now = new Date()
  const visibleActivities = useMemo(() =>
    activities.filter((a) => a.status === "published" || a.status === "in_progress"),
  [activities])

  // signed-up activities for bottom sheet
  const signedUpActs = useMemo(() => {
    if (!volunteer) return []
    const my = signUps.filter((s) => s.volunteerId === volunteer.id)
    return my.map((su) => {
      const act = activities.find((a) => a.id === su.activityId)
      if (!act) return null
      return { ...act, signUp: su }
    }).filter(Boolean)
  }, [volunteer, signUps, activities])

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
                return (
                  <DiscoverCard
                    key={act.id}
                    act={act}
                    count={count}
                    mySignUp={mySignUp}
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
