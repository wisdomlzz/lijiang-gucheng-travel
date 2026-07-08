import { Card, CardContent } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Wifi, Coffee, Clock, PowerOff, Dot } from "lucide-react"
import type { StaffItem } from "@/features/convenience/store/staff-store"

const STATUS_MAP: Record<string, { label: string; className: string; dotColor: string }> = {
  online: { label: "在线", className: "bg-emerald-100 text-emerald-700", dotColor: "text-emerald-500" },
  busy: { label: "忙碌", className: "bg-amber-100 text-amber-700", dotColor: "text-amber-500" },
  rest: { label: "休息", className: "bg-gray-100 text-gray-700", dotColor: "text-gray-400" },
  offline: { label: "离线", className: "bg-slate-100 text-slate-700", dotColor: "text-slate-400" },
}

interface StaffStatusTabProps {
  staff: StaffItem[]
  stats: {
    online: number
    busy: number
    rest: number
    offline: number
  }
  statusTypeFilter: string
  onStatusTypeFilterChange: (value: string) => void
}

export function StaffStatusTab({
  staff,
  stats,
  statusTypeFilter,
  onStatusTypeFilterChange,
}: StaffStatusTabProps) {
  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Wifi className="size-6 text-emerald-500" />
            <div>
              <div className="text-xs text-muted-foreground">在线</div>
              <div className="text-xl font-bold text-emerald-600">{stats.online}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="size-6 text-amber-500" />
            <div>
              <div className="text-xs text-muted-foreground">忙碌</div>
              <div className="text-xl font-bold text-amber-600">{stats.busy}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Coffee className="size-6 text-gray-400" />
            <div>
              <div className="text-xs text-muted-foreground">休息</div>
              <div className="text-xl font-bold text-gray-600">{stats.rest}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <PowerOff className="size-6 text-slate-400" />
            <div>
              <div className="text-xs text-muted-foreground">离线</div>
              <div className="text-xl font-bold text-slate-600">{stats.offline}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">按服务类型筛选：</span>
        <button
          onClick={() => onStatusTypeFilterChange("all")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            statusTypeFilter === "all"
              ? "bg-primary text-white"
              : "bg-gray-100 text-text-secondary hover:bg-gray-200"
          }`}
        >
          全部
        </button>
        {["行李搬运", "送货服务", "生活垃圾清运", "建筑垃圾清运", "送水服务", "布草配送"].map(
          (t) => (
            <button
              key={t}
              onClick={() => onStatusTypeFilterChange(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusTypeFilter === t
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              {t}
            </button>
          )
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {staff.map((s) => (
          <Card
            key={s.id}
            className={`overflow-hidden border-l-4 ${
              s.status === "online"
                ? "border-l-emerald-400"
                : s.status === "busy"
                  ? "border-l-amber-400"
                  : s.status === "rest"
                    ? "border-l-gray-300"
                    : "border-l-slate-300"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`size-10 rounded-full grid place-items-center text-sm font-medium text-white ${
                    s.status === "online"
                      ? "bg-emerald-400"
                      : s.status === "busy"
                        ? "bg-amber-400"
                        : s.status === "rest"
                          ? "bg-gray-400"
                          : "bg-slate-400"
                  }`}
                >
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.phone}</div>
                </div>
                <Dot
                  className={`size-6 ${STATUS_MAP[s.status]?.dotColor ?? "text-gray-400"} -mr-1`}
                />
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {s.serviceTypes?.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>今日接单 {s.assignedOrders}</span>
                {s.zoneIds && s.zoneIds.length > 0 && (
                  <span>{s.zoneIds.length} 个片区</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {staff.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            暂无匹配的服务人员
          </div>
        )}
      </div>
    </>
  )
}