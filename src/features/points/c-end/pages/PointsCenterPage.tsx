import { useMemo } from "react"
import { useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { usePointsStore } from "@/features/points/store/points-store"
import { useAuthStore } from "@/platform/auth"
import { Gift, TrendingUp, TrendingDown, ShoppingBag, ExternalLink, Sparkles } from "lucide-react"
import { CRMEB_ADMIN_URL } from "@/shared/constants"
import { toast } from "sonner"

export function PointsCenterPage() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id ?? "u_c_001")
  // 选原始 state，useMemo 派生（避免选择器返回新引用导致无限渲染）
  const accounts = usePointsStore((s) => s.accounts)
  const allLedgers = usePointsStore((s) => s.ledgers)
  const transact = usePointsStore((s) => s.transact)

  const account = useMemo(
    () => accounts[userId] ?? { userId, balance: 0, totalEarned: 0, totalUsed: 0 },
    [accounts, userId]
  )
  const ledgers = useMemo(() => allLedgers.filter((l) => l.userId === userId), [allLedgers, userId])

  // 按来源汇总
  const sourceSummary = ledgers.reduce(
    (acc, l) => {
      if (l.direction === "IN") acc[l.sourceLabel] = (acc[l.sourceLabel] ?? 0) + l.delta
      return acc
    },
    {} as Record<string, number>
  )

  // 模拟商城消费赚积分（Demo：CRMEB 外链，此处模拟回调）
  const simulateMallEarn = async () => {
    const result = await transact(userId, "mall_purchase", `mock-mall-${Date.now()}`, 10)
    result.ok ? toast.success(result.msg) : toast.error(result.msg)
  }

  // 积分兑换（跳外链 CRMEB）
  const goRedeem = () => window.open(CRMEB_ADMIN_URL, "_blank")

  return (
    <div className="min-h-full bg-gradient-to-b from-primary to-primary/80 pb-6">
      <PageHeader title="积分中心" back="/c/profile" />

      {/* 余额卡片 */}
      <div className="px-4 pt-2">
        <div className="bg-white/15 backdrop-blur rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[13px] opacity-90">我的积分</span>
            <Sparkles size={16} className="opacity-80" />
          </div>
          <p className="text-4xl font-bold mt-2 tracking-tight">{account.balance}</p>
          <div className="flex gap-6 mt-3 text-[12px] opacity-90">
            <span>累计获取 {account.totalEarned}</span>
            <span>已使用 {account.totalUsed}</span>
          </div>
        </div>
      </div>

      {/* 积分来源汇总 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4">
          <p className="text-[14px] font-semibold text-text-heading mb-3">积分来源</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(sourceSummary).map(([label, pts]) => (
              <div key={label} className="flex items-center justify-between bg-surface-page rounded-lg px-3 py-2">
                <span className="text-[12px] text-text-body">{label}</span>
                <span className="text-[13px] font-semibold text-primary">+{pts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 入口 */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={simulateMallEarn}
          className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition"
        >
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
            <ShoppingBag size={20} className="text-primary" />
          </div>
          <span className="text-[13px] font-medium text-text-heading">模拟商城消费</span>
          <span className="text-[11px] text-text-tertiary">+10 积分</span>
        </button>
        <button
          onClick={goRedeem}
          className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition"
        >
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Gift size={20} className="text-amber-500" />
          </div>
          <span className="text-[13px] font-medium text-text-heading">积分兑换</span>
          <span className="text-[11px] text-text-tertiary">
            跳转商城 <ExternalLink size={10} className="inline" />
          </span>
        </button>
      </div>

      {/* 积分明细流水 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl overflow-hidden">
          <p className="text-[14px] font-semibold text-text-heading px-4 pt-4 pb-2">积分明细</p>
          <div className="divide-y divide-gray-50">
            {ledgers.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${l.direction === "IN" ? "bg-emerald-50" : "bg-orange-50"}`}
                >
                  {l.direction === "IN" ? (
                    <TrendingUp size={16} className="text-emerald-500" />
                  ) : (
                    <TrendingDown size={16} className="text-orange-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-text-heading">{l.sourceLabel}</p>
                  <p className="text-[11px] text-text-tertiary">
                    {l.createdAt}
                    {l.refId ? ` · ${l.refId}` : ""}
                  </p>
                </div>
                <span
                  className={`text-[15px] font-bold ${l.direction === "IN" ? "text-emerald-500" : "text-orange-500"}`}
                >
                  {l.direction === "IN" ? "+" : "-"}
                  {l.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
