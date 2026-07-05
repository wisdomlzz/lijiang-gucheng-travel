import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { ChevronLeft, Navigation, Clock, MapPin } from "lucide-react"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { toast } from "sonner"
import { useContentGuideStore } from "@/features/content/store/guide-store"

export function RoutePreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const guides = useContentGuideStore((s) => s.guides)
  const route = guides.find((g) => g.id === id)
  const [activeIdx, setActiveIdx] = useState(0)

  if (!route) {
    return (
      <div className="min-h-screen bg-surface-page">
        <div className="flex items-center h-[52px] px-3 bg-white">
          <button onClick={() => navigate(`/c/routes/${id}`)} className="w-9 h-9 flex items-center justify-center">
            <ChevronLeft size={22} className="text-text-body" />
          </button>
          <h1 className="flex-1 text-center text-[17px] text-text-body">路线详情</h1>
          <div className="w-9" />
        </div>
        <p className="text-center text-text-tertiary text-[14px] pt-20">路线不存在</p>
      </div>
    )
  }

  const activeSpot = route.spots[activeIdx]

  return (
    <div className="fixed inset-0 bg-[#E8F0E4] flex flex-col">
      {/* Header */}
      <header className="relative z-10 bg-gradient-to-b from-surface-page to-[#FFF4E0]/0">
        <div className="flex items-center h-[52px] px-3">
          <button
            onClick={() => navigate(`/c/routes/${id}`)}
            className="w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center active:opacity-80 shadow-sm"
          >
            <ChevronLeft size={22} className="text-text-body" />
          </button>
          <h1 className="flex-1 text-center text-[17px] text-text-body">路线详情</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map background */}
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=70"
          alt="map"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#F3F1E8]/65" />

        {/* Route path (SVG) */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <polyline
            points={route.spots.map((s) => `${parseFloat(s.left)},${parseFloat(s.top)}`).join(" ")}
            fill="none"
            stroke="url(#pathGrad)"
            strokeWidth="0.8"
            strokeDasharray="1.5 1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Spot markers */}
        {route.spots.map((spot, idx) => {
          const isActive = idx === activeIdx
          const isPast = idx < activeIdx
          return (
            <button
              key={spot.id}
              onClick={() => setActiveIdx(idx)}
              className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center"
              style={{ top: spot.top, left: spot.left }}
            >
              <div
                className={`px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap mb-0.5 shadow ${
                  isActive
                    ? "bg-primary text-white"
                    : isPast
                      ? "bg-white text-text-tertiary"
                      : "bg-white/95 text-text-heading"
                }`}
              >
                {idx + 1}. {spot.name}
              </div>
              <div
                className={`rounded-full border-2 border-white flex items-center justify-center shadow-[0_3px_8px_rgba(60,120,200,0.3)] transition-transform ${
                  isActive
                    ? "w-8 h-8 bg-primary scale-110"
                    : isPast
                      ? "w-5 h-5 bg-[#BBB]"
                      : "w-6 h-6 bg-gradient-to-br from-primary to-primary"
                }`}
              >
                <MapPin size={isActive ? 16 : 12} fill="white" stroke="white" />
              </div>
            </button>
          )
        })}

        {/* Recenter button */}
        <button
          onClick={() => toast.info("重新定位")}
          className="absolute bottom-[172px] right-3 w-10 h-10 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center justify-center active:scale-95 transition-transform"
        >
          <Navigation size={18} className="text-primary" />
        </button>
      </div>

      {/* Bottom control card */}
      <div className="relative z-10 bg-white rounded-t-[20px] shadow-[0_-6px_20px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center pt-2">
          <span className="w-10 h-1 rounded-full bg-primary-100" />
        </div>

        <div className="px-4 pt-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[15px] text-text-body truncate">{route.name}</p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-text-tertiary">
                <span className="flex items-center gap-0.5">
                  <Clock size={11} /> {route.duration}
                </span>
                <span className="flex items-center gap-0.5">
                  <MapPin size={11} /> {route.stops}个景点
                </span>
                <span>{route.distance}</span>
              </div>
            </div>
            <span className="flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-[#FFF4E0] text-primary">
              第 {activeIdx + 1}/{route.spots.length} 站
            </span>
          </div>

          {/* Active spot */}
          <div className="mt-3 bg-[#FFFBF2] rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary text-white flex items-center justify-center flex-shrink-0">
              <MapPin size={18} fill="white" stroke="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-text-body truncate">当前：{activeSpot.name}</p>
              <p className="text-[11px] text-text-tertiary mt-0.5 truncate">{activeSpot.desc}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
              disabled={activeIdx === 0}
              className="flex-1 h-10 rounded-full border border-primary-100 text-[13px] text-text-secondary disabled:opacity-40"
            >
              上一站
            </button>
            <button
              onClick={() => {
                if (activeIdx === route.spots.length - 1) {
                  toast.success("已游览完所有景点")
                } else {
                  setActiveIdx(activeIdx + 1)
                }
              }}
              className="flex-1 h-10 rounded-full border border-primary-100 text-[13px] text-text-secondary"
            >
              {activeIdx === route.spots.length - 1 ? "完成游览" : "下一站"}
            </button>
          </div>

          <button
            onClick={() => toast.success(`已拉起第三方地图导航至「${activeSpot.name}」`)}
            className="w-full h-11 mt-2.5 rounded-full bg-gradient-to-r from-primary to-primary text-white text-[14px] shadow-[0_4px_12px_rgba(60,120,200,0.2)] active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5"
          >
            <Navigation size={16} />
            导航
          </button>

          <div className="mt-3 h-1 rounded-full bg-surface-page overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary transition-all"
              style={{ width: `${((activeIdx + 1) / route.spots.length) * 100}%` }}
            />
          </div>
          <div className="h-3" />
        </div>
      </div>
    </div>
  )
}
