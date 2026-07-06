import { create } from "zustand"
import { bannersApi, gridApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { GridItemConfig, BannerConfig } from "../../../shared/types"

const DONE_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='38' fill='%2322C55E'/%3E%3Cpath d='M24 42l10 10 22-24' stroke='white' stroke-width='5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
const TODO_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='38' fill='%23EF4444'/%3E%3Cpath d='M28 28l24 24M52 28l-24 24' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"

const DEFAULT_GRID: GridItemConfig[] = []
const DEFAULT_BANNERS: BannerConfig[] = []

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
  gridItems: [],
  banners: [],

  reorderGridItem: (fromIndex, toIndex) =>
    set((s) => {
      const items = [...s.gridItems]
      const [moved] = items.splice(fromIndex, 1)
      items.splice(toIndex, 0, moved)
      return { gridItems: items.map((item, idx) => ({ ...item, order: idx, page: idx < 8 ? 1 : 2 }) as GridItemConfig) }
    }),
  toggleGridItem: (id) => {
      syncAction("grid.toggle", () => gridApi.update(id, {}), () => {})
      set((s) => ({
        gridItems: s.gridItems.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)),
      }))
    },
  updateGridItem: (id, fields) => {
      syncAction("grid.update", () => gridApi.update(id, fields), () => {})
      set((s) => ({ gridItems: s.gridItems.map((item) => (item.id === id ? { ...item, ...fields } : item)) }))
    },
  resetGridToDefault: () => set({ gridItems: DEFAULT_GRID.map((g) => ({ ...g })) }),

  addBanner: (scene) => {
    syncAction("banner.add", () => bannersApi.create({ scene }), () => {})
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
  updateBanner: (id, fields) => {
    syncAction("banner.update", () => bannersApi.update(id, fields), () => {})
    set((s) => ({ banners: s.banners.map((b) => (b.id === id ? { ...b, ...fields } : b)) }))
  },
  removeBanner: (id) => {
    syncAction("banner.remove", () => bannersApi.remove(id), () => {})
    set((s) => ({ banners: s.banners.filter((b) => b.id !== id) }))
  },
  moveBanner: (id, direction) => {
    syncAction("banner.reorder", () => bannersApi.reorder([id]), () => {})
    return set((s) => {
      const scene = s.banners.find((b) => b.id === id)?.scene
      if (!scene) return s
      const sceneItems = s.banners.filter((b) => b.scene === scene).sort((a, b) => a.order - b.order)
      const idx = sceneItems.findIndex((b) => b.id === id)
      if (idx === -1 || idx + direction < 0 || idx + direction >= sceneItems.length) return s
      const newScene = [...sceneItems]
      ;[newScene[idx], newScene[idx + direction]] = [newScene[idx + direction], newScene[idx]]
      const updated = newScene.map((b, i) => ({ ...b, order: i }))
      return { banners: [...s.banners.filter((b) => b.scene !== scene), ...updated] }
    })
  },
  initBanners: () => set({ banners: DEFAULT_BANNERS.map((b) => ({ ...b })) }),
}))
