import { useMemo, useState } from "react"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../../shared/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../shared/components/ui/table"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
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
import { useConvenienceStore } from "../../store"
import type { StaffItem } from "../../store/staff-store"
import type { ConvenienceServiceType, ConvenienceOrder } from "../../../../shared/types"
import { usePagination } from "@/shared/hooks/usePagination"
import { Ban } from "lucide-react"
import { toast } from "sonner"
import { StaffListTab } from "./staff/StaffListTab"
import { StaffStatusTab } from "./staff/StaffStatusTab"
import {
  StaffFormDialog,
  type StaffFormState,
} from "./staff/StaffFormDialog"

const DEFAULT_SUPPLIER_ID = "sup_001"

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
  const forceCancelWithReason = useConvenienceStore((s) => s.forceCancelWithReason)

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

  // 禁用 staff 弹窗:进行中订单
  const [activeOrdersDialog, setActiveOrdersDialog] = useState<{
    staffId: string
    orders: ConvenienceOrder[]
  } | null>(null)

  const convenienceStaff = useMemo(
    () => staff.filter((s) => s.serviceTypes && s.serviceTypes.length > 0),
    [staff]
  )

  const filteredList = useMemo(() => {
    let list =
      filter === "all"
        ? convenienceStaff
        : convenienceStaff.filter((s) => s.status === filter)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.phone.includes(q)
      )
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
      list = list.filter(
        (s) =>
          s.serviceTypes?.includes(
            statusTypeFilter as ConvenienceServiceType
          )
      )
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
      toast.error(
        `保存失败：${(err as Error).message ?? "未知错误"}`
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisable = async (staffItem: StaffItem) => {
    if (!staffItem.enabled) {
      toggleEnabled(staffItem.id)
      toast.success(`${staffItem.name} 已启用`)
      return
    }
    try {
      const res = await fetch(
        `http://localhost:3001/api/v1/staff/${staffItem.id}/disable`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      )
      const data = await res.json()
      if (data.data?.needConfirm) {
        setActiveOrdersDialog({
          staffId: staffItem.id,
          orders: data.data.activeOrders,
        })
      } else {
        toggleEnabled(staffItem.id)
        toast.success(`${staffItem.name} 已禁用`)
      }
    } catch {
      toast.error("禁用失败,请重试")
    }
  }

  const handleForceDisable = async () => {
    if (!activeOrdersDialog) return
    try {
      const res = await fetch(
        `http://localhost:3001/api/v1/staff/${activeOrdersDialog.staffId}/disable`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force: true }),
        }
      )
      const data = await res.json()
      if (data.data?.disabled) {
        toggleEnabled(activeOrdersDialog.staffId)
        toast.success("已强制禁用")
      }
    } catch {
      toast.error("强制禁用失败")
    } finally {
      setActiveOrdersDialog(null)
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
    <PageLayout
      title="人员管理"
      description="便民服务人员管理与在线状态监控"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">人员列表</TabsTrigger>
          <TabsTrigger value="status">
            在线状态
            {stats.online > 0 && (
              <Badge className="ml-1.5 bg-emerald-500 text-white text-[10px] px-1.5 py-0">
                {stats.online}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <StaffListTab
            staff={listPagination.paginatedItems}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filter={filter}
            onFilterChange={setFilter}
            stats={stats}
            page={listPagination.currentPage}
            totalPages={listPagination.totalPages}
            onPageChange={listPagination.setCurrentPage}
            total={listPagination.total}
            onEdit={openEditDialog}
            onDelete={(s) => setDeleteTarget(s)}
            onDisable={handleDisable}
            onAdd={openAddDialog}
            empty={filteredList.length === 0}
            emptyMessage={
              searchQuery.trim() ? "无匹配的服务人员" : "暂无数据"
            }
          />
        </TabsContent>

        <TabsContent value="status">
          <StaffStatusTab
            staff={statusViewStaff}
            stats={stats}
            statusTypeFilter={statusTypeFilter}
            onStatusTypeFilterChange={setStatusTypeFilter}
          />
        </TabsContent>
      </Tabs>

      <StaffFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        form={form}
        onFormChange={setForm}
        zones={zones}
        supplierOptions={supplierOptions}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

      {/* ===== 删除确认 AlertDialog ===== */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除服务人员{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>{" "}
              吗？此操作不可撤销。
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

      {/* ===== 禁用 staff — 进行中订单处理 Dialog ===== */}
      <Dialog
        open={activeOrdersDialog !== null}
        onOpenChange={(open) => !open && setActiveOrdersDialog(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              禁用 {activeOrdersDialog?.staffId} — 发现{" "}
              {activeOrdersDialog?.orders.length} 个进行中订单
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-3">
            请先处理这些订单,再禁用 staff
          </div>
          {activeOrdersDialog && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOrdersDialog.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      {o.id}
                    </TableCell>
                    <TableCell>
                      <Badge>{o.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={() => {
                          forceCancelWithReason(o.id, "staff 被禁用")
                          setActiveOrdersDialog({
                            ...activeOrdersDialog,
                            orders: activeOrdersDialog.orders.filter(
                              (x) => x.id !== o.id
                            ),
                          })
                          toast.success(`已强制取消 ${o.id}`)
                        }}
                      >
                        <Ban className="size-3 mr-1" /> 强制取消
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveOrdersDialog(null)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleForceDisable}>
              强制禁用(不处理订单)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}