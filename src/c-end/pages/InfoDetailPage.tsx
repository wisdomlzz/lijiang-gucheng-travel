import { useNavigate, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { useContentManageStore } from "../../shared/services/content/guide";

export function InfoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const news = useContentNewsStore((s) => s.news);
  const item = news.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="min-h-screen bg-surface-page">
        <div className="flex items-center h-[52px] px-3 bg-white">
          <button onClick={() => navigate("/c/info")} className="w-9 h-9 flex items-center justify-center">
            <ChevronLeft size={22} className="text-text-body" />
          </button>
          <h1 className="flex-1 text-center text-[17px] text-text-body">{id || "详情"}</h1>
          <div className="w-9" />
        </div>
        <p className="text-center text-text-tertiary text-[14px] pt-20">信息不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page pb-8">
      {/* Header with hero image */}
      <div className="relative">
        <ImageWithFallback
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-[220px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-surface-page" />

        <div className="absolute top-0 left-0 right-0 flex items-center h-[52px] px-3">
          <button
            onClick={() => navigate("/c/info")}
            className="w-9 h-9 rounded-full bg-white/85 backdrop-blur flex items-center justify-center active:opacity-80 shadow-sm"
          >
            <ChevronLeft size={22} className="text-text-body" />
          </button>
          <h1 className="flex-1 text-center text-[17px] text-white pr-9">{item.category}</h1>
        </div>

        {/* Hero title card */}
        <div className="absolute left-1/2 bottom-2 -translate-x-1/2 w-[86%]">
          <div className="bg-white/95 backdrop-blur rounded-xl px-4 py-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.12)] text-center">
            <p className="text-[16px] text-primary tracking-wide">{item.heroTitle}</p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pt-4">
        <p className="text-[16px] text-text-body leading-snug">{item.title}</p>
        <p className="text-[11px] text-text-tertiary mt-1">{item.date}</p>
      </div>

      {/* Detail card */}
      <div className="px-3 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(60,120,200,0.10)]">
          <p className="text-[14px] text-text-body mb-3 flex items-center gap-1">
            <span className="w-1 h-3.5 bg-primary rounded-full" />
            详情
          </p>

          <div className="rounded-xl overflow-hidden">
            <ImageWithFallback
              src={item.subImage}
              alt={item.title}
              className="w-full h-[180px] object-cover"
            />
          </div>

          <div className="mt-3 space-y-2.5 text-[13px] text-[#555] leading-relaxed">
            {item.body.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
