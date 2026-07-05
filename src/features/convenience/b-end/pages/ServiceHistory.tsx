import { useState, useMemo, useCallback } from "react"
import { Filter, ChevronRight, MapPin, Wallet } from "lucide-react"
import { StatusBadge } from "@/shared/components/ui/status-badge"
import { ServiceOrderDetail, ServiceOrder } from "./ServiceOrderDetail"
import { useConvenienceStore } from "../../store"
import { useAuthStore } from "@/platform/auth"
import { useSearch } from "@/shared/hooks/useSearch"
import { useLoadMore } from "@/shared/hooks/useLoadMore"
import type { ConvenienceOrder } from "../../../../shared/types"
import { convToBState } from "../../shared/service-state"

const TABS = ["全部", "已完成", "已取消"] as const

const TIME_FILTERS = [
  { label: "近 7 天", days: 7 },
  { label: "近 30 天", days: 30 },
  { label: "近 90 天", days: 90 },
] as const

const SERVICE_COLORS: Record<string, string> = {
  行李搬运: "#F59E0B",
  垃圾清运: "#0891B2",
  送水服务: "#3B82F6",
  布草配送: "#7C3AED",
  应急医疗: "#DC2626",
}

function mapConv(o: ConvenienceOrder): ServiceOrder {
  const state = convToBState(o.status)
  return {
    id: o.id,
    state,
    type: o.serviceType,
    typeColor: SERVICE_COLORS[o.serviceType] ?? "#6B7280",
    addr: o.addressTo ? `${o.address} → ${o.addressTo}` : o.address,
    buyer: o.userId.replace("u_c_", "用").slice(0, 3) + "**",
    buyerPhone: "****",
    time: o.createdAt,
    ref: o.refPrice ? `参考价 ¥${o.refPrice}` : "",
    amount: o.priceQuote ? `¥${o.priceQuote}` : undefined,
    pay: o.payMethod,
    note: o.note,
    cancelReason: o.cancelRequested ? "用户申请取消" : undefined,
    images: o.images,
    paymentProof: o.paymentProof,
    completionPhotos: o.completionPhotos,
  }
}

export function ServiceHistory() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("全部")
  const [timeFilter, setTimeFilter] = useState<number>(30)
  const [openId, setOpenId] = useState<string | null>(null)

  const currentUser = useAuthStore((s) => s.user)
  const currentStaffId = currentUser?.staffId ?? ""
  const convOrders = useConvenienceStore((s) => s.orders)

  // 计算当前服务人员的历史订单（已完成/已取消）
  const allStaffOrders = useMemo(
    () => convOrders.filter((o) => o.staffId === currentStaffId).map(mapConv),
    [convOrders, currentStaffId]
  )

  // 计算本月收入
  const today = new Date()
  const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  const monthOrders = convOrders.filter((o) => o.staffId === currentStaffId && o.createdAt.startsWith(monthStr))
  const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.priceQuote ?? 0), 0)
  const cashRevenue = monthOrders.filter((o) => o.payMethod === "cash").reduce((sum, o) => sum + (o.priceQuote ?? 0), 0)
  const onlineRevenue = monthOrders
    .filter((o) => o.payMethod === "online")
    .reduce((sum, o) => sum + (o.priceQuote ?? 0), 0)

  // Time filter cutoff
  const cutoffDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - timeFilter)
    return d.toISOString().slice(0, 10)
  }, [timeFilter])

  const tabAndTimeFiltered = useMemo(
    () =>
      allStaffOrders.filter((h) => {
        const tabMatch = tab === "全部" ? true : tab === "已完成" ? h.state === "done" : h.state === "cancelled"
        const timeMatch = h.time >= cutoffDate
        return tabMatch && timeMatch
      }),
    [allStaffOrders, tab, cutoffDate]
  )

  const searchFn = useCallback((item: ServiceOrder, query: string) => {
    const q = query.toLowerCase()
    return item.id.toLowerCase().includes(q) || item.addr.toLowerCase().includes(q)
  }, [])

  const { query, setQuery, filtered } = useSearch(tabAndTimeFiltered, searchFn)
  const { visible, hasMore, loadMore, total } = useLoadMore(filtered, 10)

  const opened = allStaffOrders.find((o) => o.id === openId) ?? null

  return (
    <div className="pb-4">
      <div
        className="px-4 pt-4 pb-5"
        style={{
          background: "linear-gradient(180deg, #FCD9A8 0%, #FDE7C8 60%, #EFF6FC 100%)",
        }}
      >
        <h1 className="text-[18px] mb-3">历史订单</h1>
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-[0 4px 16px_rgba(60,120,200,0.10)]">
          <div className="text-[11px] text-text-caption">本月累计收入</div>
          <div className="mt-1 text-text-heading text-[28px] font-medium">¥{monthRevenue.toLocaleString()}</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-primary-50/60 p-2.5">
              <div className="flex items-center gap-1 text-[11px] text-text-caption">
                <Wallet className="size-3" /> 现金收款
              </div>
              <div className="mt-0.5 text-[15px] text-text-heading">¥{cashRevenue.toLocaleString()}</div>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: "#EDE9FE99" }}>
              <div className="flex items-center gap-1 text-[11px]" style={{ color: "#7C3AED" }}>
                <Wallet className="size-3" /> 线上收款
              </div>
              <div className="mt-0.5 text-[15px]" style={{ color: "#5B21B6" }}>
                ¥{onlineRevenue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setQuery("")
              }}
              className={`px-3 h-7 rounded-full text-[12px] transition ${
                tab === t ? "text-white" : "bg-white text-text-secondary"
              }`}
              style={tab === t ? { background: "#F59E0B" } : {}}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {TIME_FILTERS.map((tf) => (
            <button
              key={tf.days}
              onClick={() => {
                setTimeFilter(tf.days)
              }}
              className={`px-2 h-7 rounded-full text-[11px] transition ${
                timeFilter === tf.days ? "text-white" : "bg-white text-text-secondary"
              }`}
              style={timeFilter === tf.days ? { background: "#F59E0B" } : {}}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-2">
        <div className="relative mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索订单号、地址..."
            className="w-full h-9 pl-3 pr-3 rounded-xl border border-slate-150 bg-white text-[13px] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="px-4 mt-2 space-y-2">
        {visible.length === 0 ? (
          <div className="text-center text-[12px] text-text-tertiary py-10">
            {query ? "没有匹配的订单" : "暂无历史订单"}
          </div>
        ) : (
          visible.map((h) => (
            <div
              key={h.id}
              onClick={() => setOpenId(h.id)}
              className="bg-white rounded-2xl p-3.5 shadow-[0 4px_16px_rgba(60,120,200,0.08)] active:scale-[0.99] transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[13px] text-text-heading">{h.type}</div>
                <StatusBadge kind={h.state === "done" ? "done" : "closed"}>
                  {h.state === "done" ? "已完成" : "已取消"}
                </StatusBadge>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                <MapPin className="size-3.5 text-text-tertiary" /> {h.addr}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[#F0F0F0] pt-2">
                <span className="text-[11px] text-text-tertiary">{h.time}</span>
                <div className="flex items-center gap-2">
                  {h.amount && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md"
                      style={{
                        background: h.pay === "online" ? "#EDE9FE" : "#F1F5F9",
                        color: h.pay === "online" ? "#7C3AED" : "var(--text-tertiary)",
                      }}
                    >
                      {h.pay === "online" ? "线上已收款" : "现金已收款"}
                    </span>
                  )}
                  <span className="text-[14px] text-text-heading font-medium">{h.amount ?? "—"}</span>
                  <ChevronRight className="size-4 text-text-tertiary" />
                </div>
              </div>
            </div>
          ))
        )}
        {hasMore && (
          <button onClick={loadMore} className="w-full py-3 text-[13px] text-primary font-medium">
            加载更多
          </button>
        )}
      </div>

      <ServiceOrderDetail order={opened} onClose={() => setOpenId(null)} onStateChange={() => {}} />
    </div>
  )
}
