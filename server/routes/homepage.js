import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes } from "./crud.js"

const router = Router()

// POST /banners/reorder (特殊路由在前,用 POST)
router.post("/banners/reorder", (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids)) return res.json(fail("ids must be an array"))
    const now = new Date().toISOString()
    const stmt = db.prepare('UPDATE banners SET "order" = ?, updatedAt = ? WHERE id = ?')
    const tx = db.transaction(() => ids.forEach((id, i) => stmt.run(i, now, id)))
    tx()
    res.json(ok(null, "排序已更新"))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// POST /grid-items/reorder
router.post("/grid-items/reorder", (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids)) return res.json(fail("ids must be an array"))
    const now = new Date().toISOString()
    const stmt = db.prepare('UPDATE grid_items SET "order" = ?, updatedAt = ? WHERE id = ?')
    const tx = db.transaction(() => ids.forEach((id, i) => stmt.run(i, now, id)))
    tx()
    res.json(ok(null, "排序已更新"))
  } catch (e) {
    res.json(fail(e.message))
  }
})

router.use("/banners", crudRoutes("banners", { filters: ["scene"] }))
router.use("/grid-items", crudRoutes("grid_items", { filters: ["visible"] }))

export default router