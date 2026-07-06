import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"

// JSON 数组/对象字段集合 — 对照 schema.sql 里所有 DEFAULT '[]' 或 DEFAULT '{}' 的字段
const JSON_FIELDS = new Set([
  "images", "completionPhotos", "serviceTypes", "zoneIds", "tags", "stations",
  "body", "spots", "spotNames", "contentBlocks", "gallery", "meta",
  "scoreHistory", "reviewHistory", "credentialImages", "fields", "roles", "platform", "data",
])

export function deserializeRow(row) {
  if (!row) return null
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    out[k] = (JSON_FIELDS.has(k) && typeof v === "string") ? JSON.parse(v) : v
  }
  return out
}

function serializeInput(data) {
  const out = { ...data }
  for (const k of Object.keys(out)) {
    if (JSON_FIELDS.has(k) && typeof out[k] !== "string") {
      out[k] = JSON.stringify(out[k])
    }
  }
  return out
}

export function crudRoutes(table, options = {}) {
  const router = Router()
  const { searchField, filters = [], sortDefault = "createdAt" } = options

  // GET /
  router.get("/", (req, res) => {
    try {
      let sql = `SELECT * FROM "${table}"`
      const where = []
      const params = []
      for (const f of filters) {
        if (req.query[f] !== undefined && req.query[f] !== "") {
          where.push(`"${f}" = ?`)
          params.push(req.query[f])
        }
      }
      if (searchField && req.query.search) {
        where.push(`"${searchField}" LIKE ?`)
        params.push(`%${req.query.search}%`)
      }
      if (where.length) sql += " WHERE " + where.join(" AND ")

      const sort = (req.query.sort || sortDefault).replace(/^-/, "")
      const dir = (req.query.sort || sortDefault).startsWith("-") ? "DESC" : "ASC"
      sql += ` ORDER BY "${sort}" ${dir}`

      const rows = db.prepare(sql).all(...params)
      const items = rows.map(deserializeRow)
      const page = parseInt(req.query.page) || 1
      const pageSize = parseInt(req.query.pageSize) || 200
      const start = (page - 1) * pageSize
      res.json(ok({
        items: items.slice(start, start + pageSize),
        total: items.length,
        page,
        pageSize,
        totalPages: Math.ceil(items.length / pageSize) || 1,
      }))
    } catch (e) {
      res.json(fail(e.message))
    }
  })

  // GET /:id
  router.get("/:id", (req, res) => {
    try {
      const row = db.prepare(`SELECT * FROM "${table}" WHERE id = ?`).get(req.params.id)
      if (!row) return res.json(fail("Not found", 404))
      res.json(ok(deserializeRow(row)))
    } catch (e) {
      res.json(fail(e.message))
    }
  })

  // POST /
  router.post("/", (req, res) => {
    try {
      const { id: _id, createdAt: _c, updatedAt: _u, ...data } = req.body
      const item = serializeInput(data)
      if (!item.id) item.id = `${table}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const now = new Date().toISOString()
      item.createdAt = now
      item.updatedAt = now
      const cols = Object.keys(item)
      const quotedCols = cols.map(c => `"${c}"`)
      const placeholders = cols.map(() => "?").join(", ")
      db.prepare(`INSERT INTO "${table}" (${quotedCols.join(", ")}) VALUES (${placeholders})`)
        .run(...cols.map(c => item[c]))
      const row = db.prepare(`SELECT * FROM "${table}" WHERE id = ?`).get(item.id)
      res.json(ok(deserializeRow(row)))
    } catch (e) {
      res.json(fail(e.message))
    }
  })

  // PATCH /:id
  router.patch("/:id", (req, res) => {
    try {
      const { id: _id, createdAt: _c, ...data } = req.body
      const item = serializeInput(data)
      item.updatedAt = new Date().toISOString()
      const cols = Object.keys(item)
      const setClause = cols.map(c => `"${c}" = ?`).join(", ")
      const result = db.prepare(`UPDATE "${table}" SET ${setClause} WHERE id = ?`)
        .run(...cols.map(c => item[c]), req.params.id)
      if (result.changes === 0) return res.json(fail("Not found", 404))
      const row = db.prepare(`SELECT * FROM "${table}" WHERE id = ?`).get(req.params.id)
      res.json(ok(deserializeRow(row)))
    } catch (e) {
      res.json(fail(e.message))
    }
  })

  // DELETE /:id
  router.delete("/:id", (req, res) => {
    try {
      db.prepare(`DELETE FROM "${table}" WHERE id = ?`).run(req.params.id)
      res.json(ok(null, "Deleted"))
    } catch (e) {
      res.json(fail(e.message))
    }
  })

  return router
}