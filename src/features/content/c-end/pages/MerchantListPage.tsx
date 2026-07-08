import { useState, useEffect, useCallback } from "react"
import { Search, MapPin } from "lucide-react"
import { useLocation, useNavigate, useSearchParams } from "react-router"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { useContentMerchantStore } from "@/features/content/store/merchant-store"
import { normalizeMerchantCategory, merchantCategoryLabels } from "@/shared/constants/content-config"
import { useSearch } from "@/shared/hooks/useSearch"
import { useLoadMore } from "@/shared/hooks/useLoadMore"
import { haversineDistance } from "@/shared/utils/geo"

// 商家类别配置
type MerchantCategory = "all" | "food" | "hotel" | "bar" | "shopping"

const categories: { key: MerchantCategory; label: string }[] = [
  { key: "all", label: "全部" },
  ...Object.entries(merchantCategoryLabels).map(([key, label]) => ({
    key: key as MerchantCategory,
    label,
  })),
]

export function MerchantListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isNearby = searchParams.get("nearby") === "1"
  const [activeCategory, setActiveCategory] = useState<MerchantCategory>("all")
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const storeMerchants = useContentMerchantStore((s) => s.merchants)

  // 获取用户位置
  useEffect(() => {
    if (sortBy === "distance") {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // 定位失败，使用默认坐标（古城中心）
          setUserLocation({ lat: 26.8756, lng: 100.2326 })
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [sortBy])

  const filteredMerchants = storeMerchants
    .filter((m) => activeCategory === "all" || normalizeMerchantCategory(m.category) === activeCategory)
    .map((m) => {
      const distance =
        userLocation && m.lat && m.lng ? haversineDistance(userLocation.lat, userLocation.lng, m.lat, m.lng) : null
      return { ...m, _distance: distance }
    })
    .sort((a, b) => {
      if (sortBy === "distance") {
        const distA = a._distance ?? 999999
        const distB = b._distance ?? 999999
        return distA - distB
      }
      return b.rating - a.rating
    })

  const searchFn = useCallback((m: (typeof filteredMerchants)[0], q: string) => m.name.includes(q), [])
  const { query, setQuery, filtered: searched } = useSearch(filteredMerchants, searchFn)
  const { visible, hasMore, loadMore, total } = useLoadMore(searched, 10)

  return (
    <div className="min-h-screen bg-surface-page pb-6">
      <PageHeader title={isNearby ? "附近" : "购在古城"} back="/c/home" />

      {/* Category tabs */}
      <div className="flex items-center overflow-x-auto px-3 bg-white border-b border-border-light scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex-shrink-0 px-3 h-[40px] text-[14px] relative flex items-center gap-1 transition-colors ${
              activeCategory === cat.key ? "text-primary" : "text-text-secondary"
            }`}
          >
            <span>{cat.label}</span>
            {activeCategory === cat.key && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Sort bar */}
      <div className="flex items-center justify-between px-4 h-[36px] bg-white/60 border-b border-border-light">
        <span className="text-[11px] text-text-tertiary">{isNearby ? "按距离展示" : `共 ${total} 家商家`}</span>
        <div className="flex items-center gap-0.5 bg-surface-page rounded-full p-0.5">
          {[
            { key: "distance" as const, label: "距离" },
            { key: "rating" as const, label: "评分" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-3 h-[24px] rounded-full text-[11px] transition-all ${
                sortBy === s.key ? "bg-white text-primary font-medium shadow-sm" : "text-text-tertiary"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-3 space-y-3 mt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索商家名称..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-150 bg-white text-[13px] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-3">
              <Search size={32} className="text-text-tertiary" />
            </div>
            <p className="text-[14px] text-text-tertiary">暂无符合条件的商家</p>
          </div>
        ) : (
          visible.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(`/c/merchant/${m.id}`)}
              className="w-full bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(60,120,200,0.10)] active:scale-[0.99] transition-transform text-left"
            >
              <div className="relative h-32">
                <ImageWithFallback src={m.cover} alt={m.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <span className="text-white text-[16px] drop-shadow">{m.name}</span>
                </div>
              </div>

              <div className="p-3 flex items-center justify-between text-[12px] text-text-tertiary">
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={12} className="flex-shrink-0" />
                  {m.address}
                </span>
                <span className="flex-shrink-0">{m.phone}</span>
              </div>
            </button>
          ))
        )}

        {hasMore && (
          <button onClick={loadMore} className="w-full py-3 text-[13px] text-primary font-medium">
            加载更多
          </button>
        )}
      </div>
    </div>
  )
}
