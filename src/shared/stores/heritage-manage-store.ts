import { create } from "zustand";
import { HeritageItem, HeritageType, heritageTypeMeta } from "../../c-end/types/heritage";
import { heritageData } from "../../c-end/data/heritage";

interface HeritageManageState {
  items: Record<HeritageType, HeritageItem[]>;
  activeType: HeritageType;
  setActiveType: (type: HeritageType) => void;
  createItem: (type: HeritageType, item: Omit<HeritageItem, "id" | "type">) => void;
  updateItem: (type: HeritageType, id: string, updates: Partial<HeritageItem>) => void;
  deleteItem: (type: HeritageType, id: string) => void;
}

export const useHeritageManageStore = create<HeritageManageState>((set) => ({
  items: heritageData as Record<HeritageType, HeritageItem[]>,
  activeType: "road",
  setActiveType: (type) => set({ activeType: type }),

  createItem: (type, item) =>
    set((s) => ({
      items: {
        ...s.items,
        [type]: [
          { ...item, id: `H${Date.now()}`, type } as HeritageItem,
          ...(s.items[type] || []),
        ],
      },
    })),

  updateItem: (type, id, updates) =>
    set((s) => ({
      items: {
        ...s.items,
        [type]: (s.items[type] || []).map((h) =>
          h.id === id ? { ...h, ...updates } : h
        ),
      },
    })),

  deleteItem: (type, id) =>
    set((s) => ({
      items: {
        ...s.items,
        [type]: (s.items[type] || []).filter((h) => h.id !== id),
      },
    })),
}));

export { heritageTypeMeta };
export type { HeritageType };