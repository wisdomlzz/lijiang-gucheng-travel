import { create } from "zustand"
import { useNotificationStore } from "@/platform/notification"
import { api } from "@/api/client"
import { syncAction } from "@/api/sync"

export interface Announcement {
  id: string
  title: string
  content: string
  images: string[]
  type: "公告"
  publishTime: string
  status: "draft" | "published" | "unpublished"
  createdAt: string
  updatedAt: string
}
export interface AddAnnouncementInput {
  title: string
  content: string
  images: string[]
  type: "公告"
}

type AnnouncementState = {
  announcements: Announcement[]
  addAnnouncement: (data: AddAnnouncementInput) => Promise<string | undefined>
  updateAnnouncement: (id: string, data: Partial<Announcement>) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>
  publishAnnouncement: (id: string) => Promise<void>
  unpublishAnnouncement: (id: string) => Promise<void>
  getAnnouncement: (id: string) => Announcement | undefined
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: [],

  addAnnouncement: async (data) => {
    const result = await syncAction<Announcement>(
      "announcement.add",
      () => api.create("announcements", { ...data, status: "draft", publishTime: "" }),
      (r) => set((s) => ({ announcements: [r, ...s.announcements] })),
    )
    return result?.id
  },

  updateAnnouncement: async (id, data) => {
    await syncAction<Announcement>(
      "announcement.update",
      () => api.update("announcements", id, data),
      (r) => set((s) => ({ announcements: s.announcements.map((a) => (a.id === id ? r : a)) })),
    )
  },

  deleteAnnouncement: async (id) => {
    await syncAction(
      "announcement.delete",
      () => api.remove("announcements", id),
      () => set((s) => ({ announcements: s.announcements.filter((a) => a.id !== id) })),
    )
  },

  publishAnnouncement: async (id) => {
    const result = await syncAction<Announcement>(
      "announcement.publish",
      () => api.update("announcements", id, { status: "published", publishTime: new Date().toISOString() }),
      (r) => set((s) => ({ announcements: s.announcements.map((a) => (a.id === id ? r : a)) })),
    )
    if (result) {
      useNotificationStore.getState().addNotification({
        type: "system",
        title: "新公告",
        summary: result.title,
        targetUrl: `/c/announcement/${id}`,
      })
    }
  },

  unpublishAnnouncement: async (id) => {
    await syncAction<Announcement>(
      "announcement.unpublish",
      () => api.update("announcements", id, { status: "unpublished" }),
      (r) => set((s) => ({ announcements: s.announcements.map((a) => (a.id === id ? r : a)) })),
    )
  },

  getAnnouncement: (id) => get().announcements.find((a) => a.id === id),
}))