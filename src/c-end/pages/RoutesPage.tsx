import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Clock, MapPin } from "lucide-react";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { useContentManageStore } from "../../shared/stores/content-manage-store";
import { PageHeader } from "./shop/PageHeader";

export function RoutesPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const guides = useContentManageStore((s) => s.guides);

  const filtered = keyword.trim()
    ? guides.filter(
        (r) =>
          r.name.includes(keyword.trim()) ||
          r.spotNames.some((n) => n.includes(keyword.trim()))
      )
    : guides;

  return (
    <div className="min-h-screen bg-surface-page pb-6">
      <PageHeader title="游玩攻略" back="/c/home" />

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-full h-10 px-3.5 shadow-[0_2px_10px_rgba(60,120,200,0.08)]">
          <Search size={15} className="text-text-tertiary" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="请输入关键字查询"
            className="flex-1 text-[13px] text-text-body placeholder:text-text-tertiary outline-none bg-transparent"
          />
        </div>
      </div>

      {/* List */}
      <div className="px-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-[13px] text-text-tertiary">
            没有找到相关路线
          </div>
        ) : (
          filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/c/routes/${r.id}`)}
              className="w-full bg-white rounded-2xl p-2.5 shadow-[0_4px_14px_rgba(60,120,200,0.10)] active:scale-[0.99] transition-transform text-left"
            >
              <div className="flex gap-3">
                <div className="w-[112px] h-[112px] rounded-xl overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={r.cover}
                    alt={r.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 py-1 flex flex-col">
                  <p className="text-[15px] text-text-body leading-snug line-clamp-2">
                    {r.name}
                  </p>
                  <div className="mt-2 space-y-1 text-[12px] text-text-secondary">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-primary" />
                      <span>游览时间：{r.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-primary" />
                      <span>景点数量：{r.stops}个</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-page text-text-tertiary">
                        {r.difficulty || "中等"}
                      </span>
                    </div>
                  </div>
                  <p className="mt-auto pt-2 text-[11px] text-text-tertiary line-clamp-1">
                    {r.spotNames.join("、")}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
