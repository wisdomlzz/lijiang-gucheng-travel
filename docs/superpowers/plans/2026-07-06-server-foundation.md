# Server 地基 + API 客户端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把后端从 JSON 文件 DB 改成真正的 SQLite(better-sqlite3),加 JWT 认证、multer 文件上传,补齐缺失端点,前端 API 客户端加类型 + JWT header + 正确的 syncAction 模式。

**Architecture:** Express + better-sqlite3(单文件 DB,camelCase 列名免映射层),JWT auth middleware,multer 上传,通用 CRUD builder 用 SQL。前端 API client 全泛型,自动带 Bearer token,401 自动登出。syncAction 改为 server-authoritative。

**Tech Stack:** better-sqlite3, jsonwebtoken, multer, express, Vite (dev proxy), TypeScript, zustand

## Global Constraints

- SQLite 列名用 camelCase(跟前端字段一致,免映射层)
- 不开 WAL,用默认 journal mode(单文件部署)
- seed 只在空库时跑(检查 users 表)
- JWT_SECRET 默认 `lijiang-demo-secret`,7 天过期
- 上传限制 5MB,仅图片
- 数组/对象字段在 SQLite 存为 JSON 字符串,crud.js 统一序列化/反序列化
- `data.db` 和 `uploads/` 在 .gitignore 里
- 前端 API 请求带 `Authorization: Bearer <token>` header
- syncAction 铁律:用返回值更新本地 state,失败 toast 不改本地,禁止乐观更新

**参考 spec:** `docs/superpowers/specs/2026-07-06-real-frontend-backend-design.md`(以下简称"spec")

**执行说明:** 每个 task 给出文件路径、关键代码、验证命令。完整代码在 spec 对应章节,执行时同时打开 spec 和本 plan。验证命令用 curl/sqlite3/node,不依赖前端。

---

## File Structure

### 新建(Server)

| 文件 | 职责 | spec 章节 |
|------|------|-----------|
| `server/db/connection.js` | better-sqlite3 单例 | §3.1.1 |
| `server/middleware/auth.js` | JWT sign/verify | §3.2.1 |
| `server/middleware/upload.js` | multer 配置 | §3.3.1 |
| `server/routes/crud.js` | 通用 CRUD builder | §3.5 |
| `server/routes/auth.js` | login + me | §3.2.2 |
| `server/routes/orders.js` | orders + transition + dispatch | §3.4.1, §3.4.4 |
| `server/routes/complaints.js` | complaints + resolve + reject | §3.4.1 |
| `server/routes/trust-scores.js` | trust-scores + rules + threshold | §3.4.2, §3.4.3 |
| `server/routes/homepage.js` | banners + grid-items + reorder | §3.4.2, §3.4.3 |
| `server/routes/reviews.js` | reviews + stats | §3.4.3 |
| `server/routes/bookings.js` | bookings + check | §3.4.1 |
| `server/routes/content.js` | 6 个 content 子路由 | §2.3 |
| `server/routes/uploads.js` | POST /upload | §3.3.2 |
| `server/routes/announcements.js` | announcements CRUD(新) | §5.2.13 |
| `server/routes/flow-warnings.js` | flow-warnings CRUD(新) | §5.2.13 |

### 修改(Server)

| 文件 | 改动 | spec 章节 |
|------|------|-----------|
| `server/db/schema.sql` | 重写:camelCase + FK + 新表 | §3.1.2 |
| `server/db/seed.js` | 重写:seed-once,SQL INSERT | §3.1.3 |
| `server/index.js` | 重写:拆路由,挂静态文件 | §3.1.4 |
| `server/logic/dispatch.js` | 字段名 snake_case → camelCase | §3.6 |
| `server/package.json` | 换依赖 | §3.7 |
| `server/.gitignore` | 加 data.db / uploads/ | §6.2 |

### 删除(Server)

| 文件 | 原因 |
|------|------|
| `server/db/index.js` | 旧 JSON DB |
| `server/db/data/` | JSON 数据文件 |

### 新建(Frontend)

| 文件 | 职责 | spec 章节 |
|------|------|-----------|
| `src/api/types.ts` | ApiResponse / Paginated / ListParams | §4.1 |

### 修改(Frontend)

| 文件 | 改动 | spec 章节 |
|------|------|-----------|
| `src/api/client.ts` | 重写:泛型 + JWT + 401 + uploadFile | §4.2, §3.3.5 |
| `src/api/sync.ts` | 重写:server-authoritative | §4.3 |
| `src/platform/auth/store.ts` | 加 token 字段 | §3.2.3 |
| `vite.config.ts` | 加 server.proxy /uploads | §3.3.4 |

---

## Task 1: 安装依赖 + DB 连接

**Files:**
- Modify: `server/package.json`
- Create: `server/db/connection.js`
- Delete: `server/db/index.js`, `server/db/data/`

**spec 参考:** §3.1.1, §3.7

- [ ] **Step 1: 更新 `server/package.json` dependencies**

把 `dependencies` 改为(移除 `sql.js`,加三个新依赖):
```json
"dependencies": {
  "better-sqlite3": "^11.8.1",
  "cors": "^2.8.5",
  "express": "^4.21.0",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1"
}
```

- [ ] **Step 2: 安装**

Run: `cd server && npm install`
Expected: better-sqlite3 编译成功

- [ ] **Step 3: 创建 `server/db/connection.js`**

完整代码见 spec §3.1.1。核心:
```js
import Database from "better-sqlite3"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dirname, "data.db"))
db.pragma("foreign_keys = ON")
export default db
```

- [ ] **Step 4: 删除旧 JSON DB**

Run: `rm server/db/index.js && rm -rf server/db/data/`

- [ ] **Step 5: 更新 `server/.gitignore`**

```
node_modules/
db/data.db
db/data.db-journal
uploads/
```

- [ ] **Step 6: 验证连接**

Run: `cd server && node -e "import('./db/connection.js').then(m=>{const db=m.default;console.log('FK:',db.pragma('foreign_keys',{simple:true}));db.close()})"`
Expected: `FK: 1`

- [ ] **Step 7: Commit**

```bash
git add server/package.json server/package-lock.json server/db/connection.js server/.gitignore
git rm server/db/index.js
git commit -m "feat: replace JSON file DB with better-sqlite3"
```

---

## Task 2: 重写 schema.sql

**Files:**
- Modify: `server/db/schema.sql`

**spec 参考:** §3.1.2(完整 SQL 在 spec 里)

- [ ] **Step 1: 重写 `server/db/schema.sql`**

完整 SQL 见 spec §3.1.2。关键改动:
- 所有列名改 camelCase(`created_at` → `createdAt`、`user_id` → `userId` 等)
- 加外键:`convenience_orders.userId REFERENCES users(id) ON DELETE CASCADE`、`staffId REFERENCES staff(id) ON DELETE SET NULL`
- 新增 `announcements` 和 `flow_warnings` 两张表(spec §3.1.2 末尾)
- 所有表用 `CREATE TABLE IF NOT EXISTS`
- 数组字段用 `TEXT DEFAULT '[]'`,对象字段用 `TEXT DEFAULT '{}'`

- [ ] **Step 2: 验证 SQL 能执行**

Run: `cd server && node -e "import('./db/connection.js').then(async m=>{const db=m.default;const fs=await import('fs');db.exec(fs.readFileSync('db/schema.sql','utf-8'));console.log('Tables:',db.prepare(\"SELECT count(*) as c FROM sqlite_master WHERE type='table'\").get().c);db.close()})"`
Expected: `Tables: 30` 或更多

- [ ] **Step 3: 删除测试 DB**

Run: `rm -f server/db/data.db`

- [ ] **Step 4: Commit**

```bash
git add server/db/schema.sql
git commit -m "feat: rewrite schema.sql with camelCase columns and FK"
```

---

## Task 3: 重写 seed.js

**Files:**
- Modify: `server/db/seed.js`

**spec 参考:** §3.1.3(完整代码在 spec 里)

- [ ] **Step 1: 重写 `server/db/seed.js`**

完整代码见 spec §3.1.3。核心结构:
```js
import db from "./connection.js"
// JSON_FIELDS 集合见 spec §3.5
const JSON_FIELDS = new Set(["images","completionPhotos","serviceTypes","zoneIds","tags","stations","body","spots","spotNames","contentBlocks","gallery","meta","scoreHistory","reviewHistory","credentialImages","fields","roles","platform","data"])

function insertRow(table, row) { /* 序列化 JSON 字段后 INSERT */ }
function insertMany(table, rows) { /* transaction 批量 insert */ }

export function seedIfNeeded() {
  let count = 0
  try { count = db.prepare("SELECT COUNT(*) as c FROM users").get().c } catch {}
  if (count > 0) { console.log("📊 DB 已有数据,跳过 seed"); return false }
  db.exec(SCHEMA_SQL)  // 建表
  // 灌种子:users / staff / zones / orders / reviews / content / ...
  return true
}

const isDirectRun = process.argv[1]?.endsWith("seed.js")
if (isDirectRun) { seedIfNeeded(); process.exit(0) }
```

**种子数据内容**:从现有 `server/db/seed.js` 的数据搬过来(spec §3.1.3 有完整数据)。所有表都要灌。数组字段保持 JS 数组,`insertRow` 自动 `JSON.stringify`。

- [ ] **Step 2: 测试 seed(首次建库)**

Run: `cd server && node db/seed.js`
Expected: 打印 `🏗️  建表...` 和 `🌱 Seed 完成`

- [ ] **Step 3: 验证数据**

Run: `cd server && node -e "import('./db/connection.js').then(m=>{const db=m.default;console.log('Users:',db.prepare('SELECT count(*) as c FROM users').get().c);console.log('Orders:',db.prepare('SELECT count(*) as c FROM convenience_orders').get().c);db.close()})"`
Expected: `Users: 4`, `Orders: 9`

- [ ] **Step 4: 验证 seed-once(再次运行不覆盖)**

Run: `cd server && node db/seed.js`
Expected: 打印 `📊 DB 已有数据,跳过 seed`

- [ ] **Step 5: 删除测试 DB**

Run: `rm -f server/db/data.db`

- [ ] **Step 6: Commit**

```bash
git add server/db/seed.js
git commit -m "feat: rewrite seed.js with seed-once logic"
```

---

## Task 4: JWT auth middleware + routes

**Files:**
- Create: `server/middleware/auth.js`
- Create: `server/routes/auth.js`

**spec 参考:** §3.2.1, §3.2.2

- [ ] **Step 1: 创建 `server/middleware/auth.js`**

完整代码见 spec §3.2.1。导出 `signToken(userId)` 和 `verifyToken(req,res,next)`。`JWT_SECRET` 从环境变量读,默认 `lijiang-demo-secret`。

- [ ] **Step 2: 创建 `server/routes/auth.js`**

完整代码见 spec §3.2.2。两个路由:
- `POST /login` — body `{ phone }` → 查 users 表 → `signToken` → 返回 `{ token, user }`(user 的 roles/platform 要 `JSON.parse`)
- `GET /me` — `verifyToken` 中间件 → 用 `req.userId` 查 users 表 → 返回 user

- [ ] **Step 3: Commit**

```bash
git add server/middleware/auth.js server/routes/auth.js
git commit -m "feat: add JWT auth middleware and routes"
```

---

## Task 5: Multer 上传 + Vite proxy

**Files:**
- Create: `server/middleware/upload.js`
- Create: `server/routes/uploads.js`
- Modify: `vite.config.ts`

**spec 参考:** §3.3.1, §3.3.2, §3.3.4

- [ ] **Step 1: 创建 `server/middleware/upload.js`**

完整代码见 spec §3.3.1。multer 配置:dest=`server/uploads/`,5MB 限制,仅 `image/*`。

- [ ] **Step 2: 创建 `server/routes/uploads.js`**

完整代码见 spec §3.3.2。`POST /` → `upload.single("file")` → 返回 `{ url: "/uploads/<filename>" }`。

- [ ] **Step 3: 修改 `vite.config.ts` 加 proxy**

在 `defineConfig` 里加 `server` 字段(放在 `assetsInclude` 之后、`build` 之前):
```ts
server: {
  proxy: {
    "/uploads": "http://localhost:3001",
  },
},
```

- [ ] **Step 4: Commit**

```bash
git add server/middleware/upload.js server/routes/uploads.js vite.config.ts
git commit -m "feat: add multer upload + Vite proxy for /uploads"
```

---

## Task 6: 通用 CRUD builder

**Files:**
- Create: `server/routes/crud.js`

**spec 参考:** §3.5(完整代码在 spec 里)

- [ ] **Step 1: 创建 `server/routes/crud.js`**

完整代码见 spec §3.5。核心:
- `JSON_FIELDS` 集合(同 seed.js,对照 schema.sql 所有 `DEFAULT '[]'` 字段)
- `deserializeRow(row)` — 读出时 `JSON.parse` JSON 字段
- `serializeInput(data)` — 写入前 `JSON.stringify` JSON 字段
- `crudRoutes(table, options)` 返回 Router,支持:
  - `GET /` — WHERE + ORDER BY + 分页(默认 pageSize=200)
  - `GET /:id`
  - `POST /` — 自动生成 id + createdAt/updatedAt,`RETURNING *` 不支持时用 SELECT 重查
  - `PATCH /:id` — 更新字段,`updatedAt` 自动刷新
  - `DELETE /:id`

**注意**:`table` 和列名是代码写死的(不来自用户输入),SQL 拼接可接受。`searchField`/`filters` 只在 `options` 里声明。

**关键**:export `deserializeRow` 函数,供 orders.js/complaints.js 等特殊端点复用:
```js
export function deserializeRow(row) { /* ... */ }
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/crud.js
git commit -m "feat: generic CRUD builder with SQLite + JSON serialization"
```

---

## Task 7: 修复 dispatch.js 字段名

**Files:**
- Modify: `server/logic/dispatch.js`

**spec 参考:** §3.6

- [ ] **Step 1: 修改 `server/logic/dispatch.js`**

把所有 snake_case 字段名改成 camelCase:
- `s.service_types` → `s.serviceTypes`
- `s.zone_ids` → `s.zoneIds`
- `z.stations` 保持不变(stations 本来就是 camelCase)

完整代码见 spec §3.6。`haversineKm`、`pickStaff`、`lookupStaff` 函数签名不变。

- [ ] **Step 2: Commit**

```bash
git add server/logic/dispatch.js
git commit -m "fix: dispatch.js field names snake_case to camelCase"
```

---

## Task 8: 创建所有路由文件

**spec 参考:** §3.4(端点补齐), §3.4.3(路由顺序)

**铁律:特殊路由(stats/threshold/reorder/check/dispatch/transition/resolve/reject)必须注册在 crudRoutes 之前。**

- [ ] **Step 1: 创建 `server/routes/orders.js`**

```js
import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes, deserializeRow } from "./crud.js"
import { transition } from "../logic/transitions.js"
import { pickStaff, lookupStaff } from "../logic/dispatch.js"

const router = Router()

// 特殊路由在前
// POST /:id/dispatch — spec §3.4.1
router.post("/:id/dispatch", (req, res) => {
  const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
  if (!order) return res.json(fail("订单不存在", 404))
  const { mode, staffId } = req.body
  let staff = null
  if (mode === "manual" && staffId) {
    staff = db.prepare("SELECT * FROM staff WHERE id = ?").get(staffId)
  } else {
    const allStaff = db.prepare("SELECT * FROM staff").all()
    const zones = db.prepare("SELECT * FROM zones").all()
    staff = pickStaff(allStaff, order.serviceType, order.lat, order.lng, zones)
  }
  if (!staff) return res.json(fail("无可用服务人员"))
  const next = transition(order.status, "assign") || transition(order.status, "reDispatch")
  if (!next) return res.json(fail(`状态 ${order.status} 不可派单`))
  const now = new Date().toISOString()
  db.prepare("UPDATE convenience_orders SET status=?, staffId=?, staffName=?, staffPhone=?, updatedAt=? WHERE id=?")
    .run(next, staff.id, staff.name, staff.phone, now, order.id)
  const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
  res.json(ok(deserializeRow(updated)))
})

// POST /:id/transition — spec §3.4.4,接受 { action, ...fields }
router.post("/:id/transition", (req, res) => {
  const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
  if (!order) return res.json(fail("订单不存在", 404))
  const { action, ...extraFields } = req.body
  const next = transition(order.status, action)
  if (!next) return res.json(fail(`状态 ${order.status} 不支持动作 ${action}`))
  // 序列化 JSON 字段(同 crud.js 的 serializeInput 逻辑)
  const jsonFields = ["images", "completionPhotos"]
  const serialized = { status: next, ...extraFields }
  for (const k of Object.keys(serialized)) {
    if (jsonFields.includes(k) && typeof serialized[k] !== "string") {
      serialized[k] = JSON.stringify(serialized[k])
    }
  }
  serialized.updatedAt = new Date().toISOString()
  const cols = Object.keys(serialized)
  const setClause = cols.map(c => `${c} = ?`).join(", ")
  db.prepare(`UPDATE convenience_orders SET ${setClause} WHERE id = ?`)
    .run(...cols.map(c => serialized[c]), order.id)
  const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
  res.json(ok(deserializeRow(updated)))
})

// 然后是 CRUD
router.use("/", crudRoutes("convenience_orders", {
  filters: ["status", "serviceType", "userId", "staffId"],
  searchField: "address",
}))

export default router
```

**注意**:transition 和 dispatch 端点直接操作 SQL,返回前用 `deserializeRow(updated)` 把 JSON 字符串字段(images/completionPhotos)反序列化成数组。

- [ ] **Step 2: 创建 `server/routes/complaints.js`**

```js
import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes, deserializeRow } from "./crud.js"

const router = Router()

// POST /:id/resolve — spec §3.4.1
router.post("/:id/resolve", (req, res) => {
  const { result } = req.body
  const now = new Date().toISOString()
  const info = db.prepare("UPDATE complaints SET status=?, result=?, handledAt=?, updatedAt=? WHERE id=?")
    .run("C40", result, now, now, req.params.id)
  if (info.changes === 0) return res.json(fail("投诉不存在", 404))
  const updated = db.prepare("SELECT * FROM complaints WHERE id = ?").get(req.params.id)
  res.json(ok(deserializeRow(updated)))
})

// POST /:id/reject
router.post("/:id/reject", (req, res) => {
  const { reason } = req.body
  const now = new Date().toISOString()
  const info = db.prepare("UPDATE complaints SET status=?, result=?, handledAt=?, updatedAt=? WHERE id=?")
    .run("CR", reason, now, now, req.params.id)
  if (info.changes === 0) return res.json(fail("投诉不存在", 404))
  const updated = db.prepare("SELECT * FROM complaints WHERE id = ?").get(req.params.id)
  res.json(ok(deserializeRow(updated)))
})

router.use("/", crudRoutes("complaints", { filters: ["status", "userId", "type"] }))

export default router
```

- [ ] **Step 3: 创建 `server/routes/trust-scores.js`**

```js
import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes } from "./crud.js"

const router = Router()

// threshold(特殊路由在前)— spec §3.4.2,改用 POST
router.get("/threshold", (req, res) => {
  let row = db.prepare("SELECT * FROM trust_thresholds WHERE id = 1").get()
  if (!row) {
    db.prepare("INSERT INTO trust_thresholds (id, defaultScore, delinquentThreshold, autoRecover, recoverScore) VALUES (1, 100, 60, 1, 70)").run()
    row = db.prepare("SELECT * FROM trust_thresholds WHERE id = 1").get()
  }
  res.json(ok({ ...row, autoRecover: !!row.autoRecover }))
})

router.post("/threshold", (req, res) => {
  const { defaultScore, delinquentThreshold, autoRecover, recoverScore } = req.body
  const now = new Date().toISOString()
  db.prepare(`INSERT INTO trust_thresholds (id, defaultScore, delinquentThreshold, autoRecover, recoverScore, updatedAt)
    VALUES (1, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET defaultScore=excluded.defaultScore, delinquentThreshold=excluded.delinquentThreshold, autoRecover=excluded.autoRecover, recoverScore=excluded.recoverScore, updatedAt=excluded.updatedAt`)
    .run(defaultScore ?? 100, delinquentThreshold ?? 60, autoRecover ? 1 : 0, recoverScore ?? 70, now)
  const row = db.prepare("SELECT * FROM trust_thresholds WHERE id = 1").get()
  res.json(ok({ ...row, autoRecover: !!row.autoRecover }))
})

// rules(独立子路由)
router.use("/rules", crudRoutes("score_rules"))

// 然后是 trust_scores 的 CRUD
router.use("/", crudRoutes("trust_scores"))

export default router
```

- [ ] **Step 4: 创建 `server/routes/homepage.js`**

```js
import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes } from "./crud.js"

const router = Router()

// POST /banners/reorder — spec §3.4.2,改用 POST
router.post("/banners/reorder", (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids)) return res.json(fail("ids must be an array"))
  const now = new Date().toISOString()
  const stmt = db.prepare('UPDATE banners SET "order" = ?, updatedAt = ? WHERE id = ?')
  const tx = db.transaction(() => ids.forEach((id, i) => stmt.run(i, now, id)))
  tx()
  res.json(ok(null, "排序已更新"))
})

// POST /grid-items/reorder — spec §3.4.1
router.post("/grid-items/reorder", (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids)) return res.json(fail("ids must be an array"))
  const now = new Date().toISOString()
  const stmt = db.prepare('UPDATE grid_items SET "order" = ?, updatedAt = ? WHERE id = ?')
  const tx = db.transaction(() => ids.forEach((id, i) => stmt.run(i, now, id)))
  tx()
  res.json(ok(null, "排序已更新"))
})

router.use("/banners", crudRoutes("banners", { filters: ["scene"] }))
router.use("/grid-items", crudRoutes("grid_items", { filters: ["visible"] }))

export default router
```

- [ ] **Step 5: 创建 `server/routes/reviews.js`**

```js
import { Router } from "express"
import db from "../db/connection.js"
import { ok } from "../middleware/response.js"
import { crudRoutes } from "./crud.js"

const router = Router()

// GET /stats(特殊路由在前)— spec §3.4.3
router.get("/stats", (req, res) => {
  const all = db.prepare("SELECT * FROM reviews").all()
  const total = all.length
  const positive = all.filter(r => r.rating >= 4).length
  const positiveRate = total > 0 ? Math.round((positive / total) * 100) : 0
  const pendingReply = all.filter(r => !r.replyContent).length
  const negativeCount = all.filter(r => r.rating <= 2).length
  res.json(ok({ total, positiveRate, pendingReply, negativeCount }))
})

router.use("/", crudRoutes("reviews", { filters: ["staffId", "rating", "followUp"] }))

export default router
```

- [ ] **Step 6: 创建 `server/routes/bookings.js`**

```js
import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes } from "./crud.js"

const router = Router()

// POST /check — spec §3.4.1
router.post("/check", (req, res) => {
  const { code } = req.body
  const booking = db.prepare("SELECT * FROM bookings WHERE code = ?").get(code)
  if (!booking) return res.json(fail("核销码无效"))
  if (booking.status === "checked") return res.json(fail("该预约已核销"))
  if (booking.status === "cancelled") return res.json(fail("该预约已取消"))
  const now = new Date().toISOString()
  db.prepare("UPDATE bookings SET status=?, checkedAt=?, updatedAt=? WHERE id=?")
    .run("checked", now, now, booking.id)
  const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(booking.id)
  res.json(ok(updated))
})

router.use("/", crudRoutes("bookings", { filters: ["userId", "courtyardId", "status"] }))

export default router
```

- [ ] **Step 7: 创建 `server/routes/content.js`**

```js
import { Router } from "express"
import { crudRoutes } from "./crud.js"

const router = Router()

router.use("/news", crudRoutes("content_news", { searchField: "title" }))
router.use("/routes", crudRoutes("content_routes", { searchField: "name" }))
router.use("/courtyards", crudRoutes("content_courtyards", { searchField: "name" }))
router.use("/merchants", crudRoutes("content_merchants", { searchField: "name" }))
router.use("/pois", crudRoutes("content_pois", { searchField: "name", filters: ["category"] }))
router.use("/housing", crudRoutes("content_housing", { searchField: "name" }))

export default router
```

- [ ] **Step 8: 创建 `server/routes/announcements.js`**

```js
import { Router } from "express"
import { crudRoutes } from "./crud.js"
const router = Router()
router.use("/", crudRoutes("announcements"))
export default router
```

- [ ] **Step 9: 创建 `server/routes/flow-warnings.js`**

```js
import { Router } from "express"
import { crudRoutes } from "./crud.js"
const router = Router()
router.use("/", crudRoutes("flow_warnings"))
export default router
```

- [ ] **Step 10: Commit**

```bash
git add server/routes/
git commit -m "feat: create all route files with endpoint fixes and proper ordering"
```

---

## Task 9: 重写 index.js(挂载所有路由)

**Files:**
- Modify: `server/index.js`(整体重写)

**spec 参考:** §2.3, §3.1.4, §3.3.3

- [ ] **Step 1: 重写 `server/index.js`**

```js
import express from "express"
import cors from "cors"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { seedIfNeeded } from "./db/seed.js"
import { ok, fail } from "./middleware/response.js"

// 点单点 — spec §3.5(points/transact 和 points/account 特殊端点)
// 完整代码见 spec §3.5 末尾(points 部分)

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: "10mb" }))

// 静态文件:上传的图片 — spec §3.3.3
app.use("/uploads", express.static(join(__dirname, "uploads")))

// 初始化 DB + seed
seedIfNeeded()

// ====== 挂载路由 ======
import authRoutes from "./routes/auth.js"
import ordersRoutes from "./routes/orders.js"
import complaintsRoutes from "./routes/complaints.js"
import trustScoresRoutes from "./routes/trust-scores.js"
import homepageRoutes from "./routes/homepage.js"
import reviewsRoutes from "./routes/reviews.js"
import bookingsRoutes from "./routes/bookings.js"
import contentRoutes from "./routes/content.js"
import uploadsRoutes from "./routes/uploads.js"
import announcementsRoutes from "./routes/announcements.js"
import flowWarningsRoutes from "./routes/flow-warnings.js"
import { crudRoutes } from "./routes/crud.js"

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/orders", ordersRoutes)
app.use("/api/v1/staff", crudRoutes("staff", { filters: ["status", "enabled"] }))
app.use("/api/v1/zones", crudRoutes("zones"))
app.use("/api/v1/dispatch-config", crudRoutes("dispatch_configs"))
app.use("/api/v1/incomes", crudRoutes("income_records", { filters: ["staffId"] }))
app.use("/api/v1/withdrawals", crudRoutes("withdrawal_requests", { filters: ["status"] }))
app.use("/api/v1/reviews", reviewsRoutes)
app.use("/api/v1/service-config", crudRoutes("service_configs"))
app.use("/api/v1/complaints", complaintsRoutes)
app.use("/api/v1/content", contentRoutes)
app.use("/api/v1/banners", homepageRoutes)  // 注意:homepage router 内部处理 /banners 和 /grid-items
// ⚠️ 上面的 homepage router 用 app.use("/api/v1/banners", ...) 会把 /banners/reorder 映射到 /api/v1/banners/banners/reorder —— 错了!
// 正确做法:homepage router 用 app.use("/api/v1", homepageRoutes),内部路由是 /banners 和 /grid-items
app.use("/api/v1", homepageRoutes)
app.use("/api/v1/checkins", crudRoutes("checkins", { filters: ["userId", "courtyardId"] }))
app.use("/api/v1/naxi-checkins", crudRoutes("naxi_checkins", { filters: ["userId"] }))
app.use("/api/v1/addresses", crudRoutes("addresses", { filters: ["userId"] }))
app.use("/api/v1/favorites", crudRoutes("favorites", { filters: ["userId", "targetType"] }))
app.use("/api/v1/volunteers", crudRoutes("volunteers", { filters: ["status", "userId"] }))
app.use("/api/v1/volunteer-activities", crudRoutes("volunteer_activities", { filters: ["status"] }))
app.use("/api/v1/volunteer-records", crudRoutes("volunteer_daily_records", { filters: ["volunteerId", "activityId"] }))
app.use("/api/v1/points/rules", crudRoutes("points_rules"))
app.use("/api/v1/trust-scores", trustScoresRoutes)
app.use("/api/v1/supplier-applications", crudRoutes("supplier_applications", { filters: ["status"] }))
app.use("/api/v1/merchant-registrations", crudRoutes("merchant_registrations", { filters: ["status", "userId"] }))
app.use("/api/v1/merchant-reviews", crudRoutes("merchant_reviews", { filters: ["status", "userId"] }))
app.use("/api/v1/ai-knowledge", crudRoutes("ai_knowledge", { searchField: "question" }))
app.use("/api/v1/bookings", bookingsRoutes)
app.use("/api/v1/suppliers", crudRoutes("suppliers"))
app.use("/api/v1/announcements", announcementsRoutes)
app.use("/api/v1/flow-warnings", flowWarningsRoutes)
app.use("/api/v1/upload", uploadsRoutes)

// ====== Points 特殊端点 — spec §3.5 ======
// GET /api/v1/points/account/:userId
app.get("/api/v1/points/account/:userId", (req, res) => {
  const account = db.prepare("SELECT * FROM points_accounts WHERE userId = ?").get(req.params.userId)
    || { userId: req.params.userId, balance: 0, totalEarned: 0, totalUsed: 0 }
  const ledgers = db.prepare("SELECT * FROM points_ledgers WHERE userId = ? ORDER BY createdAt DESC").all(req.params.userId)
  res.json(ok({ ...account, ledgers }))
})

// POST /api/v1/points/transact
app.post("/api/v1/points/transact", (req, res) => {
  // 完整代码见 spec §3.5(points/transact)
  // 核心:查规则 → 计算 delta → 更新账户 → 写流水 → 返回 account
  const { userId, sourceCode, refId, customDelta } = req.body
  const rule = db.prepare("SELECT * FROM points_rules WHERE code = ? AND enabled = 1").get(sourceCode)
  if (!rule) return res.json(fail(`积分规则 ${sourceCode} 不存在或已停用`))
  let delta = customDelta ?? rule.points
  if (rule.direction === "OUT") delta = -Math.abs(delta)
  else delta = Math.abs(delta)
  let account = db.prepare("SELECT * FROM points_accounts WHERE userId = ?").get(userId)
  if (!account) {
    db.prepare("INSERT INTO points_accounts (userId, balance, totalEarned, totalUsed) VALUES (?, 0, 0, 0)").run(userId)
    account = { userId, balance: 0, totalEarned: 0, totalUsed: 0 }
  }
  const newBalance = account.balance + delta
  if (newBalance < 0) return res.json(fail("积分余额不足"))
  db.prepare("UPDATE points_accounts SET balance=?, totalEarned=?, totalUsed=?, updatedAt=? WHERE userId=?")
    .run(newBalance, account.totalEarned + (delta > 0 ? delta : 0), account.totalUsed + (delta < 0 ? -delta : 0), new Date().toISOString(), userId)
  const ledgerId = `pl_${Date.now()}`
  db.prepare("INSERT INTO points_ledgers (id, userId, direction, delta, sourceCode, sourceLabel, refId, balanceAfter, createdAt) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(ledgerId, userId, rule.direction, Math.abs(delta), sourceCode, rule.label, refId || null, newBalance, new Date().toISOString())
  const updated = db.prepare("SELECT * FROM points_accounts WHERE userId = ?").get(userId)
  res.json(ok(updated, `积分${delta > 0 ? "+" : ""}${delta}`))
})

// ====== Error handler ======
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json(fail(err.message))
})

// ====== Start ======
app.listen(PORT, () => {
  console.log(`🏛️  丽江古城游 API running at http://localhost:${PORT}`)
  const { count } = db.prepare ? {} : {}
})
```

**⚠️ 修正**:上面 `app.use("/api/v1/banners", homepageRoutes)` 这行是错的,删掉它。homepage router 内部有 `/banners` 和 `/grid-items` 子路由,应该用 `app.use("/api/v1", homepageRoutes)` 挂载。最终只保留这一行。

**⚠️ 补充**:index.js 顶部需要 `import db from "./db/connection.js"`(points 端点用到)。

- [ ] **Step 2: 启动验证**

Run: `cd server && node index.js &`
Expected: 打印 `🏛️  丽江古城游 API running at http://localhost:3001`

Run: `curl -s http://localhost:3001/api/v1/staff | head -100`
Expected: 返回 6 个 staff 的 JSON

Run: `kill %1`

- [ ] **Step 3: Commit**

```bash
git add server/index.js
git commit -m "feat: rewrite index.js with modular route mounting"
```

---

## Task 10: 端到端验证(Phase 1 完成)

**spec 参考:** §3.8

- [ ] **Step 1: 启动 server**

Run: `cd server && node index.js &`

- [ ] **Step 2: 验证 seed-once(重启不覆盖)**

Run: `curl -s http://localhost:3001/api/v1/staff | node -e "process.stdin.on('data',d=>console.log('staff count:',JSON.parse(d).data.items.length))"`
Expected: `staff count: 6`

(改一条数据)
Run: `curl -s -X PATCH http://localhost:3001/api/v1/staff/s1 -H "Content-Type: application/json" -d '{"status":"offline"}' > /dev/null`
Run: `kill %1`

(重启)
Run: `cd server && node index.js &`
Run: `curl -s http://localhost:3001/api/v1/staff/s1 | node -e "process.stdin.on('data',d=>console.log('s1 status:',JSON.parse(d).data.status))"`
Expected: `s1 status: offline`(改动没丢)

Run: `kill %1`

- [ ] **Step 3: 验证 auth**

Run: `cd server && node index.js &`
Run: `curl -s -X POST http://localhost:3001/api/v1/auth/login -H "Content-Type: application/json" -d '{"phone":"13800001001"}'`
Expected: 返回 `{ ok: true, data: { token: "eyJ...", user: {...} } }`

Run: `TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login -H "Content-Type: application/json" -d '{"phone":"13800001001"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data.token))")`
Run: `curl -s http://localhost:3001/api/v1/auth/me -H "Authorization: Bearer $TOKEN"`
Expected: 返回 `{ ok: true, data: { id: "u_c_001", name: "张小游", ... } }`

- [ ] **Step 4: 验证修复的端点**

```bash
# reviews/stats 不再被 /:id 吞
curl -s http://localhost:3001/api/v1/reviews/stats
# Expected: { ok: true, data: { total: 2, positiveRate: 100, ... } }

# trust-scores/threshold 用 POST
curl -s -X POST http://localhost:3001/api/v1/trust-scores/threshold -H "Content-Type: application/json" -d '{"defaultScore":95}'
# Expected: { ok: true, data: { defaultScore: 95, ... } }

# banners/reorder 用 POST
curl -s -X POST http://localhost:3001/api/v1/banners/reorder -H "Content-Type: application/json" -d '{"ids":["b1","b2"]}'
# Expected: { ok: true, data: null, msg: "排序已更新" }

# orders dispatch
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511005/dispatch -H "Content-Type: application/json" -d '{"mode":"auto"}'
# Expected: { ok: true, data: { id: "CO20260511005", status: "A20", staffId: "...", ... } }

# complaints resolve
curl -s -X POST http://localhost:3001/api/v1/complaints/CP20260510001/resolve -H "Content-Type: application/json" -d '{"result":"已处理"}'
# Expected: { ok: true, data: { status: "C40", result: "已处理", ... } }

# transition 带业务字段
curl -s -X POST http://localhost:3001/api/v1/orders/CO20260511001/transition -H "Content-Type: application/json" -d '{"action":"quote","priceQuote":100}'
# Expected: { ok: true, data: { status: "A35", priceQuote: 100, ... } }

# 上传
echo "test" > /tmp/test.png
curl -s -X POST http://localhost:3001/api/v1/upload -F "file=@/tmp/test.png"
# Expected: { ok: true, data: { url: "/uploads/xxx.png" } }
```

Run: `kill %1`

- [ ] **Step 5: 验证前端 hydrate 正常**

Run: `cd server && node index.js &`
Run: `cd /Users/lzz/Desktop/Projects/丽江古城游 && npm run dev`(另一个终端)
打开浏览器 `http://localhost:5173`,进入 C 端,确认:
- 首页有 Banner 和宫格
- 便民服务页面有订单
- 桌面端有 staff 列表、内容管理有数据

如果所有页面数据正常加载,Phase 1 完成。

- [ ] **Step 6: Commit(标记 Phase 1 完成)**

```bash
git add -A
git commit -m "chore: Phase 1 complete - server foundation verified"
```

---

## Task 11: API 类型定义

**Files:**
- Create: `src/api/types.ts`

**spec 参考:** §4.1

- [ ] **Step 1: 创建 `src/api/types.ts`**

```ts
export interface ApiResponse<T> {
  ok: boolean
  data: T
  msg: string
  code?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ListParams = Record<string, string | number | boolean | undefined>
```

- [ ] **Step 2: Commit**

```bash
git add src/api/types.ts
git commit -m "feat: add API response types"
```

---

## Task 12: 重写 client.ts

**Files:**
- Modify: `src/api/client.ts`

**spec 参考:** §4.2, §3.3.5

- [ ] **Step 1: 重写 `src/api/client.ts`**

完整代码见 spec §4.2 + §3.3.5。核心改动:
1. `request<T>(method, path, body?)` 全泛型
2. 从 `useAuthStore.getState().token` 读 JWT,加 `Authorization: Bearer` header
3. 响应 `code === 401` 时 `useAuthStore.getState().logout()` + 跳 `window.location.href = "/"`
4. 所有 `api`/`ordersApi`/`staffApi` 等方法加类型签名
5. `ordersApi.transition` 签名改为 `(id, action, fields?)` 传业务字段
6. 新增 `uploadFile(file: File): Promise<string>` — multipart 上传,返回 URL

关键代码片段:
```ts
import { useAuthStore } from "@/platform/auth"
import type { ApiResponse, Paginated, ListParams } from "./types"

const BASE_URL = "http://localhost:3001/api/v1"

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = useAuthStore.getState().token
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE_URL}${path}`, opts)
  const json: ApiResponse<T> = await res.json()
  if (json.code === 401) {
    useAuthStore.getState().logout()
    window.location.href = "/"
    throw new Error("登录已过期")
  }
  if (!json.ok) throw new Error(json.msg || "API error")
  return json.data
}

// ordersApi.transition 改签名:
transition: (id: string, action: string, fields?: Record<string, unknown>) =>
  api.post("orders", `/${id}/transition`, { action, ...fields }),

// uploadFile helper:
export async function uploadFile(file: File): Promise<string> {
  const token = useAuthStore.getState().token
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.msg)
  return json.data.url
}
```

保留所有现有 `xxxApi` 导出(ordersApi/staffApi/reviewsApi 等),只是加类型。

- [ ] **Step 2: 验证类型**

Run: `npx tsc --noEmit src/api/client.ts src/api/types.ts 2>&1 | head -20`
Expected: 无隐式 any 错误(可能有少量来自其他文件的错误,先不管)

- [ ] **Step 3: Commit**

```bash
git add src/api/client.ts src/api/types.ts
git commit -m "feat: rewrite API client with types, JWT header, 401 handling, uploadFile"
```

---

## Task 13: 重写 sync.ts

**Files:**
- Modify: `src/api/sync.ts`

**spec 参考:** §4.3

- [ ] **Step 1: 重写 `src/api/sync.ts`**

```ts
import { toast } from "sonner"

export async function syncAction<T>(
  name: string,
  apiCall: () => Promise<T>,
  localUpdate: (result: T) => void
): Promise<T | null> {
  try {
    const result = await apiCall()
    localUpdate(result)
    return result
  } catch (e) {
    console.error(`[sync] ${name} failed:`, (e as Error).message)
    toast.error(`操作失败: ${(e as Error).message}`, { duration: 4000 })
    return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/sync.ts
git commit -m "feat: rewrite syncAction to server-authoritative pattern"
```

---

## Task 14: Auth store 加 token 字段

**Files:**
- Modify: `src/platform/auth/store.ts`

**spec 参考:** §3.2.3

- [ ] **Step 1: 修改 `src/platform/auth/store.ts`**

三处改动:

1. `AuthState` 类型加 `token`:
```ts
type AuthState = {
  user: User | null
  token: string | null          // 新增
  isLoggedIn: boolean
  currentPlatform: Platform | null
  login: (user: User, platform: Platform, token: string) => void  // 加 token 参数
  logout: () => void
  switchPlatform: (platform: Platform) => void
  updateUser: (updates: Partial<User>) => void
}
```

2. 初始 state 加 `token: null`,`login` 存 token:
```ts
user: null,
token: null,
isLoggedIn: false,
currentPlatform: null,

login: (user, platform, token) => set({ user, token, isLoggedIn: true, currentPlatform: platform }),

logout: () => set({ user: null, token: null, isLoggedIn: false, currentPlatform: null }),
```

3. `partialize` 加 `token`:
```ts
partialize: (state) => ({
  user: state.user,
  token: state.token,
  isLoggedIn: state.isLoggedIn,
  currentPlatform: state.currentPlatform,
}),
```

- [ ] **Step 2: 修改登录页调用**

找到调用 `useAuthStore.getState().login(...)` 的地方(通常在登录页组件),改成传 token:

```ts
// Before:
const user = await api.login(phone)
login(user, "c")

// After:
const { token, user } = await api.login(phone)
login(user, "c", token)
```

搜索所有 `login(` 调用:`grep -rn "login(" src/ --include="*.tsx" --include="*.ts" | grep -i auth`

每个调用点都要加 token 参数。

- [ ] **Step 3: 验证类型**

Run: `npx tsc --noEmit 2>&1 | grep -E "auth/store|login" | head -10`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add src/platform/auth/store.ts
git commit -m "feat: add token field to auth store, login takes token"
```

---

## Task 15: Phase 2 端到端验证

**spec 参考:** §4.5

- [ ] **Step 1: 启动 server + 前端**

Run: `cd server && node index.js &`
Run: `npm run dev`(另一终端)

- [ ] **Step 2: 验证登录流程**

打开 `http://localhost:5173`,登录页输入 `13800001001`:
- 登录成功,进入 C 端首页
- 打开 DevTools → Application → Local Storage → `lijiang-demo-auth`,确认有 `token` 字段
- 打开 DevTools → Network,确认后续 API 请求带 `Authorization: Bearer eyJ...` header

- [ ] **Step 3: 验证 401 处理**

在 DevTools Console:
```js
const auth = JSON.parse(localStorage.getItem("lijiang-demo-auth"))
auth.state.token = "invalid-token"
localStorage.setItem("lijiang-demo-auth", JSON.stringify(auth))
```
刷新页面 → 任意操作触发 API → 应该自动登出,跳回登录页。

- [ ] **Step 4: 验证类型**

Run: `npx tsc --noEmit 2>&1 | grep "src/api/" | head -10`
Expected: 无隐式 any 错误

- [ ] **Step 5: Commit(标记 Phase 2 完成)**

```bash
git add -A
git commit -m "chore: Phase 2 complete - API client with types and JWT verified"
```

---

## 完成标准

执行完所有 task 后,确认:

- [ ] `cd server && npm install` 成功(better-sqlite3 编译通过)
- [ ] server 启动后首次自动建库 + 灌种子
- [ ] 二次启动不覆盖数据(改一条记录 → 重启 → 数据还在)
- [ ] `POST /api/v1/auth/login` 返回 token
- [ ] `GET /api/v1/auth/me` 带 Bearer token 返回 user
- [ ] `GET /api/v1/reviews/stats` 返回统计数据(不被 `/:id` 吞)
- [ ] `POST /api/v1/orders/:id/dispatch` 返回派单后的 order
- [ ] `POST /api/v1/complaints/:id/resolve` 返回更新后的 complaint
- [ ] `POST /api/v1/trust-scores/threshold` 成功(POST 不再 404)
- [ ] `POST /api/v1/banners/reorder` 成功(POST)
- [ ] `POST /api/v1/orders/:id/transition` 带 `priceQuote` 等业务字段一起存
- [ ] `POST /api/v1/upload` 上传图片返回 URL
- [ ] `/uploads/xxx.png` 能访问图片
- [ ] 前端 hydrate 正常(所有页面数据加载正常)
- [ ] 登录后所有 API 请求带 `Authorization: Bearer <token>` header
- [ ] token 过期 → 自动 logout 跳登录
- [ ] `npx tsc --noEmit` 在 `src/api/` 范围无隐式 any
- [ ] `server/package.json` 无 `sql.js`
- [ ] `server/db/data/` 目录不存在
- [ ] `server/db/index.js`(旧 JSON DB)不存在

**下一步:** 执行 Plan 2(`docs/superpowers/plans/2026-07-06-store-migration.md`)—— 18 个 store 逐个迁移到 API。
