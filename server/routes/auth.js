import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { signToken, verifyToken } from "../middleware/auth.js"

const router = Router()

// JSON 字段反序列化
function parseUser(row) {
  if (!row) return null
  return {
    ...row,
    roles: JSON.parse(row.roles || "[]"),
    platform: JSON.parse(row.platform || "[]"),
  }
}

// POST /api/v1/auth/login
router.post("/login", (req, res) => {
  const { phone } = req.body
  if (!phone) return res.json(fail("请输入手机号"))
  const row = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone)
  if (!row) return res.json(fail("用户不存在"))
  const user = parseUser(row)
  const token = signToken(user.id)
  res.json(ok({ token, user }))
})

// GET /api/v1/auth/me
router.get("/me", verifyToken, (req, res) => {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId)
  if (!row) return res.json(fail("用户不存在", 401))
  res.json(ok(parseUser(row)))
})

export default router