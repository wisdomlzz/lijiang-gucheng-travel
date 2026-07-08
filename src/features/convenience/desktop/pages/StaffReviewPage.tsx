import { useState, useEffect, useMemo } from "react"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { Button } from "../../../../shared/components/ui/button"
import { Badge } from "../../../../shared/components/ui/badge"
import { Input } from "../../../../shared/components/ui/input"
import { Textarea } from "../../../../shared/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../../shared/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../shared/components/ui/table"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Skeleton } from "../../../../shared/components/ui/skeleton"
import { api } from "@/api/client"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { Users, Check, X, Search, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface StaffItem {
  id: string
  name: string
  phone: string
  idCard?: string
  idCardFront?: string
  idCardBack?: string
  serviceTypes?: string[]
  applyStatus?: string
  rejectReason?: string
  createdAt?: string
}

const APPLY_STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "待审核", className: "bg-amber-100 text-amber-700" },
  approved: { label: "已通过", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "已驳回", className: "bg-red-100 text-red-700" },
}

export default function StaffReviewPage() {
  const [allStaff, setAllStaff] = useState<StaffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [rejectTarget, setRejectTarget] = useState<StaffItem | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const result = await api.list<StaffItem>("staff")
      setAllStaff(result.items)
    } catch (err) {
      toast.error(`加载失败：${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const pendingStaff = useMemo(() => {
    let list = allStaff.filter((s) => s.applyStatus !== "approved")
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.phone.includes(q))
    }
    return list.sort((a, b) => {
      const aTime = a.createdAt || ""
      const bTime = b.createdAt || ""
      return bTime.localeCompare(aTime)
    })
  }, [allStaff, searchQuery])

  const pagination = usePagination(pendingStaff, 10)

  const handleApprove = async (staff: StaffItem) => {
    try {
      await api.update("staff", staff.id, { applyStatus: "approved" })
      toast.success(`已通过 ${staff.name} 的入驻申请`)
      fetchStaff()
    } catch (err) {
      toast.error(`操作失败：${(err as Error).message}`)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    try {
      await api.update("staff", rejectTarget.id, {
        applyStatus: "rejected",
        rejectReason: rejectReason.trim() || undefined,
      })
      toast.success(`已驳回 ${rejectTarget.name} 的入驻申请`)
      setRejectTarget(null)
      setRejectReason("")
      fetchStaff()
    } catch (err) {
      toast.error(`操作失败：${(err as Error).message}`)
    }
  }

  return (
    <PageLayout title="入驻审核" description="审核便民服务人员的入驻申请">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">待审核</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-amber-600">
              {allStaff.filter((s) => s.applyStatus === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Check className="size-5 text-emerald-500" />
              <span className="text-sm text-muted-foreground">已通过</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-emerald-600">
              {allStaff.filter((s) => s.applyStatus === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <X className="size-5 text-red-500" />
              <span className="text-sm text-muted-foreground">已驳回</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-red-600">
              {allStaff.filter((s) => s.applyStatus === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索姓名、手机号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="text-sm text-muted-foreground ml-auto">
            共 {pendingStaff.length} 条待审核
          </div>
        </div>
      </Card>

      {/* 列表 */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>身份证号</TableHead>
              <TableHead>证件照片</TableHead>
              <TableHead>服务类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>提交时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pagination.paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery.trim() ? "无匹配的申请" : "暂无待审核的入驻申请"}
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedItems.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>{staff.phone}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {staff.idCard || "—"}
                  </TableCell>
                  <TableCell>
                    {staff.idCardFront || staff.idCardBack ? (
                      <div className="flex gap-2">
                        {staff.idCardFront && (
                          <a
                            href={staff.idCardFront}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            正面 <ExternalLink className="size-3" />
                          </a>
                        )}
                        {staff.idCardBack && (
                          <a
                            href={staff.idCardBack}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            反面 <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">未上传</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(staff.serviceTypes || []).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={APPLY_STATUS_MAP[staff.applyStatus || "pending"]?.className}>
                      {APPLY_STATUS_MAP[staff.applyStatus || "pending"]?.label || staff.applyStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {staff.createdAt || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {staff.applyStatus !== "approved" && (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" onClick={() => handleApprove(staff)}>
                          通过
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectTarget(staff)
                            setRejectReason("")
                          }}
                        >
                          驳回
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {pendingStaff.length > 0 && (
          <div className="p-3 border-t">
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
      </Card>

      {/* 驳回弹窗 */}
      <Dialog open={rejectTarget !== null} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>驳回入驻申请</DialogTitle>
            <DialogDescription>
              {rejectTarget && `确认驳回 ${rejectTarget.name} 的入驻申请？`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="驳回原因（选填）"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}