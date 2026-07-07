import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes, deserializeRow } from "./crud.js"

const router = Router()

// POST /:id/resolve — 投诉成立,更新 staff 统计(不改 goodRate,产品文档明确)
router.post("/:id/resolve", (req, res) => {
  try {
    const { result, penaltyScoreDelta } = req.body
    const now = new Date().toISOString()
    const info = db.prepare("UPDATE complaints SET status=?, result=?, handledAt=?, updatedAt=? WHERE id=?")
      .run("C40", result, now, now, req.params.id)
    if (info.changes === 0) return res.json(fail("投诉不存在", 404))
    const updated = db.prepare("SELECT * FROM complaints WHERE id = ?").get(req.params.id)

    // 找到关联 staff:通过 orderId → order.staffId
    if (updated.orderId) {
      const order = db.prepare("SELECT staffId FROM convenience_orders WHERE id = ?").get(updated.orderId)
      if (order?.staffId) {
        const delta = typeof penaltyScoreDelta === "number" ? penaltyScoreDelta : 3 // 默认扣 3 分
        db.prepare(
          "UPDATE staff SET complaintCount=complaintCount+1, penaltyScore=penaltyScore+?, updatedAt=? WHERE id=?",
        ).run(delta, now, order.staffId)
      }
    }

    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// POST /:id/reject
router.post("/:id/reject", (req, res) => {
  try {
    const { reason } = req.body
    const now = new Date().toISOString()
    const info = db.prepare("UPDATE complaints SET status=?, result=?, handledAt=?, updatedAt=? WHERE id=?")
      .run("CR", reason, now, now, req.params.id)
    if (info.changes === 0) return res.json(fail("投诉不存在", 404))
    const updated = db.prepare("SELECT * FROM complaints WHERE id = ?").get(req.params.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

router.use("/", crudRoutes("complaints", { filters: ["status", "userId", "type"] }))

export default router