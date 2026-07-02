import { useNavigate } from "react-router"
import { PageHeader } from "../components/PageHeader"
import { CRMEB_C_URL } from "../../shared/constants"

interface GridEntry {
  icon: string
  label: string
  route: string
  external?: boolean
}

interface GridSection {
  title: string
  entries: GridEntry[]
}

const SECTIONS: GridSection[] = [
  {
    title: "文旅探索",
    entries: [
      { icon: "/icons/导览地图@2x.png", label: "导览地图", route: "/c/map" },
      { icon: "/icons/精选路线@2x.png", label: "精选路线", route: "/c/routes" },
      { icon: "/icons/文化院落@2x.png", label: "文化院落", route: "/c/courtyards" },
      { icon: "/icons/遗产知识@2x.png", label: "遗产知识", route: "/c/heritage" },
      { icon: "/icons/VR游览@2x.png", label: "VR游览", route: "/c/vr-tour" },
      { icon: "/icons/购在古城@2x.png", label: "购在古城", route: "/c/merchants" },
      { icon: "/icons/古城资讯@2x.png", label: "古城资讯", route: "/c/news" },
      { icon: "/icons/公告通知@2x.png", label: "公告通知", route: "/c/notice" },
    ],
  },
  {
    title: "便捷服务",
    entries: [
      { icon: "/icons/一键服务@2x.png", label: "便民服务", route: "/c/services" },
      { icon: "/icons/门票预订@2x.png", label: "门票预订", route: "crmeb" },
      { icon: "/icons/讲解服务@2x.png", label: "讲解服务", route: "crmeb" },
      { icon: "/icons/官方商城@2x.png", label: "官方商城", route: "crmeb" },
    ],
  },
  {
    title: "公众参与",
    entries: [
      { icon: "/icons/一键投诉@2x.png", label: "一键投诉", route: "/c/complaint" },
      { icon: "/icons/随手拍@2x.png", label: "随手拍", route: "/c/photo-report" },
      { icon: "/icons/志愿服务@2x.png", label: "志愿服务", route: "/c/volunteer" },
      { icon: "/icons/便民信息@2x.png", label: "便民信息", route: "/c/info" },
      { icon: "/icons/公房服务@2x.png", label: "公房信息", route: "/c/housing" },
    ],
  },
]

export function VisitorServicesPage() {
  const navigate = useNavigate()

  const handleEntry = (entry: GridEntry) => {
    if (entry.external || entry.route === "crmeb") {
      window.open(CRMEB_C_URL, "_blank")
    } else {
      navigate(entry.route)
    }
  }

  return (
    <div className="min-h-full bg-[#F8F6F3] pb-6">
      <PageHeader title="游客服务" />

      <div className="px-4 pt-2 space-y-3">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[12px] text-[#94A3B8] font-medium mb-2 pl-1">{section.title}</p>
            <div className="bg-white rounded-2xl px-2 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="grid grid-cols-4 gap-y-4">
                {section.entries.map((entry) => (
                  <button
                    key={entry.label}
                    onClick={() => handleEntry(entry)}
                    className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <img src={entry.icon} alt={entry.label} className="w-12 h-12" />
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
