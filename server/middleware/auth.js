import jwt from "jsonwebtoken"
import { fail } from "./response.js"

const JWT_SECRET = process.env.JWT_SECRET || "lijiang-demo-secret"
const JWT_EXPIRES = "7d"

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(req, res, next) {
  const auth = req.headers.authorization
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) return res.json(fail("未登录", 401))
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch {
    return res.json(fail("token 无效或已过期", 401))
  }
}