import type { ConvenienceOrder } from "../../../../shared/types"

/**
 * 便民服务种子订单 — 每状态 1 条，分属两位用户：
 * - u_c_001（张小游·游客）：点对点服务为主（行李搬运、送货）
 * - u_c_s_001（张老板·商户）：片区型服务为主（垃圾清运、送水、布草）+ 行李搬运
 *
 * 覆盖 11 种状态：S10 / A10 / A20 / A30 / A35 / A40 / S48 / S55 / S40 / S50 / S90 + cancelRequested
 */
export const SEED_ORDERS: ConvenienceOrder[] = [
  // ── 张小游（游客）──
  // S10 已下单：送货服务
  { id: "CO20260511005", userId: "u_c_001", serviceType: "送货服务", address: "五一街文治巷88号", images: ["https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400"], note: "一箱饮料，约15kg", preferredTime: "尽快", status: "S10", createdAt: "2026-05-11 15:30", lat: 26.878, lng: 100.239 },
  // A20 已指派：行李搬运
  { id: "CO20260511001", userId: "u_c_001", serviceType: "行李搬运", address: "古城南门入口处", addressTo: "五一街兴仁巷12号", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "两个28寸行李箱，需推车", preferredTime: "尽快", status: "A20", createdAt: "2026-05-11 09:12", staffId: "s1", staffName: "李师傅", staffPhone: "139****6666", lat: 26.868, lng: 100.234 },
  // A35 已核价：行李搬运（待支付）
  { id: "CO20260512007", userId: "u_c_001", serviceType: "行李搬运", address: "七一街兴文巷32号", addressTo: "五一街振兴巷18号", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "2个行李箱", preferredTime: "10:00", status: "A35", priceQuote: 60, refPrice: 50, payMethod: "online", createdAt: "2026-05-12 08:00", staffId: "s2", staffName: "赵丹", staffPhone: "138****1234", lat: 26.870, lng: 100.236 },
  // S55 完工待确认：行李搬运
  { id: "CO20260509000", userId: "u_c_001", serviceType: "行李搬运", address: "古城北门 → 四方街", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "3个行李箱，已放至客栈前台", preferredTime: "尽快", status: "S55", priceQuote: 80, refPrice: 70, payMethod: "online", createdAt: "2026-05-09 10:00", staffId: "s1", staffName: "李师傅", staffPhone: "139****6666", completionPhotos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], lat: 26.872, lng: 100.230 },
  // S40 已完成：行李搬运
  { id: "CO20260509001", userId: "u_c_001", serviceType: "行李搬运", address: "古城东门 → 七一街", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "已送达", preferredTime: "上午", status: "S40", priceQuote: 60, refPrice: 50, payMethod: "online", createdAt: "2026-05-09 08:42", completedAt: "2026-05-09T12:00:00.000Z", staffId: "s1", staffName: "李师傅", lat: 26.870, lng: 100.237 },
  // S50 已取消：行李搬运（游客改约时间）
  { id: "CO20260507003", userId: "u_c_001", serviceType: "行李搬运", address: "古城南门 → 七一街", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "改约时间", preferredTime: "上午", status: "S50", createdAt: "2026-05-07 10:25", staffId: "s1", lat: 26.868, lng: 100.234 },

  // ── 张老板（商户）──
  // A10 待派单：建筑垃圾清运（客栈装修）
  { id: "CO20260511006", userId: "u_c_s_001", serviceType: "建筑垃圾清运", address: "新华街翠文段22号", images: ["https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400"], note: "装修废料，约8袋，需大车", preferredTime: "14:00", status: "A10", createdAt: "2026-05-11 14:00", lat: 26.875, lng: 100.232 },
  // A30 已接单：行李搬运（张老板也是叠角色，可作为商户使用便民服务）
  { id: "CO20260511008", userId: "u_c_s_001", serviceType: "行李搬运", address: "新华街翠文段15号", addressTo: "七一街崇仁巷", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "客栈物资搬运", preferredTime: "尽快", status: "A30", createdAt: "2026-05-11 09:30", staffId: "s2", staffName: "赵丹", staffPhone: "138****1234", lat: 26.874, lng: 100.233 },
  // A40 已收款：送水服务
  { id: "CO20260512008", userId: "u_c_s_001", serviceType: "送水服务", address: "光义街现文巷28号", images: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400"], note: "2桶矿泉水，客房用水", preferredTime: "14:00-15:00", status: "A40", priceQuote: 30, refPrice: 25, payMethod: "online", createdAt: "2026-05-12 11:00", staffId: "s5", staffName: "送水工老赵", staffPhone: "139****5678", lat: 26.874, lng: 100.234 },
  // S48 服务中：送水服务
  { id: "CO20260510003", userId: "u_c_s_001", serviceType: "送水服务", address: "新华街翠文段8号", images: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400"], note: "4桶矿泉水", preferredTime: "10:00-11:00", status: "S48", priceQuote: 40, refPrice: 35, payMethod: "online", createdAt: "2026-05-10 10:30", staffId: "s5", staffName: "送水工老赵", staffPhone: "139****5678", lat: 26.875, lng: 100.232 },
  // S90 待人工处理：行李搬运（支付超时）
  { id: "CO20260508003", userId: "u_c_s_001", serviceType: "行李搬运", address: "古城北门", addressTo: "五一街振兴巷", images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"], note: "3个行李箱，在线支付超时", preferredTime: "上午", status: "S90", priceQuote: 70, refPrice: 60, payMethod: "online", createdAt: "2026-05-08 09:00", staffId: "s1", lat: 26.872, lng: 100.230 },
  // A35 + cancelRequested：送水服务取消申请
  { id: "CO20260509005", userId: "u_c_s_001", serviceType: "送水服务", address: "御客栈·二号院", images: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400"], note: "2桶矿泉水，已自行联系水站，取消工单", preferredTime: "尽快", status: "A35", cancelRequested: true, priceQuote: 30, refPrice: 25, payMethod: "online", createdAt: "2026-05-09 14:00", staffId: "s5", lat: 26.879, lng: 100.238 },
]