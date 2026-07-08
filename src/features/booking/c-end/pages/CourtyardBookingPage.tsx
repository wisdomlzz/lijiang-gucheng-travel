import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { useContentCourtyardStore } from "@/platform/content/courtyard-store"
import { useBookingStore, BOOKING_SLOTS } from "@/features/booking/store/booking-store"
import { useAuthStore } from "@/platform/auth"
import { Calendar, Clock, Users, QrCode, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

function getNext7Days(): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export function CourtyardBookingPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const userId = useAuthStore((s) => s.user?.id ?? "u_c_001")
  const userName = useAuthStore((s) => s.user?.name ?? "游客")
  const courtyard = useContentCourtyardStore((s) => s.courtyards.find((c) => c.id === id))
  const createBooking = useBookingStore((s) => s.createBooking)
  const getBookedByCourtyard = useBookingStore((s) => s.getBookingsByCourtyard)

  const days = getNext7Days()
  const [date, setDate] = useState(days[0])
  const [slot, setSlot] = useState(BOOKING_SLOTS[0])
  const [visitors, setVisitors] = useState(1)
  const [successCode, setSuccessCode] = useState<string | null>(null)

  if (!courtyard) return <div className="p-4 text-center text-text-tertiary">院落不存在</div>

  const handleBooking = async () => {
    const result = await createBooking({
      courtyardId: courtyard.id,
      courtyardName: courtyard.name,
      userId,
      userName,
      userPhone: "138****1001",
      date,
      slot,
      visitors,
    })
    if (!result.ok) {
      toast.error(result.msg)
      return
    }
    setSuccessCode(result.booking!.code)
    toast.success("预约成功！请保存核销码")
  }

  if (successCode) {
    return (
      <div className="min-h-full bg-surface-page">
        <PageHeader title="预约成功" back={`/c/courtyard/${courtyard.id}`} />
        <div className="px-4 pt-8">
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <p className="text-[16px] font-semibold text-text-heading">{courtyard.name}</p>
            <p className="text-[13px] text-text-body mt-1">
              {date} · {slot} · {visitors}人
            </p>
            <div className="mt-5 bg-gray-50 rounded-xl p-4">
              <p className="text-[11px] text-text-tertiary mb-2">到店出示此核销码</p>
              <div className="flex items-center justify-center gap-2">
                <QrCode size={20} className="text-primary" />
                <span className="text-2xl font-bold tracking-widest text-primary">{successCode}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => navigate("/c/my-bookings")}
                className="flex-1 h-10 rounded-xl bg-primary text-white text-[13px] font-medium"
              >
                查看我的预约
              </button>
              <button
                onClick={() => navigate("/c/courtyards")}
                className="flex-1 h-10 rounded-xl bg-gray-100 text-text-body text-[13px]"
              >
                返回院落
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-surface-page pb-24">
      <PageHeader title="院落预约" back={`/c/courtyard/${courtyard.id}`} />

      <div className="px-4 pt-4 space-y-3">
        {/* 院落信息 */}
        <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
          <img src={courtyard.imageUrl} alt={courtyard.name} className="w-14 h-14 rounded-lg object-cover" />
          <div>
            <p className="text-[15px] font-semibold text-text-heading">{courtyard.name}</p>
            <p className="text-[12px] text-text-tertiary">
              {courtyard.location} · {courtyard.hours}
            </p>
          </div>
        </div>

        {/* 日期选择 */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-[13px] font-semibold text-text-heading mb-3 flex items-center gap-1.5">
            <Calendar size={15} /> 选择日期
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((d) => {
              const isToday = d === new Date().toISOString().slice(0, 10)
              return (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  className={`shrink-0 w-14 h-16 rounded-xl flex flex-col items-center justify-center transition ${
                    date === d ? "bg-primary text-white" : "bg-gray-50 text-text-body"
                  }`}
                >
                  <span className="text-[10px] opacity-80">
                    {isToday ? "今天" : new Date(d).toLocaleDateString("zh-CN", { weekday: "short" })}
                  </span>
                  <span className="text-[18px] font-bold mt-0.5">{d.slice(8)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 时段选择 */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-[13px] font-semibold text-text-heading mb-3 flex items-center gap-1.5">
            <Clock size={15} /> 选择时段
          </p>
          <div className="grid grid-cols-3 gap-2">
            {BOOKING_SLOTS.map((s) => {
              const booked = getBookedByCourtyard(courtyard.id, date)
                .filter((b) => b.slot === s)
                .reduce((sum, b) => sum + b.visitors, 0)
              const full = booked >= 20
              return (
                <button
                  key={s}
                  onClick={() => !full && setSlot(s)}
                  disabled={full}
                  className={`h-11 rounded-lg text-[12px] font-medium transition ${
                    full
                      ? "bg-gray-50 text-text-quaternary"
                      : slot === s
                        ? "bg-primary text-white"
                        : "bg-gray-50 text-text-body"
                  }`}
                >
                  <div>{s}</div>
                  {!full && <div className="text-[9px] opacity-70 mt-0.5">余 {20 - booked}</div>}
                  {full && <div className="text-[9px] mt-0.5">已满</div>}
                </button>
              )
            })}
          </div>
        </div>

        {/* 参观人数 */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-[13px] font-semibold text-text-heading mb-3 flex items-center gap-1.5">
            <Users size={15} /> 参观人数
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVisitors((v) => Math.max(1, v - 1))}
              className="w-9 h-9 rounded-full bg-gray-100 text-text-body text-[18px]"
            >
              -
            </button>
            <span className="text-[20px] font-bold w-10 text-center">{visitors}</span>
            <button
              onClick={() => setVisitors((v) => Math.min(10, v + 1))}
              className="w-9 h-9 rounded-full bg-gray-100 text-text-body text-[18px]"
            >
              +
            </button>
            <span className="text-[12px] text-text-tertiary ml-auto">免费参观，需预约</span>
          </div>
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[390px] bg-white border-t border-gray-100 p-3">
        <button
          onClick={handleBooking}
          className="w-full h-12 rounded-xl bg-primary text-white text-[15px] font-medium active:scale-95 transition"
        >
          确认预约
        </button>
      </div>
    </div>
  )
}
