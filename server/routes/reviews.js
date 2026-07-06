import { Router } from "express"
import db from "../db/connection.js"
import { ok } from "../middleware/response.js"
import { crudRoutes } from "./crud.js"

const router = Router()

// GET /stats (特殊路由在前)
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