import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes, deserializeRow } from "./crud.js"
import { transition, META_ACTIONS, APPROVE_CANCEL } from "../logic/transitions.js"
import { pickStaff, lookupStaff } from "../logic/dispatch.js"

const router = Router()

// POST /:id/dispatch
// 支持从 S10/A10/S90 直接派单,内部处理状态流转:
//   S10 → dispatch → A10 → assign → A20
//   A10 → assign → A20
//   S90 → reDispatch → A10 → assign → A20
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

    // 派单流转:根据当前状态决定 next
    // S10 → A10 → A20 (需要两步),用一次直接跳到 A20
    // A10 → A20 (assign)
    // S90 → A10(reDispatch) → A20
    // A20 → A20 (重新指派,不变)
    let next
    if (order.status === "S10") next = "A20"
    else if (order.status === "A10") next = "A20"
    else if (order.status === "A20") next = "A20"
    else if (order.status === "S90") next = "A20"
    else return res.json(fail(`当前状态 ${order.status} 不可派单`))

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
    const now = new Date().toISOString()

    // ── 元动作:改 cancelRequested 但不改 status ──
    if (META_ACTIONS.has(action)) {
      const cancelRequested = action === "requestCancel" ? 1 : 0
      db.prepare("UPDATE convenience_orders SET cancelRequested=?, updatedAt=? WHERE id=?")
        .run(cancelRequested, now, order.id)
      const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
      return res.json(ok(deserializeRow(updated)))
    }

    // ── approveCancel:清 cancelRequested + 状态转 S50 ──
    if (action === APPROVE_CANCEL) {
      db.prepare("UPDATE convenience_orders SET status=?, cancelRequested=0, updatedAt=? WHERE id=?")
        .run("S50", now, order.id)
      const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
      return res.json(ok(deserializeRow(updated)))
    }

    // ── 常规状态流转 ──
    const next = transition(order.status, action)
    if (!next) return res.json(fail(`状态 ${order.status} 不支持动作 ${action}`))
    const jsonFields = ["images", "completionPhotos"]
    const serialized = { status: next, ...extraFields }
    // 完成态自动填 completedAt(S40)
    if (next === "S40" && !serialized.completedAt) {
      serialized.completedAt = now
    }
    // 评价自动填 ratedAt(如果 body 传了 rating 但没 ratedAt)
    if (serialized.rating !== undefined && !serialized.ratedAt) {
      serialized.ratedAt = now
    }
    for (const k of Object.keys(serialized)) {
      if (jsonFields.includes(k) && typeof serialized[k] !== "string") {
        serialized[k] = JSON.stringify(serialized[k])
      }
    }
    serialized.updatedAt = now
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