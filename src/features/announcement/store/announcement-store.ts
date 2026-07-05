import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { useNotificationStore } from "@/platform/notification"

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

const SEED: Announcement[] = [
  {
    id: "ann-1",
    title: "古城游览安全提醒",
    content:
      "温馨提示各位游客：\n1. 游览时请注意人身财产安全\n2. 妥善保管贵重物品\n3. 夜间行走请选择明亮路段\n4. 如遇紧急情况请联系：0888-5110110",
    images: ["https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=70"],
    type: "公告",
    publishTime: "2024-04-10T08:00:00Z",
    status: "published",
    createdAt: "2024-04-10T08:00:00Z",
    updatedAt: "2024-04-10T08:00:00Z",
  },
  {
    id: "ann-2",
    title: "古城特产对外销售备案申请通道开放",
    content:
      "为规范古城特产销售市场，保障消费者权益，现已开通线上备案申请通道。\n\n备案范围：丽江特色产品、民族工艺品等\n备案流程：线上提交资料 → 审核 → 领取备案证明\n\n详情请咨询：0888-5123456",
    images: [],
    type: "公告",
    publishTime: "2024-04-15T09:00:00Z",
    status: "published",
    createdAt: "2024-04-14T10:00:00Z",
    updatedAt: "2024-04-15T09:00:00Z",
  },
  {
    id: "ann-3",
    title: "古城水系清淤维护通知",
    content:
      "为保障古城水系清洁，营造良好游览环境，我局将对古城核心区水系进行清淤维护。\n\n施工时间：4月20日至4月25日\n施工范围：四方街至玉河广场段\n\n请各位游客合理安排游览路线，施工期间给您带来的不便敬请谅解。",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1590674899484-d5640f854c2d?auto=format&fit=crop&w=800&q=70",
    ],
    type: "公告",
    publishTime: "2024-04-12T08:00:00Z",
    status: "published",
    createdAt: "2024-04-11T16:00:00Z",
    updatedAt: "2024-04-12T08:00:00Z",
  },
  {
    id: "ann-4",
    title: "五一假期旅游攻略",
    content:
      "五一假期将至，为您准备了一份详细的古城游玩攻略。\n\n推荐路线：大水车 → 四方街 → 木府 → 狮子山 → 束河古镇\n\n美食推荐：丽江腊排骨、纳西烤鱼、鸡豆凉粉\n\n住宿建议：建议提前预订古城内客栈",
    images: [
      "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70",
    ],
    type: "公告",
    publishTime: "2024-04-08T10:00:00Z",
    status: "published",
    createdAt: "2024-04-08T10:00:00Z",
    updatedAt: "2024-04-08T10:00:00Z",
  },
]

type AnnouncementState = {
  announcements: Announcement[]
  addAnnouncement: (data: AddAnnouncementInput) => string
  updateAnnouncement: (id: string, data: Partial<Announcement>) => void
  deleteAnnouncement: (id: string) => void
  publishAnnouncement: (id: string) => void
  unpublishAnnouncement: (id: string) => void
  getAnnouncement: (id: string) => Announcement | undefined
}

export const useAnnouncementStore = create<AnnouncementState>()(
  persist(
    (set, get) => ({
      announcements: SEED,
      addAnnouncement: (data) => {
        const id = `ann-${Date.now()}`
        const now = new Date().toISOString()
        set((s) => ({
          announcements: [
            ...s.announcements,
            { ...data, id, status: "draft", publishTime: "", createdAt: now, updatedAt: now },
          ],
        }))
        return id
      },
      updateAnnouncement: (id, data) =>
        set((s) => ({
          announcements: s.announcements.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
          ),
        })),
      deleteAnnouncement: (id) => set((s) => ({ announcements: s.announcements.filter((a) => a.id !== id) })),
      publishAnnouncement: (id) => {
        set((s) => ({
          announcements: s.announcements.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "published",
                  publishTime: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : a
          ),
        }))

        const ann = get().announcements.find((a) => a.id === id)
        if (ann) {
          useNotificationStore.getState().addNotification({
            type: "system",
            title: "新公告",
            summary: ann.title,
            targetUrl: `/c/announcement/${id}`,
          })
        }
      },
      unpublishAnnouncement: (id) =>
        set((s) => ({
          announcements: s.announcements.map((a) =>
            a.id === id ? { ...a, status: "unpublished", updatedAt: new Date().toISOString() } : a
          ),
        })),
      getAnnouncement: (id) => get().announcements.find((a) => a.id === id),
    }),
    {
      name: "lijiang-announcements",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted, version) => (version < 3 ? { announcements: SEED } : (persisted as AnnouncementState)),
    }
  )
)
