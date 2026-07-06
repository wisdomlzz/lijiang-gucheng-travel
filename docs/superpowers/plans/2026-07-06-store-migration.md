# Store 迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 18 个前端 store 的 mutation 全部接上 API,删除所有硬编码种子数据,统一 syncAction 用法(server-authoritative)。

**Architecture:** 每个 store 的 mutation 调 API → 成功用返回值更新本地 state → 失败 toast 不改本地。禁止乐观更新。ID/时间戳/计算字段全由 server 生成。删除所有 `const SEED_* = []` 和硬编码数组。

**Tech Stack:** zustand, TypeScript, fetch API

**前置条件:** Plan 1(`docs/superpowers/plans/2026-07-06-server-foundation.md`)已执行完毕,后端 API 全部可用。

## Global Constraints

- **syncAction 铁律**(spec §4.4):
  1. `localUpdate` 必须接收并用 `result`(服务端返回值),禁止 `() => {}`
  2. `set()` 必须在 `localUpdate` 回调内,禁止写在外面
  3. 禁止乐观更新,所有改动等服务端确认
  4. 失败返回 null,本地 state 不动
- 删除所有 `const SEED_* = []`、`const DEFAULT_* = []`、硬编码数组
- 不在前端生成 ID/时间戳,用 server 返回的
- 数组字段(images/completionPhotos/serviceTypes 等)由 server 序列化/反序列化,前端直接用数组
- 每个 store 迁完独立验证:操作 → 刷新页面 → 数据不丢

**参考文档:**
- spec: `docs/superpowers/specs/2026-07-06-real-frontend-backend-design.md`(§5 有每个 store 的详细改动表)
- Plan 1: `docs/superpowers/plans/2026-07-06-server-foundation.md`

---

## 通用迁移模式(每个 store 都遵守)

### Before(错误模式)

```ts
addNews: (item) => {
  syncAction("news.add", () => contentApi.news.create(item), () => {})  // 回调空
  set((s) => ({ news: [...s.news, item] }))  // set 在外面,API 失败也改本地
},
```

### After(正确模式)

```ts
addNews: async (item) => {
  await syncAction("news.add", () => contentApi.news.create(item), (result) => {
    set((s) => ({ news: [result, ...s.news] }))  // 用 server 返回的 result(含生成的 id/timestamps)
  })
},
```

### 每个 store 的统一动作

1. **删** 所有 `const SEED_* = []`、`const DEFAULT_* = []`、硬编码数组、`genSeeds()` 函数
2. **改** 所有 mutation 用上面的 After 模式
3. **查** grep 确认无残留:`grep -n "SEED\|DEFAULT_" src/features/<store>/store/*.ts`

---

## Task 1: convenience store(最复杂)

**Files:**
- Modify: `src/features/convenience/store/store.ts`
- Delete: `src/features/convenience/store/seed.ts`(如果只被 store.ts 引用)

**spec 参考:** §5.2.1

- [ ] **Step 1: 删除 seed 导入和 SEED_ORDERS**

在 `store.ts` 顶部删掉:
```ts
import { SEED_ORDERS } from "./seed"  // 删这行
```

确认 `seed.ts` 没被其他文件引用:`grep -rn "from.*convenience/store/seed" src/`
如果只有 store.ts 引用,删除 `seed.ts`。

- [ ] **Step 2: 改 createOrder**

```ts
// Before:
createOrder: async (order) => {
  await syncAction("createOrder", () => ordersApi.create(order), (result) => {
    const newOrder = result ?? { ...order, status: "S10" as ConvenienceStatus }
    set((s) => ({ orders: [newOrder, ...s.orders] }))
    notify(newOrder, "便民服务订单已提交", `您的${newOrder.serviceType}订单已提交，正在为您安排服务人员`, `/c/orders/${newOrder.id}`)
    setTimeout(() => get().autoDispatchOrder(newOrder.id), 500)
  })
},

// After(用 server 返回的 result,不再 fallback):
createOrder: async (order) => {
  await syncAction("createOrder", () => ordersApi.create(order), (result) => {
    set((s) => ({ orders: [result, ...s.orders] }))
    notify(result, "便民服务订单已提交", `您的${result.serviceType}订单已提交，正在为您安排服务人员`, `/c/orders/${result.id}`)
    setTimeout(() => get().autoDispatchOrder(result.id), 500)
  })
},
```

- [ ] **Step 3: 改 autoDispatchOrder / assignToStaff / manualDispatch(调 dispatch API)**

```ts
autoDispatchOrder: async (orderId) => {
  await syncAction("autoDispatch", () => ordersApi.dispatch(orderId, "auto"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    const order = get().orders.find(o => o.id === orderId)
    if (order?.staffName) {
      notify(order, "便民服务已派单", `${order.serviceType}订单已指派${order.staffName}，请留意电话联系`, `/b/service/tasks`)
    }
  })
},

assignToStaff: async (orderId) => {
  await syncAction("assignToStaff", () => ordersApi.dispatch(orderId, "auto"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
  })
},

manualDispatch: async (orderId, staffId) => {
  await syncAction("manualDispatch", () => ordersApi.dispatch(orderId, "manual", staffId), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    const order = get().orders.find(o => o.id === orderId)
    if (order?.staffName) {
      notify(order, "便民服务已派单", `${order.serviceType}订单已指派${order.staffName}，请留意电话联系`, `/b/service/tasks`)
    }
  })
},
```

**注意**:`updateOrder` helper 保持不变,但现在 patch 是整个 `result`(server 返回的完整 order)。改为:
```ts
function updateOrder(orders, id, patch) {
  return orders.map(o => o.id === id ? { ...o, ...patch } : o)
}
```

- [ ] **Step 4: 改所有 transition 动作(submitQuote / markPaid / startService / completeService / confirmComplete)**

```ts
submitQuote: async (orderId, price) => {
  const o = get().orders.find(x => x.id === orderId)
  if (!o || !transition(o.status, "quote")) return
  await syncAction("submitQuote", () => ordersApi.transition(orderId, "quote", { priceQuote: price }), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    notify(o, "服务已核价", `您的${o.serviceType}订单已报价 ¥${price}，请在时间内确认支付`, `/c/orders/${orderId}`)
    setTimer(`conv:${orderId}:pay`, 15000, () => {
      const order = get().orders.find(o => o.id === orderId)
      if (order?.status === "A35") {
        // 支付超时走 transition API
        syncAction("payTimeout", () => ordersApi.transition(orderId, "payTimeout"), (r) => {
          set((s) => ({ orders: updateOrder(s.orders, orderId, r) }))
        })
      }
    })
  })
},

markPaid: async (orderId, method) => {
  clearTimer(`conv:${orderId}:pay`)
  const o = get().orders.find(x => x.id === orderId)
  if (!o || !transition(o.status, "pay")) return
  await syncAction("markPaid", () => ordersApi.transition(orderId, "pay", { payMethod: method }), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    notify(o, "支付成功", `${o.serviceType}订单已${method === "online" ? "在线" : "现金"}支付成功，服务人员即将开始服务`, `/c/orders/${orderId}`)
  })
},

startService: async (orderId) => {
  const o = get().orders.find(x => x.id === orderId)
  if (!o || !transition(o.status, "startService")) return
  await syncAction("startService", () => ordersApi.transition(orderId, "startService"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    notify(o, "服务进行中", `${o.serviceType}订单开始服务`, `/c/orders/${orderId}`)
  })
},

completeService: async (orderId, photos) => {
  const o = get().orders.find(x => x.id === orderId)
  if (!o || !transition(o.status, "complete")) return
  await syncAction("completeService", () => ordersApi.transition(orderId, "complete", { completionPhotos: photos }), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    notify(o, "服务已完成", `您的${o.serviceType}订单服务已完成，请确认完成`, `/c/orders/${orderId}`)
    setTimer(`conv:${orderId}:autoConfirm`, 30000, () => get().confirmComplete(orderId))
  })
},

confirmComplete: async (orderId) => {
  clearTimer(`conv:${orderId}:autoConfirm`)
  const o = get().orders.find(x => x.id === orderId)
  if (!o) return
  await syncAction("confirmComplete", () => ordersApi.transition(orderId, "confirm"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    // 记录收入(调 settlement store,settlement store 内部会调 API)
    if (o.priceQuote && o.staffId) {
      useSettlementStore.getState().recordIncome({
        orderId: o.id, staffId: o.staffId, staffName: o.staffName ?? "",
        serviceType: String(o.serviceType), amount: o.priceQuote, payMethod: o.payMethod ?? "online",
      })
    }
    notify(o, "订单已完成", "服务已完成，欢迎评价", `/c/orders/${orderId}`)
    usePointsStore.getState().transact(o.userId, "mall_purchase", orderId)
  })
},
```

- [ ] **Step 5: 改 rateOrder / uploadPaymentProof**

```ts
rateOrder: async (orderId, rating) => {
  await syncAction("rateOrder", () => ordersApi.update(orderId, { rating, ratedAt: new Date().toISOString() }), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
  })
},

uploadPaymentProof: async (orderId, url) => {
  await syncAction("uploadPaymentProof", () => ordersApi.update(orderId, { paymentProof: url }), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
  })
},
```

- [ ] **Step 6: 改取消流程(requestCancel / approveCancelRequest / rejectCancelRequest / forceCancel)**

```ts
requestCancel: async (orderId) => {
  const o = get().orders.find(x => x.id === orderId)
  if (!o) return
  await syncAction("requestCancel", () => ordersApi.transition(orderId, "requestCancel"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    // 如果是直接取消(result.status 变为 S50),不需要 notify 管理员
    if (result.cancelRequested || result.status !== "S50") {
      notify(o, "用户申请取消", `${o.serviceType}订单用户申请取消，请处理`, `/desktop/convenience`)
    }
  })
},

approveCancelRequest: async (orderId) => {
  const o = get().orders.find(x => x.id === orderId)
  if (!o || !o.cancelRequested) return
  await syncAction("approveCancelRequest", () => ordersApi.transition(orderId, "approveCancel"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    notify(o, "取消已同意", `您的${o.serviceType}订单取消已同意`, `/c/orders/${orderId}`)
  })
},

rejectCancelRequest: async (orderId) => {
  const o = get().orders.find(x => x.id === orderId)
  if (!o || !o.cancelRequested) return
  await syncAction("rejectCancelRequest", () => ordersApi.transition(orderId, "rejectCancel"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    notify(o, "取消已拒绝", `您的${o.serviceType}订单取消申请已被拒绝，服务继续`, `/c/orders/${orderId}`)
  })
},

forceCancel: async (orderId) => {
  const o = get().orders.find(x => x.id === orderId)
  if (!o || !transition(o.status, "forceCancel")) return
  await syncAction("forceCancel", () => ordersApi.transition(orderId, "forceCancel"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
  })
},
```

- [ ] **Step 7: 改管理审核动作(approvePriceQuote / rejectPriceQuote / confirmPaymentProof / rejectPaymentProof)**

```ts
approvePriceQuote: async (orderId) => {
  const o = get().orders.find(x => x.id === orderId)
  if (!o) return
  await syncAction("approvePriceQuote", () => ordersApi.transition(orderId, "approveQuote"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    notify(o, "报价审核通过", `${o.serviceType}订单报价已审核通过，服务继续`, `/c/orders/${orderId}`)
  })
},

rejectPriceQuote: async (orderId) => {
  const o = get().orders.find(x => x.id === orderId)
  if (!o) return
  await syncAction("rejectPriceQuote", () => ordersApi.transition(orderId, "rejectQuote"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    notify(o, "报价审核驳回", `${o.serviceType}订单报价被驳回，请重新报价`, `/b/service/tasks`)
  })
},

confirmPaymentProof: async (orderId) => {
  const o = get().orders.find(x => x.id === orderId)
  if (!o) return
  await syncAction("confirmPaymentProof", () => ordersApi.transition(orderId, "confirmPayment"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    if (o.priceQuote && o.staffId) {
      useSettlementStore.getState().recordIncome({
        orderId: o.id, staffId: o.staffId, staffName: o.staffName ?? "",
        serviceType: String(o.serviceType), amount: o.priceQuote, payMethod: o.payMethod ?? "online",
      })
    }
    notify(o, "付款凭证已确认", `${o.serviceType}订单收款确认，订单已完成`, `/c/orders/${orderId}`)
  })
},

rejectPaymentProof: async (orderId) => {
  const o = get().orders.find(x => x.id === orderId)
  if (!o) return
  await syncAction("rejectPaymentProof", () => ordersApi.update(orderId, { paymentProof: undefined }), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
    notify(o, "付款凭证驳回", `${o.serviceType}订单付款凭证被驳回，请重新上传`, `/b/service/tasks`)
  })
},
```

- [ ] **Step 8: 改 reDispatch**

```ts
reDispatch: async (orderId) => {
  clearTimer(`conv:${orderId}:pay`)
  const o = get().orders.find(x => x.id === orderId)
  if (!o || o.status !== "S90") return
  await syncAction("reDispatch", () => ordersApi.transition(orderId, "reDispatch"), (result) => {
    set((s) => ({ orders: updateOrder(s.orders, orderId, result) }))
  })
},
```

- [ ] **Step 9: 删除 dispatchOrder(如果存在,它被 assignToStaff 替代了)**

检查 `store.ts` 里是否有 `dispatchOrder` action,如果有,确认没被页面引用后删除。如果被引用,保留但改为调 `ordersApi.dispatch`。

- [ ] **Step 10: 验证**

Run: `cd server && node index.js &`
Run: `npm run dev`

浏览器测试:
1. C 端创建一个便民订单 → 确认订单出现在列表
2. 等 500ms → 确认自动派单(staffName 出现)
3. B 端接单 → 确认状态变 A30
4. 核价 → 确认 priceQuote 出现
5. 支付 → 确认 payMethod 出现
6. 刷新页面 → 所有字段不丢
7. 检查 Network 面板 → 所有请求带 Authorization header

Run: `kill %1`

- [ ] **Step 11: grep 确认无残留**

Run: `grep -n "SEED" src/features/convenience/store/store.ts`
Expected: 无输出

- [ ] **Step 12: Commit**

```bash
git add src/features/convenience/store/
git rm src/features/convenience/store/seed.ts 2>/dev/null || true
git commit -m "feat: migrate convenience store to server-authoritative API"
```

---

## Task 2: settlement store

**Files:**
- Modify: `src/features/convenience/store/settlement-store.ts`

**spec 参考:** §5.2.2

- [ ] **Step 1: 加 API import**

在文件顶部加:
```ts
import { api } from "@/api/client"
import { syncAction } from "@/api/sync"
```

- [ ] **Step 2: 删 SEED_INCOMES / SEED_WITHDRAWALS**

删掉 `const SEED_INCOMES: IncomeRecord[] = []` 和 `const SEED_WITHDRAWALS: WithdrawalRequest[] = []`(空数组,直接删)。

- [ ] **Step 3: 改 recordIncome**

```ts
recordIncome: async (record) => {
  await syncAction("recordIncome", () => api.create("incomes", {
    ...record, completedAt: record.completedAt ?? new Date().toISOString(),
  }), (result) => {
    set((s) => ({ incomes: [result, ...s.incomes] }))
  })
},
```

- [ ] **Step 4: 改提现动作**

```ts
requestWithdrawal: async (staffId, staffName, amount) => {
  if (amount <= 0) return { ok: false, msg: "提现金额需大于 0" }
  const summary = get().getStaffSummary(staffId)
  const pendingAmount = get().withdrawals.filter(w => w.staffId === staffId && w.status === "pending").reduce((s, w) => s + w.amount, 0)
  if (summary.total - pendingAmount < amount) return { ok: false, msg: "可提现余额不足" }
  const result = await syncAction("requestWithdrawal", () => api.create("withdrawals", {
    staffId, staffName, amount, status: "pending",
  }), (r) => {
    set((s) => ({ withdrawals: [r, ...s.withdrawals] }))
  })
  return result ? { ok: true, msg: "提现申请已提交" } : { ok: false, msg: "提交失败" }
},

approveWithdrawal: async (id, reviewer) => {
  await syncAction("approveWithdrawal", () => api.update("withdrawals", id, {
    status: "approved", reviewedAt: new Date().toLocaleString("zh-CN"), reviewer,
  }), (result) => {
    set((s) => ({ withdrawals: s.withdrawals.map(w => w.id === id ? result : w) }))
  })
},

rejectWithdrawal: async (id, reviewer, reason) => {
  await syncAction("rejectWithdrawal", () => api.update("withdrawals", id, {
    status: "rejected", reviewedAt: new Date().toLocaleString("zh-CN"), reviewer, rejectReason: reason,
  }), (result) => {
    set((s) => ({ withdrawals: s.withdrawals.map(w => w.id === id ? result : w) }))
  })
},
```

- [ ] **Step 5: 验证 + Commit**

验证:完成一个订单(触发 recordIncome)→ 刷新 → 收入记录在。
```bash
git add src/features/convenience/store/settlement-store.ts
git commit -m "feat: migrate settlement store to API"
```

---

## Task 3: staff store

**Files:**
- Modify: `src/features/convenience/store/staff-store.ts`

**spec 参考:** §5.2.3

- [ ] **Step 1: 加 API import,删 SEED**

```ts
import { staffApi } from "@/api/client"
import { syncAction } from "@/api/sync"
```
删掉 `const SEED: StaffItem[] = []`。

- [ ] **Step 2: 改所有 mutation**

```ts
addStaff: async (item) => {
  await syncAction("addStaff", () => staffApi.create({
    supplierId: item.supplierId, name: item.name, phone: item.phone,
    enabled: true, status: "offline", assignedOrders: 0,
    joinedAt: new Date().toISOString().slice(0, 10),
  }), (result) => {
    set((s) => ({ staff: [...s.staff, result] }))
  })
},

toggleEnabled: async (id) => {
  const current = get().staff.find(s => s.id === id)
  if (!current) return
  await syncAction("toggleEnabled", () => staffApi.update(id, { enabled: !current.enabled }), (result) => {
    set((s) => ({ staff: s.staff.map(x => x.id === id ? result : x) }))
  })
},

setStaffStatus: async (id, status) => {
  await syncAction("setStaffStatus", () => staffApi.update(id, { status }), (result) => {
    set((s) => ({ staff: s.staff.map(x => x.id === id ? result : x) }))
  })
},

removeStaff: async (id) => {
  await syncAction("removeStaff", () => staffApi.remove(id), () => {
    set((s) => ({ staff: s.staff.filter(x => x.id !== id) }))
  })
},
```

- [ ] **Step 3: 验证 + Commit**

验证:桌面端加一个 staff → 刷新 → 还在。删一个 → 刷新 → 没了。
```bash
git add src/features/convenience/store/staff-store.ts
git commit -m "feat: migrate staff store to API"
```

---

## Task 4: content 6 个 store

**Files:**
- Modify: `src/features/content/store/news-store.ts`
- Modify: `src/features/content/store/guide-store.ts`
- Modify: `src/features/content/store/courtyard-store.ts`
- Modify: `src/features/content/store/merchant-store.ts`
- Modify: `src/features/content/store/poi-store.ts`
- Modify: `src/features/housing/store/housing-store.ts`

**spec 参考:** §5.2.4

- [ ] **Step 1: 改 news-store.ts**

```ts
// Before:
addNews: (item) => {
  syncAction("news.add", () => contentApi.news.create(item), () => {})
  set((s) => ({ news: [...s.news, item] }))
},
updateNews: (id, fields) => {
  syncAction("news.update", () => contentApi.news.update(id, fields), () => {})
  set((s) => ({ news: s.news.map((n) => (n.id === id ? { ...n, ...fields } : n)) }))
},
deleteNews: (id) => {
  syncAction("news.delete", () => contentApi.news.remove(id), () => {})
  set((s) => ({ news: s.news.filter((n) => n.id !== id) }))
},

// After:
addNews: async (item) => {
  await syncAction("news.add", () => contentApi.news.create(item), (result) => {
    set((s) => ({ news: [result, ...s.news] }))
  })
},
updateNews: async (id, fields) => {
  await syncAction("news.update", () => contentApi.news.update(id, fields), (result) => {
    set((s) => ({ news: s.news.map((n) => (n.id === id ? result : n)) }))
  })
},
deleteNews: async (id) => {
  await syncAction("news.delete", () => contentApi.news.remove(id), () => {
    set((s) => ({ news: s.news.filter((n) => n.id !== id) }))
  })
},
```

- [ ] **Step 2: 对其余 5 个 store 应用同样模式**

每个 store 的 add/update/delete 都改成 After 模式:
- `guide-store.ts` — guides 数组,`contentApi.routes`
- `courtyard-store.ts` — courtyards 数组,`contentApi.courtyards`
- `merchant-store.ts` — merchants 数组,`contentApi.merchants`
- `poi-store.ts` — pois 数组,`contentApi.pois`
- `housing-store.ts` — houses 数组,`contentApi.housing`

每个 store 的 `addX` 用 `[result, ...s.x]`,`updateX` 用 `map(x => x.id === id ? result : x)`,`deleteX` 用 `filter(x => x.id !== id)`。

- [ ] **Step 3: 验证 + Commit**

验证:桌面端内容管理 → 加一条新闻 → 刷新 → 还在。改一条 → 刷新 → 改动在。删一条 → 刷新 → 没了。
```bash
git add src/features/content/store/ src/features/housing/store/
git commit -m "feat: migrate content stores to server-authoritative syncAction"
```

---

## Task 5: homepage store

**Files:**
- Modify: `src/features/homepage/store/homepage-store.ts`

**spec 参考:** §5.2.5

- [ ] **Step 1: 删 DEFAULT_GRID / DEFAULT_BANNERS / nextBannerId**

删掉 `const DEFAULT_GRID: GridItemConfig[] = []`、`const DEFAULT_BANNERS: BannerConfig[] = []`、`let nextBannerId = 100`。

- [ ] **Step 2: 改 toggleGridItem(传实际值不再传空对象)**

```ts
toggleGridItem: async (id) => {
  const current = get().gridItems.find(g => g.id === id)
  if (!current) return
  await syncAction("grid.toggle", () => gridApi.update(id, { visible: !current.visible }), (result) => {
    set((s) => ({ gridItems: s.gridItems.map(item => item.id === id ? result : item) }))
  })
},
```

- [ ] **Step 3: 改 updateGridItem / reorderGridItem / addBanner / updateBanner / removeBanner / moveBanner**

```ts
updateGridItem: async (id, fields) => {
  await syncAction("grid.update", () => gridApi.update(id, fields), (result) => {
    set((s) => ({ gridItems: s.gridItems.map(item => item.id === id ? result : item) }))
  })
},

reorderGridItem: async (fromIndex, toIndex) => {
  const items = [...get().gridItems]
  const [moved] = items.splice(fromIndex, 1)
  items.splice(toIndex, 0, moved)
  const reordered = items.map((item, idx) => ({ ...item, order: idx, page: idx < 8 ? 1 : 2 }))
  const ids = reordered.map(r => r.id)
  await syncAction("grid.reorder", () => api.post("grid-items", "/reorder", { ids }), () => {
    set({ gridItems: reordered })
  })
},

addBanner: async (scene) => {
  const maxOrder = get().banners.filter(b => b.scene === scene).reduce((m, b) => Math.max(m, b.order), -1)
  await syncAction("banner.add", () => bannersApi.create({
    scene, imageUrl: "", title: "", order: maxOrder + 1, enabled: true,
  }), (result) => {
    set((s) => ({ banners: [...s.banners, result] }))
  })
  return get().banners[get().banners.length - 1]?.id ?? ""
},

updateBanner: async (id, fields) => {
  await syncAction("banner.update", () => bannersApi.update(id, fields), (result) => {
    set((s) => ({ banners: s.banners.map(b => b.id === id ? result : b) }))
  })
},

removeBanner: async (id) => {
  await syncAction("banner.remove", () => bannersApi.remove(id), () => {
    set((s) => ({ banners: s.banners.filter(b => b.id !== id) }))
  })
},

moveBanner: async (id, direction) => {
  const banners = [...get().banners]
  const idx = banners.findIndex(b => b.id === id)
  if (idx === -1) return
  const swapIdx = idx + direction
  if (swapIdx < 0 || swapIdx >= banners.length) return
  [banners[idx], banners[swapIdx]] = [banners[swapIdx], banners[idx]]
  const reordered = banners.map((b, i) => ({ ...b, order: i }))
  const ids = reordered.map(r => r.id)
  await syncAction("banner.reorder", () => bannersApi.reorder(ids), () => {
    set({ banners: reordered })
  })
},
```

加 `import { api } from "@/api/client"`(reorderGridItem 用到)。

- [ ] **Step 4: 删 resetGridToDefault / initBanners(如果依赖 DEFAULT)**

`resetGridToDefault` 改成空操作或删除:
```ts
resetGridToDefault: () => set({ gridItems: [] }),  // 简化:清空,由后端重新灌
```
`initBanners` 如果只是检查空就跳过(hydrate 已处理),可以删掉或改成空函数。

- [ ] **Step 5: 验证 + Commit**

验证:桌面端首页配置 → 切换宫格显隐 → 刷新 → 状态在。加 Banner → 刷新 → 还在。拖动排序 → 刷新 → 顺序在。
```bash
git add src/features/homepage/store/
git commit -m "feat: migrate homepage store to API, fix empty payload bugs"
```

---

## Task 6: points store

**Files:**
- Modify: `src/features/points/store/points-store.ts`

**spec 参考:** §5.2.6

- [ ] **Step 1: 删 SEED_RULES**

删掉 `const SEED_RULES: PointRule[] = []`。

- [ ] **Step 2: 改 transact(调 API)**

```ts
transact: async (userId, sourceCode, refId, customDelta) => {
  const result = await syncAction("points.transact", () => pointsApi.transact({
    userId, sourceCode, refId, customDelta,
  }), (account) => {
    // account 是 server 返回的更新后账户
    set((s) => ({
      accounts: { ...s.accounts, [userId]: account },
    }))
  })
  if (!result) return { ok: false, msg: "积分操作失败" }
  // 查最新 ledger(server 没返回 ledger,需要单独查或从 account 推导)
  // 简化:transact 后重新查 ledgers
  const accountWithLedgers = await pointsApi.account(userId)
  set((s) => ({
    accounts: { ...s.accounts, [userId]: accountWithLedgers },
    ledgers: accountWithLedgers.ledgers || [],
  }))
  return { ok: true, msg: "积分操作成功", delta: result.balance }
},
```

**注意**:`pointsApi.transact` 返回更新后的 account(不含 ledgers)。如果需要 ledger,调 `pointsApi.account(userId)` 重查(含 ledgers 数组)。或者改 server 的 transact 端点也返回 ledger——但 Plan 1 已固定,这里用重查方案。

- [ ] **Step 3: 改规则 CRUD**

```ts
addRule: async (rule) => {
  await syncAction("points.addRule", () => pointsApi.rules.create(rule), (result) => {
    set((s) => ({ rules: [...s.rules, result] }))
  })
},

updateRule: async (code, patch) => {
  await syncAction("points.updateRule", () => pointsApi.rules.update(code, patch), (result) => {
    set((s) => ({ rules: s.rules.map(r => r.code === code ? result : r) }))
  })
},

removeRule: async (code) => {
  await syncAction("points.removeRule", () => pointsApi.rules.remove(code), () => {
    set((s) => ({ rules: s.rules.filter(r => r.code !== code) }))
  })
},
```

- [ ] **Step 4: 验证 + Commit**

验证:打卡(触发积分)→ 刷新 → 余额在。桌面端改规则 → 刷新 → 改动在。
```bash
git add src/features/points/store/
git commit -m "feat: migrate points store to API"
```

---

## Task 7: trust-score 两个 store

**Files:**
- Modify: `src/features/trust-score/store/rules-store.ts`
- Modify: `src/features/trust-score/store/store.ts`

**spec 参考:** §5.2.7

- [ ] **Step 1: 改 rules-store.ts**

加 API import:
```ts
import { trustApi } from "@/api/client"
import { syncAction } from "@/api/sync"
```

删 `SEED_RULES` 和 `DEFAULT_THRESHOLD`。

改 mutation:
```ts
addRule: async (rule) => {
  await syncAction("trust.addRule", () => trustApi.rules.create(rule), (result) => {
    set((s) => ({ rules: [...s.rules, result] }))
  })
},

updateRule: async (id, patch) => {
  await syncAction("trust.updateRule", () => trustApi.rules.update(id, patch), (result) => {
    set((s) => ({ rules: s.rules.map(r => r.id === id ? result : r) }))
  })
},

removeRule: async (id) => {
  await syncAction("trust.removeRule", () => trustApi.rules.remove(id), () => {
    set((s) => ({ rules: s.rules.filter(r => r.id !== id) }))
  })
},

toggleRule: async (id) => {
  const current = get().rules.find(r => r.id === id)
  if (!current) return
  await syncAction("trust.toggleRule", () => trustApi.rules.update(id, { enabled: !current.enabled }), (result) => {
    set((s) => ({ rules: s.rules.map(r => r.id === id ? result : r) }))
  })
},

updateThreshold: async (patch) => {
  await syncAction("trust.updateThreshold", () => trustApi.threshold.update(patch), (result) => {
    set({ threshold: result })
  })
},

resetThreshold: async () => {
  await syncAction("trust.resetThreshold", () => trustApi.threshold.update({
    defaultScore: 100, delinquentThreshold: 60, autoRecover: true, recoverScore: 70,
  }), (result) => {
    set({ threshold: result })
  })
},

resetRules: () => set({ rules: [] }),  // 简化:清空本地,由 hydrate 重载
```

- [ ] **Step 2: 改 store.ts(诚信分)**

删 `SEED_SCORES` 和 `SEED_SUPPLIER_RATINGS`。

诚信分调整(差评扣分等)通过 API:
```ts
import { api } from "@/api/client"
import { syncAction } from "@/api/sync"

// 如果有 adjustScore 之类的 action,改为:
adjustScore: async (staffId, delta, reason) => {
  const current = get().scores.find(s => s.staffId === staffId)
  if (!current) return
  await syncAction("trust.adjustScore", () => api.update("trust-scores", staffId, {
    trustScore: current.trustScore + delta,
  }), (result) => {
    set((s) => ({ scores: s.scores.map(x => x.staffId === staffId ? result : x) }))
  })
},
```

**注意**:如果 store.ts 没有调整诚信分的 mutation(只是读取),这一步可以跳过,只删种子数据。

- [ ] **Step 3: 验证 + Commit**

验证:桌面端诚信分规则 → 改一条 → 刷新 → 改动在。改阈值 → 刷新 → 阈值在。
```bash
git add src/features/trust-score/store/
git commit -m "feat: migrate trust-score stores to API"
```

---

## Task 8: volunteer store

**Files:**
- Modify: `src/features/volunteer/store/store.ts`

**spec 参考:** §5.2.8

- [ ] **Step 1: 改所有 syncAction 回调**

找出所有 `syncAction(..., () => {})` 的调用,改成用返回值。核心 action:
- `signUp` → `api.create("volunteers", ...)`
- `approveVolunteer` / `rejectVolunteer` → `api.update("volunteers", id, { status, reviewNote })`
- `checkIn` / `checkOut` → `api.create("volunteer-records", ...)` / `api.update("volunteer-records", id, ...)`

每个改成:
```ts
await syncAction("xxx", () => apiXxx(args), (result) => {
  set((s) => ({ /* 用 result 更新 */ }))
})
```

- [ ] **Step 2: 删前端种子数据**

grep 找硬编码数组:`grep -n "const.*= \[" src/features/volunteer/store/store.ts`,删掉所有种子数据数组。

- [ ] **Step 3: 验证 + Commit**

验证:报名志愿者 → 刷新 → 记录在。审批 → 刷新 → 状态在。
```bash
git add src/features/volunteer/store/
git commit -m "feat: migrate volunteer store to API"
```

---

## Task 9: checkin + naxi stores

**Files:**
- Modify: `src/features/checkin/store/checkin-store.ts`
- Modify: `src/features/checkin/store/naxi-store.ts`

**spec 参考:** §5.2.9

- [ ] **Step 1: 改 checkin-store.ts — 删 genSeeds + COURTYARDS + USERS + PHOTOS**

删掉 `genSeeds()` 函数和它依赖的 `COURTYARDS`/`USERS`/`PHOTOS` 常量(这些是生成假数据的,不要了)。

改 `addCheckin`:
```ts
import { api, uploadFile } from "@/api/client"
import { syncAction } from "@/api/sync"

addCheckin: async (input) => {
  // 如果 input.imageUrl 是 File,先上传
  let imageUrl = input.imageUrl
  if (imageUrl instanceof File) {
    imageUrl = await uploadFile(imageUrl)
  }
  await syncAction("checkin.add", () => api.create("checkins", {
    userId: input.userId, courtyardId: input.courtyardId,
    imageUrl, note: input.note, lat: input.lat, lng: input.lng,
  }), (result) => {
    set((s) => ({ checkins: [result, ...s.checkins] }))
    usePointsStore.getState().transact(input.userId, "courtyard_checkin", result.id)
  })
},
```

**注意**:如果 `addCheckin` 的 input 当前不包含 File 类型(只接 URL 字符串),跳过 uploadFile 逻辑,直接存 URL。检查调用 `addCheckin` 的页面看它传什么。

- [ ] **Step 2: 改 naxi-store.ts — 删 nx1/nx2/nx3**

删掉初始 `checkins: [{ id: "nx1", ... }, ...]` 硬编码,改为 `checkins: []`。

改 `addCheckin`:
```ts
import { api, uploadFile } from "@/api/client"
import { syncAction } from "@/api/sync"

addCheckin: async (input) => {
  let photo = input.photo
  if (photo instanceof File) {
    photo = await uploadFile(photo)
  }
  const result = await syncAction("naxi.add", () => api.create("naxi-checkins", {
    userId: input.userId, photo, location: input.location,
  }), (r) => {
    set((s) => ({ checkins: [r, ...s.checkins] }))
  })
  if (result) {
    const streak = get().getStreak(input.userId)
    if (streak > 0 && streak % 7 === 0) {
      usePointsStore.getState().transact(input.userId, "naxi_streak", result.id)
    }
  }
  return result ? { ok: true, msg: "打卡成功" } : { ok: false, msg: "打卡失败" }
},
```

- [ ] **Step 3: 验证 + Commit**

验证:C 端打卡 → 刷新 → 记录在。纳西人打卡 → 刷新 → 记录在。
```bash
git add src/features/checkin/store/
git commit -m "feat: migrate checkin/naxi stores to API, remove hardcoded seeds"
```

---

## Task 10: complaints store

**Files:**
- Modify: `src/features/complaints/store/store.ts`

**spec 参考:** §5.2.10

- [ ] **Step 1: 改 createComplaint(set 移进回调)**

```ts
createComplaint: async (c) => {
  await syncAction("createComplaint", () => complaintsApi.create({
    ...c, status: "C10" as ComplaintStatus,
  }), (result) => {
    set((s) => ({ complaints: [result, ...s.complaints] }))
  })
},
```

- [ ] **Step 2: 改 resolveWithResult / reject(调新端点)**

```ts
resolveWithResult: async (id, result_text) => {
  await syncAction("complaint.resolve", () => complaintsApi.resolve(id, result_text), (result) => {
    set((s) => ({ complaints: s.complaints.map(c => c.id === id ? result : c) }))
  })
  const complaint = get().complaints.find(c => c.id === id)
  if (complaint) {
    useNotificationStore.getState().addNotification({
      type: "system", title: "投诉已处理",
      summary: `您的投诉「${complaint.type}」已处理完成。处理结果：${result_text}`,
      targetUrl: `/c/complaints/${id}`,
    })
  }
},

reject: async (id, reason) => {
  await syncAction("complaint.reject", () => complaintsApi.reject(id, reason), (result) => {
    set((s) => ({ complaints: s.complaints.map(c => c.id === id ? result : c) }))
  })
  const complaint = get().complaints.find(c => c.id === id)
  if (complaint) {
    useNotificationStore.getState().addNotification({
      type: "system", title: "投诉被驳回",
      summary: `您的投诉「${complaint.type}」已被驳回。原因：${reason}`,
      targetUrl: `/c/complaints/${id}`,
    })
  }
},
```

- [ ] **Step 3: 验证 + Commit**

验证:C 端提交投诉 → 刷新 → 记录在。桌面端处理投诉 → 刷新 → 状态在。
```bash
git add src/features/complaints/store/
git commit -m "feat: migrate complaints store to API with resolve/reject endpoints"
```

---

## Task 11: favorite / address / booking stores

**Files:**
- Modify: `src/features/favorite/store/favorite-store.ts`
- Modify: `src/features/address/store/address-store.ts`
- Modify: `src/features/booking/store/booking-store.ts`

**spec 参考:** §5.2.11

- [ ] **Step 1: 改 favorite-store.ts**

```ts
add: async (item) => {
  await syncAction("favorite.add", () => favoritesApi.create({
    ...item,
    itemId: typeof item.itemId === "string" ? Number(item.itemId) : item.itemId,
  }), (result) => {
    set((s) => ({ favorites: [result, ...s.favorites] }))
  })
},

remove: async (id) => {
  await syncAction("favorite.remove", () => favoritesApi.remove(id), () => {
    set((s) => ({ favorites: s.favorites.filter(f => f.id !== id) }))
  })
},
```

- [ ] **Step 2: 改 address-store.ts**

```ts
upsert: async (addr) => {
  const idx = get().addresses.findIndex(a => a.id === addr.id)
  await syncAction("address.upsert", () => idx >= 0 ? addressesApi.update(addr.id, addr) : addressesApi.create(addr), (result) => {
    set((s) => {
      let list = [...s.addresses]
      if (addr.isDefault) list = list.map(a => ({ ...a, isDefault: false }))
      const idx2 = list.findIndex(a => a.id === result.id)
      if (idx2 >= 0) list[idx2] = result
      else list.push(result)
      return { addresses: list }
    })
  })
},

remove: async (id) => {
  await syncAction("address.remove", () => addressesApi.remove(id), () => {
    set((s) => ({ addresses: s.addresses.filter(a => a.id !== id) }))
  })
},

setDefault: async (id) => {
  // 先把所有地址 isDefault 设为 false,再把目标设为 true
  const all = get().addresses
  await syncAction("address.setDefault", async () => {
    // 逐个 update(server 端没有批量操作)
    for (const a of all) {
      await addressesApi.update(a.id, { isDefault: a.id === id })
    }
    return addressesApi.get(id)  // 不存在 get,改用 list 重查
  }, () => {
    set((s) => ({ addresses: s.addresses.map(a => ({ ...a, isDefault: a.id === id })) }))
  })
},
```

**简化 setDefault**:server 端没有 `addressesApi.get`,可以改成直接调 update 后本地更新:
```ts
setDefault: async (id) => {
  const all = get().addresses
  await syncAction("address.setDefault", async () => {
    for (const a of all) {
      if (a.isDefault || a.id === id) {
        await addressesApi.update(a.id, { isDefault: a.id === id })
      }
    }
    return null
  }, () => {
    set((s) => ({ addresses: s.addresses.map(a => ({ ...a, isDefault: a.id === id })) }))
  })
},
```

- [ ] **Step 3: 改 booking-store.ts**

```ts
createBooking: async (input) => {
  const sameSlot = get().getBookingsByCourtyard(input.courtyardId, input.date).filter(b => b.slot === input.slot)
  const used = sameSlot.reduce((s, b) => s + b.visitors, 0)
  if (used + input.visitors > 20) return { ok: false, msg: "该时段已约满" }
  const result = await syncAction("booking.create", () => bookingsApi.create({
    ...input, code: genCode(), status: "pending",
  }), (r) => {
    set((s) => ({ bookings: [r, ...s.bookings] }))
  })
  return result ? { ok: true, msg: "预约成功", booking: result } : { ok: false, msg: "预约失败" }
},

checkByCode: async (code) => {
  const result = await syncAction("booking.check", () => api.post("bookings", "/check", { code }), (r) => {
    set((s) => ({ bookings: s.bookings.map(b => b.id === r.id ? r : b) }))
  })
  if (!result) return { ok: false, msg: "核销失败" }
  return { ok: true, msg: "核销成功" }
},

cancelBooking: async (id) => {
  await syncAction("booking.cancel", () => bookingsApi.update(id, { status: "cancelled" }), (result) => {
    set((s) => ({ bookings: s.bookings.map(b => b.id === id ? result : b) }))
  })
},
```

加 `import { api } from "@/api/client"`(checkByCode 用到)。

- [ ] **Step 4: 验证 + Commit**

验证:收藏一个商户 → 刷新 → 还在。加地址 → 刷新 → 还在。预约院落 → 刷新 → 还在。
```bash
git add src/features/favorite/store/ src/features/address/store/ src/features/booking/store/
git commit -m "feat: migrate favorite/address/booking stores to API"
```

---

## Task 12: merchant-review / supplier / ai-knowledge stores

**Files:**
- Modify: `src/features/merchant-review/store/registration-store.ts`
- Modify: `src/features/merchant-review/store/store.ts`
- Modify: `src/features/supplier/store/supplier-store.ts`
- Modify: `src/features/ai-knowledge/store/store.ts`

**spec 参考:** §5.2.12

- [ ] **Step 1: 改 registration-store.ts**

所有 `syncAction(..., () => {})` 改成用返回值。`create` → `merchantRegApi.create(...)` → `(result) => set(...)`。

- [ ] **Step 2: 改 merchant-review/store.ts**

加 API import,mutation 走 `api.create/update("merchant-reviews", ...)`。删硬编码种子。

- [ ] **Step 3: 改 supplier-store.ts**

```ts
create: async (data) => {
  await syncAction("supplier.create", () => supplierApi.create(data), (result) => {
    set((s) => ({ suppliers: [result, ...s.suppliers] }))
  })
},
```
其他 mutation 同理。删硬编码种子。

- [ ] **Step 4: 改 ai-knowledge/store.ts**

所有 `syncAction(..., () => {})` 改成用返回值。

- [ ] **Step 5: 验证 + Commit**

```bash
git add src/features/merchant-review/store/ src/features/supplier/store/ src/features/ai-knowledge/store/
git commit -m "feat: migrate merchant-review/supplier/ai-knowledge stores to API"
```

---

## Task 13: announcement / flow-warning stores + hydrate 更新

**Files:**
- Modify: `src/features/announcement/store/announcement-store.ts`
- Modify: `src/features/flow-warning/store/flow-warning-store.ts`
- Modify: `src/api/hydrate.ts`

**spec 参考:** §5.2.13, §5.3

- [ ] **Step 1: 改 announcement-store.ts**

加 API import,删硬编码种子:
```ts
import { api } from "@/api/client"
import { syncAction } from "@/api/sync"

// 删掉硬编码的 announcements 数组,初始值改 []
announcements: [],

add: async (item) => {
  await syncAction("announcement.add", () => api.create("announcements", item), (result) => {
    set((s) => ({ announcements: [result, ...s.announcements] }))
  })
},
update: async (id, fields) => {
  await syncAction("announcement.update", () => api.update("announcements", id, fields), (result) => {
    set((s) => ({ announcements: s.announcements.map(a => a.id === id ? result : a) }))
  })
},
remove: async (id) => {
  await syncAction("announcement.remove", () => api.remove("announcements", id), () => {
    set((s) => ({ announcements: s.announcements.filter(a => a.id !== id) }))
  })
},
```

- [ ] **Step 2: 改 flow-warning-store.ts**

同上模式,`api.create/update/remove("flow-warnings", ...)`。删硬编码种子。

- [ ] **Step 3: 更新 hydrate.ts**

在 `src/api/hydrate.ts` 的 `Promise.allSettled` 数组末尾加:
```ts
api.list("announcements", { pageSize: 200 }),
api.list("flow-warnings", { pageSize: 200 }),
```

在 results 解析部分加(注意索引要对应):
```ts
const r = results.map(r => r.status === "fulfilled" ? (r.value?.items || []) : [])

// ... 现有的 setState ...

useAnnouncementStore.setState({ announcements: r[29] })  // 索引按实际位置调整
useFlowWarningStore.setState({ warnings: r[30] })
```

**注意**:索引号要对应 `Promise.allSettled` 数组里的位置。现有数组有 30 项(索引 0-29),加两项后是 31 项(索引 0-30)。新增的 announcements 是 r[29],flow-warnings 是 r[30]。**但现有的最后一项是 r[29](merchant-reviews),所以新增的应该是 r[30] 和 r[31]**。仔细数清楚再写。

在 offline 分支(后端不可用时)也加:
```ts
useAnnouncementStore.setState({ announcements: [] })
useFlowWarningStore.setState({ warnings: [] })
```

加 import:
```ts
import { useAnnouncementStore } from "@/features/announcement/store"
import { useFlowWarningStore } from "@/features/flow-warning/store"
```

- [ ] **Step 4: 验证 + Commit**

验证:桌面端公告管理 → 加一条 → 刷新 → 还在。
```bash
git add src/features/announcement/store/ src/features/flow-warning/store/ src/api/hydrate.ts
git commit -m "feat: migrate announcement/flow-warning stores to API, update hydrate"
```

---

## Task 14: 最终验证(全部 store 迁移完成)

**spec 参考:** §7

- [ ] **Step 1: grep 确认无残留硬编码**

```bash
grep -rn "const SEED" src/features/ --include="*.ts"
grep -rn "const DEFAULT_" src/features/ --include="*.ts" | grep -v "DEFAULT_THRESHOLD\|DEFAULT_GRID\|DEFAULT_BANNERS"
grep -rn "nx1\|nx2\|nx3" src/features/
grep -rn "genSeeds" src/features/
grep -rn "() => {}" src/features/ --include="*.ts" | grep syncAction
```
Expected: 无输出(或只有注释)

- [ ] **Step 2: 端到端验证(核心场景)**

启动 server + 前端,逐个验证:

**便民服务全流程:**
- [ ] C 端创建订单 → 自动派单 → B 端接单 → 核价 → 支付 → 开始服务 → 完成 → 评价
- [ ] 刷新页面 → 所有状态和字段不丢
- [ ] 取消流程:申请取消 → 桌面端审批 → 同意/拒绝

**内容管理:**
- [ ] 桌面端加新闻/院落/商户/POI/公房 → 刷新 → 都在
- [ ] 改一条 → 刷新 → 改动在
- [ ] 删一条 → 刷新 → 没了

**首页配置:**
- [ ] 切换宫格显隐 → 刷新 → 状态在
- [ ] 加 Banner → 刷新 → 还在
- [ ] 拖动排序 → 刷新 → 顺序在

**积分/诚信分:**
- [ ] 打卡 → 积分增加 → 刷新 → 余额在
- [ ] 改积分规则 → 刷新 → 改动在
- [ ] 改诚信分阈值 → 刷新 → 阈值在

**打卡/收藏/地址/预约:**
- [ ] C 端打卡 → 刷新 → 记录在
- [ ] 纳西人打卡 → 刷新 → 记录在
- [ ] 收藏商户 → 刷新 → 还在
- [ ] 加地址 → 刷新 → 还在
- [ ] 预约院落 → 刷新 → 还在

**投诉:**
- [ ] C 端提交投诉 → 刷新 → 记录在
- [ ] 桌面端处理 → 刷新 → 状态在

- [ ] **Step 3: 数据持久化终极测试**

改一堆数据 → 重启 server → 刷新前端 → 所有改动还在。

- [ ] **Step 4: 类型检查**

Run: `npx tsc --noEmit 2>&1 | grep "src/api/\|src/features/" | head -20`
Expected: 无严重类型错误

- [ ] **Step 5: Commit(全部完成)**

```bash
git add -A
git commit -m "chore: Phase 3 complete - all stores migrated to server-authoritative API"
```

---

## 完成标准

- [ ] `grep -rn "const SEED" src/features/` 无输出
- [ ] `grep -rn "() => {}" src/features/ | grep syncAction` 无输出
- [ ] `grep -rn "genSeeds\|nx1\|nx2\|nx3" src/features/` 无输出
- [ ] 便民服务全流程:创建 → 派单 → 接单 → 核价 → 支付 → 完成 → 评价,刷新后全不丢
- [ ] 内容管理增删改,刷新后全不丢
- [ ] 首页配置(宫格/Banner/排序),刷新后全不丢
- [ ] 积分/诚信分规则和阈值,刷新后全不丢
- [ ] 打卡/收藏/地址/预约/投诉,刷新后全不丢
- [ ] 重启 server 后,所有用户改动还在
- [ ] API 失败时(断开后端)操作报 toast,本地 state 不变
