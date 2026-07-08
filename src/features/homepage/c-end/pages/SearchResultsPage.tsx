import { useSearchParams, useNavigate } from "react-router"
import { ChevronLeft, Search } from "lucide-react"
import { useState } from "react"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { EmptyState } from "@/shared/components/mobile/EmptyState"
import { useContentMerchantStore } from "@/platform/content/merchant-store"
import { useContentGuideStore } from "@/platform/content/guide-store"
import { useAnnouncementStore } from "@/features/announcement/store/announcement-store"

export function SearchResultsPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const initialQ = params.get("q") || ""
  const [q, setQ] = useState(initialQ)

  const merchants = useContentMerchantStore((s) => s.merchants)
  const announcements = useAnnouncementStore((s) => s.announcements)
  const guides = useContentGuideStore((s) => s.guides)

  const keyword = q.trim().toLowerCase()
  const matchedMerchants = keyword
    ? merchants.filter(
        (m) => m.name.toLowerCase().includes(keyword) || (m.description || "").toLowerCase().includes(keyword)
      )
    : []
  const matchedAnnouncements = keyword
    ? announcements.filter(
        (a) => a.title.toLowerCase().includes(keyword) || (a.content || "").toLowerCase().includes(keyword)
      )
    : []
  const matchedRoutes = keyword
    ? guides.filter((r: any) => r.name.toLowerCase().includes(keyword) || (r.subtitle || "").toLowerCase().includes(keyword))
    : []

  const total = matchedMerchants.length + matchedAnnouncements.length + matchedRoutes.length

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed) {
      navigate(`/c/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <PageHeader title="搜索" back={() => navigate(-1)} />
      <div className="px-3 py-2">
        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white rounded-full h-10 pl-4 pr-2 shadow-card">
          <Search size={16} className="text-text-caption" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 text-[13px] text-text-heading bg-transparent outline-none placeholder:text-text-caption"
            placeholder="搜索商家、路线、资讯"
          />
        </form>
      </div>

      <div className="px-3 mt-2 pb-24">
        {keyword && total === 0 && <EmptyState title={`未找到「${q}」相关结果`} description="试试其他关键词" />}

        {matchedMerchants.length > 0 && (
          <section className="mt-3">
            <h3 className="text-[13px] font-semibold text-text-body px-1 mb-2">商家（{matchedMerchants.length}）</h3>
            <div className="space-y-2">
              {matchedMerchants.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/c/merchant/${m.id}`)}
                  className="w-full bg-white rounded-2xl p-3 shadow-card text-left active:scale-[0.99] transition-transform"
                >
                  <p className="text-[14px] font-medium text-text-heading">{m.name}</p>
                  <p className="text-[12px] text-text-tertiary mt-1 line-clamp-1">{m.description}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {matchedRoutes.length > 0 && (
          <section className="mt-4">
            <h3 className="text-[13px] font-semibold text-text-body px-1 mb-2">路线（{matchedRoutes.length}）</h3>
            <div className="space-y-2">
              {matchedRoutes.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/c/routes/${r.id}`)}
                  className="w-full bg-white rounded-2xl p-3 shadow-card text-left active:scale-[0.99] transition-transform"
                >
                  <p className="text-[14px] font-medium text-text-heading">{r.name}</p>
                  <p className="text-[12px] text-text-tertiary mt-1">{r.subtitle || r.spotNames?.join(" · ") || ""}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {matchedAnnouncements.length > 0 && (
          <section className="mt-4">
            <h3 className="text-[13px] font-semibold text-text-body px-1 mb-2">资讯（{matchedAnnouncements.length}）</h3>
            <div className="space-y-2">
              {matchedAnnouncements.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/c/announcement/${a.id}`)}
                  className="w-full bg-white rounded-xl p-3 shadow-card text-left active:scale-[0.99] transition-transform"
                >
                  <p className="text-[14px] font-medium text-text-heading">{a.title}</p>
                  <p className="text-[12px] text-text-tertiary mt-1 line-clamp-2">{(a.content || "").slice(0, 60)}...</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
