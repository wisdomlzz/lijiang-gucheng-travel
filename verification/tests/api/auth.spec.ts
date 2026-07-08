/**
 * Auth API Integration Tests
 *
 * Prerequisites:
 *   - The Express backend must be running on port 3001
 *   - Start with: cd server && npm run dev
 *   - Database must be seeded (seed data is loaded automatically on first start)
 *
 * These tests use fetch() to make real HTTP requests to the running server.
 */

import { describe, it, expect } from "vitest"

const BASE = process.env.API_URL || "http://localhost:3001"

describe("Auth API", () => {
  it("POST /api/v1/auth/login — 有效手机号返回 token 和用户信息", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "13800001001" }),
    })
    const data = await res.json()

    expect(data.ok).toBe(true)
    expect(data.data.token).toBeTruthy()
    expect(typeof data.data.token).toBe("string")
    expect(data.data.user.name).toBe("张小游")
    expect(data.data.user.phone).toBe("13800001001")
    expect(data.data.user.roles).toContain("tourist")
  })

  it("POST /api/v1/auth/login — 多角色用户返回完整角色信息", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "13800001002" }),
    })
    const data = await res.json()

    expect(data.ok).toBe(true)
    expect(data.data.user.name).toBe("张老板")
    expect(data.data.user.roles).toContain("tourist")
    expect(data.data.user.roles).toContain("supplier")
  })

  it("POST /api/v1/auth/login — 服务人员登录返回正确信息", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "13900002004" }),
    })
    const data = await res.json()

    expect(data.ok).toBe(true)
    expect(data.data.user.name).toBe("李师傅")
    expect(data.data.user.roles).toContain("service")
  })

  it("POST /api/v1/auth/login — 管理员登录返回正确信息", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "18800003001" }),
    })
    const data = await res.json()

    expect(data.ok).toBe(true)
    expect(data.data.user.name).toBe("管理员")
    expect(data.data.user.roles).toContain("platform_admin")
  })

  it("POST /api/v1/auth/login — 空手机号返回错误", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "" }),
    })
    const data = await res.json()

    expect(data.ok).toBe(false)
    expect(data.msg).toBeTruthy()
  })

  it("POST /api/v1/auth/login — 无效手机号返回错误", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "99999999999" }),
    })
    const data = await res.json()

    expect(data.ok).toBe(false)
    expect(data.msg).toBe("用户不存在")
  })

  it("POST /api/v1/auth/login — 缺少 phone 字段返回错误", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    const data = await res.json()

    expect(data.ok).toBe(false)
    expect(data.msg).toBe("请输入手机号")
  })

  it("GET /api/v1/auth/me — 有效 token 返回用户信息", async () => {
    // 先登录获取 token
    const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "13800001001" }),
    })
    const { data } = await loginRes.json()

    // 用 token 请求 /me
    const meRes = await fetch(`${BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${data.token}` },
    })
    const meData = await meRes.json()

    expect(meData.ok).toBe(true)
    expect(meData.data.phone).toBe("13800001001")
    expect(meData.data.name).toBe("张小游")
  })

  it("GET /api/v1/auth/me — 无 token 返回 401", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/me`)
    const data = await res.json()

    expect(data.ok).toBe(false)
    expect(data.msg).toBe("未登录")
  })

  it("GET /api/v1/auth/me — 无效 token 返回 401", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/me`, {
      headers: { Authorization: "Bearer invalid-token-here" },
    })
    const data = await res.json()

    expect(data.ok).toBe(false)
    expect(data.msg).toMatch(/token.*无效|无效.*token/)
  })
})