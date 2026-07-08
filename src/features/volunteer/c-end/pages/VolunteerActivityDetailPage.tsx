import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { useVolunteerStore } from "../../store"
import { useAuthStore } from "@/platform/auth"
import {
  Heart,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Shield,
  AlertTriangle,
  AlertCircle,
  Clock4,
  Users,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../shared/components/ui/dialog"
import { Button } from "../../../../shared/components/ui/button"

const STATUS_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "待签到", bg: "#DBEAFE", fg: "#2563EB" },
  checked_in: { label: "已签到", bg: "#D1FAE5", fg: "#059669" },
  checked_out: { label: "已签退", bg: "#F1F5F9", fg: "#64748B" },
  no_show: { label: "未参与", bg: "#FEF3C7", fg: "#B45309" },
  checkout_overdue: { label: "待补签退", bg: "#FEF3C7", fg: "#D97706" },
}

function fmtTime(d: string) {
  const date = new Date(d)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function fmtDate(d: string) {
  const date = new Date(d)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function fmtHM(d: string) {
  const date = new Date(d)
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function StatusBadge({ status, compact }: { status: string; compact?: boolean }) {
  const c = STATUS_MAP[status] || { label: status, bg: "#F1F5F9", fg: "#64748B" }
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${compact ? "text-[9px] px-1.5" : ""}`}
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  )
}

// ── Image Carousel ──

function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0)
  if (!images.length) return null
  return (
    <div className="relative h-48 overflow-hidden bg-slate-100">
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={images[idx]}
          alt=""
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="size-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/70 flex items-center justify-center backdrop-blur-sm shadow-sm hover:bg-white/90 transition-all"
          >
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/70 flex items-center justify-center backdrop-blur-sm shadow-sm hover:bg-white/90 transition-all"
          >
            <ChevronRight size={16} className="text-slate-600" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`size-1.5 rounded-full transition-all ${i === idx ? "bg-white w-4" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
      <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] text-white/90">
        {idx + 1}/{images.length}
      </div>
    </div>
  )
}

// ── Page ──

export function VolunteerActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const activities = useVolunteerStore((s) => s.activities)
  const signUps = useVolunteerStore((s) => s.signUps)
  const dailyRecords = useVolunteerStore((s) => s.dailyRecords)
  const getSignUpCount = useVolunteerStore((s) => s.getSignUpCount)
  const doSignUp = useVolunteerStore((s) => s.signUp)
  const doCancelSignUp = useVolunteerStore((s) => s.cancelSignUp)
  const doCheckIn = useVolunteerStore((s) => s.checkIn)
  const doCheckOut = useVolunteerStore((s) => s.checkOut)
  const getByUserId = useVolunteerStore((s) => s.getByUserId)
  const getTimeConflicts = useVolunteerStore((s) => s.getTimeConflicts)
  const user = useAuthStore((s) => s.user)

  const act = activities.find((a) => a.id === id)
  const [loading, setLoading] = useState("")
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false)
  const [conflictTitles, setConflictTitles] = useState<string[]>([])
  const volunteer = user ? getByUserId(user.id) : undefined

  useEffect(() => {
    if (!volunteer) navigate("/c/volunteer", { replace: true })
  }, [volunteer, navigate])

  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(t)
  }, [])

  // 我的报名记录
  const mySignUp = useMemo(() => {
    if (!volunteer || !act) return undefined
    return signUps.find((s) => s.volunteerId === volunteer.id && s.activityId === act.id)
  }, [volunteer, act, signUps])

  // 我的每日记录（按日期排序）
  const myDailyRecords = useMemo(() => {
    if (!mySignUp) return []
    return dailyRecords.filter((d) => d.signUpId === mySignUp.id).sort((a, b) => a.date.localeCompare(b.date))
  }, [mySignUp, dailyRecords])

  // 今天或下一个需要操作的日记录
  const activeDaily = useMemo(() => {
    if (!myDailyRecords.length) return undefined
    // 优先：进行中可签退 → 签到窗口可签到 → 下一个未完成的天
    const checkedIn = myDailyRecords.find((d) => d.status === "checked_in")
    if (checkedIn) return checkedIn
    const canCheckIn = myDailyRecords.find((d) => {
      if (d.status !== "pending") return false
      const start = new Date(d.dayStartTime)
      const end = new Date(d.dayEndTime)
      return now >= new Date(start.getTime() - 30 * 60000) && now <= end
    })
    if (canCheckIn) return canCheckIn
    return myDailyRecords.find((d) => d.status === "pending")
  }, [myDailyRecords, now])

  if (!act) {
    return (
      <div className="min-h-screen bg-surface-page pb-6">
        <PageHeader title="活动详情" back={() => navigate("/c/volunteer/activities")} />
        <div className="px-4 py-14 text-center">
          <p className="text-[13px] text-slate-300">活动不存在</p>
        </div>
      </div>
    )
  }

  const count = getSignUpCount(act.id)
  const full = count >= act.maxParticipants
  const deadlinePassed = now > new Date(act.signUpDeadline)
  const enrollNotStarted = act.enrollStartTime ? now < new Date(act.enrollStartTime) : false
  const started = now >= new Date(act.startTime)
  const ended = now > new Date(act.endTime)
  const isCancelled = act.status === "cancelled"
  const progress = act.maxParticipants > 0 ? count / act.maxParticipants : 1

  // ── Handlers ──

  const handleSignUp = async () => {
    if (!volunteer) {
      toast.error("请先完成志愿者注册")
      navigate("/c/volunteer")
      return
    }
    // 检测时间冲突
    const conflicts = volunteer ? getTimeConflicts(volunteer.id, act.id) : []
    if (conflicts.length > 0) {
      setConflictTitles(conflicts)
      setConflictDialogOpen(true)
      return
    }
    // 无冲突直接报名
    setLoading("signup")
    const res = doSignUp(volunteer.id, act.id)
    if (res.ok) toast.success(res.msg)
    else toast.error(res.msg)
    setLoading("")
  }

  const handleConflictConfirm = () => {
    setConflictDialogOpen(false)
    setLoading("signup")
    const res = doSignUp(volunteer!.id, act.id)
    if (res.ok) toast.success(res.msg)
    else toast.error(res.msg)
    setLoading("")
  }

  const handleCancelSignUp = () => {
    if (!mySignUp) return
    setLoading("cancel")
    const res = doCancelSignUp(mySignUp.id)
    if (res.ok) toast.success(res.msg)
    else toast.error(res.msg)
    setLoading("")
  }

  const handleCheckIn = async () => {
    if (!activeDaily) return
    toast.info("签到需要获取您的位置信息以验证在活动范围内")
    try {
      setLoading("checkin")
      const msg = await doCheckIn(activeDaily.id)
      toast.success(msg)
    } catch (err: any) {
      toast.error(err.message || "签到失败")
    } finally {
      setLoading("")
    }
  }

  const handleCheckOut = async () => {
    if (!activeDaily) return
    try {
      setLoading("checkout")
      const msg = await doCheckOut(activeDaily.id)
      toast.success(msg)
    } catch (err: any) {
      toast.error(err.message || "签退失败")
    } finally {
      setLoading("")
    }
  }

  // ── 时间模式文案 ──
  const timeDisplay =
    act.timeMode === "multi"
      ? `${fmtDate(act.startTime)} ~ ${fmtDate(act.endTime)}，每天 ${act.dailyStartTime}~${act.dailyEndTime}`
      : `${fmtTime(act.startTime)} ~ ${fmtHM(act.endTime)}`

  // ── Render bottom action ──
  const renderAction = () => {
    if (!volunteer) {
      return (
        <button
          onClick={() => navigate("/c/volunteer")}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-[#1D4ED8] text-white text-[14px] font-medium shadow-[0_4px_14px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-transform"
        >
          先完成志愿者认证
        </button>
      )
    }

    if (!mySignUp) {
      // 未报名时
      if (isCancelled)
        return <div className="text-center text-[13px] text-slate-400 py-3 bg-slate-50 rounded-2xl">活动已取消</div>
      if (full)
        return (
          <div className="text-center text-[13px] text-red-500 py-3 bg-red-50 rounded-2xl">
            名额已满（{count}/{act.maxParticipants}）
          </div>
        )
      if (deadlinePassed)
        return <div className="text-center text-[13px] text-slate-400 py-3 bg-slate-50 rounded-2xl">报名已截止</div>
      if (ended)
        return <div className="text-center text-[13px] text-slate-400 py-3 bg-slate-50 rounded-2xl">活动已结束</div>
      return (
        <button
          onClick={handleSignUp}
          disabled={loading === "signup"}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[14px] font-medium shadow-[0_4px_14px_rgba(16,185,129,0.25)] disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {loading === "signup" ? "处理中..." : "立即报名"}
        </button>
      )
    }

    // 已报名 - 活动被取消
    if (isCancelled) {
      return (
        <div className="text-center text-[13px] text-slate-400 py-3 bg-slate-50 rounded-2xl">活动已被管理员取消</div>
      )
    }

    if (!activeDaily) {
      // 所有天都已完成或异常
      const totalHours = myDailyRecords.reduce((sum, d) => sum + (d.serviceHours || 0), 0)
      const hasAbnormal = myDailyRecords.some((d) => d.status === "no_show" || d.status === "checkout_overdue")
      if (hasAbnormal) {
        return (
          <div className="text-center text-[13px] text-amber-600 py-3 bg-amber-50 rounded-2xl">
            有未处理记录，请联系管理员
          </div>
        )
      }
      return (
        <div className="text-center py-4 bg-emerald-50 rounded-2xl">
          <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
          <div className="text-[14px] font-medium text-emerald-700">已完成全部服务</div>
          {totalHours > 0 && <div className="text-[12px] text-emerald-600 mt-1">总服务时长 {totalHours} 小时</div>}
        </div>
      )
    }

    const { status, isLate, lateMinutes } = activeDaily
    const dayLabel = act.timeMode === "multi" ? `${fmtDate(activeDaily.dayStartTime)} ` : ""

    if (status === "checked_in") {
      const dayEnded = now > new Date(activeDaily.dayEndTime)
      if (dayEnded)
        return (
          <div className="text-center text-[13px] text-amber-600 py-3 bg-amber-50 rounded-2xl">
            {dayLabel}活动已结束，请及时签退
          </div>
        )
      return (
        <div className="space-y-2">
          {isLate && lateMinutes && (
            <div className="flex items-center justify-center gap-1.5 text-[12px] text-red-500">
              <Clock4 size={13} />
              <span>延时 {lateMinutes} 分钟</span>
            </div>
          )}
          <button
            onClick={handleCheckOut}
            disabled={loading === "checkout"}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[14px] font-medium shadow-[0_4px_14px_rgba(245,158,11,0.25)] disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {loading === "checkout" ? "处理中..." : `${dayLabel}签退`}
          </button>
        </div>
      )
    }

    if (status === "pending") {
      const start = new Date(activeDaily.dayStartTime)
      const end = new Date(activeDaily.dayEndTime)
      const windowOpen = now >= new Date(start.getTime() - 30 * 60000)
      if (now > end)
        return (
          <div className="text-center text-[13px] text-slate-400 py-3 bg-slate-50 rounded-2xl">
            {dayLabel}活动已结束（未签到）
          </div>
        )
      if (!windowOpen) {
        // 等待活动开始 + 可取消报名
        return (
          <div className="space-y-2">
            <div className="text-center text-[13px] text-primary py-3 bg-blue-50 rounded-2xl">
              {dayLabel}等待活动开始
            </div>
            <button
              onClick={handleCancelSignUp}
              disabled={loading === "cancel"}
              className="w-full h-10 rounded-2xl border border-slate-200 text-slate-400 text-[12px] font-medium active:scale-[0.98] transition-transform hover:border-red-200 hover:text-red-400"
            >
              {loading === "cancel" ? "处理中..." : "取消报名"}
            </button>
          </div>
        )
      }
      return (
        <button
          onClick={handleCheckIn}
          disabled={loading === "checkin"}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-[#1D4ED8] text-white text-[14px] font-medium shadow-[0_4px_14px_rgba(37,99,235,0.25)] disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {loading === "checkin" ? "处理中..." : `${dayLabel}签到`}
        </button>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-surface-page pb-6">
      <PageHeader title="活动详情" back={() => navigate("/c/volunteer/activities")} />

      <div className="px-4 py-5 space-y-4">
        {/* ── Hero card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl bg-white overflow-hidden shadow-[0_4px_20px_rgba(139,111,92,0.08)]"
        >
          {act.images.length > 0 && <ImageCarousel images={act.images} />}

          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-md shadow-amber-200">
                <Heart size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[17px] font-semibold text-slate-800 truncate">{act.title}</h2>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                    ended
                      ? "bg-slate-100 text-slate-500"
                      : started
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {ended ? "已结束" : started ? "进行中" : "即将开始"}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-[12px]">
              <div className="flex items-center gap-2.5 text-slate-600">
                <MapPin size={14} className="text-slate-300 shrink-0" />
                <span>{act.location}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Calendar size={14} className="text-slate-300 shrink-0" />
                <span>{timeDisplay}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Users size={14} className="text-slate-300 shrink-0" />
                <span>报名截止 {fmtTime(act.signUpDeadline)}</span>
              </div>
              {act.enrollStartTime && enrollNotStarted && (
                <div className="flex items-center gap-2.5 text-amber-600">
                  <Calendar size={14} className="text-amber-300 shrink-0" />
                  <span>报名开始时间：{fmtTime(act.enrollStartTime)}</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-slate-400">报名进度</span>
                <span className="font-medium" style={{ color: full ? "#DC2626" : "#059669" }}>
                  {count}/{act.maxParticipants} 人
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: full ? "#DC2626" : progress > 0.8 ? "#F59E0B" : "#059669" }}
                />
              </div>
            </div>
          </div>

          {act.description && (
            <div className="px-5 pb-5">
              <div className="rounded-2xl bg-[#FAFAF8] px-4 py-3">
                <p className="text-[12px] text-slate-500 leading-relaxed">{act.description}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── 签到列表 ── */}
        {mySignUp && myDailyRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl bg-white shadow-[0_2px_12px_rgba(139,111,92,0.06)] overflow-hidden"
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                <Calendar size={15} className="text-primary" />
                签到记录
              </div>
              {(() => {
                const done = myDailyRecords.filter((d) => d.status === "checked_out").length
                const total = myDailyRecords.length
                return (
                  <span className="text-[11px] text-slate-400">
                    {done}/{total} 完成
                  </span>
                )
              })()}
            </div>

            {/* 列表行 */}
            <div className="divide-y divide-slate-50">
              {myDailyRecords.map((dr) => {
                const isToday = dr.date === now.toISOString().slice(0, 10)
                const isPast = now > new Date(dr.dayEndTime)
                const isActive = dr.id === activeDaily?.id
                return (
                  <div
                    key={dr.id}
                    className={`px-5 py-3.5 flex items-center gap-3 relative ${
                      dr.status === "checked_in"
                        ? "bg-emerald-50/40"
                        : dr.status === "no_show"
                          ? "bg-amber-50/30"
                          : dr.status === "checkout_overdue"
                            ? "bg-amber-50/30"
                            : isToday && dr.status === "pending"
                              ? "bg-blue-50/30"
                              : ""
                    } ${isActive ? "ring-2 ring-primary/20 rounded-none" : ""}`}
                  >
                    {/* 活跃行左侧指示条 */}
                    {isActive && <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />}
                    {/* 日期 + 时段 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium text-slate-800">
                          {act.timeMode === "multi" ? fmtDate(dr.dayStartTime) : "活动当天"}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            今天
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {fmtHM(dr.dayStartTime)} ~ {fmtHM(dr.dayEndTime)}
                      </div>
                    </div>

                    {/* 签到签退时间 */}
                    <div className="text-[11px] text-slate-500 text-right min-w-[80px]">
                      {dr.checkInTime ? (
                        <div>
                          签到 {fmtHM(dr.checkInTime)}
                          {dr.isLate && dr.lateMinutes && (
                            <span className="ml-1 text-amber-600">延时{dr.lateMinutes}min</span>
                          )}
                        </div>
                      ) : null}
                      {dr.checkOutTime ? <div>签退 {fmtHM(dr.checkOutTime)}</div> : null}
                      {dr.serviceHours != null && dr.serviceHours > 0 && (
                        <div className="text-emerald-600 font-medium">{dr.serviceHours}h</div>
                      )}
                    </div>

                    {/* 状态标签 */}
                    <StatusBadge status={dr.status} />
                  </div>
                )
              })}
            </div>

            {/* 总时长 */}
            {(() => {
              const totalHours = myDailyRecords.reduce((sum, d) => sum + (d.serviceHours || 0), 0)
              return totalHours > 0 ? (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">总服务时长</span>
                  <span className="text-[14px] font-semibold text-emerald-600">{totalHours}h</span>
                </div>
              ) : null
            })()}
          </motion.div>
        )}

        {/* ── Action button ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {renderAction()}
        </motion.div>

        <button
          onClick={() => navigate("/c/volunteer/activities")}
          className="flex items-center gap-1.5 text-[12px] text-slate-400 mx-auto hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={14} /> 返回活动列表
        </button>
      </div>

      {/* ── Conflict confirm dialog ── */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              活动时间重叠
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-[13px] text-slate-600 leading-relaxed">您已报名以下活动，时间与本活动重叠：</p>
            <ul className="mt-2 space-y-1">
              {conflictTitles.map((t, i) => (
                <li
                  key={i}
                  className="text-[13px] text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 flex items-center gap-2"
                >
                  <AlertTriangle size={12} />
                  {t}
                </li>
              ))}
            </ul>
            <p className="text-[12px] text-slate-400 mt-3">确认报名后请自行协调时间安排。</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setConflictDialogOpen(false)}>
              再想想
            </Button>
            <Button size="sm" className="rounded-lg bg-primary hover:bg-[#1D4ED8]" onClick={handleConflictConfirm}>
              确认报名
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
