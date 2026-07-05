import { ChevronRight } from "lucide-react"
import { useNavigate } from "react-router"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { TypeBadge } from "@/shared/components/mobile/TypeBadge"

interface InfoListItemProps {
  announcement: {
    id: string
    title: string
    content: string
    images: string[]
    type: string
    publishTime: string
  }
}

export function InfoListItem({ announcement: ann }: InfoListItemProps) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/c/announcement/${ann.id}`)}
      className="w-full bg-white rounded-xl overflow-hidden shadow-card flex items-center active:scale-[0.99] transition-transform text-left"
    >
      <div className="relative w-24 h-24 flex-shrink-0">
        {ann.images.length > 0 ? (
          <ImageWithFallback src={ann.images[0]} alt={ann.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <span className="text-2xl">📢</span>
          </div>
        )}
        <TypeBadge type={ann.type} title={ann.title} />
      </div>
      <div className="flex-1 p-3 min-w-0">
        <p className="text-[14px] font-medium text-text-heading line-clamp-1">{ann.title}</p>
        <p className="text-[12px] text-text-secondary mt-1 line-clamp-2">{ann.content.slice(0, 42)}...</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-text-tertiary">
            {ann.publishTime ? new Date(ann.publishTime).toLocaleDateString("zh-CN") : ""}
          </span>
          <span className="text-[11px] text-sky-deep font-medium flex items-center gap-0.5">
            查看详情 <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </button>
  )
}
