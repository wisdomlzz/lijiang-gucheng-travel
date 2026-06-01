// ====== 便民服务状态码（S/A 系列） ======
export type ConvenienceStatus =
  | "S10"  // 已下单
  | "A10"  // 待派单
  | "A20"  // 已指派
  | "A30"  // 已接单
  | "A35"  // 已核价
  | "A38"  // 协商中
  | "A40"  // 已收款
  | "S48"  // 服务中
  | "S55"  // 完工待确认
  | "S40"  // 已完成
  | "S50"  // 已取消
  | "R80"  // 取消审批中
  | "S90"  // 待人工处理

export const ConvenienceStatusLabel: Record<ConvenienceStatus, string> = {
  S10: "已下单", A10: "待派单", A20: "已指派", A30: "已接单", A35: "已核价",
  A38: "协商中", A40: "已收款", S48: "服务中", S55: "完工待确认", S40: "已完成",
  S50: "已取消", R80: "取消审批中", S90: "待人工处理",
}

// ====== 投诉状态码 ======
// 简化流程：已提交 → 已处理 或 已驳回
export type ComplaintStatus =
  | "C10"  // 已提交
  | "C40"  // 已处理
  | "CR"   // 已驳回

export const ComplaintStatusLabel: Record<ComplaintStatus, string> = {
  C10: "已提交", C40: "已处理", CR: "已驳回",
}

// ====== 用户/角色 ======
export type Platform = "c" | "b" | "desktop"

export type UnifiedRole = "platform_admin" | "supplier" | "service" | "tourist"

export type ServiceType = "convenience"

export type User = {
  id: string
  name: string
  phone: string
  avatar?: string
  platform: Platform[]
  role: UnifiedRole
  staffType?: ServiceType
  supplierId?: string
  staffId?: string
  roleTag?: string
}

// ====== 便民服务类型 ======
export type ConvenienceServiceType =
  | "送货服务" | "行李搬运"
  | "建筑垃圾清运" | "生活垃圾清运" | "送水服务" | "布草配送"

export const POINT_TO_POINT_TYPES: ConvenienceServiceType[] = ["送货服务", "行李搬运"]
export const ZONE_BASED_TYPES: ConvenienceServiceType[] = ["建筑垃圾清运", "生活垃圾清运", "送水服务", "布草配送"]
export const ALL_CONVENIENCE_TYPES: ConvenienceServiceType[] = [...POINT_TO_POINT_TYPES, ...ZONE_BASED_TYPES]

export function isPointToPoint(type: string): boolean {
  return POINT_TO_POINT_TYPES.includes(type as ConvenienceServiceType)
}
export function isZoneBased(type: string): boolean {
  return ZONE_BASED_TYPES.includes(type as ConvenienceServiceType)
}

// ====== 片区与服务站 ======
export type ServiceStation = {
  id: string
  zoneId: string
  serviceType: ConvenienceServiceType
  name: string
  address: string
  lat: number
  lng: number
}

export type Zone = {
  id: string
  name: string
  stations: ServiceStation[]
}

// ====== 服务人员片区分配 ======
export type StaffZoneAssignment = {
  staffId: string
  serviceTypes: ConvenienceServiceType[]
  zoneIds: string[]
  lat: number
  lng: number
}

// ====== 便民服务订单 ======
export type ConvenienceOrder = {
  id: string
  userId: string
  serviceType: ConvenienceServiceType | string
  address: string
  addressTo?: string
  images: string[]
  note: string
  preferredTime: string
  status: ConvenienceStatus
  priceQuote?: number
  refPrice?: number
  payMethod?: "online" | "cash"
  createdAt: string
  staffId?: string
  staffName?: string
  staffPhone?: string
  complaintId?: string
  paymentProof?: string
  completionPhotos?: string[]
  rating?: number
  ratedAt?: string
  completedAt?: string
  priceDispute?: {
    targetPrice?: number
    reason?: string
    images?: string[]
    submittedAt?: string
  }
  // 派单用坐标
  lat?: number
  lng?: number
  // 取消审批驳回恢复用：记录取消发起时的状态
  previousStatus?: ConvenienceStatus
  arbitrationRemark?: string
}

// ====== 投诉 ======
export type Complaint = {
  id: string
  orderId: string
  userId: string
  type: string
  content: string
  images: string[]
  status: ComplaintStatus
  createdAt: string
  targetName?: string
  reporterType?: "工作人员" | "本地居民" | "游客"
  reporterName?: string
  reporterGender?: "男" | "女"
  reporterPhone?: string
  objectType?: "酒吧" | "客栈" | "旅拍摄影" | "餐饮" | "商品零售" | "民居" | "公共环境" | "其他" | "个人"
  incidentArea?: string
  incidentLocation?: string
  doorplate?: string
  channelNote?: string
  result?: string
  handledAt?: string
}

// ====== 桌面端权限 ======
export type PermissionAction = {
  code: string
  label: string
}

export type PermissionPage = {
  code: string
  label: string
  actions: PermissionAction[]
}

export type PermissionModule = {
  code: string
  label: string
  pages: PermissionPage[]
}

export type RolePermission = {
  roleId: string
  roleName: string
  description: string
  permissions: string[]
}

// ====== AI 知识库 ======
export type KnowledgeItem = {
  id: string
  question: string
  answer: string
  status: "enabled" | "disabled"
  createdAt: string
  updatedAt: string
}

// ====== 打卡 ======
export interface Checkin {
  id: string
  courtyardId: string
  courtyardName: string
  userId: string
  userName: string
  photo: string
  location: { lat: number; lng: number }
  address: string
  createdAt: string
  status: "pending" | "approved" | "rejected"
}

// ====== 首页配置 ======
export interface GridItemConfig {
  id: string
  imageUrl: string
  label: string
  route: string
  search?: string
  page: 1 | 2
  visible: boolean
  order: number
}

export interface BannerConfig {
  id: string
  scene: "home" | "shop"
  imageUrl: string
  title: string
  subtitle: string
  badge: string
  link: string
  order: number
  visible: boolean
}

// ====== 供应商入驻 ======
export interface SupplierApplication {
  id: string
  companyName: string
  contactName: string
  phone: string
  businessType: string
  address: string
  licenseNo: string
  licenseImg: string
  description: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewer?: string
  rejectReason?: string
}

// ====== 便民服务（C 端列表） ======
export type ConvenienceService = {
  id: string
  name: string
  price: string
  emoji: string
  image: string
  tag: string
  tagColor: string
  unit: string
  type: "grid" | "point"
  description: string
  priceNote: string
}

// ====== 服务人员 ======
export type StaffItem = {
  id: string
  supplierId: string
  name: string
  phone: string
  enabled: boolean
  status: "online" | "busy" | "rest" | "offline"
  assignedOrders: number
  joinedAt: string
  serviceTypes?: ConvenienceServiceType[]
  zoneIds?: string[]
  lat?: number
  lng?: number
}

// ====== 派单日志 ======
export type DispatchLogEntry = {
  orderId: string
  type: "auto_success" | "auto_fail" | "manual" | "retry"
  staffId?: string
  staffName?: string
  reason?: string
  timestamp: string
}

// ====== 地址 ======
export type Address = {
  id: string
  userId: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}

// ====== 评价 ======
export type Review = {
  orderId: string
  userId: string
  rating: number
  staffRating?: number
  content: string
  images: string[]
  createdAt: string
  autoRated?: boolean
  reply?: string
}

// ====== 收藏 ======
export type FavoriteItem = {
  id: string
  userId: string
  type: "merchant" | "route" | "article"
  itemId: number
  name: string
  img: string
  price?: number
  shop?: string
  savedAt: string
}

// ====== 志愿服务 ======
export type Volunteer = {
  id: string
  userId: string
  name: string
  phone: string
  politicalStatus: string
  workUnit: string
  createdAt: string
}

export type VolunteerActivity = {
  id: string
  title: string
  description: string
  images: string[]
  location: string
  startTime: string
  endTime: string
  signUpDeadline: string
  maxParticipants: number
  status: "draft" | "published" | "ended"
  createdAt: string
}

export type VolunteerSignUp = {
  id: string
  volunteerId: string
  activityId: string
  signUpTime: string
  checkInTime?: string
  checkOutTime?: string
  serviceHours?: number
  status: "signed_up" | "checked_in" | "checked_out"
}
export type NotificationType = "order" | "activity" | "system"

export type Notification = {
  id: string
  type: NotificationType
  title: string
  summary: string
  time: string
  isRead: boolean
  targetUrl?: string
  createdAt: string
}
