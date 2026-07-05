import { useState, useRef, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { ChevronLeft, ChevronRight, MapPin, FileText, X, Expand, Share2 } from "lucide-react"
import { HeritageItem, heritageTypeMeta } from "@/features/heritage/shared/types"
import { HeritageMap } from "@/features/heritage/c-end/components/HeritageMap"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"

/* ────────── 字段行（所有类型通用） ────────── */
export function FieldRow({ label, value }: { label: string; value: string | string[] | boolean | undefined }) {
  if (value === undefined || value === null || value === "") return null
  const display = typeof value === "boolean" ? (value ? "是" : "否") : Array.isArray(value) ? value.join("、") : value
  return (
    <div className="flex items-start justify-between py-3 border-b border-border-light/60 last:border-0">
      <span className="text-[13px] text-text-tertiary shrink-0 w-24">{label}</span>
      <span className="text-[13px] text-text-body text-right flex-1 ml-4">{display}</span>
    </div>
  )
}

/* ────────── 图片全屏浏览 Modal ────────── */
function PhotoViewer({ photos, index, onClose }: { photos: string[]; index: number; onClose: () => void }) {
  const [idx, setIdx] = useState(index)
  const prev = () => setIdx((i) => (i === 0 ? photos.length - 1 : i - 1))
  const next = () => setIdx((i) => (i === photos.length - 1 ? 0 : i + 1))

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={onClose}>
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-12 pb-4 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center">
          <X size={24} className="text-white" />
        </button>
        <span className="text-white text-[14px] font-medium">
          {idx + 1} / {photos.length}
        </span>
        <div className="w-10" />
      </div>

      {/* 图片 */}
      <div className="flex-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img src={photos[idx]} alt="" className="max-w-full max-h-full object-contain" draggable={false} />
      </div>

      {/* 切换按钮 */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* 底部页码 */}
      {photos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ────────── 图片轮播（沉浸式） ────────── */
function PhotoCarousel({
  photos,
  alt,
  onPhotoClick,
}: {
  photos: string[]
  alt: string
  onPhotoClick: (index: number) => void
}) {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) setIdx((i) => Math.min(i + 1, photos.length - 1))
      else setIdx((i) => Math.max(i - 1, 0))
    }
  }

  if (photos.length === 0) return null

  return (
    <div
      className="relative w-full aspect-[4/3] overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img src={photos[idx]} alt={`${alt} - ${idx + 1}`} className="w-full h-full object-cover" draggable={false} />
      {/* 渐变叠加 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-2">
        <button
          onClick={() => onPhotoClick(idx)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white"
        >
          <Expand size={18} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white">
          <Share2 size={18} />
        </button>
      </div>

      {/* 页码指示器 */}
      {photos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation()
                setIdx(i)
              }}
              className={`w-6 h-1 rounded-full transition-all ${i === idx ? "bg-white w-8" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}

      {/* 左右半区点击切换 */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIdx((i) => Math.max(i - 1, 0))
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-full"
          />
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIdx((i) => Math.min(i + 1, photos.length - 1))
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-full"
          />
        </>
      )}
    </div>
  )
}

/* ────────── 详情页布局 ────────── */
interface HeritageDetailLayoutProps {
  item: HeritageItem
  children?: ReactNode
  /** 类型专属的字段内容（放在信息卡片内） */
  fields?: ReactNode
}

export function HeritageDetailLayout({ item, fields }: HeritageDetailLayoutProps) {
  const navigate = useNavigate()
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const meta = heritageTypeMeta[item.type]

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  return (
    <div className="min-h-full bg-surface-page flex flex-col relative">
      {/* 沉浸式图片轮播 */}
      <PhotoCarousel photos={item.photos} alt={item.name} onPhotoClick={openViewer} />

      {/* 浮动返回按钮 */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-2 left-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white"
      >
        <ChevronLeft size={22} />
      </button>

      {/* 全屏查看器 */}
      {viewerOpen && <PhotoViewer photos={item.photos} index={viewerIndex} onClose={() => setViewerOpen(false)} />}

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto -mt-6 rounded-t-3xl bg-surface-page relative z-10">
        <div className="px-4 pt-5 pb-8 space-y-4">
          {/* ===== 标题区域 ===== */}
          <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <h1 className="text-[20px] font-semibold text-text-heading leading-tight">{item.name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-[11px] px-3 py-1.5 rounded-full bg-primary-50 text-primary font-medium">
                {item.area}
              </span>
              <span className="text-[11px] px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                {meta?.label}
              </span>
              {item.heritageSubType && (
                <span className="text-[11px] px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                  {item.heritageSubType}
                </span>
              )}
              {item.preservationStatus && (
                <span className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                  {item.preservationStatus}
                </span>
              )}
            </div>
            {item.basicInfo && <p className="text-[14px] text-text-secondary mt-3 leading-relaxed">{item.basicInfo}</p>}
          </div>

          {/* ===== 类型专属字段 ===== */}
          {fields && (
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <h3 className="text-[14px] font-medium text-text-body mb-3 flex items-center gap-2">
                <span className="w-1 h-3.5 bg-primary rounded-full" />
                详细信息
              </h3>
              {fields}
            </div>
          )}

          {/* ===== 位置与地图 ===== */}
          {item.location && item.location.lat > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              {item.address && (
                <div className="px-5 pt-4 pb-2 flex items-start gap-2.5">
                  <MapPin size={15} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-[14px] text-text-body">{item.address}</span>
                </div>
              )}
              <div className="px-0 pb-0">
                <HeritageMap lat={item.location.lat} lng={item.location.lng} name={item.name} address={item.address} />
              </div>
            </div>
          )}

          {/* ===== 图纸资料 ===== */}
          {item.drawings && item.drawings.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <h3 className="text-[14px] font-medium text-text-body mb-3 flex items-center gap-2">
                <span className="w-1 h-3.5 bg-primary rounded-full" />
                图纸资料
              </h3>
              <div className="space-y-2.5">
                {item.drawings.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 text-[13px] text-primary bg-primary-50/50 rounded-xl px-3.5 py-2.5"
                  >
                    <FileText size={15} />
                    <span className="truncate">{d.split(/[\\/]/).pop()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== 文字介绍 ===== */}
          {item.description && (
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <h3 className="text-[14px] font-medium text-text-body mb-3 flex items-center gap-2">
                <span className="w-1 h-3.5 bg-primary rounded-full" />
                文字介绍
              </h3>
              <p className="text-[14px] text-text-secondary leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
