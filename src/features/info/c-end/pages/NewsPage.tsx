import { useState } from "react"
import { useNavigate } from "react-router"
import { ChevronRight } from "lucide-react"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"

const newsItems = [
  {
    id: "1",
    img: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=600&q=70",
    title: "古城春日文化节开幕",
    tag: "热门活动",
    tagColor: "#3B82F6",
    date: "04-25",
    summary: "丽江古城春日文化节将于4月25日盛大开幕，精彩活动等您参与",
    link: "/c/info/1",
  },
  {
    id: "2",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=70",
    title: "景区优惠券发放",
    tag: "优惠活动",
    tagColor: "#DC2626",
    date: "04-30",
    summary: "限时优惠券发放，游客专享福利，先到先得",
    link: "/c/info/3",
  },
  {
    id: "3",
    img: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=600&q=70",
    title: "纳西文化体验课",
    tag: "体验活动",
    tagColor: "#7C3AED",
    date: "每周末",
    summary: "传统文化体验，纳西文字、东巴纸制作等活动",
    link: "/c/info/4",
  },
  {
    id: "4",
    img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=70",
    title: "景区安全须知",
    tag: "公告",
    tagColor: "#F59E0B",
    date: "04-20",
    summary: "请各位游客注意游览安全，文明出行",
    link: "/c/info/7",
  },
  {
    id: "5",
    img: "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=600&q=70",
    title: "公房出租公告",
    tag: "便民公告",
    tagColor: "#0891B2",
    date: "04-12",
    summary: "丽江古城公房出租信息更新，商户可关注公开招租安排",
    link: "/c/info/9",
  },
]

export function NewsPage() {
  const navigate = useNavigate()

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

      <div className="px-3 mt-3 space-y-3 pb-24">
        {newsItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.link)}
            className="w-full bg-white rounded-2xl p-2.5 shadow-[0_4px_14px_rgba(60,120,200,0.10)] active:scale-[0.99] transition-transform text-left"
          >
            <div className="flex gap-3">
              <div className="w-[96px] h-[96px] rounded-xl overflow-hidden flex-shrink-0 relative">
                <ImageWithFallback src={item.img} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span
                  className="absolute bottom-1 left-1.5 text-[10px] text-white/95"
                  style={{ backgroundColor: item.tagColor }}
                >
                  {item.tag}
                </span>
              </div>
              <div className="flex-1 min-w-0 py-0.5 flex flex-col">
                <p className="text-[14px] text-text-body leading-snug line-clamp-2">{item.title}</p>
                <p className="text-[12px] text-text-secondary mt-1 line-clamp-2">{item.summary}</p>
                <p className="mt-auto text-[11px] text-text-tertiary">{item.date}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
