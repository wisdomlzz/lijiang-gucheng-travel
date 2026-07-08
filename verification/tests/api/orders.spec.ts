/**
 * Orders API Integration Tests
 *
 * Prerequisites:
 *   - The Express backend must be running on port 3001
 *   - Start with: cd server && npm run dev
 *   - Database must be seeded (seed data is loaded automatically on first start)
 *
 * These tests use fetch() to make real HTTP requests to the running server.
 *
 * API response format:
 *   - Success: { ok: true, data: { items: [...], total, page, pageSize, totalPages } }  (list)
 *              { ok: true, data: { ... } }  (single)
 *   - Error:   { ok: false, msg: "..." }
 */

import { describe, it, expect } from "vitest"

const BASE = process.env.API_URL || "http://localhost:3001"

describe("Orders API", () => {
  // ──────────────────────────────────────────────
  // GET /api/v1/orders — list
  // ──────────────────────────────────────────────
  it("GET /api/v1/orders — 返回订单列表", async () => {
    const res = await fetch(`${BASE}/api/v1/orders`)
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.data).toBeDefined()
    expect(Array.isArray(body.data.items)).toBe(true)
    expect(body.data.items.length).toBeGreaterThanOrEqual(1)
    expect(typeof body.data.total).toBe("number")
    expect(typeof body.data.page).toBe("number")
    expect(typeof body.data.pageSize).toBe("number")
    expect(typeof body.data.totalPages).toBe("number")

    // 验证订单对象结构
    const order = body.data.items[0]
    expect(order.id).toBeTruthy()
    expect(order.serviceType).toBeTruthy()
    expect(order.status).toBeTruthy()
    expect(order.preferredTime).toBeTruthy()
  })

  it("GET /api/v1/orders — 所有订单有有效的 createdAt", async () => {
    const res = await fetch(`${BASE}/api/v1/orders`)
    const body = await res.json()

    const items = body.data.items
    expect(items.length).toBeGreaterThanOrEqual(1)
    for (const order of items) {
      expect(order.createdAt).toBeTruthy()
      expect(() => new Date(order.createdAt)).not.toThrow()
      expect(isNaN(new Date(order.createdAt).getTime())).toBe(false)
    }
  })

  it("GET /api/v1/orders?page=1&pageSize=2 — 分页正常", async () => {
    const res = await fetch(`${BASE}/api/v1/orders?page=1&pageSize=2`)
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.data.items.length).toBeLessThanOrEqual(2)
    expect(body.data.page).toBe(1)
    expect(body.data.pageSize).toBe(2)
  })

  it("GET /api/v1/orders?page=2&pageSize=2 — 第二页数据正常", async () => {
    const res = await fetch(`${BASE}/api/v1/orders?page=2&pageSize=2`)
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.data.items.length).toBeLessThanOrEqual(2)
    expect(body.data.page).toBe(2)
    expect(body.data.pageSize).toBe(2)

    // 验证第二页与第一页不重复
    const page1Res = await fetch(`${BASE}/api/v1/orders?page=1&pageSize=2`)
    const page1Body = await page1Res.json()
    if (body.data.items.length > 0 && page1Body.data.items.length > 0) {
      const page1Ids = new Set(page1Body.data.items.map((o) => o.id))
      const hasOverlap = body.data.items.some((o) => page1Ids.has(o.id))
      expect(hasOverlap).toBe(false)
    }
  })

  it("GET /api/v1/orders?status=S10 — 按状态筛选正常", async () => {
    const res = await fetch(`${BASE}/api/v1/orders?status=S10`)
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(Array.isArray(body.data.items)).toBe(true)
    for (const order of body.data.items) {
      expect(order.status).toBe("S10")
    }
  })

  it("GET /api/v1/orders?status=NONEXISTENT — 筛选无结果返回空列表", async () => {
    const res = await fetch(`${BASE}/api/v1/orders?status=NONEXISTENT`)
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.data.items).toEqual([])
    expect(body.data.total).toBe(0)
  })

  // ──────────────────────────────────────────────
  // GET /api/v1/orders/:id — single
  // ──────────────────────────────────────────────
  it("GET /api/v1/orders/:id — 返回单个订单", async () => {
    // 先获取第一个订单的 id
    const listRes = await fetch(`${BASE}/api/v1/orders`)
    const listBody = await listRes.json()
    const firstId = listBody.data.items[0]?.id
    expect(firstId).toBeTruthy()

    const res = await fetch(`${BASE}/api/v1/orders/${firstId}`)
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.data.id).toBe(firstId)
    expect(body.data.serviceType).toBeTruthy()
    expect(body.data.address).toBeTruthy()
  })

  it("GET /api/v1/orders/:id — 不存在 ID 返回 404", async () => {
    const res = await fetch(`${BASE}/api/v1/orders/nonexistent-id-12345`)
    const body = await res.json()

    expect(body.ok).toBe(false)
  })

  // ──────────────────────────────────────────────
  // POST /api/v1/orders — create
  // ──────────────────────────────────────────────
  it("POST /api/v1/orders — 创建新订单", async () => {
    const res = await fetch(`${BASE}/api/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: "送货服务",
        address: "古城五一街文治巷88号",
        note: "API 测试订单 — 一箱饮料",
        preferredTime: "尽快",
        userId: "u_c_001",
        lat: 26.878,
        lng: 100.239,
      }),
    })
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.data.status).toBe("S10")
    expect(body.data.serviceType).toBe("送货服务")
    expect(body.data.address).toBe("古城五一街文治巷88号")
    expect(body.data.userId).toBe("u_c_001")
    expect(body.data.id).toBeTruthy()
    expect(body.data.createdAt).toBeTruthy()
  })

  it("POST /api/v1/orders — 创建订单后 status 默认为 S10", async () => {
    const res = await fetch(`${BASE}/api/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: "行李搬运",
        address: "古城入口",
        preferredTime: "下午",
        userId: "u_c_001",
      }),
    })
    const body = await res.json()

    expect(body.ok).toBe(true)
    expect(body.data.status).toBe("S10")
  })

  // ──────────────────────────────────────────────
  // POST /api/v1/orders/:id/transition — status transition
  // ──────────────────────────────────────────────
  it("POST /api/v1/orders/:id/transition — S10 可 dispatch 到 A10", async () => {
    // 先创建一个 S10 的订单
    const createRes = await fetch(`${BASE}/api/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: "送货服务",
        address: "古城五一街",
        preferredTime: "尽快",
        userId: "u_c_001",
      }),
    })
    const createBody = await createRes.json()
    expect(createBody.data.status).toBe("S10")
    const orderId = createBody.data.id

    // 通过 transition 流转到 A10
    const transitionRes = await fetch(`${BASE}/api/v1/orders/${orderId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dispatch" }),
    })
    const transitionBody = await transitionRes.json()

    expect(transitionBody.ok).toBe(true)
    expect(transitionBody.data.status).toBe("A10")
  })

  it("POST /api/v1/orders/:id/transition — 无效 action 返回错误", async () => {
    // 先创建一个 S10 的订单
    const createRes = await fetch(`${BASE}/api/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: "送货服务",
        address: "古城五一街",
        preferredTime: "尽快",
        userId: "u_c_001",
      }),
    })
    const createBody = await createRes.json()
    const orderId = createBody.data.id

    // 尝试无效的 action
    const transitionRes = await fetch(`${BASE}/api/v1/orders/${orderId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "nonexistent_action" }),
    })
    const transitionBody = await transitionRes.json()

    expect(transitionBody.ok).toBe(false)
    expect(transitionBody.msg).toMatch(/不支持/)
  })

  it("POST /api/v1/orders/:id/transition — S10 可以直接 cancel 到 S50", async () => {
    // 先创建一个 S10 的订单
    const createRes = await fetch(`${BASE}/api/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: "送货服务",
        address: "古城五一街",
        preferredTime: "尽快",
        userId: "u_c_001",
      }),
    })
    const createBody = await createRes.json()
    const orderId = createBody.data.id

    // 直接取消
    const cancelRes = await fetch(`${BASE}/api/v1/orders/${orderId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    })
    const cancelBody = await cancelRes.json()

    expect(cancelBody.ok).toBe(true)
    expect(cancelBody.data.status).toBe("S50")
  })

  // ──────────────────────────────────────────────
  // Error handling
  // ──────────────────────────────────────────────
  it("POST /api/v1/orders/:id/transition — 不存在订单返回 404", async () => {
    const res = await fetch(`${BASE}/api/v1/orders/nonexistent-id-99999/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dispatch" }),
    })
    const body = await res.json()

    expect(body.ok).toBe(false)
    expect(body.msg).toBe("订单不存在")
  })
})