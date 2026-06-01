import { useMemo, useState } from "react"
import { Card, CardContent } from "../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { Badge } from "../../../shared/components/ui/badge"
import { Button } from "../../../shared/components/ui/button"
import { Input } from "../../../shared/components/ui/input"
import { PageLayout } from "../../components/common/PageLayout"
import { useStaffStore } from "../../../shared/mock"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { Users, Search } from "lucide-react"
import { toast } from "sonner"

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  online: { label: "在线", className: "bg-emerald-100 text-emerald-700" },
  busy: { label: "忙碌", className: "bg-amber-100 text-amber-700" },
  rest: { label: "休息", className: "bg-gray-100 text-gray-700" },
  offline: { label: "离线", className: "bg-slate-100 text-slate-700" },
}

export default function ConvenienceStaffPage() {
  const staff = useStaffStore((s) => s.staff)
  const { toggleEnabled } = useStaffStore.getState()
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const convenienceStaff = useMemo(
    () => staff.filter((s) => s.serviceTypes && s.serviceTypes.length > 0),
    [staff]
  )

  const filtered = useMemo(() => {
    let list = filter === "all" ? convenienceStaff : convenienceStaff.filter((s) => s.status === filter)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.phone.includes(q))
    }
    return list
  }, [convenienceStaff, filter, searchQuery])

  const pagination = usePagination(filtered, 10)

  const stats = useMemo(() => {
    const online = convenienceStaff.filter((s) => s.status === "online").length
    const busy = convenienceStaff.filter((s) => s.status === "busy").length
    return { total: convenienceStaff.length, online, busy, rest: convenienceStaff.filter((s) => s.status === "rest").length }
  }, [convenienceStaff])

  return (
    <PageLayout title="服务人员（便民）" description="便民服务派单人员管理">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2"><Users className="size-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">总人数</span></div>
          <div className="text-2xl font-semibold mt-1">{stats.total}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-sm text-muted-foreground">在线</div>
          <div className="text-2xl font-semibold mt-1 text-emerald-600">{stats.online}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-sm text-muted-foreground">忙碌</div>
          <div className="text-2xl font-semibold mt-1 text-amber-600">{stats.busy}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-sm text-muted-foreground">休息</div>
          <div className="text-2xl font-semibold mt-1 text-gray-600">{stats.rest}</div>
        </CardContent></Card>
      </div>
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索姓名、手机号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {["all", "online", "busy", "rest", "offline"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"}`}
            >{f === "all" ? "全部" : STATUS_MAP[f]?.label ?? f}</button>
          ))}
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
              <TableHead>启用</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedItems.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell><Badge className={STATUS_MAP[s.status]?.className}>{STATUS_MAP[s.status]?.label}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {s.serviceTypes?.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                </TableCell>
                <TableCell>{s.zoneIds?.length ?? 0} 个</TableCell>
                <TableCell>{s.assignedOrders}</TableCell>
                <TableCell>
                  <Button variant={s.enabled ? "default" : "outline"} size="sm" onClick={() => { toggleEnabled(s.id); toast.success(`${s.name} ${s.enabled ? "已禁用" : "已启用"}`) }}>
                    {s.enabled ? "启用" : "禁用"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {searchQuery.trim() ? "无匹配的服务人员" : "暂无数据"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
      </Card>
    </PageLayout>
  )
}
