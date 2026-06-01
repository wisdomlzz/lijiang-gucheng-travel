import { create } from "zustand"

export function getFitScale() {
  if (typeof window === "undefined") return 1
  const padding = 32
  const sx = (window.innerWidth - padding) / 390
  const sy = (window.innerHeight - padding) / 844
  return Math.min(sx, sy, 1)
}

type ZoomState = {
  scale: number
  setScale: (s: number) => void
  resetScale: () => void
}

export const useZoomStore = create<ZoomState>((set) => ({
  scale: 1,
  setScale: (scale) => set({ scale }),
  resetScale: () => set({ scale: getFitScale() }),
}))
