import { useState, useEffect } from "react"
import { PageLayout } from "../components/common/PageLayout"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { api } from "@/api/client"
import { toast } from "sonner"
import { Settings } from "lucide-react"

const CONFIG_LABELS: Record<string, { label: string; desc: string }> = {
  cancelFeeRules: { label: "取消扣费规则", desc: "JSON: {beforeAccept, afterAccept, afterPay, minAmount, maxAmount}" },
  dispatchRetryTimes: { label: "派单重试次数", desc: "失败后转人工" },
  acceptTimeoutMinutes: { label: "接单超时(分钟)", desc: "A20 超时回 A10" },
  payTimeoutMinutes: { label: "支付超时(分钟)", desc: "A35 超时转 S90" },
  autoConfirmHours: { label: "自动确认完工(小时)", desc: "S55 超时转 S40" },
  settlementTDays: { label: "结算 T+N 天", desc: "T+7 后进可提现" },
  minWithdrawalAmount: { label: "最低提现金额", desc: "" },
  dailyOrderLimit: { label: "每日接单上限", desc: "超限不再派单" },
}

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.list("system_configs", { pageSize: 100 }).then((res: any) => {
      const map: Record<string, string> = {}
      if (res.items) {
        res.items.forEach((c: any) => { map[c.configKey] = c.configValue })
      }
      setConfigs(map)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const handleSave = async (key: string) => {
    try {
      const res = await api.list("system_configs", { pageSize: 100 }) as any
      const cfg = res.items?.find((c: any) => c.configKey === key)
      if (cfg) {
        await api.update("system_configs", cfg.id, { configValue: configs[key] })
        toast.success(`${CONFIG_LABELS[key]?.label || key} 已保存`)
      } else {
        toast.error("配置项不存在")
      }
    } catch {
      toast.error("保存失败")
    }
  }

  if (loading) {
    return (
      <PageLayout title="系统配置" description="取消扣费、派单参数、超时时间等">
        <div className="text-center text-muted-foreground py-8">加载中...</div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="系统配置" description="取消扣费、派单参数、超时时间等">
      <div className="space-y-4">
        {Object.entries(CONFIG_LABELS).map(([key, { label, desc }]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="size-4 text-muted-foreground" />
                <Label className="text-sm font-medium">{label}</Label>
              </div>
              {desc && <p className="text-xs text-muted-foreground mb-2">{desc}</p>}
              <Input
                value={configs[key] || ""}
                onChange={(e) => setConfigs({ ...configs, [key]: e.target.value })}
                className="mb-2"
              />
              <Button size="sm" onClick={() => handleSave(key)}>保存</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  )
}