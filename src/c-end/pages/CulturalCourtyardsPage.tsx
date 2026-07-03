import { useNavigate } from "react-router";
import { useContentCourtyardStore } from "../../features/content/store/courtyard-store"
import { useContentGuideStore } from "../../features/content/store/guide-store"
import { PageHeader } from "../components/PageHeader";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { MapPin, Clock, Landmark, CheckCircle2, ChevronRight, UserRoundCheck } from "lucide-react";
import { useCheckinStore } from "../../features/checkin/store";
import { useLoadMore } from "../../shared/hooks/useLoadMore";

export function CulturalCourtyardsPage() {
  const navigate = useNavigate();
  const courtyards = useContentCourtyardStore((s) => s.courtyards);
  const { visible, hasMore, loadMore } = useLoadMore(courtyards, 6);
  const checkins = useCheckinStore((s) => s.checkins);
  const visitedIds = new Set(checkins.filter((c) => c.userId === "user-1").map((c) => c.courtyardId));
  const progress = courtyards.length ? Math.round((visitedIds.size / courtyards.length) * 100) : 0;

  return (
    <div className="min-h-full bg-surface-page">
      <PageHeader title="文化院落" back="/c/home" />
      <div className="px-3 py-3 space-y-3">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
          <p className="text-[15px] font-semibold text-text-heading">文化院落打卡</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[12px] text-text-tertiary">已打卡 {visitedIds.size}/{courtyards.length} 处院落</p>
            <span className="text-[11px] text-primary font-medium whitespace-nowrap">{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>

          <button
            onClick={() => navigate("/c/my-checkins")}
            className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white active:opacity-90 transition-all shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
          >
            <UserRoundCheck size={18} />
            <span className="flex-1 text-left text-[14px] font-medium">我的打卡记录</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {visible.map((c) => {
          const checked = visitedIds.has(c.id);
          return (
          <div
            key={c.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
          >
            <div className="flex p-3 gap-3">
              <button
                onClick={() => navigate(`/c/courtyard/${c.id}`)}
                className="w-[96px] h-[116px] bg-gray-100 rounded-xl overflow-hidden relative shrink-0 active:opacity-90"
              >
                <ImageWithFallback src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                {checked && (
                  <span className="absolute top-2 left-2 px-2 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center gap-1 shadow-sm">
                    <CheckCircle2 size={11} />
                    已打卡
                  </span>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <button
                  onClick={() => navigate(`/c/courtyard/${c.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-text-heading line-clamp-1">{c.name}</h3>
                    <ChevronRight size={16} className="text-text-tertiary shrink-0 mt-0.5" />
                  </div>
                  <p className="mt-1.5 text-[12px] text-text-secondary line-clamp-2 leading-relaxed">{c.description}</p>
                  <div className="mt-2 space-y-1 text-[11px] text-text-tertiary">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={12} className="text-primary shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-primary shrink-0" />
                      {c.hours}
                    </span>
                  </div>
                </button>

                <div className="mt-3">
                  <button
                    onClick={() => navigate(`/c/courtyard/${c.id}`)}
                    className={`w-full h-9 rounded-full text-[13px] font-medium active:scale-95 transition-transform ${
                      checked
                        ? "bg-surface-page text-text-secondary"
                        : "bg-primary text-white shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
                    }`}
                  >
                    {checked ? "查看详情" : "去打卡"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )})}
        {hasMore && (
          <button onClick={loadMore} className="w-full py-3 text-center text-[13px] text-primary">
            加载更多
          </button>
        )}
        {courtyards.length === 0 && (
          <div className="text-center py-12 text-text-tertiary">
            <Landmark size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-[14px]">暂无相关院落</p>
          </div>
        )}
      </div>
    </div>
  );
}
