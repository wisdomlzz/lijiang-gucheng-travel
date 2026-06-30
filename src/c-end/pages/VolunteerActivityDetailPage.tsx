import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import { PageHeader } from "../components/PageHeader"
import { useVolunteerStore } from "../../shared/services/volunteer"
import { useAuthStore } from "../../shared/stores/auth-store"
import { Heart, MapPin, ArrowLeft, CheckCircle2, Calendar, Shield, AlertTriangle, AlertCircle, Clock4, Users, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"

const STATUS_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  signed_up:        { label: "已报名",   bg: "#DBEAFE", fg: "#2563EB" },
  checked_in:       { label: "已签到",   bg: "#D1FAE5", fg: "#059669" },
  checked_out:      { label: "已参与",   bg: "#F1F5F9", fg: "#64748B" },
  no_show:          { label: "未签到",   bg: "#FEE2E2", fg: "#DC2626" },
  checkout_overdue: { label: "未签退",   bg: "#FEF3C7", fg: "#D97706" },
}

function fmtTime(d: string) {
  const date = new Date(d)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
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
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/70 flex items-center justify-center backdrop-blur-sm shadow-sm hover:bg-white/90 transition-all">
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          <button onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/70 flex items-center justify-center backdrop-blur-sm shadow-sm hover:bg-white/90 transition-all">
            <ChevronRight size={16} className="text-slate-600" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`size-1.5 rounded-full transition-all ${i === idx ? "bg-white w-4" : "bg-white/50"}`} />
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
  const getSignUpCount = useVolunteerStore((s) => s.getSignUpCount)
  const doSignUp = useVolunteerStore((s) => s.signUp)
  const doCheckIn = useVolunteerStore((s) => s.checkIn)
  const doCheckOut = useVolunteerStore((s) => s.checkOut)
  const getByUserId = useVolunteerStore((s) => s.getByUserId)
  const user = useAuthStore((s) => s.user)

  const act = activities.find((a) => a.id === id)
  const [loading, setLoading] = useState("")
  const volunteer = user ? getByUserId(user.id) : undefined

  useEffect(() => {
    if (!volunteer) navigate("/c/volunteer", { replace: true })
  }, [volunteer, navigate])

  const now = new Date()

  const mySignUp = useMemo(() => {
    if (!volunteer || !act) return undefined
    return signUps.find((s) => s.volunteerId === volunteer.id && s.activityId === act.id)
  }, [volunteer, act, signUps])

  if (!act) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] pb-6">
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
  // 签到窗口：活动开始前30分钟即可签到
  const checkInWindowOpen = now >= new Date(new Date(act.startTime).getTime() - 30 * 60000)
  const progress = act.maxParticipants > 0 ? count / act.maxParticipants : 1

  // ── Handlers ──

  const handleSignUp = async () => {
    if (!volunteer) { toast.error("请先完成志愿者注册"); navigate("/c/volunteer"); return }
    setLoading("signup")
    const res = doSignUp(volunteer.id, act.id)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
    setLoading("")
  }

  const handleCheckIn = () => {
    if (!mySignUp) return
    setLoading("checkin")
    const res = doCheckIn(mySignUp.id)
    if (res.ok) {
      const lateMin = lateCount()
      toast.success(lateMin > 0 ? `签到成功（迟到 ${lateMin} 分钟）` : "签到成功，已验证您在活动地点附近")
    } else {
      toast.error(res.msg)
    }
    setLoading("")
  }

  const handleCheckOut = () => {
    if (!mySignUp) return
    setLoading("checkout")
    const res = doCheckOut(mySignUp.id)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
    setLoading("")
  }

  const lateCount = () => {
    if (!act) return 0
    return Math.round((now.getTime() - new Date(act.startTime).getTime()) / 60000)
  }

  // ── Render button ──

  const renderButton = () => {
    if (!volunteer) {
      return (
        <button onClick={() => navigate("/c/volunteer")}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-[#1D4ED8] text-white text-[14px] font-medium shadow-[0_4px_14px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-transform">
          先完成志愿者认证
        </button>
      )
    }

    if (!mySignUp) {
      if (full) return <div className="text-center text-[13px] text-red-500 py-3 bg-red-50 rounded-2xl">名额已满（{count}/{act.maxParticipants}）</div>
      if (deadlinePassed) return <div className="text-center text-[13px] text-slate-400 py-3 bg-slate-50 rounded-2xl">报名已截止</div>
      if (ended) return <div className="text-center text-[13px] text-slate-400 py-3 bg-slate-50 rounded-2xl">活动已结束</div>
      return (
        <button onClick={handleSignUp} disabled={loading === "signup"}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[14px] font-medium shadow-[0_4px_14px_rgba(16,185,129,0.25)] disabled:opacity-50 active:scale-[0.98] transition-transform">
          {loading === "signup" ? "处理中..." : "立即报名"}
        </button>
      )
    }

    const { status, isLate, lateMinutes } = mySignUp

    if (status === "no_show") {
      return (
        <div className="flex items-center gap-2.5 text-[13px] text-red-600 py-3 bg-red-50 rounded-2xl justify-center">
          <AlertCircle size={16} className="shrink-0" />
          <span>您未签到参加此活动</span>
        </div>
      )
    }

    if (status === "checkout_overdue") {
      return (
        <div className="flex items-center gap-2.5 text-[13px] text-amber-600 py-3 bg-amber-50 rounded-2xl justify-center">
          <AlertTriangle size={16} className="shrink-0" />
          <span>您未签退，请联系管理员处理</span>
        </div>
      )
    }

    if (status === "checked_out") {
      return (
        <div className="text-center py-4 bg-emerald-50 rounded-2xl">
          <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
          <div className="text-[14px] font-medium text-emerald-700">已完成服务</div>
          <div className="text-[12px] text-emerald-600 mt-1">服务时长 {mySignUp.serviceHours ?? 0} 小时</div>
        </div>
      )
    }

    if (status === "checked_in") {
      if (ended) {
        return <div className="text-center text-[13px] text-amber-600 py-3 bg-amber-50 rounded-2xl">活动已结束，请及时签退</div>
      }
      return (
        <div className="space-y-2">
          {isLate && lateMinutes && (
            <div className="flex items-center justify-center gap-1.5 text-[12px] text-red-500">
              <Clock4 size={13} />
              <span>迟到 {lateMinutes} 分钟</span>
            </div>
          )}
          <button onClick={handleCheckOut} disabled={loading === "checkout"}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[14px] font-medium shadow-[0_4px_14px_rgba(245,158,11,0.25)] disabled:opacity-50 active:scale-[0.98] transition-transform">
            {loading === "checkout" ? "处理中..." : "签退"}
          </button>
        </div>
      )
    }

    if (status === "signed_up") {
      if (ended) return <div className="text-center text-[13px] text-slate-400 py-3 bg-slate-50 rounded-2xl">活动已结束（未签到）</div>
      if (!started && !checkInWindowOpen) return <div className="text-center text-[13px] text-primary py-3 bg-blue-50 rounded-2xl">等待活动开始</div>
      return (
        <button onClick={handleCheckIn} disabled={loading === "checkin"}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-[#1D4ED8] text-white text-[14px] font-medium shadow-[0_4px_14px_rgba(37,99,235,0.25)] disabled:opacity-50 active:scale-[0.98] transition-transform">
          {loading === "checkin" ? "处理中..." : "签到"}
        </button>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] pb-6">
      <PageHeader title="活动详情" back={() => navigate("/c/volunteer/activities")} />

      <div className="px-4 py-5 space-y-4">
        {/* ── Hero card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl bg-white overflow-hidden shadow-[0_4px_20px_rgba(139,111,92,0.08)]"
        >
          {/* Image carousel */}
          {act.images.length > 0 && <ImageCarousel images={act.images} />}

          {/* Content */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-md shadow-amber-200">
                <Heart size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[17px] font-semibold text-slate-800 truncate">{act.title}</h2>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                  ended ? "bg-slate-100 text-slate-500" : started ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                }`}>
                  {ended ? "已结束" : started ? "进行中" : "即将开始"}
                </span>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-2.5 text-[12px]">
              <div className="flex items-center gap-2.5 text-slate-600">
                <MapPin size={14} className="text-slate-300 shrink-0" />
                <span>{act.location}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Calendar size={14} className="text-slate-300 shrink-0" />
                <span>{fmtTime(act.startTime)} ~ {fmtTime(act.endTime)}</span>
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

            {/* Capacity */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-slate-400">报名进度</span>
                <span className="font-medium" style={{ color: full ? "#DC2626" : "#059669" }}>{count}/{act.maxParticipants} 人</span>
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

          {/* Description */}
          {act.description && (
            <div className="px-5 pb-5">
              <div className="rounded-2xl bg-[#FAFAF8] px-4 py-3">
                <p className="text-[12px] text-slate-500 leading-relaxed">{act.description}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── My participation status ── */}
        {mySignUp && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl bg-white p-5 shadow-[0_2px_12px_rgba(139,111,92,0.06)]"
          >
            <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700 mb-4">
              <Shield size={14} className="text-primary" />
              我的参与状态
            </div>
            <div className="flex items-start gap-4 text-[11px] text-slate-500 flex-wrap">
              <div>
                <div className="text-slate-300">报名时间</div>
                <div className="mt-0.5 font-medium text-slate-600">{mySignUp.signUpTime}</div>
              </div>
              {mySignUp.checkInTime && (
                <div>
                  <div className="text-slate-300">签到时间</div>
                  <div className="mt-0.5 font-medium text-slate-600">
                    {mySignUp.checkInTime}
                    {mySignUp.isLate && mySignUp.lateMinutes && (
                      <span className="ml-1.5 text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">迟到 {mySignUp.lateMinutes}min</span>
                    )}
                  </div>
                </div>
              )}
              {mySignUp.checkOutTime && (
                <div>
                  <div className="text-slate-300">签退时间</div>
                  <div className="mt-0.5 font-medium text-slate-600">
                    {mySignUp.checkOutTime}
                    {mySignUp.isManual && (
                      <span className="ml-1.5 text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">管理员补录</span>
                    )}
                  </div>
                </div>
              )}
              {mySignUp.serviceHours != null && mySignUp.serviceHours > 0 && (
                <div>
                  <div className="text-slate-300">服务时长</div>
                  <div className="mt-0.5 font-medium text-emerald-600">{mySignUp.serviceHours}h</div>
                </div>
              )}
            </div>

            {/* Abnormal warning */}
            {(mySignUp.status === "no_show" || mySignUp.status === "checkout_overdue") && (
              <div className={`mt-3 flex items-center gap-1.5 text-[12px] px-3 py-2.5 rounded-2xl ${
                mySignUp.status === "no_show" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
              }`}>
                {mySignUp.status === "no_show" ? <AlertCircle size={14} /> : <AlertTriangle size={14} />}
                {mySignUp.status === "no_show" ? "您未签到参加此活动" : "您未签退，请联系管理员处理"}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Action button ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {renderButton()}
        </motion.div>

        {/* ── Back ── */}
        <button onClick={() => navigate("/c/volunteer/activities")}
          className="flex items-center gap-1.5 text-[12px] text-slate-400 mx-auto hover:text-slate-600 transition-colors">
          <ArrowLeft size={14} /> 返回活动列表
        </button>
      </div>
    </div>
  )
}
