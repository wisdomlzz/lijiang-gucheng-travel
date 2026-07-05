import { useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { EmptyState } from "@/shared/components/mobile/EmptyState"
import { Clock, CheckCircle, XCircle, ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useComplaintStore } from "../../store"
import { ComplaintStatusLabel } from "../../../../shared/types"
import { useSearch } from "../../../../shared/hooks/useSearch"
import { useLoadMore } from "../../../../shared/hooks/useLoadMore"

const STATUS_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string; bg: string }> = {
  C10: { label: "已提交", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  C40: { label: "已处理", icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
  CR: { label: "已驳回", icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
}

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "C10", label: "已提交" },
  { key: "C40", label: "已处理" },
  { key: "CR", label: "已驳回" },
]

export function MyComplaintsPage() {
  const navigate = useNavigate()
  const complaints = useComplaintStore((s) => s.complaints)
  const [tab, setTab] = useState("all")
  const [pageSize, setPageSize] = useState(10)

  const myComplaints = complaints.filter((c) => c.userId === "u_c_001")

  const tabFiltered = tab === "all" ? myComplaints : myComplaints.filter((c) => c.status === tab)

  const searchFn = useCallback(
    (c: (typeof tabFiltered)[0], q: string) =>
      !!(c.id.includes(q) || c.content.includes(q) || (c.targetName && c.targetName.includes(q))),
    []
  )
  const { query, setQuery, filtered: searched } = useSearch(tabFiltered, searchFn)
  const { visible, hasMore, loadMore, total } = useLoadMore(searched, 10)

  return (
    <div className="min-h-full bg-surface-page pb-20">
      <PageHeader title="我的投诉" back="/c/profile" />

      <div className="px-3 py-4 space-y-3">
        {myComplaints.length === 0 ? (
          <EmptyState title="暂无投诉记录" description="遇到问题可在此提交投诉" action={{ label: "提交投诉", onClick: () => navigate("/c/complaints/new") }} />
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] transition-colors ${
                    tab === t.key ? "bg-primary text-white" : "bg-white text-text-secondary border border-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索投诉编号或内容..."
                className="w-full h-9 pl-3 pr-3 rounded-xl border border-slate-150 bg-white text-[13px] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {total === 0 ? (
              <EmptyState title="该分类下暂无投诉" />
            ) : (
              visible.map((c) => {
                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.C10
                const Icon = cfg.icon
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm"
                    onClick={() => navigate(`/c/complaint/${c.id}`)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-medium text-text-heading truncate">
                            {c.targetName || "投诉反馈"}
                          </div>
                          <div className="text-[11px] text-text-tertiary mt-0.5">{c.id}</div>
                        </div>
                        <span
                          className={`shrink-0 ml-2 text-[11px] px-2 py-1 rounded-full flex items-center gap-1 ${cfg.bg} ${cfg.color}`}
                        >
                          <Icon size={10} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-[12px] text-text-secondary line-clamp-2 leading-relaxed">{c.content}</div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
                          <Clock size={11} />
                          {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                        </div>
                        <div className="flex items-center gap-0.5 text-[12px] text-primary">
                          查看详情
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {hasMore && (
              <button onClick={loadMore} className="w-full py-3 text-[13px] text-primary font-medium">
                加载更多
              </button>
            )}
          </>
        )}
      </div>

      {/* 浮动新增按钮 */}
      <button
        onClick={() => navigate("/c/complaint")}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-50"
        style={{ boxShadow: "0 4px 20px rgba(37, 99, 235, 0.4)" }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}
