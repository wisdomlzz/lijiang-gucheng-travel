import { Search } from "lucide-react"
import { Input } from "../../../../shared/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { StatusBadge } from "./StatusBadge"
import { TextAction } from "./TextAction"
import { VOL_STATUS_CONFIG } from "./VolunteerStatusConfig"
import type { Volunteer } from "../../store"

interface VolunteerPagination {
  paginatedItems: Volunteer[]
  currentPage: number
  totalPages: number
  setCurrentPage: (p: number) => void
  total: number
}

interface VolunteerListViewProps {
  volunteers: Volunteer[]
  keyword: string
  onKeywordChange: (v: string) => void
  filters: { political: string; status: string }
  onFilterChange: (key: string, value: string) => void
  pagination: VolunteerPagination
  onSelect: (id: string) => void
  politicalStats: Record<string, number>
}

export function VolunteerListView({
  volunteers,
  keyword,
  onKeywordChange,
  filters,
  onFilterChange,
  pagination,
  onSelect,
  politicalStats,
}: VolunteerListViewProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-300" />
          <Input
            placeholder="搜索姓名/电话..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="pl-9 h-9 text-[13px] rounded-lg border-slate-150"
          />
        </div>
        <select
          value={filters.political}
          onChange={(e) => onFilterChange("political", e.target.value)}
          className="h-9 rounded-lg border border-slate-150 bg-white px-2.5 text-[12px] text-slate-600 focus:outline-none"
        >
          <option value="">全部政治面貌</option>
          {Object.keys(politicalStats).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="h-9 rounded-lg border border-slate-150 bg-white px-2.5 text-[12px] text-slate-600 focus:outline-none"
        >
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已驳回</option>
        </select>
        {(filters.political || filters.status) && (
          <button
            onClick={() => {
              onFilterChange("political", "")
              onFilterChange("status", "")
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600"
          >
            清除
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] text-slate-400 font-medium">姓名</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">电话</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">政治面貌</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">工作单位</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">资质</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">状态</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">注册时间</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium text-right min-w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volunteers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-300 text-[13px]">
                  暂无志愿者数据
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedItems.map((v) => {
                const isPending = v.status === "pending"
                return (
                  <TableRow
                    key={v.id}
                    className={`hover:bg-slate-50/60 transition-colors ${isPending ? "bg-amber-50/40" : ""}`}
                  >
                    <TableCell className="font-medium text-[13px] text-slate-700">{v.name}</TableCell>
                    <TableCell className="text-[12px] text-slate-500 font-mono">{v.phone}</TableCell>
                    <TableCell>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                        {v.politicalStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-[12px] text-slate-500">{v.workUnit}</TableCell>
                    <TableCell>
                      {v.credentialImages?.length ? (
                        <span className="text-[12px] text-slate-500">{v.credentialImages.length}张</span>
                      ) : (
                        <span className="text-[11px] text-slate-300">无</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} config={VOL_STATUS_CONFIG} />
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-400">{v.createdAt}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <TextAction label="详情" color="#2563EB" onClick={() => onSelect(v.id)} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      {volunteers.length > 0 && (
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