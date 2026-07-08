import { Search, Plus } from "lucide-react"
import { Input } from "../../../../shared/components/ui/input"
import { Button } from "../../../../shared/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { StatusBadge } from "./StatusBadge"
import { ActivityActions } from "./ActivityActions"
import { ACT_STATUS_CONFIG } from "./VolunteerStatusConfig"

interface ActivityStatsItem {
  id: string
  title: string
  startTime: string
  endTime: string
  dailyStartTime?: string
  dailyEndTime?: string
  location: string
  description?: string
  signUpCount: number
  maxParticipants: number
  status: string
  createdAt: string
  enrollStartTime?: string
  signUpDeadline: string
  [key: string]: any
}

interface PaginationInfo {
  paginatedItems: ActivityStatsItem[]
  currentPage: number
  totalPages: number
  setCurrentPage: (p: number) => void
  total: number
}

interface ActivityListViewProps {
  activities: ActivityStatsItem[]
  keyword: string
  onKeywordChange: (v: string) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  pagination: PaginationInfo
  onSelect: (id: string) => void
  onEdit: (activity: any) => void
  onPublish: (id: string) => void
  onDelete: (id: string) => void
  onEnd: (id: string) => void
  onCreate: () => void
}

export function ActivityListView({
  activities,
  keyword,
  onKeywordChange,
  statusFilter,
  onStatusFilterChange,
  pagination,
  onSelect,
  onEdit,
  onPublish,
  onDelete,
  onEnd,
  onCreate,
}: ActivityListViewProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-300" />
          <Input
            placeholder="搜索活动名称/地点..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="pl-9 h-9 text-[13px] rounded-lg border-slate-150"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-9 rounded-lg border border-slate-150 bg-white px-2.5 text-[12px] text-slate-600 focus:outline-none"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="in_progress">进行中</option>
          <option value="ended">已结束</option>
          <option value="cancelled">已取消</option>
        </select>
        {(keyword || statusFilter) && (
          <button
            onClick={() => {
              onKeywordChange("")
              onStatusFilterChange("")
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600"
          >
            清除
          </button>
        )}
        <Button size="sm" className="h-8 text-xs rounded-lg ml-auto" onClick={onCreate}>
          <Plus className="size-3.5 mr-1.5" />
          创建活动
        </Button>
      </div>
      <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] text-slate-400 font-medium">活动名称</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">时间</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">地点</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">报名</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">状态</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium text-right min-w-[160px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-300 text-[13px]">
                  {keyword || statusFilter ? "没有匹配的活动" : "暂无活动，点击创建"}
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedItems.map((a) => (
                <TableRow key={a.id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell className="font-medium text-[13px] text-slate-700">{a.title}</TableCell>
                  <TableCell className="text-[11px] text-slate-500">
                    {(() => {
                      const sd = new Date(a.startTime),
                        ed = new Date(a.endTime)
                      const sameDay = sd.toDateString() === ed.toDateString()
                      const fmtDate = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
                      const fmtHM = (d: Date) =>
                        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                      if (sameDay) return `${fmtDate(sd)} ${fmtHM(sd)}~${fmtHM(ed)}`
                      return `${fmtDate(sd)}~${fmtDate(ed)} 每天${a.dailyStartTime || fmtHM(sd)}-${a.dailyEndTime || fmtHM(ed)}`
                    })()}
                  </TableCell>
                  <TableCell className="text-[12px] text-slate-500">{a.location}</TableCell>
                  <TableCell>
                    <span className="text-[12px] font-medium text-slate-600">
                      {a.signUpCount}/{a.maxParticipants}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} config={ACT_STATUS_CONFIG} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ActivityActions
                      status={a.status}
                      onDetail={() => onSelect(a.id)}
                      onEdit={() => onEdit(a)}
                      onPublish={() => onPublish(a.id)}
                      onDelete={() => onDelete(a.id)}
                      onEnd={() => onEnd(a.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {activities.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <PaginationBar
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
            pageSize={10}
            onPageSizeChange={() => {}}
            total={pagination.total}
          />
        </div>
      )}
    </div>
  )
}