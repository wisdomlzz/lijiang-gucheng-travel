import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes, deserializeRow } from "./crud.js"

const router = Router()

/** 内部辅助：创建一条通知并返回 id */
export function createNotification({ staffId, type, title, message, orderId }) {
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const now = new Date().toISOString()
  db.prepare(
    "INSERT INTO notifications (id, staffId, type, title, message, orderId, createdAt) VALUES (?,?,?,?,?,?,?)"
  ).run(id, staffId, type, title, message || null, orderId || null, now)
  return id
}

// ============================================================
// GET / — 按 staffId 查通知列表，分页，支持 isRead 筛选
// ============================================================
router.get("/", (req, res) => {
  try {
    const { staffId, isRead, page = "1", pageSize = "50" } = req.query
    if (!staffId) return res.json(fail("staffId 必填"))

    const conditions = ["staffId = ?"]
    const params = [staffId]
    if (isRead !== undefined && isRead !== "") {
      conditions.push("isRead = ?")
      params.push(isRead === "1" ? 1 : 0)
    }

    const where = conditions.join(" AND ")
    const offset = (Math.max(1, Number(page)) - 1) * Number(pageSize)
    const limit = Math.min(200, Math.max(1, Number(pageSize) || 50))

    const total = db.prepare(`SELECT COUNT(*) as c FROM notifications WHERE ${where}`).get(...params).c
    const items = db.prepare(
      `SELECT * FROM notifications WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset).map(deserializeRow)

    const unreadCount = db.prepare(
      "SELECT COUNT(*) as c FROM notifications WHERE staffId = ? AND isRead = 0"
    ).get(staffId).c

    res.json(ok({ items, total, page: Number(page), pageSize: limit, unreadCount }))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ============================================================
// POST /read-all — 全部已读
// ============================================================
router.post("/read-all", (req, res) => {
  try {
    const { staffId } = req.body
    if (!staffId) return res.json(fail("staffId 必填"))
    const now = new Date().toISOString()
    db.prepare("UPDATE notifications SET isRead = 1, updatedAt = ? WHERE staffId = ? AND isRead = 0")
      .run(now, staffId)
    res.json(ok({ updated: true }))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ============================================================
// POST /:id/read — 单条已读
// ============================================================
router.post("/:id/read", (req, res) => {
  try {
    const n = db.prepare("SELECT * FROM notifications WHERE id = ?").get(req.params.id)
    if (!n) return res.json(fail("通知不存在", 404))
    const now = new Date().toISOString()
    db.prepare("UPDATE notifications SET isRead = 1, updatedAt = ? WHERE id = ?").run(now, req.params.id)
    res.json(ok({ updated: true }))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ============================================================
// DELETE /:id — 单条删除
// ============================================================
router.delete("/:id", (req, res) => {
  try {
    const n = db.prepare("SELECT * FROM notifications WHERE id = ?").get(req.params.id)
    if (!n) return res.json(fail("通知不存在", 404))
    db.prepare("DELETE FROM notifications WHERE id = ?").run(req.params.id)
    res.json(ok({ deleted: true }))
  } catch (e) {
    res.json(fail(e.message))
  }
})

export default router