import { useState, useMemo, useEffect } from "react"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { Button } from "../../../../shared/components/ui/button"
import { Badge } from "../../../../shared/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../../shared/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { ConfirmDialog } from "../../../../desktop/components/common/ConfirmDialog"
import { Wallet, TrendingUp, Banknote, Smartphone, Users, Clock } from "lucide-react"
import { toast } from "sonner"
import { useSettlementStore } from "../../store"
import type { WithdrawalRequest } from "../../store/settlement-store"
import { useStaffStore } from "../../store"

export function SettlementPage() {
  const [gmvStats, setGmvStats] = useState<any>(null)
  const [gmvPeriod, setGmvPeriod] = useState("month")

  useEffect(() => {
    fetch(`http://localhost:3001/api/v1/orders/gmv-stats?period=${gmvPeriod}`)
      .then((r) => r.json())
      .then((d) => setGmvStats(d.data))
      .catch(() => {})
  }, [gmvPeriod])

  const incomes = useSettlementStore((s) => s.incomes)
  const withdrawals = useSettlementStore((s) => s.withdrawals)
  const getStaffSummary = useSettlementStore((s) => s.getStaffSummary)
  const approveWithdrawal = useSettlementStore((s) => s.approveWithdrawal)
  const rejectWithdrawal = useSettlementStore((s) => s.rejectWithdrawal)
  const staff = useStaffStore((s) => s.staff)

  // 汇总用 useMemo 派生（避免选择器返回新对象导致无限渲染）
  const summary = useMemo(() => {
    const staffIds = new Set(incomes.map((i) => i.staffId))
    const now = new Date()
    const isThisMonth = (s: string) => {
      const d = new Date(s)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }
    return {
      totalStaff: staffIds.size,
      totalIncome: incomes.reduce((s, i) => s + i.amount, 0),
      monthIncome: incomes.filter((i) => isThisMonth(i.completedAt)).reduce((s, i) => s + i.amount, 0),
      pendingWithdraw: withdrawals.filter((w) => w.status === "pending").length,
    }
  }, [incomes, withdrawals])

  const [rejectTarget, setRejectTarget] = useState<WithdrawalRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  // 按服务人员汇总收入
  const staffIncomes = staff
    .map((s) => ({ staff: s, summary: getStaffSummary(s.id) }))
    .filter((x) => x.summary.total > 0)
    .sort((a, b) => b.summary.total - a.summary.total)

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending")

  const handleApprove = (w: WithdrawalRequest) => {
    approveWithdrawal(w.id, "管理员")
    toast.success(`已通过 ${w.staffName} 的提现申请`)
  }
  const handleReject = () => {
    if (rejectTarget) {
      rejectWithdrawal(rejectTarget.id, "管理员", rejectReason)
      toast.success("已驳回")
      setRejectTarget(null)
      setRejectReason("")
    }
  }

  return (
    <PageLayout title="结算管理" description="便民服务结算闭环：收入自动汇总（订单完成时录入）+ 提现审核">
      {/* 汇总卡片 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { icon: Users, label: "有收入人员", value: summary.totalStaff, color: "text-primary" },
          { icon: TrendingUp, label: "总收入", value: `¥${summary.totalIncome}`, color: "text-emerald-600" },
          { icon: Wallet, label: "本月收入", value: `¥${summary.monthIncome}`, color: "text-amber-600" },
          { icon: Clock, label: "待审提现", value: summary.pendingWithdraw, color: "text-rose-500" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-lg border border-border-light p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-text-tertiary">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <p className={`text-[22px] font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* GMV 统计（线上/现金） */}
      <div className="bg-white rounded-lg border border-border-light p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-medium text-text-heading">GMV 统计</h3>
          <div className="flex gap-1">
            {["day", "week", "month"].map((p) => (
              <button
                key={p}
                onClick={() => setGmvPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  gmvPeriod === p ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                }`}
              >
                {p === "day" ? "日" : p === "week" ? "周" : "月"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-border-light p-4">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">线上支付</span>
            </div>
            <div className="text-lg font-semibold text-primary">
              ¥{(gmvStats?.online?.amount ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{(gmvStats?.online?.count ?? 0)} 笔订单</div>
          </div>
          <div className="bg-white rounded-lg border border-border-light p-4">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="size-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">现金支付</span>
            </div>
            <div className="text-lg font-semibold text-amber-600">
              ¥{(gmvStats?.cash?.amount ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{(gmvStats?.cash?.count ?? 0)} 笔订单</div>
          </div>
          <div className="bg-white rounded-lg border border-border-light p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="size-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">总计</span>
            </div>
            <div className="text-lg font-semibold text-emerald-600">
              ¥{(gmvStats?.total?.amount ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{(gmvStats?.total?.count ?? 0)} 笔订单</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="income">
        <TabsList>
          <TabsTrigger value="income">收入统计</TabsTrigger>
          <TabsTrigger value="withdrawal">
            提现管理{" "}
            {pendingWithdrawals.length > 0 && <Badge className="ml-1.5 bg-rose-500">{pendingWithdrawals.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <div className="bg-white rounded-lg border border-border-light overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>服务人员</TableHead>
                  <TableHead>累计收入</TableHead>
                  <TableHead>线上收款</TableHead>
                  <TableHead>现金收款</TableHead>
                  <TableHead>本月收入</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffIncomes.map(({ staff, summary: s }) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-[11px] text-text-tertiary">{staff.serviceTypes?.join(" · ")}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">¥{s.total}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-[12px]">
                        <Smartphone size={12} className="text-primary" />¥{s.online}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-[12px]">
                        <Banknote size={12} className="text-amber-500" />¥{s.cash}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">¥{s.monthTotal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="withdrawal">
          <div className="bg-white rounded-lg border border-border-light overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>服务人员</TableHead>
                  <TableHead>提现金额</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.staffName}</TableCell>
                    <TableCell className="font-semibold">¥{w.amount}</TableCell>
                    <TableCell className="text-[12px] text-text-secondary">{w.requestedAt}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          w.status === "approved" ? "default" : w.status === "rejected" ? "destructive" : "secondary"
                        }
                      >
                        {w.status === "approved" ? "已通过" : w.status === "rejected" ? "已驳回" : "待审核"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {w.status === "pending" && (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" onClick={() => handleApprove(w)}>
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectTarget(w)
                              setRejectReason("")
                            }}
                          >
                            驳回
                          </Button>
                        </div>
                      )}
                      {w.status !== "pending" && <span className="text-[11px] text-text-tertiary">{w.reviewedAt}</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) setRejectTarget(null)
        }}
        title="驳回提现申请"
        description={rejectTarget ? `确认驳回 ${rejectTarget.staffName} 的 ¥${rejectTarget.amount} 提现申请？` : ""}
        confirmText="确认驳回"
        onConfirm={handleReject}
      />
      {rejectTarget && (
        <div className="mt-4">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="驳回原因（选填）"
            className="w-full text-[13px] outline-none border rounded-md p-2 resize-none"
            rows={2}
          />
        </div>
      )}
    </PageLayout>
  )
}
