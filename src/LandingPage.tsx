import { useNavigate } from "react-router"
import { Smartphone, Wrench, Monitor } from "lucide-react"

const ends = [
  { path: "/c", label: "C端", sub: "游客端 · 小程序", icon: Smartphone, color: "#2563EB", bg: "#EFF6FF" },
  { path: "/b", label: "B端", sub: "便民服务人员端 · 小程序", icon: Wrench, color: "#7C3AED", bg: "#F5F3FF" },
  { path: "/desktop", label: "桌面端", sub: "管理后台 · Web", icon: Monitor, color: "#059669", bg: "#ECFDF5" },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-heading mb-2">丽江古城游</h1>
        <p className="text-text-tertiary text-sm">Lijiang Ancient City Tour · V2.0 Demo</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        {ends.map((end) => (
          <button key={end.path} onClick={() => navigate(end.path)} className="flex-1 group cursor-pointer">
            <div
              className="rounded-2xl p-8 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]"
              style={{
                background: end.bg,
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110"
                style={{ background: end.color + "20", color: end.color }}
              >
                <end.icon className="size-8" />
              </div>
              <h2 className="text-xl font-semibold mb-1" style={{ color: end.color }}>
                {end.label}
              </h2>
              <p className="text-sm text-text-tertiary">{end.sub}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => window.open("/requirement", "_blank")}
        className="mt-6 text-xs text-blue-500 hover:text-blue-600 underline transition-colors cursor-pointer"
      >
        点击可在线查看需求文档
      </button>

      <p className="mt-12 text-xs text-text-tertiary">进入后右上角悬浮按钮可在三端之间快速切换 · 演示环境</p>
    </div>
  )
}
