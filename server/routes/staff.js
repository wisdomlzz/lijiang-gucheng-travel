import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes, deserializeRow } from "./crud.js"

const router = Router()

// PATCH /:id/disable — 禁用 staff,先检查进行中订单
// 若有进行中订单且未指定 force,返回订单列表让前端确认
router.patch("/:id/disable", (req, res) => {
  try {
    const staff = db.prepare("SELECT * FROM staff WHERE id = ?").get(req.params.id)
    if (!staff) return res.json(fail("staff 不存在", 404))

    // 进行中订单:A20/A30/A35/A40/S48/S55
    const activeOrders = db
      .prepare(
        `SELECT * FROM convenience_orders WHERE staffId=? AND status IN ('A20','A30','A35','A40','S48','S55')`,
      )
      .all(staff.id)

    if (activeOrders.length > 0 && !req.body.force) {
      return res.json(
        ok({
          needConfirm: true,
          activeOrders: activeOrders.map(deserializeRow),
          staffId: staff.id,
          staffName: staff.name,
        }),
      )
    }

    // 真禁用
    const now = new Date().toISOString()
    db.prepare("UPDATE staff SET enabled=0, updatedAt=? WHERE id=?").run(now, staff.id)
    res.json(ok({ disabled: true, activeOrdersCount: activeOrders.length }))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// PATCH /:id/enable — 启用
router.patch("/:id/enable", (req, res) => {
  try {
    const now = new Date().toISOString()
    const info = db.prepare("UPDATE staff SET enabled=1, updatedAt=? WHERE id=?").run(now, req.params.id)
    if (info.changes === 0) return res.json(fail("staff 不存在", 404))
    const staff = db.prepare("SELECT * FROM staff WHERE id = ?").get(req.params.id)
    res.json(ok(deserializeRow(staff)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

router.use("/", crudRoutes("staff", { filters: ["status", "enabled", "applyStatus"] }))

export default router