import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"
import { crudRoutes, deserializeRow, logOperation } from "./crud.js"
import { transition, META_ACTIONS, APPROVE_CANCEL, STAFF_OWNERSHIP_ACTIONS } from "../logic/transitions.js"
import { pickStaff, lookupStaff } from "../logic/dispatch.js"
import { calcCancelFee } from "../logic/pricing.js"
import { createNotification } from "./notifications.js"

const router = Router()

// ============================================================
// 辅助:S40 完成时自动记账 + 触发副作用
// ============================================================
function onOrderCompleted(order) {
  // 生成 income_records
  if (order.priceQuote && order.staffId) {
    const incomeId = `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const isOnline = order.paymentMethod === "online"
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO income_records (id, orderId, staffId, staffName, serviceType, amount, payMethod, completedAt, createdAt) VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(
      incomeId,
      order.id,
      order.staffId,
      order.staffName || "",
      order.serviceType,
      order.priceQuote,
      order.paymentMethod || "online",
      now,
      now,
    )
    logOperation(order.id, "system", null, "autoRecordIncome", "S55", "S40", `自动记账 ¥${order.priceQuote}`)
  }
  // 设 reviewStatus = pending
  db.prepare("UPDATE convenience_orders SET reviewStatus='pending' WHERE id=?").run(order.id)
}

// ============================================================
// POST /:id/dispatch
// 支持从 S10/A10/A20/S90 派单,内部一步流转到 A20
// ============================================================
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

    let next
    if (["S10", "A10", "A20", "S90"].includes(order.status)) next = "A20"
    else return res.json(fail(`当前状态 ${order.status} 不可派单`))

    const now = new Date().toISOString()
    db.prepare(
      "UPDATE convenience_orders SET status=?, staffId=?, staffName=?, staffPhone=?, dispatchAttempts=dispatchAttempts+1, updatedAt=? WHERE id=?",
    ).run(next, staff.id, staff.name, staff.phone, now, order.id)
    db.prepare("UPDATE staff SET assignedOrders=assignedOrders+1, updatedAt=? WHERE id=?").run(now, staff.id)
    db.prepare(
      "INSERT INTO dispatch_logs (orderId, staffId, type, staffName, reason, timestamp) VALUES (?,?,?,?,?,?)",
    ).run(order.id, staff.id, mode === "manual" ? "manual" : "auto", staff.name, "派单", now)
    logOperation(order.id, mode === "manual" ? "admin" : "system", req.body.operatorId || null, "dispatch", order.status, next, `派单给 ${staff.name}`)
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    // 通知被派单的服务人员
    createNotification({
      staffId: staff.id,
      type: "new_order",
      title: `您有新的派单：${order.serviceType}`,
      message: `${order.note ? order.note + " · " : ""}${order.addressTo ? `${order.address} → ${order.addressTo}` : order.address}${order.refPrice ? ` · 参考价 ¥${order.refPrice}` : ""}`,
      orderId: order.id,
    })
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ============================================================
// POST /:id/arrive-checkin (元动作,不改状态)
// ============================================================
router.post("/:id/arrive-checkin", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "A30") return res.json(fail("仅 A30 状态可打卡"))
    const now = new Date().toISOString()
    db.prepare("UPDATE convenience_orders SET arrivedAt=?, updatedAt=? WHERE id=?").run(now, now, order.id)
    logOperation(order.id, "staff", req.body.staffId || order.staffId, "arriveCheckin", order.status, order.status, "到场打卡")
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ============================================================
// POST /:id/lock-payment (元动作,锁定支付方式)
// ============================================================
router.post("/:id/lock-payment", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "A35") return res.json(fail("仅 A35 状态可锁定支付方式"))
    if (order.paymentMethodLocked) return res.json(fail("支付方式已锁定,不可修改"))
    const { paymentMethod } = req.body
    if (!["online", "cash"].includes(paymentMethod)) return res.json(fail("支付方式无效"))
    const now = new Date().toISOString()
    db.prepare(
      "UPDATE convenience_orders SET paymentMethod=?, paymentMethodLocked=1, updatedAt=? WHERE id=?",
    ).run(paymentMethod, now, order.id)
    logOperation(order.id, "user", req.body.userId || order.userId, "lockPaymentMethod", order.status, order.status, `锁定支付方式: ${paymentMethod}`)
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ============================================================
// POST /:id/pay-online (C 端线上支付 → A40)
// ============================================================
router.post("/:id/pay-online", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    // 幂等:已是 A40 直接返回
    if (order.status === "A40") return res.json(ok(deserializeRow(order)))
    if (order.status !== "A35") return res.json(fail("当前状态不可支付"))
    if (!order.paymentMethodLocked) return res.json(fail("请先确认报价并选择支付方式"))
    if (order.paymentMethod !== "online") return res.json(fail("支付方式不匹配,该订单为现金支付"))
    const now = new Date().toISOString()
    db.prepare(
      "UPDATE convenience_orders SET status='A40', paidAmount=?, updatedAt=? WHERE id=?",
    ).run(order.priceQuote, now, order.id)
    const payId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    db.prepare(
      "INSERT INTO payment_records (id, orderId, paymentMethod, amount, status, paidAt, createdAt) VALUES (?,?,?,?,?,?,?)",
    ).run(payId, order.id, "online", order.priceQuote, "success", now, now)
    logOperation(order.id, "user", req.body.userId || order.userId, "payOnline", order.status, "A40", `线上支付 ¥${order.priceQuote}`)
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    // 通知服务人员线上收款
    if (order.staffId) {
      createNotification({
        staffId: order.staffId,
        type: "payment_received",
        title: `用户已付款 ¥${order.priceQuote}`,
        message: `${order.serviceType}订单 ${order.id} 线上支付已到账`,
        orderId: order.id,
      })
    }
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ============================================================
// POST /:id/confirm-cash (B 端确认现金收款 → A40)
// ============================================================
router.post("/:id/confirm-cash", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status === "A40") return res.json(ok(deserializeRow(order)))
    if (order.status !== "A35") return res.json(fail("当前状态不可确认收款"))
    if (!order.paymentMethodLocked) return res.json(fail("用户未确认支付方式"))
    if (order.paymentMethod !== "cash") return res.json(fail("支付方式不匹配,该订单为线上支付"))
    const now = new Date().toISOString()
    db.prepare(
      "UPDATE convenience_orders SET status='A40', paidAmount=?, updatedAt=? WHERE id=?",
    ).run(order.priceQuote, now, order.id)
    const payId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    db.prepare(
      "INSERT INTO payment_records (id, orderId, paymentMethod, amount, status, collectedByStaffId, paidAt, createdAt) VALUES (?,?,?,?,?,?,?,?)",
    ).run(payId, order.id, "cash", order.priceQuote, "success", req.body.staffId || order.staffId, now, now)
    logOperation(order.id, "staff", req.body.staffId || order.staffId, "confirmCash", order.status, "A40", `现金收款 ¥${order.priceQuote}`)
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    // 通知服务人员现金收款确认
    if (order.staffId) {
      createNotification({
        staffId: order.staffId,
        type: "payment_received",
        title: `现金收款确认 ¥${order.priceQuote}`,
        message: `${order.serviceType}订单 ${order.id} 现金已收款`,
        orderId: order.id,
      })
    }
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ============================================================
// POST /:id/rate (用户评价 → 生成 review 记录)
// ============================================================
router.post("/:id/rate", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "S40") return res.json(fail("仅已完成订单可评价"))
    if (order.reviewStatus === "done") return res.json(fail("已评价过,不可修改"))
    const { rating, content, images, userName } = req.body
    if (!rating || rating < 1 || rating > 5) return res.json(fail("评分 1-5"))
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const now = new Date().toISOString()
    db.prepare(
      "INSERT INTO reviews (id, orderId, serviceType, staffId, staffName, userId, userName, rating, content, images, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    ).run(
      reviewId,
      order.id,
      order.serviceType,
      order.staffId,
      order.staffName || "",
      order.userId,
      userName || "",
      rating,
      content || "",
      JSON.stringify(images || []),
      now,
      now,
    )
    db.prepare(
      "UPDATE convenience_orders SET rating=?, ratedAt=?, reviewStatus='done', updatedAt=? WHERE id=?",
    ).run(rating, now, now, order.id)
    logOperation(order.id, "user", req.body.userId || order.userId, "rate", order.status, order.status, `评价 ${rating} 星`)
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    // 通知服务人员评价
    if (order.staffId) {
      createNotification({
        staffId: order.staffId,
        type: "rating_received",
        title: `用户已评价 · ${rating} 星`,
        message: `${order.serviceType}订单 ${order.id} 用户已给出 ${rating} 星评价`,
        orderId: order.id,
      })
    }
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ============================================================
// POST /:id/reject-quote (用户拒绝报价 → S90)
// ============================================================
router.post("/:id/reject-quote", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "A35") return res.json(fail("仅 A35 状态可拒绝报价"))
    const now = new Date().toISOString()
    db.prepare(
      "UPDATE convenience_orders SET status='S90', beforeManualStatus=?, manualReason='quote_rejected', rejectQuoteReason=?, updatedAt=? WHERE id=?",
    ).run(order.status, req.body.reason || null, now, order.id)
    logOperation(order.id, "user", req.body.userId || order.userId, "rejectQuote", order.status, "S90", req.body.reason || "用户拒绝报价")
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ============================================================
// POST /:id/restore-quote (管理员协调后从 S90 恢复到 A35,重置 quotedAt)
// ============================================================
router.post("/:id/restore-quote", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    if (order.status !== "S90" || order.manualReason !== "quote_rejected") return res.json(fail("仅报价争议的 S90 可恢复"))
    const now = new Date().toISOString()
    db.prepare(
      "UPDATE convenience_orders SET status='A35', quotedAt=?, beforeManualStatus=NULL, manualReason=NULL, updatedAt=? WHERE id=?",
    ).run(now, now, order.id)
    logOperation(order.id, "admin", req.body.adminId || null, "restoreQuote", order.status, "A35", "协调成功,重新报价")
    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// ============================================================
// POST /:id/transition (通用状态流转)
// ============================================================
router.post("/:id/transition", (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(req.params.id)
    if (!order) return res.json(fail("订单不存在", 404))
    const { action, operatorId, operatorType, ...extraFields } = req.body
    const now = new Date().toISOString()

    // ── 人员归属校验：要求操作人是指派的服务人员 ──
    if (STAFF_OWNERSHIP_ACTIONS.has(action) && order.staffId) {
      if (operatorType === "staff" && operatorId && operatorId !== order.staffId) {
        return res.json(fail("您不是该订单的指派服务人员，无权操作"))
      }
    }

    // ── 元动作:改 cancelRequested 但不改 status ──
    if (META_ACTIONS.has(action)) {
      const cancelRequested = action === "requestCancel" ? 1 : 0
      db.prepare("UPDATE convenience_orders SET cancelRequested=?, updatedAt=? WHERE id=?")
        .run(cancelRequested, now, order.id)
      logOperation(order.id, "user", req.body.userId || null, action, order.status, order.status, action === "requestCancel" ? "申请取消" : "撤销取消申请")
      // 通知服务人员取消申请
      if (action === "requestCancel" && order.staffId) {
        createNotification({
          staffId: order.staffId,
          type: "order_cancel_request",
          title: `用户申请取消订单`,
          message: `${order.serviceType}订单 ${order.id} 用户申请了取消，请尽快处理`,
          orderId: order.id,
        })
      }
      const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
      return res.json(ok(deserializeRow(updated)))
    }

    // ── approveCancel:清 cancelRequested + 状态转 S50 ──
    if (action === APPROVE_CANCEL) {
      const { cancelFee: calculated } = calcCancelFee(order.status, order.priceQuote)
      const cancelFee = extraFields.cancelFee ?? calculated
      db.prepare("UPDATE convenience_orders SET status=?, cancelRequested=0, cancelFee=?, updatedAt=? WHERE id=?")
        .run("S50", cancelFee, now, order.id)
      logOperation(order.id, "admin", req.body.adminId || null, "approveCancel", order.status, "S50", `批准取消,扣费 ¥${cancelFee}`)
      // 通知服务人员取消已通过
      if (order.staffId) {
        createNotification({
          staffId: order.staffId,
          type: "cancel_approved",
          title: `取消申请已通过`,
          message: `${order.serviceType}订单 ${order.id} 取消已批准${cancelFee > 0 ? `，扣费 ¥${cancelFee}` : ""}`,
          orderId: order.id,
        })
      }
      const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
      return res.json(ok(deserializeRow(updated)))
    }

    // ── 常规状态流转 ──
    const next = transition(order.status, action)
    if (!next) return res.json(fail(`状态 ${order.status} 不支持动作 ${action}`))

    // ── 前置校验 ──
    if (action === "quote") {
      if (!order.arrivedAt) return res.json(fail("请先完成到场打卡再报价"))
      // 报价金额校验
      const minPrice = Number(db.prepare("SELECT configValue FROM system_configs WHERE configKey='quoteMinPrice'").get()?.configValue || 1)
      const maxPrice = Number(db.prepare("SELECT configValue FROM system_configs WHERE configKey='quoteMaxPrice'").get()?.configValue || 9999)
      const quoteAmount = Number(extraFields.priceQuote)
      if (!quoteAmount || quoteAmount < minPrice || quoteAmount > maxPrice) {
        return res.json(fail(`报价金额需在 ¥${minPrice}~¥${maxPrice} 之间`))
      }
      if (!extraFields.quotedAt) extraFields.quotedAt = now
    }

    // MVP 允许从 extraFields 更新的白名单列
    const ALLOWED_COLS = new Set([
      "priceQuote", "quotedAt", "arrivedAt", "paymentMethod", "paymentMethodLocked",
      "paidAmount", "completionPhotos", "paymentProof", "completedAt",
      "arbitrationRemark", "rejectReason", "rejectQuoteReason",
      "beforeManualStatus", "manualReason", "cancelFee", "images", "note",
    ])
    const jsonFields = ["images", "completionPhotos"]
    const serialized = { status: next }
    for (const [k, v] of Object.entries(extraFields)) {
      if (ALLOWED_COLS.has(k)) serialized[k] = v
    }

    // 完成态自动填 completedAt(S40)
    if (next === "S40" && !serialized.completedAt) {
      serialized.completedAt = now
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

    // ── 副作用:acceptOrder → staff 计数维护 ──
    if (action === "accept" && next === "A30" && order.staffId) {
      db.prepare("UPDATE staff SET assignedOrders=MAX(0,assignedOrders-1), todayOrders=todayOrders+1, updatedAt=? WHERE id=?")
        .run(now, order.staffId)
    }
    // ── 副作用:reject → staff 计数维护 + dispatch_logs ──
    if (action === "reject" && next === "A10" && order.staffId) {
      db.prepare("UPDATE staff SET assignedOrders=MAX(0,assignedOrders-1), updatedAt=? WHERE id=?").run(now, order.staffId)
    }
    // ── 副作用:forceCancel → S50 → 自动计算扣费 ──
    if (next === "S50" && action !== APPROVE_CANCEL) {
      const { cancelFee: calculated } = calcCancelFee(order.status, order.priceQuote)
      db.prepare("UPDATE convenience_orders SET cancelFee=? WHERE id=?").run(calculated, order.id)
    }

    logOperation(order.id, req.body.operatorType || "user", req.body.operatorId || null, action, order.status, next, req.body.remark || null)

    // ── 副作用:S40 完成 → 自动记账 + 通知 ──
    if (next === "S40") {
      const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
      onOrderCompleted(updated)
      // 通知服务人员订单完成（用 updated 确保 staffId 是最新的）
      if (updated.staffId) {
        createNotification({
          staffId: updated.staffId,
          type: "order_completed",
          title: `订单已完成`,
          message: `${order.serviceType}订单 ${order.id} 已由用户确认完成${order.priceQuote ? `，收入 ¥${order.priceQuote}` : ""}`,
          orderId: order.id,
        })
      }
      const final = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
      return res.json(ok(deserializeRow(final)))
    }

    const updated = db.prepare("SELECT * FROM convenience_orders WHERE id = ?").get(order.id)
    res.json(ok(deserializeRow(updated)))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// GET /gmv-stats — 按日/周/月统计线上/现金 GMV
router.get("/gmv-stats", (req, res) => {
  try {
    const { period = "month" } = req.query // day | week | month
    let dateFilter = ""
    const now = new Date()
    if (period === "day") {
      const start = now.toISOString().slice(0, 10)
      dateFilter = `AND createdAt >= '${start}'`
    } else if (period === "week") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      dateFilter = `AND createdAt >= '${start}'`
    } else {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      dateFilter = `AND createdAt >= '${start}'`
    }
    const rows = db.prepare(`SELECT paymentMethod, COUNT(*) as orderCount, SUM(amount) as totalAmount FROM payment_records WHERE status='success' ${dateFilter} GROUP BY paymentMethod`).all()
    const online = rows.find(r => r.paymentMethod === "online") || { orderCount: 0, totalAmount: 0 }
    const cash = rows.find(r => r.paymentMethod === "cash") || { orderCount: 0, totalAmount: 0 }
    res.json(ok({ period, online: { count: online.orderCount, amount: online.totalAmount || 0 }, cash: { count: cash.orderCount, amount: cash.totalAmount || 0 }, total: { count: (online.orderCount||0) + (cash.orderCount||0), amount: (online.totalAmount||0) + (cash.totalAmount||0) } }))
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