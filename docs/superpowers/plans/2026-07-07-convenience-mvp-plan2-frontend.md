# 便民服务 MVP 改造 Plan 2:前端适配

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 前端适配 Plan 1 的 server 端能力:C 端支付方式选择 + B 端到场打卡/拒单/提现 + 桌面端强制取消/S90 人工池/禁用处理弹窗/系统配置页。

**Architecture:** 改造现有 c-end/b-end/desktop 页面,接 Plan 1 新增的 API 端点(arrive-checkin/lock-payment/pay-online/confirm-cash/rate/reject-quote/restore-quote/staff disable)。store 的 syncAction 模式不变,删除前端 recordIncome 调用(server 自动记)。

**Tech Stack:** React 18, zustand, shadcn/ui, TypeScript

## Global Constraints

- 前端只发请求,不做状态流转计算(spec §8.1 架构红线)
- syncAction 铁律:用返回值更新本地 state,失败 toast 不改本地
- 删除前端 store 里所有"联动副作用"调用(recordIncome/transact 等),server 自动处理
- 评价弹窗支持 content + images(不只 rating 数字)
- 支付方式锁定后 UI 隔离(online→B 端无收款按钮,cash→C 端无线上支付按钮)
- 参考文档:`docs/superpowers/specs/2026-07-07-convenience-mvp-design.md`

---

## File Structure

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/api/client.ts` | ordersApi 加 arriveCheckin/lockPayment/payOnline/confirmCash/rate/rejectQuote/restoreQuote 方法 |
| `src/features/convenience/store/store.ts` | 删 recordIncome 调用;加 arriveCheckin/lockPayment/payOnline/confirmCash action |
| `src/features/convenience/c-end/pages/ServiceTrackingPage.tsx` | 支付方式选择 UI + 锁定后隔离 + 评价弹窗加 content/images |
| `src/features/convenience/c-end/pages/OrderDetailPage.tsx` | 评价弹窗加 content/images;拒绝报价按钮 |
| `src/features/convenience/b-end/pages/ServiceOrderDetail.tsx` | 到场打卡按钮 + 报价前置校验提示 + 拒单真接 action + 现金收款按钮 |
| `src/features/convenience/b-end/pages/QuoteAndPhotoFlow.tsx` | 报价前打卡提示 |
| `src/features/convenience/b-end/pages/ServiceTasks.tsx` | "暂不接单"真接 rejectOrder + 拒单原因 |
| `src/features/convenience/b-end/pages/ServiceProfile.tsx` | 申请提现入口 |
| `src/features/convenience/desktop/pages/ConveniencePage.tsx` | 强制取消按钮 + S90 人工处理 tab(独立) |
| `src/features/convenience/desktop/pages/ConvenienceStaffPage.tsx` | 禁用 staff 时弹窗处理进行中订单 |
| `src/features/convenience/desktop/pages/SettlementPage.tsx` | (小改)余额显示用 staff.balance |
| `src/desktop/pages/`(新增) | SystemConfigPage 系统配置页 |

### 新建文件

| 文件 | 职责 |
|------|------|
| `src/desktop/pages/SystemConfigPage.tsx` | 系统配置(扣费规则/超时/派单参数) |

---

## Task 1: API client 加新端点方法

**Files:**
- Modify: `src/api/client.ts`

**Interfaces:**
- Produces: ordersApi 加 7 个新方法(arriveCheckin/lockPayment/payOnline/confirmCash/rate/rejectQuote/restoreQuote)

- [ ] **Step 1: 在 `src/api/client.ts` 的 ordersApi 对象加方法**

```ts
export const ordersApi = {
  list: (params?: ListParams) => api.list("orders", params),
  get: (id: string) => api.get("orders", id),
  create: (data: any) => api.create("orders", data),
  update: (id: string, data: any) => api.update("orders", id, data),
  remove: (id: string) => api.remove("orders", id),
  transition: (id: string, action: string, fields?: Record<string, unknown>) =>
    api.post("orders", `/${id}/transition`, { action, ...fields }),
  dispatch: (id: string, mode: "auto" | "manual", staffId?: string) =>
    api.post("orders", `/${id}/dispatch`, { mode, staffId }),
  // 新增
  arriveCheckin: (id: string, staffId?: string) =>
    api.post("orders", `/${id}/arrive-checkin`, { staffId }),
  lockPayment: (id: string, paymentMethod: "online" | "cash", userId?: string) =>
    api.post("orders", `/${id}/lock-payment`, { paymentMethod, userId }),
  payOnline: (id: string, userId?: string) =>
    api.post("orders", `/${id}/pay-online`, { userId }),
  confirmCash: (id: string, staffId?: string) =>
    api.post("orders", `/${id}/confirm-cash`, { staffId }),
  rate: (id: string, data: { rating: number; content?: string; images?: string[]; userId?: string; userName?: string }) =>
    api.post("orders", `/${id}/rate`, data),
  rejectQuote: (id: string, reason: string, userId?: string) =>
    api.post("orders", `/${id}/reject-quote`, { reason, userId }),
  restoreQuote: (id: string, adminId?: string) =>
    api.post("orders", `/${id}/restore-quote`, { adminId }),
}
```

- [ ] **Step 2: 验证类型**

Run: `npx tsc --noEmit src/api/client.ts 2>&1 | head -5`
Expected: 无错误(或只有其他文件的预存错误)

- [ ] **Step 3: Commit**

```bash
git add src/api/client.ts
git commit -m "feat: add 7 new order API methods for MVP (arriveCheckin/lockPayment/payOnline/confirmCash/rate/rejectQuote/restoreQuote)"
```

---

## Task 2: convenience store 删 recordIncome + 加新 actions

**Files:**
- Modify: `src/features/convenience/store/store.ts`

**Interfaces:**
- Produces: store 加 arriveCheckin/lockPayment/payOnline/confirmCash/rejectQuote actions;confirmComplete 删 recordIncome 调用

- [ ] **Step 1: 在 `src/features/convenience/store/store.ts` 加新 actions**

在 `uploadPaymentProof` 之后加:
```ts
arriveCheckin: async (orderId: string) => {
  await syncAction<ConvenienceOrder>(
    "arriveCheckin",
    () => ordersApi.arriveCheckin(orderId),
    (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
  )
},

lockPayment: async (orderId: string, paymentMethod: "online" | "cash") => {
  await syncAction<ConvenienceOrder>(
    "lockPayment",
    () => ordersApi.lockPayment(orderId, paymentMethod),
    (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
  )
},

payOnline: async (orderId: string) => {
  await syncAction<ConvenienceOrder>(
    "payOnline",
    () => ordersApi.payOnline(orderId),
    (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
  )
},

confirmCash: async (orderId: string) => {
  await syncAction<ConvenienceOrder>(
    "confirmCash",
    () => ordersApi.confirmCash(orderId),
    (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
  )
},

rejectQuote: async (orderId: string, reason: string) => {
  await syncAction<ConvenienceOrder>(
    "rejectQuote",
    () => ordersApi.rejectQuote(orderId, reason),
    (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
  )
},

rateOrder: async (orderId: string, rating: number, content?: string, images?: string[]) => {
  await syncAction<ConvenienceOrder>(
    "rateOrder",
    () => ordersApi.rate(orderId, { rating, content, images }),
    (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
  )
},
```

注意:替换原来的 `rateOrder`(只写 rating 的版本)。

- [ ] **Step 2: 在 `confirmComplete` 里删除 recordIncome 调用**

找到 `confirmComplete` action,删除这段:
```ts
if (o.priceQuote && o.staffId) {
  useSettlementStore.getState().recordIncome({...})
}
```
保留 `usePointsStore.getState().transact(o.userId, "mall_purchase", orderId)`(积分还是前端触发,server 不自动)。

同样在 `confirmPaymentProof` 里也删 recordIncome 调用。

- [ ] **Step 3: 删除 useSettlementStore import(如果不再用)**

如果 store.ts 顶部 `import { useSettlementStore }` 不再被引用,删除。如果还有其他地方用,保留。

- [ ] **Step 4: 验证类型**

Run: `npx tsc --noEmit src/features/convenience/store/store.ts 2>&1 | head -10`
Expected: 无错误

- [ ] **Step 5: Commit**

```bash
git add src/features/convenience/store/store.ts
git commit -m "feat: store adds arriveCheckin/lockPayment/payOnline/confirmCash/rejectQuote/rateOrder + remove frontend recordIncome"
```

---

## Task 3: C 端支付方式选择 UI

**Files:**
- Modify: `src/features/convenience/c-end/pages/ServiceTrackingPage.tsx`

**Interfaces:**
- Produces: A35 且 paymentMethodLocked=0 时显示"确认报价"按钮 + 支付方式选择(线上/现金);锁定后按 paymentMethod 隔离 UI

- [ ] **Step 1: 在 ServiceTrackingPage 的 A35 状态区域加支付方式选择**

找到 A35 状态的渲染区域(通常有"我已支付"按钮的地方),替换为:
```tsx
{order.status === "A35" && !order.paymentMethodLocked && (
  <div className="space-y-3">
    <div className="text-sm text-text-secondary">请确认报价并选择支付方式</div>
    <div className="flex gap-2">
      <button
        onClick={() => useConvenienceStore.getState().lockPayment(order.id, "online")}
        className="flex-1 h-12 rounded-xl bg-primary text-white font-medium"
      >
        确认报价 ¥{order.priceQuote} · 线上支付
      </button>
      <button
        onClick={() => useConvenienceStore.getState().lockPayment(order.id, "cash")}
        className="flex-1 h-12 rounded-xl bg-amber-100 text-amber-700 font-medium"
      >
        确认报价 ¥{order.priceQuote} · 现金支付
      </button>
    </div>
    <button
      onClick={() => {
        const reason = prompt("请输入拒绝原因") || ""
        useConvenienceStore.getState().rejectQuote(order.id, reason)
      }}
      className="w-full text-sm text-rose-600 py-2"
    >
      拒绝报价(转人工处理)
    </button>
  </div>
)}

{order.status === "A35" && order.paymentMethodLocked === 1 && order.paymentMethod === "online" && (
  <button
    onClick={() => useConvenienceStore.getState().payOnline(order.id)}
    className="w-full h-12 rounded-xl bg-primary text-white font-medium"
  >
    立即支付 ¥{order.priceQuote}
  </button>
)}

{order.status === "A35" && order.paymentMethodLocked === 1 && order.paymentMethod === "cash" && (
  <div className="text-center text-sm text-text-secondary py-3">
    请向服务人员支付现金 ¥{order.priceQuote}
  </div>
)}
```

- [ ] **Step 2: 删除原来的"我已支付"按钮(如果存在)**

搜索 `markPaid` 调用,删除(被 payOnline/confirmCash 替代)。

- [ ] **Step 3: 验证**

起前端,登录 C 端,找一个 A35 订单,确认显示两个支付方式按钮 + 拒绝报价链接。点"线上支付"锁定后,显示"立即支付"按钮;点"现金支付"锁定后,显示"请向服务人员支付现金"。

- [ ] **Step 4: Commit**

```bash
git add src/features/convenience/c-end/pages/ServiceTrackingPage.tsx
git commit -m "feat: C-end payment method selection UI + lock isolation"
```

---

## Task 4: C 端评价弹窗加 content/images

**Files:**
- Modify: `src/features/convenience/c-end/pages/OrderDetailPage.tsx`
- Modify: `src/features/convenience/c-end/pages/ServiceTrackingPage.tsx`

**Interfaces:**
- Produces: 评价弹窗支持文字内容 + 图片上传,调用 `rateOrder(id, rating, content, images)`

- [ ] **Step 1: 找到 OrderDetailPage 的评价弹窗,加 content/images 输入**

搜索 `selectedRating` 或 `rateOrder`,在星级选择下方加:
```tsx
<textarea
  value={reviewContent}
  onChange={(e) => setReviewContent(e.target.value)}
  placeholder="说说您的服务体验..."
  className="w-full h-24 rounded-xl border p-3 text-sm"
/>
<input
  type="file"
  accept="image/*"
  multiple
  onChange={(e) => setReviewImages(Array.from(e.target.files || []))}
/>
```

- [ ] **Step 2: 修改提交逻辑,调 rateOrder 传 content + images**

```tsx
const handleSubmit = async () => {
  // 如果有图片文件,先上传(用 uploadFile helper)
  const imageUrls: string[] = []
  for (const file of reviewImages) {
    const url = await uploadFile(file)
    imageUrls.push(url)
  }
  await useConvenienceStore.getState().rateOrder(id, selectedRating, reviewContent, imageUrls)
  // 关闭弹窗
}
```

需要 `import { uploadFile } from "@/api/client"`。

- [ ] **Step 3: 同样改 ServiceTrackingPage 的评价弹窗**

复制相同模式。

- [ ] **Step 4: 验证**

起前端,找一个 S40 订单,评价时能输入文字 + 选图片,提交后桌面端评价管理能看到完整 review。

- [ ] **Step 5: Commit**

```bash
git add src/features/convenience/c-end/pages/OrderDetailPage.tsx src/features/convenience/c-end/pages/ServiceTrackingPage.tsx
git commit -m "feat: review dialog supports content + images upload"
```

---

## Task 5: B 端到场打卡 + 报价前置校验

**Files:**
- Modify: `src/features/convenience/b-end/pages/ServiceOrderDetail.tsx`
- Modify: `src/features/convenience/b-end/pages/QuoteAndPhotoFlow.tsx`

**Interfaces:**
- Produces: A30 状态显示"到场打卡"按钮;未打卡时报价入口置灰提示

- [ ] **Step 1: 在 ServiceOrderDetail 的 A30 状态区域加打卡按钮**

```tsx
{order.status === "A30" && !order.arrivedAt && (
  <button
    onClick={() => useConvenienceStore.getState().arriveCheckin(order.id)}
    className="w-full h-12 rounded-xl bg-emerald-600 text-white font-medium"
  >
    到场打卡
  </button>
)}
{order.status === "A30" && order.arrivedAt && (
  <div className="text-sm text-emerald-600">已到场打卡 {new Date(order.arrivedAt).toLocaleString()}</div>
)}
```

- [ ] **Step 2: 在 QuoteAndPhotoFlow 的报价按钮加前置校验**

找到报价提交按钮,加 disabled 条件:
```tsx
<button
  disabled={!order.arrivedAt}
  className={`w-full h-12 rounded-xl ${order.arrivedAt ? "bg-primary text-white" : "bg-gray-200 text-gray-400"}`}
  onClick={handleSubmit}
>
  {order.arrivedAt ? "确认报价" : "请先完成到场打卡"}
</button>
```

- [ ] **Step 3: 验证**

B 端接单后(A30),显示"到场打卡"按钮;打卡后显示时间;报价页未打卡时按钮置灰提示。

- [ ] **Step 4: Commit**

```bash
git add src/features/convenience/b-end/pages/ServiceOrderDetail.tsx src/features/convenience/b-end/pages/QuoteAndPhotoFlow.tsx
git commit -m "feat: B-end arrive checkin + quote prerequisite"
```

---

## Task 6: B 端拒单真接 action + 现金收款

**Files:**
- Modify: `src/features/convenience/b-end/pages/ServiceTasks.tsx`
- Modify: `src/features/convenience/b-end/pages/ServiceOrderDetail.tsx`

**Interfaces:**
- Produces: "暂不接单"按钮真调 `transition action=reject`;A35 且 paymentMethod=cash 时显示"确认现金已收"按钮

- [ ] **Step 1: 在 ServiceTasks 的"暂不接单"按钮接真 action**

找到"暂不接单"按钮,改 onClick:
```tsx
<button
  onClick={() => {
    const reason = prompt("请输入拒单原因") || ""
    useConvenienceStore.getState().rejectOrder(order.id, reason)
    toast.success("已拒单,订单将重新派单")
  }}
>
  暂不接单
</button>
```

- [ ] **Step 2: 在 store 加 rejectOrder action**

在 `src/features/convenience/store/store.ts` 加:
```ts
rejectOrder: async (orderId: string, reason: string) => {
  await syncAction<ConvenienceOrder>(
    "rejectOrder",
    () => ordersApi.transition(orderId, "reject", { reason }),
    (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
  )
},
```

- [ ] **Step 3: 在 ServiceOrderDetail 的 A35 + cash 状态加"确认现金已收"按钮**

```tsx
{order.status === "A35" && order.paymentMethodLocked === 1 && order.paymentMethod === "cash" && (
  <button
    onClick={() => useConvenienceStore.getState().confirmCash(order.id)}
    className="w-full h-12 rounded-xl bg-amber-600 text-white font-medium"
  >
    确认现金已收 ¥{order.priceQuote}
  </button>
)}
{order.status === "A35" && order.paymentMethodLocked === 1 && order.paymentMethod === "online" && (
  <div className="text-sm text-text-secondary text-center">
    等待用户线上支付...
  </div>
)}
```

- [ ] **Step 4: 验证**

B 端 A20 订单点"暂不接单",弹窗输原因,订单回 A10;A35 + cash 显示"确认现金已收"按钮,点击后 A40。

- [ ] **Step 5: Commit**

```bash
git add src/features/convenience/b-end/pages/ServiceTasks.tsx src/features/convenience/b-end/pages/ServiceOrderDetail.tsx src/features/convenience/store/store.ts
git commit -m "feat: B-end rejectOrder wired + confirmCash button"
```

---

## Task 7: B 端提现入口

**Files:**
- Modify: `src/features/convenience/b-end/pages/ServiceProfile.tsx`

**Interfaces:**
- Produces: ServiceProfile 加"申请提现"卡片,显示可提现余额,点击弹窗输入金额

- [ ] **Step 1: 在 ServiceProfile 加提现卡片**

```tsx
import { useSettlementStore } from "../../store"

// 在组件里
const { requestWithdrawal } = useSettlementStore.getState()
const [withdrawOpen, setWithdrawOpen] = useState(false)
const [withdrawAmount, setWithdrawAmount] = useState("")

// 找到合适位置加卡片
<div className="bg-white rounded-xl p-4">
  <div className="text-sm text-text-secondary">可提现余额</div>
  <div className="text-2xl font-bold text-emerald-600">¥{staffBalance}</div>
  <button
    onClick={() => setWithdrawOpen(true)}
    className="mt-3 w-full h-10 rounded-lg bg-primary text-white text-sm"
  >
    申请提现
  </button>
</div>

{withdrawOpen && (
  <Dialog open onOpenChange={setWithdrawOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>申请提现</DialogTitle>
      </DialogHeader>
      <Input
        type="number"
        value={withdrawAmount}
        onChange={(e) => setWithdrawAmount(e.target.value)}
        placeholder="提现金额"
      />
      <DialogFooter>
        <Button variant="outline" onClick={() => setWithdrawOpen(false)}>取消</Button>
        <Button onClick={async () => {
          const result = await requestWithdrawal(staffId, staffName, Number(withdrawAmount))
          if (result.ok) {
            toast.success(result.msg)
            setWithdrawOpen(false)
          } else {
            toast.error(result.msg)
          }
        }}>确认提现</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

注意:`staffBalance` 需要从 staff 表读(通过 API),MVP 可以简化:调 `/api/v1/staff/:id` 拿 balance。

- [ ] **Step 2: 验证**

B 端 ServiceProfile 显示余额 + "申请提现"按钮,点击弹窗输金额,确认后提交。

- [ ] **Step 3: Commit**

```bash
git add src/features/convenience/b-end/pages/ServiceProfile.tsx
git commit -m "feat: B-end withdrawal entry in ServiceProfile"
```

---

## Task 8: 桌面端强制取消 UI

**Files:**
- Modify: `src/features/convenience/desktop/pages/ConveniencePage.tsx`

**Interfaces:**
- Produces: "全部订单"tab 每行加"更多"下拉,含"强制取消"选项,弹窗输理由

- [ ] **Step 1: 在 ConveniencePage 的订单行加强制取消按钮**

在每行操作列加:
```tsx
{(o.status !== "S40" && o.status !== "S50") && (
  <Button
    variant="ghost"
    size="sm"
    className="h-7 w-7 p-0 text-rose-600"
    title="强制取消"
    onClick={() => setForceCancelTarget(o.id)}
  >
    <Ban className="size-3.5" />
  </Button>
)}
```

- [ ] **Step 2: 加强制取消弹窗**

```tsx
<Dialog open={!!forceCancelTarget} onOpenChange={(o) => !o && setForceCancelTarget(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>强制取消订单</DialogTitle>
      <DialogDescription>此操作不可撤销,请输入取消理由</DialogDescription>
    </DialogHeader>
    <Textarea
      value={forceCancelReason}
      onChange={(e) => setForceCancelReason(e.target.value)}
      placeholder="取消理由(必填)"
    />
    <DialogFooter>
      <Button variant="outline" onClick={() => setForceCancelTarget(null)}>取消</Button>
      <Button
        variant="destructive"
        onClick={async () => {
          await useConvenienceStore.getState().forceCancelWithReason(forceCancelTarget, forceCancelReason)
          setForceCancelTarget(null)
          setForceCancelReason("")
          toast.success("已强制取消")
        }}
      >
        确认强制取消
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 3: 在 store 加 forceCancelWithReason action**

```ts
forceCancelWithReason: async (orderId: string, reason: string) => {
  await syncAction<ConvenienceOrder>(
    "forceCancel",
    () => ordersApi.transition(orderId, "forceCancel", { arbitrationRemark: reason }),
    (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
  )
},
```

- [ ] **Step 4: 验证**

桌面端任意未完成订单点强制取消,弹窗输理由,确认后订单转 S50。

- [ ] **Step 5: Commit**

```bash
git add src/features/convenience/desktop/pages/ConveniencePage.tsx src/features/convenience/store/store.ts
git commit -m "feat: desktop force cancel UI with reason dialog"
```

---

## Task 9: 桌面端 S90 人工处理池

**Files:**
- Modify: `src/features/convenience/desktop/pages/ConveniencePage.tsx`

**Interfaces:**
- Produces: 独立的"人工处理"tab,只显示 S90 订单,展示 beforeManualStatus + manualReason + 处理动作

- [ ] **Step 1: 在 TABS 加"人工处理"**

```ts
const TABS = [
  { key: "all", label: "全部订单" },
  { key: "pending-dispatch", label: "待派单" },
  { key: "manual", label: "人工处理" },  // 新增
  { key: "cancel-approval", label: "取消审批" },
  { key: "price-review", label: "报价审核" },
  { key: "payment-proof", label: "付款凭证" },
]
```

注意:TabKey 类型加 `"manual" | "pending-dispatch"`。

- [ ] **Step 2: 加 manualOrders 过滤 + 渲染**

```tsx
const manualOrders = useMemo(() => orders.filter((o) => o.status === "S90"), [orders])

// 在 getActiveOrders 加 case
case "manual": return manualOrders

// 在 tab 内容区加
{activeTab === "manual" && (
  <Card className="p-4">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>订单号</TableHead>
          <TableHead>异常原因</TableHead>
          <TableHead>进入前状态</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {manualOrders.map((o) => (
          <TableRow key={o.id}>
            <TableCell>{o.id}</TableCell>
            <TableCell>
              <Badge variant="destructive">
                {o.manualReason === "dispatch_failed" ? "派单失败" :
                 o.manualReason === "quote_rejected" ? "报价争议" :
                 o.manualReason === "pay_timeout" ? "支付超时" : o.manualReason}
              </Badge>
            </TableCell>
            <TableCell>{o.beforeManualStatus || "-"}</TableCell>
            <TableCell>
              {o.manualReason === "quote_rejected" && (
                <Button size="sm" onClick={() => useConvenienceStore.getState().restoreQuote(o.id)}>
                  协调成功,恢复
                </Button>
              )}
              {o.manualReason === "dispatch_failed" && (
                <Button size="sm" onClick={() => useConvenienceStore.getState().reDispatch(o.id)}>
                  重新派单
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => setForceCancelTarget(o.id)}>
                强制取消
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
)}
```

- [ ] **Step 3: 在 store 加 restoreQuote action**

```ts
restoreQuote: async (orderId: string) => {
  await syncAction<ConvenienceOrder>(
    "restoreQuote",
    () => ordersApi.restoreQuote(orderId),
    (result) => set((s) => ({ orders: replaceOrder(s.orders, orderId, result) })),
  )
},
```

- [ ] **Step 4: 验证**

桌面端"人工处理"tab 显示所有 S90 订单,带异常原因标签 + 进入前状态 + 操作按钮(恢复/重派/强取消)。

- [ ] **Step 5: Commit**

```bash
git add src/features/convenience/desktop/pages/ConveniencePage.tsx src/features/convenience/store/store.ts
git commit -m "feat: desktop manual processing pool for S90 orders"
```

---

## Task 10: 桌面端禁用 staff 处理进行中订单弹窗

**Files:**
- Modify: `src/features/convenience/desktop/pages/ConvenienceStaffPage.tsx`

**Interfaces:**
- Produces: 点"禁用"按钮时,先调 disable 端点;若返回 needConfirm=true,弹窗显示进行中订单,逐个处理

- [ ] **Step 1: 修改 ConvenienceStaffPage 的禁用逻辑**

找到 toggleEnabled 或禁用按钮的 onClick,改为:
```tsx
const handleDisable = async (staffId: string) => {
  const res = await fetch(`http://localhost:3001/api/v1/staff/${staffId}/disable`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  const data = await res.json()
  if (data.data.needConfirm) {
    // 弹窗显示进行中订单
    setActiveOrdersDialog({ staffId, orders: data.data.activeOrders })
  } else {
    toast.success("已禁用")
    // 刷新 staff 列表
  }
}
```

- [ ] **Step 2: 加进行中订单处理弹窗**

```tsx
<Dialog open={!!activeOrdersDialog} onOpenChange={(o) => !o && setActiveOrdersDialog(null)}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>禁用 {activeOrdersDialog?.staffId} — 发现 {activeOrdersDialog?.orders.length} 个进行中订单</DialogTitle>
      <DialogDescription>请先处理这些订单,再禁用 staff</DialogDescription>
    </DialogHeader>
    <Table>
      <TableBody>
        {activeOrdersDialog?.orders.map((o) => (
          <TableRow key={o.id}>
            <TableCell>{o.id}</TableCell>
            <TableCell>{o.status}</TableCell>
            <TableCell>
              <Button size="sm" variant="destructive" onClick={() => {
                useConvenienceStore.getState().forceCancelWithReason(o.id, "staff 被禁用")
                // 从列表移除
              }}>
                强制取消
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <DialogFooter>
      <Button
        variant="destructive"
        onClick={async () => {
          // 强制禁用
          await fetch(`http://localhost:3001/api/v1/staff/${activeOrdersDialog.staffId}/disable`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ force: true }),
          })
          setActiveOrdersDialog(null)
          toast.success("已强制禁用")
        }}
      >
        强制禁用(不处理订单)
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 3: 验证**

桌面端禁用一个有进行中订单的 staff,弹窗显示订单列表,可逐个强取消或强制禁用。

- [ ] **Step 4: Commit**

```bash
git add src/features/convenience/desktop/pages/ConvenienceStaffPage.tsx
git commit -m "feat: disable staff with active orders dialog"
```

---

## Task 11: 桌面端系统配置页

**Files:**
- Create: `src/desktop/pages/SystemConfigPage.tsx`
- Modify: `src/desktop/App.tsx`(加路由)
- Modify: `src/desktop/nav.ts`(加菜单项)

**Interfaces:**
- Produces: 系统配置页,可编辑 8 个配置项(扣费规则/超时/派单参数等)

- [ ] **Step 1: 创建 `src/desktop/pages/SystemConfigPage.tsx`**

```tsx
import { useState, useEffect } from "react"
import { PageLayout } from "../components/common/PageLayout"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Input, Label, Button } from "@/shared/components/ui"
import { api } from "@/api/client"
import { toast } from "sonner"

const CONFIG_LABELS: Record<string, { label: string; type: "number" | "json"; desc: string }> = {
  cancelFeeRules: { label: "取消扣费规则", type: "json", desc: "JSON: {beforeAccept, afterAccept, afterPay, minAmount, maxAmount}" },
  dispatchRetryTimes: { label: "派单重试次数", type: "number", desc: "失败后转人工" },
  acceptTimeoutMinutes: { label: "接单超时(分钟)", type: "number", desc: "A20 超时回 A10" },
  payTimeoutMinutes: { label: "支付超时(分钟)", type: "number", desc: "A35 超时转 S90" },
  autoConfirmHours: { label: "自动确认完工(小时)", type: "number", desc: "S55 超时转 S40" },
  settlementTDays: { label: "结算 T+N 天", type: "number", desc: "T+7 后进可提现" },
  minWithdrawalAmount: { label: "最低提现金额", type: "number", desc: "" },
  dailyOrderLimit: { label: "每日接单上限", type: "number", desc: "超限不再派单" },
}

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<Record<string, string>>({})

  useEffect(() => {
    api.list("system_configs" as any, { pageSize: 100 }).then((res: any) => {
      const map: Record<string, string> = {}
      res.items.forEach((c: any) => { map[c.configKey] = c.configValue })
      setConfigs(map)
    })
  }, [])

  const handleSave = async (key: string) => {
    // 找到 config id
    const res = await api.list("system_configs" as any, { pageSize: 100 }) as any
    const cfg = res.items.find((c: any) => c.configKey === key)
    await api.update("system_configs", cfg.id, { configValue: configs[key] })
    toast.success(`${CONFIG_LABELS[key].label} 已保存`)
  }

  return (
    <PageLayout title="系统配置" description="取消扣费、派单参数、超时时间等">
      <div className="space-y-4">
        {Object.entries(CONFIG_LABELS).map(([key, { label, type, desc }]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <Label>{label}</Label>
              {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
              <Input
                value={configs[key] || ""}
                onChange={(e) => setConfigs({ ...configs, [key]: e.target.value })}
                className="mt-2"
              />
              <Button size="sm" className="mt-2" onClick={() => handleSave(key)}>保存</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  )
}
```

- [ ] **Step 2: 在 `src/desktop/App.tsx` 加路由**

```tsx
const SystemConfigPage = lazy(() => import("./pages/SystemConfigPage"))
// 在 Routes 里加:
<Route path="system-config" element={<ProtectedRoute isAllowed={isAdmin}><SystemConfigPage /></ProtectedRoute>} />
```

- [ ] **Step 3: 在 `src/desktop/nav.ts` 加菜单项**

```ts
{ key: "system-config", label: "系统配置", icon: Settings }
```

- [ ] **Step 4: 验证**

桌面端能看到"系统配置"菜单,点进去显示 8 个配置项,可编辑保存。

- [ ] **Step 5: Commit**

```bash
git add src/desktop/pages/SystemConfigPage.tsx src/desktop/App.tsx src/desktop/nav.ts
git commit -m "feat: desktop system config page (8 MVP configs)"
```

---

## Task 12: 端到端验证

**Files:** 无(纯验证)

- [ ] **Step 1: 起前后端,完整跑一遍**

```bash
# 终端 1
cd server && node index.js
# 终端 2
npm run dev
```

- [ ] **Step 2: C 端完整流程**

1. 登录 `13800001001`,下单"行李搬运"
2. 等 10 秒,订单自动派单(看 staff 名字)
3. 切到 B 端登录(用 staff 对应的账号,或管理员看),接单
4. B 端"到场打卡"
5. B 端报价 ¥88
6. C 端看到报价,点"线上支付"锁定,再点"立即支付"
7. B 端"开始服务" → "完成 + 上传照片"
8. C 端"确认完成"
9. C 端评价 5 星 + 输入文字 + 上传图片
10. 桌面端"评价管理"看到完整 review
11. 桌面端"结算管理"看到收入记录(pending)

- [ ] **Step 3: 异常流程**

1. 创建订单,派单后 B 端"暂不接单"输原因 → 订单回 A10 重派
2. 创建订单到 A35,C 端"拒绝报价"输原因 → S90,桌面端"人工处理"tab 看到,点"协调成功恢复" → 回 A35
3. 桌面端"全部订单"对一个 A30 订单点"强制取消"输理由 → S50
4. 桌面端"人员管理"禁用一个有进行中订单的 staff → 弹窗显示订单,逐个处理

- [ ] **Step 4: 配置流程**

1. 桌面端"系统配置"改"支付超时"为 1 分钟
2. 创建订单到 A35,等 1 分钟 → 自动转 S90

- [ ] **Step 5: 持久化验证**

刷新页面,所有状态不丢;重启 server,数据不丢。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: Plan 2 complete - frontend MVP adaptation verified"
```

---

## 完成标准

- [ ] C 端:支付方式选择(线上/现金) + 锁定后 UI 隔离 + 拒绝报价 + 评价带文字图片
- [ ] B 端:到场打卡 + 报价前置校验 + 拒单真接 action + 现金收款按钮 + 提现入口
- [ ] 桌面端:强制取消 UI + S90 人工处理池(独立 tab) + 禁用 staff 弹窗 + 系统配置页
- [ ] store:删除前端 recordIncome 调用(server 自动记)
- [ ] store:加 arriveCheckin/lockPayment/payOnline/confirmCash/rejectQuote/restoreQuote/rejectOrder/forceCancelWithReason actions
- [ ] 端到端:下单 → 派单 → 打卡 → 报价 → 锁定 → 支付 → 服务 → 完成 → 评价,全流程跑通
- [ ] 异常:拒单回 A10 / 拒绝报价进 S90 / 强制取消 / 支付超时自动 S90
- [ ] 持久化:刷新 + 重启不丢数据

**下一步**:执行 Plan 3(配置与报表:财务报表 3 张 + good_rate 定时计算验证 + 结算 T+7 验证),Plan 3 是 P0 的补充,可后做。
