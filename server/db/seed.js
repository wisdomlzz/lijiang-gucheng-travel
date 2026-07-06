// 种子数据 — 只在空库时灌一次
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import db from "./connection.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

// 读取 schema.sql
const SCHEMA_SQL = readFileSync(join(__dirname, "schema.sql"), "utf-8")

// JSON 字段集合(数组/对象存为 JSON 字符串)
const JSON_FIELDS = new Set([
  "images", "completionPhotos", "serviceTypes", "zoneIds", "tags", "stations",
  "body", "spots", "spotNames", "contentBlocks", "gallery", "meta",
  "scoreHistory", "reviewHistory", "credentialImages", "fields", "roles", "platform", "data",
])

// 通用 insert 函数:自动序列化 JSON 字段
function insertRow(table, row) {
  const cols = Object.keys(row)
  const serialized = {}
  for (const c of cols) {
    serialized[c] = JSON_FIELDS.has(c) && typeof row[c] !== "string"
      ? JSON.stringify(row[c])
      : row[c]
  }
  const placeholders = cols.map(() => "?").join(", ")
  // 给列名加引号(避免 order 等保留字问题)
  const quotedCols = cols.map(c => `"${c}"`).join(", ")
  db.prepare(`INSERT INTO ${table} (${quotedCols}) VALUES (${placeholders})`)
    .run(...cols.map(c => serialized[c]))
}

function insertMany(table, rows) {
  const tx = db.transaction(() => rows.forEach(r => insertRow(table, r)))
  tx()
}

export function seedIfNeeded() {
  // 检查 users 表是否为空
  let count
  try {
    count = db.prepare("SELECT COUNT(*) as c FROM users").get().c
  } catch {
    count = 0  // 表不存在
  }
  if (count > 0) {
    console.log("📊 DB 已有数据,跳过 seed")
    return false
  }

  // 空库:先建表
  console.log("🏗️  建表...")
  db.exec(SCHEMA_SQL)

  const now = new Date().toISOString()

  // ====== Users ======
  insertMany("users", [
    { id: "u_c_001", name: "张小游", phone: "13800001001", roles: ["tourist"], platform: ["c"] },
    { id: "u_c_s_001", name: "张老板", phone: "13800001002", roles: ["tourist", "supplier"], platform: ["c", "b", "desktop"] },
    { id: "u_b_001", name: "李师傅", phone: "13900002004", roles: ["service"], platform: ["b"] },
    { id: "u_admin", name: "管理员", phone: "18800003001", roles: ["platform_admin"], platform: ["b", "desktop"] },
  ])

  // ====== Staff ======
  insertMany("staff", [
    { id: "s1", supplierId: "sup_001", name: "李师傅", phone: "139****6666", enabled: 1, status: "busy", assignedOrders: 3, joinedAt: "2026-02-01", serviceTypes: ["行李搬运", "送货服务"], lat: 26.872, lng: 100.231 },
    { id: "s2", supplierId: "sup_001", name: "赵丹", phone: "139****6667", enabled: 1, status: "online", assignedOrders: 1, joinedAt: "2026-02-15", serviceTypes: ["行李搬运", "送货服务"], lat: 26.873, lng: 100.236 },
    { id: "s3", supplierId: "sup_001", name: "张环卫", phone: "139****6668", enabled: 1, status: "online", assignedOrders: 2, joinedAt: "2026-03-01", serviceTypes: ["生活垃圾清运", "建筑垃圾清运"], zoneIds: ["zone_core", "zone_south"], lat: 26.874, lng: 100.233 },
    { id: "s4", supplierId: "sup_001", name: "马师傅", phone: "139****6669", enabled: 1, status: "online", assignedOrders: 0, joinedAt: "2026-03-15", serviceTypes: ["生活垃圾清运", "建筑垃圾清运"], zoneIds: ["zone_inn", "zone_outskirt"], lat: 26.879, lng: 100.239 },
    { id: "s5", supplierId: "sup_001", name: "杨送水", phone: "139****6670", enabled: 1, status: "online", assignedOrders: 1, joinedAt: "2026-04-01", serviceTypes: ["送水服务"], zoneIds: ["zone_core"], lat: 26.878, lng: 100.228 },
    { id: "s6", supplierId: "sup_001", name: "周布草", phone: "139****6671", enabled: 1, status: "rest", assignedOrders: 0, joinedAt: "2026-04-10", serviceTypes: ["布草配送"], zoneIds: ["zone_south", "zone_inn"], lat: 26.87, lng: 100.235 },
  ])

  // ====== Zones ======
  insertMany("zones", [
    { id: "zone_core", name: "大研古城核心区", stations: [{ id: "st1", zoneId: "zone_core", serviceType: "生活垃圾清运", name: "四方街服务站", address: "四方街", lat: 26.870, lng: 100.234 }, { id: "st2", zoneId: "zone_core", serviceType: "建筑垃圾清运", name: "木府服务站", address: "木府旁", lat: 26.868, lng: 100.236 }] },
    { id: "zone_south", name: "七一街片区", stations: [{ id: "st3", zoneId: "zone_south", serviceType: "送水服务", name: "七一街水站", address: "七一街", lat: 26.865, lng: 100.237 }] },
    { id: "zone_inn", name: "客栈集中区", stations: [{ id: "st4", zoneId: "zone_inn", serviceType: "布草配送", name: "客栈布草中转站", address: "五一街", lat: 26.873, lng: 100.232 }] },
  ])

  // ====== Dispatch Config ======
  insertMany("dispatch_configs", [{ id: 1, autoDispatchEnabled: 1, maxRetries: 3, dispatchTimeoutSeconds: 300, zoneMode: "prefer", data: {} }])

  // ====== Convenience Orders ======
  insertMany("convenience_orders", [
    { id: "CO20260511005", userId: "u_c_001", serviceType: "送货服务", address: "五一街文治巷88号", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], note: "一箱饮料，约15kg", preferredTime: "尽快", status: "S10", createdAt: "2026-05-11 15:30", lat: 26.878, lng: 100.239, cancelRequested: 0 },
    { id: "CO20260511001", userId: "u_c_001", serviceType: "行李搬运", address: "古城北门 → 四方街", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "3个行李箱", preferredTime: "尽快", status: "A20", priceQuote: 80, refPrice: 70, createdAt: "2026-05-11 10:00", staffId: "s1", staffName: "李师傅", staffPhone: "139****6666", lat: 26.872, lng: 100.23, cancelRequested: 0 },
    { id: "CO20260511002", userId: "u_c_s_001", serviceType: "建筑垃圾清运", address: "五一街振兴巷12号", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], note: "装修产生的砖块和水泥块约3方", preferredTime: "尽快", status: "A35", priceQuote: 60, refPrice: 50, createdAt: "2026-05-11 09:00", staffId: "s3", staffName: "张环卫", staffPhone: "139****6668", lat: 26.876, lng: 100.237, cancelRequested: 0 },
    { id: "CO20260511003", userId: "u_c_s_001", serviceType: "布草配送", address: "七一街兴文巷", images: ["https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400"], note: "50套布草", preferredTime: "2026-05-11 14:00", status: "S55", priceQuote: 80, refPrice: 70, payMethod: "online", createdAt: "2026-05-11 10:00", staffId: "s1", staffName: "李师傅", staffPhone: "139****6666", completionPhotos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], paymentProof: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400", lat: 26.872, lng: 100.23, cancelRequested: 0 },
    { id: "CO20260509001", userId: "u_c_001", serviceType: "行李搬运", address: "古城东门 → 七一街", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "已送达", preferredTime: "上午", status: "S40", priceQuote: 60, refPrice: 50, payMethod: "online", createdAt: "2026-05-09 08:30", staffId: "s1", staffName: "李师傅", staffPhone: "139****6666", rating: 5, ratedAt: "2026-05-09 12:00", completedAt: "2026-05-09 11:00", lat: 26.875, lng: 100.233, cancelRequested: 0 },
    { id: "CO20260510001", userId: "u_c_001", serviceType: "送货服务", address: "四方街", images: [], note: "生鲜食材一批", preferredTime: "尽快", status: "S50", createdAt: "2026-05-10 16:00", lat: 26.874, lng: 100.232, cancelRequested: 0 },
    { id: "CO20260511004", userId: "u_c_s_001", serviceType: "生活垃圾清运", address: "光义街官门口", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], note: "日常垃圾清运", preferredTime: "每日定时", status: "A10", createdAt: "2026-05-11 06:00", lat: 26.869, lng: 100.234, cancelRequested: 0 },
    { id: "CO20260511006", userId: "u_c_s_001", serviceType: "生活垃圾清运", address: "新华街", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], note: "三个垃圾桶需要清运", preferredTime: "尽快", status: "S48", priceQuote: 60, refPrice: 40, payMethod: "cash", createdAt: "2026-05-11 07:00", staffId: "s3", staffName: "张环卫", staffPhone: "139****6668", lat: 26.879, lng: 100.239, cancelRequested: 0 },
    { id: "CO20260511007", userId: "u_c_s_001", serviceType: "送水服务", address: "五一街文治巷88号", images: ["https://images.unsplash.com/photo-1560785496-3c9d27877182?w=400"], note: "10桶18L桶装水", preferredTime: "尽快", status: "S90", priceQuote: 70, refPrice: 50, createdAt: "2026-05-11 11:00", lat: 26.878, lng: 100.239, cancelRequested: 0 },
  ])

  // ====== Reviews ======
  insertMany("reviews", [
    { id: "rev_001", orderId: "CO20260511001", serviceType: "行李搬运", staffId: "s1", staffName: "李师傅", userId: "u_c_001", userName: "张小游", rating: 5, content: "李师傅服务特别好，准时到达！", images: [] },
    { id: "rev_002", orderId: "CO20260509001", serviceType: "行李搬运", staffId: "s1", staffName: "李师傅", userId: "u_c_s_001", userName: "张老板", rating: 5, content: "客栈客人行李多，李师傅一趟趟搬完", images: [], replyContent: "多谢老板夸奖！" },
    { id: "rev_003", orderId: "CO20260511002", serviceType: "建筑垃圾清运", staffId: "s3", staffName: "张环卫", userId: "u_c_s_001", userName: "张老板", rating: 3, content: "清运还算及时，但现场没有打扫干净", images: [], followUp: 1 },
    { id: "rev_004", orderId: "CO20260511006", serviceType: "生活垃圾清运", staffId: "s3", staffName: "张环卫", userId: "u_c_s_001", userName: "张老板", rating: 5, content: "每天准时清运，非常负责", images: [], replyContent: "应该的" },
  ])

  // ====== Income Records ======
  insertMany("income_records", [
    { id: "ir1", orderId: "CO20260509001", staffId: "s1", staffName: "李师傅", serviceType: "行李搬运", amount: 60, payMethod: "online", completedAt: "2026-05-09T12:00:00" },
    { id: "ir2", orderId: "CO20260511003", staffId: "s1", staffName: "李师傅", serviceType: "布草配送", amount: 80, payMethod: "online", completedAt: "2026-05-11T12:00:00" },
  ])

  // ====== Withdrawal Requests ======
  insertMany("withdrawal_requests", [
    { id: "wd1", staffId: "s1", staffName: "李师傅", amount: 500, status: "approved", reviewedAt: "2026-06-11T14:00:00", reviewer: "管理员" },
    { id: "wd2", staffId: "s5", staffName: "杨送水", amount: 300, status: "pending" },
  ])

  // ====== Service Configs ======
  insertMany("service_configs", [
    { id: "garbage", name: "生活垃圾清运", type: "zone", emoji: "🗑️", unit: "桶", enabled: 1, order: 0 },
    { id: "construction", name: "建筑垃圾清运", type: "zone", emoji: "🧱", unit: "方", enabled: 1, order: 1 },
    { id: "linen", name: "布草配送", type: "zone", emoji: "🧺", unit: "套", enabled: 1, order: 2 },
    { id: "water", name: "送水服务", type: "zone", emoji: "💧", unit: "桶", enabled: 1, order: 3 },
    { id: "luggage", name: "行李搬运", type: "point", emoji: "🧳", unit: "件", enabled: 1, order: 4 },
    { id: "delivery", name: "送货服务", type: "point", emoji: "📦", unit: "件", enabled: 1, order: 5 },
  ])

  // ====== Complaints ======
  insertMany("complaints", [
    { id: "CP001", orderId: "CO20260511001", userId: "u_c_001", type: "服务态度", content: "便民服务人员沟通态度不好", images: ["https://images.unsplash.com/photo-1562621019-4d2f3980df96?w=400"], status: "C10", targetName: "便民服务人员", reporterType: "游客", reporterName: "张小游" },
    { id: "CP002", orderId: "CO20260511007", userId: "u_c_s_001", type: "价格争议", content: "现场报价和参考价格差距较大", images: ["https://images.unsplash.com/photo-1562572159-4efc207a5a1e?w=400"], status: "C40", targetName: "送水服务", reporterType: "本地居民", reporterName: "和女士", result: "已与商家核实" },
  ])

  // ====== Content: News ======
  insertMany("content_news", [
    { id: "1", title: "丽江古城12处直管公房公开招租公告", category: "公房公告", tag: "热门活动", tagColor: "#3B82F6", date: "2026-04-21", summary: "丽江古城旅游发展有限责任公司直管公房12处拟面向社会公开招租", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800", body: [] },
    { id: "2", title: "古城春日文化节开幕", category: "其它", tag: "热门活动", tagColor: "#3B82F6", date: "04-25", summary: "丽江古城春日文化节将于4月25日盛大开幕", imageUrl: "https://images.unsplash.com/photo-AWinVtCXVQY?w=800", body: [] },
    { id: "3", title: "景区安全须知", category: "其它", tag: "公告", tagColor: "#F59E0B", date: "04-20", summary: "请各位游客注意游览安全", imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800", body: [] },
  ])

  // ====== Content: Routes ======
  insertMany("content_routes", [
    { id: "r1", name: "古城一日游", tags: ["经典", "步行"], duration: "6小时", distance: "3.5km", stops: 8, spotNames: ["大水车", "四方街", "木府", "狮子山"], description: "丽江古城经典一日游路线", cover: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800", spots: [], contentBlocks: [] },
    { id: "r2", name: "文化探访之旅", tags: ["文化", "院落"], duration: "4小时", distance: "2.0km", stops: 5, spotNames: ["方国瑜故居", "王丕震纪念馆", "木府"], description: "探访古城深巷中的文化院落", spots: [], contentBlocks: [] },
  ])

  // ====== Content: Courtyards ======
  insertMany("content_courtyards", [
    { id: "c1", name: "木府", location: "古城中心", hours: "08:30-17:30", description: "木府是丽江古城的文化地标", imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400", tags: ["历史", "建筑"], gallery: [], contentBlocks: [] },
    { id: "c2", name: "方国瑜故居", location: "五一街", hours: "09:00-17:00", description: "著名历史学家方国瑜故居", imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400", tags: ["文化", "名人"], gallery: [], contentBlocks: [] },
  ])

  // ====== Content: Merchants ======
  insertMany("content_merchants", [
    { id: "m1", name: "古城小院餐厅", category: "餐饮", address: "五一街文明巷88号", phone: "158****8888", images: [], tags: [] },
    { id: "m2", name: "纳西银饰坊", category: "购物", address: "新华街崇仁巷67号", phone: "139****7777", images: [], tags: [] },
  ])

  // ====== Content: POIs ======
  insertMany("content_pois", [
    { id: "poi1", name: "大水车", category: "scenic_spot", address: "古城北入口", lat: 26.872, lng: 100.231, tags: [] },
    { id: "poi2", name: "四方街", category: "scenic_spot", address: "古城中心", lat: 26.870, lng: 100.234, tags: [] },
    { id: "poi3", name: "木府", category: "scenic_spot", address: "关门口", lat: 26.868, lng: 100.236, tags: [] },
    { id: "poi4", name: "黑龙潭公园", category: "scenic_spot", address: "古城北", lat: 26.880, lng: 100.225, tags: [] },
  ])

  // ====== Content: Housing ======
  insertMany("content_housing", [
    { id: 1, name: "光义街9号公房", addr: "丽江市古城区光义街9号（铺面）", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["267.74㎡", "特色食品", "砖木结构"] },
    { id: 2, name: "新院巷63号公房", addr: "丽江市古城区新院巷63号", status: "idle", statusText: "未出租", area: "gucheng", areaName: "古城区", meta: ["185.50㎡", "闲置", "木结构"] },
    { id: 3, name: "五一街32号公房", addr: "丽江市古城区五一街32号", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["156.30㎡", "饰品", "砖混结构"] },
  ])

  // ====== Banners ======
  insertMany("banners", [
    { id: "b1", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800", title: "丽江古城欢迎您", scene: "home", enabled: 1, order: 0 },
    { id: "b2", imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800", title: "文化院落之旅", scene: "home", enabled: 1, order: 1 },
  ])

  // ====== Grid Items ======
  insertMany("grid_items", [
    { id: "g1", label: "便民服务", route: "/c/services", page: 1, visible: 1, order: 1 },
    { id: "g2", label: "购在古城", route: "/c/merchants", page: 1, visible: 1, order: 2 },
    { id: "g3", label: "导览地图", route: "/c/map", page: 1, visible: 1, order: 3 },
  ])

  // ====== Points Rules ======
  insertMany("points_rules", [
    { code: "courtyard_checkin", label: "院落打卡", points: 5, dailyLimit: 10, direction: "IN", enabled: 1 },
    { code: "naxi_streak", label: "纳西人连续打卡", points: 50, dailyLimit: 1, direction: "IN", enabled: 1 },
    { code: "volunteer_service", label: "志愿服务", points: 2, dailyLimit: 100, direction: "IN", enabled: 1 },
    { code: "mall_purchase", label: "商城消费", points: 1, direction: "IN", enabled: 1 },
    { code: "mall_redeem", label: "积分兑换", points: 1, direction: "OUT", enabled: 1 },
  ])

  // ====== Points Accounts ======
  insertMany("points_accounts", [
    { userId: "u_c_001", balance: 320, totalEarned: 380, totalUsed: 60 },
    { userId: "u_b_001", balance: 150, totalEarned: 200, totalUsed: 50 },
  ])

  // ====== Trust Scores ======
  insertMany("trust_scores", [
    { staffId: "s1", supplierId: "sup_001", name: "李师傅", roleTag: "便民服务人员", trustScore: 78, status: "正常", totalOrders: 156, totalRatings: 142, rating5Count: 98, rating4Count: 35, rating3Count: 5, rating2Count: 3, rating1Count: 1, complaintCount: 3, rejectionCount: 1, scoreHistory: [{ id: "h1", date: "2026-05-01", change: -3, reason: "服务迟到投诉" }] },
    { staffId: "s3", supplierId: "sup_001", name: "张环卫", roleTag: "便民服务人员", trustScore: 88, status: "正常", totalOrders: 234, totalRatings: 220, rating5Count: 180, rating4Count: 30, rating3Count: 6, rating2Count: 3, rating1Count: 1, complaintCount: 5, rejectionCount: 2, scoreHistory: [] },
  ])

  // ====== Score Rules ======
  insertMany("score_rules", [
    { id: "rule_01", type: "deduct", name: "差评扣分", condition: "用户评价 ≤ 2 星", scoreChange: -5, enabled: 1, description: "每次获得差评扣除诚信分" },
    { id: "rule_02", type: "deduct", name: "取消订单扣分", condition: "已接单后取消", scoreChange: -3, enabled: 1, description: "接单后取消扣除诚信分" },
    { id: "rule_03", type: "deduct", name: "投诉扣分（一般）", condition: "投诉成立（一般）", scoreChange: -3, enabled: 1, description: "一般投诉核实成立后扣除诚信分" },
    { id: "rule_06", type: "reward", name: "5星好评加分", condition: "用户评价 5 星", scoreChange: 1, enabled: 1, description: "获得5星好评每次加诚信分" },
    { id: "rule_07", type: "reward", name: "4星好评加分", condition: "用户评价 4 星", scoreChange: 0.5, enabled: 1, description: "获得4星好评每次加诚信分" },
  ])

  // ====== Trust Threshold ======
  insertMany("trust_thresholds", [{ id: 1, defaultScore: 100, delinquentThreshold: 60, autoRecover: 1, recoverScore: 70 }])

  // ====== Bookings ======
  insertMany("bookings", [
    { id: "bk1", userId: "u_c_001", courtyardId: "c1", courtyardName: "木府", userName: "张小游", userPhone: "13800001001", date: "2026-07-10", slot: "09:00-10:00", visitors: 2, code: "YY123456", status: "confirmed" },
    { id: "bk2", userId: "u_c_s_001", courtyardId: "c2", courtyardName: "方国瑜故居", userName: "张老板", userPhone: "13800001002", date: "2026-07-12", slot: "14:00-15:00", visitors: 3, code: "YY789012", status: "pending" },
  ])

  // ====== Suppliers ======
  insertMany("suppliers", [
    { id: "sup_001", name: "古城服务管理公司", contactName: "和经理", contactPhone: "139****0000", address: "古城区", status: "active" },
  ])

  // ====== Addresses ======
  insertMany("addresses", [
    { id: "addr_1", userId: "u_c_001", province: "云南省", city: "丽江市", district: "古城区", detail: "五一街文治巷88号", isDefault: 1 },
    { id: "addr_2", userId: "u_c_001", province: "云南省", city: "丽江市", district: "古城区", detail: "四方街12号", isDefault: 0 },
    { id: "addr_3", userId: "u_c_s_001", province: "云南省", city: "丽江市", district: "古城区", detail: "七一街兴文巷", isDefault: 1 },
  ])

  // ====== Favorites ======
  insertMany("favorites", [
    { id: "fav_1", userId: "u_c_001", targetType: "merchant", targetId: "m1", title: "古城小院餐厅" },
    { id: "fav_2", userId: "u_c_001", targetType: "courtyard", targetId: "c1", title: "木府" },
  ])

  // ====== AI Knowledge ======
  insertMany("ai_knowledge", [
    { id: "k1", question: "丽江古城有什么必去的景点？", answer: "四方街、木府、大水车、黑龙潭、狮子山万古楼都是经典景点。", category: "景点", tags: [], enabled: 1 },
    { id: "k2", question: "丽江古城的门票是多少？", answer: "丽江古城本身不收取门票，但木府等文化院落需要单独购票。", category: "票务", tags: [], enabled: 1 },
    { id: "k3", question: "丽江古城有什么特色美食？", answer: "鸡豆凉粉、丽江粑粑、纳西烤鱼、腊排骨火锅都是当地特色。", category: "美食", tags: [], enabled: 1 },
    { id: "k4", question: "丽江古城怎么去？", answer: "从丽江三义机场可乘机场大巴到市区，打车约30分钟。", category: "交通", tags: [], enabled: 1 },
  ])

  // ====== Supplier Applications ======
  insertMany("supplier_applications", [
    { id: "sa1", companyName: "丽江纳西手工艺坊", contactName: "和师傅", contactPhone: "139****1111", status: "pending" },
  ])

  // ====== Volunteer Activities ======
  insertMany("volunteer_activities", [
    { id: "va1", title: "古城环保志愿活动", description: "清理古城街道，维护环境卫生", location: "四方街", startTime: "2026-06-01 09:00", endTime: "2026-06-01 12:00", maxParticipants: 30, currentParticipants: 0, status: "published" },
  ])

  console.log("🌱 Seed 完成")
  return true
}

// 直接执行时跑 seed
const isDirectRun = typeof process !== "undefined" && process.argv[1]?.endsWith("seed.js")
if (isDirectRun) {
  seedIfNeeded()
  process.exit(0)
}