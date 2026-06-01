import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import { PageHeader } from "./shop/PageHeader"
import { useVolunteerStore } from "../../shared/stores/volunteer-store"
import { useAuthStore } from "../../shared/stores/auth-store"
import { Heart, MapPin, Clock, Users, ArrowLeft, CheckCircle2, LogOut, Calendar, Shield } from "lucide-react"
import { toast } from "sonner"
import { motion } from "motion/react"

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
      <div className="min-h-screen bg-surface-page pb-6">
        <PageHeader title="活动详情" back={() => navigate("/c/volunteer/activities")} />
        <div className="px-4 py-14 text-center">
          <p className="text-[13px] text-slate-400">活动不存在</p>
        </div>
      </div>
    )
  }

  const count = getSignUpCount(act.id)
  const full = count >= act.maxParticipants
  const deadlinePassed = now > new Date(act.signUpDeadline)
  const started = now >= new Date(act.startTime)
  const ended = now > new Date(act.endTime)
  const progress = act.maxParticipants > 0 ? (count / act.maxParticipants) * 100 : 100

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
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
    setLoading("")
  }

  const handleCheckOut = () => {
    if (!mySignUp) return
    setLoading("checkout")
    const res = doCheckOut(mySignUp.id)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
    setLoading("")
  }

  const fmtTime = (d: string) => {
    const date = new Date(d)
    const m = date.getMonth() + 1
    const day = date.getDate()
    const h = String(date.getHours()).padStart(2, "0")
    const min = String(date.getMinutes()).padStart(2, "0")
    return `${m}月${day}日 ${h}:${min}`
  }

  const renderButton = () => {
    if (!volunteer) {
      return (
        <button onClick={() => navigate("/c/volunteer")}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white text-[14px] font-medium shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform">
          先完成志愿者注册
        </button>
      )
    }

    if (!mySignUp) {
      if (full) return <div className="text-center text-[13px] text-red-500 py-3 bg-red-50 rounded-2xl">名额已满（{count}/{act.maxParticipants}）</div>
      if (deadlinePassed) return <div className="text-center text-[13px] text-slate-400 py-3 bg-slate-50 rounded-2xl">报名已截止</div>
      if (ended) return <div className="text-center text-[13px] text-slate-400 py-3 bg-slate-50 rounded-2xl">活动已结束</div>
      return (
        <button onClick={handleSignUp} disabled={loading === "signup"}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#059669] to-[#047857] text-white text-[14px] font-medium shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-[0.98] transition-transform">
          {loading === "signup" ? "处理中..." : "立即报名"}
        </button>
      )
    }

    const { status } = mySignUp

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
        <button onClick={handleCheckOut} disabled={loading === "checkout"}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white text-[14px] font-medium shadow-lg shadow-amber-200 disabled:opacity-50 active:scale-[0.98] transition-transform">
          {loading === "checkout" ? "处理中..." : "签退"}
        </button>
      )
    }

    if (status === "signed_up") {
      if (ended) return <div className="text-center text-[13px] text-slate-400 py-3 bg-slate-50 rounded-2xl">活动已结束（未签到）</div>
      if (!started) return <div className="text-center text-[13px] text-blue-600 py-3 bg-blue-50 rounded-2xl">等待活动开始</div>
      return (
        <button onClick={handleCheckIn} disabled={loading === "checkin"}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white text-[14px] font-medium shadow-lg shadow-blue-200 disabled:opacity-50 active:scale-[0.98] transition-transform">
          {loading === "checkin" ? "处理中..." : "签到"}
        </button>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-surface-page pb-6">
      <PageHeader title="活动详情" back={() => navigate("/c/volunteer/activities")} />

      <div className="px-4 py-5 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl bg-white overflow-hidden shadow-[0_4px_14px_rgba(60,120,200,0.08)]"
        >
          {/* Header banner */}
          <div className="relative px-5 pt-5 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-11 rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] flex items-center justify-center shadow-md shadow-emerald-200">
                <Heart size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-semibold text-slate-800 truncate">{act.title}</h2>
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
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <span>{act.location}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <span>{fmtTime(act.startTime)} ~ {fmtTime(act.endTime)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <span>报名截止 {fmtTime(act.signUpDeadline)}</span>
              </div>
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
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: full ? "#DC2626" : progress > 80 ? "#F59E0B" : "#059669" }}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          {act.description && (
            <div className="px-5 pb-5">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[12px] text-slate-500 leading-relaxed">{act.description}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* My sign-up status */}
        {mySignUp && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700 mb-3">
              <Shield size={14} className="text-[#2563EB]" />
              我的参与状态
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <div>
                <div className="text-slate-400">报名时间</div>
                <div className="mt-0.5 font-medium text-slate-600">{mySignUp.signUpTime}</div>
              </div>
              {mySignUp.checkInTime && (
                <div>
                  <div className="text-slate-400">签到时间</div>
                  <div className="mt-0.5 font-medium text-slate-600">{mySignUp.checkInTime}</div>
                </div>
              )}
              {mySignUp.checkOutTime && (
                <div>
                  <div className="text-slate-400">签退时间</div>
                  <div className="mt-0.5 font-medium text-slate-600">{mySignUp.checkOutTime}</div>
                </div>
              )}
              {mySignUp.serviceHours != null && mySignUp.serviceHours > 0 && (
                <div>
                  <div className="text-slate-400">服务时长</div>
                  <div className="mt-0.5 font-medium text-emerald-600">{mySignUp.serviceHours}h</div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Action button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {renderButton()}
        </motion.div>

        <button onClick={() => navigate("/c/volunteer/activities")}
          className="flex items-center gap-1.5 text-[12px] text-slate-400 mx-auto hover:text-slate-600 transition-colors">
          <ArrowLeft size={14} /> 返回活动列表
        </button>
      </div>
    </div>
  )
}
