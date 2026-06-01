import {
  LayoutDashboard,
  LayoutList, Map, SlidersHorizontal, Users, Scale,
  BookOpen, Newspaper, Store, LayoutGrid,
  UserCircle2,
  MessageCircleWarning, BarChart3, ScrollText, ExternalLink,
  Camera, Users2, Building2, Layers,
  BarChart,
  Briefcase, FileCheck, Image, Video, Route, ThumbsUp,
  Landmark,   Brain, Heart,
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
    title: "内容管理",
    items: [
      { key: "scenic-news", label: "景区资讯", icon: Newspaper, permissionCode: "content" },
      { key: "travel-guides", label: "古城攻略", icon: BookOpen, permissionCode: "content" },
      { key: "service-center", label: "服务中心", icon: Briefcase, permissionCode: "content" },
      { key: "policies", label: "政策法规", icon: FileCheck, permissionCode: "content" },
      { key: "protection-guide", label: "保护指南", icon: Landmark, permissionCode: "content" },
      { key: "procedures", label: "办事流程", icon: Route, permissionCode: "content" },
      { key: "heritage-fee", label: "古城维护费", icon: BarChart, permissionCode: "content" },
      { key: "cultural-heritage", label: "文化古城", icon: Layers, permissionCode: "content" },
      { key: "cultural-journal", label: "文化期刊", icon: BookOpen, permissionCode: "content" },
      { key: "image-library", label: "图片标识共享库", icon: Image, permissionCode: "content" },
      { key: "videos", label: "古城视频", icon: Video, permissionCode: "content" },
      { key: "featured-routes", label: "精选线路", icon: ThumbsUp, permissionCode: "content" },
      { key: "recommended-routes", label: "推荐线路", icon: Route, permissionCode: "content" },
    ],
  },
  {
    title: "运营管理",
    items: [
      { key: "banner", label: "Banner管理", icon: Image, permissionCode: "content" },
      { key: "grid-settings", label: "首页宫格管理", icon: LayoutGrid, permissionCode: "content" },
      { key: "complaints", label: "投诉管理", icon: MessageCircleWarning, permissionCode: "complaint" },
      { key: "heritage", label: "遗产知识", icon: Landmark, permissionCode: "heritage" },
      { key: "ai-knowledge", label: "AI知识库", icon: Brain, permissionCode: "content" },
      { key: "volunteer", label: "志愿服务", icon: Heart, permissionCode: "content" },
      { key: "photo-records", label: "文化院落打卡记录", icon: Camera, permissionCode: "content" },
    ],
  },
  {
    title: "系统管理",
    items: [
      { key: "users", label: "账号管理", icon: UserCircle2, permissionCode: "user" },
      { key: "role-management", label: "角色管理", icon: Users2, permissionCode: "system" },
      { key: "data-analysis", label: "访问统计", icon: BarChart3, permissionCode: "system" },
      { key: "company-profile", label: "公司概况", icon: Building2, permissionCode: "system" },
      { key: "website-management", label: "网站管理", icon: LayoutDashboard, permissionCode: "system" },
      { key: "merchant-review", label: "商家审核", icon: Store, permissionCode: "system" },
      { key: "audit", label: "操作审计", icon: ScrollText, permissionCode: "system" },
    ],
  },
]
