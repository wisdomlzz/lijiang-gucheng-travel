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

  // ====== Reviews (12 items) ======
  insertMany("reviews", [
    { id: "rev_001", orderId: "CO20260511001", serviceType: "行李搬运", staffId: "s1", staffName: "李师傅", userId: "u_c_001", userName: "张小游", rating: 5, content: "李师傅服务特别好，准时到达，行李搬运非常小心，还帮我提到了房间里，点赞！", images: [], replyContent: "谢谢您的评价，祝您在丽江玩得开心！", repliedAt: "2026-05-11 17:00", autoRated: 0, followUp: 0 },
    { id: "rev_002", orderId: "CO20260512002", serviceType: "送货服务", staffId: "s2", staffName: "赵丹", userId: "u_c_001", userName: "张小游", rating: 4, content: "送货速度很快，不过饮料有一瓶有点漏了，希望包装再加强一些。", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], replyContent: "抱歉给您带来不便，已反馈给配送团队加强包装。", repliedAt: "2026-05-12 15:00", autoRated: 0, followUp: 0 },
    { id: "rev_003", orderId: "CO20260513003", serviceType: "建筑垃圾清运", staffId: "s3", staffName: "张环卫", userId: "u_c_s_001", userName: "张老板", rating: 3, content: "清运还算及时，但师傅没有把现场打扫干净，地上留了一些灰尘和碎屑。", images: [], autoRated: 0, followUp: 1 },
    { id: "rev_004", orderId: "CO20260514004", serviceType: "生活垃圾清运", staffId: "s4", staffName: "马师傅", userId: "u_c_s_001", userName: "张老板", rating: 5, content: "马师傅非常负责，每天准时来清运，垃圾房周边也打扫得很干净。", images: [], replyContent: "应该的，感谢您的认可！", repliedAt: "2026-05-14 09:00", autoRated: 0, followUp: 0 },
    { id: "rev_005", orderId: "CO20260515005", serviceType: "送水服务", staffId: "s5", staffName: "杨送水", userId: "u_c_s_001", userName: "张老板", rating: 2, content: "送水晚了将近一个小时，打电话催了好几次，态度也一般。希望能够改进。", images: [], autoRated: 0, followUp: 1 },
    { id: "rev_006", orderId: "CO20260516006", serviceType: "布草配送", staffId: "s6", staffName: "周布草", userId: "u_c_s_001", userName: "张老板", rating: 4, content: "布草配送准时，数量也准确，但有一件床单有轻微污渍，希望能加强清洗检查。", images: ["https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400"], autoRated: 0, followUp: 0 },
    { id: "rev_007", orderId: "CO20260517007", serviceType: "行李搬运", staffId: "s1", staffName: "李师傅", userId: "u_c_s_001", userName: "张老板", rating: 5, content: "客栈客人行李多，李师傅一趟趟搬完还帮忙分类摆放，非常敬业。", images: [], replyContent: "多谢老板夸奖，随时为您服务！", repliedAt: "2026-05-17 15:00", autoRated: 0, followUp: 0 },
    { id: "rev_008", orderId: "CO20260518008", serviceType: "送货服务", staffId: "s2", staffName: "赵丹", userId: "u_c_s_001", userName: "张老板", rating: 4, content: "送货上门，比较及时，满意。", images: [], autoRated: 0, followUp: 0 },
    { id: "rev_009", orderId: "CO20260519009", serviceType: "生活垃圾清运", staffId: "s3", staffName: "张环卫", userId: "u_c_001", userName: "张小游", rating: 1, content: "垃圾车噪音太大，早上六点多就在巷子里作业，影响休息。希望能调整作业时间。", images: [], autoRated: 0, followUp: 1 },
    { id: "rev_010", orderId: "CO20260520010", serviceType: "送水服务", staffId: "s5", staffName: "杨送水", userId: "u_c_001", userName: "张小游", rating: 5, content: "杨师傅态度很好，还帮忙把水桶安装到饮水机上，服务周到！", images: [], replyContent: "谢谢，您太客气了！", repliedAt: "2026-05-20 11:00", autoRated: 0, followUp: 0 },
    { id: "rev_011", orderId: "CO20260521011", serviceType: "布草配送", staffId: "s6", staffName: "周布草", userId: "u_c_001", userName: "张小游", rating: 4, content: "配送很快，布草质量也不错。", images: [], autoRated: 0, followUp: 0 },
    { id: "rev_012", orderId: "CO20260522012", serviceType: "建筑垃圾清运", staffId: "s4", staffName: "马师傅", userId: "u_c_s_001", userName: "张老板", rating: 3, content: "清运速度还可以，但价格偏高，希望能更合理一些。", images: [], autoRated: 0, followUp: 0 },
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
    { id: "CP001", orderId: "CO20260511001", userId: "u_c_001", type: "服务态度", content: "便民服务人员沟通态度不好，希望平台提醒整改", images: ["https://images.unsplash.com/photo-1562621019-4d2f3980df96?w=400"], status: "C10", targetName: "便民服务人员", reporterType: "游客", reporterName: "张小游", reporterGender: "女", reporterPhone: "13800001001", objectType: "个人", incidentArea: "大研街道", incidentLocation: "五一街片区", doorplate: "五一街42号", channelNote: "小程序自有投诉渠道" },
    { id: "CP002", orderId: "CO20260511007", userId: "u_c_s_001", type: "价格争议", content: "现场报价和参考价格差距较大，希望平台复核", images: ["https://images.unsplash.com/photo-1562572159-4efc207a5a1e?w=400"], status: "C40", targetName: "送水服务", reporterType: "本地居民", reporterName: "和女士", reporterGender: "女", reporterPhone: "13988880002", objectType: "个人", incidentArea: "七一社区", incidentLocation: "七一街片区", doorplate: "七一街88号", channelNote: "小程序自有投诉渠道", result: "已与商家核实，现场报价为服务过程中的即时报价，已向用户解释说明。", handledAt: "2026-05-11 14:00" },
    { id: "CP003", orderId: "CO20260511006", userId: "u_c_s_001", type: "服务结果", content: "建筑垃圾清运后现场仍有残留，需要重新处理", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], status: "C40", targetName: "生活垃圾清运", reporterType: "工作人员", reporterName: "片区巡查员", reporterGender: "男", reporterPhone: "18800003001", objectType: "公共环境", incidentArea: "新华社区", incidentLocation: "新华街片区", doorplate: "新华街16号", channelNote: "小程序自有投诉渠道", result: "已通知服务人员复查并完成二次清运。", handledAt: "2026-05-09 10:30" },
    { id: "CP004", orderId: "CO20260509000", userId: "u_c_001", type: "服务时效", content: "行李搬运服务迟到半小时，影响入住安排", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], status: "CR", targetName: "行李搬运", reporterType: "游客", reporterName: "游客张小游", reporterGender: "女", reporterPhone: "13800001001", objectType: "个人", incidentArea: "四方街社区", incidentLocation: "四方街", doorplate: "四方街12号", channelNote: "小程序自有投诉渠道", result: "经核实，服务人员因交通拥堵导致迟到，已向用户致歉并说明。", handledAt: "2026-05-11 11:00" },
  ])

  // ====== Content: News (10 items) ======
  insertMany("content_news", [
    { id: "1", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70", title: "丽江古城12处直管公房公开招租公告", tag: "热门活动", tagColor: "#3B82F6", date: "2026-04-21", summary: "丽江古城旅游发展有限责任公司直管公房12处拟面向社会公开招租", category: "公房公告", heroTitle: "丽江古城旅游前服务", body: ["丽江古城旅游发展有限责任公司直管公房12处拟面向社会公开招租"], subImage: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70" },
    { id: "2", imageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70", title: "丽江古城有限公司直管公房公开招租相关公告", tag: "优惠活动", tagColor: "#10B981", date: "2026-04-21", summary: "本次公告面向古城五一街、新华街片区公房进行公开招租", category: "公房公告", heroTitle: "丽江古城旅游前服务", body: ["本次公告面向古城五一街、新华街片区公房进行公开招租"], subImage: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70" },
    { id: "3", imageUrl: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=800&q=70", title: "丽江古城直管公房公开招租相关公告（原魔代医院）", tag: "公告", tagColor: "#64748B", date: "2026-04-20", summary: "原魔代医院地块公房整体拟公开招租", category: "公房公告", heroTitle: "丽江古城旅游前服务", body: ["原魔代医院地块公房整体拟公开招租"], subImage: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=800&q=70" },
    { id: "4", imageUrl: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70", title: "古城春日文化节开幕", tag: "热门活动", tagColor: "#3B82F6", date: "04-25", summary: "丽江古城春日文化节将于4月25日开幕", category: "其它", body: ["丽江古城春日文化节将于4月25日开幕"], subImage: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70" },
    { id: "5", imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=70", title: "新义街三层老宅整院出租 · 年租 18 万", tag: "房屋信息", tagColor: "#F97316", date: "2026-04-19", summary: "本院位于新义街核心地段，适合客栈或文创业态", category: "房屋信息", heroTitle: "古城老宅出租信息", body: ["本院位于新义街核心地段，三进院落，产权清晰，适合客栈或文创业态"], subImage: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=70" },
    { id: "6", imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=70", title: "古城文创店招聘店员", tag: "举贤纳仕", tagColor: "#10B981", date: "2026-04-15", summary: "古城文创店招聘店员，要求熟悉旅游接待和本地文创产品", category: "举贤纳仕", heroTitle: "古城文创店招聘", body: ["古城文创店招聘店员，要求熟悉旅游接待和本地文创产品"], subImage: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=70" },
    { id: "7", imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70", title: "关于古城水系清淤维护的通知", tag: "通知", tagColor: "#64748B", date: "2026-04-12", summary: "4月25日-4月28日对四方街至玉河广场段水系进行清淤", category: "其它", heroTitle: "古城水系维护通知", body: ["4月25日-4月28日对四方街至玉河广场段水系进行清淤"], subImage: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70" },
    { id: "8", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70", title: "古城春日文化节即将开幕", tag: "热门活动", tagColor: "#3B82F6", date: "04-25", summary: "丽江古城春日文化节将于4月25日开幕", category: "其它", heroTitle: "丽江古城旅游前服务", body: ["丽江古城春日文化节将于4月25日开幕"], subImage: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70" },
    { id: "9", imageUrl: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70", title: "公房出租公告", tag: "公告", tagColor: "#64748B", date: "04-12", summary: "丽江古城公房出租，欢迎咨询", category: "公房公告", body: ["丽江古城公房出租，欢迎咨询"], subImage: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70" },
    { id: "10", imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=70", title: "古城游览安全提醒", tag: "公告", tagColor: "#2563EB", date: "04-10", summary: "游览古城请注意人身财产安全", category: "其它", heroTitle: "游览古城请注意人身财产安全", subImage: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=70" },
  ])

  // ====== Content: Routes (2 items — source only had minimal card list) ======
  insertMany("content_routes", [
    { id: "r1", name: "古城漫步·非遗之旅", tags: ["深度游", "步行"], duration: "4小时", difficulty: "中等", stops: 6, distance: "3.5km", spotNames: ["大水车", "四方街", "木府", "万古楼"], description: "从大水车启程，穿过四方街，深入木府领略纳西文化，登上万古楼俯瞰古城全景。", cover: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=600&q=70", spots: [], contentBlocks: [] },
    { id: "r2", name: "寻味古城·美食地图", tags: ["吃货必选", "美食"], duration: "半天", difficulty: "简单", stops: 8, distance: "2.0km", spotNames: ["忠义市场", "五一街", "樱花美食广场"], description: "从忠义市场感受本地烟火气，一路寻味到樱花美食广场，尝遍腊排骨、鸡豆凉粉、丽江粑粑。", cover: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=70", spots: [], contentBlocks: [] },
  ])

  // ====== Content: Courtyards (4 items) ======
  insertMany("content_courtyards", [
    { id: "1", name: "木府", title: "纳西王府", tags: ["历史建筑", "纳西文化"], tagContent: "明代木氏土司府邸，是丽江古城文化展示的重要节点。", summary: "纳西族土司府邸，了解丽江历史文化的重要窗口。", description: "木府是丽江古城之心脏，原为明代木氏土司府邸，建筑群气势恢宏，被誉为「丽江紫禁城」。", location: "古城光义街官门口", hours: "08:30-17:30", imageUrl: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=600&q=70", phone: "0888-5123456", vrImageUrl: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=1600&q=80", audioGuideUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav", remark: "旺季建议提前预约，团队参观需错峰入场。", gallery: ["https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=800&q=70", "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70", "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70"], lat: 26.8685, lng: 100.2312, contentBlocks: [] },
    { id: "2", name: "方国瑜故居", title: "方国瑜故居", tags: ["名人故居", "文史展陈"], tagContent: "展示方国瑜先生手稿、著作与纳西历史研究资料。", summary: "纳西族历史学家方国瑜先生故居，保留珍贵手稿与文献。", description: "著名纳西族历史学家方国瑜先生的故居，保留了大量珍贵手稿与历史文献。", location: "五一街文治巷42号", hours: "09:00-17:00", imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=70", phone: "0888-5123457", vrImageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80", audioGuideUrl: "", remark: "室内展陈空间较小，雨天注意院内台阶湿滑。", gallery: ["https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70", "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70"], lat: 26.8692, lng: 100.2356, contentBlocks: [] },
    { id: "3", name: "纳西古乐会", title: "纳西古乐", tags: ["非遗演艺", "夜间游览"], tagContent: "以纳西古乐现场演奏为核心，适合夜间文化体验。", summary: "每晚上演原生态纳西古乐表演。", description: "每晚在古城内上演的原生态纳西古乐表演，被誉为「音乐活化石」。", location: "古城新义街纳西古乐会", hours: "20:00-21:30", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=600&q=70", phone: "0888-5123458", vrImageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1600&q=80", audioGuideUrl: "", remark: "演出场次受节庆活动影响，以现场公告为准。", gallery: ["https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70", "https://images.unsplash.com/photo-1552526881-5517a57c17ae?auto=format&fit=crop&w=800&q=70"], lat: 26.8668, lng: 100.2298, contentBlocks: [] },
    { id: "4", name: "雪山书院", title: "雪山书院", tags: ["书院文化", "研学"], tagContent: "清代官办学堂旧址，适合研学参观和文化讲座。", summary: "清代丽江最早官办学堂。", description: "清代丽江最早的官办学堂，至今仍保留藏书、讲学功能。", location: "五一街文治巷15号", hours: "09:00-18:00", imageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=600&q=70", phone: "0888-5123459", vrImageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=1600&q=80", audioGuideUrl: "", remark: "讲座活动需提前关注预约通知。", gallery: ["https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70"], lat: 26.8695, lng: 100.2368, contentBlocks: [] },
  ])

  // ====== Content: Merchants (10 items) ======
  insertMany("content_merchants", [
    { id: "1", name: "纳西人家餐厅", category: "food", description: "纳西人家餐厅创立于1998年，专注地道纳西风味美食，招牌菜有腊排骨火锅、鸡豆凉粉、纳西烤鱼。", cover: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop", hours: "10:00-22:00", logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop", address: "五一街文明巷88号", phone: "0888-5123456", images: [], tags: [], lat: 26.8758, lng: 100.2362, rating: 4.8 },
    { id: "2", name: "古城客栈", category: "hotel", description: "古典纳西庭院风格客栈，观景房可俯瞰古城全景，提供温馨舒适的住宿体验。", cover: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop", hours: "全天", logo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop", address: "新华街崇仁巷67号", phone: "0888-5234567", images: [], tags: [], lat: 26.8762, lng: 100.2318, rating: 4.7 },
    { id: "3", name: "东巴纸坊", category: "shopping", description: "现场体验手工东巴纸制作，感受纳西族千年造纸技艺，可定制专属东巴纸纪念品。", cover: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&h=400&fit=crop", hours: "09:00-21:00", logo: "https://images.unsplash.com/photo-1555421689-d68471e189f2?w=200&h=200&fit=crop", address: "七一街八一巷", phone: "139-8888-5678", images: [], tags: [], lat: 26.8738, lng: 100.2378, rating: 4.9 },
    { id: "4", name: "雪山清吧", category: "bar", description: "古城民谣清吧，每晚驻唱演出，精选鸡尾酒与云南特色小食，氛围轻松惬意。", cover: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&h=400&fit=crop", hours: "18:00-02:00", logo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop", address: "五一街振兴巷12号", phone: "139-8888-9012", images: [], tags: [], lat: 26.8752, lng: 100.2358, rating: 4.9 },
    { id: "5", name: "木府茶室", category: "food", description: "临近木府，品鉴正宗普洱茶，搭配纳西传统小吃，在古院落中享受悠闲时光。", cover: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop", hours: "10:00-20:00", logo: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&h=200&fit=crop", address: "光义街官门口", phone: "0888-5345678", images: [], tags: [], lat: 26.8748, lng: 100.2342, rating: 4.6 },
    { id: "6", name: "古城文创集合店", category: "shopping", description: "原创手工艺品、纳西文化周边、文创伴手礼，是选购古城纪念品的好去处。", cover: "https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=600&h=400&fit=crop", hours: "09:00-22:00", logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop", address: "四方街", phone: "139-8888-3456", images: [], tags: [], lat: 26.8756, lng: 100.2326, rating: 4.7 },
    { id: "7", name: "阿妈意腊排骨", category: "food", description: "古城老字号腊排骨专门店，三十年传承秘制配方，汤鲜肉嫩，回味无穷。", cover: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop", hours: "11:00-21:30", logo: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=200&h=200&fit=crop", address: "七一街兴文巷", phone: "0888-5566778", images: [], tags: [], lat: 26.8745, lng: 100.2355, rating: 4.7 },
    { id: "8", name: "花间堂客栈", category: "hotel", description: "纳西三坊一照壁庭院民宿，花园景观房，提供普洱茶品鉴和古城游览咨询。", cover: "https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=600&h=400&fit=crop", hours: "全天", logo: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=200&h=200&fit=crop", address: "五一街文明巷56号", phone: "0888-5890123", images: [], tags: [], lat: 26.876, lng: 100.2345, rating: 4.8 },
    { id: "9", name: "纳西绣坊", category: "shopping", description: "纳西族传统刺绣工艺展示与体验，可定制刺绣手帕、挂画等精美工艺品。", cover: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop", hours: "09:30-20:00", logo: "https://images.unsplash.com/photo-1558769132-cb1c458a752b?w=200&h=200&fit=crop", address: "新华街双石巷", phone: "139-8888-7890", images: [], tags: [], lat: 26.8735, lng: 100.233, rating: 4.8 },
    { id: "10", name: "樱花酒吧", category: "bar", description: "樱花主题音乐酒吧，知名乐队驻场，特色樱花鸡尾酒不容错过。", cover: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&h=400&fit=crop", hours: "19:00-03:00", logo: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=200&h=200&fit=crop", address: "酒吧街", phone: "139-8888-1234", images: [], tags: [], lat: 26.875, lng: 100.2335, rating: 4.6 },
  ])

  // ====== Content: POIs (5 items) ======
  insertMany("content_pois", [
    { id: "poi1", name: "大水车", category: "scenic_spot", address: "古城北入口", lat: 26.872, lng: 100.232, imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400", phone: "0888-5101122", hours: "全天开放", description: "丽江古城标志性景观，位于古城北入口", tags: [] },
    { id: "poi2", name: "四方街", category: "scenic_spot", address: "古城核心区", lat: 26.87, lng: 100.23, imageUrl: "https://images.unsplash.com/photo-1552526881-5517a57c17ae?w=400", phone: "0888-5102233", hours: "全天开放", description: "古城中心广场，商贾云集", tags: [] },
    { id: "poi3", name: "木府", category: "scenic_spot", address: "光义街官门口", lat: 26.867, lng: 100.228, imageUrl: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?w=400", phone: "0888-5103344", hours: "08:30-17:30", description: "纳西族土司府邸，古城文化核心", tags: [] },
    { id: "poi4", name: "北门停车场", category: "facility", address: "古城北入口旁", lat: 26.8735, lng: 100.2325, phone: "0888-5104455", hours: "24小时", description: "大型停车场，320个车位", tags: [] },
    { id: "poi5", name: "游客服务中心", category: "service", address: "玉河广场服务区", lat: 26.871, lng: 100.233, phone: "0888-5105566", hours: "08:30-22:00", description: "提供咨询、寄存、轮椅租借等服务", tags: [] },
  ])

  // ====== Content: Housing (5 items) ======
  insertMany("content_housing", [
    { id: 1, name: "光义街9号公房", addr: "丽江市古城区光义街9号（铺面）", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["267.74㎡", "特色食品", "砖木结构"] },
    { id: 2, name: "新院巷63号公房", addr: "丽江市古城区新院巷63号", status: "idle", statusText: "未出租", area: "gucheng", areaName: "古城区", meta: ["185.50㎡", "闲置", "木结构"] },
    { id: 3, name: "五一街32号公房", addr: "丽江市古城区五一街32号", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["156.30㎡", "饰品", "砖混结构"] },
    { id: 4, name: "兴文巷18号公房", addr: "丽江市古城区兴文巷18号", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["320.00㎡", "餐饮", "砖木结构"] },
    { id: 5, name: "七一街8号公房", addr: "丽江市古城区七一街8号", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["420.00㎡", "客栈", "砖木结构"] },
  ])

  // ====== Banners (2 items — home scene) ======
  insertMany("banners", [
    { id: "bh1", scene: "home", imageUrl: "https://images.unsplash.com/photo-1775120246271-cd4b6a3ef428?auto=format&fit=crop&w=1200&q=70", title: "一键服务", subtitle: "便捷生活", badge: "热门", link: "/c/services", order: 0, visible: 1, enabled: 1 },
    { id: "bh2", scene: "home", imageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=1200&q=70", title: "古城活动", subtitle: "精彩纷呈", badge: "活动", link: "/c/info/activity-1", order: 1, visible: 1, enabled: 1 },
  ])

  // ====== Grid Items (17 items) ======
  insertMany("grid_items", [
    { id: "g1", imageUrl: "/icons/一键服务@2x.png", label: "便民服务", route: "/c/services", page: 1, visible: 1, order: 0 },
    { id: "g9", imageUrl: "/icons/购在古城@2x.png", label: "购在古城", route: "/c/merchants", page: 1, visible: 1, order: 1 },
    { id: "g2", imageUrl: "/icons/导览地图@2x.png", label: "导览地图", route: "/c/map", page: 1, visible: 1, order: 2 },
    { id: "g10", imageUrl: "/icons/门票预订@2x.png", label: "门票预订", route: "crmeb", page: 1, visible: 1, order: 3 },
    { id: "g3", imageUrl: "/icons/文化院落@2x.png", label: "文化院落", route: "/c/courtyards", page: 1, visible: 1, order: 4 },
    { id: "g15", imageUrl: "/icons/志愿服务@2x.png", label: "志愿服务", route: "/c/volunteer", page: 1, visible: 1, order: 5 },
    { id: "g11", imageUrl: "/icons/古城资讯@2x.png", label: "古城资讯", route: "/c/news", page: 1, visible: 1, order: 6 },
    { id: "g4", imageUrl: "/icons/讲解服务@2x.png", label: "讲解服务", route: "crmeb", page: 1, visible: 1, order: 7 },
    { id: "g12", imageUrl: "/icons/精选路线@2x.png", label: "精选路线", route: "/c/routes", page: 2, visible: 1, order: 8 },
    { id: "g5", imageUrl: "/icons/遗产知识@2x.png", label: "遗产知识", route: "/c/heritage", page: 2, visible: 1, order: 9 },
    { id: "g19", imageUrl: "/icons/公告通知@2x.png", label: "公告通知", route: "/c/notice", page: 2, visible: 1, order: 10 },
    { id: "g6", imageUrl: "/icons/VR游览@2x.png", label: "VR游览", route: "/c/vr-tour", page: 2, visible: 1, order: 11 },
    { id: "g14", imageUrl: "/icons/便民信息@2x.png", label: "便民信息", route: "/c/info", page: 2, visible: 1, order: 12 },
    { id: "g7", imageUrl: "/icons/公房服务@2x.png", label: "公房信息", route: "/c/housing", page: 2, visible: 1, order: 13 },
    { id: "g8", imageUrl: "/icons/官方商城@2x.png", label: "官方商城", route: "crmeb", page: 2, visible: 1, order: 14 },
    { id: "g16", imageUrl: "/icons/一键投诉@2x.png", label: "一键投诉", route: "/c/complaint", page: 2, visible: 1, order: 15 },
    { id: "g18", imageUrl: "/icons/随手拍@2x.png", label: "随手拍", route: "/c/photo-report", page: 2, visible: 1, order: 16 },
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

  // ====== Trust Scores (4 items — source has s1-s4) ======
  insertMany("trust_scores", [
    { staffId: "s1", supplierId: "sup_001", name: "李师傅", roleTag: "便民服务人员", trustScore: 78, status: "正常", totalOrders: 156, totalRatings: 142, rating5Count: 98, rating4Count: 35, rating3Count: 5, rating2Count: 3, rating1Count: 1, complaintCount: 3, rejectionCount: 1, scoreHistory: [
      { id: "h1", date: "2026-05-01", change: -3, reason: "服务迟到投诉" },
      { id: "h2", date: "2026-04-20", change: -4, reason: "服务态度投诉" },
    ] },
    { staffId: "s2", supplierId: "sup_001", name: "王导游", roleTag: "讲解员", trustScore: 95, status: "正常", totalOrders: 89, totalRatings: 85, rating5Count: 72, rating4Count: 10, rating3Count: 2, rating2Count: 1, rating1Count: 0, complaintCount: 0, rejectionCount: 0, scoreHistory: [] },
    { staffId: "s3", supplierId: "sup_001", name: "张司机", roleTag: "包车司机", trustScore: 88, status: "正常", totalOrders: 234, totalRatings: 220, rating5Count: 180, rating4Count: 30, rating3Count: 6, rating2Count: 3, rating1Count: 1, complaintCount: 5, rejectionCount: 2, scoreHistory: [] },
    { staffId: "s4", supplierId: "sup_001", name: "赵旅拍", roleTag: "旅拍", trustScore: 52, status: "观察期", totalOrders: 67, totalRatings: 62, rating5Count: 45, rating4Count: 12, rating3Count: 3, rating2Count: 1, rating1Count: 1, complaintCount: 6, rejectionCount: 3, observationStartAt: "2026-04-11", lastComplaintAt: "2026-05-01", scoreHistory: [
      { id: "h5", date: "2026-05-02", change: -6, reason: "成片质量差投诉" },
      { id: "h6", date: "2026-04-22", change: -5, reason: "修图过度投诉" },
    ] },
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
    { id: "bk1", userId: "u_c_001", courtyardId: "1", courtyardName: "木府", userName: "张小游", userPhone: "13800001001", date: "2026-07-10", slot: "09:00-10:00", visitors: 2, code: "YY123456", status: "confirmed" },
    { id: "bk2", userId: "u_c_s_001", courtyardId: "2", courtyardName: "方国瑜故居", userName: "张老板", userPhone: "13800001002", date: "2026-07-12", slot: "14:00-15:00", visitors: 3, code: "YY789012", status: "pending" },
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
    { id: "fav_1", userId: "u_c_001", targetType: "merchant", targetId: "1", title: "纳西人家餐厅" },
    { id: "fav_2", userId: "u_c_001", targetType: "courtyard", targetId: "1", title: "木府" },
  ])

  // ====== AI Knowledge (8 items) ======
  insertMany("ai_knowledge", [
    { id: "k1", question: "丽江古城开放时间是什么？", answer: "丽江古城为开放式景区，全天24小时开放。但部分收费景点（如木府、万古楼）有独立开放时间，一般为8:00-18:00。", category: "", tags: [], enabled: 1 },
    { id: "k2", question: "古城维护费多少钱？怎么缴纳？", answer: "古城维护费为80元/人次，72小时有效。可通过古城各入口的维护费征收点缴纳，也可在入住酒店时由酒店代收。", category: "", tags: [], enabled: 1 },
    { id: "k3", question: "有哪些推荐的游览路线？", answer: "推荐路线：\n1. 古城漫步·非遗之旅（6个景点，约4小时）\n2. 纳西文化·深度探索（5个景点，约3小时）\n3. 寻味古城·美食地图（8个打卡点，约半天）\n您可以根据时间灵活选择。", category: "", tags: [], enabled: 1 },
    { id: "k4", question: "古城有哪些特色美食推荐？", answer: "丽江古城美食推荐：\n- 纳西人家餐厅：地道纳西菜\n- 阿妈意餐厅：纳西风味\n- 老四方街：传统小吃\n特色菜品包括腊排骨火锅、鸡豆凉粉、丽江粑粑等。", category: "", tags: [], enabled: 1 },
    { id: "k5", question: "怎么去丽江古城？交通方式？", answer: "到达丽江古城的方式：\n1. 飞机：丽江三义机场，乘机场大巴或打车至古城\n2. 火车：丽江站，乘4路/18路公交至古城入口\n3. 自驾：导航至「丽江古城」，周边有多个停车场\n古城内禁止机动车通行，建议步行游览。", category: "", tags: [], enabled: 1 },
    { id: "k6", question: "古城有哪些文化活动？", answer: "近期活动：\n- 三多节纳西族传统节庆（四方街民俗表演）\n- 东巴文化体验营（万古楼，需预约）\n- 纳西古乐演出（每晚固定场次）\n- 四方街篝火晚会（每晚20:00）", category: "", tags: [], enabled: 1 },
    { id: "k7", question: "遇到问题怎么投诉？", answer: "投诉方式：\n1. 在线投诉：通过小程序「一键投诉」提交\n2. 电话投诉：0888-5123437（工作时间）\n3. 现场投诉：古城游客服务中心\n投诉提交后可在小程序查看处理进度。", category: "", tags: [], enabled: 1 },
    { id: "k8", question: "古城有哪些文化院落可以参观？", answer: "主要文化院落：\n- 木府：古城标志性建筑，门票60元\n- 方国瑜故居：免费开放\n- 王家庄教堂：历史建筑\n- 雪山书院：文化展览\n各院落开放时间不一，建议提前查看详情。", category: "", tags: [], enabled: 1 },
  ])

  // ====== Supplier Applications ======
  insertMany("supplier_applications", [
    { id: "sa1", companyName: "丽江纳西手工艺坊", contactName: "和师傅", contactPhone: "139****1111", status: "pending" },
  ])

  // ====== Volunteer Activities (11 items) ======
  insertMany("volunteer_activities", [
    { id: "act-ongoing", title: "端午文化节·古城志愿服务", description: "协助端午文化节活动组织，包括赛龙舟观赛区秩序维护、游客引导、文化体验区志愿服务。", location: "丽江古城玉河广场主会场", startTime: "2026-07-06 10:00", endTime: "2026-07-06 15:00", timeMode: "multi", dailyStartTime: "09:00", dailyEndTime: "12:00", maxParticipants: 15, currentParticipants: 7, status: "in_progress", tags: [] },
    { id: "act-soon", title: "古城文化快闪·志愿者招募", description: "参与古城文化快闪活动，协助现场布置、道具搬运、游客互动引导。", location: "丽江古城四方街广场", startTime: "2026-07-06 12:08", endTime: "2026-07-06 16:00", timeMode: "multi", dailyStartTime: "10:00", dailyEndTime: "14:00", maxParticipants: 10, currentParticipants: 4, status: "published", tags: [] },
    { id: "act-hot", title: "纳西古乐传承·志愿导赏", description: "在世界文化遗产纳西古乐会现场，协助观众签到入场、秩序维护，并学习了解纳西古乐的历史与传承。", location: "丽江古城纳西古乐会（东大街）", startTime: "2026-07-09 19:00", endTime: "2026-07-09 21:00", timeMode: "multi", dailyStartTime: "19:00", dailyEndTime: "21:00", maxParticipants: 8, currentParticipants: 7, status: "published", tags: [] },
    { id: "act-multi", title: "古城文明旅游宣传周", description: "在古城主要景点设置宣传点，向游客发放文明旅游手册，劝导不文明行为。需连续服务3天。", location: "丽江古城木府前广场", startTime: "2026-07-10 14:00", endTime: "2026-07-12 17:00", timeMode: "multi", dailyStartTime: "14:00", dailyEndTime: "17:00", maxParticipants: 20, currentParticipants: 4, status: "published", tags: [] },
    { id: "act-multi-ongoing", title: "暑期古城秩序维护", description: "暑期旅游高峰期，协助古城各入口秩序维护、人流疏导。连续3天每天上午。", location: "丽江古城游客服务中心", startTime: "2026-07-05 09:00", endTime: "2026-07-07 12:00", timeMode: "multi", dailyStartTime: "09:00", dailyEndTime: "12:00", maxParticipants: 10, currentParticipants: 3, status: "in_progress", tags: [] },
    { id: "act-draft", title: "国庆黄金周古城秩序维护", description: "国庆假期游客高峰期，协助古城各入口秩序维护、人流疏导。10月1-3日每天上午8:00-12:00。", location: "丽江古城游客服务中心", startTime: "2026-07-26 08:00", endTime: "2026-07-28 12:00", timeMode: "multi", dailyStartTime: "08:00", dailyEndTime: "12:00", maxParticipants: 50, currentParticipants: 0, status: "draft", tags: [] },
    { id: "act-ended-ok", title: "古城公益导览·第三期", description: "第三期古城公益导览活动，为来丽游客提供免费导览服务，讲解古城历史与纳西文化。", location: "丽江古城大水车集合点", startTime: "2026-07-03 09:00", endTime: "2026-07-03 12:00", timeMode: "multi", dailyStartTime: "09:00", dailyEndTime: "12:00", maxParticipants: 20, currentParticipants: 4, status: "ended", tags: [] },
    { id: "act-ended-abnormal", title: "古城环境清洁日", description: "参与古城街道清洁、垃圾分类宣传志愿服务。", location: "丽江古城四方街", startTime: "2026-07-04 08:00", endTime: "2026-07-04 12:00", timeMode: "multi", dailyStartTime: "08:00", dailyEndTime: "12:00", maxParticipants: 20, currentParticipants: 4, status: "ended", tags: [] },
    { id: "act-ended-multi", title: "东巴文化传承讲座", description: "协助东巴文化传承讲座现场秩序维护、签到引导工作。连续3天下午场。", location: "丽江古城文化馆三楼报告厅", startTime: "2026-07-01 14:00", endTime: "2026-07-03 17:00", timeMode: "multi", dailyStartTime: "14:00", dailyEndTime: "17:00", maxParticipants: 30, currentParticipants: 4, status: "ended", tags: [] },
    { id: "act-cancelled", title: "古城摄影志愿服务", description: "因天气原因取消。原计划在古城各景点为游客提供免费拍照服务。", location: "丽江古城万古楼观景台", startTime: "2026-07-08 09:00", endTime: "2026-07-08 12:00", timeMode: "multi", dailyStartTime: "09:00", dailyEndTime: "12:00", maxParticipants: 10, currentParticipants: 3, status: "cancelled", tags: [] },
  ])

  // ====== Announcements (4 items) ======
  insertMany("announcements", [
    { id: "ann-1", title: "古城游览安全提醒", content: "温馨提示各位游客：\n1. 游览时请注意人身财产安全\n2. 妥善保管贵重物品\n3. 夜间行走请选择明亮路段\n4. 如遇紧急情况请联系：0888-5110110", images: ["https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=70"], type: "公告", publishTime: "2024-04-10T08:00:00Z", status: "published" },
    { id: "ann-2", title: "古城特产对外销售备案申请通道开放", content: "为规范古城特产销售市场，保障消费者权益，现已开通线上备案申请通道。\n\n备案范围：丽江特色产品、民族工艺品等\n备案流程：线上提交资料 → 审核 → 领取备案证明\n\n详情请咨询：0888-5123456", images: [], type: "公告", publishTime: "2024-04-15T09:00:00Z", status: "published" },
    { id: "ann-3", title: "古城水系清淤维护通知", content: "为保障古城水系清洁，营造良好游览环境，我局将对古城核心区水系进行清淤维护。\n\n施工时间：4月20日至4月25日\n施工范围：四方街至玉河广场段\n\n请各位游客合理安排游览路线，施工期间给您带来的不便敬请谅解。", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=70", "https://images.unsplash.com/photo-1590674899484-d5640f854c2d?auto=format&fit=crop&w=800&q=70"], type: "公告", publishTime: "2024-04-12T08:00:00Z", status: "published" },
    { id: "ann-4", title: "五一假期旅游攻略", content: "五一假期将至，为您准备了一份详细的古城游玩攻略。\n\n推荐路线：大水车 → 四方街 → 木府 → 狮子山 → 束河古镇\n\n美食推荐：丽江腊排骨、纳西烤鱼、鸡豆凉粉\n\n住宿建议：建议提前预订古城内客栈", images: ["https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=70", "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=70", "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70"], type: "公告", publishTime: "2024-04-08T10:00:00Z", status: "published" },
  ])

  // ====== Checkins (院落打卡, ~35 items) ======
  // Images from PHOTOS in source; users spread across u_c_001 / u_c_s_001 + demo user names
  const CHK_PHOTOS = [
    "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=400&q=70",
    "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=70",
    "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=400&q=70",
    "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=400&q=70",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=70",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=70",
    "https://images.unsplash.com/photo-1552526881-5517a57c17ae?auto=format&fit=crop&w=400&q=70",
    "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=400&q=70",
  ]
  insertMany("checkins", [
    { id: "chk-1", userId: "u_c_001", courtyardId: "1", imageUrl: CHK_PHOTOS[0], note: "木府参观打卡", lat: 26.8685, lng: 100.2312, createdAt: "2026-06-15 09:20" },
    { id: "chk-2", userId: "u_c_001", courtyardId: "5", imageUrl: CHK_PHOTOS[6], note: "四方街热闹", lat: 26.868, lng: 100.2345, createdAt: "2026-06-16 10:45" },
    { id: "chk-3", userId: "u_c_001", courtyardId: "24", imageUrl: CHK_PHOTOS[1], note: "大水车合影", lat: 26.872, lng: 100.232, createdAt: "2026-06-17 08:30" },
    { id: "chk-4", userId: "u_c_001", courtyardId: "2", imageUrl: CHK_PHOTOS[2], note: "方国瑜故居", lat: 26.8692, lng: 100.2356, createdAt: "2026-06-18 14:10" },
    { id: "chk-5", userId: "u_c_001", courtyardId: "3", imageUrl: CHK_PHOTOS[3], note: "登万古楼", lat: 26.8701, lng: 100.2298, createdAt: "2026-06-19 15:20" },
    { id: "chk-6", userId: "u_c_s_001", courtyardId: "4", imageUrl: CHK_PHOTOS[4], note: "纳西古乐现场", lat: 26.8668, lng: 100.2298, createdAt: "2026-06-20 20:15" },
    { id: "chk-7", userId: "u_c_s_001", courtyardId: "6", imageUrl: CHK_PHOTOS[5], note: "文昌宫", lat: 26.8712, lng: 100.2285, createdAt: "2026-06-21 11:00" },
    { id: "chk-8", userId: "u_c_001", courtyardId: "7", imageUrl: CHK_PHOTOS[6], note: "恒裕公民居", lat: 26.8698, lng: 100.2338, createdAt: "2026-06-22 10:00" },
    { id: "chk-9", userId: "u_c_001", courtyardId: "8", imageUrl: CHK_PHOTOS[7], note: "王丕震纪念馆", lat: 26.8675, lng: 100.2342, createdAt: "2026-06-23 09:15" },
    { id: "chk-10", userId: "u_c_s_001", courtyardId: "14", imageUrl: CHK_PHOTOS[0], note: "白马龙潭寺", lat: 26.866, lng: 100.226, createdAt: "2026-06-24 16:30" },
    { id: "chk-11", userId: "u_c_001", courtyardId: "15", imageUrl: CHK_PHOTOS[1], note: "三眼井", lat: 26.8695, lng: 100.2348, createdAt: "2026-06-25 12:00" },
    { id: "chk-12", userId: "u_c_001", courtyardId: "17", imageUrl: CHK_PHOTOS[2], note: "天地院一游", lat: 26.8683, lng: 100.2325, createdAt: "2026-06-26 13:40" },
    { id: "chk-13", userId: "u_c_s_001", courtyardId: "19", imageUrl: CHK_PHOTOS[3], note: "东巴纸坊体验", lat: 26.867, lng: 100.2338, createdAt: "2026-06-27 14:00" },
    { id: "chk-14", userId: "u_c_001", courtyardId: "21", imageUrl: CHK_PHOTOS[4], note: "古城画院", lat: 26.8686, lng: 100.232, createdAt: "2026-06-28 10:20" },
    { id: "chk-15", userId: "u_c_001", courtyardId: "22", imageUrl: CHK_PHOTOS[5], note: "忠义坊", lat: 26.8676, lng: 100.231, createdAt: "2026-06-29 09:50" },
    { id: "chk-16", userId: "u_c_s_001", courtyardId: "1", imageUrl: CHK_PHOTOS[6], note: "再访木府", lat: 26.8685, lng: 100.2312, createdAt: "2026-06-30 11:20" },
    { id: "chk-17", userId: "u_c_001", courtyardId: "5", imageUrl: CHK_PHOTOS[7], note: "四方街夜景", lat: 26.868, lng: 100.2345, createdAt: "2026-07-01 20:00" },
    { id: "chk-18", userId: "u_c_001", courtyardId: "12", imageUrl: CHK_PHOTOS[0], note: "净莲寺清晨", lat: 26.8705, lng: 100.2305, createdAt: "2026-07-01 07:30" },
    { id: "chk-19", userId: "u_c_s_001", courtyardId: "25", imageUrl: CHK_PHOTOS[1], note: "纳西人家民居", lat: 26.8697, lng: 100.236, createdAt: "2026-07-02 10:00" },
    { id: "chk-20", userId: "u_c_001", courtyardId: "9", imageUrl: CHK_PHOTOS[2], note: "周霖故居", lat: 26.869, lng: 100.2365, createdAt: "2026-07-02 15:30" },
    { id: "chk-21", userId: "u_c_001", courtyardId: "10", imageUrl: CHK_PHOTOS[3], note: "顾彼得旧居", lat: 26.8682, lng: 100.2328, createdAt: "2026-07-03 09:00" },
    { id: "chk-22", userId: "u_c_s_001", courtyardId: "11", imageUrl: CHK_PHOTOS[4], note: "洛克故居", lat: 26.8678, lng: 100.235, createdAt: "2026-07-03 11:10" },
    { id: "chk-23", userId: "u_c_001", courtyardId: "13", imageUrl: CHK_PHOTOS[5], note: "普贤寺", lat: 26.8672, lng: 100.2335, createdAt: "2026-07-04 08:45" },
    { id: "chk-24", userId: "u_c_001", courtyardId: "16", imageUrl: CHK_PHOTOS[6], note: "百岁坊", lat: 26.8688, lng: 100.2332, createdAt: "2026-07-04 14:20" },
    { id: "chk-25", userId: "u_c_s_001", courtyardId: "18", imageUrl: CHK_PHOTOS[7], note: "银饰坊参观", lat: 26.8693, lng: 100.234, createdAt: "2026-07-04 16:00" },
    { id: "chk-26", userId: "u_c_001", courtyardId: "20", imageUrl: CHK_PHOTOS[0], note: "和志刚书斋", lat: 26.8696, lng: 100.2358, createdAt: "2026-07-05 10:30" },
    { id: "chk-27", userId: "u_c_001", courtyardId: "23", imageUrl: CHK_PHOTOS[1], note: "官门口", lat: 26.8684, lng: 100.233, createdAt: "2026-07-05 12:15" },
    { id: "chk-28", userId: "u_c_s_001", courtyardId: "24", imageUrl: CHK_PHOTOS[2], note: "大水车早班", lat: 26.872, lng: 100.232, createdAt: "2026-07-05 07:45" },
    { id: "chk-29", userId: "u_c_001", courtyardId: "1", imageUrl: CHK_PHOTOS[3], note: "木府晚场", lat: 26.8685, lng: 100.2312, createdAt: "2026-07-05 17:00" },
    { id: "chk-30", userId: "u_c_001", courtyardId: "5", imageUrl: CHK_PHOTOS[4], note: "四方街集市", lat: 26.868, lng: 100.2345, createdAt: "2026-07-05 19:30" },
    { id: "chk-31", userId: "u_c_s_001", courtyardId: "6", imageUrl: CHK_PHOTOS[5], note: "文昌宫俯瞰", lat: 26.8712, lng: 100.2285, createdAt: "2026-07-06 08:00" },
    { id: "chk-32", userId: "u_c_001", courtyardId: "19", imageUrl: CHK_PHOTOS[6], note: "东巴纸再体验", lat: 26.867, lng: 100.2338, createdAt: "2026-07-06 09:40" },
    { id: "chk-33", userId: "u_c_001", courtyardId: "21", imageUrl: CHK_PHOTOS[7], note: "画院展览", lat: 26.8686, lng: 100.232, createdAt: "2026-07-06 11:00" },
    { id: "chk-34", userId: "u_c_s_001", courtyardId: "2", imageUrl: CHK_PHOTOS[0], note: "方国瑜故居再访", lat: 26.8692, lng: 100.2356, createdAt: "2026-07-06 13:30" },
    { id: "chk-35", userId: "u_c_001", courtyardId: "4", imageUrl: CHK_PHOTOS[1], note: "古乐会开演前", lat: 26.8668, lng: 100.2298, createdAt: "2026-07-06 18:15" },
  ])

  // ====== Naxi Checkins (3 items — u_c_001, 6/26-6/28) ======
  insertMany("naxi_checkins", [
    { id: "nx1", userId: "u_c_001", imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400", note: "", location: "五一街文治巷", lat: 26.869, lng: 100.235, createdAt: "2026-06-26 10:00" },
    { id: "nx2", userId: "u_c_001", imageUrl: "https://images.unsplash.com/photo-1552526881-5517a57c17ae?w=400", note: "", location: "四方街", lat: 26.868, lng: 100.2345, createdAt: "2026-06-27 11:00" },
    { id: "nx3", userId: "u_c_001", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", note: "", location: "木府前", lat: 26.8685, lng: 100.2312, createdAt: "2026-06-28 09:30" },
  ])

  // ====== Volunteers (3 items) ======
  insertMany("volunteers", [
    { id: "v1", userId: "u_c_001", name: "张小游", phone: "13800001001", politicalStatus: "群众", workUnit: "自由职业", credentialImages: ["https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400"], status: "approved", score: 15, reviewHistory: [{ action: "approved", note: "资料齐全", reviewedAt: "2026-05-20 10:00" }] },
    { id: "v2", userId: "u_c_s_001", name: "张老板", phone: "13800001002", politicalStatus: "中共党员", workUnit: "古城客栈", credentialImages: ["https://images.unsplash.com/photo-1586953208270-767889fa9b0e?w=400"], status: "approved", score: 40, reviewHistory: [{ action: "approved", note: "长期志愿者", reviewedAt: "2026-04-15 09:30" }] },
    { id: "v3", userId: "sv-p1", name: "赵小明", phone: "13800009001", politicalStatus: "群众", workUnit: "古城区社区居民", credentialImages: ["https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400"], status: "pending", score: 0, reviewHistory: [] },
  ])

  // ====== Volunteer Daily Records (5 items) ======
  insertMany("volunteer_daily_records", [
    { id: "vdr1", volunteerId: "v1", activityId: "act-ended-ok", checkInTime: "2026-07-03 09:00", checkOutTime: "2026-07-03 12:00", durationMinutes: 180, status: "completed" },
    { id: "vdr2", volunteerId: "v2", activityId: "act-ended-ok", checkInTime: "2026-07-03 09:05", checkOutTime: "2026-07-03 12:10", durationMinutes: 185, status: "completed" },
    { id: "vdr3", volunteerId: "v1", activityId: "act-ongoing", checkInTime: "2026-07-06 10:00", checkOutTime: null, durationMinutes: 0, status: "checked_in" },
    { id: "vdr4", volunteerId: "v2", activityId: "act-multi-ongoing", checkInTime: "2026-07-05 09:00", checkOutTime: "2026-07-05 12:00", durationMinutes: 180, status: "completed" },
    { id: "vdr5", volunteerId: "v2", activityId: "act-ended-multi", checkInTime: "2026-07-01 14:00", checkOutTime: "2026-07-01 17:00", durationMinutes: 180, status: "completed" },
  ])

  // ====== Merchant Registrations (2 items) ======
  insertMany("merchant_registrations", [
    { id: "mr1", userId: "u_c_s_001", merchantName: "银器工坊", category: "shopping", address: "新华街翠文段", contactName: "张老板", contactPhone: "13800001002", images: ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400"], status: "pending" },
    { id: "mr2", userId: "u_c_s_001", merchantName: "纳西手工艺展馆", category: "shopping", address: "七一街兴文巷12号", contactName: "张老板", contactPhone: "13800001002", images: ["https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400"], status: "approved", remark: "资料齐全，已批准" },
  ])

  // ====== Merchant Reviews (3 items — mcr1/mcr2/mcr3) ======
  insertMany("merchant_reviews", [
    { id: "mcr1", merchantId: "sup_001", userId: "u_c_s_001", fields: [
      { field: "name", label: "商家名称", oldValue: "古城文创·王老板", newValue: "古城文创集合店" },
      { field: "hours", label: "营业时间", oldValue: "09:00-22:00", newValue: "08:30-23:00" },
      { field: "phone", label: "联系电话", oldValue: "139-8888-3456", newValue: "139-8888-9999" },
    ], status: "pending", createdAt: "2026-06-28 10:00" },
    { id: "mcr2", merchantId: "sup_002", userId: "u_c_s_001", fields: [
      { field: "name", label: "商家名称", oldValue: "丽江云味餐厅", newValue: "纳西人家餐厅" },
      { field: "description", label: "商家简介", oldValue: "老式云南菜馆", newValue: "新升级的纳西风味餐厅，专注地道纳西美食" },
    ], status: "pending", createdAt: "2026-06-29 15:20" },
    { id: "mcr3", merchantId: "sup_001", userId: "u_c_s_001", fields: [
      { field: "name", label: "商家名称", oldValue: "古城文创·王老板", newValue: "雪山清吧" },
      { field: "barType", label: "酒吧类型", oldValue: "民谣清吧", newValue: "民谣驻唱+精酿啤酒" },
    ], status: "approved", remark: "管理员审核通过 2026-06-21", createdAt: "2026-06-18 09:00", updatedAt: "2026-06-21 14:30" },
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
