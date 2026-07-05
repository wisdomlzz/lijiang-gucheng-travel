import { describe, it, expect } from "vitest"
import { useConvenienceStore } from "@/features/convenience/store"

describe("便民服务 store 冒烟测试", () => {
  it("store 初始化后有种子订单", () => {
    const state = useConvenienceStore.getState()
    expect(state.orders.length).toBeGreaterThanOrEqual(1)
  })

  it("种子订单状态码有效", () => {
    const { orders } = useConvenienceStore.getState()
    orders.forEach((o) => {
      expect(o.status).toMatch(/^[SA]/)
      expect(o.id).toBeTruthy()
    })
  })

  it("getOrder 可查询到种子订单", () => {
    const { orders, getOrder } = useConvenienceStore.getState()
    const firstId = orders[0].id
    const found = getOrder(firstId)
    expect(found).toBeDefined()
    expect(found!.id).toBe(firstId)
  })
})
