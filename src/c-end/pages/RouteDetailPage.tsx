import { useNavigate, useParams } from "react-router";
import { ChevronLeft, Clock, MapPin, Route as RouteIcon, Share2, Video } from "lucide-react";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { toast } from "sonner";
import { useContentGuideStore } from "../../features/content/store/guide-store"
import { VideoPlayer } from "../../shared/components/VideoPlayer";
import routeIllustration from "../assets/image-9.png";

export function RouteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const guides = useContentGuideStore((s) => s.guides);
  const route = guides.find((g) => g.id === id);

  if (!route) {
    return (
      <div className="min-h-screen bg-surface-page">
        <div className="flex items-center h-[52px] px-3 bg-white">
          <button onClick={() => navigate("/c/routes")} className="w-9 h-9 flex items-center justify-center">
            <ChevronLeft size={22} className="text-text-body" />
          </button>
          <h1 className="flex-1 text-center text-[17px] text-text-body">路线详情</h1>
          <div className="w-9" />
        </div>
        <p className="text-center text-text-tertiary text-[14px] pt-20">路线不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-b from-surface-page to-surface-page">
        <div className="flex items-center h-[52px] px-3">
          <button
            onClick={() => navigate("/c/routes")}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
          >
            <ChevronLeft size={22} className="text-text-body" />
          </button>
          <h1 className="flex-1 text-center text-[17px] text-text-body">攻略详情</h1>
          <button
            onClick={() => toast.success("分享链接已复制")}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
          >
            <Share2 size={18} className="text-text-body" />
          </button>
        </div>
      </header>

      {/* Main card */}
      <div className="px-3">
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(60,120,200,0.10)]">
          <div className="relative aspect-[16/9]">
            <ImageWithFallback src={route.cover} alt={route.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          {route.hasVideo && route.videoUrl && (
            <div className="px-3 py-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Video size={14} className="text-primary" />
                <span className="text-[12px] text-text-secondary">攻略视频</span>
                {route.videoDuration && (
                  <span className="text-[11px] text-text-tertiary">时长 {route.videoDuration}</span>
                )}
              </div>
              <VideoPlayer
                src={route.videoUrl}
                poster={route.videoCoverUrl}
                className="aspect-video rounded-lg"
              />
            </div>
          )}

          <div className="p-4">
            <h2 className="text-[18px] text-text-body">{route.name}</h2>
            <p className="text-[13px] text-text-secondary leading-relaxed mt-2">{route.description}</p>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2 bg-[#FFFBF2] rounded-xl py-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-surface-page flex items-center justify-center">
                  <Clock size={16} className="text-primary" />
                </div>
                <p className="text-[12px] text-text-body mt-1.5">{route.duration}</p>
                <p className="text-[10px] text-text-tertiary mt-0.5">游览时长</p>
              </div>
              <div className="flex flex-col items-center border-x border-primary-100">
                <div className="w-8 h-8 rounded-full bg-surface-page flex items-center justify-center">
                  <RouteIcon size={16} className="text-primary" />
                </div>
                <p className="text-[12px] text-text-body mt-1.5">{route.distance}</p>
                <p className="text-[10px] text-text-tertiary mt-0.5">路线长度</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-surface-page flex items-center justify-center">
                  <MapPin size={16} className="text-primary" />
                </div>
                <p className="text-[12px] text-text-body mt-1.5">{route.stops} 个</p>
                <p className="text-[10px] text-text-tertiary mt-0.5">景点数量</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/c/routes/${route.id}/preview`)}
              className="w-full h-11 mt-4 rounded-full bg-gradient-to-r from-primary to-primary text-white text-[14px] shadow-[0_4px_12px_rgba(60,120,200,0.2)] active:scale-[0.99] transition-transform"
            >
              开始游览
            </button>
          </div>
        </div>
      </div>

      {/* Peak-hour suggestion */}
      <div className="px-3 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(60,120,200,0.10)]">
          <p className="text-[14px] text-text-body font-medium mb-3">错峰建议</p>
          <div className="space-y-2">
            {[
              { time: "8:00-10:00", level: "拥挤", color: "#EF4444", width: "90%" },
              { time: "10:00-12:00", level: "较挤", color: "#F59E0B", width: "60%" },
              { time: "12:00-14:00", level: "舒适", color: "#22C55E", width: "30%" },
              { time: "14:00-16:00", level: "较挤", color: "#F59E0B", width: "55%" },
              { time: "16:00-18:00", level: "舒适", color: "#22C55E", width: "25%" },
            ].map((slot) => (
              <div key={slot.time} className="flex items-center gap-3">
                <span className="text-[11px] text-text-secondary w-20">{slot.time}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: slot.width, backgroundColor: slot.color }} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: slot.color }}>{slot.level}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">推荐游览时间：12:00-14:00</p>
        </div>
      </div>

      {/* Route illustration */}
      <div className="px-3 mt-4">
        <p className="text-[14px] text-text-body mb-2 flex items-center gap-1">
          <span className="w-1 h-3.5 bg-primary rounded-full" />
          路线示意
        </p>
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(60,120,200,0.10)]">
          <img
            src={routeIllustration}
            alt="路线示意"
            className="w-full h-auto object-cover block"
          />
        </div>
      </div>

      {/* 内容块混排区域 */}
      {route.contentBlocks && route.contentBlocks.length > 0 && (
        <div className="px-3 mt-4 space-y-4">
          <p className="text-[14px] text-text-body mb-2 flex items-center gap-1">
            <span className="w-1 h-3.5 bg-primary rounded-full" />
            攻略详情
          </p>
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(60,120,200,0.10)] p-4 space-y-4">
            {route.contentBlocks.map((block) => (
              <div key={block.id}>
                {block.type === "text" && block.text && (
                  <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {block.text}
                  </p>
                )}
                {block.type === "image" && block.imageUrl && (
                  <div>
                    <img
                      src={block.imageUrl}
                      alt={block.imageCaption || "攻略图片"}
                      className="w-full rounded-lg"
                    />
                    {block.imageCaption && (
                      <p className="text-[11px] text-text-tertiary mt-1 text-center">
                        {block.imageCaption}
                      </p>
                    )}
                  </div>
                )}
                {block.type === "video" && block.videoUrl && (
                  <div>
                    <VideoPlayer
                      src={block.videoUrl}
                      poster={block.videoCoverUrl}
                      className="aspect-video rounded-lg"
                    />
                    {block.videoCaption && (
                      <p className="text-[11px] text-text-tertiary mt-1 text-center">
                        {block.videoCaption}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
