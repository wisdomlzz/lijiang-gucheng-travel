import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes } from "./crud.js"

const router = Router()

// GET /threshold (特殊路由在前)
router.get("/threshold", (req, res) => {
  let row = db.prepare("SELECT * FROM trust_thresholds WHERE id = 1").get()
  if (!row) {
    db.prepare("INSERT INTO trust_thresholds (id, defaultScore, delinquentThreshold, autoRecover, recoverScore) VALUES (1, 100, 60, 1, 70)").run()
    row = db.prepare("SELECT * FROM trust_thresholds WHERE id = 1").get()
  }
  res.json(ok({ ...row, autoRecover: !!row.autoRecover }))
})

// POST /threshold (对齐前端,用 POST 不用 PUT)
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

// /rules 子路由
router.use("/rules", crudRoutes("score_rules"))

// trust_scores CRUD(主键是 staffId)
router.use("/", crudRoutes("trust_scores", { pkField: "staffId" }))

export default router