import { useState, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import { ChevronLeft, Search } from "lucide-react"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { useAnnouncementStore } from "../../features/announcement/store"
import { useLoadMore } from "@/shared/hooks/useLoadMore"
import { Input } from "@/shared/components/ui/input"

export function AnnouncementPage() {
  const navigate = useNavigate()
  const announcements = useAnnouncementStore((s) => s.announcements)
  const [searchKeyword, setSearchKeyword] = useState("")

  const filteredList = useMemo(() => {
    return announcements
      .filter((a) => a.status === "published")
      .filter((a) => !searchKeyword || a.title.includes(searchKeyword))
      .sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime())
  }, [announcements, searchKeyword])

  const { visible, hasMore, loadMore, reset } = useLoadMore(filteredList, 10)

  const handleSearch = useCallback((value: string) => {
    setSearchKeyword(value)
    reset()
  }, [reset])

  return ( <div className="min-h-screen bg-surface-page"> <div className="relative"> <ImageWithFallback src="https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1200&q=70" alt="banner" className="w-full h-[152px] object-cover" /> <div className="absolute inset-0 bg-gradient-to-b from-[#7FB6D9]/40 to-surface-page" /> <div className="absolute top-0 left-0 right-0 flex items-center h-[52px] px-3"> <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center"> <ChevronLeft size={22} className="text-text-body" /> </button> <span className="flex-1 text-center text-[17px] text-text-body font-medium">公告通知</span> <div className="w-9" /> </div> </div> <div className="px-3 mt-3"> <div className="relative"> <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" /> <Input placeholder="搜索公告..." value={searchKeyword} onChange={(e) => handleSearch(e.target.value)} className="pl-9 h-10 bg-white" /> </div> </div> <div className="px-3 mt-3 space-y-3 pb-24"> {visible.length === 0 ? ( <div className="text-center py-12 text-text-secondary">{searchKeyword ? "未找到相关公告" : "暂无公告"}</div> ) : ( <> {visible.map((ann) => ( <button key={ann.id} onClick={() => navigate("/c/announcement/" + ann.id)} className="w-full bg-white rounded-2xl p-2.5 shadow-[0_4px_14px_rgba(60,120,200,0.10)] active:scale-[0.99] transition-transform text-left"> <div className="flex gap-3"> <div className="w-[96px] h-[96px] rounded-xl overflow-hidden flex-shrink-0 relative"> {ann.images.length > 0 ? ( <ImageWithFallback src={ann.images[0]} alt={ann.title} className="w-full h-full object-cover" /> ) : ( <div className="w-full h-full bg-gray-100 flex items-center justify-center"><span className="text-2xl">📢</span></div> )} </div> <div className="flex-1 min-w-0 py-0.5 flex flex-col"> <p className="text-[14px] text-text-body leading-snug line-clamp-2">{ann.title}</p> <p className="text-[12px] text-text-secondary mt-1 line-clamp-2">{ann.content.slice(0, 60)}...</p> <p className="mt-auto text-[11px] text-text-tertiary">{ann.publishTime ? new Date(ann.publishTime).toLocaleDateString("zh-CN") : ""}</p> </div> </div> </button> ))} {hasMore && ( <button onClick={loadMore} className="w-full py-3 text-center text-[14px] text-primary">加载更多</button> )} </> )} </div> </div> ); }