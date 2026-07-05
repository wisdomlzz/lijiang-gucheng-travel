import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router"
import { User, ChevronRight } from "lucide-react"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { EmptyState } from "@/shared/components/mobile/EmptyState"
import { useConvenienceStore } from "@/features/convenience/store"
import { useAuthStore } from "@/platform/auth"
import { useSearch } from "@/shared/hooks/useSearch"
import { useLoadMore } from "@/shared/hooks/useLoadMore"
import { CONVENIENCE_STATUS_META, matchConvenienceFilter } from "@/features/convenience/shared/convenience-meta"
import { resolveStaff } from "@/shared/orders/staff"

type ConvenienceFilter = "all" | "pending" | "completed" | "cancelled"

const convenienceFilters: { key: ConvenienceFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
]

function getServiceEmoji(type: string): string {
  if (type.includes("垃圾")) return "🗑️"
  if (type.includes("行李")) return "🧳"
  if (type.includes("水")) return "💧"
  if (type.includes("布草")) return "🧺"
  if (type.includes("送货")) return "📦"
  return "🔧"
}

export function OrderListPage() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const [convenienceFilter, setConvenienceFilter] = useState<ConvenienceFilter>("all")

  const convenienceOrders = useConvenienceStore((s) => s.orders)
  const userOrders = useMemo(
    () => convenienceOrders.filter((o) => !userId || o.userId === userId),
    [convenienceOrders, userId]
  )
  const convenienceFiltered = useMemo(
    () => userOrders.filter((o) => matchConvenienceFilter(o.status, convenienceFilter)),
    [userOrders, convenienceFilter]
  )

  const searchFn = useCallback(
    (o: (typeof convenienceFiltered)[0], q: string) =>
      !!(o.id.includes(q) || (o.address && o.address.includes(q)) || (o.addressTo && o.addressTo.includes(q))),
    []
  )
  const { query, setQuery, filtered: searched } = useSearch(convenienceFiltered, searchFn)
  const { visible, hasMore, loadMore, total } = useLoadMore(searched, 6)

  return (
    <div className="bg-surface-page min-h-full">
      <PageHeader title="便民服务订单" />

      <div className="sticky top-12 z-10 bg-white flex border-b border-border-light">
        {convenienceFilters.map((f) => (
          <button key={f.key} onClick={() => setConvenienceFilter(f.key)} className="flex-1 relative py-2.5">
            <span className={`text-[12px] ${convenienceFilter === f.key ? "text-primary" : "text-text-secondary"}`}>
              {f.label}
            </span>
            {convenienceFilter === f.key && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-3">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索订单号或地址..."
            className="w-full h-9 pl-3 pr-3 rounded-xl border border-slate-150 bg-white text-[13px] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {total === 0 && (
          <EmptyState title="暂无便民服务订单" action={{ label: "去下单", onClick: () => navigate("/c/services") }} />
        )}

        {visible.map((o) => {
          const status = CONVENIENCE_STATUS_META[o.status as keyof typeof CONVENIENCE_STATUS_META] || {
            label: "未知",
            color: "text-text-secondary",
            bg: "bg-[#F3F4F6]",
          }
          return (
            <button
              key={o.id}
              onClick={() => navigate(`/c/orders/${o.id}`)}
              className="w-full bg-white rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform"
            >
              <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-surface-page to-primary-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[16px] shrink-0">{getServiceEmoji(o.serviceType)}</span>
                  <span className="text-[14px] text-text-body font-medium truncate">{o.serviceType}</span>
                </div>
                <span className={`text-[11px] ${status.color} ${status.bg} px-2 py-0.5 rounded-full shrink-0`}>
                  {status.label}
                </span>
              </div>

              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-text-secondary">订单号</span>
                  <span className="text-[12px] text-text-body">{o.id}</span>
                </div>
                {o.address && (
                  <div className="flex items-start justify-between">
                    <span className="text-[12px] text-text-secondary">服务地址</span>
                    <span className="text-[12px] text-text-body max-w-[180px] text-right">{o.address}</span>
                  </div>
                )}
                {o.addressTo && (
                  <div className="flex items-start justify-between">
                    <span className="text-[12px] text-text-secondary">终点地址</span>
                    <span className="text-[12px] text-text-body max-w-[180px] text-right">{o.addressTo}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-text-secondary">下单时间</span>
                  <span className="text-[12px] text-text-body">{o.createdAt}</span>
                </div>
              </div>

              {o.staffId && (
                <div className="px-4 py-3 border-t border-border-light flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-primary" />
                    <span className="text-[12px] text-text-secondary">服务人员</span>
                  </div>
                  <span className="text-[12px] text-text-body">{resolveStaff(o.staffId)?.name || "已派单"}</span>
                </div>
              )}

              <div className="px-4 py-3 border-t border-border-light flex items-center justify-center text-[13px] text-primary">
                查看详情 <ChevronRight size={14} />
              </div>
            </button>
          )
        })}

        {hasMore && (
          <button onClick={loadMore} className="w-full py-3 text-[13px] text-primary font-medium">
            加载更多
          </button>
        )}
      </div>
    </div>
  )
}
