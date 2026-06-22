import {
  LayoutDashboard, LayoutList, Map, SlidersHorizontal, Users, Scale,
  Store, LayoutGrid,
  UserCircle2,
  MessageCircleWarning, ScrollText, ExternalLink,
  Camera, Users2, Image,
  Heart, UsersRound,
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
      { key: "price-arbitration", label: "价格仲裁", icon: Scale, badge: 2, permissionCode: "convenience" },
    ],
  },
  {
    title: "商家与供应商",
    items: [
      { key: "supplier-applications", label: "供应商入驻审核", icon: Store, permissionCode: "mall" },
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
    title: "系统管理",
    items: [
      { key: "users", label: "账号管理", icon: UserCircle2, permissionCode: "user" },
      { key: "role-management", label: "角色管理", icon: Users2, permissionCode: "system" },
    ],
  },
]
