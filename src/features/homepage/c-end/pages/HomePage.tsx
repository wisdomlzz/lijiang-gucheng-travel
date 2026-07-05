import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { Search, ScanLine, Sparkles, Newspaper } from "lucide-react"
import { SectionHeader } from "@/shared/components/mobile/SectionHeader"
import { GridIcon } from "@/shared/components/mobile/GridIcon"
import { InfoListItem } from "@/shared/components/mobile/InfoListItem"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { useHomepageConfigStore } from "../../store"
import { useAnnouncementStore } from "@/features/announcement/store"
import { useLoadMore } from "@/shared/hooks/useLoadMore"
import { CRMEB_C_URL } from "@/shared/constants"

const recommendRoutes = [
  {
    id: 1,
    routeId: "1",
    name: "古城漫步·非遗之旅",
    subtitle: "大水车 · 四方街 · 万古楼",
    tag: "深度游",
    tagColor: "#3B82F6",
    img: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: 2,
    routeId: "2",
    name: "寻味古城·美食地图",
    subtitle: "忠义市场 · 五一街 · 樱花美食广场",
    tag: "吃货必选",
    tagColor: "#0EA5E9",
    img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=70",
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const rawBanners = useHomepageConfigStore((s) => s.banners)
  const rawGridItems = useHomepageConfigStore((s) => s.gridItems)
  const allAnnouncements = useAnnouncementStore((s) => s.announcements)

  const banners = useMemo(
    () => rawBanners.filter((b) => b.scene === "home" && b.visible).sort((a, b) => a.order - b.order),
    [rawBanners]
  )
  const visibleGridItems = useMemo(() => rawGridItems.filter((g) => g.visible), [rawGridItems])
  const gridPages = useMemo(() => {
    const sorted = [...visibleGridItems].sort((a, b) => a.order - b.order)
    const pages: (typeof visibleGridItems)[] = []
    for (let i = 0; i < sorted.length; i += 8) {
      pages.push(sorted.slice(i, i + 8))
    }
    return pages
  }, [visibleGridItems])

  const [bannerIdx, setBannerIdx] = useState(0)
  const [gridPage, setGridPage] = useState(0)
  const [bannerHover, setBannerHover] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const dragStartX = useRef(0)
  const dragActive = useRef(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const infoSentinelRef = useRef<HTMLDivElement>(null)

  const allSorted = useMemo(
    () =>
      allAnnouncements
        .filter((a) => a.status === "published")
        .sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()),
    [allAnnouncements]
  )

  const {
    visible: infoVisible,
    hasMore: infoHasMore,
    loadMore: infoLoadMore,
    reset: infoReset,
  } = useLoadMore(allSorted, 5)

  useEffect(() => {
    infoReset()
  }, [infoReset])

  useEffect(() => {
    const el = infoSentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && infoHasMore) infoLoadMore()
      },
      { rootMargin: "100px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [infoHasMore, infoLoadMore])

  useEffect(() => {
    if (bannerHover || banners.length === 0) return
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 3500)
    return () => clearInterval(t)
  }, [bannerHover, banners.length])

  const handleBannerClick = (banner: (typeof banners)[0]) => {
    if (banner.link) {
      navigate(banner.link)
    }
  }

  const currentBanner = banners[bannerIdx]

  return (
    <div className="min-h-full bg-surface-page pb-4">
      {/* Hero header — blue sky gradient merging with status bar */}
      <div className="relative bg-gradient-to-b from-sky-mid via-sky-light to-surface-page pt-10 pb-12 px-4">
        {/* App title */}
        <div className="flex items-center justify-center mb-4">
          <span className="text-white text-[18px] font-semibold tracking-[0.15em] drop-shadow-sm">丽江古城游</span>
        </div>

        {/* Banner card */}
        {currentBanner && (
          <div
            className="relative rounded-2xl overflow-hidden aspect-[16/7] shadow-elevated cursor-pointer"
            onClick={() => handleBannerClick(currentBanner)}
            onMouseEnter={() => setBannerHover(true)}
            onMouseLeave={() => setBannerHover(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={bannerIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <ImageWithFallback src={currentBanner.imageUrl} alt="banner" className="w-full h-full object-cover" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white text-[20px] font-semibold tracking-[0.2em] drop-shadow-lg">丽江古城游</span>
              <div className="text-white/90 text-[13px] tracking-[0.1em] mt-1 drop-shadow">一键服务 · 便捷生活</div>
            </div>
            {currentBanner.badge && (
              <div
                className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[11px] text-white font-medium"
                style={{
                  backgroundColor:
                    currentBanner.badge === "NEW" ? "#10B981" : currentBanner.badge === "热门" ? "#EF4444" : "#3B82F6",
                }}
              >
                {currentBanner.badge}
              </div>
            )}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setBannerIdx(i)
                  }}
                  className={`rounded-full transition-all cursor-pointer ${
                    i === bannerIdx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Floating search bar */}
        <div className="absolute -bottom-5 left-4 right-4">
          <div className="flex items-center gap-2 bg-white rounded-full h-[44px] pl-4 pr-2 shadow-elevated focus-within:ring-2 focus-within:ring-sky-light/40 transition-all">
            <Search size={16} className="text-text-caption" />
            <form
              className="flex-1"
              onSubmit={(e) => {
                e.preventDefault()
                const q = searchKeyword.trim()
                if (q) navigate(`/c/search?q=${encodeURIComponent(q)}`)
              }}
            >
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full text-[13px] text-text-heading bg-transparent outline-none placeholder:text-text-caption"
                placeholder="搜索商家、路线、资讯"
              />
            </form>
            <button className="w-8 h-8 rounded-lg border border-border-light flex items-center justify-center text-sky-deep active:scale-95 transition-transform">
              <ScanLine size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 8-grid with swipe pagination */}
      <div
        ref={gridRef}
        className="px-4 mt-8 select-none"
        style={{ touchAction: "pan-y", cursor: "grab" }}
        onTouchStart={(e) => {
          dragStartX.current = e.touches[0].clientX
          dragActive.current = true
        }}
        onTouchEnd={(e) => {
          dragActive.current = false
          const diff = dragStartX.current - e.changedTouches[0].clientX
          if (Math.abs(diff) > 40) {
            if (diff > 0 && gridPage < gridPages.length - 1) {
              setGridPage(gridPage + 1)
            } else if (diff < 0 && gridPage > 0) {
              setGridPage(gridPage - 1)
            }
          }
        }}
        onMouseDown={(e) => {
          dragStartX.current = e.clientX
          dragActive.current = true
        }}
        onMouseUp={(e) => {
          if (!dragActive.current) return
          dragActive.current = false
          const diff = dragStartX.current - e.clientX
          if (Math.abs(diff) > 40) {
            if (diff > 0 && gridPage < gridPages.length - 1) {
              setGridPage(gridPage + 1)
            } else if (diff < 0 && gridPage > 0) {
              setGridPage(gridPage - 1)
            }
          }
        }}
        onMouseLeave={() => {
          dragActive.current = false
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={gridPage}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid grid-cols-4 gap-y-5 gap-x-2"
          >
            {gridPages[gridPage]?.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.route === "#") return
                  if (item.route === "crmeb") {
                    window.open(CRMEB_C_URL, "_blank")
                  } else if (item.route.endsWith(".html")) {
                    window.open(item.route, "_blank")
                  } else if (item.search) {
                    navigate(item.route + (item.search ? `?${item.search}` : ""))
                  } else {
                    navigate(item.route)
                  }
                }}
                className="flex flex-col items-center gap-1.5 active:scale-90 transition-all duration-200"
              >
                <GridIcon imageUrl={item.imageUrl} label={item.label} gradientIndex={idx} />
                <span className="text-[12px] text-text-heading font-medium">{item.label}</span>
              </button>
            ))}
          </motion.div>
        </AnimatePresence>

        {gridPages.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {gridPages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGridPage(i)}
                className={`rounded-full transition-all cursor-pointer ${
                  i === gridPage ? "w-6 h-1 bg-sky-deep" : "w-3 h-1 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recommend routes */}
      <div className="mt-6 px-4">
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <SectionHeader icon={Sparkles} title="推荐攻略" action={{ label: "查看更多", to: "/c/routes" }} />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {recommendRoutes.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/c/routes/${r.routeId}`)}
                className="text-left active:scale-[0.98] transition-transform"
              >
                <div className="relative rounded-xl overflow-hidden aspect-[16/10] shadow-sm">
                  <ImageWithFallback src={r.img} alt={r.name} className="w-full h-full object-cover" />
                  <span
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] text-white font-medium shadow"
                    style={{ backgroundColor: r.tagColor }}
                  >
                    {r.tag}
                  </span>
                </div>
                <p className="mt-2 text-[14px] font-medium text-text-heading line-clamp-1">{r.name}</p>
                <p className="text-[11px] text-text-caption mt-0.5 line-clamp-1">{r.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 景区综合资讯 */}
      <div className="mt-5 px-4 pb-2">
        <div className="mb-3">
          <SectionHeader icon={Newspaper} title="景区资讯" action={{ label: "查看更多", to: "/c/news" }} />
        </div>

        <div className="space-y-3">
          {infoVisible.map((ann) => (
            <InfoListItem key={ann.id} announcement={ann} />
          ))}
          <div ref={infoSentinelRef} className="h-4" />
          {infoHasMore && <div className="text-center py-2 text-[12px] text-text-tertiary">上拉加载更多</div>}
          {!infoHasMore && infoVisible.length > 0 && (
            <div className="text-center py-2 text-[12px] text-text-tertiary">— 已加载全部 —</div>
          )}
        </div>
      </div>
    </div>
  )
}
