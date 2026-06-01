import { create } from "zustand"
import type { GridItemConfig, BannerConfig } from "../types"

// 宫格图标：绿勾 / 红叉
const ICON_DONE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='38' fill='%2322C55E'/%3E%3Cpath d='M24 42l10 10 22-24' stroke='white' stroke-width='5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const ICON_TODO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='38' fill='%23EF4444'/%3E%3Cpath d='M28 28l24 24M52 28l-24 24' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";

const DEFAULT_GRID_ITEMS: GridItemConfig[] = [
  // 第 1 页（order 0-7）
  { id: "g1", imageUrl: ICON_DONE, label: "一键服务", route: "/c/services", page: 1, visible: true, order: 0 },
  { id: "g9", imageUrl: ICON_TODO, label: "购在古城", route: "/c/merchants", page: 1, visible: true, order: 1 },
  { id: "g2", imageUrl: ICON_DONE, label: "导览地图", route: "/c/map", page: 1, visible: true, order: 2 },
  { id: "g10", imageUrl: ICON_TODO, label: "门票预定", route: "crmeb", page: 1, visible: true, order: 3 },
  { id: "g3", imageUrl: ICON_DONE, label: "文化院落", route: "/c/courtyards", page: 1, visible: true, order: 4 },
  { id: "g15", imageUrl: ICON_TODO, label: "志愿服务", route: "/c/volunteer", page: 1, visible: true, order: 5 },
  { id: "g11", imageUrl: ICON_TODO, label: "古城资讯", route: "/c/news", page: 1, visible: true, order: 6 },
  { id: "g4", imageUrl: ICON_TODO, label: "讲解服务", route: "crmeb", page: 1, visible: true, order: 7 },
  // 第 2 页（order 8-15）
  { id: "g12", imageUrl: ICON_TODO, label: "精选路线", route: "/c/routes", page: 2, visible: true, order: 8 },
  { id: "g5", imageUrl: ICON_DONE, label: "遗产知识", route: "/c/heritage", page: 2, visible: true, order: 9 },
  { id: "g13", imageUrl: ICON_DONE, label: "停车服务", route: "/c/parking", page: 2, visible: true, order: 10 },
  { id: "g6", imageUrl: ICON_TODO, label: "VR 游览", route: "/c/vr-tour", page: 2, visible: true, order: 11 },
  { id: "g14", imageUrl: ICON_TODO, label: "便民信息", route: "/c/info", page: 2, visible: true, order: 12 },
  { id: "g7", imageUrl: ICON_DONE, label: "公房服务", route: "/c/housing", page: 2, visible: true, order: 13 },
  { id: "g8", imageUrl: ICON_TODO, label: "官方商城", route: "crmeb", page: 2, visible: true, order: 14 },
  { id: "g16", imageUrl: ICON_DONE, label: "一键投诉", route: "/c/complaint", page: 2, visible: true, order: 15 },
  // 第 3 页（order 16-17）
  { id: "g17", imageUrl: ICON_TODO, label: "联票套餐", route: "crmeb", page: 3, visible: true, order: 16 },
  { id: "g18", imageUrl: ICON_DONE, label: "随手拍", route: "/c/photo-records", page: 3, visible: true, order: 17 },
];

const DEFAULT_BANNERS: BannerConfig[] = [
  {
    id: "bh1", scene: "home",
    imageUrl: "https://images.unsplash.com/photo-1775120246271-cd4b6a3ef428?auto=format&fit=crop&w=1200&q=70",
    title: "一键服务", subtitle: "便捷生活", badge: "热门", link: "/c/services",
    order: 0, visible: true,
  },
  {
    id: "bh2", scene: "home",
    imageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=1200&q=70",
    title: "古城活动", subtitle: "精彩纷呈", badge: "活动", link: "/c/info/activity-1",
    order: 1, visible: true,
  },
];

interface HomepageConfigState {
  gridItems: GridItemConfig[];
  banners: BannerConfig[];
  reorderGridItem: (fromIndex: number, toIndex: number) => void;
  toggleGridItem: (id: string) => void;
  updateGridItem: (id: string, fields: Partial<GridItemConfig>) => void;
  resetGridToDefault: () => void;
  addBanner: (scene: "home" | "shop") => string;
  updateBanner: (id: string, fields: Partial<BannerConfig>) => void;
  removeBanner: (id: string) => void;
  moveBanner: (id: string, direction: -1 | 1) => void;
  initBanners: () => void;
}

let nextBannerId = 100;

export const useHomepageConfigStore = create<HomepageConfigState>((set) => ({
  gridItems: DEFAULT_GRID_ITEMS.map((g) => ({ ...g })),
  banners: DEFAULT_BANNERS.map((b) => ({ ...b })),

  reorderGridItem: (fromIndex, toIndex) =>
    set((state) => {
      const items = [...state.gridItems];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return {
        gridItems: items.map((item, idx) => ({ ...item, order: idx, page: idx < 8 ? 1 : idx < 16 ? 2 : 3 })),
      };
    }),

  toggleGridItem: (id) =>
    set((state) => ({
      gridItems: state.gridItems.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      ),
    })),

  updateGridItem: (id, fields) =>
    set((state) => ({
      gridItems: state.gridItems.map((item) =>
        item.id === id ? { ...item, ...fields } : item
      ),
    })),

  resetGridToDefault: () =>
    set({ gridItems: DEFAULT_GRID_ITEMS.map((g) => ({ ...g })) }),

  addBanner: (scene) => {
    let newId = "";
    set((state) => {
      const sceneBanners = state.banners.filter((b) => b.scene === scene);
      const maxOrder = sceneBanners.reduce((m, b) => Math.max(m, b.order), -1);
      newId = `b${nextBannerId++}`;
      const newBanner: BannerConfig = {
        id: newId,
        scene,
        imageUrl: "",
        title: "",
        subtitle: "",
        badge: "",
        link: "",
        order: maxOrder + 1,
        visible: true,
      };
      return { banners: [...state.banners, newBanner] };
    });
    return newId;
  },

  updateBanner: (id, fields) =>
    set((state) => ({
      banners: state.banners.map((b) => (b.id === id ? { ...b, ...fields } : b)),
    })),

  removeBanner: (id) =>
    set((state) => ({
      banners: state.banners.filter((b) => b.id !== id),
    })),

  moveBanner: (id, direction) =>
    set((state) => {
      const scene = state.banners.find((b) => b.id === id)?.scene;
      if (!scene) return state;
      const sceneItems = state.banners
        .filter((b) => b.scene === scene)
        .sort((a, b) => a.order - b.order);
      const idx = sceneItems.findIndex((b) => b.id === id);
      if (idx === -1) return state;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= sceneItems.length) return state;
      const newScene = [...sceneItems];
      [newScene[idx], newScene[targetIdx]] = [newScene[targetIdx], newScene[idx]];
      const updated = newScene.map((b, i) => ({ ...b, order: i }));
      const other = state.banners.filter((b) => b.scene !== scene);
      return { banners: [...other, ...updated] };
    }),

  initBanners: () =>
    set({ banners: DEFAULT_BANNERS.map((b) => ({ ...b })) }),
}));
