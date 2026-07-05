import { useState, useCallback } from "react"
import { Package, Gift, Volume2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useSearch } from "@/shared/hooks/useSearch"
import { useLoadMore } from "@/shared/hooks/useLoadMore"

type NotificationType = "order" | "system" | "staff"

interface BNotification {
  id: string
  type: NotificationType
  title: string
  summary: string
  time: string
  isRead: boolean
}

const MOCK_B_NOTIFICATIONS: BNotification[] = [
  {
    id: "1",
    type: "order",
    title: "新订单提醒",
    summary: "您有1笔待处理订单，请尽快确认",
    time: "5分钟前",
    isRead: false,
  },
  {
    id: "2",
    type: "order",
    title: "价格确认提醒",
    summary: "用户已收到报价，请留意后续支付状态",
    time: "15分钟前",
    isRead: false,
  },
  {
    id: "3",
    type: "system",
    title: "系统升级公告",
    summary: "系统将于今晚22:00-23:00进行维护升级",
    time: "今天 14:30",
    isRead: true,
  },
  {
    id: "4",
    type: "order",
    title: "服务完成确认",
    summary: "订单 CO20260509000 已由用户确认完成",
    time: "今天 09:42",
    isRead: true,
  },
  { id: "5", type: "staff", title: "服务人员状态变更", summary: "张师傅已上线接单", time: "昨天 18:20", isRead: true },
]

const typeConfig = {
  order: { icon: Package, color: "#3B82F6" },
  system: { icon: Volume2, color: "#6366F1" },
  staff: { icon: Gift, color: "#8B5CF6" },
}

export function BNotificationsPage() {
  const [notifications, setNotifications] = useState<BNotification[]>(MOCK_B_NOTIFICATIONS)
  const [openId, setOpenId] = useState<string | null>(null)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const searchFn = useCallback((item: BNotification, query: string) => {
    const q = query.toLowerCase()
    return item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q)
  }, [])

  const { query, setQuery, filtered } = useSearch(notifications, searchFn)
  const { visible, hasMore, loadMore, total } = useLoadMore(filtered, 10)

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setOpenId(null)
    toast.success("已删除")
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast.success("已全部标记为已读")
  }

  const handleCardClick = (item: BNotification) => {
    if (!item.isRead) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)))
    }
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
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索消息..."
            className="w-full h-9 pl-3 pr-3 rounded-xl border border-slate-150 bg-white text-[13px] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2 mt-2">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-text-tertiary">
            <Volume2 size={48} className="opacity-40 mb-3" />
            <p className="text-[14px]">{query ? "没有匹配的消息" : "暂无消息"}</p>
          </div>
        ) : (
          visible.map((item) => {
            const config = typeConfig[item.type]
            const Icon = config.icon
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
                    handleCardClick(item)
                    if (isOpen) {
                      setOpenId(null)
                    }
                  }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0]
                    if (touch.clientX < 50) setOpenId(item.id)
                  }}
                  className={`bg-white p-3 flex items-start gap-3 rounded-xl transition-transform ${
                    isOpen ? "-translate-x-14" : ""
                  } ${!item.isRead ? "border-l-[3px] border-l-primary" : ""}`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    <Icon size={18} style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3
                        className={`text-[14px] ${!item.isRead ? "font-medium text-text-body" : "text-text-secondary"}`}
                      >
                        {item.title}
                      </h3>
                      <span className="text-[11px] text-text-tertiary flex-shrink-0">{item.time}</span>
                    </div>
                    <p className="text-[12px] text-text-tertiary line-clamp-1">{item.summary}</p>
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
    </div>
  )
}
