import express from "express"
import cors from "cors"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import db from "./db/connection.js"
import "./db/migrate.js"
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
import notificationsRoutes from "./routes/notifications.js"
import pointsRoutes from "./routes/points.js"
import { errorHandler, AppError } from "./middleware/errorHandler.js"

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

// ====== Notifications ======
app.use("/api/v1/notifications", notificationsRoutes)

// ====== Announcements + Flow Warnings ======
app.use("/api/v1/announcements", crudRoutes("announcements"))
app.use("/api/v1/flow-warnings", crudRoutes("flow_warnings"))
app.use("/api/v1/flow-areas", crudRoutes("flow_areas"))

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
app.use("/api/v1/points", pointsRoutes)

// ====== Error handler ======
app.use(errorHandler)

// ====== Start ======
app.listen(PORT, () => {
  console.log(`🏛️  丽江古城游 API running at http://localhost:${PORT}`)
  const count = db.prepare("SELECT COUNT(*) as c FROM convenience_orders").get().c
  console.log(`📊 ${count} orders in database`)
})