import { useNavigate } from "react-router"
import { TabPageHeader } from "@/shared/components/mobile/TabPageHeader"
import { Store, Plus, BadgeCheck, Trash2, Droplets, Package, Luggage, Truck, AlertTriangle, Camera, Newspaper, Bell, MessageSquareWarning, House } from "lucide-react"
import { useAuthStore } from "@/platform/auth"

interface GridEntry {
  icon: string
  label: string
  route: string
  lucideIcon?: React.ElementType
  iconBg?: string
  badge?: string
  badgeColor?: string
}

interface GridSection {
  title: string
  entries: GridEntry[]
}

const SECTIONS: GridSection[] = [
  {
    title: "🏪 古城店铺管理",
    entries: [
      { icon: "", label: "我的店铺", route: "/c/my-shop", lucideIcon: Store, iconBg: "#FEF3C7" },
      { icon: "/icons/公房服务@2x.png", label: "公房服务", route: "/c/housing" },
    ],
  },
  {
    title: "便民服务",
    entries: [
      { icon: "", label: "生活垃圾清运", route: "/c/services", lucideIcon: Trash2, iconBg: "#E0F2FE" },
      { icon: "", label: "建筑垃圾清运", route: "/c/services", lucideIcon: Trash2, iconBg: "#FEE2E2" },
      { icon: "", label: "布草配送", route: "/c/services", lucideIcon: Package, iconBg: "#FCE7F3" },
      { icon: "", label: "送水服务", route: "/c/services", lucideIcon: Droplets, iconBg: "#DBEAFE" },
      { icon: "", label: "行李搬运", route: "/c/services", lucideIcon: Luggage, iconBg: "#F3E8FF" },
      { icon: "", label: "送货服务", route: "/c/services", lucideIcon: Truck, iconBg: "#FEF3C7" },
    ],
  },
  {
    title: "经营保障",
    entries: [
      { icon: "/icons/一键投诉@2x.png", label: "一键投诉", route: "/c/complaint" },
      { icon: "/icons/随手拍@2x.png", label: "随手拍", route: "/c/photo-report" },
      { icon: "/icons/古城资讯@2x.png", label: "古城资讯", route: "/c/news" },
      { icon: "/icons/公告通知@2x.png", label: "公告通知", route: "/c/notice" },
      { icon: "/icons/便民信息@2x.png", label: "便民信息", route: "/c/info" },
    ],
  },
  {
    title: "🛒 线上商城供应商",
    entries: [
      { icon: "", label: "供应商入驻", route: "/c/supplier-entry", lucideIcon: Plus, iconBg: "#D1FAE5", badge: "商城", badgeColor: "#3B82F6" },
    ],
  },
]

export function MerchantServicesPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isSupplier = user?.roles?.includes("supplier") ?? false

  return (
    <div className="min-h-full bg-surface-page pb-6">
      <TabPageHeader title="商户导航" />

      {/* 商户身份提示 */}
      {isSupplier && (
        <div className="mx-4 mt-3 px-4 h-10 rounded-xl bg-emerald-50 flex items-center gap-2">
          <BadgeCheck size={16} className="text-emerald-500" />
          <span className="text-[12px] text-emerald-700">已验证商户身份，可管理店铺信息</span>
        </div>
      )}

      <div className="px-4 pt-2 space-y-3">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[12px] text-text-tertiary font-medium mb-2 pl-1">{section.title}</p>
            <div className="bg-white rounded-2xl px-2 py-4 shadow-card">
              <div className="grid grid-cols-4 gap-y-4">
                {section.entries.map((entry) => {
                  const Icon = entry.lucideIcon
                  return (
                    <button
                      key={entry.label}
                      onClick={() => navigate(entry.route)}
                      className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform relative"
                    >
                      <div className="w-12 h-12 flex items-center justify-center">
                        {Icon ? (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: entry.iconBg ?? "#F1F5F9" }}
                          >
                            <Icon size={24} className="text-text-body" />
                          </div>
                        ) : (
                          <img src={entry.icon} alt={entry.label} className="w-12 h-12" />
                        )}
                      </div>
                      <span className="text-[12px] text-text-body leading-tight">{entry.label}</span>
                      {entry.badge && (
                        <span
                          className="absolute -top-1 -right-1 px-1.5 h-4 rounded-full text-[9px] text-white flex items-center"
                          style={{ backgroundColor: entry.badgeColor ?? "#3B82F6" }}
                        >
                          {entry.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-text-tertiary mt-6 px-8 leading-relaxed">
        <strong className="text-text-body">两种商户类型</strong><br />
        古城商户 — 在古城景区经营的实体店铺，入驻后可在平台展示和管理店铺<br />
        供应商 — 为平台商城提供商品/服务的合作方，通过供应商入驻流程申请
      </p>
    </div>
  )
}