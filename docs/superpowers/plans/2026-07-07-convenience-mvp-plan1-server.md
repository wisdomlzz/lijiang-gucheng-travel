# 便民服务 MVP 改造 Plan 1:Server 端补齐

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Server 端补齐 MVP 必须的能力:scheduler 定时任务、orders/staff 表字段、arriveCheckin/lockPaymentMethod 元动作、支付分线、联动自动化(income/review/order_operation_logs/dispatch_logs)。

**Architecture:** 在现有 Express + better-sqlite3 基础上,新增 `server/logic/scheduler.js`(7 个 cron 任务)和 `server/logic/pricing.js`(扣费计算),改造 `server/routes/orders.js` 的 transition 端点支持元动作 + 自动联动。schema.sql 加字段(用 ALTER TABLE 兼容存量数据)。

**Tech Stack:** better-sqlite3, express, node-cron 不用(setInterval 够 MVP)

## Global Constraints

- 🔴 所有状态流转必须 server 端触发,前端只发请求(spec §8.1)
- SQLite 列名 camelCase(与现有代码一致)
- 数组/对象字段存 JSON 字符串,crud.js 的 JSON_FIELDS 统一序列化
- 布尔字段用 INTEGER 0/1
- 所有 transition 自动写 order_operation_logs(spec §7.8,决策 #11)
- 定时任务单机 setInterval,MVP 不做分布式锁(spec §11.1)
- 参考文档:`docs/superpowers/specs/2026-07-07-convenience-mvp-design.md`(权威 spec)

---

## File Structure

### 新建文件

| 文件 | 职责 |
|------|------|
| `server/logic/scheduler.js` | 7 个 setInterval 定时任务 |
| `server/logic/pricing.js` | 取消费计算 + 报价异常判定(MVP 简化) |
| `server/logic/scoring.js` | good_rate 计算(好评率统计) |

### 修改文件

| 文件 | 改动 |
|------|------|
| `server/db/schema.sql` | orders 加 7 字段,staff 加 8 字段,新表 order_operation_logs / payment_records(已有则改) |
| `server/db/seed.js` | 补 system_configs 种子(扣费规则/超时/派单参数) |
| `server/routes/orders.js` | transition 端点支持元动作 + 自动联动 + 操作日志;新增 arriveCheckin / lockPaymentMethod / payOnline / confirmCash / rejectQuote 端点 |
| `server/routes/complaints.js` | resolve 时自动写 staffs.complaintCount + penaltyScore(不改 good_rate) |
| `server/routes/crud.js` | JSON_FIELDS 加新字段(evidenceUrls 等) |
| `server/index.js` | 启动时调 scheduler.start() |
| `server/routes/staff.js`(新建,从 index.js 拆出) | 禁用 staff 时检查进行中订单 |

---

## Task 1: schema 加字段(orders + staff)

**Files:**
- Modify: `server/db/schema.sql`
- Modify: `server/db/seed.js`(加迁移逻辑)

**Interfaces:**
- Produces: orders 表新字段 `paymentMethodLocked` `arrivedAt` `quotedAt` `dispatchAttempts` `beforeManualStatus` `manualReason` `reviewStatus` `orderNo` `paidAmount` `cancelFee` `rejectQuoteReason`
- Produces: staff 表新字段 `todayOrders` `goodRate` `complaintCount` `penaltyScore` `balance` `applyStatus` `staffType` `idCard` `idCardFront` `idCardBack` `rejectReason`

- [ ] **Step 1: 修改 `server/db/schema.sql` 的 convenience_orders 表**

在现有字段后(createdAt 之前)加:
```sql
  orderNo TEXT,
  paymentMethod TEXT,
  paymentMethodLocked INTEGER DEFAULT 0,
  quoteAmount REAL,
  paidAmount REAL,
  arrivedAt TEXT,
  quotedAt TEXT,
  dispatchAttempts INTEGER DEFAULT 0,
  reviewStatus TEXT DEFAULT 'pending',
  beforeManualStatus TEXT,
  manualReason TEXT,
  cancelFee REAL,
  rejectQuoteReason TEXT,
```

注意:保留现有的 `priceQuote` `payMethod` `cancelRequested` `arbitrationRemark` 字段不变(priceQuote 与 quoteAmount 并存,MVP 用 priceQuote;payMethod 与 paymentMethod 并存,MVP 用 paymentMethod)。

- [ ] **Step 2: 修改 `server/db/schema.sql` 的 staff 表**

在现有字段后(createdAt 之前)加:
```sql
  staffType TEXT DEFAULT 'partner',
  idCard TEXT,
  idCardFront TEXT,
  idCardBack TEXT,
  todayOrders INTEGER DEFAULT 0,
  goodRate REAL DEFAULT 1.0,
  complaintCount INTEGER DEFAULT 0,
  penaltyScore REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  applyStatus TEXT DEFAULT 'approved',
  rejectReason TEXT,
```

注意:现有 `enabled`(INTEGER)和 `status`(TEXT,在线状态)保留;新增 `applyStatus`(入驻审核状态)语义不同。

- [ ] **Step 3: 修改 `server/db/schema.sql` 新增 order_operation_logs 表(若不存在)**

```sql
CREATE TABLE IF NOT EXISTS order_operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId TEXT NOT NULL,
  operatorType TEXT,
  operatorId TEXT,
  action TEXT NOT NULL,
  fromStatus TEXT,
  toStatus TEXT,
  remark TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_oplogs_order ON order_operation_logs(orderId);
```

- [ ] **Step 4: 修改 `server/db/schema.sql` 新增 payment_records 表(若不存在)**

```sql
CREATE TABLE IF NOT EXISTS payment_records (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  originPaymentId TEXT,
  paymentMethod TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'success',
  thirdTradeNo TEXT,
  collectedByStaffId TEXT,
  paidAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- [ ] **Step 5: 修改 `server/db/schema.sql` 新增 system_configs 表(若不存在)**

```sql
CREATE TABLE IF NOT EXISTS system_configs (
  id TEXT PRIMARY KEY,
  configKey TEXT UNIQUE NOT NULL,
  configValue TEXT,
  description TEXT,
  updatedBy TEXT,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- [ ] **Step 6: 删除旧 DB 让 seed 重建**

Run: `rm -f server/db/data.db`

- [ ] **Step 7: 跑 seed 验证建表**

Run: `cd /Users/lzz/Desktop/Projects/丽江古城游 && node server/db/seed.js`
Expected: 打印 `🏗️  建表...` 和 `🌱 Seed 完成`

- [ ] **Step 8: 验证新字段存在**

Run:
```bash
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;const cols=db.prepare('PRAGMA table_info(convenience_orders)').all().map(c=>c.name);console.log('paymentMethodLocked:',cols.includes('paymentMethodLocked'));console.log('arrivedAt:',cols.includes('arrivedAt'));console.log('quotedAt:',cols.includes('quotedAt'));console.log('dispatchAttempts:',cols.includes('dispatchAttempts'));console.log('reviewStatus:',cols.includes('reviewStatus'));const scols=db.prepare('PRAGMA table_info(staff)').all().map(c=>c.name);console.log('todayOrders:',scols.includes('todayOrders'));console.log('goodRate:',scols.includes('goodRate'));console.log('balance:',scols.includes('balance'));db.close()})"
```
Expected: 全部 `true`

- [ ] **Step 9: Commit**

```bash
git add server/db/schema.sql
git commit -m "feat: add MVP fields to orders/staff + new tables (oplogs/payment_records/system_configs)"
```

---

## Task 2: system_configs 种子数据

**Files:**
- Modify: `server/db/seed.js`

**Interfaces:**
- Produces: system_configs 表有 8 条配置(cancelFeeRules / dispatchRetryTimes / acceptTimeoutMinutes / payTimeoutMinutes / autoConfirmHours / settlementTDays / minWithdrawalAmount / dailyOrderLimit)

- [ ] **Step 1: 在 seed.js 的 `seedIfNeeded()` 函数末尾(announcements 之前)加 system_configs 灌数据**

```js
// ====== System Configs ======
insertMany("system_configs", [
  { id: "cfg_cancel_fee", configKey: "cancelFeeRules", configValue: JSON.stringify({ beforeAccept: 0, afterAccept: 0.1, afterPay: 0.2, minAmount: 5, maxAmount: 50 }), description: "取消扣费规则", updatedBy: "system" },
  { id: "cfg_dispatch_retry", configKey: "dispatchRetryTimes", configValue: "3", description: "派单重试次数", updatedBy: "system" },
  { id: "cfg_accept_timeout", configKey: "acceptTimeoutMinutes", configValue: "5", description: "接单超时(分钟)", updatedBy: "system" },
  { id: "cfg_pay_timeout", configKey: "payTimeoutMinutes", configValue: "30", description: "支付超时(分钟)", updatedBy: "system" },
  { id: "cfg_auto_confirm", configKey: "autoConfirmHours", configValue: "24", description: "自动确认完工(小时)", updatedBy: "system" },
  { id: "cfg_settlement_t", configKey: "settlementTDays", configValue: "7", description: "结算 T+N 天", updatedBy: "system" },
  { id: "cfg_min_withdraw", configKey: "minWithdrawalAmount", configValue: "100", description: "最低提现金额", updatedBy: "system" },
  { id: "cfg_daily_limit", configKey: "dailyOrderLimit", configValue: "20", description: "每日接单上限", updatedBy: "system" },
])
```

- [ ] **Step 2: 重新 seed**

Run: `rm -f server/db/data.db && node server/db/seed.js`
Expected: `🌱 Seed 完成`

- [ ] **Step 3: 验证**

Run: `node -e "import('./server/db/connection.js').then(m=>{const db=m.default;console.log('configs:',db.prepare('SELECT count(*) as c FROM system_configs').get().c);db.close()})"`
Expected: `configs: 8`

- [ ] **Step 4: Commit**

```bash
git add server/db/seed.js
git commit -m "feat: seed system_configs with 8 MVP config entries"
```

---

## Task 3: order_operation_logs 自动记录 helper

**Files:**
- Modify: `server/routes/crud.js`(导出一个 logOperation helper)
- Modify: `server/routes/orders.js`(transition 端点调用)

**Interfaces:**
- Produces: `logOperation(orderId, operatorType, operatorId, action, fromStatus, toStatus, remark)` 函数,所有 transition 自动调用

- [ ] **Step 1: 在 `server/routes/crud.js` 顶部导出 logOperation**

在文件 import 之后加:
```js
import db from "../db/connection.js"

export function logOperation(orderId, operatorType, operatorId, action, fromStatus, toStatus, remark = null) {
  db.prepare(`INSERT INTO order_operation_logs (orderId, operatorType, operatorId, action, fromStatus, toStatus, remark) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(orderId, operatorType, operatorId, action, fromStatus, toStatus, remark)
}
```

注意:crud.js 已经 import 了 db,这里只是加函数。如果 db 是 default import,直接用。

- [ ] **Step 2: 在 `server/routes/orders.js` 的 transition 端点,状态流转成功后调用 logOperation**

在 `res.json(ok(deserializeRow(updated)))` 之前加:
```js
logOperation(order.id, req.body.operatorType || "user", req.body.operatorId || null, action, order.status, next, req.body.remark || null)
```

元动作(requestCancel/rejectCancel/arriveCheckin/lockPaymentMethod)也要记,在对应分支加 logOperation 调用。

- [ ] **Step 3: 验证**

Run:
```bash
# 起服务
cd server && node index.js &
sleep 2
# 触发一次 transition
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/dispatch -H "Content-Type: application/json" -d '{"mode":"auto"}' > /dev/null
# 查日志
curl -s "http://localhost:3001/api/v1/orders/CO20260511004" > /dev/null
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;const logs=db.prepare('SELECT * FROM order_operation_logs WHERE orderId=?').all('CO20260511004');console.log('logs:',logs.length);console.log('last:',logs[logs.length-1]);db.close()})"
kill %1
```
Expected: logs 数量 >= 1,last 的 action 字段为 "dispatch" 或类似

- [ ] **Step 4: Commit**

```bash
git add server/routes/crud.js server/routes/orders.js
git commit -m "feat: auto-log all order transitions to order_operation_logs"
```

---

## Task 4: arriveCheckin 元动作端点

**Files:**
- Modify: `server/routes/orders.js`

**Interfaces:**
- Produces: `POST /api/v1/orders/:id/arrive-checkin` 端点,写 arrived_at = now,不改 status,记日志

- [ ] **Step 1: 在 `server/routes/orders.js` 的 transition 端点之前,加 arriveCheckin 端点**

```js
// POST /:id/arrive-checkin (元动作,不改状态,写 arrivedAt)
router.post("/:id/arrive-checkin", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "A30") return res.json(fail("仅 A30 状态可打卡"))
    const now = new Date().toISOString()
    db.prepare("UPDATE convenience_orders SET arrivedAt=?, updatedAt=? WHERE id=?").run(now, now, order.id)
    logOperation(order.id, "staff", req.body.staffId || null, "arriveCheckin", order.status, order.status, "到场打卡")
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})
```

- [ ] **Step 2: 修改 transition 端点的 quote action,加 arrivedAt 前置校验**

在 transition 端点的"常规状态流转"分支,`if (!next) return ...` 之后加:
```js
if (action === "quote") {
  if (!order.arrivedAt) return res.json(fail("请先完成到场打卡再报价"))
  // 同时写 quotedAt = now(支付超时计时用)
  if (!extraFields.quotedAt) extraFields.quotedAt = new Date().toISOString()
}
```

- [ ] **Step 3: 验证**

```bash
cd server && node index.js &
sleep 2
# 找一个 A30 订单测试(先把 CO20260511004 dispatch + accept)
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/dispatch -H "Content-Type: application/json" -d '{"mode":"auto"}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/transition -H "Content-Type: application/json" -d '{"action":"accept"}' > /dev/null
# 打卡
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/arrive-checkin -H "Content-Type: application/json" -d '{"staffId":"s1"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('arrivedAt:',j.data?.arrivedAt,'status:',j.data?.status)})"
# 试未打卡报价(应该失败)
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/transition -H "Content-Type: application/json" -d '{"action":"quote","priceQuote":50}' > /dev/null  # 应该成功因为已打卡
# 试未打卡的订单报价
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;db.prepare('UPDATE convenience_orders SET arrivedAt=NULL WHERE id=?').run('CO20260511004');db.close()})"
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/transition -H "Content-Type: application/json" -d '{"action":"quote","priceQuote":50}'
kill %1
```
Expected: 打卡后 arrivedAt 有值,status 仍 A30;未打卡时报价返回 fail("请先完成到场打卡再报价")

- [ ] **Step 4: Commit**

```bash
git add server/routes/orders.js
git commit -m "feat: arriveCheckin meta-action + quote prerequisite check"
```

---

## Task 5: lockPaymentMethod 元动作端点

**Files:**
- Modify: `server/routes/orders.js`

**Interfaces:**
- Produces: `POST /api/v1/orders/:id/lock-payment` 端点,body `{ paymentMethod: "online"|"cash" }`,写 paymentMethod + paymentMethodLocked=1

- [ ] **Step 1: 在 `server/routes/orders.js` 加 lockPaymentMethod 端点**

```js
// POST /:id/lock-payment (元动作,锁定支付方式)
router.post("/:id/lock-payment", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "A35") return res.json(fail("仅 A35 状态可锁定支付方式"))
    if (order.paymentMethodLocked) return res.json(fail("支付方式已锁定,不可修改"))
    const { paymentMethod } = req.body
    if (!["online", "cash"].includes(paymentMethod)) return res.json(fail("支付方式无效"))
    const now = new Date().toISOString()
    db.prepare("UPDATE convenience_orders SET paymentMethod=?, paymentMethodLocked=1, updatedAt=? WHERE id=?")
      .run(paymentMethod, now, order.id)
    logOperation(order.id, "user", req.body.userId || null, "lockPaymentMethod", order.status, order.status, `锁定支付方式: ${paymentMethod}`)
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})
```

- [ ] **Step 2: 验证**

```bash
cd server && node index.js &
sleep 2
# 准备一个 A35 订单
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/dispatch -H "Content-Type: application/json" -d '{"mode":"auto"}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/arrive-checkin -H "Content-Type: application/json" -d '{}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/transition -H "Content-Type: application/json" -d '{"action":"accept"}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/transition -H "Content-Type: application/json" -d '{"action":"quote","priceQuote":88}' > /dev/null
# 锁定支付方式
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/lock-payment -H "Content-Type: application/json" -d '{"paymentMethod":"online","userId":"u_c_001"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('locked:',j.data?.paymentMethodLocked,'method:',j.data?.paymentMethod)})"
# 再锁一次应该失败
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/lock-payment -H "Content-Type: application/json" -d '{"paymentMethod":"cash"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('second lock:',j.ok,j.msg)})"
kill %1
```
Expected: 第一次 locked=1 method=online;第二次 ok=false msg 含"已锁定"

- [ ] **Step 3: Commit**

```bash
git add server/routes/orders.js
git commit -m "feat: lockPaymentMethod meta-action + immutable after lock"
```

---

## Task 6: payOnline / confirmCash 支付分线

**Files:**
- Modify: `server/routes/orders.js`

**Interfaces:**
- Produces: `POST /api/v1/orders/:id/pay-online`(C 端,需 paymentMethodLocked=1 且 paymentMethod=online)
- Produces: `POST /api/v1/orders/:id/confirm-cash`(B 端 staff,需 paymentMethodLocked=1 且 paymentMethod=cash)
- 两个端点都 transition pay → A40,写 payment_records 流水

- [ ] **Step 1: 在 `server/routes/orders.js` 加 payOnline 端点**

```js
// POST /:id/pay-online (C 端线上支付)
router.post("/:id/pay-online", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "A35") return res.json(fail("当前状态不可支付"))
    if (!order.paymentMethodLocked) return res.json(fail("请先确认报价并选择支付方式"))
    if (order.paymentMethod !== "online") return res.json(fail("支付方式不匹配,该订单为现金支付"))
    const now = new Date().toISOString()
    // 幂等:A40 直接返回成功
    if (order.status === "A40") return res.json(ok(deserializeRow(order)))
    // 流转 + 写流水
    db.prepare("UPDATE convenience_orders SET status='A40', paidAmount=?, updatedAt=? WHERE id=?")
      .run(order.priceQuote, now, order.id)
    const payId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    db.prepare("INSERT INTO payment_records (id, orderId, paymentMethod, amount, status, paidAt, createdAt) VALUES (?,?,?,?,?,?,?)")
      .run(payId, order.id, "online", order.priceQuote, "success", now, now)
    logOperation(order.id, "user", req.body.userId || null, "payOnline", order.status, "A40", `线上支付 ¥${order.priceQuote}`)
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// POST /:id/confirm-cash (B 端确认现金收款)
router.post("/:id/confirm-cash", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "A35") return res.json(fail("当前状态不可确认收款"))
    if (!order.paymentMethodLocked) return res.json(fail("用户未确认支付方式"))
    if (order.paymentMethod !== "cash") return res.json(fail("支付方式不匹配,该订单为线上支付"))
    const now = new Date().toISOString()
    if (order.status === "A40") return res.json(ok(deserializeRow(order)))
    db.prepare("UPDATE convenience_orders SET status='A40', paidAmount=?, updatedAt=? WHERE id=?")
      .run(order.priceQuote, now, order.id)
    const payId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    db.prepare("INSERT INTO payment_records (id, orderId, paymentMethod, amount, status, collectedByStaffId, paidAt, createdAt) VALUES (?,?,?,?,?,?,?,?)")
      .run(payId, order.id, "cash", order.priceQuote, "success", req.body.staffId || order.staffId, now, now)
    logOperation(order.id, "staff", req.body.staffId || order.staffId, "confirmCash", order.status, "A40", `现金收款 ¥${order.priceQuote}`)
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})
```

- [ ] **Step 2: 验证五层防护**

```bash
cd server && node index.js &
sleep 2
# 准备 A35 + 锁定 online
# ... (复用 Task 5 的准备步骤)
# 测 1: 未锁定就 pay-online → 应失败
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/pay-online -H "Content-Type: application/json" -d '{}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('未锁定:',j.msg)})"
# 测 2: 锁定 online 后 confirm-cash → 应失败(支付方式不匹配)
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/lock-payment -H "Content-Type: application/json" -d '{"paymentMethod":"online"}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/confirm-cash -H "Content-Type: application/json" -d '{}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('不匹配:',j.msg)})"
# 测 3: 锁定 online 后 pay-online → 应成功
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/pay-online -H "Content-Type: application/json" -d '{}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('成功:',j.data?.status)})"
# 测 4: 重复 pay-online → 幂等返回成功
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/pay-online -H "Content-Type: application/json" -d '{}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('幂等:',j.ok)})"
# 查 payment_records
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;console.log('payment_records:',db.prepare('SELECT count(*) as c FROM payment_records WHERE orderId=?').get('CO20260511004').c);db.close()})"
kill %1
```
Expected: 未锁定/不匹配都失败;成功 status=A40;幂等 ok=true;payment_records 1 条

- [ ] **Step 3: Commit**

```bash
git add server/routes/orders.js
git commit -m "feat: payOnline/confirmCash split + 5-layer payment protection"
```

---

## Task 7: 联动自动化(transition 到 S40 自动 income + reviewStatus)

**Files:**
- Modify: `server/routes/orders.js`

**Interfaces:**
- Produces: transition 到 S40 时自动 INSERT income_records,设 reviewStatus=pending

- [ ] **Step 1: 在 transition 端点的"常规状态流转"分支,`next === "S40"` 时自动记账**

在 `db.prepare(\`UPDATE ...\`).run(...)` 之后,`logOperation` 之前加:
```js
if (next === "S40") {
  // 自动生成收入记录
  if (order.priceQuote && order.staffId) {
    const incomeId = `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const isOnline = order.paymentMethod === "online"
    db.prepare(`INSERT INTO income_records (id, orderId, staffId, staffName, serviceType, amount, paymentMethod, fundHolder, platformFee, staffIncome, withdrawableAmount, settlementStatus, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(
        incomeId, order.id, order.staffId, order.staffName || "", order.serviceType,
        order.priceQuote, order.paymentMethod || "online",
        isOnline ? "platform" : "staff",
        0, // MVP 无抽成
        order.priceQuote, // staffIncome
        isOnline ? order.priceQuote : 0, // 线上可提现,现金 0
        "pending",
        new Date().toISOString()
      )
    logOperation(order.id, "system", null, "autoRecordIncome", "S55", "S40", `自动记账 ¥${order.priceQuote}`)
  }
  // 设 reviewStatus = pending
  db.prepare("UPDATE convenience_orders SET reviewStatus='pending' WHERE id=?").run(order.id)
}
```

注意:这是在已经 UPDATE status='S40' 之后的额外操作。如果 transition 端点的 UPDATE 用了变量 `serialized`,需要把 reviewStatus 也加进去,或者在 UPDATE 之后再跑一条 UPDATE。

- [ ] **Step 2: 验证**

```bash
cd server && node index.js &
sleep 2
# 走完整流程到 S40
OID=$(curl -s -X POST http://localhost:3001/api/v1/orders -H "Content-Type: application/json" -d '{"userId":"u_c_001","serviceType":"行李搬运","address":"测试","preferredTime":"尽快","lat":26.874,"lng":100.235}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).data.id))")
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/dispatch -H "Content-Type: application/json" -d '{"mode":"auto"}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/arrive-checkin -H "Content-Type: application/json" -d '{}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/transition -H "Content-Type: application/json" -d '{"action":"accept"}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/transition -H "Content-Type: application/json" -d '{"action":"quote","priceQuote":100}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/lock-payment -H "Content-Type: application/json" -d '{"paymentMethod":"online"}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/pay-online -H "Content-Type: application/json" -d '{}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/transition -H "Content-Type: application/json" -d '{"action":"startService"}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/transition -H "Content-Type: application/json" -d '{"action":"complete","completionPhotos":["https://x.jpg"]}' > /dev/null
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/transition -H "Content-Type: application/json" -d '{"action":"confirm"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('final status:',j.data?.status,'reviewStatus:',j.data?.reviewStatus)})"
# 查 income
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;const inc=db.prepare('SELECT * FROM income_records WHERE orderId=?').get('$OID');console.log('income:',inc?inc.amount:'无','settlement:',inc?.settlementStatus);db.close()})"
kill %1
```
Expected: final status=S40,reviewStatus=pending,income amount=100,settlement=pending

- [ ] **Step 3: Commit**

```bash
git add server/routes/orders.js
git commit -m "feat: auto-generate income_records on S40 + set reviewStatus=pending"
```

---

## Task 8: 评价生成 review 记录 + 更新 reviewStatus

**Files:**
- Modify: `server/routes/orders.js`(新增 rate 端点)

**Interfaces:**
- Produces: `POST /api/v1/orders/:id/rate` 端点,body `{ rating, content, images, userId }`,生成 reviews 表记录 + 更新 order.reviewStatus=done + order.rating/ratedAt

- [ ] **Step 1: 在 `server/routes/orders.js` 加 rate 端点**

```js
// POST /:id/rate (用户评价,生成 review 记录)
router.post("/:id/rate", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "S40") return res.json(fail("仅已完成订单可评价"))
    if (order.reviewStatus === "done") return res.json(fail("已评价过,不可修改"))
    const { rating, content, images } = req.body
    if (!rating || rating < 1 || rating > 5) return res.json(fail("评分 1-5"))
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const now = new Date().toISOString()
    // 生成 review 记录
    db.prepare("INSERT INTO reviews (id, orderId, serviceType, staffId, staffName, userId, userName, rating, content, images, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(reviewId, order.id, order.serviceType, order.staffId, order.staffName || "", order.userId, req.body.userName || "", rating, content || "", JSON.stringify(images || []), now, now)
    // 更新 order
    db.prepare("UPDATE convenience_orders SET rating=?, ratedAt=?, reviewStatus='done', updatedAt=? WHERE id=?")
      .run(rating, now, now, order.id)
    logOperation(order.id, "user", req.body.userId || order.userId, "rate", order.status, order.status, `评价 ${rating} 星`)
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})
```

- [ ] **Step 2: 验证**

```bash
cd server && node index.js &
sleep 2
# 找一个 S40 订单
OID=$(curl -s "http://localhost:3001/api/v1/orders?status=S40&pageSize=1" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).data.items[0]?.id||''))")
# 评价
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/rate -H "Content-Type: application/json" -d '{"rating":5,"content":"很好","images":["https://x.jpg"],"userId":"u_c_001","userName":"张小游"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('reviewStatus:',j.data?.reviewStatus,'rating:',j.data?.rating)})"
# 查 reviews 表
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;const r=db.prepare('SELECT * FROM reviews WHERE orderId=?').get('$OID');console.log('review:',r?.rating,r?.content);db.close()})"
# 再评一次应该失败
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/rate -H "Content-Type: application/json" -d '{"rating":3}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('second:',j.msg)})"
kill %1
```
Expected: reviewStatus=done,rating=5;review 表有记录;再评失败"已评价过"

- [ ] **Step 3: Commit**

```bash
git add server/routes/orders.js
git commit -m "feat: rate endpoint generates review record + sets reviewStatus=done"
```

---

## Task 9: 拒绝报价 → S90 端点

**Files:**
- Modify: `server/routes/orders.js`

**Interfaces:**
- Produces: `POST /api/v1/orders/:id/reject-quote` 端点,body `{ reason, userId }`,A35 → S90,记 beforeManualStatus + manualReason=quote_rejected

- [ ] **Step 1: 加 reject-quote 端点**

```js
// POST /:id/reject-quote (用户拒绝报价 → S90)
router.post("/:id/reject-quote", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "A35") return res.json(fail("仅 A35 状态可拒绝报价"))
    const now = new Date().toISOString()
    db.prepare("UPDATE convenience_orders SET status='S90', beforeManualStatus=?, manualReason='quote_rejected', rejectQuoteReason=?, updatedAt=? WHERE id=?")
      .run(order.status, req.body.reason || null, now, order.id)
    logOperation(order.id, "user", req.body.userId || null, "rejectQuote", order.status, "S90", req.body.reason || "用户拒绝报价")
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})
```

- [ ] **Step 2: 加 S90 → A35 恢复端点(管理员协调成功)**

```js
// POST /:id/restore-quote (管理员协调后恢复到 A35,重置 quotedAt)
router.post("/:id/restore-quote", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "S90" || order.manualReason !== "quote_rejected") return res.json(fail("仅报价争议的 S90 可恢复"))
    const now = new Date().toISOString()
    // 重置 quotedAt,支付超时重新 30 分钟计时(决策 #1)
    db.prepare("UPDATE convenience_orders SET status='A35', quotedAt=?, beforeManualStatus=NULL, manualReason=NULL, updatedAt=? WHERE id=?")
      .run(now, now, order.id)
    logOperation(order.id, "admin", req.body.adminId || null, "restoreQuote", order.status, "A35", "协调成功,重新报价")
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})
```

- [ ] **Step 3: 验证**

```bash
cd server && node index.js &
sleep 2
# 准备 A35 订单(复用前面步骤)
# 拒绝报价
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/reject-quote -H "Content-Type: application/json" -d '{"reason":"太贵了","userId":"u_c_001"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('status:',j.data?.status,'before:',j.data?.beforeManualStatus,'reason:',j.data?.manualReason)})"
# 恢复
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511004/restore-quote -H "Content-Type: application/json" -d '{"adminId":"u_admin"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('restored:',j.data?.status,'quotedAt reset:',!!j.data?.quotedAt)})"
kill %1
```
Expected: 拒绝后 status=S90,before=A35,reason=quote_rejected;恢复后 status=A35,quotedAt 重置

- [ ] **Step 4: Commit**

```bash
git add server/routes/orders.js
git commit -m "feat: rejectQuote → S90 + restoreQuote with quotedAt reset"
```

---

## Task 10: scheduler.js 定时任务框架

**Files:**
- Create: `server/logic/scheduler.js`
- Modify: `server/index.js`(启动时调 scheduler.start())

**Interfaces:**
- Produces: `startScheduler()` 函数,启动 7 个 setInterval 任务

- [ ] **Step 1: 创建 `server/logic/scheduler.js`**

```js
import db from "../db/connection.js"
import { transition } from "./transitions.js"
import { pickStaff } from "./dispatch.js"

function getConfig(key, defaultVal) {
  const row = db.prepare("SELECT configValue FROM system_configs WHERE configKey = ?").get(key)
  if (!row) return defaultVal
  const v = row.configValue
  try {
    return JSON.parse(v)
  } catch {
    return isNaN(Number(v)) ? v : Number(v)
  }
}

// 1. 自动派单(每 10 秒)
function autoDispatch() {
  const orders = db.prepare("SELECT * FROM convenience_orders WHERE status IN ('S10','A10') ORDER BY createdAt ASC").all()
  const retryLimit = getConfig("dispatchRetryTimes", 3)
  for (const order of orders) {
    if (order.dispatchAttempts >= retryLimit) {
      // 转 S90
      const now = new Date().toISOString()
      db.prepare("UPDATE convenience_orders SET status='S90', beforeManualStatus=?, manualReason='dispatch_failed', updatedAt=? WHERE id=?")
        .run(order.status, now, order.id)
      continue
    }
    // 派单逻辑(简化:复用 dispatch.js pickStaff)
    const allStaff = db.prepare("SELECT * FROM staff WHERE enabled=1 AND status='online' AND applyStatus='approved'").all().map(s => ({
      ...s,
      serviceTypes: JSON.parse(s.serviceTypes || "[]"),
      zoneIds: JSON.parse(s.zoneIds || "[]"),
    }))
    const zones = db.prepare("SELECT * FROM zones").all().map(z => ({ ...z, stations: JSON.parse(z.stations || "[]") }))
    // 硬筛选
    const dailyLimit = getConfig("dailyOrderLimit", 20)
    const candidates = allStaff
      .filter(s => s.serviceTypes.includes(order.serviceType))
      .filter(s => s.todayOrders < dailyLimit)
      .filter(s => s.assignedOrders < 3)
    if (candidates.length === 0) {
      // 无候选,attempts++
      db.prepare("UPDATE convenience_orders SET dispatchAttempts=dispatchAttempts+1, updatedAt=? WHERE id=?").run(new Date().toISOString(), order.id)
      continue
    }
    // 排序:todayOrders 升序 → 距离升序 → goodRate 降序
    candidates.sort((a, b) => {
      if (a.todayOrders !== b.todayOrders) return a.todayOrders - b.todayOrders
      const dA = (a.lat && order.lat) ? haversine(a.lat, a.lng, order.lat, order.lng) : 999
      const dB = (b.lat && order.lat) ? haversine(b.lat, b.lng, order.lat, order.lng) : 999
      if (dA !== dB) return dA - dB
      return (b.goodRate || 1) - (a.goodRate || 1)
    })
    const staff = candidates[0]
    const now = new Date().toISOString()
    db.prepare("UPDATE convenience_orders SET status='A20', staffId=?, staffName=?, staffPhone=?, dispatchAttempts=dispatchAttempts+1, updatedAt=? WHERE id=?")
      .run(staff.id, staff.name, staff.phone, now, order.id)
    db.prepare("UPDATE staff SET assignedOrders=assignedOrders+1, updatedAt=? WHERE id=?").run(now, staff.id)
    // 写 dispatch_logs
    db.prepare("INSERT INTO dispatch_logs (orderId, staffId, dispatchRound, result, createdAt) VALUES (?,?,?,?,?)")
      .run(order.id, staff.id, order.dispatchAttempts + 1, "pending", now)
  }
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 2. 接单超时(每分钟):A20 超 5 分钟未接 → 回 A10
function acceptTimeout() {
  const min = getConfig("acceptTimeoutMinutes", 5)
  const cutoff = new Date(Date.now() - min * 60 * 1000).toISOString()
  const orders = db.prepare("SELECT * FROM convenience_orders WHERE status='A20' AND updatedAt < ?").all(cutoff)
  for (const order of orders) {
    const now = new Date().toISOString()
    db.prepare("UPDATE convenience_orders SET status='A10', staffId=NULL, staffName=NULL, staffPhone=NULL, updatedAt=? WHERE id=?").run(now, order.id)
    if (order.staffId) {
      db.prepare("UPDATE staff SET assignedOrders=MAX(0,assignedOrders-1) WHERE id=?").run(order.staffId)
    }
    db.prepare("UPDATE dispatch_logs SET result='timeout', respondedAt=? WHERE orderId=? AND staffId=? AND result='pending'")
      .run(now, order.id, order.staffId)
  }
}

// 3. 支付超时(每分钟):A35 超 30 分钟 → S90
function payTimeout() {
  const min = getConfig("payTimeoutMinutes", 30)
  const cutoff = new Date(Date.now() - min * 60 * 1000).toISOString()
  const orders = db.prepare("SELECT * FROM convenience_orders WHERE status='A35' AND quotedAt < ? AND quotedAt IS NOT NULL").all(cutoff)
  for (const order of orders) {
    const now = new Date().toISOString()
    db.prepare("UPDATE convenience_orders SET status='S90', beforeManualStatus=?, manualReason='pay_timeout', updatedAt=? WHERE id=?")
      .run(order.status, now, order.id)
  }
}

// 4. 自动确认完工(每小时):S55 超 24 小时 → S40
function autoConfirm() {
  const hours = getConfig("autoConfirmHours", 24)
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const orders = db.prepare("SELECT * FROM convenience_orders WHERE status='S55' AND updatedAt < ?").all(cutoff)
  for (const order of orders) {
    // 复用 S40 联动逻辑(简化:直接 UPDATE,联动在 transition 端点之外)
    const now = new Date().toISOString()
    db.prepare("UPDATE convenience_orders SET status='S40', completedAt=?, reviewStatus='pending', updatedAt=? WHERE id=?").run(now, now, order.id)
    // 自动记账
    if (order.priceQuote && order.staffId) {
      const incomeId = `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const isOnline = order.paymentMethod === "online"
      db.prepare("INSERT INTO income_records (id, orderId, staffId, staffName, serviceType, amount, paymentMethod, fundHolder, platformFee, staffIncome, withdrawableAmount, settlementStatus, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .run(incomeId, order.id, order.staffId, order.staffName || "", order.serviceType, order.priceQuote, order.paymentMethod || "online", isOnline ? "platform" : "staff", 0, order.priceQuote, isOnline ? order.priceQuote : 0, "pending", now)
    }
  }
}

// 5. 好评率统计(每天凌晨):基于 reviews 重算 goodRate
function recalcGoodRate() {
  const staffs = db.prepare("SELECT id FROM staff").all()
  for (const s of staffs) {
    const total = db.prepare("SELECT COUNT(*) as c FROM reviews WHERE staffId=? AND isDeleted=0").get(s.id).c
    const good = db.prepare("SELECT COUNT(*) as c FROM reviews WHERE staffId=? AND isDeleted=0 AND rating>=4").get(s.id).c
    const rate = total === 0 ? 1.0 : good / total
    db.prepare("UPDATE staff SET goodRate=? WHERE id=?").run(rate, s.id)
  }
}

// 6. 今日订单数清零(每天凌晨)
function resetTodayOrders() {
  db.prepare("UPDATE staff SET todayOrders=0").run()
}

// 7. 结算 T+7(每天凌晨):income pending 超 7 天 → settled,资金进 balance
function settleT7() {
  const days = getConfig("settlementTDays", 7)
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const pending = db.prepare("SELECT * FROM income_records WHERE settlementStatus='pending' AND createdAt < ? AND paymentMethod='online'").all(cutoff)
  for (const inc of pending) {
    const now = new Date().toISOString()
    db.prepare("UPDATE income_records SET settlementStatus='settled', settledAt=? WHERE id=?").run(now, inc.id)
    db.prepare("UPDATE staff SET balance=balance+? WHERE id=?").run(inc.withdrawableAmount, inc.staffId)
  }
}

export function startScheduler() {
  setInterval(autoDispatch, 10 * 1000)          // 10 秒
  setInterval(acceptTimeout, 60 * 1000)         // 1 分钟
  setInterval(payTimeout, 60 * 1000)            // 1 分钟
  setInterval(autoConfirm, 60 * 60 * 1000)      // 1 小时
  // 每天凌晨 0 点跑(简化:每 6 小时跑一次,MVP 够用)
  setInterval(recalcGoodRate, 6 * 60 * 60 * 1000)
  setInterval(resetTodayOrders, 6 * 60 * 60 * 1000)
  setInterval(settleT7, 6 * 60 * 60 * 1000)
  console.log("⏰ Scheduler started: 7 cron tasks")
}
```

- [ ] **Step 2: 在 `server/index.js` 启动时调用**

在 `app.listen` 之前加:
```js
import { startScheduler } from "./logic/scheduler.js"
startScheduler()
```

- [ ] **Step 3: 验证**

```bash
cd server && node index.js &
sleep 3
# 应看到 "⏰ Scheduler started: 7 cron tasks"
grep "Scheduler" /tmp/server.log
# 等待 10 秒,看是否有 S10/A10 订单被派单
sleep 12
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;const s10=db.prepare('SELECT count(*) as c FROM convenience_orders WHERE status=?').get('S10').c;const a20=db.prepare('SELECT count(*) as c FROM convenience_orders WHERE status=?').get('A20').c;console.log('S10:',s10,'A20:',a20);db.close()})"
kill %1
```
Expected: 日志有 Scheduler started;10 秒后 S10 订单减少(被派单)

- [ ] **Step 4: Commit**

```bash
git add server/logic/scheduler.js server/index.js
git commit -m "feat: scheduler with 7 cron tasks (dispatch/timeout/autoconfirm/goodrate/settle)"
```

---

## Task 11: 派单防堆积字段维护 + 接单计数

**Files:**
- Modify: `server/routes/orders.js`(acceptOrder/rejectOrder 时维护 staff.assignedOrders/todayOrders)

**Interfaces:**
- Consumes: scheduler.js 已在派单时 assignedOrders+1
- Produces: acceptOrder 时 assignedOrders-1 + todayOrders+1;rejectOrder/timeout 时 assignedOrders-1

- [ ] **Step 1: 在 transition 端点的 accept 分支,维护 staff 计数**

在 `next === "A30"` 时(acceptOrder):
```js
if (action === "accept" && next === "A30") {
  db.prepare("UPDATE staff SET assignedOrders=MAX(0,assignedOrders-1), todayOrders=todayOrders+1, updatedAt=? WHERE id=?")
    .run(new Date().toISOString(), order.staffId)
}
```

- [ ] **Step 2: 在 rejectOrder(回 A10)时,维护 staff 计数**

rejectOrder 走 transition action=reject → A10:
```js
if (action === "reject" && next === "A10") {
  db.prepare("UPDATE staff SET assignedOrders=MAX(0,assignedOrders-1), updatedAt=? WHERE id=?")
    .run(new Date().toISOString(), order.staffId)
  // dispatch_logs 记 rejected
  db.prepare("UPDATE dispatch_logs SET result='rejected', respondedAt=?, rejectReason=? WHERE orderId=? AND staffId=? AND result='pending'")
    .run(new Date().toISOString(), req.body.reason || null, order.id, order.staffId)
}
```

- [ ] **Step 3: 验证**

```bash
cd server && node index.js &
sleep 2
# 找一个 A20 订单
OID=$(curl -s "http://localhost:3001/api/v1/orders?status=A20&pageSize=1" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).data.items[0]?.id||''))")
SID=$(curl -s "http://localhost:3001/api/v1/orders/$OID" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).data?.staffId||''))")
# 接单前 staff 状态
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;const s=db.prepare('SELECT assignedOrders,todayOrders FROM staff WHERE id=?').get('$SID');console.log('before:',s);db.close()})"
# 接单
curl -s -X POST http://localhost:3001/api/v1/orders/$OID/transition -H "Content-Type: application/json" -d '{"action":"accept"}' > /dev/null
# 接单后
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;const s=db.prepare('SELECT assignedOrders,todayOrders FROM staff WHERE id=?').get('$SID');console.log('after accept:',s);db.close()})"
kill %1
```
Expected: before assignedOrders=N todayOrders=M;after accept assignedOrders=N-1 todayOrders=M+1

- [ ] **Step 4: Commit**

```bash
git add server/routes/orders.js
git commit -m "feat: maintain staff.assignedOrders/todayOrders on accept/reject"
```

---

## Task 12: 投诉 resolve 自动更新 staff 统计

**Files:**
- Modify: `server/routes/complaints.js`

**Interfaces:**
- Produces: complaints resolve 时,staffs.complaintCount += 1 + penaltyScore += penaltyScoreDelta(不改 goodRate)

- [ ] **Step 1: 修改 `server/routes/complaints.js` 的 resolve 端点**

在 UPDATE complaints 之后加:
```js
// 投诉成立:更新 staff 统计(不改 goodRate,产品文档明确)
const complaint = db.prepare("SELECT * FROM complaints WHERE id=?").get(req.params.id)
if (complaint && complaint.staffId) {
  const penaltyDelta = req.body.penaltyScoreDelta || 0
  db.prepare("UPDATE staff SET complaintCount=complaintCount+1, penaltyScore=penaltyScore+?, updatedAt=? WHERE id=?")
    .run(penaltyDelta, new Date().toISOString(), complaint.staffId)
}
```

- [ ] **Step 2: 验证**

```bash
cd server && node index.js &
sleep 2
# 提交投诉
CID=$(curl -s -X POST http://localhost:3001/api/v1/complaints -H "Content-Type: application/json" -d '{"orderId":"CO20260511001","userId":"u_c_001","staffId":"s1","content":"测试","evidenceUrls":[]}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).data.id))")
# resolve 前 s1 统计
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;const s=db.prepare('SELECT complaintCount,penaltyScore FROM staff WHERE id=?').get('s1');console.log('before:',s);db.close()})"
# resolve
curl -s -X POST http://localhost:3001/api/v1/complaints/$CID/resolve -H "Content-Type: application/json" -d '{"result":"成立","penaltyScoreDelta":3}' > /dev/null
# resolve 后
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;const s=db.prepare('SELECT complaintCount,penaltyScore FROM staff WHERE id=?').get('s1');console.log('after:',s);db.close()})"
kill %1
```
Expected: before complaintCount=N;after complaintCount=N+1, penaltyScore+3

- [ ] **Step 3: Commit**

```bash
git add server/routes/complaints.js
git commit -m "feat: complaint resolve updates staff.complaintCount + penaltyScore"
```

---

## Task 13: 禁用 staff 时检查进行中订单

**Files:**
- Create: `server/routes/staff.js`(新文件,从 index.js 拆出 staff 相关)
- Modify: `server/index.js`

**Interfaces:**
- Produces: `PATCH /api/v1/staff/:id/disable` 端点,返回该 staff 名下未完成订单列表,前端弹窗显示;body `{ force: true }` 时真禁用

- [ ] **Step 1: 创建 `server/routes/staff.js`**

```js
import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes, deserializeRow } from "./crud.js"
import { logOperation } from "./crud.js"

const router = Router()

// PATCH /:id/disable — 禁用 staff,先返回进行中订单
router.patch("/:id/disable", (req, res) => {
  try {
    const staff = db.prepare("SELECT * FROM staff WHERE id = ?").get(req.params.id)
    if (!staff) return res.json(fail("staff 不存在", 404))
    
    // 查进行中订单(A20-A40, S48, S55)
    const activeOrders = db.prepare(`SELECT * FROM convenience_orders WHERE staffId=? AND status IN ('A20','A30','A35','A40','S48','S55')`).all(staff.id)
    
    if (activeOrders.length > 0 && !req.body.force) {
      // 返回订单列表,让前端处理
      return res.json(ok({
        needConfirm: true,
        activeOrders: activeOrders.map(deserializeRow),
        staffId: staff.id,
        staffName: staff.name,
      }))
    }
    
    // 真禁用
    db.prepare("UPDATE staff SET status='disabled', updatedAt=? WHERE id=?").run(new Date().toISOString(), staff.id)
    res.json(ok({ disabled: true, activeOrdersCount: activeOrders.length }))
  } catch (e) {
    res.json(fail(e.message))
  }
})

router.use("/", crudRoutes("staff", { filters: ["status", "enabled", "applyStatus"] }))

export default router
```

- [ ] **Step 2: 在 `server/index.js` 用 staffRouter 替换原来的 `crudRoutes("staff", ...)`**

```js
import staffRoutes from "./routes/staff.js"
// 替换:app.use("/api/v1/staff", crudRoutes("staff", { filters: ["status", "enabled"] }))
app.use("/api/v1/staff", staffRoutes)
```

- [ ] **Step 3: 验证**

```bash
cd server && node index.js &
sleep 2
# 禁用 s1(有进行中订单)
curl -s -X PATCH http://localhost:3001/api/v1/staff/s1/disable -H "Content-Type: application/json" -d '{}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('needConfirm:',j.data?.needConfirm,'orders:',j.data?.activeOrders?.length)})"
# 强制禁用
curl -s -X PATCH http://localhost:3001/api/v1/staff/s1/disable -H "Content-Type: application/json" -d '{"force":true}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('disabled:',j.data?.disabled)})"
kill %1
```
Expected: 第一次 needConfirm=true 有订单数;第二次 disabled=true

- [ ] **Step 4: Commit**

```bash
git add server/routes/staff.js server/index.js
git commit -m "feat: disable staff endpoint with active orders check"
```

---

## Task 14: 端到端验证

**Files:** 无(纯验证)

- [ ] **Step 1: 完整流程跑通**

```bash
cd server && node index.js &
sleep 3
B="http://localhost:3001/api/v1"

# 创建订单
OID=$(curl -s -X POST $B/orders -H "Content-Type: application/json" -d '{"userId":"u_c_001","serviceType":"行李搬运","address":"测试","preferredTime":"尽快","lat":26.874,"lng":100.235}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).data.id))")
echo "订单: $OID"

# 等 scheduler 派单
sleep 12
STATUS=$(curl -s $B/orders/$OID | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).data.status))")
echo "派单后: $STATUS"

# 打卡 + 报价 + 锁定 + 支付 + 服务 + 完成 + 评价
curl -s -X POST $B/orders/$OID/arrive-checkin -H "Content-Type: application/json" -d '{}' > /dev/null
curl -s -X POST $B/orders/$OID/transition -H "Content-Type: application/json" -d '{"action":"accept"}' > /dev/null
curl -s -X POST $B/orders/$OID/transition -H "Content-Type: application/json" -d '{"action":"quote","priceQuote":88}' > /dev/null
curl -s -X POST $B/orders/$OID/lock-payment -H "Content-Type: application/json" -d '{"paymentMethod":"online","userId":"u_c_001"}' > /dev/null
curl -s -X POST $B/orders/$OID/pay-online -H "Content-Type: application/json" -d '{}' > /dev/null
curl -s -X POST $B/orders/$OID/transition -H "Content-Type: application/json" -d '{"action":"startService"}' > /dev/null
curl -s -X POST $B/orders/$OID/transition -H "Content-Type: application/json" -d '{"action":"complete","completionPhotos":["https://x.jpg"]}' > /dev/null
curl -s -X POST $B/orders/$OID/transition -H "Content-Type: application/json" -d '{"action":"confirm"}' > /dev/null
curl -s -X POST $B/orders/$OID/rate -H "Content-Type: application/json" -d '{"rating":5,"content":"很好","images":[],"userId":"u_c_001","userName":"张小游"}' > /dev/null

# 验证
curl -s $B/orders/$OID | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const o=JSON.parse(s).data;console.log('final:',{status:o.status,paymentMethod:o.paymentMethod,paymentMethodLocked:o.paymentMethodLocked,reviewStatus:o.reviewStatus,rating:o.rating,completedAt:o.completedAt})})"
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;console.log('income:',db.prepare('SELECT count(*) as c FROM income_records WHERE orderId=?').get('$OID').c);console.log('reviews:',db.prepare('SELECT count(*) as c FROM reviews WHERE orderId=?').get('$OID').c);console.log('oplogs:',db.prepare('SELECT count(*) as c FROM order_operation_logs WHERE orderId=?').get('$OID').c);console.log('payments:',db.prepare('SELECT count(*) as c FROM payment_records WHERE orderId=?').get('$OID').c);db.close()})"
kill %1
```

Expected:
- final status=S40, paymentMethod=online, paymentMethodLocked=1, reviewStatus=done, rating=5, completedAt 有值
- income:1, reviews:1, oplogs>=10, payments:1

- [ ] **Step 2: 清理测试数据 + Commit**

```bash
# 清理刚才创建的测试订单
node -e "import('./server/db/connection.js').then(m=>{const db=m.default;db.prepare('DELETE FROM convenience_orders WHERE address=?').run('测试');db.prepare('DELETE FROM income_records WHERE orderId NOT IN (SELECT id FROM convenience_orders)').run();db.prepare('DELETE FROM reviews WHERE orderId NOT IN (SELECT id FROM convenience_orders)').run();db.prepare('DELETE FROM order_operation_logs WHERE orderId NOT IN (SELECT id FROM convenience_orders)').run();db.prepare('DELETE FROM payment_records WHERE orderId NOT IN (SELECT id FROM convenience_orders)').run();db.close()})"
git add -A
git commit -m "chore: Plan 1 complete - server foundation for MVP"
```

---

## 完成标准

执行完所有 task 后确认:

- [ ] orders 表有 7 个新字段(paymentMethodLocked/arrivedAt/quotedAt/dispatchAttempts/beforeManualStatus/manualReason/reviewStatus)
- [ ] staff 表有 8 个新字段(todayOrders/goodRate/complaintCount/penaltyScore/balance/applyStatus/staffType 等)
- [ ] 新表:order_operation_logs / payment_records / system_configs
- [ ] system_configs 有 8 条种子配置
- [ ] POST /orders/:id/arrive-checkin 端点存在
- [ ] POST /orders/:id/lock-payment 端点存在
- [ ] POST /orders/:id/pay-online + confirm-cash 端点存在(五层防护)
- [ ] POST /orders/:id/rate 端点生成 review 记录
- [ ] POST /orders/:id/reject-quote + restore-quote 端点存在
- [ ] PATCH /staff/:id/disable 端点返回进行中订单
- [ ] scheduler 启动 7 个定时任务
- [ ] transition 到 S40 自动生成 income_records + reviewStatus=pending
- [ ] 所有 transition 自动写 order_operation_logs
- [ ] 投诉 resolve 自动更新 staff.complaintCount + penaltyScore
- [ ] 派单按 todayOrders 升序 + 距离升序 + goodRate 降序
- [ ] 端到端流程跑通:下单 → 派单 → 打卡 → 报价 → 锁定 → 支付 → 服务 → 完成 → 评价,income/review/oplogs 都有记录

**下一步**:执行 Plan 2(前端适配:支付方式选择 UI + 到场打卡 + 拒单接通 + 提现入口 + 强制取消 UI + S90 人工处理池 + 配置页)
