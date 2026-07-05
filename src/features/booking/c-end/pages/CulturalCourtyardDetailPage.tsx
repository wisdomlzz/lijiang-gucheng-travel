import { useState, useRef, useEffect } from "react"
import {
  ChevronLeft,
  Share2,
  MapPin,
  Phone,
  Clock,
  Navigation,
  Volume2,
  Eye,
  X,
  Play,
  Pause,
  CheckCircle2,
  CalendarCheck,
} from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { useContentCourtyardStore } from "@/features/content/store/courtyard-store"
import { useContentGuideStore } from "@/features/content/store/guide-store"
import { useCheckinStore } from "@/features/checkin/store"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { toast } from "sonner"

const DISTANCE_THRESHOLD_METERS = 500

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

type CheckinStatus = "loading" | "success" | "outOfRange" | "error"

export function CulturalCourtyardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const courtyards = useContentCourtyardStore((s) => s.courtyards)
  const courtyard = courtyards.find((c) => c.id === id)

  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [checkinOpen, setCheckinOpen] = useState(false)
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null)
  const [checkinDistance, setCheckinDistance] = useState(0)

  const visitRecords = useCheckinStore((s) => s.checkins)
  const addCheckin = useCheckinStore((s) => s.addCheckin)
  const canCheckin = useCheckinStore((s) => s.canCheckin)

  const myVisits = visitRecords.filter((c) => c.userId === "user-1")
  const visitRecord = id ? myVisits.find((c) => c.courtyardId === id) : null
  const hasVisited = Boolean(visitRecord)

  // 每日打卡校验
  const checkinEligibility = id ? canCheckin("user-1", id) : { allowed: false }
  const alreadyCheckedInToday = !checkinEligibility.allowed

  useEffect(() => {
    if (!playerOpen) {
      setPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [playerOpen])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value)
    setCurrentTime(t)
    if (audioRef.current) {
      audioRef.current.currentTime = t
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const openPlayer = () => {
    if (!courtyard?.audioGuideUrl) return
    setPlayerOpen(true)
    setPlaying(true)
  }

  const triggerCheckin = () => {
    if (!courtyard || !id) return

    // 每日去重校验
    const eligibility = canCheckin("user-1", id)
    if (!eligibility.allowed) {
      toast.error(eligibility.reason || "今日已打卡")
      return
    }

    setCheckinOpen(true)
    setCheckinStatus("loading")

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const targetLat = courtyard.lat || 26.876
        const targetLng = courtyard.lng || 100.234
        const dist = getDistance(pos.coords.latitude, pos.coords.longitude, targetLat, targetLng)
        setCheckinDistance(Math.round(dist))

        if (dist > DISTANCE_THRESHOLD_METERS) {
          setCheckinStatus("outOfRange")
          return
        }

        addCheckin({
          courtyardId: courtyard.id,
          courtyardName: courtyard.name,
          userId: "user-1",
          userName: "游客",
          photo: courtyard.imageUrl,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          address: courtyard.location,
        })
        setCheckinStatus("success")
      },
      () => {
        setCheckinStatus("error")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const closeCheckinModal = () => {
    setCheckinOpen(false)
    setCheckinStatus(null)
    setCheckinDistance(0)
  }

  if (!courtyard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-page">
        <p className="text-text-tertiary text-[14px]">院落不存在</p>
        <button
          onClick={() => navigate("/c/courtyards")}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-white text-[13px]"
        >
          返回列表
        </button>
      </div>
    )
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: courtyard.name,
          text: courtyard.description,
          url: window.location.href,
        })
      } catch {
        // 用户取消分享
      }
    } else {
      toast.success("分享链接已复制")
    }
  }

  const handleNavigate = () => {
    const lat = courtyard.lat
    const lng = courtyard.lng
    if (lat && lng) {
      const urls = [
        `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(courtyard.name)}`,
        `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng}&title=${encodeURIComponent(courtyard.name)}&referer=myapp`,
        `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(courtyard.name)}`,
      ]
      window.open(urls[0], "_blank")
    } else {
      window.open(`https://maps.apple.com/?q=${encodeURIComponent(courtyard.location)}`, "_blank")
    }
  }

  const handleCall = () => {
    if (courtyard.phone) {
      window.open(`tel:${courtyard.phone}`, "_blank")
    }
  }

  const blocks = courtyard.contentBlocks || []

  return (
    <div className="min-h-screen bg-surface-page pb-6">
      {/* Cover */}
      <div className="relative h-56">
        <ImageWithFallback src={courtyard.imageUrl} alt={courtyard.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-surface-page" />

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-3">
          <button
            onClick={() => navigate("/c/courtyards")}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronLeft size={22} className="text-white" />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
          >
            <Share2 size={18} className="text-white" />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-[22px] font-semibold text-white">{courtyard.name}</h1>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mx-3 -mt-4 relative flex gap-2">
        <button
          onClick={() => navigate(`/c/courtyard/${courtyard.id}/vr`)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-transform"
        >
          <Eye size={18} className="text-primary" />
          <span className="text-[13px] text-text-body">VR游览</span>
        </button>
        <button
          onClick={() => navigate(`/c/courtyard/${courtyard.id}/booking`)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-transform"
        >
          <CalendarCheck size={18} className="text-emerald-500" />
          <span className="text-[13px] text-text-body">预约参观</span>
        </button>
        {courtyard.audioGuideUrl && (
          <button
            onClick={openPlayer}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-transform"
          >
            <Volume2 size={18} className="text-text-secondary" />
            <span className="text-[13px] text-text-body">语音导览</span>
          </button>
        )}
        <button
          onClick={handleNavigate}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-transform"
        >
          <Navigation size={18} />
          <span className="text-[13px]">到这去</span>
        </button>
      </div>

      {/* Info section */}
      <div className="mx-3 mt-4 bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
        <h3 className="text-[14px] text-text-body font-medium mb-3 flex items-center gap-1.5">
          <span className="w-1 h-3.5 bg-primary rounded-full" />
          基本信息
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-page flex items-center justify-center flex-shrink-0">
              <MapPin size={15} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] text-text-secondary">地址</p>
              <p className="text-[14px] text-text-body mt-0.5">{courtyard.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-page flex items-center justify-center flex-shrink-0">
              <Clock size={15} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] text-text-secondary">开放时间</p>
              <p className="text-[14px] text-text-body mt-0.5">{courtyard.hours}</p>
            </div>
          </div>
          {courtyard.phone && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-page flex items-center justify-center flex-shrink-0">
                <Phone size={15} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] text-text-secondary">联系电话</p>
                <p className="text-[14px] text-text-body font-mono mt-0.5">{courtyard.phone}</p>
              </div>
              <button onClick={handleCall} className="text-[13px] text-primary active:opacity-60">
                拨打
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 图文混排区块 */}
      {blocks.length > 0 && (
        <div className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
          <h3 className="text-[14px] text-text-body font-medium mb-3 flex items-center gap-1.5">
            <span className="w-1 h-3.5 bg-primary rounded-full" />
            详情
          </h3>
          <div className="space-y-4">
            {blocks.map((block) => (
              <div key={block.id}>
                {block.type === "text" && block.text && (
                  <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">{block.text}</p>
                )}
                {block.type === "image" && block.imageUrl && (
                  <div>
                    <img
                      src={block.imageUrl}
                      alt={block.imageCaption || "院落图片"}
                      referrerPolicy="no-referrer"
                      className="w-full rounded-lg cursor-pointer active:opacity-80"
                      onClick={() => setPreviewImage(block.imageUrl!)}
                    />
                    {block.imageCaption && (
                      <p className="text-[11px] text-text-tertiary mt-1 text-center">{block.imageCaption}</p>
                    )}
                  </div>
                )}
                {block.type === "video" && block.videoUrl && (
                  <div>
                    <video src={block.videoUrl} poster={block.videoCoverUrl} className="w-full rounded-lg" controls />
                    {block.videoCaption && (
                      <p className="text-[11px] text-text-tertiary mt-1 text-center">{block.videoCaption}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 打卡状态 */}
      <div className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(60,120,200,0.08)] border border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[14px] text-text-body font-medium flex items-center gap-1.5">
              <span className="w-1 h-3.5 bg-primary rounded-full" />
              院落打卡
            </p>
            <p className="text-[12px] text-text-tertiary mt-1.5 leading-relaxed">
              {alreadyCheckedInToday
                ? "今日已打卡，明天再来吧"
                : hasVisited
                  ? `已打卡 · ${new Date(visitRecord!.createdAt).toLocaleDateString("zh-CN")}，今日可再次打卡`
                  : "到达院落后，自动验证位置完成打卡。"}
            </p>
          </div>
          <div
            className={`px-2.5 py-1 rounded-full text-[11px] shrink-0 flex items-center gap-1 ${
              alreadyCheckedInToday
                ? "bg-blue-50 text-primary"
                : hasVisited
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
            }`}
          >
            {(hasVisited || alreadyCheckedInToday) && <CheckCircle2 size={12} />}
            {alreadyCheckedInToday ? "今日已打卡" : hasVisited ? "已打卡" : "未打卡"}
          </div>
        </div>

        {alreadyCheckedInToday ? (
          <div className="mt-4">
            <button
              disabled
              className="w-full h-12 rounded-full bg-slate-200 text-text-secondary text-[14px] font-medium cursor-not-allowed"
            >
              今日已打卡
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <button
              onClick={triggerCheckin}
              className="w-full h-12 rounded-full bg-primary text-white text-[14px] font-medium shadow-[0_4px_14px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-transform"
            >
              去打卡
            </button>
          </div>
        )}
      </div>

      {/* Full-screen image preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        >
          <img src={previewImage} alt="大图" className="max-w-full max-h-full object-contain p-4" />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-[max(env(safe-area-inset-top),16px)] right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Floating audio player */}
      {playerOpen && courtyard.audioGuideUrl && (
        <>
          <audio
            ref={audioRef}
            src={courtyard.audioGuideUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setPlaying(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center active:scale-95 transition-transform shrink-0"
              >
                {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-text-body font-medium truncate">{courtyard.name} · 语音导览</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-text-tertiary w-8 text-right">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1 appearance-none bg-gray-200 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="text-[10px] text-text-tertiary w-8">{formatTime(duration)}</span>
                </div>
              </div>
              <button
                onClick={() => setPlayerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60 shrink-0"
              >
                <X size={18} className="text-text-tertiary" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Checkin Modal */}
      {checkinOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-[280px] bg-white rounded-2xl flex flex-col items-center justify-center py-10 px-6">
            {checkinStatus === "loading" && (
              <>
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-[15px] font-medium text-text-heading">正在定位…</p>
                <p className="text-[12px] text-text-tertiary mt-1">请稍候</p>
              </>
            )}

            {checkinStatus === "success" && (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <p className="text-[15px] font-medium text-text-heading">打卡成功</p>
                <p className="text-[12px] text-text-tertiary mt-1">{new Date().toLocaleDateString("zh-CN")}</p>
                <button
                  onClick={closeCheckinModal}
                  className="mt-5 w-full h-10 rounded-full bg-primary text-white text-[14px]"
                >
                  知道了
                </button>
              </>
            )}

            {checkinStatus === "outOfRange" && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <X size={28} className="text-red-500" />
                </div>
                <p className="text-[15px] font-medium text-text-heading">超出打卡范围</p>
                <p className="text-[12px] text-text-tertiary mt-1">
                  当前位置距院落 {checkinDistance}m，需在 500m 范围内
                </p>
                <button
                  onClick={closeCheckinModal}
                  className="mt-5 w-full h-10 rounded-full bg-slate-200 text-text-body text-[14px]"
                >
                  我知道了
                </button>
              </>
            )}

            {checkinStatus === "error" && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <X size={28} className="text-red-500" />
                </div>
                <p className="text-[15px] font-medium text-text-heading">定位失败</p>
                <p className="text-[12px] text-text-tertiary mt-1 text-center">
                  无法获取位置
                  <br />
                  请开启定位权限
                </p>
                <button
                  onClick={closeCheckinModal}
                  className="mt-5 w-full h-10 rounded-full bg-slate-200 text-text-body text-[14px]"
                >
                  我知道了
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
