import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes, deserializeRow } from "./crud.js"

const router = Router()

// POST /:id/resolve
router.post("/:id/resolve", (req, res) => {
  try {
    const { result } = req.body
    const now = new Date().toISOString()
    const info = db.prepare("UPDATE complaints SET status=?, result=?, handledAt=?, updatedAt=? WHERE id=?")
      .run("C40", result, now, now, req.params.id)
    if (info.changes === 0) return res.json(fail("投诉不存在", 404))
    const updated = db.prepare("SELECT * FROM complaints WHERE id = ?").get(req.params.id)
    // images is a JSON field, need to parse it
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