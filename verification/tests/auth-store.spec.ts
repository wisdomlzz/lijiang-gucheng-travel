/**
 * Auth Store 单元测试
 *
 * login 签名: login(user: User, platform: Platform, token: string)
 * 使用 seedUsers 中的真实用户数据进行测试。
 *
 * 注意: store 使用 persist 中间件写 localStorage。
 * 由于 vitest 默认 node 环境无 localStorage，需要 mock。
 * 使用 vi.hoisted 确保 mock 在模块 import 之前执行。
 */
import { describe, it, expect, beforeEach, vi } from "vitest"

// ---- 在模块加载前设置 localStorage mock ----
// vi.hoisted 保证此代码在模块 import 之前执行
const storage = new Map<string, string>()
const mockStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value) },
  removeItem: (key: string) => { storage.delete(key) },
  clear: () => storage.clear(),
  get length() { return storage.size },
  key: (index: number) => [...storage.keys()][index] ?? null,
}

// 直接 mock zustand 的 persist middleware，绕开 localStorage 依赖
vi.mock("zustand/middleware", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as any,
    persist: (config: any, options: any) => {
      // 使用不持久化的 storage（跳过 localStorage）
      return (actual as any).persist(config, {
        ...options,
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
      })
    },
  }
})

import { useAuthStore } from "@/platform/auth"
import { seedUsers } from "@/shared/types/seed-users"

// 取测试用的用户
const zhangXiaoYou = seedUsers.find((u) => u.phone === "13800001001")!
const zhangBoss = seedUsers.find((u) => u.phone === "13800001002")!
const admin = seedUsers.find((u) => u.phone === "18800003001")!
const liShiFu = seedUsers.find((u) => u.phone === "13900002004")!

describe("Auth Store — 初始状态", () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useAuthStore.setState(useAuthStore.getInitialState())
    storage.clear()
  })

  it("初始状态未登录", () => {
    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.currentPlatform).toBeNull()
  })
})

describe("Auth Store — 登录/登出", () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState())
    storage.clear()
  })

  it("login 后 isLoggedIn 为 true", () => {
    const { login } = useAuthStore.getState()
    login(zhangXiaoYou, "c", "test-token-001")
    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(true)
    expect(state.user).toBeDefined()
    expect(state.user!.name).toBe("张小游")
    expect(state.user!.phone).toBe("13800001001")
  })

  it("login 后 token 和 currentPlatform 正确设置", () => {
    const { login } = useAuthStore.getState()
    login(admin, "desktop", "admin-token-abc")
    const state = useAuthStore.getState()
    expect(state.token).toBe("admin-token-abc")
    expect(state.currentPlatform).toBe("desktop")
  })

  it("login 携带全部角色信息", () => {
    const { login } = useAuthStore.getState()
    login(zhangBoss, "c", "test-token-002")
    const state = useAuthStore.getState()
    expect(state.user!.roles).toContain("tourist")
    expect(state.user!.roles).toContain("supplier")
    expect(state.user!.platform).toContain("c")
    expect(state.user!.platform).toContain("b")
    expect(state.user!.platform).toContain("desktop")
  })

  it("logout 清除所有登录态", () => {
    const { login, logout } = useAuthStore.getState()
    login(zhangXiaoYou, "c", "test-token-001")
    logout()
    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.currentPlatform).toBeNull()
  })

  it("重复登录覆盖旧状态", () => {
    const { login } = useAuthStore.getState()
    login(zhangXiaoYou, "c", "token-1")
    login(admin, "desktop", "token-2")
    const state = useAuthStore.getState()
    expect(state.user!.id).toBe("u_a_001")
    expect(state.token).toBe("token-2")
    expect(state.currentPlatform).toBe("desktop")
  })
})

describe("Auth Store — 平台切换", () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState())
    storage.clear()
  })

  it("switchPlatform 切换后保留登录态", () => {
    const { login, switchPlatform } = useAuthStore.getState()
    login(zhangXiaoYou, "c", "test-token-001")
    switchPlatform("desktop")
    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(true)
    expect(state.user).not.toBeNull()
    expect(state.currentPlatform).toBe("desktop")
  })

  it("switchPlatform 多次切换", () => {
    const { login, switchPlatform } = useAuthStore.getState()
    login(zhangBoss, "c", "test-token-002")
    switchPlatform("b")
    expect(useAuthStore.getState().currentPlatform).toBe("b")
    switchPlatform("desktop")
    expect(useAuthStore.getState().currentPlatform).toBe("desktop")
    switchPlatform("c")
    expect(useAuthStore.getState().currentPlatform).toBe("c")
  })
})

describe("Auth Store — updateUser", () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState())
    storage.clear()
  })

  it("updateUser 更新用户的部分字段", () => {
    const { login, updateUser } = useAuthStore.getState()
    login(zhangXiaoYou, "c", "test-token-001")
    updateUser({ name: "张小游(已认证)" })
    const state = useAuthStore.getState()
    expect(state.user!.name).toBe("张小游(已认证)")
    // 未更新的字段保持不变
    expect(state.user!.phone).toBe("13800001001")
  })

  it("updateUser 在未登录时不生效", () => {
    const { updateUser } = useAuthStore.getState()
    updateUser({ name: "新名字" })
    expect(useAuthStore.getState().user).toBeNull()
  })
})

describe("Auth Store — 多用户场景", () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState())
    storage.clear()
  })

  it("游客用户登录后不可访问桌面端", () => {
    const { login } = useAuthStore.getState()
    login(zhangXiaoYou, "c", "test-token-001")
    const state = useAuthStore.getState()
    // 游客的平台只有 ["c"]
    expect(state.user!.platform).not.toContain("desktop")
    expect(state.user!.platform).toContain("c")
  })

  it("管理员登录后可访问桌面端", () => {
    const { login } = useAuthStore.getState()
    login(admin, "desktop", "admin-token")
    const state = useAuthStore.getState()
    expect(state.user!.platform).toContain("desktop")
    expect(state.user!.platform).toContain("b")
  })

  it("便民服务人员登录 B 端", () => {
    const { login } = useAuthStore.getState()
    login(liShiFu, "b", "staff-token")
    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(true)
    expect(state.user!.roles).toContain("service")
    expect(state.user!.staffId).toBe("s1")
  })
})