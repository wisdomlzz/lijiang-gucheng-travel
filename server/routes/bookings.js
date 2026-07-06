import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes, deserializeRow } from "./crud.js"

const router = Router()

// POST /check (特殊路由在前)
router.post("/check", (req, res) => {
  try {
    const { code } = req.body
    const booking = db.prepare("SELECT * FROM bookings WHERE code = ?").get(code)
    if (!booking) return res.json(fail("核销码无效"))
    if (booking.status === "checked") return res.json(fail("该预约已核销"))
    if (booking.status === "cancelled") return res.json(fail("该预约已取消"))
    const now = new Date().toISOString()
    db.prepare("UPDATE bookings SET status=?, checkedAt=?, updatedAt=? WHERE id=?")
      .run("checked", now, now, booking.id)
    const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(booking.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

router.use("/", crudRoutes("bookings", { filters: ["userId", "courtyardId", "status"] }))

export default router