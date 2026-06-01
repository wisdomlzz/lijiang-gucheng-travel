import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { NotificationType, Notification } from "../types"

type NotificationState = {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "time" | "isRead" | "createdAt">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  getUnreadCount: () => number
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return "刚刚"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString("zh-CN")
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        { id: "1", type: "order", title: "便民服务进度更新", summary: "您的便民服务订单已指派服务人员，请留意电话联系", time: "10分钟前", isRead: false, targetUrl: "/c/orders", createdAt: new Date().toISOString() },
        { id: "2", type: "activity", title: "春日文化节开幕", summary: "丽江古城春日文化节将于4月25日开幕，精彩活动等您参与", time: "2小时前", isRead: false, createdAt: new Date().toISOString() },
        { id: "3", type: "system", title: "系统升级公告", summary: "系统将于今晚22:00-23:00进行维护升级", time: "今天 14:30", isRead: true, createdAt: new Date().toISOString() },
      ],
      addNotification: (notification) => {
        const now = new Date()
        set((s) => ({
          notifications: [
            {
              ...notification,
              id: `notif_${Date.now()}`,
              time: formatTime(now),
              isRead: false,
              createdAt: now.toISOString(),
            },
            ...s.notifications,
          ],
        }))
      },
      markAsRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        })),
      deleteNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),
      getUnreadCount: () => get().notifications.filter((n) => !n.isRead).length,
    }),
    { name: "notifications-store" }
  )
)
