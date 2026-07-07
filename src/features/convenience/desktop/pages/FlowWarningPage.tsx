import { useState, useEffect } from "react"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { useFlowWarningStore } from "../../../flow-warning/store"
import { LEVEL_META } from "../../../flow-warning/store"
import { AlertTriangle, Users, RefreshCw } from "lucide-react"

export default function FlowWarningPage() {
  const areas = useFlowWarningStore((s) => s.areas)
  const events = useFlowWarningStore((s) => s.events)
  const simulateFlow = useFlowWarningStore((s) => s.simulateFlow)
  const [activeEvents, setActiveEvents] = useState(0)

  useEffect(() => {
    setActiveEvents(events.filter((e) => e.status === "active").length)
  }, [events])

  const stats = {
    total: areas.length,
    green: areas.filter((a) => a.level === "green").length,
    yellow: areas.filter((a) => a.level === "yellow").length,
    orange: areas.filter((a) => a.level === "orange").length,
    red: areas.filter((a) => a.level === "red").length,
  }

  return (
    <PageLayout title="人流量预警" description="古城各区域人流实时监控与预警">
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">监控区域</span>
            </div>
            <div className="text-2xl font-semibold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground">通畅</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-emerald-600">{stats.green}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-amber-500" />
              <span className="text-sm text-muted-foreground">偏多</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-amber-600">{stats.yellow}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-orange-500" />
              <span className="text-sm text-muted-foreground">拥挤</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-orange-600">{stats.orange}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-red-500" />
              <span className="text-sm text-muted-foreground">预警</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-red-600">{stats.red}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          <span className="text-sm text-muted-foreground">
            {activeEvents > 0 ? `${activeEvents} 个活跃预警事件` : "当前无预警事件"}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={simulateFlow} className="gap-1">
          <RefreshCw className="size-3.5" /> 模拟更新
        </Button>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>区域</TableHead>
              <TableHead>当前人流</TableHead>
              <TableHead>最大承载</TableHead>
              <TableHead>饱和度</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.map((a) => {
              const meta = LEVEL_META[a.level]
              const pct = Math.round((a.current / a.capacity) * 100)
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.current.toLocaleString()}</TableCell>
                  <TableCell>{a.capacity.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${pct > 95 ? "bg-red-500" : pct > 80 ? "bg-orange-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={meta.bg + " " + meta.color}>{meta.label}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {events.length > 0 && (
        <Card className="p-4 mt-4">
          <h3 className="text-sm font-medium mb-3">预警事件记录</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>区域</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>触发时间</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.slice(0, 10).map((e) => {
                const meta = LEVEL_META[e.level]
                return (
                  <TableRow key={e.id}>
                    <TableCell>{e.areaName}</TableCell>
                    <TableCell><Badge className={meta.bg + " " + meta.color}>{meta.label}</Badge></TableCell>
                    <TableCell className="text-xs">{e.triggeredAt}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === "active" ? "destructive" : "secondary"}>
                        {e.status === "active" ? "进行中" : "已解决"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </PageLayout>
  )
}