import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, Scan, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { useHomepageConfigStore } from "../../shared/stores/homepage-config-store";
import { useAnnouncementStore } from "../../shared/mock/announcements";
import { useLoadMore } from "@/shared/hooks/useLoadMore";
import { CRMEB_C_URL } from "../../shared/constants";

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
];

export function HomePage() {
  const navigate = useNavigate();
  const rawBanners = useHomepageConfigStore((s) => s.banners);
  const rawGridItems = useHomepageConfigStore((s) => s.gridItems);
  const allAnnouncements = useAnnouncementStore((s) => s.announcements);

  const banners = useMemo(
    () => rawBanners.filter((b) => b.scene === "home" && b.visible).sort((a, b) => a.order - b.order),
    [rawBanners],
  );
  const visibleGridItems = useMemo(
    () => rawGridItems.filter((g) => g.visible),
    [rawGridItems],
  );
  const gridPages = useMemo(() => {
    const sorted = [...visibleGridItems].sort((a, b) => a.order - b.order);
    const pages: typeof visibleGridItems[] = [];
    for (let i = 0; i < sorted.length; i += 8) {
      pages.push(sorted.slice(i, i + 8));
    }
    return pages;
  }, [visibleGridItems]);

  const [bannerIdx, setBannerIdx] = useState(0);
  const [gridPage, setGridPage] = useState(0);
  const [bannerHover, setBannerHover] = useState(false);
  const dragStartX = useRef(0);
  const dragActive = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const infoListRef = useRef<HTMLDivElement>(null);
  const [infoFilter, setInfoFilter] = useState<"all" | "公告">("all");

  // 景区综合资讯：全部已发布数据，按时间排序
  const allSorted = useMemo(
    () => allAnnouncements
      .filter((a) => a.status === "published")
      .sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()),
    [allAnnouncements],
  );

  // 根据筛选标签过滤
  const filteredSorted = useMemo(
    () => infoFilter === "all" ? allSorted : allSorted.filter(a => a.type === infoFilter),
    [allSorted, infoFilter],
  );

  const { visible: infoVisible, hasMore: infoHasMore, loadMore: infoLoadMore, reset: infoReset } = useLoadMore(filteredSorted, 5);

  // 切换筛选标签时重置分页
  useEffect(() => { infoReset() }, [infoFilter, infoReset]);

  // IntersectionObserver 实现触底加载
  const infoSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = infoSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && infoHasMore) infoLoadMore(); },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [infoHasMore, infoLoadMore]);

  useEffect(() => {
    if (bannerHover || banners.length === 0) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 3500);
    return () => clearInterval(t);
  }, [bannerHover, banners.length]);

  const handleBannerClick = (banner: typeof banners[0]) => {
    if (banner.link) {
      navigate(banner.link);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-[#A8D0F5] via-[#D6E8F8] to-[#EFF6FC]">
      {/* Banner — 通顶通栏 */}
      <div
        className="relative w-full overflow-hidden cursor-pointer"
        onClick={() => handleBannerClick(banners[bannerIdx])}
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
            className="w-full aspect-[16/7]"
          >
            <ImageWithFallback
              src={banners[bannerIdx].imageUrl}
              alt="banner"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white text-[20px] tracking-[0.3em] drop-shadow-lg">丽江古城游</span>
          <div className="text-white/90 text-[13px] tracking-[0.3em] mt-1 drop-shadow">
            {banners[bannerIdx].title} · {banners[bannerIdx].subtitle}
          </div>
        </div>
        {/* Badge */}
        <div
          className="absolute top-3 left-3 px-2 py-1 rounded-full text-[11px] text-white"
          style={{ backgroundColor: banners[bannerIdx].badge === "NEW" ? "#059669" : banners[bannerIdx].badge === "热门" ? "#DC2626" : "#3B82F6" }}
        >
          {banners[bannerIdx].badge}
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <div
              key={i}
              onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }}
              className={`rounded-full transition-all cursor-pointer ${
                i === bannerIdx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 mt-3">
        <div className="flex items-center gap-2 bg-white rounded-full h-[42px] pl-4 pr-2 shadow-[0_4px_14px_rgba(60,120,200,0.12)] focus-within:ring-2 focus-within:ring-primary/30 focus-within:shadow-[0_4px_14px_rgba(60,120,200,0.15)] transition-all">
          <Search size={16} className="text-text-caption" />
          <input className="flex-1 text-[13px] text-text-caption bg-transparent outline-none" placeholder="请输入" />
          <button className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center shadow">
            <Scan size={14} className="text-white" />
          </button>
        </div>
      </div>

      {/* 8-grid with swipe pagination */}
      <div
        ref={gridRef}
        className="px-4 mt-5 select-none"
        style={{ touchAction: "pan-y", cursor: "grab" }}
        onTouchStart={(e) => { dragStartX.current = e.touches[0].clientX; dragActive.current = true; }}
        onTouchEnd={(e) => {
          dragActive.current = false;
          const diff = dragStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 40) {
            if (diff > 0 && gridPage < gridPages.length - 1) {
              setGridPage(gridPage + 1);
            } else if (diff < 0 && gridPage > 0) {
              setGridPage(gridPage - 1);
            }
          }
        }}
        onMouseDown={(e) => { dragStartX.current = e.clientX; dragActive.current = true; }}
        onMouseUp={(e) => {
          if (!dragActive.current) return;
          dragActive.current = false;
          const diff = dragStartX.current - e.clientX;
          if (Math.abs(diff) > 40) {
            if (diff > 0 && gridPage < gridPages.length - 1) {
              setGridPage(gridPage + 1);
            } else if (diff < 0 && gridPage > 0) {
              setGridPage(gridPage - 1);
            }
          }
        }}
        onMouseLeave={() => { dragActive.current = false; }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={gridPage}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid grid-cols-4 gap-y-4 gap-x-2"
          >
            {gridPages[gridPage].map((item) => {
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.route === "#") return;
                    if (item.route === "crmeb") {
                      window.open(CRMEB_C_URL, "_blank")
                    } else if (item.route.endsWith(".html")) {
                      window.open(item.route, "_blank")
                    } else if (item.search) {
                      navigate(item.route, { search: item.search })
                    } else {
                      navigate(item.route)
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-all duration-200"
                >
                  <div className="w-[52px] h-[52px] rounded-[14px] overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-[13px] font-medium text-primary">
                        {item.label.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-[12px] text-text-heading">{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Page indicator */}
        {gridPages.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {gridPages.map((_, i) => (
              <button
                key={i}
                onClick={() => setGridPage(i)}
                className={`rounded-full transition-all cursor-pointer ${
                  i === gridPage
                    ? "w-6 h-1 bg-primary"
                    : "w-3 h-1 bg-[#CBD5E1] hover:bg-[#94A3B8]"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recommend routes */}
      <div className="mt-6 px-4">
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="w-1 h-4 bg-primary rounded-full" />
              <h3 className="text-[15px] text-text-heading ml-1">推荐路线</h3>
            </div>
            <button onClick={() => navigate("/c/routes")} className="flex items-center text-[12px] text-primary">
              查看更多 <ChevronRight size={14} />
            </button>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
            {recommendRoutes.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/c/routes/${r.routeId}`)}
                className="flex-shrink-0 w-[180px] text-left"
              >
                <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                  <ImageWithFallback src={r.img} alt={r.name} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] text-white shadow" style={{ backgroundColor: r.tagColor }}>
                    {r.tag}
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-text-heading line-clamp-1">{r.name}</p>
                <p className="text-[11px] text-text-caption mt-0.5 line-clamp-1">{r.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 景区综合资讯 */}
      <div className="mt-5 px-4 pb-4" ref={infoListRef}>
        <div className="flex items-center mb-3">
          <div className="flex items-center gap-1">
            <span className="w-1 h-4 bg-primary rounded-full" />
            <h3 className="text-[15px] text-text-heading ml-1">景区综合资讯</h3>
          </div>
        </div>

        {/* 筛选标签 */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {(["all", "公告"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setInfoFilter(type)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[12px] ${
                infoFilter === type
                  ? "bg-primary text-white"
                  : "bg-white text-text-secondary border border-gray-200"
              }`}
            >
              {type === "all" ? "全部" : type}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {infoVisible.map((ann) => (
            <button
              key={ann.id}
              onClick={() => navigate(`/c/announcement/${ann.id}`)}
              className="w-full bg-white rounded-xl overflow-hidden shadow-sm flex items-center active:scale-[0.99] transition-transform text-left"
            >
              <div className="relative w-24 h-24 flex-shrink-0">
                {ann.images.length > 0 ? (
                  <ImageWithFallback src={ann.images[0]} alt={ann.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-2xl">📢</span>
                  </div>
                )}
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[9px] text-white bg-red-500">
                  公告
                </div>
              </div>
              <div className="flex-1 p-3 min-w-0">
                <p className="text-[14px] text-text-heading font-medium line-clamp-1">{ann.title}</p>
                <p className="text-[11px] text-text-caption mt-1 line-clamp-2">{ann.content.slice(0, 40)}...</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-text-tertiary">
                    {ann.publishTime ? new Date(ann.publishTime).toLocaleDateString("zh-CN") : ""}
                  </span>
                  <span className="text-[11px] text-primary flex items-center gap-0.5">
                    查看详情 <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            </button>
          ))}
          {/* 触底哨兵：触发懒加载 */}
          <div ref={infoSentinelRef} className="h-4" />
          {infoHasMore && (
            <div className="text-center py-2 text-[12px] text-text-tertiary">
              上拉加载更多
            </div>
          )}
          {!infoHasMore && infoVisible.length > 0 && (
            <div className="text-center py-2 text-[12px] text-text-tertiary">
              — 已加载全部 —
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
