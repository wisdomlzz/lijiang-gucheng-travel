import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { NotificationType, Notification } from "../../shared/types"

type NotificationState = {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "time" | "isRead" | "createdAt">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  getUnreadCount: () => number
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: "1",
          type: "order",
          title: "便民服务进度更新",
          summary: "您的便民服务订单已指派服务人员，请留意电话联系",
          time: "10分钟前",
          isRead: false,
          targetUrl: "/c/orders",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          type: "activity",
          title: "春日文化节开幕",
          summary: "丽江古城春日文化节将于4月25日开幕，精彩活动等您参与",
          time: "2小时前",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          type: "system",
          title: "系统升级公告",
          summary: "系统将于今晚22:00-23:00进行维护升级",
          time: "今天 14:30",
          isRead: true,
          createdAt: new Date().toISOString(),
        },
      ],
      addNotification: (n) => {
        const now = new Date()
        const time = now.toLocaleString("zh-CN")
        set((s) => ({
          notifications: [
            { ...n, id: `notif_${Date.now()}`, time, isRead: false, createdAt: now.toISOString() },
            ...s.notifications,
          ],
        }))
      },
      markAsRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) })),
      markAllAsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })) })),
      deleteNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      getUnreadCount: () => get().notifications.filter((n) => !n.isRead).length,
    }),
    { name: "notifications-store", storage: createJSONStorage(() => localStorage) }
  )
)

export type { NotificationType, Notification } from "../../shared/types"
