import { describe, it, expect, beforeEach } from "vitest"
import { useConvenienceStore } from "@/features/convenience/store"
import type { ConvenienceOrder } from "@/shared/types"

/**
 * Convenience Store 单元测试
 *
 * 注意：该 store 的绝大多数方法（createOrder、acceptOrder 等）都通过 syncAction
 * 调用了实际的后端 API（localhost:3001），因此无法在纯前端单元测试中执行。
 *
 * 本文件聚焦于：
 * 1. 初始状态验证
 * 2. 查询类方法（纯前端 filter/find）—— 通过 setState 注入测试数据
 * 3. 同步方法（setAutoDispatch 等）
 *
 * 涉及后端 API 的方法标记为 .skip
 */

function makeTestOrder(overrides: Partial<ConvenienceOrder> = {}): ConvenienceOrder {
  return {
    id: overrides.id ?? `test-${Date.now()}`,
    userId: "u_c_001",
    serviceType: "送货服务",
    address: "古城东大街 88 号",
    images: [],
    note: "测试订单",
    preferredTime: "09:00-12:00",
    status: "S10",
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("Convenience Store — 初始状态", () => {
  beforeEach(() => {
    useConvenienceStore.setState(useConvenienceStore.getInitialState())
  })

  it("初始状态下 orders 为空数组", () => {
    const { orders } = useConvenienceStore.getState()
    expect(orders).toEqual([])
  })

  it("初始状态下 dispatchLog 为空数组", () => {
    const { dispatchLog } = useConvenienceStore.getState()
    expect(dispatchLog).toEqual([])
  })
})

describe("Convenience Store — 查询方法", () => {
  const order1 = makeTestOrder({ id: "o1", userId: "u_c_001", status: "S10" })
  const order2 = makeTestOrder({ id: "o2", userId: "u_c_001", status: "A30", staffId: "s1" })
  const order3 = makeTestOrder({ id: "o3", userId: "u_s_001", status: "A20", staffId: "s2" })
  const order4 = makeTestOrder({ id: "o4", userId: "u_c_001", status: "S40" })
  const order5 = makeTestOrder({ id: "o5", userId: "u_c_001", status: "S10", cancelRequested: true })

  beforeEach(() => {
    useConvenienceStore.setState({
      ...useConvenienceStore.getInitialState(),
      orders: [order1, order2, order3, order4, order5],
    })
  })

  it("getOrder 根据 id 返回正确的订单", () => {
    const { getOrder } = useConvenienceStore.getState()
    const found = getOrder("o2")
    expect(found).toBeDefined()
    expect(found!.id).toBe("o2")
    expect(found!.status).toBe("A30")
  })

  it("getOrder 对不存在的 id 返回 undefined", () => {
    const { getOrder } = useConvenienceStore.getState()
    expect(getOrder("nonexistent")).toBeUndefined()
  })

  it("getOrdersByUser 返回指定用户的所有订单", () => {
    const { getOrdersByUser } = useConvenienceStore.getState()
    const orders = getOrdersByUser("u_c_001")
    expect(orders).toHaveLength(4)
    orders.forEach((o) => expect(o.userId).toBe("u_c_001"))
  })

  it("getOrdersByUser 对无订单用户返回空数组", () => {
    const { getOrdersByUser } = useConvenienceStore.getState()
    expect(getOrdersByUser("u_nobody")).toEqual([])
  })

  it("getOrdersByStaff 返回指定服务人员的所有订单", () => {
    const { getOrdersByStaff } = useConvenienceStore.getState()
    const orders = getOrdersByStaff("s1")
    expect(orders).toHaveLength(1)
    expect(orders[0].staffId).toBe("s1")
  })

  it("getPending 返回 S10 和 A10 状态的订单", () => {
    const { getPending } = useConvenienceStore.getState()
    const pending = getPending()
    expect(pending).toHaveLength(2)
    expect(pending.every((o) => o.status === "S10" || o.status === "A10")).toBe(true)
  })

  it("getManualPending 返回 S10 / A10 / S90 状态的订单", () => {
    const { getManualPending } = useConvenienceStore.getState()
    const manual = getManualPending()
    expect(manual).toHaveLength(2)
    expect(manual.every((o) => ["S10", "A10", "S90"].includes(o.status))).toBe(true)
  })

  it("getCancelPendingOrders 返回 cancelRequested 为 true 的订单", () => {
    const { getCancelPendingOrders } = useConvenienceStore.getState()
    const cancels = getCancelPendingOrders()
    expect(cancels).toHaveLength(1)
    expect(cancels[0].cancelRequested).toBe(true)
  })

  it("多个查询条件组合验证: 已完成的订单不进入待处理列表", () => {
    const { getPending, getOrdersByUser } = useConvenienceStore.getState()
    const pending = getPending()
    // S40(已完成) 的订单不应该出现在待处理中
    expect(pending.some((o) => o.status === "S40")).toBe(false)
    // 但应该仍能被 getOrdersByUser 查到
    const userOrders = getOrdersByUser("u_c_001")
    expect(userOrders.some((o) => o.status === "S40")).toBe(true)
  })
})

describe("Convenience Store — 同步方法", () => {
  beforeEach(() => {
    useConvenienceStore.setState(useConvenienceStore.getInitialState())
  })

  it("setState 可以直接注入订单（模拟种子数据）", () => {
    const order = makeTestOrder({ id: "direct-1" })
    useConvenienceStore.setState({ orders: [order] })
    const { orders } = useConvenienceStore.getState()
    expect(orders).toHaveLength(1)
    expect(orders[0].id).toBe("direct-1")
  })

  it("多次 setState 追加订单", () => {
    const o1 = makeTestOrder({ id: "a1" })
    const o2 = makeTestOrder({ id: "a2" })
    useConvenienceStore.setState({ orders: [o1] })
    useConvenienceStore.setState({ orders: [o1, o2] })
    expect(useConvenienceStore.getState().orders).toHaveLength(2)
  })

  it("setState 替换已有订单", () => {
    const o1 = makeTestOrder({ id: "r1", status: "S10" })
    useConvenienceStore.setState({ orders: [o1] })
    const updated = makeTestOrder({ id: "r1", status: "S40" })
    useConvenienceStore.setState({ orders: [updated] })
    const { getOrder } = useConvenienceStore.getState()
    expect(getOrder("r1")!.status).toBe("S40")
  })
})

describe("Convenience Store — 需后端 API", () => {
  beforeEach(() => {
    useConvenienceStore.setState(useConvenienceStore.getInitialState())
  })

  it.todo("createOrder 创建订单并自动派单（需后端运行）")
  it.todo("acceptOrder 将订单状态流转为 A30（需后端运行）")
  it.todo("completeService 完成服务（需后端运行）")
  it.todo("rateOrder 为订单评分（需后端运行）")
  it.todo("requestCancel 申请取消订单（需后端运行）")
  it.todo("approveCancelRequest 审批通过取消（需后端运行）")
  it.todo("rejectCancelRequest 驳回取消申请（需后端运行）")
})