import express from "express"
import cors from "cors"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import db from "./db/connection.js"
import { seedIfNeeded } from "./db/seed.js"
import { startScheduler } from "./logic/scheduler.js"
import staffRoutes from "./routes/staff.js"
import { ok, fail } from "./middleware/response.js"
import { crudRoutes } from "./routes/crud.js"
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

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: "10mb" }))

// 静态文件:上传的图片
app.use("/uploads", express.static(join(__dirname, "uploads")))

// 初始化 DB + seed
seedIfNeeded()
startScheduler()

// ====== Auth ======
app.use("/api/v1/auth", authRoutes)

// ====== Orders(含 transition + dispatch)======
app.use("/api/v1/orders", ordersRoutes)

// ====== Reviews(含 stats)======
app.use("/api/v1/reviews", reviewsRoutes)

// ====== Complaints(含 resolve + reject)======
app.use("/api/v1/complaints", complaintsRoutes)

// ====== Content(6 个子路由)======
app.use("/api/v1/content", contentRoutes)

// ====== Homepage(banners + grid-items + reorder)======
// homepage router 内部有 /banners 和 /grid-items 子路由,挂到 /api/v1
app.use("/api/v1", homepageRoutes)

// ====== Trust Scores(含 threshold + rules)======
app.use("/api/v1/trust-scores", trustScoresRoutes)

// ====== Bookings(含 check)======
app.use("/api/v1/bookings", bookingsRoutes)

// ====== Uploads ======
app.use("/api/v1/upload", uploadsRoutes)

// ====== Announcements + Flow Warnings ======
app.use("/api/v1/announcements", announcementsRoutes)
app.use("/api/v1/flow-warnings", flowWarningsRoutes)

// ====== 其他 CRUD 资源(直接用 crudRoutes)======
app.use("/api/v1/staff", staffRoutes)
app.use("/api/v1/zones", crudRoutes("zones"))
app.use("/api/v1/dispatch-config", crudRoutes("dispatch_configs"))
app.use("/api/v1/incomes", crudRoutes("income_records", { filters: ["staffId"] }))
app.use("/api/v1/withdrawals", crudRoutes("withdrawal_requests", { filters: ["status"] }))
app.use("/api/v1/service-config", crudRoutes("service_configs"))
app.use("/api/v1/checkins", crudRoutes("checkins", { filters: ["userId", "courtyardId"] }))
app.use("/api/v1/naxi-checkins", crudRoutes("naxi_checkins", { filters: ["userId"] }))
app.use("/api/v1/addresses", crudRoutes("addresses", { filters: ["userId"] }))
app.use("/api/v1/favorites", crudRoutes("favorites", { filters: ["userId", "targetType"] }))
app.use("/api/v1/volunteers", crudRoutes("volunteers", { filters: ["status", "userId"] }))
app.use("/api/v1/volunteer-activities", crudRoutes("volunteer_activities", { filters: ["status"] }))
app.use("/api/v1/volunteer-records", crudRoutes("volunteer_daily_records", { filters: ["volunteerId", "activityId"] }))
app.use("/api/v1/points/rules", crudRoutes("points_rules", { pkField: "code" }))
app.use("/api/v1/supplier-applications", crudRoutes("supplier_applications", { filters: ["status"] }))
app.use("/api/v1/merchant-registrations", crudRoutes("merchant_registrations", { filters: ["status", "userId"] }))
app.use("/api/v1/merchant-reviews", crudRoutes("merchant_reviews", { filters: ["status", "userId"] }))
app.use("/api/v1/ai-knowledge", crudRoutes("ai_knowledge", { searchField: "question" }))
app.use("/api/v1/suppliers", crudRoutes("suppliers"))

// ====== Points 特殊端点 ======
// GET /api/v1/points/account/:userId
app.get("/api/v1/points/account/:userId", (req, res) => {
  try {
    const account = db.prepare("SELECT * FROM points_accounts WHERE userId = ?").get(req.params.userId)
      || { userId: req.params.userId, balance: 0, totalEarned: 0, totalUsed: 0 }
    const ledgers = db.prepare("SELECT * FROM points_ledgers WHERE userId = ? ORDER BY createdAt DESC").all(req.params.userId)
    res.json(ok({ ...account, ledgers }))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// POST /api/v1/points/transact
app.post("/api/v1/points/transact", (req, res) => {
  try {
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
    const now = new Date().toISOString()
    db.prepare("UPDATE points_accounts SET balance=?, totalEarned=?, totalUsed=?, updatedAt=? WHERE userId=?")
      .run(
        newBalance,
        account.totalEarned + (delta > 0 ? delta : 0),
        account.totalUsed + (delta < 0 ? -delta : 0),
        now,
        userId,
      )
    const ledgerId = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    db.prepare(
      "INSERT INTO points_ledgers (id, userId, direction, delta, sourceCode, sourceLabel, refId, balanceAfter, createdAt) VALUES (?,?,?,?,?,?,?,?,?)",
    ).run(ledgerId, userId, rule.direction, Math.abs(delta), sourceCode, rule.label, refId || null, newBalance, now)
    const updated = db.prepare("SELECT * FROM points_accounts WHERE userId = ?").get(userId)
    res.json(ok(updated, `积分${delta > 0 ? "+" : ""}${delta}`))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ====== Error handler ======
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json(fail(err.message))
})

// ====== Start ======
app.listen(PORT, () => {
  console.log(`🏛️  丽江古城游 API running at http://localhost:${PORT}`)
  const count = db.prepare("SELECT COUNT(*) as c FROM convenience_orders").get().c
  console.log(`📊 ${count} orders in database`)
})