# 丽江古城游 V2.0 — 真实前后端架构改造设计

> 日期: 2026-07-06
> 状态: 已确认,待出实施计划
> 执行策略: 方案 B(地基先行,按 feature 逐个迁移)

---

## 1. 目标与背景

### 1.1 目标

把当前"半 mock 半真实"的 Demo 改造成**真正的全栈应用**:

- 后端用正式数据库(SQLite via better-sqlite3),数据持久化
- 所有数据(含种子数据)是 DB 里的真实记录,不在前端 store 里硬编码
- 所有增删改走 API,服务端权威(server-authoritative)
- 真实 JWT 认证
- 真实文件上传(multer)
- 数据库单文件可复制部署

### 1.2 当前主要问题(改造动机)

| 问题 | 现状 |
|------|------|
| 服务端重启覆盖数据 | `index.js` 无条件调 `seed()`,`seed()` 无条件 writeTable |
| 便民核心流程不写后端 | `assignToStaff`/`acceptOrder`/`reDispatch` 等只改本地 state |
| transition 丢业务字段 | `/orders/:id/transition` 只存 status,priceQuote/payMethod/photos 丢失 |
| 3 个端点缺失 | `/orders/:id/dispatch`、`/complaints/:id/resolve`、`/complaints/:id/reject` |
| 2 个方法不匹配 | `trust-scores/threshold`、`banners/reorder`:前端 POST,后端 PUT |
| 路由顺序错位 | `/reviews/stats` 被 CRUD `/:id` 吞 |
| syncAction 误用 | 回调空 `() => {}`,`set()` 写外面,无回滚,弃用服务端返回值 |
| 多个 store 无 mutation API | staff/settlement/trust-score/checkin 等 hydrate 后只本地改 |
| 硬编码种子残留 | naxi-store 的 `nx1/nx2/nx3`、checkin-store 的 `genSeeds()` 被 hydrate 覆盖 |
| 死代码 | `sql.js` 装了不用、`schema.sql` 写了不用、分支名叫 sqlite 却用 JSON 文件 |
| API client 无类型 | `src/api/client.ts` 全隐式 any |

### 1.3 不在本次范围

- 不换前端框架/路由库/UI 库
- 不做真实支付/真实短信验证码
- 不做生产级日志/监控/CI
- 图片仍可用 Unsplash URL 作为内容图;仅"用户产生的照片"(打卡/凭证/完成照片)走真上传

---

## 2. 架构总览

### 2.1 数据流(所有端统一)

```
用户操作 → store action → api client (带 JWT Bearer header)
  → Express 路由 → DB 层 (better-sqlite3)
  → 返回更新后的完整记录(RETURNING *)
  → store 用服务端返回值更新本地 state
  → 失败:toast 报错,本地 state 不动(不乐观更新)
```

### 2.2 核心原则:服务端权威

- 状态机(便民服务 transition)逻辑只在 `server/logic/transitions.js`
- 所有 ID、时间戳、计算字段(诚信分、余额)由 server 生成并返回
- 前端 store 只是 server 数据的缓存,不自己"算"数据
- 前端 `transitions.ts` 降级为 UI 辅助(查询当前状态可执行哪些 action),不做流转判定

### 2.3 Server 目录结构(改造后)

```
server/
├── index.js              ← Express app,路由挂载,静态文件
├── package.json          ← 移除 sql.js,加 better-sqlite3/jsonwebtoken/multer
├── db/
│   ├── connection.js     ← 【新】better-sqlite3 单例,PRAGMA foreign_keys=ON
│   ├── schema.sql        ← 【重写】camelCase 列名 + FK 约束
│   ├── seed.js           ← 【重写】只在空库时灌一次
│   └── data.db           ← SQLite 文件(.gitignore)
├── middleware/
│   ├── response.js       ← 保留 ok()/fail()
│   ├── auth.js           ← 【新】verifyToken:解 JWT,挂 req.userId
│   └── upload.js         ← 【新】multer 配置
├── routes/               ← 【重构】按 domain 拆分
│   ├── auth.js
│   ├── orders.js         ← 含 transition + dispatch
│   ├── complaints.js     ← 含 resolve/reject
│   ├── points.js         ← 含 transact
│   ├── trust-scores.js   ← 含 threshold(特殊路由在前)
│   ├── content.js        ← news/routes/courtyards/merchants/pois/housing
│   ├── homepage.js       ← banners + grid-items(含 reorder)
│   ├── uploads.js        ← POST /upload
│   ├── reviews.js        ← 含 stats(特殊路由在前)
│   ├── volunteer.js
│   ├── bookings.js       ← 含 check 端点
│   ├── announcements.js  ← 【新】
│   ├── flow-warnings.js  ← 【新】
│   └── crud.js           ← 通用 CRUD builder(改 SQL 实现)
├── uploads/              ← 【新】静态文件目录(.gitignore)
└── logic/
    ├── transitions.js    ← 保留(修字段名 camelCase)
    └── dispatch.js       ← 保留(修字段名 camelCase)
```

### 2.4 前端结构变化

```
src/api/
├── client.ts     ← 【重写】带类型 + JWT header + 401 处理
├── types.ts      ← 【新】ApiResponse / Paginated / ListParams
├── sync.ts       ← 【重写】server-authoritative syncAction
├── hydrate.ts    ← 保留(逻辑不变,只是后端换了)
└── AppInit.tsx   ← 保留
```

---

## 3. Phase 1 — Server 地基

### 3.1 数据库层

#### 3.1.1 `server/db/connection.js`(新增)

```js
import Database from "better-sqlite3"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dirname, "data.db"))

// 开启外键约束
db.pragma("foreign_keys = ON")
// 不开 WAL,用默认 journal mode(单文件部署最干净)

export default db
```

#### 3.1.2 `server/db/schema.sql`(重写)

**两个改动:**

1. **列名全改 camelCase** —— 跟前端字段名一一对应,API 层零映射。例如 `created_at` → `createdAt`、`user_id` → `userId`、`service_type` → `serviceType`。

2. **加外键约束** —— 删除时级联或置空。例如:
   ```sql
   CREATE TABLE convenience_orders (
     id TEXT PRIMARY KEY,
     userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     staffId TEXT REFERENCES staff(id) ON DELETE SET NULL,
     serviceType TEXT NOT NULL,
     address TEXT NOT NULL,
     -- ... 其余字段照搬现有 schema,改 camelCase
     createdAt TEXT NOT NULL DEFAULT (datetime('now')),
     updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
   );
   ```

**完整表清单(30+ 张表)**:对照现有 `server/db/schema.sql` 全部表,逐一改列名为 camelCase,加 FK。新增两张表:

```sql
-- 公告通知
CREATE TABLE announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  type TEXT DEFAULT 'system',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 人流量预警
CREATE TABLE flow_warnings (
  id TEXT PRIMARY KEY,
  area TEXT NOT NULL,
  level TEXT DEFAULT 'normal',
  currentCount INTEGER DEFAULT 0,
  threshold INTEGER DEFAULT 1000,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

`users` 表加 `phone` UNIQUE 约束(已存在,确认即可)。

#### 3.1.3 `server/db/seed.js`(重写)

**seed-once 逻辑:**

```js
import db from "./connection.js"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export function seedIfNeeded() {
  // 检查 users 表是否为空
  const { c } = db.prepare("SELECT COUNT(*) as c FROM users").get()
  if (c > 0) return false  // 非空,跳过

  // 空库:先建表
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8")
  db.exec(schema)

  // 灌种子数据(用 prepared statements)
  const insertUser = db.prepare("INSERT INTO users (id, name, phone, roles, platform) VALUES (?, ?, ?, ?, ?)")
  // roles/platform 是 JSON 数组,存为 JSON 字符串
  insertUser.run("u_c_001", "张小游", "13800001001", JSON.stringify(["tourist"]), JSON.stringify(["c"]))
  insertUser.run("u_c_s_001", "张老板", "13800001002", JSON.stringify(["tourist", "supplier"]), JSON.stringify(["c", "b", "desktop"]))
  insertUser.run("u_b_001", "李师傅", "13900002004", JSON.stringify(["service"]), JSON.stringify(["b"]))
  insertUser.run("u_admin", "管理员", "18800003001", JSON.stringify(["platform_admin"]), JSON.stringify(["b", "desktop"]))

  // ... 其余种子数据(orders/staff/content/...)全部用 prepared statements 写入
  // 数组类字段(images/serviceTypes/zoneIds/tags 等)存为 JSON 字符串

  return true
}
```

**种子数据内容**:直接从现有 `server/db/seed.js` 的数据搬过来,改成 SQL INSERT。所有表都要灌(包括当前为空的表如 checkins/naxi_checkins/volunteers 等灌 `[]` 即跳过)。

**关键**:数组/对象字段(`images`、`serviceTypes`、`zoneIds`、`tags`、`stations`、`body`、`spots`、`contentBlocks`、`gallery`、`meta`、`scoreHistory`、`reviewHistory`、`credentialImages`、`fields` 等)在 SQLite 里存为 JSON 字符串(TEXT)。读取时 `JSON.parse`。

#### 3.1.4 启动顺序(`server/index.js`)

```js
import "./db/connection.js"  // 打开 DB
import { seedIfNeeded } from "./db/seed.js"

seedIfNeeded()  // 空库才灌

// 然后挂路由...
```

### 3.2 Auth(JWT)

#### 3.2.1 `server/middleware/auth.js`(新增)

```js
import jwt from "jsonwebtoken"
import { fail } from "./response.js"

const JWT_SECRET = process.env.JWT_SECRET || "lijiang-demo-secret"
const JWT_EXPIRES = "7d"

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(req, res, next) {
  const auth = req.headers.authorization
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) return res.json(fail("未登录", 401))
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch {
    return res.json(fail("token 无效或已过期", 401))
  }
}
```

#### 3.2.2 `server/routes/auth.js`

- `POST /api/v1/auth/login` —— body: `{ phone }`。查 `users` 表(`SELECT * FROM users WHERE phone = ?`)。找不到返回 `fail("用户不存在")`。找到则 `signToken(user.id)`,返回 `ok({ token, user })`。user 里的 `roles`/`platform` 要 `JSON.parse`。
- `GET /api/v1/auth/me` —— 挂 `verifyToken` 中间件。用 `req.userId` 查 `users` 表,返回 user。

#### 3.2.3 前端 auth store 改造

`src/platform/auth/store.ts` 增加 `token` 字段:

```ts
type AuthState = {
  user: User | null
  token: string | null          // 【新】
  isLoggedIn: boolean
  currentPlatform: Platform | null
  login: (user: User, platform: Platform, token: string) => void  // 加 token 参数
  logout: () => void
  // ... 其余不变
}
```

`partialize` 里加 `token`。`logout` 清空 token。

登录页调 `api.login(phone)` 拿到 `{ token, user }` 后,调 `login(user, platform, token)`。

### 3.3 文件上传

#### 3.3.1 `server/middleware/upload.js`(新增)

```js
import multer from "multer"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { existsSync, mkdirSync } from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadsDir = join(__dirname, "../uploads")
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("仅支持图片"))
    cb(null, true)
  },
})
```

#### 3.3.2 `server/routes/uploads.js`

```js
import { Router } from "express"
import { upload } from "../middleware/upload.js"
import { ok } from "../middleware/response.js"

const router = Router()

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.json(fail("未收到文件"))
  res.json(ok({ url: `/uploads/${req.file.filename}` }))
})

export default router
```

#### 3.3.3 `server/index.js` 静态文件

```js
import express from "express"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
app.use("/uploads", express.static(join(__dirname, "uploads")))
```

#### 3.3.4 Vite dev proxy(`vite.config.ts` 加 server.proxy)

上传返回的 URL 是 `/uploads/xxx.png`(相对路径),前端 `<img src={url}>` 默认请求 Vite dev server(5173 端口),需要代理到后端(3001 端口):

```ts
export default defineConfig({
  // ... 现有配置不变
  server: {
    proxy: {
      "/uploads": "http://localhost:3001",
    },
  },
})
```

#### 3.3.5 前端上传 helper(`src/api/client.ts` 里加)

```ts
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  const token = useAuthStore.getState().token
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,  // 注意:不要设 Content-Type,浏览器自动加 boundary
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.msg)
  return json.data.url  // 返回 "/uploads/xxx.png"
}
```

需要上传图片的页面(打卡/付款凭证/完成照片/志愿者证件/商家注册图片等)用这个 helper。上传成功拿到 URL 后,再调对应的 create/update API 存 URL。

### 3.4 端点补齐与修复

#### 3.4.1 新增端点

**`POST /api/v1/orders/:id/dispatch`** —— 在 `server/routes/orders.js`:

```js
router.post("/:id/dispatch", (req, res) => {
  const order = get("convenience_orders", req.params.id)
  if (!order) return res.json(fail("订单不存在", 404))
  const { mode, staffId } = req.body  // mode: "auto" | "manual"
  let staff
  if (mode === "manual" && staffId) {
    staff = lookupStaff(db.prepare("SELECT * FROM staff WHERE id = ?").get(staffId), ...)
  } else {
    // auto: 跑 dispatch.js pickStaff
    const allStaff = db.prepare("SELECT * FROM staff").all()
    const zones = db.prepare("SELECT * FROM zones").all()
    staff = pickStaff(allStaff, order.serviceType, order.lat, order.lng, zones)
  }
  if (!staff) return res.json(fail("无可用服务人员"))
  // 派单:状态流转 + 写 staffId
  const next = transition(order.status, "assign") || transition(order.status, "reDispatch")
  if (!next) return res.json(fail(`当前状态 ${order.status} 不可派单`))
  const updated = update("convenience_orders", order.id, {
    status: next,
    staffId: staff.id,
    staffName: staff.name,
    staffPhone: staff.phone,
  })
  res.json(ok(updated))
})
```

**`POST /api/v1/complaints/:id/resolve`** —— 在 `server/routes/complaints.js`:

```js
router.post("/:id/resolve", (req, res) => {
  const { result } = req.body
  const updated = update("complaints", req.params.id, {
    status: "C40", result, handledAt: new Date().toISOString(),
  })
  if (!updated) return res.json(fail("投诉不存在", 404))
  res.json(ok(updated))
})
```

**`POST /api/v1/complaints/:id/reject`** —— 同上,`status: "CR"`。

**`POST /api/v1/bookings/check`** —— 核销端点:

```js
router.post("/check", (req, res) => {
  const { code } = req.body
  const booking = db.prepare("SELECT * FROM bookings WHERE code = ?").get(code)
  if (!booking) return res.json(fail("核销码无效"))
  if (booking.status === "checked") return res.json(fail("该预约已核销"))
  if (booking.status === "cancelled") return res.json(fail("该预约已取消"))
  const updated = update("bookings", booking.id, {
    status: "checked", checkedAt: new Date().toISOString(),
  })
  res.json(ok(updated))
})
```

**`POST /api/v1/grid-items/reorder`** —— 在 `server/routes/homepage.js`:

```js
router.post("/grid-items/reorder", (req, res) => {
  const { ids } = req.body
  const stmt = db.prepare("UPDATE grid_items SET \"order\" = ?, updatedAt = ? WHERE id = ?")
  const now = new Date().toISOString()
  const tx = db.transaction(() => {
    ids.forEach((id, i) => stmt.run(i, now, id))
  })
  tx()
  res.json(ok(null, "排序已更新"))
})
```

#### 3.4.2 方法不匹配修复

- `server/routes/trust-scores.js`:`threshold` 端点从 `app.put` 改成 `app.post`(对齐前端)
- `server/routes/homepage.js`:`banners/reorder` 从 `app.put` 改成 `app.post`

#### 3.4.3 路由顺序修复

**铁律:特殊路由必须在 crudRoutes 之前注册。**

`server/routes/reviews.js`:
```js
const router = Router()
// 特殊路由在前
router.get("/stats", (req, res) => { ... })
// 然后才是 CRUD
router.use("/", crudRoutes("reviews", { filters: ["staffId", "rating", "followUp"] }))
```

`server/routes/trust-scores.js`:
```js
const router = Router()
router.get("/threshold", ...)
router.post("/threshold", ...)
router.use("/", crudRoutes("trust_scores"))
// 注意:/trust-scores/rules 是独立挂载的,不受影响
```

`server/routes/homepage.js`:
```js
const router = Router()
router.post("/banners/reorder", ...)
router.post("/grid-items/reorder", ...)
router.use("/banners", crudRoutes("banners", ...))
router.use("/grid-items", crudRoutes("grid_items", ...))
```

#### 3.4.4 transition 端点增强

`POST /api/v1/orders/:id/transition` 接受 `{ action, ...fields }`:

```js
router.post("/:id/transition", (req, res) => {
  const order = get("convenience_orders", req.params.id)
  if (!order) return res.json(fail("订单不存在", 404))
  const { action, ...extraFields } = req.body
  const next = transition(order.status, action)
  if (!next) return res.json(fail(`状态 ${order.status} 不支持动作 ${action}`))
  // 一起存 status + 业务字段
  const updated = update("convenience_orders", req.params.id, {
    status: next,
    ...extraFields,  // priceQuote / payMethod / completionPhotos / rating 等
  })
  res.json(ok(updated))
})
```

### 3.5 通用 CRUD 改造(`server/routes/crud.js`)

把 JSON 文件操作换成 SQL。用 `RETURNING *` 拿更新后的完整行。

```js
import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"

// JSON 数组字段自动序列化/反序列化
// ⚠️ 执行模型:必须对照 schema.sql 里所有 DEFAULT '[]' 的字段,全部加进这个集合
const JSON_FIELDS = new Set(["images", "completionPhotos", "serviceTypes", "zoneIds",
  "tags", "stations", "body", "spots", "spotNames", "contentBlocks", "gallery", "meta",
  "scoreHistory", "reviewHistory", "credentialImages", "fields", "roles", "platform"])

function deserializeRow(row) {
  if (!row) return null
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    out[k] = (JSON_FIELDS.has(k) && typeof v === "string") ? JSON.parse(v) : v
  }
  return out
}

function serializeInput(data) {
  const out = { ...data }
  for (const k of Object.keys(out)) {
    if (JSON_FIELDS.has(k) && typeof out[k] !== "string") {
      out[k] = JSON.stringify(out[k])
    }
  }
  return out
}

export function crudRoutes(table, options = {}) {
  const router = Router()
  const { searchField, filters = [], sortDefault = "createdAt" } = options

  router.get("/", (req, res) => {
    let sql = `SELECT * FROM ${table}`
    const where = []
    const params = []
    for (const f of filters) {
      if (req.query[f] !== undefined && req.query[f] !== "") {
        where.push(`${f} = ?`)
        params.push(req.query[f])
      }
    }
    if (searchField && req.query.search) {
      where.push(`${searchField} LIKE ?`)
      params.push(`%${req.query.search}%`)
    }
    if (where.length) sql += " WHERE " + where.join(" AND ")

    const sort = req.query.sort ? req.query.sort.replace(/^-/, "") : sortDefault
    const dir = (req.query.sort || sortDefault).startsWith("-") ? "DESC" : "ASC"
    sql += ` ORDER BY ${sort} ${dir}`

    const rows = db.prepare(sql).all(...params)
    const items = rows.map(deserializeRow)
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 200
    const start = (page - 1) * pageSize
    res.json(ok({
      items: items.slice(start, start + pageSize),
      total: items.length, page, pageSize,
      totalPages: Math.ceil(items.length / pageSize) || 1,
    }))
  })

  router.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id)
    if (!row) return res.json(fail("Not found", 404))
    res.json(ok(deserializeRow(row)))
  })

  router.post("/", (req, res) => {
    const { id: _id, createdAt: _c, updatedAt: _u, ...data } = req.body
    const item = serializeInput(data)
    if (!item.id) item.id = `${table}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const now = new Date().toISOString()
    item.createdAt = now
    item.updatedAt = now
    const cols = Object.keys(item)
    const placeholders = cols.map(() => "?").join(", ")
    db.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`)
      .run(...cols.map(c => item[c]))
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(item.id)
    res.json(ok(deserializeRow(row)))
  })

  router.patch("/:id", (req, res) => {
    const { id: _id, createdAt: _c, ...data } = req.body
    const item = serializeInput(data)
    item.updatedAt = new Date().toISOString()
    const cols = Object.keys(item)
    const setClause = cols.map(c => `${c} = ?`).join(", ")
    const result = db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`)
      .run(...cols.map(c => item[c]), req.params.id)
    if (result.changes === 0) return res.json(fail("Not found", 404))
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id)
    res.json(ok(deserializeRow(row)))
  })

  router.delete("/:id", (req, res) => {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id)
    res.json(ok(null, "Deleted"))
  })

  return router
}
```

**注意**:SQL 注入风险 —— `table` 和列名是拼接的。因为是内部 CRUD builder(table 名和 filter 字段都是代码里写死的,不来自用户输入),可接受。但 `searchField`/`filters` 必须只在 `options` 里声明,不能来自 `req.query`。

### 3.6 逻辑层字段名修复

`server/logic/dispatch.js` 当前用 snake_case(`s.service_types`、`s.zone_ids`、`z.stations`),改成 camelCase:

```js
export function pickStaff(staffList, orderServiceType, orderLat, orderLng, zones) {
  const candidates = staffList.filter(s => s.enabled && s.status === "online" && s.serviceTypes?.includes(orderServiceType))
  // ...
  const eligibleZoneIds = zones
    .filter(z => z.stations?.some(st => st.serviceType === orderServiceType))
    .map(z => z.id)
  const zoneMatches = candidates.filter(s => s.zoneIds?.some(zid => eligibleZoneIds.includes(zid)))
  // ...
}
```

`server/logic/transitions.js` 不依赖字段名,无需改。

### 3.7 dead code 清理

- `server/package.json`:移除 `sql.js`,加 `better-sqlite3`、`jsonwebtoken`、`multer`
- `server/db/data/` 目录:删掉(所有 JSON 文件)
- 旧 JSON 文件 DB 逻辑(`readFileSync`/`writeFileSync`/`initTable`/`saveTable`):从 `server/db/index.js` 删除(该文件整个被 `connection.js` + `crud.js` 取代)
- `server/db/index.js`:删除(被 `connection.js` 取代)

### 3.8 Phase 1 验证清单

- [ ] `cd server && npm install` 成功(better-sqlite3 编译通过)
- [ ] `npm run dev` 启动,首次自动建库 + 灌种子
- [ ] 二次启动不覆盖数据(改一条记录 → 重启 → 数据还在)
- [ ] `POST /api/v1/auth/login` 返回 token
- [ ] `GET /api/v1/auth/me` 带 Bearer token 返回 user
- [ ] `GET /api/v1/reviews/stats` 返回统计数据(不被 `/:id` 吞)
- [ ] `POST /api/v1/orders/:id/dispatch` 返回派单后的 order
- [ ] `POST /api/v1/complaints/:id/resolve` 返回更新后的 complaint
- [ ] `POST /api/v1/trust-scores/threshold` 成功(不再 404)
- [ ] `POST /api/v1/banners/reorder` 成功
- [ ] `POST /api/v1/upload` 上传图片返回 URL
- [ ] `/uploads/xxx.png` 能访问图片
- [ ] 前端 hydrate 正常(所有页面数据加载正常)

---

## 4. Phase 2 — API 客户端层

### 4.1 `src/api/types.ts`(新增)

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

### 4.2 `src/api/client.ts` 重写

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
```

所有 `api`/`ordersApi`/`staffApi` 等保留同名,但加类型签名。例如:

```ts
export const ordersApi = {
  list: (params: ListParams): Promise<Paginated<any>> => api.list("orders", params),
  get: (id: string) => api.get("orders", id) as Promise<any>,
  create: (data: any) => api.create("orders", data) as Promise<any>,
  update: (id: string, data: any) => api.update("orders", id, data) as Promise<any>,
  remove: (id: string) => api.remove("orders", id),
  transition: (id: string, action: string, fields?: Record<string, unknown>) =>
    api.post("orders", `/${id}/transition`, { action, ...fields }),
  dispatch: (id: string, mode: "auto" | "manual", staffId?: string) =>
    api.post("orders", `/${id}/dispatch`, { mode, staffId }),
}
```

**注意**:`transition` 签名改成接受 `fields`,把业务字段(priceQuote/payMethod 等)一起传。

### 4.3 `src/api/sync.ts` 重写

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

### 4.4 铁律(执行模型必须遵守)

1. **`localUpdate` 必须接收并用 `result`**(服务端返回值),禁止 `() => {}`
2. **`set()` 必须在 `localUpdate` 回调内**,禁止写在外面
3. **禁止乐观更新**(先改本地再调 API),所有改动等服务端确认
4. **失败返回 null,本地 state 不动**
5. **ID/时间戳用服务端返回的**,不在前端生成

### 4.5 Phase 2 验证清单

- [ ] `npx tsc --noEmit` 无隐式 any 错误(在 `src/api/` 范围内)
- [ ] 登录后所有 API 请求带 `Authorization: Bearer <token>` header
- [ ] token 过期(手动改 localStorage 里的 token)→ 自动 logout 跳登录

---

## 5. Phase 3 — Store 逐个迁移

### 5.1 统一迁移动作(每个 store 都要做)

1. **删掉所有 `const SEED_* = []` 和硬编码数组**
2. **所有 mutation 改成**:
   ```ts
   await syncAction("actionName", () => xxxApi.method(args), (result) => {
     set((s) => ({ ... }))  // 用 result 更新
   })
   ```
3. **不再本地"算"数据**:ID/时间戳/余额/诚信分等全由 server 返回

### 5.2 迁移顺序与关键改动

#### 5.2.1 convenience/store.ts(最复杂,第一个迁)

| action | 改法 |
|--------|------|
| `createOrder` | `ordersApi.create(order)` → 返回完整 order(含 server 生成的 id)→ 加到本地 |
| `autoDispatchOrder` / `assignToStaff` | `ordersApi.dispatch(id, "auto")` → 返回更新后的 order(含 staffId/staffName)→ 更新本地 |
| `manualDispatch` | `ordersApi.dispatch(id, "manual", staffId)` → 同上 |
| `acceptOrder` | `ordersApi.transition(id, "accept")` → 用返回值更新 |
| `submitQuote` | `ordersApi.transition(id, "quote", { priceQuote: price })` → 业务字段一起传 |
| `markPaid` | `ordersApi.transition(id, "pay", { payMethod: method })` |
| `startService` | `ordersApi.transition(id, "startService")` |
| `completeService` | `ordersApi.transition(id, "complete", { completionPhotos: photos })` |
| `confirmComplete` | `ordersApi.transition(id, "confirm")` → 触发 `recordIncome`(调 settlement API) |
| `rateOrder` | `ordersApi.update(id, { rating, ratedAt })` → 用返回值 |
| `requestCancel` | `ordersApi.transition(id, "requestCancel")` |
| `approveCancelRequest` | `ordersApi.transition(id, "approveCancel")` |
| `rejectCancelRequest` | `ordersApi.transition(id, "rejectCancel")` |
| `forceCancel` | `ordersApi.transition(id, "forceCancel")` |
| `uploadPaymentProof` | `uploadFile(file)` 拿 URL → `ordersApi.update(id, { paymentProof: url })` |
| `approvePriceQuote` | `ordersApi.transition(id, "approveQuote")` |
| `rejectPriceQuote` | `ordersApi.transition(id, "rejectQuote")` |
| `confirmPaymentProof` | `ordersApi.transition(id, "confirmPayment")` → 触发 `recordIncome` |
| `rejectPaymentProof` | `ordersApi.update(id, { paymentProof: undefined })` |

**删除**:`import { SEED_ORDERS } from "./seed"` 及 `seed.ts` 文件。
**保留**:`transitions.ts`(仅用于 `getValidActions` UI 提示)、`timers.ts`(客户端定时器,触发的动作调 API)、`notification.ts`、`dispatch.ts`(前端不再需要,但如有引用可保留空壳)。

#### 5.2.2 settlement-store.ts

- `recordIncome` → `api.create("incomes", record)` → 加到本地
- `requestWithdrawal` → `api.create("withdrawals", { staffId, staffName, amount, status: "pending" })` → 加到本地,返回 `{ ok, msg }`
- `approveWithdrawal` → `api.update("withdrawals", id, { status: "approved", reviewedAt, reviewer })` → 更新本地
- `rejectWithdrawal` → `api.update("withdrawals", id, { status: "rejected", reviewedAt, reviewer, rejectReason })` → 更新本地
- 删 `SEED_INCOMES`/`SEED_WITHDRAWALS`

#### 5.2.3 staff-store.ts

- `addStaff` → `staffApi.create({ supplierId, name, phone, enabled: true, status: "offline", assignedOrders: 0, joinedAt })` → 加到本地
- `toggleEnabled` → `staffApi.update(id, { enabled: !current })` → 更新本地
- `setStaffStatus` → `staffApi.update(id, { status })` → 更新本地
- `removeStaff` → `staffApi.remove(id)` → 从本地删
- 删 `SEED`

#### 5.2.4 content 6 个 store(news/routes/courtyards/merchants/pois/housing)

每个 store 的 `add`/`update`/`delete` 把 `syncAction` 回调从 `() => {}` 改成用返回值:

```ts
// Before:
addNews: (item) => {
  syncAction("news.add", () => contentApi.news.create(item), () => {})
  set((s) => ({ news: [...s.news, item] }))
}

// After:
addNews: async (item) => {
  await syncAction("news.add", () => contentApi.news.create(item), (result) => {
    set((s) => ({ news: [result, ...s.news] }))
  })
}
```

`update`/`delete` 同理,用 `result` 替换本地对应记录。

#### 5.2.5 homepage-store.ts

- `toggleGridItem` → `gridApi.update(id, { visible: !current })`(传实际值,不再传 `{}`)
- `updateGridItem` → `gridApi.update(id, fields)` → 用返回值更新
- `addBanner` → `bannersApi.create({ scene, imageUrl: "", title: "", order })` → 用返回值(server 生成的 id)
- `updateBanner` / `removeBanner` → 走 API,用返回值
- `reorderGridItem` → `api.post("grid-items", "/reorder", { ids })` → 用返回值更新本地 order
- `moveBanner` → `bannersApi.reorder(ids)` → 更新本地
- 删 `DEFAULT_GRID`/`DEFAULT_BANNERS`/`nextBannerId`

#### 5.2.6 points-store.ts

- `transact` → `pointsApi.transact({ userId, sourceCode, refId, customDelta })` → 返回更新后的 account → 更新本地 accounts/ledgers
- `addRule` → `pointsApi.rules.create(rule)` → 加到本地
- `updateRule` → `pointsApi.rules.update(code, patch)` → 更新本地
- `removeRule` → `pointsApi.rules.remove(code)` → 从本地删
- 删 `SEED_RULES`

#### 5.2.7 trust-score 两个 store

**rules-store.ts**:
- `addRule` → `trustApi.rules.create(rule)` → 加到本地
- `updateRule` → `trustApi.rules.update(id, patch)` → 更新本地
- `removeRule` → `trustApi.rules.remove(id)` → 从本地删
- `toggleRule` → `trustApi.rules.update(id, { enabled: !current })` → 更新本地
- `updateThreshold` → `trustApi.threshold.update(patch)` → 更新本地
- 删 `SEED_RULES`/`DEFAULT_THRESHOLD`(从 server 读)

**store.ts**(诚信分):
- 诚信分调整(差评扣分/投诉扣分等)通过 `api.update("trust-scores", staffId, { ... })` 走 server
- `SEED_SCORES`/`SEED_SUPPLIER_RATINGS` 删除

#### 5.2.8 volunteer/store.ts

- 修 `syncAction` 用返回值
- `signUp` → `api.create("volunteers", ...)` → 加到本地
- `checkIn`/`checkOut` → `api.create("volunteer-records", ...)` 或 `api.update("volunteer-records", id, ...)` → 更新本地
- 删前端种子

#### 5.2.9 checkin + naxi-store

**checkin-store.ts**:
- 删 `genSeeds()` 和 `COURTYARDS`/`USERS`/`PHOTOS` 硬编码(这些是生成假数据的,不要了)
- `addCheckin` → `api.create("checkins", { userId, courtyardId, imageUrl, note, lat, lng })` → 加到本地
- 图片先 `uploadFile` 拿 URL 再存

**naxi-store.ts**:
- 删硬编码 `nx1`/`nx2`/`nx3`
- `addCheckin` → `api.create("naxi-checkins", { userId, photo, location })` → 加到本地

#### 5.2.10 complaints/store.ts

- `createComplaint` → 把 `set()` 移进 `syncAction` 回调,用 server 返回的 id:
  ```ts
  await syncAction("createComplaint", () => complaintsApi.create(item), (result) => {
    set((s) => ({ complaints: [result, ...s.complaints] }))
  })
  ```
- `resolveWithResult` → `complaintsApi.resolve(id, result)` → 用返回值更新本地
- `reject` → `complaintsApi.reject(id, reason)` → 用返回值更新本地

#### 5.2.11 favorite/address/booking

**favorite-store.ts**:修 `syncAction` 用返回值。
**address-store.ts**:修 `syncAction` 用返回值;`setDefault` → `api.update("addresses", id, { isDefault: true })` + 其他地址 `isDefault: false`(server 端处理或前端逐个 update)。
**booking-store.ts**:
- `createBooking` → 修 `syncAction` 用返回值
- `checkByCode` → `api.post("bookings", "/check", { code })` → 返回更新后的 booking
- `cancelBooking` → `bookingsApi.update(id, { status: "cancelled" })` → 更新本地

#### 5.2.12 merchant-review/supplier/ai-knowledge

- `merchant-review/registration-store.ts`:修 `syncAction` 用返回值
- `merchant-review/store.ts`:接 API(用 `merchant-reviews` 表)
- `supplier/supplier-store.ts`:修 `syncAction` 用返回值;`create` → `supplierApi.create()` → 加到本地
- `ai-knowledge/store.ts`:修 `syncAction` 用返回值

#### 5.2.13 announcement/flow-warning(新增后端)

**announcement-store.ts**:
- 删硬编码种子
- `add`/`update`/`remove` → 走 `api.create/update/remove("announcements")`
- hydrate 已覆盖(加进 hydrate 列表)

**flow-warning-store.ts**:
- 删硬编码种子
- `update`/`resolve` → 走 `api.update("flow-warnings")`
- 加进 hydrate 列表

### 5.3 hydrate.ts 更新

在 `src/api/hydrate.ts` 的 `Promise.allSettled` 里加上:
```ts
api.list("announcements", { pageSize: 200 }),
api.list("flow-warnings", { pageSize: 200 }),
```
对应 `useAnnouncementStore.setState({ ... })` / `useFlowWarningStore.setState({ ... })`。

### 5.4 Phase 3 验证清单(每迁完一个 store 验证)

- [ ] 该 store 涉及的页面:增删改后刷新页面,数据不丢
- [ ] API 失败时(断开后端)操作报 toast,本地 state 不变
- [ ] 该 store 文件里 grep 不出 `SEED`、`const .* = \[` 形式的硬编码数据

---

## 6. 部署

### 6.1 部署方式

1. **`data.db` 是单文件,直接复制即可迁移数据**
2. **journal mode 用默认(DELETE),不开 WAL** —— 所有数据在 `data.db` 一个文件里
3. **首次部署两种路径**:
   - 带数据部署:复制 `data.db` 到部署机 → 启动 → seed 检测到 users 非空就跳过
   - 干净部署:不复制 `data.db` → 启动时自动建库 + 灌种子
4. **`data.db` 在 `.gitignore` 里**(`server/db/data.db`);`schema.sql` 和 `seed.js` 提交
5. **`better-sqlite3` 是 native 模块**:部署机要 `npm install`(按目标机 Node 版本/架构编译),不能跨机复制 `node_modules`
6. **`uploads/` 目录**:gitignore,部署机首次启动自动创建

### 6.2 `.gitignore` 更新

`server/.gitignore`:
```
node_modules/
db/data.db
db/data.db-journal
uploads/
```

### 6.3 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 服务端口 |
| `JWT_SECRET` | `lijiang-demo-secret` | JWT 签名密钥,部署时建议覆盖 |

### 6.4 启动命令

```bash
cd server
npm install        # 编译 better-sqlite3
npm run dev        # 开发模式(node --watch)
npm run start      # 生产模式
```

---

## 7. 总验证清单(全部完成后)

### 7.1 数据持久化
- [ ] 创建订单 → 重启 server → 订单还在
- [ ] 派单 → 刷新页面 → staffId/staffName 不丢
- [ ] 报价 → 刷新页面 → priceQuote 不丢
- [ ] 上传付款凭证 → 刷新页面 → paymentProof URL 不丢
- [ ] 修改桌面端内容(新闻/院落等)→ 刷新 → 改动在
- [ ] 调整诚信分阈值 → 重启 → 阈值不丢

### 7.2 端点完整
- [ ] `POST /orders/:id/dispatch` 200
- [ ] `POST /complaints/:id/resolve` 200
- [ ] `POST /complaints/:id/reject` 200
- [ ] `POST /trust-scores/threshold` 200
- [ ] `POST /banners/reorder` 200
- [ ] `GET /reviews/stats` 200(返回统计数据)
- [ ] `POST /upload` 200(返回 URL)

### 7.3 认证
- [ ] 登录返回 JWT token
- [ ] 所有 API 请求带 Bearer header
- [ ] token 过期 → 自动 logout
- [ ] `/auth/me` 验 token 返回 user

### 7.4 前端无硬编码
- [ ] `grep -r "const SEED" src/features/` 无结果
- [ ] `grep -r "nx1\|nx2\|nx3" src/features/` 无结果
- [ ] `grep -r "genSeeds" src/features/` 无结果

### 7.5 类型安全
- [ ] `npx tsc --noEmit` 在 `src/api/` 范围无隐式 any

### 7.6 死代码清理
- [ ] `server/package.json` 无 `sql.js`
- [ ] `server/db/data/` 目录不存在
- [ ] `server/db/index.js`(旧 JSON DB)不存在

---

## 8. 执行顺序总结

```
Phase 1 (Server 地基)
  3.1 DB 层 (connection + schema + seed)
  3.2 Auth (JWT)
  3.3 文件上传 (multer)
  3.4 端点补齐
  3.5 CRUD 改造
  3.6 逻辑层字段名修复
  3.7 死代码清理
  → 验证:数据持久化 + 端点齐全

Phase 2 (API 客户端)
  4.1 types.ts
  4.2 client.ts 重写
  4.3 sync.ts 重写
  4.4 auth store 加 token
  → 验证:类型 + JWT header + 401 处理

Phase 3 (Store 迁移,按顺序)
  5.2.1 convenience (最复杂)
  5.2.2 settlement
  5.2.3 staff
  5.2.4 content (6 个)
  5.2.5 homepage
  5.2.6 points
  5.2.7 trust-score
  5.2.8 volunteer
  5.2.9 checkin + naxi
  5.2.10 complaints
  5.2.11 favorite/address/booking
  5.2.12 merchant-review/supplier/ai-knowledge
  5.2.13 announcement/flow-warning
  5.3 hydrate 更新
  → 每个 store 迁完独立验证
```

---

## 9. 风险与注意点

1. **better-sqlite3 native 编译**:某些环境(如 Linux 没 build-essential)可能编译失败。备选:`npm install better-sqlite3 --build-from-source=false`(用 prebuilt binary)。绝大多数 macOS/Linux 环境有 prebuilt。

2. **数组字段 JSON 序列化**:SQLite 不原生支持数组。所有数组字段存为 JSON 字符串,`crud.js` 的 `serializeInput`/`deserializeRow` 统一处理。**执行模型必须把所有数组字段加进 `JSON_FIELDS` 集合**,否则存进去读不出来。完整清单见 §3.5。

3. **外键级联**:开了 `foreign_keys = ON` 后,删 users 会级联删 orders。Demo 里别乱删 users。staff 删除时 orders 的 staffId 置 NULL(已有订单不丢)。

4. **transition 端点的 extraFields**:前端传业务字段时,字段名必须跟 DB 列名(camelCase)一致。crud.js 的 `serializeInput` 会把数组字段转 JSON,但不会验证列名。传错列名会报 SQL 错。

5. **文件上传路径**:返回的 URL 是 `/uploads/xxx.png`(相对路径)。生产环境同源没问题;开发环境需要 Vite proxy 转发到后端(见 §3.3.4)。

6. **前端 transitions.ts 降级**:改造后前端不再用 `transition()` 做流转判定(改用 API),但 `getValidActions(status)` 可保留用于 UI(显示当前状态可执行哪些按钮)。

7. **timers.ts**:客户端定时器(支付超时/自动确认)保留,但触发的动作调 `ordersApi.transition()`,不再本地改 status。

---

## 附录:现有 store API 集成状态(改造前)

| Store | 有 API import | syncAction 用法 | 硬编码种子 |
|-------|:---:|:---:|:---:|
| convenience/store.ts | ✅ | 部分对 | seed.ts 导入 |
| settlement-store.ts | ❌ | N/A | SEED_INCOMES/SEED_WITHDRAWALS(空) |
| staff-store.ts | ❌ | N/A | SEED(空) |
| content 6 个 store | ✅ | ❌ 回调空 | DEFAULT(空) |
| homepage-store.ts | ✅ | ❌ 回调空 | DEFAULT_GRID/DEFAULT_BANNERS |
| points-store.ts | ✅ | ❌ 回调空 | SEED_RULES(空) |
| trust-score/rules-store.ts | ❌ | N/A | SEED_RULES/DEFAULT_THRESHOLD |
| trust-score/store.ts | ❌ | N/A | SEED_SCORES/SEED_SUPPLIER_RATINGS |
| volunteer/store.ts | ✅ | 部分对 | 前端种子 |
| checkin-store.ts | ❌ | N/A | genSeeds() ~90 条 |
| naxi-store.ts | ❌ | N/A | nx1/nx2/nx3 |
| complaints/store.ts | ✅ | ❌ set 在外 | SEED(空) |
| favorite-store.ts | ✅ | ❌ 回调空 | 无 |
| address-store.ts | ✅ | ❌ 回调空 | 无 |
| booking-store.ts | ✅ | ❌ 回调空 | 无 |
| merchant-review/registration-store.ts | ✅ | ❌ 回调空 | 无 |
| supplier-store.ts | ✅ | ❌ 回调空 | 无 |
| ai-knowledge/store.ts | ✅ | ❌ 回调空 | 无 |
| announcement-store.ts | ❌ | N/A | 硬编码 |
| flow-warning-store.ts | ❌ | N/A | 硬编码 |

> "回调空"指 `syncAction(name, apiCall, () => {})` 然后 `set()` 写在外面 —— 这是 Phase 3 要统一修的。
