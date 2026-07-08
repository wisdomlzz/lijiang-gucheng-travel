import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"

const router = Router()

// GET /api/v1/points/account/:userId
router.get("/account/:userId", (req, res) => {
  try {
    const account = db.prepare("SELECT * FROM points_accounts WHERE userId = ?").get(req.params.userId)
      || { userId: req.params.userId, balance: 0, totalEarned: 0, totalUsed: 0 }
    const ledgers = db.prepare("SELECT * FROM points_ledgers WHERE userId = ? ORDER BY createdAt DESC").all(req.params.userId)
    res.json(ok({ ...account, ledgers }))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// POST /api/v1/points/transact
router.post("/transact", (req, res) => {
  try {
    const { userId, sourceCode, refId, customDelta } = req.body
    const rule = db.prepare("SELECT * FROM points_rules WHERE code = ? AND enabled = 1").get(sourceCode)
    if (!rule) return res.json(fail(`积分规则 ${sourceCode} 不存在或已停用`))
    let delta = customDelta ?? rule.points
    if (rule.direction === "OUT") delta = -Math.abs(delta)
    else delta = Math.abs(delta)
    let account = db.prepare("SELECT * FROM points_accounts WHERE userId = ?").get(userId)
    if (!account) {
      db.prepare("INSERT INTO points_accounts (userId, balance, totalEarned, totalUsed) VALUES (?, 0, 0, 0)").run(userId)
      account = { userId, balance: 0, totalEarned: 0, totalUsed: 0 }
    }
    const newBalance = account.balance + delta
    if (newBalance < 0) return res.json(fail("积分余额不足"))
    const now = new Date().toISOString()
    db.prepare("UPDATE points_accounts SET balance=?, totalEarned=?, totalUsed=?, updatedAt=? WHERE userId=?")
      .run(
        newBalance,
        account.totalEarned + (delta > 0 ? delta : 0),
        account.totalUsed + (delta < 0 ? -delta : 0),
        now,
        userId,
      )
    const ledgerId = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    db.prepare(
      "INSERT INTO points_ledgers (id, userId, direction, delta, sourceCode, sourceLabel, refId, balanceAfter, createdAt) VALUES (?,?,?,?,?,?,?,?,?)",
    ).run(ledgerId, userId, rule.direction, Math.abs(delta), sourceCode, rule.label, refId || null, newBalance, now)
    const updated = db.prepare("SELECT * FROM points_accounts WHERE userId = ?").get(userId)
    res.json(ok(updated, `积分${delta > 0 ? "+" : ""}${delta}`))
  } catch (e) {
    res.json(fail(e.message))
  }
})

export default router