import { type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router"
import { MiniProgramFrame } from "../shared/components/MiniProgramFrame"
import {
  LayoutGrid, Inbox, Bell, History, User,
} from "lucide-react"

type TabDef = {
  key: string
  path: string
  label: string
  icon: ReactNode
}

const SERVICE_TABS: TabDef[] = [
  { key: "workbench", path: "/b/service/workbench", label: "工作台", icon: <LayoutGrid className="size-5" /> },
  { key: "tasks", path: "/b/service/tasks", label: "派单", icon: <Inbox className="size-5" /> },
  { key: "notifications", path: "/b/service/notifications", label: "消息", icon: <Bell className="size-5" /> },
  { key: "history", path: "/b/service/history", label: "历史", icon: <History className="size-5" /> },
  { key: "profile", path: "/b/service/profile", label: "我的", icon: <User className="size-5" /> },
]

type BLayoutProps = {
  children: ReactNode
}

export function BLayout({ children }: BLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const tabBar = (
    <div
      className="bg-white/95 backdrop-blur-xl border-t border-[#F0F0F0] px-2 pt-1.5 pb-5 grid grid-cols-5 shrink-0"
      style={{ boxShadow: "0 -4px 16px rgba(60,120,200,0.06)" }}
    >
      {SERVICE_TABS.map((t) => {
        const isActive = location.pathname === t.path
        return (
          <button
            key={t.key}
            onClick={() => navigate(t.path)}
            className="flex flex-col items-center gap-0.5 py-1.5 active:scale-95 transition"
          >
            <div
              className="flex items-center justify-center"
              style={{
                color: isActive ? "var(--primary)" : "#999999",
                filter: isActive ? "drop-shadow(0 4px 8px rgba(37,99,235,0.33))" : "none",
              }}
            >
              {t.icon}
            </div>
            <span
              className="text-[10px]"
              style={{ color: isActive ? "var(--primary)" : "#999999" }}
            >
              {t.label}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <MiniProgramFrame footer={tabBar}>
      {children}
    </MiniProgramFrame>
  )
}
