import { Outlet, useLocation, useNavigate } from "react-router"
import { Home, LayoutGrid, User, Store } from "lucide-react"
import { motion } from "motion/react"
import aiAvatar from "../assets/ai-avatar-new.png"

const tabs = [
  { key: "/c/home", label: "首页", icon: Home },
  { key: "/c/visitor-services", label: "游客导航", icon: LayoutGrid },
  { key: "/c/ai", label: "AI咨询", icon: null, isCenter: true },
  { key: "/c/merchant-services", label: "商户导航", icon: Store },
  { key: "/c/profile", label: "我的", icon: User },
]

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const aiActive = location.pathname === "/c/ai"

  return (
    <div className="min-h-screen flex flex-col bg-surface-page">
      <div className="flex-1 overflow-y-auto pb-[72px]">
        <Outlet />
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* AI center avatar - raised above the bar */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[24px] z-10">
          <button
            onClick={() => navigate("/c/ai")}
            aria-label="AI咨询"
            className="block w-[54px] h-[54px] rounded-full active:scale-95 transition-transform"
            style={{
              boxShadow: aiActive
                ? "0 4px 16px rgba(45,99,192,0.25), 0 0 0 2.5px #2563EB"
                : "0 4px 14px rgba(0,0,0,0.12)",
              border: "2.5px solid #FFFFFF",
              overflow: "hidden",
            }}
          >
            <img src={aiAvatar} alt="AI" className="w-full h-full object-cover" />
          </button>
        </div>

        {/* Tab bar background */}
        <div className="bg-white border-t border-[#DBE5F3] h-[60px] flex items-center justify-around pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(45,99,192,0.06)]">
          {tabs.map((tab) => {
            const active = location.pathname === tab.key

            if (tab.isCenter) {
              return (
                <div key={tab.key} className="flex flex-col items-center justify-center pt-1.5 flex-1 relative">
                  <span className="h-[24px]" />
                  <span
                    className={`text-[10px] mt-0.5 ${aiActive ? "text-primary font-medium" : "text-text-tertiary"}`}
                  >
                    {tab.label}
                  </span>
                </div>
              )
            }

            const Icon = tab.icon!
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.key)}
                aria-label={tab.label}
                className="flex flex-col items-center justify-center pt-1.5 flex-1 active:scale-95 transition-transform relative"
              >
                <motion.div
                  animate={active ? { scale: 1.08 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={active ? "text-primary" : "text-text-tertiary"}
                  />
                </motion.div>
                <span className={`text-[10px] mt-0.5 ${active ? "text-primary font-medium" : "text-text-tertiary"}`}>
                  {tab.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -bottom-0.5 w-4 h-[2px] rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
