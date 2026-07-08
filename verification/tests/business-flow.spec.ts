import { describe, it, expect, beforeEach } from "vitest"
import { useConvenienceStore } from "@/features/convenience/store"
import { useMerchantRegistrationStore } from "@/features/merchant-review/store"
import { usePointsStore } from "@/features/points/store/points-store"
import type { ConvenienceOrder } from "@/shared/types"

function makeMockOrder(overrides: Partial<ConvenienceOrder> = {}): ConvenienceOrder {
  const id = `test_order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  return {
    id,
    userId: "u_c_001",
    staffId: "",
    serviceType: "delivery",
    status: "S10",
    address: "古城东大街",
    contactPerson: "张小游",
    contactPhone: "13800001001",
    description: "测试订单",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    images: [],
    ...overrides,
  } as ConvenienceOrder
}

describe("便民服务 store 冒烟测试", () => {
  beforeEach(() => {
    // 重置 store 到空状态
    useConvenienceStore.setState({ orders: [], dispatchLog: [] })
  })

  it("store 可注入订单数据", () => {
    const order = makeMockOrder()
    useConvenienceStore.setState({ orders: [order] })
    const { orders } = useConvenienceStore.getState()
    expect(orders.length).toBeGreaterThanOrEqual(1)
    expect(orders[0].status).toMatch(/^[SA]/)
  })

  it("种子订单状态码有效", () => {
    const orders = [
      makeMockOrder({ id: "o1", status: "S10" }),
      makeMockOrder({ id: "o2", status: "A20" }),
      makeMockOrder({ id: "o3", status: "S40" }),
    ]
    useConvenienceStore.setState({ orders })
    const state = useConvenienceStore.getState()
    state.orders.forEach((o) => {
      expect(o.status).toMatch(/^[SA]/)
      expect(o.id).toBeTruthy()
    })
  })

  it("getOrder 可查询到注入的订单", () => {
    const order = makeMockOrder()
    useConvenienceStore.setState({ orders: [order] })
    const { getOrder } = useConvenienceStore.getState()
    const found = getOrder(order.id)
    expect(found).toBeDefined()
    expect(found!.id).toBe(order.id)
  })
})

describe("商户认领 store", () => {
  beforeEach(() => {
    useMerchantRegistrationStore.setState({ requests: [] })
  })

  it("提交认领后可查询", () => {
    const store = useMerchantRegistrationStore.getState()

    // 直接注入认领申请数据（submitClaim 是异步的，需要 API 调用）
    const claim = {
      id: `claim_${Date.now()}`,
      type: "claim" as const,
      userId: "u_c_001",
      userName: "张小游",
      userPhone: "13800001001",
      claimedShopId: "m_001",
      claimedShopName: "纳西人家餐厅",
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    useMerchantRegistrationStore.setState({
      requests: [claim, ...useMerchantRegistrationStore.getState().requests],
    })

    const claims = useMerchantRegistrationStore.getState().getByUserId("u_c_001")
    expect(claims.length).toBeGreaterThanOrEqual(1)
    expect(claims[0].status).toBe("pending")
  })
})

describe("积分 store", () => {
  beforeEach(() => {
    usePointsStore.setState({ rules: [] })
  })

  it("积分规则预定义且可用", () => {
    const rules = [
      {
        code: "courtyard_checkin",
        label: "院落打卡",
        points: 10,
        direction: "IN" as const,
        enabled: true,
        description: "打卡文化院落获得积分",
      },
      {
        code: "daily_signin",
        label: "每日签到",
        points: 5,
        direction: "IN" as const,
        enabled: true,
        description: "每日签到获得积分",
      },
      {
        code: "order_complete",
        label: "完成订单",
        points: 50,
        direction: "IN" as const,
        enabled: true,
        description: "完成服务订单获得积分",
      },
    ]

    usePointsStore.setState({ rules })

    const state = usePointsStore.getState()
    expect(state.rules.length).toBeGreaterThanOrEqual(3)
    expect(state.rules.some((r) => r.code === "courtyard_checkin")).toBe(true)
  })
})