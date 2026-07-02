import { useNavigate } from "react-router"
import { PageHeader } from "../components/PageHeader"
import { Store, Plus } from "lucide-react"

interface GridEntry {
  icon: string
  label: string
  route: string
  /** lucide icon for entries without a dedicated icon image */
  lucideIcon?: typeof Store
  iconBg?: string
}

interface GridSection {
  title: string
  entries: GridEntry[]
}

const SECTIONS: GridSection[] = [
  {
    title: "商户经营",
    entries: [
      { icon: "", label: "我的店铺", route: "/c/my-shop", lucideIcon: Store, iconBg: "#FEF3C7" },
      { icon: "/icons/一键服务@2x.png", label: "便民服务", route: "/c/services" },
      { icon: "/icons/公房服务@2x.png", label: "公房服务", route: "/c/housing" },
      { icon: "", label: "供应商入驻", route: "/c/supplier-entry", lucideIcon: Plus, iconBg: "#D1FAE5" },
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
]

export function MerchantServicesPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-[#F8F6F3] pb-6">
      <PageHeader title="商户服务" />

      <div className="px-4 pt-2 space-y-3">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[12px] text-[#94A3B8] font-medium mb-2 pl-1">{section.title}</p>
            <div className="bg-white rounded-2xl px-2 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="grid grid-cols-4 gap-y-4">
                {section.entries.map((entry) => (
                  <button
                    key={entry.label}
                    onClick={() => navigate(entry.route)}
                    className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      {entry.lucideIcon ? (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: entry.iconBg ?? "#F1F5F9" }}
                        >
                          <entry.lucideIcon size={24} className="text-[#334155]" />
                        </div>
                      ) : (
                        <img src={entry.icon} alt={entry.label} className="w-12 h-12" />
                      )}
                    </div>
                    <span className="text-[12px] text-[#334155] leading-tight">{entry.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
