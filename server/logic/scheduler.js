// Server 端定时任务(MVP)—— 全部靠 setInterval,单机可用
// 7 个任务:
//   1. 自动派单(每 10 秒)
//   2. 接单超时(每分钟)
//   3. 支付超时(每分钟)
//   4. 自动确认完工(每小时)
//   5. 好评率统计(每 6 小时)
//   6. 今日订单数清零(每 6 小时)
//   7. 结算 T+7(每 6 小时)

import db from "../db/connection.js"
import { logOperation } from "../routes/crud.js"

function getConfig(key, defaultVal) {
  try {
    const row = db.prepare("SELECT configValue FROM system_configs WHERE configKey = ?").get(key)
    if (!row) return defaultVal
    const v = row.configValue
    try {
      return JSON.parse(v)
    } catch {
      return isNaN(Number(v)) ? v : Number(v)
    }
  } catch {
    return defaultVal
  }
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ============================================================
// 1. 自动派单 —— 每 10 秒扫 S10/A10 订单
// ============================================================
function autoDispatch() {
  try {
    const orders = db
      .prepare("SELECT * FROM convenience_orders WHERE status IN ('S10','A10') ORDER BY createdAt ASC LIMIT 20")
      .all()
    if (orders.length === 0) return

    const retryLimit = getConfig("dispatchRetryTimes", 3)
    const dailyLimit = getConfig("dailyOrderLimit", 20)

    // 派单失败超限的 → S90
    for (const order of orders) {
      if ((order.dispatchAttempts ?? 0) >= retryLimit) {
        const now = new Date().toISOString()
        db.prepare(
          "UPDATE convenience_orders SET status='S90', beforeManualStatus=?, manualReason='dispatch_failed', updatedAt=? WHERE id=?",
        ).run(order.status, now, order.id)
        logOperation(order.id, "system", null, "autoFail", order.status, "S90", `派单 ${order.dispatchAttempts} 次失败`)
        continue
      }

      // 候选池:enabled + 在线 + 服务类型匹配 + 今日单数未超 + 未接堆积未超
      const allStaff = db
        .prepare("SELECT * FROM staff WHERE enabled=1 AND status='online' AND (applyStatus IS NULL OR applyStatus='approved')")
        .all()
        .map(s => ({
          ...s,
          serviceTypes: JSON.parse(s.serviceTypes || "[]"),
          zoneIds: JSON.parse(s.zoneIds || "[]"),
        }))

      const candidates = allStaff.filter(
        s =>
          s.serviceTypes.includes(order.serviceType) &&
          (s.todayOrders ?? 0) < dailyLimit &&
          (s.assignedOrders ?? 0) < 3,
      )

      if (candidates.length === 0) {
        // 无候选,attempts++,进入下一轮
        const now = new Date().toISOString()
        db.prepare(
          "UPDATE convenience_orders SET dispatchAttempts=dispatchAttempts+1, status='A10', updatedAt=? WHERE id=?",
        ).run(now, order.id)
        continue
      }

      // 排序:todayOrders 升序 → 距离升序 → goodRate 降序
      candidates.sort((a, b) => {
        const ta = a.todayOrders ?? 0
        const tb = b.todayOrders ?? 0
        if (ta !== tb) return ta - tb
        const dA = a.lat != null && order.lat != null ? haversine(a.lat, a.lng, order.lat, order.lng) : 999
        const dB = b.lat != null && order.lat != null ? haversine(b.lat, b.lng, order.lat, order.lng) : 999
        if (dA !== dB) return dA - dB
        return (b.goodRate ?? 1) - (a.goodRate ?? 1)
      })

      const staff = candidates[0]
      const now = new Date().toISOString()
      db.prepare(
        "UPDATE convenience_orders SET status='A20', staffId=?, staffName=?, staffPhone=?, dispatchAttempts=dispatchAttempts+1, updatedAt=? WHERE id=?",
      ).run(staff.id, staff.name, staff.phone, now, order.id)
      db.prepare("UPDATE staff SET assignedOrders=assignedOrders+1, updatedAt=? WHERE id=?").run(now, staff.id)
      db.prepare(
        "INSERT INTO dispatch_logs (orderId, staffId, type, staffName, reason, timestamp) VALUES (?,?,?,?,?,?)",
      ).run(order.id, staff.id, "auto", staff.name, "定时派单", now)
      logOperation(order.id, "system", null, "autoDispatch", order.status, "A20", `派单给 ${staff.name}`)
    }
  } catch (e) {
    console.error("[scheduler] autoDispatch error:", e.message)
  }
}

// ============================================================
// 2. 接单超时 —— 每分钟扫 A20 超 acceptTimeoutMinutes 未接
// ============================================================
function acceptTimeout() {
  try {
    const min = getConfig("acceptTimeoutMinutes", 5)
    const cutoff = new Date(Date.now() - min * 60 * 1000).toISOString()
    const orders = db
      .prepare("SELECT * FROM convenience_orders WHERE status='A20' AND updatedAt < ?")
      .all(cutoff)
    for (const order of orders) {
      const now = new Date().toISOString()
      db.prepare(
        "UPDATE convenience_orders SET status='A10', staffId=NULL, staffName=NULL, staffPhone=NULL, updatedAt=? WHERE id=?",
      ).run(now, order.id)
      if (order.staffId) {
        db.prepare("UPDATE staff SET assignedOrders=MAX(0,assignedOrders-1) WHERE id=?").run(order.staffId)
      }
      logOperation(order.id, "system", null, "acceptTimeout", order.status, "A10", `接单超时 ${min} 分钟`)
    }
  } catch (e) {
    console.error("[scheduler] acceptTimeout error:", e.message)
  }
}

// ============================================================
// 3. 支付超时 —— 每分钟扫 A35 且 quotedAt 超 payTimeoutMinutes
// ============================================================
function payTimeout() {
  try {
    const min = getConfig("payTimeoutMinutes", 30)
    const cutoff = new Date(Date.now() - min * 60 * 1000).toISOString()
    const orders = db
      .prepare("SELECT * FROM convenience_orders WHERE status='A35' AND quotedAt IS NOT NULL AND quotedAt < ?")
      .all(cutoff)
    for (const order of orders) {
      const now = new Date().toISOString()
      db.prepare(
        "UPDATE convenience_orders SET status='S90', beforeManualStatus=?, manualReason='pay_timeout', updatedAt=? WHERE id=?",
      ).run(order.status, now, order.id)
      logOperation(order.id, "system", null, "payTimeout", order.status, "S90", `支付超时 ${min} 分钟`)
    }
  } catch (e) {
    console.error("[scheduler] payTimeout error:", e.message)
  }
}

// ============================================================
// 4. 自动确认完工 —— 每小时扫 S55 超 autoConfirmHours
// ============================================================
function autoConfirm() {
  try {
    const hours = getConfig("autoConfirmHours", 24)
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    const orders = db
      .prepare("SELECT * FROM convenience_orders WHERE status='S55' AND updatedAt < ?")
      .all(cutoff)
    for (const order of orders) {
      const now = new Date().toISOString()
      db.prepare(
        "UPDATE convenience_orders SET status='S40', completedAt=?, reviewStatus='pending', updatedAt=? WHERE id=?",
      ).run(now, now, order.id)
      // 自动记账
      if (order.priceQuote && order.staffId) {
        const incomeId = `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        db.prepare(
          "INSERT INTO income_records (id, orderId, staffId, staffName, serviceType, amount, payMethod, completedAt, createdAt) VALUES (?,?,?,?,?,?,?,?,?)",
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
      }
      logOperation(order.id, "system", null, "autoConfirm", order.status, "S40", `自动确认 ${hours} 小时`)
    }
  } catch (e) {
    console.error("[scheduler] autoConfirm error:", e.message)
  }
}

// ============================================================
// 5. 好评率统计 —— 每 6 小时基于 reviews 重算
// ============================================================
function recalcGoodRate() {
  try {
    const staffs = db.prepare("SELECT id FROM staff").all()
    for (const s of staffs) {
      const total = db
        .prepare("SELECT COUNT(*) as c FROM reviews WHERE staffId=? AND (isDeleted IS NULL OR isDeleted=0)")
        .get(s.id).c
      const good = db
        .prepare("SELECT COUNT(*) as c FROM reviews WHERE staffId=? AND (isDeleted IS NULL OR isDeleted=0) AND rating>=4")
        .get(s.id).c
      const rate = total === 0 ? 1.0 : good / total
      db.prepare("UPDATE staff SET goodRate=? WHERE id=?").run(rate, s.id)
    }
  } catch (e) {
    console.error("[scheduler] recalcGoodRate error:", e.message)
  }
}

// ============================================================
// 6. 今日订单数清零 —— 每 6 小时(简化,MVP 不做精确凌晨)
// ============================================================
let lastResetDate = null
function resetTodayOrders() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    if (lastResetDate === today) return
    // 只在跨天时清零
    if (lastResetDate !== null) {
      db.prepare("UPDATE staff SET todayOrders=0").run()
    }
    lastResetDate = today
  } catch (e) {
    console.error("[scheduler] resetTodayOrders error:", e.message)
  }
}

// ============================================================
// 7. 结算 T+7 —— 每 6 小时把 pending 超 N 天的 → settled + balance
// ============================================================
function settleT7() {
  try {
    const days = getConfig("settlementTDays", 7)
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    // MVP: income_records 目前 schema 没有 settlementStatus 字段,这里做保守实现:
    //   1. 只对 online 支付的做结算
    //   2. 用 createdAt < cutoff 且未在结算标记里的记录
    // 为兼容当前 schema, 这里仅做 balance 累加,不改 income_records
    // 未来 P1: income_records 加 settlementStatus 字段后再重构
    const pending = db
      .prepare("SELECT * FROM income_records WHERE payMethod='online' AND createdAt < ?")
      .all(cutoff)
    // 简化:跳过(避免重复累加),等 income_records 加字段后再启用
    // 目前保留函数体但不做实际累加
  } catch (e) {
    console.error("[scheduler] settleT7 error:", e.message)
  }
}

export function startScheduler() {
  // 首次立即跑一次
  resetTodayOrders()

  setInterval(autoDispatch, 10 * 1000) // 10 秒
  setInterval(acceptTimeout, 60 * 1000) // 1 分钟
  setInterval(payTimeout, 60 * 1000) // 1 分钟
  setInterval(autoConfirm, 60 * 60 * 1000) // 1 小时
  setInterval(recalcGoodRate, 6 * 60 * 60 * 1000) // 6 小时
  setInterval(resetTodayOrders, 6 * 60 * 60 * 1000) // 6 小时
  setInterval(settleT7, 6 * 60 * 60 * 1000) // 6 小时

  console.log("⏰ Scheduler started: 7 cron tasks (dispatch/timeout/autoconfirm/goodrate/reset/settle)")
}