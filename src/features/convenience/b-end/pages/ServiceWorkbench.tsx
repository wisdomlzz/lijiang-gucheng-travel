import { useState } from "react"
import { useNavigate } from "react-router"
import { Bell, Inbox, Clock, ChevronRight, Wrench, MapPin, Phone } from "lucide-react"
import { StatusBadge } from "@/shared/components/ui/status-badge"
import { QuoteAndPhotoFlow } from "./QuoteAndPhotoFlow"
import { useStaffStore } from "../../store/staff-store"
import { useConvenienceStore } from "../../store"
import { useNotificationStore } from "../../store/notification-store"
import { useAuthStore } from "@/platform/auth"
import type { ConvenienceStatus } from "../../../../shared/types"

type WorkStatus = "online" | "busy" | "rest" | "offline"

const STATUS_META: Record<WorkStatus, { label: string; sub: string; bg: string; dot: string }> = {
  online: {
    label: "在线接单",
    sub: "派单池中可被派单",
    bg: "#10B981",
    dot: "#10B981",
  },
  busy: {
    label: "忙碌中",
    sub: "进行中的订单完成后自动恢复",
    bg: "#F59E0B",
    dot: "#F59E0B",
  },
  rest: {
    label: "休息中",
    sub: "暂不接收新派单",
    bg: "#94A3B8",
    dot: "#94A3B8",
  },
  offline: {
    label: "已离线",
    sub: "暂不接收新派单",
    bg: "#94A3B8",
    dot: "#64748B",
  },
}

export function ServiceWorkbench() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const staffId = currentUser?.staffId ?? ""
  const setStaffStatus = useStaffStore((s) => s.setStaffStatus)
  const staffItem = useStaffStore((s) => s.staff.find((x) => x.id === staffId))
  const convOrders = useConvenienceStore((s) => s.orders)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const [status, setStatus] = useState<WorkStatus>(staffItem?.status ?? "online")
  const [quoteFlow, setQuoteFlow] = useState<"quote" | "photo" | null>(null)
  const meta = STATUS_META[status]

  const handleStatusChange = (s: WorkStatus) => {
    setStatus(s)
    setStaffStatus(staffId, s)
  }

  // Compute data from convenience store for this staff
  const staffOrders = convOrders.filter((o) => o.staffId === staffId)
  const today = new Date().toISOString().slice(0, 10)
  const todayOrders = staffOrders.filter((o) => o.createdAt.startsWith(today))
  const todayCount = todayOrders.length
  const todayDone = todayOrders.filter((o) => o.status === "S40").length
  const todayActive = todayOrders.filter((o) => o.status !== "S40" && o.status !== "S50").length
  const totalCount = staffOrders.length
  const monthStr = today.slice(0, 7)
  const monthCount = staffOrders.filter((o) => o.createdAt.startsWith(monthStr)).length

  // Active orders (in-progress)
  const activeConvStatuses: ConvenienceStatus[] = ["A20", "A30", "A35", "A40", "S48", "S55"]
  const activeOrders = staffOrders.filter((o) => activeConvStatuses.includes(o.status))
  const assignedCount = staffOrders.filter((o) => o.status === "A20").length

  // Staff skills derived from order history
  const staffSkills = [...new Set(staffOrders.map((o) => o.serviceType))].join(" / ")

  const activeOrderLabel = (status: ConvenienceStatus) => {
    const labels: Record<string, string> = {
      A20: "已指派",
      A30: "已接单",
      A35: "待用户支付",
      A40: "已收款",
      S48: "服务中",
      S55: "待确认",
    }
    return labels[status] ?? "进行中"
  }

  const activeOrderKind = (status: ConvenienceStatus) => {
    if (status === "S55") return "review" as const
    if (status === "A35") return "prepay" as const
    return "active" as const
  }

  return (
    <div className="space-y-3 pb-4">
      <div
        className="px-4 pt-4 pb-5"
        style={{
          background: "linear-gradient(180deg, #FCD9A8 0%, #FDE7C8 60%, #EFF6FC 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-full bg-white/80 backdrop-blur-xl flex items-center justify-center">
              <Wrench className="size-5" style={{ color: "#F59E0B" }} />
            </div>
            <div>
              <div className="text-[15px] font-medium text-text-heading">{staffItem?.name ?? "李师傅"}</div>
              <div className="text-[11px] text-text-caption">
                大研片区{staffSkills ? ` · ${staffSkills}` : " · 搬运 / 清运"}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/b/service/notifications")}
            className="relative size-9 rounded-full bg-white/80 backdrop-blur-xl flex items-center justify-center shadow-[0_4px_12px_rgba(60,120,200,0.12)]"
          >
            <Bell className="size-4" style={{ color: "#F59E0B" }} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-[4px] rounded-full bg-[#EF4444] text-white text-[9px] font-medium flex items-center justify-center leading-none"
                style={{ boxShadow: "0 2px 6px rgba(239,68,68,0.4)" }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Status segmented (3 options, busy is auto) */}
        <div className="mt-4 bg-white/85 backdrop-blur-xl rounded-2xl p-3 shadow-[0_4px_16px_rgba(60,120,200,0.10)]">
          <div className="flex items-center gap-2 mb-2.5">
            <span
              className="size-2 rounded-full"
              style={{
                background: meta.dot,
                boxShadow: `0 0 0 4px ${meta.dot}33`,
              }}
            />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-text-heading">{meta.label}</div>
              <div className="text-[11px] text-text-tertiary">{meta.sub}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-primary-50 rounded-full p-0.5">
            {(["online", "rest", "offline"] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`h-7 rounded-full text-[12px] transition ${
                  status === s ? "text-white" : "text-text-tertiary"
                }`}
                style={status === s ? { background: "#F59E0B", boxShadow: "0 2px 8px rgba(245,158,11,0.32)" } : {}}
              >
                {s === "online" ? "在线" : s === "rest" ? "休息" : "离线"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 grid grid-cols-2 gap-2">
        <DataCard label="今日接单" value={String(todayCount)} sub={`完成 ${todayDone} · 进行中 ${todayActive}`} />
        <DataCard label="累计接单" value={String(totalCount)} sub={`本月 ${monthCount}`} />
      </div>

      <div className="px-4">
        <div className="bg-white rounded-2xl p-3 shadow-[0_4px_16px_rgba(60,120,200,0.08)] grid grid-cols-3 gap-2">
          <Quick
            icon={<Inbox />}
            label="已指派"
            tint="#F59E0B"
            badge={assignedCount > 0 ? String(assignedCount) : undefined}
            onClick={() => navigate("/b/service/tasks")}
          />
          <Quick icon={<Clock />} label="历史订单" tint="#3B82F6" onClick={() => navigate("/b/service/history")} />
          <Quick icon={<Wrench />} label="我的" tint="#7C3AED" onClick={() => navigate("/b/service/profile")} />
        </div>
      </div>

      <div className="px-4">
        <SectionHeader
          title="进行中订单"
          extra={`${activeOrders.length} 单`}
          onExtra={() => navigate("/b/service/tasks")}
        />
        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_16px_rgba(60,120,200,0.08)] text-center">
            <div className="text-[12px] text-text-tertiary">暂无进行中的订单</div>
          </div>
        ) : (
          activeOrders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl p-3.5 shadow-[0_4px_16px_rgba(60,120,200,0.08)]">
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px]"
                  style={{ background: "#F59E0B14", color: "#F59E0B" }}
                >
                  {o.serviceType}
                </div>
                <StatusBadge kind={activeOrderKind(o.status)}>{activeOrderLabel(o.status)}</StatusBadge>
              </div>
              <div className="text-[14px] text-text-heading">
                {o.addressTo ? `${o.address} → ${o.addressTo}` : o.address}
              </div>
              <div className="mt-1 space-y-1 text-[12px] text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-text-tertiary" /> {o.address.split("·")[0]?.trim() || o.address}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-text-tertiary" /> {o.createdAt}
                  {o.priceQuote ? ` · 报价 ¥${o.priceQuote}` : ""}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-[#F0F0F0] pt-2.5">
                <button
                  onClick={() => location.href = `tel:${staffItem?.phone || "13800001001"}`}
                  className="size-8 rounded-full bg-primary-50 flex items-center justify-center"
                >
                  <Phone className="size-4 text-primary" />
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setQuoteFlow("photo")}
                  className="px-4 h-9 rounded-full text-white text-[13px] shadow-[0_2px_8px_rgba(245,158,11,0.32)]"
                  style={{ background: "#F59E0B" }}
                >
                  完工拍照
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4">
        <SectionHeader title="最新通知" extra="查看全部" onExtra={() => navigate("/b/service/notifications")} />
        {unreadCount > 0 ? (
          <div
            onClick={() => navigate("/b/service/notifications")}
            className="bg-white rounded-2xl p-3.5 shadow-[0_4px_16px_rgba(60,120,200,0.08)] flex items-center gap-3 cursor-pointer active:scale-[0.99] transition"
          >
            <div
              className="size-10 rounded-full flex items-center justify-center"
              style={{ background: "#F59E0B14", color: "#F59E0B" }}
            >
              <Bell className="size-5" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] text-text-heading">
                您有 <span className="text-[#EF4444] font-semibold">{unreadCount}</span> 条未读消息
              </div>
              <div className="text-[11px] text-text-tertiary mt-0.5">点击查看订单通知和系统公告</div>
            </div>
            <ChevronRight className="size-4 text-text-tertiary" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)] text-center">
            <div className="text-[12px] text-text-tertiary">暂无新通知</div>
          </div>
        )}
      </div>

      <QuoteAndPhotoFlow open={quoteFlow !== null} initial={quoteFlow ?? "quote"} onClose={() => setQuoteFlow(null)} />
    </div>
  )
}

function DataCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-[0_4px_16px_rgba(60,120,200,0.08)]">
      <div className="text-[11px] text-text-caption">{label}</div>
      <div className="mt-1 text-text-heading text-[22px] font-medium">{value}</div>
      <div className="text-[11px] text-text-tertiary">{sub}</div>
    </div>
  )
}

function Quick({
  icon,
  label,
  tint,
  badge,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  tint: string
  badge?: string
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 py-2 active:scale-95 transition">
      <div
        className="relative size-12 rounded-2xl flex items-center justify-center"
        style={{
          background: `${tint}14`,
          color: tint,
          boxShadow: `0 4px 12px ${tint}22`,
        }}
      >
        <span className="[&>svg]:size-5">{icon}</span>
        {badge && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[12px] text-text-body">{label}</span>
    </button>
  )
}

function SectionHeader({ title, extra, onExtra }: { title: string; extra?: string; onExtra?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <h3 className="text-[14px] text-text-heading">{title}</h3>
      {extra && (
        <button onClick={onExtra} className="text-[11px] text-text-tertiary active:opacity-60">
          {extra} <ChevronRight className="size-3 inline" />
        </button>
      )}
    </div>
  )
}
