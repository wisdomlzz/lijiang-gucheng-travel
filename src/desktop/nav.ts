import {
  LayoutDashboard, LayoutList, Map, SlidersHorizontal, Users, Scale,
  Store, LayoutGrid,
  MessageCircleWarning, ScrollText, ExternalLink,
  Camera, Image, Wallet, Gift, ShieldCheck, AlertTriangle,
  Heart,
} from "lucide-react"
import { CRMEB_ADMIN_URL } from "../shared/constants"

export type NavGroup = {
  title: string
  items: {
    key: string
    label: string
    icon: any
    badge?: number
    permissionCode?: string
    external?: string
  }[]
}

export const navGroups: NavGroup[] = [
  {
    title: "便民服务管理",
    items: [
      { key: "convenience-overview", label: "服务概览", icon: LayoutDashboard, permissionCode: "convenience" },
      { key: "convenience", label: "派单列表", icon: LayoutList, permissionCode: "convenience" },
      { key: "zones", label: "片区管理", icon: Map, permissionCode: "convenience" },
      { key: "dispatch-config", label: "派单配置", icon: SlidersHorizontal, permissionCode: "convenience" },
      { key: "convenience-staff", label: "服务人员", icon: Users, permissionCode: "convenience" },
      { key: "price-arbitration", label: "取消审批", icon: Scale, badge: 2, permissionCode: "convenience" },
    ],
  },
  {
    title: "商家与供应商",
    items: [
      { key: "supplier-applications", label: "供应商入驻审核", icon: Store, permissionCode: "mall" },
      { key: "merchant-review", label: "商家信息审核", icon: ShieldCheck, badge: 2, permissionCode: "mall" },
      { key: "crmeb-admin", label: "商城管理后台", icon: ExternalLink, external: CRMEB_ADMIN_URL, permissionCode: "mall" },
    ],
  },
  {
    title: "社区管理",
    items: [
      { key: "announcements", label: "公告下发管理", icon: ScrollText, permissionCode: "content" },
    ],
  },
  {
    title: "运营管理",
    items: [
      { key: "banner", label: "Banner管理", icon: Image, permissionCode: "content" },
      { key: "grid-settings", label: "首页宫格管理", icon: LayoutGrid, permissionCode: "content" },
      { key: "complaints", label: "投诉管理", icon: MessageCircleWarning, permissionCode: "complaint" },
      { key: "volunteer", label: "志愿服务", icon: Heart, permissionCode: "content" },
      { key: "photo-records", label: "文化院落打卡记录", icon: Camera, permissionCode: "content" },
    ],
  },
  {
    title: "财务与预警",
    items: [
      { key: "settlement", label: "结算管理", icon: Wallet, permissionCode: "convenience" },
      { key: "point-rules", label: "积分规则配置", icon: Gift, permissionCode: "content" },
      { key: "flow-warning", label: "人流量预警", icon: AlertTriangle, badge: 2, permissionCode: "content" },
    ],
  },
]
