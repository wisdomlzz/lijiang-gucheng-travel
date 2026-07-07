import {
  LayoutDashboard,
  LayoutList,
  Map,
  SlidersHorizontal,
  Users,
  Store,
  LayoutGrid,
  MessageCircleWarning,
  ExternalLink,
  Camera,
  Image,
  Wallet,
  Gift,
  ShieldCheck,
  Heart,
  Star,
  Award,
  Newspaper,
  Settings,
  AlertTriangle,
  Calendar,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { CRMEB_ADMIN_URL } from "../shared/constants"

export type NavGroup = {
  title: string
  items: {
    key: string
    label: string
    icon: LucideIcon
    badge?: number
    permissionCode?: string
    external?: string
  }[]
}

export const navGroups: NavGroup[] = [
  {
    title: "运营管理",
    items: [
      { key: "banner", label: "Banner管理", icon: Image, permissionCode: "content" },
      { key: "grid-settings", label: "首页宫格管理", icon: LayoutGrid, permissionCode: "content" },
      { key: "photo-records", label: "文化院落打卡记录", icon: Camera, permissionCode: "content" },
      { key: "point-rules", label: "积分规则配置", icon: Gift, permissionCode: "content" },
      { key: "complaints", label: "投诉管理", icon: MessageCircleWarning, permissionCode: "complaint" },
      { key: "volunteer", label: "志愿服务", icon: Heart, permissionCode: "content" },
      { key: "announcement-manage", label: "公告管理", icon: Newspaper, permissionCode: "content" },
      { key: "ai-knowledge", label: "AI知识库管理", icon: MessageCircleWarning, permissionCode: "content" },
      { key: "content-manage", label: "内容管理", icon: Newspaper, permissionCode: "content" },
      { key: "flow-warning", label: "人流量预警", icon: AlertTriangle, permissionCode: "content" },
      { key: "bookings", label: "预约管理", icon: Calendar, permissionCode: "content" },
    ],
  },
  {
    title: "商户与供应商管理",
    items: [
      { key: "merchant-review", label: "古城商户审核", icon: ShieldCheck, badge: 2, permissionCode: "content" },
      { key: "supplier-applications", label: "线上商城供应商审核", icon: Store, permissionCode: "mall" },
      {
        key: "crmeb-admin",
        label: "商城管理后台",
        icon: ExternalLink,
        external: CRMEB_ADMIN_URL,
        permissionCode: "mall",
      },
    ],
  },
  {
    title: "便民服务",
    items: [
      { key: "convenience-overview", label: "服务概览", icon: LayoutDashboard, permissionCode: "convenience" },
      { key: "convenience-staff", label: "人员管理", icon: Users, permissionCode: "convenience" },
      { key: "zones", label: "片区管理", icon: Map, permissionCode: "convenience" },
      { key: "dispatch-config", label: "派单配置", icon: SlidersHorizontal, permissionCode: "convenience" },
      { key: "convenience", label: "订单管理", icon: LayoutList, permissionCode: "convenience" },
      { key: "settlement", label: "结算管理", icon: Wallet, permissionCode: "convenience" },
      { key: "review-management", label: "评价管理", icon: Star, permissionCode: "convenience" },
      { key: "staff-review", label: "入驻审核", icon: ShieldCheck, permissionCode: "convenience" },
    ],
  },
  {
    title: "诚信管理",
    items: [
      { key: "trust-score-config", label: "诚信评分配置", icon: Award, permissionCode: "convenience" },
    ],
  },
  {
    title: "系统管理",
    items: [
      { key: "system-config", label: "系统配置", icon: Settings, permissionCode: "convenience" },
    ],
  },
]