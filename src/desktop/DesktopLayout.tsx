import { Outlet, useNavigate, useLocation } from "react-router"
import { useState, useMemo } from "react"
import { useAuthStore } from "@/platform/auth"
import { usePermissionStore } from "../shared/permissions"
import { useComplaintStore } from "../features/complaints/store"
import { useMerchantReviewStore, useMerchantRegistrationStore } from "../features/merchant-review/store"
import { navGroups } from "./nav"
import { Search, Bell, Maximize2, Smartphone, LogOut, X } from "lucide-react"
import { Input } from "../shared/components/ui/input"
import { Avatar, AvatarFallback } from "../shared/components/ui/avatar"
import { Button } from "../shared/components/ui/button"
import { Badge } from "../shared/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../shared/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "../shared/components/ui/sheet"
import { toast } from "sonner"

const mockNotifications = [
  { id: 1, title: "新供应商入驻申请 — 玉龙雪山直通车服务部", time: "10 分钟前", read: false },
  { id: 2, title: "便民服务取消申请 #CO20260509002 待处理", time: "30 分钟前", read: false },
  { id: 3, title: "购物信息更新 — 纳西扎染手工体验馆", time: "1 小时前", read: false },
  { id: 4, title: "价格争议工单 DSP20260508001 已升级至平台仲裁", time: "2 小时前", read: true },
  { id: 5, title: "系统维护通知：5 月 11 日 02:00–04:00 平台暂停服务", time: "昨天", read: true },
]

export function DesktopLayout() {
  const [showNotifications, setShowNotifications] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const switchPlatform = useAuthStore((s) => s.switchPlatform)
  const roles = usePermissionStore((s) => s.roles)
  const complaints = useComplaintStore((s) => s.complaints)
  const navigate = useNavigate()
  const location = useLocation()

  const roleMap: Record<string, string> = {
    platform_admin: "role_admin",
    supplier: "role_supplier",
  }
  const roleId = user?.roles?.includes("platform_admin") ? roleMap.platform_admin : roleMap.supplier
  const activeRole = roles.find((r) => r.roleId === roleId)
  const rolePerms = activeRole?.permissionCodes ?? []

  const complaintCount = complaints.filter((c) => c.status === "C10").length

  const merchantRequests = useMerchantRegistrationStore((s) => s.requests)
  const merchantReviewPending = useMerchantReviewStore((s) => s.getPending().length)
  const claimPending = merchantRequests.filter((r) => r.type === "claim" && r.status === "pending").length
  const newShopPending = merchantRequests.filter((r) => r.type === "new_shop" && r.status === "pending").length
  const totalMerchantPending = claimPending + newShopPending + merchantReviewPending

  const filteredGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => {
            if (roleId === "role_admin") return true
            if (item.key === "workbench") return true
            const moduleCode = item.permissionCode ?? item.key
            return rolePerms.some((code) => code.startsWith(moduleCode + "."))
          })
          .map((item) => {
            if (item.key === "complaints" && complaintCount > 0) {
              return { ...item, badge: complaintCount }
            }
            if (item.key === "merchant-review" && totalMerchantPending > 0) {
              return { ...item, badge: totalMerchantPending }
            }
            return item
          }),
      }))
      .filter((g) => g.items.length > 0)
  }, [roleId, rolePerms, complaintCount, totalMerchantPending])

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-border-light flex flex-col shrink-0">
        <div className="h-14 flex items-center gap-2 px-5 border-b border-border-light">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold">
            丽
          </div>
          <span className="font-semibold text-text-heading text-sm">丽江古城游</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredGroups.map((group) => (
            <div key={group.title}>
              <p className="px-2 py-1.5 text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                {group.title}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon
                const active = location.pathname === `/desktop/${item.key}`
                const isExternal = item.external != null
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      if (isExternal) {
                        window.open(item.external, "_blank")
                      } else {
                        navigate(`/desktop/${item.key}`)
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active ? "bg-primary-50 text-primary font-medium" : "text-text-body hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="ml-auto text-[10px] bg-destructive text-white px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border-light">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary">
              {user?.name?.[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-heading truncate">{user?.name}</p>
              <p className="text-[10px] text-text-tertiary">
                {user?.roles?.includes("platform_admin") ? "平台管理员" : "运营人员"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border-light bg-white flex items-center px-6 gap-4 shrink-0">
          <div className="text-sm font-medium text-text-heading">
            {(() => {
              const labelMap: Record<string, string> = {
                workbench: "平台运营工作台",
                "convenience-overview": "服务概览",
                convenience: "订单管理",
                zones: "片区管理",
                "dispatch-config": "派单配置",
                "convenience-staff": "人员管理",
                "review-management": "评价管理",
                "supplier-applications": "供应商入驻审核",
                // 内容管理
                "scenic-news": "景区资讯",
                "travel-guides": "古城攻略",
                "photo-records": "文化院落打卡记录",
                banner: "Banner管理",
                "grid-settings": "首页宫格管理",
                // 系统管理
                users: "账号管理",
                "role-management": "角色管理",
                complaints: "投诉管理",
                audit: "操作审计",
                // 新增功能
                heritage: "遗产知识",
                "ai-knowledge": "AI知识库",
                volunteer: "志愿服务",

                // 内容管理占位页
                "service-center": "服务中心",
                policies: "政策法规",
                "protection-guide": "保护指南",
                procedures: "办事流程",
                "heritage-fee": "古城维护费",
                "cultural-heritage": "文化古城",
                "cultural-journal": "文化期刊",
                "image-library": "图片标识共享库",
                videos: "古城视频",
                "featured-routes": "精选线路",
                "recommended-routes": "推荐线路",
                // 新增模块
                settlement: "结算管理",
                "point-rules": "积分规则配置",
                "merchant-review": "古城商户审核",
                "trust-score-config": "诚信评分配置",
              }
              const key = location.pathname.replace("/desktop/", "").split("/")[0]
              return labelMap[key] || key
            })()}
          </div>
          <div className="ml-6 relative w-80">
            <Search
              className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary cursor-pointer"
              onClick={() => toast.info("输入功能、账号或手机号搜索")}
            />
            <Input
              className="pl-9 h-9"
              placeholder="搜索功能 / 账号 / 手机号"
              onKeyDown={(e) => {
                if (e.key === "Enter") toast.success("搜索完成")
              }}
            />
          </div>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(true)}>
            <Bell className="size-4" />
            <Badge className="absolute -top-0.5 -right-0.5 size-4 p-0 bg-rose-500 grid place-items-center text-[10px]">
              {mockNotifications.filter((n) => !n.read).length}
            </Badge>
          </Button>
          <Button variant="ghost" size="icon">
            <Maximize2 className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-amber-500 text-white text-xs">{user?.name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-text-body">{user?.name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>
                {user?.roles?.includes("platform_admin") ? "平台管理员" : "运营人员"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  switchPlatform("c")
                  navigate("/c")
                }}
              >
                <Smartphone className="size-4 mr-2" /> 切换至游客端
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  switchPlatform("b")
                  navigate("/b")
                }}
              >
                <Smartphone className="size-4 mr-2" /> 切换至B端
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-rose-600">
                <LogOut className="size-4 mr-2" /> 退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Notifications Sheet */}
      <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px] overflow-y-auto bg-white p-0">
          <SheetHeader className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-semibold text-slate-900">消息与通知</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <X className="size-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          <div className="divide-y divide-slate-100">
            {mockNotifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 transition-colors hover:bg-slate-50 cursor-pointer ${
                  !n.read ? "bg-blue-50/40" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="size-2 rounded-full bg-primary shrink-0" />}
                    <p className={`text-sm ${!n.read ? "font-medium text-slate-900" : "text-slate-600"}`}>{n.title}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 ml-4">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
