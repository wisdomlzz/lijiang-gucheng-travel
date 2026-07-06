import express from "express"
import cors from "cors"
import { initTable, all, get, insert, update, remove, count, getTable, setTable } from "./db/index.js"
import { ok, fail } from "./middleware/response.js"
import { transition as doTransition } from "./logic/transitions.js"
import { seed } from "./db/seed.js"

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: "10mb" }))

// ====== Generic CRUD route builder ======
function crudRoutes(table, options = {}) {
  const router = express.Router()
  const { searchField, filters = [], sortDefault = "-createdAt" } = options

  // Init table if not yet done
  const existing = getTable(table)
  if (!existing || existing.length === 0) initTable(table, [])

  router.get("/", (req, res) => {
    try {
      const where = {}
      for (const f of filters) {
        if (req.query[f]) where[f] = req.query[f]
      }
      if (searchField && req.query.search) where[searchField] = `%${req.query.search}%`
      const sort = req.query.sort || sortDefault
      let items = all(table, where, sort)
      const page = parseInt(req.query.page) || 1
      const pageSize = parseInt(req.query.pageSize) || 200
      const start = (page - 1) * pageSize
      res.json(ok({
        items: items.slice(start, start + pageSize),
        total: items.length, page, pageSize,
        totalPages: Math.ceil(items.length / pageSize) || 1,
      }))
    } catch (e) { res.json(fail(e.message)) }
  })

  router.get("/:id", (req, res) => {
    try {
      const item = get(table, req.params.id)
      if (!item) return res.json(fail("Not found", 404))
      res.json(ok(item))
    } catch (e) { res.json(fail(e.message)) }
  })

  router.post("/", (req, res) => {
    try {
      const { id: _id, createdAt, updatedAt, ...data } = req.body
      const item = { ...data }
      // Ensure id
      if (!item.id) item.id = `${table}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const result = insert(table, item)
      res.json(ok(result))
    } catch (e) { res.json(fail(e.message)) }
  })

  router.patch("/:id", (req, res) => {
    try {
      const { id: _id, createdAt, updatedAt, ...data } = req.body
      const result = update(table, req.params.id, data)
      if (!result) return res.json(fail("Not found", 404))
      res.json(ok(result))
    } catch (e) { res.json(fail(e.message)) }
  })

  router.delete("/:id", (req, res) => {
    try {
      remove(table, req.params.id)
      res.json(ok(null, "Deleted"))
    } catch (e) { res.json(fail(e.message)) }
  })

  return router
}

// ====== Initialize seed data tables ======
seed()

// ====== Auth ======
const SEED_USERS = [
  { id: "u_c_001", name: "张小游", phone: "13800001001", roles: ["tourist"], platform: ["c"] },
  { id: "u_c_s_001", name: "张老板", phone: "13800001002", roles: ["tourist", "supplier"], platform: ["c", "b", "desktop"] },
  { id: "u_b_001", name: "李师傅", phone: "13900002004", roles: ["service"], platform: ["b"] },
  { id: "u_admin", name: "管理员", phone: "18800003001", roles: ["platform_admin"], platform: ["b", "desktop"] },
]

app.post("/api/v1/auth/login", (req, res) => {
  const { phone } = req.body
  if (!phone) return res.json(fail("请输入手机号"))
  const user = SEED_USERS.find(u => u.phone === phone)
  if (!user) return res.json(fail("用户不存在"))
  res.json(ok({ token: `demo-token-${user.id}`, user }))
})

app.get("/api/v1/auth/me", (req, res) => {
  const uid = req.headers["x-user-id"] || "u_c_001"
  const user = SEED_USERS.find(u => u.id === uid)
  if (!user) return res.json(fail("未登录", 401))
  res.json(ok(user))
})

// ====== Orders + transitions ======
app.use("/api/v1/orders", crudRoutes("convenience_orders", {
  filters: ["status", "serviceType", "userId", "staffId"],
  searchField: "address",
}))

app.post("/api/v1/orders/:id/transition", (req, res) => {
  try {
    const order = get("convenience_orders", req.params.id)
    if (!order) return res.json(fail("Order not found", 404))
    const { action } = req.body
    const next = doTransition(order.status, action)
    if (!next) return res.json(fail(`Invalid transition: ${order.status} -> ${action}`))
    const updated = update("convenience_orders", req.params.id, { status: next })
    res.json(ok({ order: updated, transition: { from: order.status, to: next } }))
  } catch (e) { res.json(fail(e.message)) }
})

// ====== Register all CRUD routes ======
app.use("/api/v1/staff", crudRoutes("staff", { filters: ["status", "enabled"] }))
app.use("/api/v1/zones", crudRoutes("zones"))
app.use("/api/v1/dispatch-config", crudRoutes("dispatch_configs"))
app.use("/api/v1/incomes", crudRoutes("income_records", { filters: ["staffId"] }))
app.use("/api/v1/withdrawals", crudRoutes("withdrawal_requests", { filters: ["status"] }))
app.use("/api/v1/reviews", crudRoutes("reviews", { filters: ["staffId", "rating", "followUp"] }))
app.use("/api/v1/service-config", crudRoutes("service_configs"))
app.use("/api/v1/complaints", crudRoutes("complaints", { filters: ["status", "userId", "type"] }))
app.use("/api/v1/content/news", crudRoutes("content_news", { searchField: "title" }))
app.use("/api/v1/content/routes", crudRoutes("content_routes", { searchField: "name" }))
app.use("/api/v1/content/courtyards", crudRoutes("content_courtyards", { searchField: "name" }))
app.use("/api/v1/content/merchants", crudRoutes("content_merchants", { searchField: "name" }))
app.use("/api/v1/content/pois", crudRoutes("content_pois", { searchField: "name", filters: ["category"] }))
app.use("/api/v1/content/housing", crudRoutes("content_housing", { searchField: "name" }))
app.use("/api/v1/banners", crudRoutes("banners", { filters: ["scene"] }))
app.use("/api/v1/grid-items", crudRoutes("grid_items", { filters: ["visible"] }))
app.use("/api/v1/checkins", crudRoutes("checkins", { filters: ["userId", "courtyardId"] }))
app.use("/api/v1/naxi-checkins", crudRoutes("naxi_checkins", { filters: ["userId"] }))
app.use("/api/v1/addresses", crudRoutes("addresses", { filters: ["userId"] }))
app.use("/api/v1/favorites", crudRoutes("favorites", { filters: ["userId", "targetType"] }))
app.use("/api/v1/volunteers", crudRoutes("volunteers", { filters: ["status", "userId"] }))
app.use("/api/v1/volunteer-activities", crudRoutes("volunteer_activities", { filters: ["status"] }))
app.use("/api/v1/volunteer-records", crudRoutes("volunteer_daily_records", { filters: ["volunteerId", "activityId"] }))
app.use("/api/v1/points/rules", crudRoutes("points_rules"))
app.use("/api/v1/trust-scores", crudRoutes("trust_scores"))
app.use("/api/v1/trust-scores/rules", crudRoutes("score_rules"))
app.use("/api/v1/supplier-applications", crudRoutes("supplier_applications", { filters: ["status"] }))
app.use("/api/v1/merchant-registrations", crudRoutes("merchant_registrations", { filters: ["status", "userId"] }))
app.use("/api/v1/merchant-reviews", crudRoutes("merchant_reviews", { filters: ["status", "userId"] }))
app.use("/api/v1/ai-knowledge", crudRoutes("ai_knowledge", { searchField: "question" }))
app.use("/api/v1/bookings", crudRoutes("bookings", { filters: ["userId", "courtyardId", "status"] }))
app.use("/api/v1/suppliers", crudRoutes("suppliers"))

// Review stats
app.get("/api/v1/reviews/stats", (req, res) => {
  const allReviews = getTable("reviews") || []
  const total = allReviews.length
  const positive = allReviews.filter(r => r.rating >= 4).length
  const positiveRate = total > 0 ? Math.round((positive / total) * 100) : 0
  const pendingReply = allReviews.filter(r => !r.replyContent).length
  const negativeCount = allReviews.filter(r => r.rating <= 2).length
  res.json(ok({ total, positiveRate, pendingReply, negativeCount }))
})

// Points
app.get("/api/v1/points/account/:userId", (req, res) => {
  const accounts = getTable("points_accounts") || []
  const account = accounts.find(a => a.userId === req.params.userId) || { userId: req.params.userId, balance: 0, totalEarned: 0, totalUsed: 0 }
  const ledgers = (getTable("points_ledgers") || []).filter(l => l.userId === req.params.userId)
  res.json(ok({ ...account, ledgers }))
})

app.post("/api/v1/points/transact", (req, res) => {
  try {
    const { userId, sourceCode, refId, customDelta } = req.body
    const rules = getTable("points_rules") || []
    const rule = rules.find(r => r.code === sourceCode && r.enabled !== false)
    if (!rule) return res.json(fail(`积分规则 ${sourceCode} 不存在或已停用`))
    let delta = customDelta ?? rule.points
    if (rule.direction === "OUT") delta = -Math.abs(delta)
    else delta = Math.abs(delta)

    let accounts = getTable("points_accounts")
    let account = accounts.find(a => a.userId === userId)
    if (!account) {
      account = { userId, balance: 0, totalEarned: 0, totalUsed: 0 }
      accounts.push(account)
    }
    const newBalance = account.balance + delta
    if (newBalance < 0) return res.json(fail("积分余额不足"))
    account.balance = newBalance
    account.totalEarned += delta > 0 ? delta : 0
    account.totalUsed += delta < 0 ? -delta : 0

    const ledger = {
      id: `pl_${Date.now()}`, userId, direction: rule.direction,
      delta: Math.abs(delta), sourceCode, sourceLabel: rule.label,
      refId: refId || null, balanceAfter: newBalance,
      createdAt: new Date().toISOString(),
    }
    const ledgers = getTable("points_ledgers")
    ledgers.push(ledger)
    setTable("points_accounts", accounts)
    setTable("points_ledgers", ledgers)
    res.json(ok(account, `积分${delta > 0 ? "+" : ""}${delta}`))
  } catch (e) { res.json(fail(e.message)) }
})

// Trust threshold
app.get("/api/v1/trust-scores/threshold", (req, res) => {
  let thresholds = getTable("trust_thresholds") || []
  if (thresholds.length === 0) {
    const def = { id: 1, defaultScore: 100, delinquentThreshold: 60, autoRecover: true, recoverScore: 70 }
    thresholds = [def]
    setTable("trust_thresholds", thresholds)
  }
  res.json(ok(thresholds[0]))
})

app.put("/api/v1/trust-scores/threshold", (req, res) => {
  const data = { ...req.body, id: 1 }
  setTable("trust_thresholds", [data])
  res.json(ok(data))
})

// Banner reorder
app.put("/api/v1/banners/reorder", (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids)) return res.json(fail("ids must be an array"))
  const banners = getTable("banners") || []
  ids.forEach((id, i) => {
    const b = banners.find(b => b.id === id)
    if (b) b.order = i
  })
  setTable("banners", banners)
  res.json(ok(null, "Reordered"))
})

// ====== Error handler ======
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json(fail(err.message))
})

// ====== Start ======
app.listen(PORT, () => {
  console.log(`🏛️  丽江古城游 API running at http://localhost:${PORT}`)
  console.log(`📦 API docs: docs/api-contract.md`)
  const count = getTable("convenience_orders")?.length || 0
  console.log(`📊 ${count} orders in database`)
})