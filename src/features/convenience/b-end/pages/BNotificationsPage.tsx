import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router"
import { Package, Gift, Volume2, Trash2, Bell, ChevronRight, Clock, X } from "lucide-react"
import { toast } from "sonner"
import { useSearch } from "@/shared/hooks/useSearch"
import { useLoadMore } from "@/shared/hooks/useLoadMore"
import { useNotificationStore } from "../../store/notification-store"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { useAuthStore } from "@/platform/auth"
import type { NotificationItem } from "../../store/notification-store"

type FilterTab = "all" | "unread" | "order"

const TYPE_ICONS = {
  new_order: Package,
  order_cancel_request: Package,
  cancel_approved: Package,
  payment_received: Gift,
  order_completed: Package,
  rating_received: Gift,
  system: Volume2,
}

const TYPE_COLORS = {
  new_order: "#F59E0B",
  order_cancel_request: "#EF4444",
  cancel_approved: "#10B981",
  payment_received: "#22C55E",
  order_completed: "#3B82F6",
  rating_received: "#8B5CF6",
  system: "#6366F1",
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    new_order: "新派单",
    order_cancel_request: "取消申请",
    cancel_approved: "取消通知",
    payment_received: "收款通知",
    order_completed: "完成通知",
    rating_received: "评价通知",
    system: "系统公告",
  }
  return labels[type] || "通知"
}

export function BNotificationsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const staffId = currentUser?.staffId ?? ""
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotificationStore()

  const [filterTab, setFilterTab] = useState<FilterTab>("all")
  const [openId, setOpenId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  // 首次加载 & 切换用户时拉取
  useEffect(() => {
    if (staffId) fetchNotifications(staffId)
  }, [staffId, fetchNotifications])

  // 筛选
  const filtered = useMemo(() => {
    let list = notifications
    if (filterTab === "unread") list = list.filter((n) => !n.isRead)
    if (filterTab === "order") list = list.filter((n) => n.type !== "system")
    return list
  }, [notifications, filterTab])

  const searchFn = useCallback((item: NotificationItem, query: string) => {
    const q = query.toLowerCase()
    return item.title.toLowerCase().includes(q) || item.message.toLowerCase().includes(q)
  }, [])

  const { query, setQuery, filtered: searched } = useSearch(filtered, searchFn)
  const { visible, hasMore, loadMore } = useLoadMore(searched, 20)

  // 详情通知
  const detailItem = detailId ? notifications.find((n) => n.id === detailId) ?? null : null

  // 点击 → 标记已读 + 打开详情
  const handleOpenDetail = (item: NotificationItem) => {
    if (!item.isRead) markRead(item.id)
    setDetailId(item.id)
  }

  // 删除
  const handleDelete = (id: string) => {
    deleteNotification(id)
    setOpenId(null)
    toast.success("已删除")
  }

  // 全量已读
  const handleMarkAllRead = () => {
    markAllRead(staffId)
    toast.success("已全部标为已读")
  }

  const filterCounts = {
    all: notifications.length,
    unread: unreadCount,
    order: notifications.filter((n) => n.type !== "system").length,
  }

  return (
    <div className="min-h-full bg-surface-page flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-page/85 backdrop-blur-xl pt-3 pb-2 px-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[18px]">消息中心</h1>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-[13px] text-primary active:opacity-60">
              全部已读
            </button>
          )}
        </div>

        {/* 筛选 tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar mb-2">
          {(["all", "unread", "order"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setFilterTab(t); setQuery("") }}
              className={`shrink-0 px-3 h-7 rounded-full text-[12px] transition ${
                filterTab === t
                  ? "text-white shadow-[0_2px_8px_rgba(245,158,11,0.28)]"
                  : "bg-white text-text-secondary"
              }`}
              style={filterTab === t ? { background: "#F59E0B" } : {}}
            >
              {t === "all" ? "全部" : t === "unread" ? "未读" : "订单通知"}
              {` ${filterCounts[t]}`}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索消息..."
            className="w-full h-9 pl-3 pr-3 rounded-xl border border-slate-150 bg-white text-[13px] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 mt-2">
        {loading && notifications.length === 0 ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-3/4 rounded-xl" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-text-tertiary">
            <Bell size={48} className="opacity-40 mb-3" />
            <p className="text-[14px]">{query ? "没有匹配的消息" : "暂无消息"}</p>
          </div>
        ) : (
          visible.map((item) => {
            const Icon = TYPE_ICONS[item.type] || Volume2
            const color = TYPE_COLORS[item.type] || "#64748B"
            const isOpen = openId === item.id
            return (
              <div key={item.id} className="relative overflow-hidden rounded-xl">
                {isOpen && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute right-0 top-0 bottom-0 w-14 bg-[#EF4444] flex items-center justify-center z-10 rounded-r-xl active:opacity-80"
                  >
                    <Trash2 size={18} className="text-white" />
                  </button>
                )}
                <div
                  onClick={() => {
                    if (isOpen) { setOpenId(null); return }
                    handleOpenDetail(item)
                  }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0]
                    if (touch.clientX < 50) setOpenId(item.id)
                  }}
                  className={`bg-white p-3 flex items-start gap-3 rounded-xl transition-transform cursor-pointer active:opacity-80 ${
                    isOpen ? "-translate-x-14" : ""
                  } ${!item.isRead ? "border-l-[3px]" : ""}`}
                  style={!item.isRead ? { borderLeftColor: color } : {}}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3
                        className={`text-[14px] leading-tight ${!item.isRead ? "font-semibold text-text-body" : "text-text-secondary"}`}
                      >
                        {item.title}
                      </h3>
                      <span className="text-[10px] text-text-tertiary flex-shrink-0 whitespace-nowrap">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    {!item.isRead && (
                      <div className="mb-1 inline-block">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                          style={{ background: color }}
                        >
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                    )}
                    <p className="text-[12px] text-text-tertiary line-clamp-2 mt-0.5">{item.message}</p>
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
      </div>

      {/* 通知详情弹窗 */}
      {detailItem && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div
            className="w-full sm:w-[380px] bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
            style={{ maxHeight: "70vh" }}
          >
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h2 className="text-[16px] font-medium text-text-heading">消息详情</h2>
              <button
                onClick={() => setDetailId(null)}
                className="size-7 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="size-4 text-text-tertiary" />
              </button>
            </div>
            <div className="px-4 pb-1">
              <span
                className="inline-block text-[11px] px-2 py-0.5 rounded-full text-white"
                style={{ background: TYPE_COLORS[detailItem.type] || "#64748B" }}
              >
                {getTypeLabel(detailItem.type)}
              </span>
            </div>
            <div className="px-4 py-3">
              <h3 className="text-[15px] font-medium text-text-heading">{detailItem.title}</h3>
              <div className="mt-2 text-[13px] text-text-body leading-relaxed">{detailItem.message}</div>
              <div className="mt-3 flex items-center gap-1 text-[11px] text-text-tertiary">
                <Clock className="size-3" />
                {detailItem.createdAt}
              </div>
            </div>
            {/* 关联订单 */}
            {detailItem.orderId && (
              <div className="mx-4 mb-4">
                <button
                  onClick={() => {
                    setDetailId(null)
                    navigate("/b/service/tasks")
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-primary-50/60 text-[13px] text-primary"
                >
                  查看关联订单 {detailItem.orderId}
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
            <div className="px-4 pb-5">
              <button
                onClick={() => {
                  if (!detailItem.isRead) markRead(detailItem.id)
                  setDetailId(null)
                }}
                className="w-full h-11 rounded-2xl bg-primary text-white text-[14px] font-medium"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatTime(iso: string) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return "刚刚"
    if (diffMin < 60) return `${diffMin}分钟前`
    if (diffHour < 24) return `${diffHour}小时前`
    if (diffDay < 7) return `${diffDay}天前`
    return iso.slice(5, 16)
  } catch {
    return iso
  }
}