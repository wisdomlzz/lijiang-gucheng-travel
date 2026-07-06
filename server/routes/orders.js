import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes, deserializeRow } from "./crud.js"
import { transition } from "../logic/transitions.js"
import { pickStaff, lookupStaff } from "../logic/dispatch.js"

const router = Router()

// POST /:id/dispatch
router.post("/:id/dispatch", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    const { mode, staffId } = req.body
    let staff = null
    if (mode === "manual" && staffId) {
      staff = db.prepare("SELECT * FROM staff WHERE id = ?").get(staffId)
      if (staff) {
        staff.serviceTypes = JSON.parse(staff.serviceTypes || "[]")
        staff.zoneIds = JSON.parse(staff.zoneIds || "[]")
      }
    } else {
      const allStaff = db.prepare("SELECT * FROM staff").all().map(s => ({
        ...s,
        serviceTypes: JSON.parse(s.serviceTypes || "[]"),
        zoneIds: JSON.parse(s.zoneIds || "[]"),
      }))
      const zones = db.prepare("SELECT * FROM zones").all().map(z => ({
        ...z,
        stations: JSON.parse(z.stations || "[]"),
      }))
      staff = pickStaff(allStaff, order.serviceType, order.lat, order.lng, zones)
    }
    if (!staff) return res.json(fail("无可用服务人员"))
    const next = transition(order.status, "assign") || transition(order.status, "reDispatch")
    if (!next) return res.json(fail(`当前状态 ${order.status} 不可派单`))
    const now = new Date().toISOString()
    db.prepare("UPDATE convenience_orders SET status=?, staffId=?, staffName=?, staffPhone=?, updatedAt=? WHERE id=?")
      .run(next, staff.id, staff.name, staff.phone, now, order.id)
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// POST /:id/transition
router.post("/:id/transition", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    const { action, ...extraFields } = req.body
    const next = transition(order.status, action)
    if (!next) return res.json(fail(`状态 ${order.status} 不支持动作 ${action}`))
    const jsonFields = ["images", "completionPhotos"]
    const serialized = { status: next, ...extraFields }
    for (const k of Object.keys(serialized)) {
      if (jsonFields.includes(k) && typeof serialized[k] !== "string") {
        serialized[k] = JSON.stringify(serialized[k])
      }
    }
    serialized.updatedAt = new Date().toISOString()
    const cols = Object.keys(serialized)
    const setClause = cols.map(c => `"${c}" = ?`).join(", ")
    db.prepare(`UPDATE convenience_orders SET ${setClause} WHERE id = ?`)
      .run(...cols.map(c => serialized[c]), order.id)
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// CRUD
router.use("/", crudRoutes("convenience_orders", {
  filters: ["status", "serviceType", "userId", "staffId"],
  searchField: "address",
}))

export default router