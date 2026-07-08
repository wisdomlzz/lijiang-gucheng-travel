import { Card, CardContent } from "@/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { Users, Search, Dot, Plus, Pencil, Trash2 } from "lucide-react"
import type { StaffItem } from "@/features/convenience/store/staff-store"

const STATUS_MAP: Record<string, { label: string; className: string; dotColor: string }> = {
  online: { label: "在线", className: "bg-emerald-100 text-emerald-700", dotColor: "text-emerald-500" },
  busy: { label: "忙碌", className: "bg-amber-100 text-amber-700", dotColor: "text-amber-500" },
  rest: { label: "休息", className: "bg-gray-100 text-gray-700", dotColor: "text-gray-400" },
  offline: { label: "离线", className: "bg-slate-100 text-slate-700", dotColor: "text-slate-400" },
}

interface StaffListTabProps {
  staff: StaffItem[]
  searchQuery: string
  onSearchChange: (value: string) => void
  filter: string
  onFilterChange: (value: string) => void
  stats: {
    total: number
    online: number
    busy: number
    rest: number
    offline: number
  }
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  total: number
  onEdit: (staff: StaffItem) => void
  onDelete: (staff: StaffItem) => void
  onDisable: (staff: StaffItem) => void
  onAdd: () => void
  empty: boolean
  emptyMessage: string
}

export function StaffListTab({
  staff,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  stats,
  page,
  totalPages,
  onPageChange,
  total,
  onEdit,
  onDelete,
  onDisable,
  onAdd,
  empty,
  emptyMessage,
}: StaffListTabProps) {
  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">总人数</span>
            </div>
            <div className="text-2xl font-semibold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Dot className="size-6 text-emerald-500 -ml-1.5" />
              <span className="text-sm text-muted-foreground">在线</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-emerald-600">{stats.online}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Dot className="size-6 text-amber-500 -ml-1.5" />
              <span className="text-sm text-muted-foreground">忙碌</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-amber-600">{stats.busy}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Dot className="size-6 text-gray-400 -ml-1.5" />
              <span className="text-sm text-muted-foreground">休息/离线</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-gray-600">{stats.rest + stats.offline}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索姓名、手机号..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {["all", "online", "busy", "rest", "offline"].map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "全部" : STATUS_MAP[f]?.label ?? f}
            </button>
          ))}
          <div className="ml-auto">
            <Button size="sm" onClick={onAdd} className="gap-1">
              <Plus className="size-4" />
              新增服务人员
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>服务类型</TableHead>
              <TableHead>片区</TableHead>
              <TableHead>任务数</TableHead>
              <TableHead>资质证件</TableHead>
              <TableHead>启用</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => {
              const zoneCount = s.zoneIds?.length ?? 0
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Dot
                      className={`size-5 ${STATUS_MAP[s.status]?.dotColor ?? "text-gray-400"} -ml-1`}
                    />
                    {s.name}
                  </TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_MAP[s.status]?.className}>
                      {STATUS_MAP[s.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {s.serviceTypes?.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {zoneCount > 0 ? `${zoneCount} 个片区` : "未分配"}
                  </TableCell>
                  <TableCell>{s.assignedOrders}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      未上传
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={s.enabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => onDisable(s)}
                    >
                      {s.enabled ? "禁用" : "启用"}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => onEdit(s)}
                      >
                        <Pencil className="size-4" />
                        <span className="ml-1">编辑</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDelete(s)}
                      >
                        <Trash2 className="size-4" />
                        <span className="ml-1">删除</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {empty && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-8"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="mt-3 border-t pt-3">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            pageSize={10}
            onPageSizeChange={() => {}}
            total={total}
          />
        </div>
      </Card>
    </>
  )
}