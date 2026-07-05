import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { Package, Gift, Volume2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { EmptyState } from "@/shared/components/mobile/EmptyState"
import { useNotificationStore, type NotificationType } from "@/platform/notification"
import { useLoadMore } from "@/shared/hooks/useLoadMore"

// J10: 实时消息推送类型
type RealtimeNotificationTemplate = {
  type: "order" | "activity" | "system"
  title: string
  summary: string
  targetUrl?: string
}

const realtimeNotificationTemplates: RealtimeNotificationTemplate[] = [
  {
    type: "order",
    title: "便民服务进度更新",
    summary: "您的便民服务订单已更新，请查看服务进度",
    targetUrl: "/c/orders",
  },
  {
    type: "order",
    title: "服务人员已接单",
    summary: "服务人员已接单，稍后会按约定时间上门服务",
    targetUrl: "/c/orders",
  },
  { type: "system", title: "积分变动提醒", summary: "您有200积分即将在30天内过期，请及时使用" },
  { type: "activity", title: "古城资讯更新", summary: "古城资讯与便民信息已有新公告" },
  { type: "order", title: "评价提醒", summary: "您有未评价的便民服务订单" },
]

const typeConfig = {
  order: { icon: Package, color: "#3B82F6" },
  activity: { icon: Gift, color: "#8B5CF6" },
  system: { icon: Volume2, color: "#6366F1" },
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"all" | NotificationType>("all")
  const notifications = useNotificationStore((s) => s.notifications)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const deleteNotification = useNotificationStore((s) => s.deleteNotification)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const [openId, setOpenId] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)

  // J10: 实时消息推送模拟
  useEffect(() => {
    // 模拟每30秒收到一条新通知
    const interval = setInterval(() => {
      const template = realtimeNotificationTemplates[Math.floor(Math.random() * realtimeNotificationTemplates.length)]
      addNotification(template)
      // 显示 Toast 推送通知
      toast(`${template.title}: ${template.summary}`, {
        duration: 5000,
        action: template.targetUrl
          ? {
              label: "查看",
              onClick: () => navigate(template.targetUrl!),
            }
          : undefined,
      })
    }, 30000) // 30秒触发一次（实际场景应为长连接推送）

    return () => clearInterval(interval)
  }, [navigate, addNotification])

  const filtered = activeTab === "all" ? notifications : notifications.filter((n) => n.type === activeTab)
  const { visible, hasMore, loadMore } = useLoadMore(filtered, 10)
  const unreadCount = (type?: NotificationType) =>
    notifications.filter((n) => !n.isRead && (type ? n.type === type : true)).length

  const handleSwipeStart = (id: string, clientX: number) => {
    setOpenId(id)
    setStartX(clientX)
  }

  const handleSwipeEnd = (clientX: number) => {
    const diff = startX - clientX
    if (diff < 50) {
      setOpenId(null)
    }
  }

  const handleCardClick = (
    item: { id: string; targetUrl?: string; isRead: boolean; type: NotificationType },
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    if (!item.isRead) {
      markAsRead(item.id)
    }
    if (item.targetUrl) {
      navigate(item.targetUrl)
    }
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification(id)
    setOpenId(null)
    toast.success("已删除")
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
    toast.success("已全部标记为已读")
  }

  const tabs = [
    { key: "all" as const, label: "全部", count: unreadCount() },
    { key: "order" as const, label: "订单", count: unreadCount("order") },
    { key: "activity" as const, label: "活动", count: unreadCount("activity") },
    { key: "system" as const, label: "系统", count: unreadCount("system") },
  ]

  return (
    <div className="min-h-full bg-surface-page flex flex-col">
      <PageHeader title="消息通知" back="/c/home" />

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-border-light">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 h-11 text-[13px] relative flex items-center justify-center gap-1"
              >
                <span className={activeTab === tab.key ? "text-primary font-medium" : "text-text-secondary"}>
                  {tab.label}
                </span>
                {tab.count > 0 && (
                  <span className="min-w-[14px] h-[14px] px-1 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" onClick={() => setOpenId(null)}>
          {filtered.length === 0 ? (
              <EmptyState title="暂无消息" />
          ) : (
            <>
              <div className="p-4 space-y-2">
                {visible.map((item) => {
                  const config = typeConfig[item.type]
                  const Icon = config.icon
                  const isOpen = openId === item.id
                  return (
                    <div key={item.id} className="relative overflow-hidden rounded-xl">
                      {isOpen && (
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="absolute right-0 top-0 bottom-0 w-14 bg-[#EF4444] flex items-center justify-center z-10 rounded-r-xl active:opacity-80"
                        >
                          <Trash2 size={18} className="text-white" />
                        </button>
                      )}
                      <div
                        onClick={(e) => handleCardClick(item, e)}
                        onTouchStart={(e) => handleSwipeStart(item.id, e.touches[0].clientX)}
                        onTouchEnd={(e) => handleSwipeEnd(e.changedTouches[0].clientX)}
                        onMouseDown={(e) => handleSwipeStart(item.id, e.clientX)}
                        onMouseUp={(e) => handleSwipeEnd(e.clientX)}
                        className={`relative bg-white p-3 flex items-start gap-3 rounded-xl transition-transform ${isOpen ? "-translate-x-14" : ""} ${!item.isRead ? "border-l-[3px] border-l-primary" : ""}`}
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
                              className={`text-[14px] text-text-body ${!item.isRead ? "font-medium" : "text-text-secondary"}`}
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
                })}
              </div>
              {hasMore && (
                <div className="px-4 pb-4">
                  <button onClick={loadMore} className="w-full py-3 text-[13px] text-primary font-medium">
                    加载更多
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
