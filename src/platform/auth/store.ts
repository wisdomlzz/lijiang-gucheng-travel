import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { User, Platform } from "../../shared/types"

type AuthState = {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  currentPlatform: Platform | null

  login: (user: User, platform: Platform, token: string) => void
  logout: () => void
  switchPlatform: (platform: Platform) => void
  /** 更新当前用户的部分字段（如追加角色） */
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      currentPlatform: null,

      login: (user, platform, token) =>
        set({ user, token, isLoggedIn: true, currentPlatform: platform }),

      logout: () =>
        set({ user: null, token: null, isLoggedIn: false, currentPlatform: null }),

      switchPlatform: (platform) => set({ currentPlatform: platform }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "lijiang-demo-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        currentPlatform: state.currentPlatform,
      }),
    }
  )
)