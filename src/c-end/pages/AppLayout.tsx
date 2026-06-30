import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, ShoppingBag, User, LayoutGrid } from "lucide-react";
import { motion } from "motion/react";
import aiAvatar from "../assets/ad6ed0a0-af1e-4e61-a615-ab7234c09411.png";
import { CRMEB_C_URL } from "../../shared/constants";

const tabs = [
  { key: "/c/home", label: "首页", icon: Home },
  { key: "/c/services", label: "一键服务", icon: LayoutGrid },
  { key: "/c/ai", label: "AI咨询", icon: null, isCenter: true },
  { key: "crmeb", label: "商城", icon: ShoppingBag, external: true },
  { key: "/c/profile", label: "我的", icon: User },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const aiActive = location.pathname === "/c/ai";

  return (
    <div className="min-h-screen flex flex-col bg-surface-page">
      <div className="flex-1 overflow-y-auto pb-[72px]">
        <Outlet />
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* AI center avatar - raised above the bar */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[18px] z-10">
          <button
            onClick={() => navigate("/c/ai")}
            className="block w-[50px] h-[50px] rounded-full active:scale-95 transition-transform"
            style={{
              background: aiActive
                ? "linear-gradient(135deg, #2563EB, #3B82F6)"
                : "linear-gradient(135deg, #60A5FA, #3B82F6)",
              boxShadow: aiActive
                ? "0 4px 20px rgba(37,99,235,0.45)"
                : "0 4px 14px rgba(59,130,246,0.3)",
              padding: "3px",
            }}
          >
            <div className="w-full h-full rounded-full ring-[2px] ring-white overflow-hidden">
              <img src={aiAvatar} alt="AI" className="w-full h-full object-cover" />
            </div>
          </button>
        </div>

        {/* Tab bar background */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-border-light h-[60px] flex items-center justify-around pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_8px_rgba(0,0,0,0.05)]">
          {tabs.map((tab) => {
            const active = location.pathname === tab.key;

            if (tab.isCenter) {
              return (
                <div key={tab.key} className="flex flex-col items-center justify-center pt-1.5 flex-1 relative">
                  <span className="h-[22px]" />
                  <span
                    className={`text-[10px] mt-0.5 ${
                      aiActive ? "text-primary font-medium" : "text-text-tertiary"
                    }`}
                  >
                    {tab.label}
                  </span>
                </div>
              );
            }

            const Icon = tab.icon!;
            const isExternal = (tab as any).external;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  if (isExternal) {
                    window.open(CRMEB_C_URL, "_blank")
                  } else {
                    navigate(tab.key)
                  }
                }}
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
                <span
                  className={`text-[10px] mt-0.5 ${
                    active ? "text-primary font-medium" : "text-text-tertiary"
                  }`}
                >
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
