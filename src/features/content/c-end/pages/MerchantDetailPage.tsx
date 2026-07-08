import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, Share2, MapPin, Phone, Navigation, Shield, BadgeCheck, Award, ChevronRight } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { toast } from "sonner"
import { useContentMerchantStore } from "@/features/content/store/merchant-store"
import { useFlowWarningStore, LEVEL_META } from "@/features/flow-warning/store/flow-warning-store"

const qualificationBadges = [
  { icon: BadgeCheck, label: "实名认证", color: "#27AE60" },
  { icon: Shield, label: "诚信商户", color: "#3B82F6" },
  { icon: Award, label: "品质保证", color: "#3B82F6" },
]

function openMerchantNavigation(merchant: { name: string; lat?: number; lng?: number; address?: string }) {
  if (merchant.lat && merchant.lng) {
    window.open(
      `https://maps.apple.com/?ll=${merchant.lat},${merchant.lng}&q=${encodeURIComponent(merchant.name)}`,
      "_blank"
    )
  } else if (merchant.address) {
    window.open(
      `https://maps.apple.com/?q=${encodeURIComponent(`丽江古城 ${merchant.name} ${merchant.address}`)}`,
      "_blank"
    )
  } else {
    window.open("https://maps.apple.com/?q=丽江市古城区", "_blank")
  }
}

export function MerchantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const merchant = useContentMerchantStore((s) => s.merchants.find((m) => m.id === id))

  const flowAreas = useFlowWarningStore((s) => s.areas)
  const loadAreas = useFlowWarningStore((s) => s.loadAreas)

  const nearbyFlow = useMemo(() => {
    if (!merchant?.address) return null
    const matched = flowAreas.find((a) => (merchant.address || "").includes(a.name.replace("街", "")))
    if (matched) {
      const pct = Math.round((matched.current / matched.capacity) * 100)
      return { name: matched.name, pct, level: matched.level }
    }
    return null
  }, [merchant, flowAreas])

  useEffect(() => { loadAreas() }, [loadAreas])

  if (!merchant) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center px-6 text-center text-text-tertiary">
        未找到对应商户信息
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-page pb-[78px]">
      {/* Cover Image */}
      <div className="relative h-48">
        <ImageWithFallback src={merchant.cover} alt={merchant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-surface-page" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-3">
          <button
            onClick={() => navigate("/c/merchants")}
            className="w-9 h-9 rounded-full bg-white/70 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronLeft size={20} className="text-text-body" />
          </button>
          <button
            onClick={() => toast.success("分享链接已复制")}
            className="w-9 h-9 rounded-full bg-white/70 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
          >
            <Share2 size={18} className="text-text-body" />
          </button>
        </div>
      </div>

      {/* Name + Description */}
      <div className="-mt-12 relative px-3">
        <div className="bg-white rounded-2xl p-4 shadow-[0_6px_20px_rgba(60,120,200,0.12)]">
          <h2 className="text-[18px] text-text-body">{merchant.name}</h2>
          <p className="text-[13px] text-text-secondary leading-relaxed mt-2">{merchant.description}</p>
        </div>
      </div>

      {/* Address + Phone */}
      <div className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-light">
          <div className="flex items-center gap-3 min-w-0">
            <MapPin size={16} className="text-primary flex-shrink-0" />
            <span className="text-[14px] text-text-body truncate">{merchant.address}</span>
                  {nearbyFlow && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-page text-[10px] mt-1">
                      <span className={`size-2 rounded-full ${nearbyFlow.level === "green" ? "bg-emerald-500" : nearbyFlow.level === "yellow" ? "bg-amber-500" : nearbyFlow.level === "orange" ? "bg-orange-500" : "bg-red-500"}`} />
                      <span className="text-text-tertiary">{nearbyFlow.name} · 人流{nearbyFlow.pct}% · {LEVEL_META[nearbyFlow.level].label}</span>
                    </div>
                  )}
          </div>
          <button
            onClick={() => openMerchantNavigation(merchant)}
            className="text-[13px] text-primary flex items-center gap-0.5 flex-shrink-0 ml-2"
          >
            导航 <Navigation size={12} />
          </button>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <Phone size={16} className="text-primary flex-shrink-0" />
            <span className="text-[14px] text-text-body">{merchant.phone}</span>
          </div>
          <button
            onClick={() => window.open("tel:" + merchant.phone, "_blank")}
            className="text-[13px] text-primary flex-shrink-0 ml-2"
          >
            拨打
          </button>
        </div>
      </div>

      {/* Distance */}
      {merchant.distance && (
        <div className="mx-3 mt-3">
          <div className="bg-primary/5 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Navigation size={14} className="text-primary" />
            <span className="text-[12px] text-text-secondary">距您约 {merchant.distance}</span>
          </div>
        </div>
      )}

      {/* 商家资质 */}
      <div className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
        <h3 className="text-[14px] text-text-body flex items-center gap-1.5 mb-3">
          <span className="w-1 h-3.5 bg-[#27AE60] rounded-full" />
          商家资质
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {qualificationBadges.map((badge) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.label}
                className="flex flex-col items-center py-2.5 rounded-xl bg-gradient-to-br from-surface-page to-primary-100"
              >
                <Icon size={20} style={{ color: badge.color }} />
                <span className="text-[11px] text-text-heading mt-1">{badge.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-border-light px-3 h-[64px] flex items-center gap-3 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => window.open("tel:" + merchant.phone, "_blank")}
          className="flex flex-col items-center justify-center w-14 text-text-secondary active:opacity-60"
        >
          <Phone size={18} />
          <span className="text-[10px] mt-0.5">联系</span>
        </button>
        <button
          onClick={() => openMerchantNavigation(merchant)}
          className="flex flex-col items-center justify-center w-14 text-text-secondary active:opacity-60"
        >
          <Navigation size={18} />
          <span className="text-[10px] mt-0.5">导航</span>
        </button>
      </div>
    </div>
  )
}
