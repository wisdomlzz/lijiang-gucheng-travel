import { useMemo } from "react"
import { useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { EmptyState } from "@/shared/components/mobile/EmptyState"
import { useBookingStore } from "@/features/booking/store"
import { useAuthStore } from "@/platform/auth"
import { Calendar, Clock, Users, QrCode, CheckCircle2, XCircle } from "lucide-react"

const STATUS_META = {
  pending: { label: "待核销", color: "text-amber-600", bg: "bg-amber-50" },
  checked: { label: "已核销", color: "text-emerald-600", bg: "bg-emerald-50" },
  cancelled: { label: "已取消", color: "text-text-tertiary", bg: "bg-gray-100" },
  expired: { label: "已过期", color: "text-text-tertiary", bg: "bg-gray-100" },
}

export function MyBookingsPage() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id ?? "u_c_001")
  const allBookings = useBookingStore((s) => s.bookings)
  const cancelBooking = useBookingStore((s) => s.cancelBooking)

  const bookings = useMemo(() => allBookings.filter((b) => b.userId === userId), [allBookings, userId])

  return (
    <div className="min-h-full bg-surface-page pb-6">
      <PageHeader title="我的预约" back="/c/profile" />

      <div className="px-3 py-4 space-y-3">
        {bookings.length === 0 ? (
          <EmptyState title="暂无预约记录" action={{ label: "去逛逛", onClick: () => navigate("/c/courtyards") }} />
        ) : (
          bookings.map((b) => {
            const meta = STATUS_META[b.status]
            return (
              <div key={b.id} className="bg-white rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-text-heading">{b.courtyardName}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[12px] text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {b.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {b.slot}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {b.visitors}人
                      </span>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                </div>

                {b.status === "pending" && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode size={18} className="text-primary" />
                      <span className="text-[16px] font-bold tracking-widest text-primary">{b.code}</span>
                    </div>
                    <span className="text-[11px] text-text-tertiary">到店出示</span>
                  </div>
                )}
                {b.status === "checked" && (
                  <div className="mt-3 flex items-center gap-1.5 text-[12px] text-emerald-600">
                    <CheckCircle2 size={14} /> 核销时间 {b.checkedAt}
                  </div>
                )}
                {b.status === "pending" && (
                  <button
                    onClick={() => cancelBooking(b.id)}
                    className="mt-3 text-[12px] text-rose-500 flex items-center gap-1"
                  >
                    <XCircle size={13} /> 取消预约
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
