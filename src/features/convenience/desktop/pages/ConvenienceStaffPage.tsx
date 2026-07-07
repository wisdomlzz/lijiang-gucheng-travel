import { useMemo, useState } from "react"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../../shared/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import { Label } from "../../../../shared/components/ui/label"
import { Checkbox } from "../../../../shared/components/ui/checkbox"
import { Switch } from "../../../../shared/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../../shared/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../shared/components/ui/alert-dialog"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { useStaffStore, useZoneStore } from "../../store"
import type { StaffItem } from "../../store/staff-store"
import type { ConvenienceServiceType } from "../../../../shared/types"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { Users, Search, Wifi, Coffee, Clock, PowerOff, Dot, Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

const STATUS_MAP: Record<string, { label: string; className: string; dotColor: string }> = {
  online: { label: "在线", className: "bg-emerald-100 text-emerald-700", dotColor: "text-emerald-500" },
  busy: { label: "忙碌", className: "bg-amber-100 text-amber-700", dotColor: "text-amber-500" },
  rest: { label: "休息", className: "bg-gray-100 text-gray-700", dotColor: "text-gray-400" },
  offline: { label: "离线", className: "bg-slate-100 text-slate-700", dotColor: "text-slate-400" },
}

const SERVICE_TYPE_OPTIONS: ConvenienceServiceType[] = [
  "送货服务",
  "行李搬运",
  "生活垃圾清运",
  "建筑垃圾清运",
  "送水服务",
  "布草配送",
]

const STATUS_OPTIONS: StaffItem["status"][] = ["online", "busy", "rest", "offline"]

const DEFAULT_SUPPLIER_ID = "sup_001"

type StaffFormState = {
  name: string
  phone: string
  supplierId: string
  status: StaffItem["status"]
  serviceTypes: ConvenienceServiceType[]
  zoneIds: string[]
  enabled: boolean
  joinedAt: string
}

const emptyForm = (): StaffFormState => ({
  name: "",
  phone: "",
  supplierId: DEFAULT_SUPPLIER_ID,
  status: "offline",
  serviceTypes: [],
  zoneIds: [],
  enabled: true,
  joinedAt: new Date().toISOString().slice(0, 10),
})

export default function ConvenienceStaffPage() {
  const staff = useStaffStore((s) => s.staff)
  const zones = useZoneStore((s) => s.zones)
  const { toggleEnabled, addStaff, updateStaff, removeStaff } = useStaffStore.getState()
  const [activeTab, setActiveTab] = useState("list")
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusTypeFilter, setStatusTypeFilter] = useState<string>("all")

  // Dialog / CRUD state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<StaffFormState>(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StaffItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const convenienceStaff = useMemo(() => staff.filter((s) => s.serviceTypes && s.serviceTypes.length > 0), [staff])

  const filteredList = useMemo(() => {
    let list = filter === "all" ? convenienceStaff : convenienceStaff.filter((s) => s.status === filter)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.phone.includes(q))
    }
    return list
  }, [convenienceStaff, filter, searchQuery])

  const listPagination = usePagination(filteredList, 10)

  const stats = useMemo(() => {
    const online = convenienceStaff.filter((s) => s.status === "online").length
    const busy = convenienceStaff.filter((s) => s.status === "busy").length
    return {
      total: convenienceStaff.length,
      online,
      busy,
      rest: convenienceStaff.filter((s) => s.status === "rest").length,
      offline: convenienceStaff.filter((s) => s.status === "offline").length,
    }
  }, [convenienceStaff])

  const statusViewStaff = useMemo(() => {
    let list = [...convenienceStaff].sort((a, b) => {
      const order = { online: 0, busy: 1, rest: 2, offline: 3 }
      return (order[a.status] ?? 4) - (order[b.status] ?? 4)
    })
    if (statusTypeFilter !== "all") {
      list = list.filter((s) => s.serviceTypes?.includes(statusTypeFilter as ConvenienceServiceType))
    }
    return list
  }, [convenienceStaff, statusTypeFilter])

  // Unique supplier IDs seen in staff, so the dropdown reflects real data.
  const supplierOptions = useMemo(() => {
    const set = new Set<string>()
    set.add(DEFAULT_SUPPLIER_ID)
    staff.forEach((s) => s.supplierId && set.add(s.supplierId))
    return Array.from(set)
  }, [staff])

  const openAddDialog = () => {
    setDialogMode("add")
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEditDialog = (s: StaffItem) => {
    setDialogMode("edit")
    setEditingId(s.id)
    setForm({
      name: s.name,
      phone: s.phone,
      supplierId: s.supplierId || DEFAULT_SUPPLIER_ID,
      status: s.status,
      serviceTypes: (s.serviceTypes ?? []) as ConvenienceServiceType[],
      zoneIds: s.zoneIds ?? [],
      enabled: s.enabled,
      joinedAt: s.joinedAt || new Date().toISOString().slice(0, 10),
    })
    setDialogOpen(true)
  }

  const toggleFormServiceType = (type: ConvenienceServiceType) => {
    setForm((f) => ({
      ...f,
      serviceTypes: f.serviceTypes.includes(type)
        ? f.serviceTypes.filter((t) => t !== type)
        : [...f.serviceTypes, type],
    }))
  }

  const toggleFormZone = (zoneId: string) => {
    setForm((f) => ({
      ...f,
      zoneIds: f.zoneIds.includes(zoneId) ? f.zoneIds.filter((z) => z !== zoneId) : [...f.zoneIds, zoneId],
    }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("请填写姓名")
      return
    }
    if (!form.phone.trim()) {
      toast.error("请填写手机号")
      return
    }
    setSubmitting(true)
    try {
      if (dialogMode === "add") {
        await addStaff({
          supplierId: form.supplierId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          status: form.status,
          serviceTypes: form.serviceTypes,
          zoneIds: form.zoneIds,
          enabled: form.enabled,
          joinedAt: form.joinedAt,
        })
        toast.success(`已新增服务人员 ${form.name}`)
      } else if (editingId) {
        await updateStaff(editingId, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          supplierId: form.supplierId,
          status: form.status,
          serviceTypes: form.serviceTypes,
          zoneIds: form.zoneIds,
          enabled: form.enabled,
          joinedAt: form.joinedAt,
        })
        toast.success(`已更新 ${form.name}`)
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error(`保存失败：${(err as Error).message ?? "未知错误"}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await removeStaff(deleteTarget.id)
      toast.success(`已删除 ${deleteTarget.name}`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(`删除失败：${(err as Error).message ?? "未知错误"}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageLayout title="人员管理" description="便民服务人员管理与在线状态监控">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">人员列表</TabsTrigger>
          <TabsTrigger value="status">
            在线状态
            {stats.online > 0 && (
              <Badge className="ml-1.5 bg-emerald-500 text-white text-[10px] px-1.5 py-0">{stats.online}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== Tab 1: 人员列表 ===== */}
        <TabsContent value="list">
          {/* 统计卡片 */}
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

          {/* 筛选栏 + 新增按钮 */}
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
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filter === f ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                  }`}
                >
                  {f === "all" ? "全部" : (STATUS_MAP[f]?.label ?? f)}
                </button>
              ))}
              <div className="ml-auto">
                <Button size="sm" onClick={openAddDialog} className="gap-1">
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
                {listPagination.paginatedItems.map((s) => {
                  const zoneCount = s.zoneIds?.length ?? 0
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Dot className={`size-5 ${STATUS_MAP[s.status]?.dotColor ?? "text-gray-400"} -ml-1`} />
                        {s.name}
                      </TableCell>
                      <TableCell>{s.phone}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_MAP[s.status]?.className}>{STATUS_MAP[s.status]?.label}</Badge>
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
                          onClick={() => {
                            toggleEnabled(s.id)
                            toast.success(`${s.name} ${s.enabled ? "已禁用" : "已启用"}`)
                          }}
                        >
                          {s.enabled ? "启用" : "禁用"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => openEditDialog(s)}
                          >
                            <Pencil className="size-4" />
                            <span className="ml-1">编辑</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteTarget(s)}
                          >
                            <Trash2 className="size-4" />
                            <span className="ml-1">删除</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {searchQuery.trim() ? "无匹配的服务人员" : "暂无数据"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-3 border-t pt-3">
              <PaginationBar
                page={listPagination.currentPage}
                totalPages={listPagination.totalPages}
                onPageChange={listPagination.setCurrentPage}
                pageSize={10}
                onPageSizeChange={() => {}}
                total={listPagination.total}
              />
            </div>
          </Card>
        </TabsContent>

        {/* ===== Tab 2: 在线状态 ===== */}
        <TabsContent value="status">
          {/* 实时状态栏 */}
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

          {/* 服务类型筛选 */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">按服务类型筛选：</span>
            <button
              onClick={() => setStatusTypeFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusTypeFilter === "all" ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              全部
            </button>
            {["行李搬运", "送货服务", "生活垃圾清运", "建筑垃圾清运", "送水服务", "布草配送"].map((t) => (
              <button
                key={t}
                onClick={() => setStatusTypeFilter(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusTypeFilter === t ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* 人员状态卡片网格 */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {statusViewStaff.map((s) => (
              <Card key={s.id} className={`overflow-hidden border-l-4 ${
                s.status === "online" ? "border-l-emerald-400" :
                s.status === "busy" ? "border-l-amber-400" :
                s.status === "rest" ? "border-l-gray-300" : "border-l-slate-300"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`size-10 rounded-full grid place-items-center text-sm font-medium text-white ${
                      s.status === "online" ? "bg-emerald-400" :
                      s.status === "busy" ? "bg-amber-400" :
                      s.status === "rest" ? "bg-gray-400" : "bg-slate-400"
                    }`}>
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.phone}</div>
                    </div>
                    <Dot className={`size-6 ${STATUS_MAP[s.status]?.dotColor ?? "text-gray-400"} -mr-1`} />
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
            {statusViewStaff.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-8">
                暂无匹配的服务人员
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== 新增/编辑 Dialog ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "新增服务人员" : "编辑服务人员"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="staff-name">
                  姓名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="staff-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="staff-phone">
                  手机号 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="staff-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="139-****-6666"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="staff-supplier">供应商</Label>
                <select
                  id="staff-supplier"
                  value={form.supplierId}
                  onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
                  className="h-9 rounded-md border border-input bg-input-background px-3 text-sm"
                >
                  {supplierOptions.map((sid) => (
                    <option key={sid} value={sid}>
                      {sid}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="staff-status">状态</Label>
                <select
                  id="staff-status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StaffItem["status"] }))}
                  className="h-9 rounded-md border border-input bg-input-background px-3 text-sm"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {STATUS_MAP[st]?.label ?? st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>服务类型</Label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_TYPE_OPTIONS.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.serviceTypes.includes(t)}
                      onCheckedChange={() => toggleFormServiceType(t)}
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>片区</Label>
              {zones.length === 0 ? (
                <div className="text-xs text-muted-foreground">暂无可分配的片区</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {zones.map((z) => (
                    <label key={z.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.zoneIds.includes(z.id)}
                        onCheckedChange={() => toggleFormZone(z.id)}
                      />
                      <span>{z.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="staff-joined">加入时间</Label>
                <Input
                  id="staff-joined"
                  type="date"
                  value={form.joinedAt}
                  onChange={(e) => setForm((f) => ({ ...f, joinedAt: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>启用状态</Label>
                <div className="flex items-center h-9 gap-2">
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
                  />
                  <span className="text-sm text-muted-foreground">{form.enabled ? "已启用" : "已禁用"}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "保存中..." : dialogMode === "add" ? "新增" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 删除确认 AlertDialog ===== */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除服务人员 <span className="font-semibold">{deleteTarget?.name}</span> 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}
