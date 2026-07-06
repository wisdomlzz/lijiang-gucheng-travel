import { useState, useMemo } from "react"
import { useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { useNaxiCheckinStore } from "../../store"
import { usePointsStore } from "../../../points/store"
import { useAuthStore } from "@/platform/auth"
import { Camera, Flame, MapPin, Award } from "lucide-react"
import { toast } from "sonner"

const PLACEHOLDER_PHOTO = "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=70"

export function NaxiCheckInPage() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id ?? "u_c_001")
  const allCheckins = useNaxiCheckinStore((s) => s.checkins)
  const getStreak = useNaxiCheckinStore((s) => s.getStreak)
  const getTotalDays = useNaxiCheckinStore((s) => s.getTotalDays)
  const canCheckinToday = useNaxiCheckinStore((s) => s.canCheckinToday)
  const addCheckin = useNaxiCheckinStore((s) => s.addCheckin)
  const transact = usePointsStore((s) => s.transact)

  const checkins = useMemo(() => allCheckins.filter((c) => c.userId === userId), [allCheckins, userId])
  const streak = useMemo(() => getStreak(userId), [allCheckins, userId, getStreak])
  const totalDays = useMemo(() => getTotalDays(userId), [allCheckins, userId, getTotalDays])
  const canToday = useMemo(() => canCheckinToday(userId), [allCheckins, userId, canCheckinToday])

  const [photo, setPhoto] = useState(PLACEHOLDER_PHOTO)

  const handleCheckin = async () => {
    const result = await addCheckin({ userId, photo, location: "古城内（GPS 定位）" })
    if (!result.ok) {
      toast.error(result.msg)
      return
    }
    // 连续 7 天达成 → 触发积分奖励（跨域联动）
    if (result.streakBonus) {
      transact(userId, "naxi_streak")
      toast.success("🎉 连续打卡 7 天，获得 50 积分奖励！")
    } else {
      toast.success(result.msg)
    }
    navigate("/c/points")
  }

  // 连续天数进度（7 天一轮）
  const streakInCycle = streak % 7 === 0 && streak > 0 ? 7 : streak % 7

  return (
    <div className="min-h-full bg-surface-page pb-6">
      <PageHeader title="今天我想做纳西人" back="/c/profile" />

      {/* 打卡进度卡片 */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] opacity-90">已连续打卡</p>
              <p className="text-3xl font-bold mt-1">
                {streak} <span className="text-[14px] font-normal opacity-90">天</span>
              </p>
            </div>
            <Flame size={40} className="opacity-80" />
          </div>
          {/* 7 天进度 */}
          <div className="flex gap-1.5 mt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full ${i < streakInCycle ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
          <p className="text-[11px] opacity-80 mt-2">连续 7 天可获得 50 积分奖励 · 累计已打卡 {totalDays} 天</p>
        </div>
      </div>

      {/* 拍照打卡 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4">
          <p className="text-[14px] font-semibold text-text-heading mb-3">穿纳西族服饰拍照打卡</p>
          <div
            className="relative rounded-xl overflow-hidden aspect-[4/3] bg-gray-100"
            onClick={() => setPhoto(PLACEHOLDER_PHOTO + "?t=" + Date.now())}
          >
            <ImageWithFallback src={photo} alt="打卡照片" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1">
              <Camera size={12} /> 点击拍照
            </div>
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
              {new Date().toLocaleString("zh-CN")}
            </div>
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
              <MapPin size={10} /> 古城内
            </div>
          </div>
          <button
            onClick={handleCheckin}
            disabled={!canToday}
            className={`w-full mt-3 h-11 rounded-xl font-medium text-[14px] transition ${
              canToday
                ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white active:scale-95"
                : "bg-gray-100 text-text-tertiary"
            }`}
          >
            {canToday ? "提交今日打卡" : "今日已打卡"}
          </button>
        </div>
      </div>

      {/* 打卡记录 */}
      <div className="px-4 mt-4">
        <p className="text-[14px] font-semibold text-text-heading mb-2 flex items-center gap-1.5">
          <Award size={16} className="text-amber-500" /> 我的打卡记录
        </p>
        <div className="grid grid-cols-3 gap-2">
          {checkins.map((c) => (
            <div key={c.id} className="relative aspect-square rounded-lg overflow-hidden">
              <ImageWithFallback src={c.photo} alt={c.createdAt} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 truncate">
                {c.createdAt.slice(5, 10)}
              </div>
            </div>
          ))}
        </div>
        {checkins.length === 0 && <p className="text-center text-[12px] text-text-tertiary py-8">还没有打卡记录</p>}
      </div>
    </div>
  )
}
