import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/components/ui/card"
import { Button } from "../../../shared/components/ui/button"
import { Badge } from "../../../shared/components/ui/badge"
import { PageLayout } from "../../components/common/PageLayout"
import { useStaffStore } from "../../../shared/services/staff"
import { useConvenienceStore } from "../../../shared/services/convenience"
import { ToggleLeft, ToggleRight, RotateCcw } from "lucide-react"
import { toast } from "sonner"

export default function DispatchConfigPage() {
  const autoDispatch = useStaffStore((s) => s.autoDispatch)
  const setAutoDispatch = useStaffStore((s) => s.setAutoDispatch)
  const dispatchLog = useConvenienceStore((s) => s.dispatchLog)
  const [refreshedAt, setRefreshedAt] = useState(() => new Date())
  const [localLog, setLocalLog] = useState(dispatchLog)

  const recentLogs = useMemo(() => localLog.slice(0, 20), [localLog])

  const refreshLogs = () => {
    const now = new Date()
    setRefreshedAt(now)
    setLocalLog([
      {
        type: "retry",
        orderId: "CONFIG-CHECK",
        staffName: "系统巡检",
        reason: `已同步最新派单日志 ${now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`,
      } as any,
      ...dispatchLog,
    ])
    toast.success("派单日志已刷新")
  }

  return (
    <PageLayout title="派单配置" description="配置便民服务自动派单策略">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">自动派单开关</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{autoDispatch ? "已开启" : "已关闭"}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {autoDispatch ? "系统将自动为待派单订单匹配最优服务人员" : "需要手动为每个订单指派服务人员"}
                </div>
              </div>
              <Button
                variant={autoDispatch ? "default" : "outline"}
                size="sm"
                onClick={() => { setAutoDispatch(!autoDispatch); toast.success(autoDispatch ? "自动派单已关闭" : "自动派单已开启") }}
              >
                {autoDispatch ? <ToggleRight className="size-4 mr-1" /> : <ToggleLeft className="size-4 mr-1" />}
                {autoDispatch ? "关闭" : "开启"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">派单策略说明</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" />点对点服务：按距离分组，同组内选任务最少人员</li>
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" />片区服务：按片区匹配，选该片区任务最少人员</li>
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" />最多尝试 3 名服务人员，全部拒绝后转人工处理</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">派单日志（最近 20 条）</CardTitle>
            <div className="mt-1 text-xs text-muted-foreground">
              最近刷新：{refreshedAt.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshLogs}><RotateCcw className="size-3 mr-1" />刷新</Button>
        </CardHeader>
        <CardContent className="max-h-80 overflow-y-auto">
          {recentLogs.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">暂无派单日志</div>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge className={
                      log.type === "auto_success" ? "bg-emerald-100 text-emerald-700" :
                      log.type === "auto_fail" ? "bg-rose-100 text-rose-700" :
                      log.type === "manual" ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }>
                      {log.type === "auto_success" ? "自动成功" : log.type === "auto_fail" ? "自动失败" : log.type === "manual" ? "人工派单" : "重试"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{log.orderId}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{log.staffName}{log.reason ? ` - ${log.reason}` : ""}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  )
}
