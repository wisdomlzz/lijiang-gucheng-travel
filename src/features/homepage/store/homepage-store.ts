import { create } from "zustand"
import { api, bannersApi, gridApi } from "@/api/client"
import { syncAction } from "@/api/sync"
import type { GridItemConfig, BannerConfig } from "../../../shared/types"

const DONE_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='38' fill='%2322C55E'/%3E%3Cpath d='M24 42l10 10 22-24' stroke='white' stroke-width='5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
const TODO_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='38' fill='%23EF4444'/%3E%3Cpath d='M28 28l24 24M52 28l-24 24' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"

type HomepageState = {
  gridItems: GridItemConfig[]
  banners: BannerConfig[]
  reorderGridItem: (fromIndex: number, toIndex: number) => Promise<void>
  toggleGridItem: (id: string) => Promise<void>
  updateGridItem: (id: string, fields: Partial<GridItemConfig>) => Promise<void>
  resetGridToDefault: () => void
  addBanner: (scene: "home" | "shop") => Promise<string>
  updateBanner: (id: string, fields: Partial<BannerConfig>) => Promise<void>
  removeBanner: (id: string) => Promise<void>
  moveBanner: (id: string, direction: -1 | 1) => Promise<void>
  initBanners: () => void
}

export const useHomepageConfigStore = create<HomepageState>((set, get) => ({
  gridItems: [],
  banners: [],

  reorderGridItem: async (fromIndex, toIndex) => {
    const items = [...get().gridItems]
    const [moved] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, moved)
    const reordered = items.map((item, idx) => ({ ...item, order: idx, page: idx < 8 ? 1 : 2 }) as GridItemConfig)
    const ids = reordered.map((r) => r.id)
    await syncAction("grid.reorder", () => api.post("grid-items", "/reorder", { ids }), () => {
      set({ gridItems: reordered })
    })
  },

  toggleGridItem: async (id) => {
    const current = get().gridItems.find((g) => g.id === id)
    if (!current) return
    await syncAction("grid.toggle", () => gridApi.update(id, { visible: !current.visible }), (result) => {
      set((s) => ({ gridItems: s.gridItems.map((item) => (item.id === id ? result : item)) }))
    })
  },

  updateGridItem: async (id, fields) => {
    await syncAction("grid.update", () => gridApi.update(id, fields), (result) => {
      set((s) => ({ gridItems: s.gridItems.map((item) => (item.id === id ? result : item)) }))
    })
  },

  resetGridToDefault: () => set({ gridItems: [] }),

  addBanner: async (scene) => {
    const maxOrder = get().banners.filter((b) => b.scene === scene).reduce((m, b) => Math.max(m, b.order), -1)
    const result = await syncAction(
      "banner.add",
      () => bannersApi.create({ scene, imageUrl: "", title: "", order: maxOrder + 1, enabled: true }),
      (r) => {
        set((s) => ({ banners: [...s.banners, r] }))
      }
    )
    return result?.id ?? ""
  },

  updateBanner: async (id, fields) => {
    await syncAction("banner.update", () => bannersApi.update(id, fields), (result) => {
      set((s) => ({ banners: s.banners.map((b) => (b.id === id ? result : b)) }))
    })
  },

  removeBanner: async (id) => {
    await syncAction("banner.remove", () => bannersApi.remove(id), () => {
      set((s) => ({ banners: s.banners.filter((b) => b.id !== id) }))
    })
  },

  moveBanner: async (id, direction) => {
    const banners = [...get().banners]
    const idx = banners.findIndex((b) => b.id === id)
    if (idx === -1) return
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= banners.length) return
    ;[banners[idx], banners[swapIdx]] = [banners[swapIdx], banners[idx]]
    const reordered = banners.map((b, i) => ({ ...b, order: i }))
    const ids = reordered.map((r) => r.id)
    await syncAction("banner.reorder", () => bannersApi.reorder(ids), () => {
      set({ banners: reordered })
    })
  },

  initBanners: () => {
    // hydrate handles it; kept as no-op for API compatibility
  },
}))
