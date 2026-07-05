import { create } from "zustand"
import type { GridItemConfig, BannerConfig } from "../../../shared/types"

const DONE_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='38' fill='%2322C55E'/%3E%3Cpath d='M24 42l10 10 22-24' stroke='white' stroke-width='5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
const TODO_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='38' fill='%23EF4444'/%3E%3Cpath d='M28 28l24 24M52 28l-24 24' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"

const DEFAULT_GRID: GridItemConfig[] = [
  {
    id: "g1",
    imageUrl: "/icons/一键服务@2x.png",
    label: "便民服务",
    route: "/c/services",
    page: 1,
    visible: true,
    order: 0,
  },
  {
    id: "g9",
    imageUrl: "/icons/购在古城@2x.png",
    label: "购在古城",
    route: "/c/merchants",
    page: 1,
    visible: true,
    order: 1,
  },
  {
    id: "g2",
    imageUrl: "/icons/导览地图@2x.png",
    label: "导览地图",
    route: "/c/map",
    page: 1,
    visible: true,
    order: 2,
  },
  {
    id: "g10",
    imageUrl: "/icons/门票预订@2x.png",
    label: "门票预订",
    route: "crmeb",
    page: 1,
    visible: true,
    order: 3,
  },
  {
    id: "g3",
    imageUrl: "/icons/文化院落@2x.png",
    label: "文化院落",
    route: "/c/courtyards",
    page: 1,
    visible: true,
    order: 4,
  },
  {
    id: "g15",
    imageUrl: "/icons/志愿服务@2x.png",
    label: "志愿服务",
    route: "/c/volunteer",
    page: 1,
    visible: true,
    order: 5,
  },
  {
    id: "g11",
    imageUrl: "/icons/古城资讯@2x.png",
    label: "古城资讯",
    route: "/c/news",
    page: 1,
    visible: true,
    order: 6,
  },
  { id: "g4", imageUrl: "/icons/讲解服务@2x.png", label: "讲解服务", route: "crmeb", page: 1, visible: true, order: 7 },
  {
    id: "g12",
    imageUrl: "/icons/精选路线@2x.png",
    label: "精选路线",
    route: "/c/routes",
    page: 2,
    visible: true,
    order: 8,
  },
  {
    id: "g5",
    imageUrl: "/icons/遗产知识@2x.png",
    label: "遗产知识",
    route: "/c/heritage",
    page: 2,
    visible: true,
    order: 9,
  },
  {
    id: "g19",
    imageUrl: "/icons/公告通知@2x.png",
    label: "公告通知",
    route: "/c/notice",
    page: 2,
    visible: true,
    order: 10,
  },
  {
    id: "g6",
    imageUrl: "/icons/VR游览@2x.png",
    label: "VR游览",
    route: "/c/vr-tour",
    page: 2,
    visible: true,
    order: 11,
  },
  {
    id: "g14",
    imageUrl: "/icons/便民信息@2x.png",
    label: "便民信息",
    route: "/c/info",
    page: 2,
    visible: true,
    order: 12,
  },
  {
    id: "g7",
    imageUrl: "/icons/公房服务@2x.png",
    label: "公房信息",
    route: "/c/housing",
    page: 2,
    visible: true,
    order: 13,
  },
  {
    id: "g8",
    imageUrl: "/icons/官方商城@2x.png",
    label: "官方商城",
    route: "crmeb",
    page: 2,
    visible: true,
    order: 14,
  },
  {
    id: "g16",
    imageUrl: "/icons/一键投诉@2x.png",
    label: "一键投诉",
    route: "/c/complaint",
    page: 2,
    visible: true,
    order: 15,
  },
  {
    id: "g18",
    imageUrl: "/icons/随手拍@2x.png",
    label: "随手拍",
    route: "/c/photo-report",
    page: 2,
    visible: true,
    order: 16,
  },
]
const DEFAULT_BANNERS: BannerConfig[] = [
  {
    id: "bh1",
    scene: "home",
    imageUrl: "https://images.unsplash.com/photo-1775120246271-cd4b6a3ef428?auto=format&fit=crop&w=1200&q=70",
    title: "一键服务",
    subtitle: "便捷生活",
    badge: "热门",
    link: "/c/services",
    order: 0,
    visible: true,
  },
  {
    id: "bh2",
    scene: "home",
    imageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=1200&q=70",
    title: "古城活动",
    subtitle: "精彩纷呈",
    badge: "活动",
    link: "/c/info/activity-1",
    order: 1,
    visible: true,
  },
]

type HomepageState = {
  gridItems: GridItemConfig[]
  banners: BannerConfig[]
  reorderGridItem: (fromIndex: number, toIndex: number) => void
  toggleGridItem: (id: string) => void
  updateGridItem: (id: string, fields: Partial<GridItemConfig>) => void
  resetGridToDefault: () => void
  addBanner: (scene: "home" | "shop") => string
  updateBanner: (id: string, fields: Partial<BannerConfig>) => void
  removeBanner: (id: string) => void
  moveBanner: (id: string, direction: -1 | 1) => void
  initBanners: () => void
}

let nextBannerId = 100

export const useHomepageConfigStore = create<HomepageState>((set) => ({
  gridItems: DEFAULT_GRID.map((g) => ({ ...g })),
  banners: DEFAULT_BANNERS.map((b) => ({ ...b })),

  reorderGridItem: (fromIndex, toIndex) =>
    set((s) => {
      const items = [...s.gridItems]
      const [moved] = items.splice(fromIndex, 1)
      items.splice(toIndex, 0, moved)
      return { gridItems: items.map((item, idx) => ({ ...item, order: idx, page: idx < 8 ? 1 : 2 }) as GridItemConfig) }
    }),
  toggleGridItem: (id) =>
    set((s) => ({
      gridItems: s.gridItems.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)),
    })),
  updateGridItem: (id, fields) =>
    set((s) => ({ gridItems: s.gridItems.map((item) => (item.id === id ? { ...item, ...fields } : item)) })),
  resetGridToDefault: () => set({ gridItems: DEFAULT_GRID.map((g) => ({ ...g })) }),

  addBanner: (scene) => {
    let newId = ""
    set((s) => {
      const maxOrder = s.banners.filter((b) => b.scene === scene).reduce((m, b) => Math.max(m, b.order), -1)
      newId = `b${nextBannerId++}`
      return {
        banners: [
          ...s.banners,
          {
            id: newId,
            scene,
            imageUrl: "",
            title: "",
            subtitle: "",
            badge: "",
            link: "",
            order: maxOrder + 1,
            visible: true,
          },
        ],
      }
    })
    return newId
  },
  updateBanner: (id, fields) =>
    set((s) => ({ banners: s.banners.map((b) => (b.id === id ? { ...b, ...fields } : b)) })),
  removeBanner: (id) => set((s) => ({ banners: s.banners.filter((b) => b.id !== id) })),
  moveBanner: (id, direction) =>
    set((s) => {
      const scene = s.banners.find((b) => b.id === id)?.scene
      if (!scene) return s
      const sceneItems = s.banners.filter((b) => b.scene === scene).sort((a, b) => a.order - b.order)
      const idx = sceneItems.findIndex((b) => b.id === id)
      if (idx === -1 || idx + direction < 0 || idx + direction >= sceneItems.length) return s
      const newScene = [...sceneItems]
      ;[newScene[idx], newScene[idx + direction]] = [newScene[idx + direction], newScene[idx]]
      const updated = newScene.map((b, i) => ({ ...b, order: i }))
      return { banners: [...s.banners.filter((b) => b.scene !== scene), ...updated] }
    }),
  initBanners: () => set({ banners: DEFAULT_BANNERS.map((b) => ({ ...b })) }),
}))
