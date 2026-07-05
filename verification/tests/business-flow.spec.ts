import { describe, it, expect } from "vitest"
import { useConvenienceStore } from "@/features/convenience/store"
import { useMerchantRegistrationStore } from "@/features/merchant-review/store"
import { usePointsStore } from "@/features/points/store"

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

describe("商户认领 store", () => {
  it("提交认领后可查询", () => {
    const store = useMerchantRegistrationStore.getState()

    store.submitClaim({
      userId: "u_c_001",
      userName: "张小游",
      userPhone: "13800001001",
      claimedShopId: "m_001",
      claimedShopName: "纳西人家餐厅",
    })

    const claims = store.getByUserId("u_c_001")
    expect(claims.length).toBeGreaterThanOrEqual(1)
    expect(claims[0].status).toBe("pending")
  })
})

describe("积分 store", () => {
  it("积分规则预定义且可用", () => {
    const state = usePointsStore.getState()
    expect(state.rules.length).toBeGreaterThanOrEqual(3)
    expect(state.rules.some((r) => r.code === "courtyard_checkin")).toBe(true)
  })
})
