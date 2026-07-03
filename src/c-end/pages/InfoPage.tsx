import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { PageHeader } from "../components/PageHeader";
import { useContentNewsStore } from "../../features/content/store/news-store"
import type { NewsCategory } from "../../shared/types/content-types";
import { useSearch } from "../../shared/hooks/useSearch";
import { useLoadMore } from "../../shared/hooks/useLoadMore";

const NEWS_CATEGORIES: NewsCategory[] = ["公房公告", "房屋信息", "举贤纳仕", "其它"];

export function InfoPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<NewsCategory>("公房公告");
  const [pageSize, setPageSize] = useState(10);
  const news = useContentNewsStore((s) => s.news);

  const categoryList = news.filter((i) => i.category === active);

  const searchFn = useCallback(
    (item: (typeof categoryList)[0], q: string) => item.title.includes(q),
    [],
  );
  const { query, setQuery, filtered: searched } = useSearch(categoryList, searchFn);
  const { visible, hasMore, loadMore, total } = useLoadMore(searched, 10);

  return (
    <div className="min-h-screen bg-surface-page pb-24">
      {/* Header with sky banner */}
      <div className="relative">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1200&q=70"
          alt="banner"
          className="w-full h-[152px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#7FB6D9]/20 to-surface-page" />
        <div className="absolute top-0 left-0 right-0 flex items-center h-[52px] px-3">
          <PageHeader title="便民信息" back="/c/home" variant="transparent" showBorder={false} />
        </div>
      </div>

      {/* Tabs card */}
      <div className="px-3 -mt-10 relative">
        <div className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(60,120,200,0.10)] p-1.5">
          <div className="grid grid-cols-4 gap-1">
            {NEWS_CATEGORIES.map((c) => {
              const isActive = c === active;
              return (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`h-9 rounded-xl text-[13px] transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary text-white shadow-[0_3px_8px_rgba(60,120,200,0.2)]"
                      : "text-text-secondary"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-3 mt-3 space-y-3">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索信息标题..."
            className="w-full h-9 pl-3 pr-3 rounded-xl border border-slate-150 bg-white text-[13px] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {total === 0 ? (
          <div className="py-20 text-center text-[13px] text-text-tertiary">暂无相关信息</div>
        ) : (
          visible.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/c/info/${item.id}`)}
              className="w-full bg-white rounded-2xl p-2.5 shadow-[0_4px_14px_rgba(60,120,200,0.10)] active:scale-[0.99] transition-transform text-left"
            >
              <div className="flex gap-3">
                <div className="w-[96px] h-[96px] rounded-xl overflow-hidden flex-shrink-0 relative">
                  <ImageWithFallback src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute bottom-1 left-1.5 text-[10px] text-white/95">{item.category}</span>
                </div>
                <div className="flex-1 min-w-0 py-0.5 flex flex-col">
                  <p className="text-[14px] text-text-body leading-snug line-clamp-3">{item.title}</p>
                  <p className="mt-auto text-[11px] text-text-tertiary">{item.date}</p>
                </div>
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

      {/* FAB */}
      <button
        onClick={() => navigate("/c/info/create")}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 h-11 px-6 rounded-full bg-gradient-to-r from-primary to-primary text-white text-[14px] shadow-[0_6px_16px_rgba(60,120,200,0.3)] active:scale-95 transition-transform flex items-center gap-1.5 z-20"
      >
        <Plus size={16} />
        我要发布
      </button>
    </div>
  );
}
