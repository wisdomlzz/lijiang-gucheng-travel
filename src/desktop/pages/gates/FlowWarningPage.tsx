import { useState } from "react"
import { PageLayout } from "../../components/common/PageLayout"
import { Button } from "../../../shared/components/ui/button"
import { Badge } from "../../../shared/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../shared/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { Input } from "../../../shared/components/ui/input"
import { Switch } from "../../../shared/components/ui/switch"
import { AlertTriangle, Activity, Settings2, RefreshCw, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useFlowWarningStore, LEVEL_META, type WarningLevel } from "../../../features/flow-warning/store"

export function FlowWarningPage() {
  const areas = useFlowWarningStore((s) => s.areas)
  const rules = useFlowWarningStore((s) => s.rules)
  const events = useFlowWarningStore((s) => s.events)
  const getAreaLevel = useFlowWarningStore((s) => s.getAreaLevel)
  const simulateFlow = useFlowWarningStore((s) => s.simulateFlow)
  const triggerWarning = useFlowWarningStore((s) => s.triggerWarning)
  const resolveEvent = useFlowWarningStore((s) => s.resolveEvent)
  const updateRule = useFlowWarningStore((s) => s.updateRule)

  const [editingRule, setEditingRule] = useState<string | null>(null)

  const activeEvents = events.filter((e) => e.status === "active")
  const redCount = areas.filter((a) => getAreaLevel(a.id) === "red").length
  const orangeCount = areas.filter((a) => getAreaLevel(a.id) === "orange").length

  const handleSimulate = () => {
    simulateFlow()
    // 自动触发超阈值区域的预警
    areas.forEach((a) => triggerWarning(a.id))
    toast.success("已刷新实时人流数据")
  }

  return (
    <PageLayout title="人流量预警管理" description="PC 规则配置 + 实时监测 + 预警事件，联动 C 端地图色块">
      {/* 汇总 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-border-light p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-text-tertiary">监测区域</span>
            <Activity size={16} className="text-primary" />
          </div>
          <p className="text-[22px] font-bold mt-1">{areas.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-border-light p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-text-tertiary">红色预警</span>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <p className="text-[22px] font-bold mt-1 text-red-500">{redCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-border-light p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-text-tertiary">橙色拥挤</span>
            <AlertTriangle size={16} className="text-orange-500" />
          </div>
          <p className="text-[22px] font-bold mt-1 text-orange-500">{orangeCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-border-light p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-text-tertiary">活跃事件</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <p className="text-[22px] font-bold mt-1 text-amber-600">{activeEvents.length}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <Tabs defaultValue="realtime">
          <TabsList>
            <TabsTrigger value="realtime">实时监测</TabsTrigger>
            <TabsTrigger value="events">预警事件</TabsTrigger>
            <TabsTrigger value="rules">规则配置</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={handleSimulate}>
          <RefreshCw size={14} className="mr-1" /> 刷新人流
        </Button>
      </div>

      <Tabs defaultValue="realtime">
        <TabsContent value="realtime">
          <div className="bg-white rounded-lg border border-border-light overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>区域</TableHead>
                  <TableHead>当前人流</TableHead>
                  <TableHead>承载量</TableHead>
                  <TableHead>负载率</TableHead>
                  <TableHead>等级</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((a) => {
                  const level = getAreaLevel(a.id)
                  const pct = Math.round((a.current / a.capacity) * 100)
                  const meta = LEVEL_META[level]
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>{a.current.toLocaleString()}</TableCell>
                      <TableCell className="text-text-secondary">{a.capacity.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${level === "red" ? "bg-red-500" : level === "orange" ? "bg-orange-500" : level === "yellow" ? "bg-amber-400" : "bg-emerald-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[12px]">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${meta.bg} ${meta.color}`}>{meta.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <div className="bg-white rounded-lg border border-border-light overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>区域</TableHead>
                  <TableHead>等级</TableHead>
                  <TableHead>人流/承载</TableHead>
                  <TableHead>触发时间</TableHead>
                  <TableHead>疏导措施</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => {
                  const meta = LEVEL_META[e.level]
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.areaName}</TableCell>
                      <TableCell>
                        <Badge className={`${meta.bg} ${meta.color}`}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-[12px]">
                        {e.current}/{e.capacity}
                      </TableCell>
                      <TableCell className="text-[12px] text-text-secondary">{e.triggeredAt}</TableCell>
                      <TableCell className="text-[12px] text-text-body max-w-xs">{e.action}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === "active" ? "destructive" : "secondary"}>
                          {e.status === "active" ? "处理中" : "已解除"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {e.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              resolveEvent(e.id)
                              toast.success("已解除")
                            }}
                          >
                            <CheckCircle2 size={14} className="mr-1" />
                            解除
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <div className="bg-white rounded-lg border border-border-light overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>区域</TableHead>
                  <TableHead>偏多(%)</TableHead>
                  <TableHead>拥挤(%)</TableHead>
                  <TableHead>预警(%)</TableHead>
                  <TableHead>启用</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.areaName}</TableCell>
                    <TableCell>
                      {editingRule === r.id ? (
                        <Input
                          type="number"
                          defaultValue={r.yellowThreshold}
                          className="h-8 w-20"
                          onChange={(e) => updateRule(r.id, { yellowThreshold: Number(e.target.value) })}
                        />
                      ) : (
                        `${r.yellowThreshold}%`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRule === r.id ? (
                        <Input
                          type="number"
                          defaultValue={r.orangeThreshold}
                          className="h-8 w-20"
                          onChange={(e) => updateRule(r.id, { orangeThreshold: Number(e.target.value) })}
                        />
                      ) : (
                        `${r.orangeThreshold}%`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRule === r.id ? (
                        <Input
                          type="number"
                          defaultValue={r.redThreshold}
                          className="h-8 w-20"
                          onChange={(e) => updateRule(r.id, { redThreshold: Number(e.target.value) })}
                        />
                      ) : (
                        `${r.redThreshold}%`
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch checked={r.enabled} onCheckedChange={(v) => updateRule(r.id, { enabled: v })} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRule(editingRule === r.id ? null : r.id)
                          if (editingRule === r.id) toast.success("已保存")
                        }}
                      >
                        <Settings2 size={14} className="mr-1" />
                        {editingRule === r.id ? "保存" : "编辑"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
