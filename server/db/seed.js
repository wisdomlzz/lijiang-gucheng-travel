// 种子数据 — 直接从各个前端 store 的 seed 文件聚合而来，写入 JSON 文件
import { writeFileSync, existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "data")

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

// 如果数据文件已存在，跳过 seed（防止重启覆盖用户数据）
const dataFile = join(DATA_DIR, "convenience_orders.json")
const shouldSkip = existsSync(dataFile)

function writeTable(name, data) {
  writeFileSync(join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2), "utf-8")
}

export function seed() {
  const now = new Date().toISOString()
  const n = (s) => s ?? null

  // Convenience orders
  const orders = [
    { id: "CO20260511005", userId: "u_c_001", serviceType: "送货服务", address: "五一街文治巷88号", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], note: "一箱饮料，约15kg", preferredTime: "尽快", status: "S10", createdAt: "2026-05-11 15:30", lat: 26.878, lng: 100.239 },
    { id: "CO20260511001", userId: "u_c_001", serviceType: "行李搬运", address: "古城北门 → 四方街", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "3个行李箱", preferredTime: "尽快", status: "A20", priceQuote: 80, refPrice: 70, createdAt: "2026-05-11 10:00", staffId: "s1", staffName: "李师傅", staffPhone: "139****6666", lat: 26.872, lng: 100.23 },
    { id: "CO20260511002", userId: "u_c_s_001", serviceType: "建筑垃圾清运", address: "五一街振兴巷12号", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], note: "装修产生的砖块和水泥块约3方", preferredTime: "尽快", status: "A35", priceQuote: 60, refPrice: 50, createdAt: "2026-05-11 09:00", staffId: "s3", staffName: "张环卫", staffPhone: "139****6668", lat: 26.876, lng: 100.237 },
    { id: "CO20260511003", userId: "u_c_s_001", serviceType: "布草配送", address: "七一街兴文巷", images: ["https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400"], note: "50套布草", preferredTime: "2026-05-11 14:00", status: "S55", priceQuote: 80, refPrice: 70, payMethod: "online", createdAt: "2026-05-11 10:00", staffId: "s1", staffName: "李师傅", staffPhone: "139****6666", completionPhotos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], paymentProof: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400", lat: 26.872, lng: 100.23 },
    { id: "CO20260509001", userId: "u_c_001", serviceType: "行李搬运", address: "古城东门 → 七一街", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "已送达", preferredTime: "上午", status: "S40", priceQuote: 60, refPrice: 50, payMethod: "online", createdAt: "2026-05-09 08:30", staffId: "s1", staffName: "李师傅", staffPhone: "139****6666", rating: 5, ratedAt: "2026-05-09 12:00", completedAt: "2026-05-09 11:00", lat: 26.875, lng: 100.233 },
    { id: "CO20260510001", userId: "u_c_001", serviceType: "送货服务", address: "四方街", images: [], note: "生鲜食材一批", preferredTime: "尽快", status: "S50", createdAt: "2026-05-10 16:00", lat: 26.874, lng: 100.232 },
    { id: "CO20260511004", userId: "u_c_s_001", serviceType: "生活垃圾清运", address: "光义街官门口", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], note: "日常垃圾清运", preferredTime: "每日定时", status: "A10", createdAt: "2026-05-11 06:00", lat: 26.869, lng: 100.234 },
    { id: "CO20260511006", userId: "u_c_s_001", serviceType: "生活垃圾清运", address: "新华街", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], note: "三个垃圾桶需要清运", preferredTime: "尽快", status: "S48", priceQuote: 60, refPrice: 40, payMethod: "cash", createdAt: "2026-05-11 07:00", staffId: "s3", staffName: "张环卫", staffPhone: "139****6668", lat: 26.879, lng: 100.239 },
    { id: "CO20260511007", userId: "u_c_s_001", serviceType: "送水服务", address: "五一街文治巷88号", images: ["https://images.unsplash.com/photo-1560785496-3c9d27877182?w=400"], note: "10桶18L桶装水", preferredTime: "尽快", status: "S90", priceQuote: 70, refPrice: 50, createdAt: "2026-05-11 11:00", lat: 26.878, lng: 100.239 },
  ]
  writeTable("convenience_orders", orders.map(o => ({ ...o, createdAt: o.createdAt || now, updatedAt: now })))

  // Staff
  const staff = [
    { id: "s1", supplierId: "sup_001", name: "李师傅", phone: "139****6666", enabled: true, status: "busy", assignedOrders: 3, joinedAt: "2026-02-01", serviceTypes: ["行李搬运", "送货服务"], lat: 26.872, lng: 100.231 },
    { id: "s2", supplierId: "sup_001", name: "赵丹", phone: "139****6667", enabled: true, status: "online", assignedOrders: 1, joinedAt: "2026-02-15", serviceTypes: ["行李搬运", "送货服务"], lat: 26.873, lng: 100.236 },
    { id: "s3", supplierId: "sup_001", name: "张环卫", phone: "139****6668", enabled: true, status: "online", assignedOrders: 2, joinedAt: "2026-03-01", serviceTypes: ["生活垃圾清运", "建筑垃圾清运"], zoneIds: ["zone_core", "zone_south"], lat: 26.874, lng: 100.233 },
    { id: "s4", supplierId: "sup_001", name: "马师傅", phone: "139****6669", enabled: true, status: "online", assignedOrders: 0, joinedAt: "2026-03-15", serviceTypes: ["生活垃圾清运", "建筑垃圾清运"], zoneIds: ["zone_inn", "zone_outskirt"], lat: 26.879, lng: 100.239 },
    { id: "s5", supplierId: "sup_001", name: "杨送水", phone: "139****6670", enabled: true, status: "online", assignedOrders: 1, joinedAt: "2026-04-01", serviceTypes: ["送水服务"], zoneIds: ["zone_core"], lat: 26.878, lng: 100.228 },
    { id: "s6", supplierId: "sup_001", name: "周布草", phone: "139****6671", enabled: true, status: "rest", assignedOrders: 0, joinedAt: "2026-04-10", serviceTypes: ["布草配送"], zoneIds: ["zone_south", "zone_inn"], lat: 26.87, lng: 100.235 },
  ]
  writeTable("staff", staff.map(s => ({ ...s, createdAt: now, updatedAt: now })))

  // Content: News
  writeTable("content_news", [
    { id: "1", title: "丽江古城12处直管公房公开招租公告", category: "公房公告", tag: "热门活动", tagColor: "#3B82F6", date: "2026-04-21", summary: "丽江古城旅游发展有限责任公司直管公房12处拟面向社会公开招租", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800", createdAt: now, updatedAt: now },
    { id: "2", title: "古城春日文化节开幕", category: "其它", tag: "热门活动", tagColor: "#3B82F6", date: "04-25", summary: "丽江古城春日文化节将于4月25日盛大开幕", imageUrl: "https://images.unsplash.com/photo-AWinVtCXVQY?w=800", createdAt: now, updatedAt: now },
    { id: "3", title: "景区安全须知", category: "其它", tag: "公告", tagColor: "#F59E0B", date: "04-20", summary: "请各位游客注意游览安全", imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800", createdAt: now, updatedAt: now },
  ])

  // Content: Routes
  writeTable("content_routes", [
    { id: "r1", name: "古城一日游", tags: ["经典", "步行"], duration: "6小时", distance: "3.5km", stops: 8, spotNames: ["大水车", "四方街", "木府", "狮子山"], description: "丽江古城经典一日游路线", cover: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800", createdAt: now, updatedAt: now },
    { id: "r2", name: "文化探访之旅", tags: ["文化", "院落"], duration: "4小时", distance: "2.0km", stops: 5, spotNames: ["方国瑜故居", "王丕震纪念馆", "木府"], description: "探访古城深巷中的文化院落", createdAt: now, updatedAt: now },
  ])

  // Content: Courtyards
  writeTable("content_courtyards", [
    { id: "c1", name: "木府", location: "古城中心", hours: "08:30-17:30", description: "木府是丽江古城的文化地标", imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400", tags: ["历史", "建筑"], createdAt: now, updatedAt: now },
    { id: "c2", name: "方国瑜故居", location: "五一街", hours: "09:00-17:00", description: "著名历史学家方国瑜故居", imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400", tags: ["文化", "名人"], createdAt: now, updatedAt: now },
  ])

  // Content: Merchants
  writeTable("content_merchants", [
    { id: "m1", name: "古城小院餐厅", category: "餐饮", address: "五一街文明巷88号", phone: "158****8888", createdAt: now, updatedAt: now },
    { id: "m2", name: "纳西银饰坊", category: "购物", address: "新华街崇仁巷67号", phone: "139****7777", createdAt: now, updatedAt: now },
  ])

  // Content: POIs
  writeTable("content_pois", [
    { id: "poi1", name: "大水车", category: "scenic_spot", address: "古城北入口", lat: 26.872, lng: 100.231, createdAt: now, updatedAt: now },
    { id: "poi2", name: "四方街", category: "scenic_spot", address: "古城中心", lat: 26.870, lng: 100.234, createdAt: now, updatedAt: now },
    { id: "poi3", name: "木府", category: "scenic_spot", address: "关门口", lat: 26.868, lng: 100.236, createdAt: now, updatedAt: now },
    { id: "poi4", name: "黑龙潭公园", category: "scenic_spot", address: "古城北", lat: 26.880, lng: 100.225, createdAt: now, updatedAt: now },
  ])

  // Content: Housing
  writeTable("content_housing", [
    { id: 1, name: "光义街9号公房", addr: "丽江市古城区光义街9号（铺面）", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["267.74㎡", "特色食品", "砖木结构"], createdAt: now, updatedAt: now },
    { id: 2, name: "新院巷63号公房", addr: "丽江市古城区新院巷63号", status: "idle", statusText: "未出租", area: "gucheng", areaName: "古城区", meta: ["185.50㎡", "闲置", "木结构"], createdAt: now, updatedAt: now },
    { id: 3, name: "五一街32号公房", addr: "丽江市古城区五一街32号", status: "rented", statusText: "出租", area: "gucheng", areaName: "古城区", meta: ["156.30㎡", "饰品", "砖混结构"], createdAt: now, updatedAt: now },
  ])

  // Banners
  writeTable("banners", [
    { id: "b1", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800", title: "丽江古城欢迎您", scene: "home", enabled: true, order: 0, createdAt: now, updatedAt: now },
    { id: "b2", imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800", title: "文化院落之旅", scene: "home", enabled: true, order: 1, createdAt: now, updatedAt: now },
  ])

  // Points rules
  writeTable("points_rules", [
    { code: "courtyard_checkin", label: "院落打卡", points: 5, dailyLimit: 10, direction: "IN", enabled: true },
    { code: "naxi_streak", label: "纳西人连续打卡", points: 50, dailyLimit: 1, direction: "IN", enabled: true },
    { code: "volunteer_service", label: "志愿服务", points: 2, dailyLimit: 100, direction: "IN", enabled: true },
    { code: "mall_purchase", label: "商城消费", points: 1, direction: "IN", enabled: true },
    { code: "mall_redeem", label: "积分兑换", points: 1, direction: "OUT", enabled: true },
  ])

  // Points accounts
  writeTable("points_accounts", [
    { userId: "u_c_001", balance: 320, totalEarned: 380, totalUsed: 60, updatedAt: now },
    { userId: "u_b_001", balance: 150, totalEarned: 200, totalUsed: 50, updatedAt: now },
  ])
  writeTable("points_ledgers", [])

  // Reviews
  writeTable("reviews", [
    { id: "rev_001", orderId: "CO20260511001", serviceType: "行李搬运", staffId: "s1", staffName: "李师傅", userId: "u_c_001", userName: "张小游", rating: 5, content: "李师傅服务特别好，准时到达！", images: [], createdAt: now, updatedAt: now },
    { id: "rev_002", orderId: "CO20260509001", serviceType: "行李搬运", staffId: "s1", staffName: "李师傅", userId: "u_c_s_001", userName: "张老板", rating: 5, content: "客栈客人行李多，李师傅一趟趟搬完", images: [], replyContent: "多谢老板夸奖！", repliedAt: now, createdAt: now, updatedAt: now },
    { id: "rev_003", orderId: "CO20260511002", serviceType: "建筑垃圾清运", staffId: "s3", staffName: "张环卫", userId: "u_c_s_001", userName: "张老板", rating: 3, content: "清运还算及时，但现场没有打扫干净", images: [], followUp: true, createdAt: now, updatedAt: now },
    { id: "rev_004", orderId: "CO20260511006", serviceType: "生活垃圾清运", staffId: "s3", staffName: "张环卫", userId: "u_c_s_001", userName: "张老板", rating: 5, content: "每天准时清运，非常负责", images: [], replyContent: "应该的", repliedAt: now, createdAt: now, updatedAt: now },
  ])

  // Complaints
  writeTable("complaints", [
    { id: "CP001", orderId: "CO20260511001", userId: "u_c_001", type: "服务态度", content: "便民服务人员沟通态度不好", images: ["https://images.unsplash.com/photo-1562621019-4d2f3980df96?w=400"], status: "C10", targetName: "便民服务人员", reporterType: "游客", reporterName: "张小游", createdAt: now, updatedAt: now },
    { id: "CP002", orderId: "CO20260511007", userId: "u_c_s_001", type: "价格争议", content: "现场报价和参考价格差距较大", images: ["https://images.unsplash.com/photo-1562572159-4efc207a5a1e?w=400"], status: "C40", targetName: "送水服务", reporterType: "本地居民", reporterName: "和女士", result: "已与商家核实", handledAt: now, createdAt: now, updatedAt: now },
  ])

  // Grid items
  writeTable("grid_items", [
    { id: "g1", imageUrl: "/icons/便民服务@2x.png", label: "便民服务", route: "/c/services", page: 1, visible: true, order: 1, createdAt: now, updatedAt: now },
    { id: "g2", imageUrl: "/icons/购在古城@2x.png", label: "购在古城", route: "/c/merchants", page: 1, visible: true, order: 2, createdAt: now, updatedAt: now },
    { id: "g3", imageUrl: "/icons/导览地图@2x.png", label: "导览地图", route: "/c/map", page: 1, visible: true, order: 3, createdAt: now, updatedAt: now },
  ])

  // Volunteer activities
  writeTable("volunteer_activities", [
    { id: "va1", title: "古城环保志愿活动", description: "清理古城街道，维护环境卫生", location: "四方街", startTime: "2026-06-01 09:00", endTime: "2026-06-01 12:00", maxParticipants: 30, status: "published", currentParticipants: 0, createdAt: now, updatedAt: now },
  ])

  // AI knowledge
  writeTable("ai_knowledge", [
    { id: "k1", question: "丽江古城有什么必去的景点？", answer: "四方街、木府、大水车、黑龙潭、狮子山万古楼都是经典景点。", category: "景点", enabled: true, createdAt: now, updatedAt: now },
    { id: "k2", question: "丽江古城的门票是多少？", answer: "丽江古城本身不收取门票，但木府等文化院落需要单独购票。", category: "票务", enabled: true, createdAt: now, updatedAt: now },
    { id: "k3", question: "丽江古城有什么特色美食？", answer: "鸡豆凉粉、丽江粑粑、纳西烤鱼、腊排骨火锅都是当地特色。", category: "美食", enabled: true, createdAt: now, updatedAt: now },
    { id: "k4", question: "丽江古城怎么去？", answer: "从丽江三义机场可乘机场大巴到市区，打车约30分钟。", category: "交通", enabled: true, createdAt: now, updatedAt: now },
  ])

  // Supplier applications
  writeTable("supplier_applications", [
    { id: "sa1", companyName: "丽江纳西手工艺坊", contactName: "和师傅", contactPhone: "139****1111", status: "pending", createdAt: now, updatedAt: now },
  ])

  // Trust threshold
  writeTable("trust_thresholds", [{ id: 1, defaultScore: 100, delinquentThreshold: 60, autoRecover: true, recoverScore: 70 }])

  // Trust scores
  writeTable("trust_scores", [
    { staffId: "s1", supplierId: "sup_001", name: "李师傅", roleTag: "便民服务人员", trustScore: 78, status: "正常", totalOrders: 156, totalRatings: 142, rating5Count: 98, rating4Count: 35, rating3Count: 5, rating2Count: 3, rating1Count: 1, complaintCount: 3, rejectionCount: 1, scoreHistory: [{ id: "h1", date: "2026-05-01", change: -3, reason: "服务迟到投诉" }], createdAt: now, updatedAt: now },
    { staffId: "s3", supplierId: "sup_001", name: "张环卫", roleTag: "便民服务人员", trustScore: 88, status: "正常", totalOrders: 234, totalRatings: 220, rating5Count: 180, rating4Count: 30, rating3Count: 6, rating2Count: 3, rating1Count: 1, complaintCount: 5, rejectionCount: 2, createdAt: now, updatedAt: now },
  ])

  // Empty tables that need initial files
  writeTable("zones", [])
  writeTable("dispatch_configs", [])
  writeTable("income_records", [])
  writeTable("withdrawal_requests", [])
  writeTable("service_configs", [])
  writeTable("checkins", [])
  writeTable("naxi_checkins", [])
  writeTable("addresses", [])
  writeTable("favorites", [])
  writeTable("volunteers", [])
  writeTable("volunteer_daily_records", [])
  writeTable("score_rules", [])
  writeTable("merchant_registrations", [])
  writeTable("merchant_reviews", [])
  writeTable("bookings", [])
  writeTable("suppliers", [])

  console.log("🌱 Seed data written to", DATA_DIR)
}

// 直接执行时 seed，被 import 时不自动运行
const isDirectRun = typeof process !== "undefined" && process.argv[1]?.endsWith("seed.js")
if (isDirectRun && !shouldSkip) seed()