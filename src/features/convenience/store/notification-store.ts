import { create } from "zustand"
import { api } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { ListParams } from "@/api/types"

export interface NotificationItem {
  id: string
  staffId: string
  type: "new_order" | "order_cancel_request" | "cancel_approved" | "payment_received" | "order_completed" | "rating_received" | "system"
  title: string
  message: string
  orderId?: string
  isRead: number
  createdAt: string
  updatedAt?: string
}

interface NotificationState {
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean

  // actions
  setNotifications: (items: NotificationItem[], unreadCount: number) => void
  fetchNotifications: (staffId: string, params?: { isRead?: number }) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: (staffId: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  addNotification: (n: NotificationItem) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  setNotifications: (items, unreadCount) => set({ notifications: items, unreadCount }),

  fetchNotifications: async (staffId, params = {}) => {
    if (!staffId) return
    set({ loading: true })
    try {
      const query: ListParams = { staffId, pageSize: 200, ...params }
      const result: any = await api.list("notifications", query)
      set({
        notifications: result.items || [],
        unreadCount: result.unreadCount || 0,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  markRead: async (id) => {
    const { notifications, unreadCount } = get()
    // 乐观已读
    set({
      notifications: notifications.map((n) => (n.id === id ? { ...n, isRead: 1 } : n)),
      unreadCount: Math.max(0, unreadCount - 1),
    })
    const ok = await syncAction("markRead", () => api.post("notifications", `/${id}/read`), () => {})
    if (!ok) {
      // API失败→回滚
      set({
        notifications: get().notifications.map((n) => (n.id === id ? { ...n, isRead: 0 } : n)),
        unreadCount: get().unreadCount + 1,
      })
    }
  },

  markAllRead: async (staffId) => {
    if (!staffId) return
    const prev = get().notifications
    const prevUnread = get().unreadCount
    set({
      notifications: prev.map((n) => ({ ...n, isRead: 1 })),
      unreadCount: 0,
    })
    const ok = await syncAction("markAllRead", () =>
      api.post("notifications", `/read-all`, { staffId }),
      () => {}
    )
    if (!ok) {
      set({ notifications: prev, unreadCount: prevUnread })
    }
  },

  deleteNotification: async (id) => {
    const prev = get().notifications
    const prevUnread = get().unreadCount
    const deleted = prev.find((n) => n.id === id)
    set({
      notifications: prev.filter((n) => n.id !== id),
      unreadCount: deleted && !deleted.isRead ? prevUnread - 1 : prevUnread,
    })
    const ok = await syncAction("deleteNotification", () =>
      api.remove("notifications", id),
      () => {}
    )
    if (!ok) {
      set({ notifications: prev, unreadCount: prevUnread })
    }
  },

  addNotification: (n) => {
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: n.isRead ? s.unreadCount : s.unreadCount + 1,
    }))
  },
}))