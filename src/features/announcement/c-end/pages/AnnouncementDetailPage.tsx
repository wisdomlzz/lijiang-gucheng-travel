import { useRef, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { ChevronLeft } from "lucide-react"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { useAnnouncementStore } from "@/features/announcement/store"

/* ────────── 图片轮播组件 ────────── */
function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0)
  const touchX = useRef(0)

  if (images.length === 0) return null

  const handleTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      if (diff > 0) setIdx((i) => Math.min(i + 1, images.length - 1))
      else setIdx((i) => Math.max(i - 1, 0))
    }
  }

  return (
    <div className="relative w-full h-[200px] overflow-hidden bg-black">
      <div className="w-full h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <ImageWithFallback src={images[idx]} alt={`${title} - ${idx + 1}`} className="w-full h-full object-cover" />
      </div>

      {/* 底部渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

      {/* 多图指示器：页码 */}
      {images.length > 1 && (
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-[11px]">
          {idx + 1}/{images.length}
        </div>
      )}

      {/* 左右点击翻页 */}
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx((i) => Math.max(i - 1, 0))} className="absolute left-0 top-0 bottom-0 w-1/3" />
          <button
            onClick={() => setIdx((i) => Math.min(i + 1, images.length - 1))}
            className="absolute right-0 top-0 bottom-0 w-1/3"
          />
        </>
      )}

      {/* 圆点指示器 */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-3" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function AnnouncementDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getAnnouncement = useAnnouncementStore((s) => s.getAnnouncement)
  const announcement = id ? getAnnouncement(id) : undefined

  if (!announcement || announcement.status !== "published") {
    return (
      <div className="min-h-screen bg-surface-page flex flex-col">
        <div className="relative">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1200&q=70"
            alt="banner"
            className="w-full h-[152px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#7FB6D9]/40 to-surface-page" />
          <div className="absolute top-0 left-0 right-0 flex items-center h-[52px] px-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
              <ChevronLeft size={22} className="text-text-body" />
            </button>
            <span className="flex-1 text-center text-[17px] text-text-body font-medium">公告详情</span>
            <div className="w-9" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-text-secondary">公告不存在或已下架</div>
      </div>
    )
  }

  // 格式化日期
  const formatDateTime = (isoString: string) => {
    if (!isoString) return ""
    return new Date(isoString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const images = announcement.images

  return (
    <div className="min-h-screen bg-surface-page">
      {/* 图片轮播 */}
      {images.length > 0 ? (
        <div className="relative">
          <ImageCarousel images={images} title={announcement.title} />
          {/* 顶部导航栏浮在轮播上 */}
          <div className="absolute top-0 left-0 right-0 flex items-center h-[52px] px-3 z-10">
            <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
              <ChevronLeft size={22} className="text-white" />
            </button>
            <span className="flex-1 text-center text-[17px] text-white font-medium">公告详情</span>
            <div className="w-9" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface-page to-transparent" />
        </div>
      ) : (
        /* 无图时：默认 banner + 白字导航 */
        <div className="relative">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1200&q=70"
            alt="banner"
            className="w-full h-[152px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#7FB6D9]/40 to-surface-page" />
          <div className="absolute top-0 left-0 right-0 flex items-center h-[52px] px-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
              <ChevronLeft size={22} className="text-text-body" />
            </button>
            <span className="flex-1 text-center text-[17px] text-text-body font-medium">公告详情</span>
            <div className="w-9" />
          </div>
        </div>
      )}

      <div className="px-4 py-4">
        {/* 标签和发布时间 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] text-white px-2 py-0.5 rounded-full bg-red-500">公告</span>
          <span className="text-[12px] text-text-tertiary">发布于 {formatDateTime(announcement.publishTime)}</span>
        </div>

        {/* 标题 */}
        <h1 className="text-[20px] text-text-body font-semibold leading-tight mb-4">{announcement.title}</h1>

        {/* 分割线 */}
        <div className="border-t border-gray-100 mb-4" />

        {/* 内容 */}
        <div className="text-[15px] text-text-body leading-relaxed whitespace-pre-wrap">{announcement.content}</div>
      </div>
    </div>
  )
}
