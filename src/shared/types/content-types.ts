export interface RouteSpot {
  id: string
  name: string
  desc: string
  top: string
  left: string
}

export type ContentBlockType = "text" | "image" | "video"

export interface ContentBlock {
  id: string
  type: ContentBlockType
  text?: string
  imageUrl?: string
  imageCaption?: string
  videoUrl?: string
  videoCoverUrl?: string
  videoDuration?: string
  videoCaption?: string
}

export interface TravelGuide {
  id: string
  name: string
  tags: string[]
  duration: string
  difficulty: string
  stops: number
  distance: string
  spotNames: string[]
  description: string
  cover: string
  spots: RouteSpot[]
  hasVideo?: boolean
  videoUrl?: string
  videoCoverUrl?: string
  videoDuration?: string
  contentBlocks?: ContentBlock[]
}

export type ParkingType = "self_operated" | "third_party"

export interface ParkingLot {
  id: string
  name: string
  type: ParkingType
  size: "large" | "medium" | "small"
  totalSpots: number
  availableSpots?: number
  rate: string
  hours: string
  distance: string
  address: string
  lat: number
  lng: number
  createdAt?: string
  imageUrl?: string
  contactPhone?: string
  description?: string
  features?: string[]
  status: "open" | "closed" | "full"
}

export type NewsCategory = "公房公告" | "房屋信息" | "举贤纳仕" | "其它"

export interface NewsItem {
  id: string
  imageUrl: string
  title: string
  tag: string
  tagColor: string
  date: string
  summary: string
  category: NewsCategory
  heroTitle?: string
  body?: string[]
  subImage?: string
}

export interface Courtyard {
  id: string
  name: string
  title?: string
  tags?: string[]
  tagContent?: string
  summary?: string
  description: string
  location: string
  hours: string
  createdAt?: string
  imageUrl: string
  phone?: string
  vrImageUrl?: string
  audioGuideUrl?: string
  remark?: string
  gallery?: string[]
  lat?: number
  lng?: number
  contentBlocks?: ContentBlock[]
}

export interface Certificate {
  type: string
  label: string
  no: string
  validUntil: string
  img: string
}

export interface Merchant {
  id: string
  name: string
  category: string
  source?: "后台添加" | "商家提交"
  reviewStatus?: "通过" | "不通过" | "待审核"
  publishedAt?: string
  logo: string
  cover: string
  description: string
  address: string
  phone: string
  hours: string
  vrImageUrl?: string
  relatedUser?: string
  productImageUrl?: string
  qualificationText?: string
  barType?: string
  boothCount?: number
  seatCount?: number
  performanceStartTime?: string
  performanceDuration?: string
  rating: number
  reviewCount: number
  creditScore: number
  openYear: number
  distance?: string
  lat?: number
  lng?: number
  gallery: string[]
  certificates: Certificate[]

  // === 新增：店铺认领状态 ===
  claimStatus?: "unclaimed" | "pending" | "claimed"
  claimedBy?: string // 认领者的 userId
  claimedAt?: string // 认领时间

  // === 店铺详细信息 ===
  businessLicense?: string
  contactName?: string
  contactPhone?: string
  detailImages?: string[]
}

export type MapPOICategory = "scenic_spot" | "facility" | "service" | "other"

export interface MapPOI {
  id: string
  name: string
  category: MapPOICategory
  lat: number
  lng: number
  location?: string
  openTime?: string
  phone?: string
  createdAt?: string
  description: string
  imageUrl?: string
  audioCnUrl?: string
  audioEnUrl?: string
  status: "active" | "inactive"
}

export const MAP_POI_CATEGORIES: Record<MapPOICategory, string> = {
  scenic_spot: "景点",
  facility: "设施",
  service: "服务",
  other: "其他",
}
