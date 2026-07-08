import { useState } from "react"
import { useNavigate } from "react-router"
import { ChevronRight } from "lucide-react"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { useContentNewsStore } from "@/platform/content/news-store"

export function NewsPage() {
  const navigate = useNavigate()
  const newsItems = useContentNewsStore((s) => s.news)
  const [tab, setTab] = useState<string>("all")

  const categories = [...new Set(newsItems.map((n) => n.category))]
  const filtered = tab === "all" ? newsItems : newsItems.filter((n) => n.category === tab)

  return (
    <div className="min-h-screen bg-surface-page">
      <div className="relative">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1200&q=70"
          alt="banner"
          className="w-full h-[152px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#7FB6D9]/40 to-surface-page" />
        <div className="absolute top-0 left-0 right-0 flex items-center h-[52px] px-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
            <ChevronRight size={22} className="text-text-body rotate-180" />
          </button>
          <span className="flex-1 text-center text-[17px] text-text-body">古城资讯</span>
          <div className="w-9" />
        </div>
      </div>

      {/* 分类 Tab */}
      <div className="px-3 mt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {["all", ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className={`shrink-0 px-3.5 h-7 rounded-full text-[12px] font-medium transition ${
              tab === c ? "bg-primary text-white" : "bg-white text-text-secondary border border-gray-100"
            }`}
          >
            {c === "all" ? "全部" : c}
          </button>
        ))}
      </div>

      <div className="px-3 mt-3 space-y-3 pb-24">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/c/info/${item.id}`)}
            className="bg-white rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(60,60,80,0.06)] cursor-pointer active:scale-[0.98] transition-transform"
          >
            <ImageWithFallback
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-[152px] object-cover"
            />
            <div className="p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="px-1.5 py-0.5 rounded-md text-[10px] text-white font-medium"
                  style={{ background: item.tagColor }}
                >
                  {item.tag}
                </span>
                <span className="text-[11px] text-text-caption">{item.date}</span>
              </div>
              <h3 className="text-[15px] text-text-body font-medium leading-snug">{item.title}</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">{item.summary}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-text-tertiary py-16 text-[13px]">暂无资讯</div>
        )}
      </div>
    </div>
  )
}