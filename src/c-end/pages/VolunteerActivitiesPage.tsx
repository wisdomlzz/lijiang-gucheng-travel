import { useEffect, useMemo, useCallback, useState } from "react"
import { useNavigate } from "react-router"
import { Heart, MapPin, Clock, Users, ChevronRight, Sparkles, Calendar, ArrowRight } from "lucide-react"
import { PageHeader } from "./shop/PageHeader"
import { useVolunteerStore } from "../../shared/stores/volunteer-store"
import { useAuthStore } from "../../shared/stores/auth-store"
import { useSearch } from "../../shared/hooks/useSearch"
import { useLoadMore } from "../../shared/hooks/useLoadMore"
import { motion } from "motion/react"

const STATUS_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  signed_up: { label: "已报名", bg: "#DBEAFE", fg: "#2563EB" },
  checked_in: { label: "已签到", bg: "#D1FAE5", fg: "#059669" },
  checked_out: { label: "已参与", bg: "#F1F5F9", fg: "#64748B" },
}

function StatusChip({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, bg: "#F1F5F9", fg: "#64748B" }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  )
}

export function VolunteerActivitiesPage() {
  const navigate = useNavigate()
  const activities = useVolunteerStore((s) => s.activities)
  const signUps = useVolunteerStore((s) => s.signUps)
  const getSignUpCount = useVolunteerStore((s) => s.getSignUpCount)
  const getByUserId = useVolunteerStore((s) => s.getByUserId)
  const user = useAuthStore((s) => s.user)
  const [pageSize, setPageSize] = useState(10)

  const volunteer = user ? getByUserId(user.id) : undefined

  useEffect(() => {
    if (!volunteer) navigate("/c/volunteer", { replace: true })
  }, [volunteer, navigate])

  const now = new Date()
  const published = useMemo(() => activities.filter((a) => a.status === "published"), [activities])

  const signedUpActs = useMemo(() => {
    if (!volunteer) return []
    const my = signUps.filter((s) => s.volunteerId === volunteer.id)
    return my.map((su) => {
      const act = activities.find((a) => a.id === su.activityId)
      if (!act) return null
      return { ...act, signUp: su }
    }).filter(Boolean) as (typeof published[0] & { signUp: (typeof signUps)[0] })[]
  }, [volunteer, signUps, activities])

  const publishedSearchFn = useCallback(
    (act: (typeof published)[0], q: string) =>
      act.title.includes(q) || act.description.includes(q) || act.location.includes(q),
    [],
  )
  const { query, setQuery, filtered: searchedPublished } = useSearch(published, publishedSearchFn)
  const { visible, hasMore, loadMore, total } = useLoadMore(searchedPublished, 10)

  const getActivityTimeLabel = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const isSameDay = s.toDateString() === e.toDateString()
    const startMonth = s.getMonth() + 1
    const startDay = s.getDate()
    const startHour = String(s.getHours()).padStart(2, "0")
    const startMin = String(s.getMinutes()).padStart(2, "0")
    const endHour = String(e.getHours()).padStart(2, "0")
    const endMin = String(e.getMinutes()).padStart(2, "0")
    if (isSameDay) return `${startMonth}月${startDay}日 ${startHour}:${startMin} - ${endHour}:${endMin}`
    return `${startMonth}月${startDay}日 ${startHour}:${startMin} - ${startMonth}月${e.getDate()}日 ${endHour}:${endMin}`
  }

  return (
    <div className="min-h-screen bg-surface-page pb-6">
      <PageHeader title="志愿活动" back="/c/home" />

      <div className="px-4 py-5">

        {/* ── My Activities ── */}
        {signedUpActs.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-1.5 rounded-full bg-[#059669]" />
              <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">我的活动</h3>
            </div>
            <div className="space-y-2.5">
              {signedUpActs.map((item, i) => {
                const started = now >= new Date(item.startTime)
                const ended = now > new Date(item.endTime)
                const canCheckIn = started && !ended && item.signUp.status === "signed_up"
                const canCheckOut = started && !ended && item.signUp.status === "checked_in"
                const isActive = canCheckIn || canCheckOut
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => navigate(`/c/volunteer/activities/${item.id}`)}
                    className={`w-full text-left rounded-2xl p-4 transition-all ${
                      isActive
                        ? "bg-gradient-to-br from-[#059669] to-[#047857] text-white shadow-lg shadow-emerald-200"
                        : "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`text-[15px] font-medium ${isActive ? "text-white" : "text-slate-800"}`}>{item.title}</h4>
                      <StatusChip status={item.signUp.status} />
                    </div>
                    <div className={`flex items-center gap-3 text-[11px] ${isActive ? "text-white/80" : "text-slate-400"}`}>
                      <span className="flex items-center gap-1"><MapPin size={11} />{item.location}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} />{getActivityTimeLabel(item.startTime, item.endTime)}</span>
                    </div>
                    {isActive && (
                      <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-white">
                        {canCheckIn ? "前往签到" : "前往签退"}
                        <ArrowRight size={14} />
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Available Activities ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="size-1.5 rounded-full bg-[#2563EB]" />
            <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">可报名活动</h3>
          </div>

          <div className="relative mb-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索活动名称..."
              className="w-full h-9 pl-3 pr-3 rounded-xl border border-slate-150 bg-white text-[13px] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {total === 0 ? (
            <div className="text-center py-14">
              <Sparkles className="size-8 mx-auto mb-3 text-slate-200" />
              <p className="text-[13px] text-slate-300">暂无可报名活动</p>
            </div>
          ) : (
            <div className="space-y-2.5 mt-2">
              {visible.map((act, i) => {
                const count = getSignUpCount(act.id)
                const full = count >= act.maxParticipants
                const mySignUp = volunteer ? signUps.find((s) => s.volunteerId === volunteer.id && s.activityId === act.id) : undefined
                const deadlinePassed = now > new Date(act.signUpDeadline)
                const progress = act.maxParticipants > 0 ? (count / act.maxParticipants) * 100 : 100
                return (
                  <motion.button
                    key={act.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/c/volunteer/activities/${act.id}`)}
                    className="w-full text-left bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow"
                  >
                    <h4 className="text-[15px] font-medium text-slate-800 mb-1.5">{act.title}</h4>
                    <p className="text-[12px] text-slate-400 leading-relaxed line-clamp-2 mb-3">{act.description}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
                      <span className="inline-flex items-center gap-1"><MapPin size={11} />{act.location}</span>
                      <span className="inline-flex items-center gap-1"><Calendar size={11} />{getActivityTimeLabel(act.startTime, act.endTime)}</span>
                    </div>

                    {/* Capacity bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-slate-400">报名进度</span>
                        <span className="font-medium" style={{ color: full ? "#DC2626" : "#059669" }}>{count}/{act.maxParticipants}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            background: full ? "#DC2626" : progress > 80 ? "#F59E0B" : "#059669",
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {mySignUp ? (
                        <StatusChip status={mySignUp.status} />
                      ) : full ? (
                        <span className="text-[11px] text-red-500 font-medium">名额已满</span>
                      ) : deadlinePassed ? (
                        <span className="text-[11px] text-slate-400">报名已截止</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#059669]">
                          <Heart size={11} className="fill-[#059669]" />
                          立即报名
                        </span>
                      )}
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </motion.button>
                )
              })}

              {hasMore && (
                <button onClick={loadMore} className="w-full py-3 text-[13px] text-[#059669] font-medium">
                  加载更多
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
