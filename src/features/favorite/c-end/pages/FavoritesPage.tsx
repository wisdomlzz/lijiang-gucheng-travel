import { useState } from "react"
import { useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { EmptyState } from "@/shared/components/mobile/EmptyState"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { useFavoriteStore } from "@/features/favorite/store"
import type { FavoriteItem } from "@/features/favorite/store"
import { Trash2, Store, Map, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { useLoadMore } from "@/shared/hooks/useLoadMore"

type Tab = "all" | "merchant" | "route" | "article"

const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "merchant", label: "商家" },
  { key: "route", label: "线路" },
  { key: "article", label: "文章" },
]

const typeIcon: Record<string, React.ReactNode> = {
  merchant: <Store size={12} />,
  route: <Map size={12} />,
  article: <BookOpen size={12} />,
}

export function FavoritesPage() {
  const navigate = useNavigate()
  const favorites = useFavoriteStore((s) => s.favorites)
  const { remove } = useFavoriteStore.getState()
  const [tab, setTab] = useState<Tab>("all")

  const filtered = tab === "all" ? favorites : favorites.filter((f) => f.type === tab)
  const { visible, hasMore, loadMore } = useLoadMore(filtered, 6)

  const handleItemClick = (item: FavoriteItem) => {
    if (item.type === "merchant") navigate(`/c/merchant/${item.itemId}`)
    else if (item.type === "route") navigate(`/c/routes/${item.itemId}`)
    else navigate(`/c/info/${item.itemId}`)
  }

  return (
    <div className="min-h-full bg-surface-page">
      <PageHeader title="我的收藏" back="/c/profile" />

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-surface-page px-3 pt-2 pb-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap ${tab === t.key ? "bg-primary text-white" : "bg-white text-text-secondary"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-3 pb-6 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <EmptyState title="暂无收藏" description="去首页发现感兴趣的内容吧" />
          </div>
        ) : (
          <>
            {visible.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                <button
                  onClick={() => handleItemClick(item)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <div className="w-14 h-14 rounded-lg bg-surface-page flex items-center justify-center flex-shrink-0">
                    <ImageWithFallback
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-text-body line-clamp-1">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-surface-page rounded text-text-tertiary">
                        {{ merchant: "商家", route: "线路", article: "文章" }[item.type]}
                      </span>
                      {item.price && <span className="text-[12px] text-primary">¥{item.price}</span>}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    remove(item.id)
                    toast.success("已取消收藏")
                  }}
                  className="p-2 text-text-tertiary hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full h-10 rounded-full border border-primary text-primary text-[13px] mt-2"
              >
                加载更多
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
