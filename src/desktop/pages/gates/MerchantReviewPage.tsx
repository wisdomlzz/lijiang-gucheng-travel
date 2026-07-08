import { useState, useMemo } from "react"
import { PageLayout } from "../../components/common/PageLayout"
import { ReviewTableShell } from "../../components/common/ReviewTableShell"
import { Button } from "../../../shared/components/ui/button"
import { Badge } from "../../../shared/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../shared/components/ui/dialog"
import { Textarea } from "../../../shared/components/ui/textarea"
import { Store, Check, X, UserPlus } from "lucide-react"
import { merchantCategoryLabels } from "@/shared/constants/content-config"
import { toast } from "sonner"
import { usePagination } from "@/shared/hooks/usePagination"
import {
  useMerchantReviewStore,
  useMerchantRegistrationStore,
  type MerchantChangeRequest,
  type ShopClaimRequest,
} from "../../../features/merchant-review/store"
import { useContentMerchantStore } from "../../../platform/content/merchant-store"
import { RejectDialog } from "../../../shared/components/ui/RejectDialog"

type Tab = "claim" | "new-shop" | "info-change"

function categoryLabel(val: string): string {
  return merchantCategoryLabels[val as keyof typeof merchantCategoryLabels] ?? val
}

export function MerchantReviewPage() {
  const [activeTab, setActiveTab] = useState<Tab>("claim")

  return (
    <PageLayout title="古城商户审核" description="古城商户认领/入驻/信息变更审核">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 bg-white rounded-lg p-1 border border-border-light w-fit">
        <button
          onClick={() => setActiveTab("claim")}
          className={`px-4 h-8 rounded-md text-[13px] font-medium transition-all ${
            activeTab === "claim" ? "bg-primary text-white shadow-sm" : "text-text-secondary"
          }`}
        >
          认领审核
        </button>
        <button
          onClick={() => setActiveTab("new-shop")}
          className={`px-4 h-8 rounded-md text-[13px] font-medium transition-all ${
            activeTab === "new-shop" ? "bg-primary text-white shadow-sm" : "text-text-secondary"
          }`}
        >
          新建入驻审核
        </button>
        <button
          onClick={() => setActiveTab("info-change")}
          className={`px-4 h-8 rounded-md text-[13px] font-medium transition-all ${
            activeTab === "info-change" ? "bg-primary text-white shadow-sm" : "text-text-secondary"
          }`}
        >
          信息变更审核
        </button>
      </div>

      {activeTab === "claim" ? <ClaimReview /> : activeTab === "new-shop" ? <NewShopReview /> : <InfoChangeReview />}
    </PageLayout>
  )
}

/* =======================================================================
   认领审核 — 用户认领已有店铺
   详情弹窗：申请人信息 + 资质证明图 + 商户信息确认表 + 通过/驳回
   ======================================================================= */
function ClaimReview() {
  const requests = useMerchantRegistrationStore((s) => s.requests)
  const claimRequests = requests.filter((r) => r.type === "claim")
  const approveRegistration = useMerchantRegistrationStore((s) => s.approveRegistration)
  const rejectRegistration = useMerchantRegistrationStore((s) => s.rejectRegistration)
  const allMerchants = useContentMerchantStore((s) => s.merchants)
  const pendingCount = claimRequests.filter((r) => r.status === "pending").length

  const [detail, setDetail] = useState<ShopClaimRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ShopClaimRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredList = useMemo(() => {
    let list = [...claimRequests]
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (r) =>
          (r.claimedShopName || "").toLowerCase().includes(q) ||
          (r.userName || "").toLowerCase().includes(q) ||
          (r.userPhone || "").includes(q)
      )
    }
    return list
  }, [claimRequests, searchQuery])
  const pagination = usePagination(filteredList, 10)

  const handleApprove = (req: ShopClaimRequest) => {
    approveRegistration(req.id, "管理员")
    toast.success(`已通过 ${req.claimedShopName} 的认领申请`)
    setDetail(null)
  }

  const handleReject = () => {
    if (rejectTarget) {
      rejectRegistration(rejectTarget.id, "管理员", rejectReason)
      toast.success("已驳回")
      setRejectTarget(null)
      setRejectReason("")
    }
  }

  return (
    <>
      <ReviewTableShell
        summaryIcon={<UserPlus size={15} />}
        summaryLabel="共 {count} 条认领申请"
        totalCount={claimRequests.length}
        pendingCount={pendingCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜索店铺名称、申请人、电话..."
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setCurrentPage}
        total={pagination.total}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>店铺名称</TableHead>
              <TableHead>申请人</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead>提交时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-text-tertiary">
                  暂无认领申请
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedItems.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.claimedShopName}</TableCell>
                  <TableCell className="text-[12px] text-text-secondary">{r.userName}</TableCell>
                  <TableCell className="text-[12px] text-text-secondary">{r.userPhone}</TableCell>
                  <TableCell className="text-[12px] text-text-secondary">{r.submittedAt}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {r.status === "approved" ? "已通过" : r.status === "rejected" ? "已驳回" : "待审核"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setDetail(r)}>
                      详情
                    </Button>
                    {r.status === "pending" && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleApprove(r)} className="text-emerald-600">
                          <Check size={14} className="mr-1" />
                          通过
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setRejectTarget(r); setRejectReason("") }}
                          className="text-rose-500"
                        >
                          <X size={14} className="mr-1" />
                          驳回
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ReviewTableShell>

      {/* 详情弹窗 */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.claimedShopName} - 认领申请详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 py-2">
              {/* 申请人信息 */}
              <p className="text-[12px] text-text-tertiary">
                申请人：{detail.userName} · {detail.userPhone}
              </p>

              {/* 资质证明图片（3 列网格） */}
              {detail.credentialImages && detail.credentialImages.length > 0 && (
                <div>
                  <p className="text-[13px] font-medium text-text-heading mb-2">资质证明</p>
                  <div className="grid grid-cols-3 gap-2">
                    {detail.credentialImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`资质证明 ${i + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border-light"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 店铺信息确认 / Diff 表 */}
              <div>
                <p className="text-[13px] font-medium text-text-heading mb-2">店铺信息确认</p>
                <div className="border border-border-light rounded-lg overflow-hidden">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-3 py-2 text-text-tertiary font-medium w-[120px]">字段</th>
                        <th className="text-left px-3 py-2 text-text-tertiary font-medium">当前值</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const merchant = detail.claimedShopId ? allMerchants.find((m) => m.id === detail.claimedShopId) : null
                        if (!merchant) {
                          return (
                            <tr>
                              <td colSpan={2} className="px-3 py-4 text-center text-text-tertiary">
                                未找到对应店铺信息
                              </td>
                            </tr>
                          )
                        }
                        const rows: { label: string; value: string }[] = [
                          { label: "店铺名称", value: merchant.name },
                          { label: "经营类型", value: categoryLabel(merchant.category) },
                          { label: "店铺地址", value: merchant.address },
                          { label: "联系电话", value: merchant.phone },
                          {
                            label: "坐标",
                            value:
                              merchant.lat != null && merchant.lng != null
                                ? `${merchant.lat}, ${merchant.lng}`
                                : "未设置",
                          },
                        ]
                        return rows.map((row, i) => (
                          <tr key={i} className="border-t border-border-light">
                            <td className="px-3 py-2 text-text-tertiary">{row.label}</td>
                            <td className="px-3 py-2 text-text-body">{row.value}</td>
                          </tr>
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 审核信息 */}
              {detail.status !== "pending" && (
                <p className="text-[12px] text-text-tertiary">
                  {detail.status === "approved" ? "已通过" : `已驳回：${detail.rejectReason}`} · {detail.reviewedAt}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            {detail?.status === "pending" && (
              <>
                <Button variant="outline" onClick={() => { setRejectTarget(detail); setRejectReason("") }}>
                  驳回
                </Button>
                <Button onClick={() => handleApprove(detail)}>通过（追加商户身份）</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 驳回弹窗 */}
      <RejectDialog
        open={!!rejectTarget}
        onOpenChange={(o) => { if (!o) setRejectTarget(null) }}
        title="驳回认领申请"
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleReject}
      />
    </>
  )
}

/* =======================================================================
   新建入驻审核 — 用户提交新店铺信息
   详情弹窗：申请人信息 + 资质证明图 + 提交的店铺信息 + 通过/驳回
   ======================================================================= */
function NewShopReview() {
  const requests = useMerchantRegistrationStore((s) => s.requests)
  const newShopRequests = requests.filter((r) => r.type === "new_shop")
  const approveRegistration = useMerchantRegistrationStore((s) => s.approveRegistration)
  const rejectRegistration = useMerchantRegistrationStore((s) => s.rejectRegistration)
  const pendingCount = newShopRequests.filter((r) => r.status === "pending").length

  const [detail, setDetail] = useState<ShopClaimRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ShopClaimRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredList = useMemo(() => {
    let list = [...newShopRequests]
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (r) =>
          (r.newShopName || "").toLowerCase().includes(q) ||
          (r.userName || "").toLowerCase().includes(q) ||
          (r.newPhone || "").includes(q)
      )
    }
    return list
  }, [newShopRequests, searchQuery])
  const pagination = usePagination(filteredList, 10)

  const handleApprove = (req: ShopClaimRequest) => {
    approveRegistration(req.id, "管理员")
    toast.success(`已通过 ${req.newShopName} 的入驻申请`)
    setDetail(null)
  }

  const handleReject = () => {
    if (rejectTarget) {
      rejectRegistration(rejectTarget.id, "管理员", rejectReason)
      toast.success("已驳回")
      setRejectTarget(null)
      setRejectReason("")
    }
  }

  return (
    <>
      <ReviewTableShell
        summaryIcon={<UserPlus size={15} />}
        summaryLabel="共 {count} 条入驻申请"
        totalCount={newShopRequests.length}
        pendingCount={pendingCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜索店铺名称、申请人、电话..."
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setCurrentPage}
        total={pagination.total}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>店铺名称</TableHead>
              <TableHead>申请人</TableHead>
              <TableHead>经营类型</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead>提交时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-text-tertiary">
                  暂无入驻申请
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedItems.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.newShopName}</TableCell>
                  <TableCell className="text-[12px] text-text-secondary">{r.userName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px]">
                      {categoryLabel(r.newCategory ?? "")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-text-secondary">{r.newPhone}</TableCell>
                  <TableCell className="text-[12px] text-text-secondary">{r.submittedAt}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {r.status === "approved" ? "已通过" : r.status === "rejected" ? "已驳回" : "待审核"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setDetail(r)}>
                      详情
                    </Button>
                    {r.status === "pending" && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleApprove(r)} className="text-emerald-600">
                          <Check size={14} className="mr-1" />
                          通过
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setRejectTarget(r); setRejectReason("") }}
                          className="text-rose-500"
                        >
                          <X size={14} className="mr-1" />
                          驳回
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ReviewTableShell>

      {/* 详情弹窗 */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.newShopName} - 入驻申请详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 py-2">
              {/* 申请人信息 */}
              <p className="text-[12px] text-text-tertiary">
                申请人：{detail.userName} · {detail.userPhone}
              </p>

              {/* 资质证明图片（3 列网格） */}
              {detail.credentialImages && detail.credentialImages.length > 0 && (
                <div>
                  <p className="text-[13px] font-medium text-text-heading mb-2">资质证明</p>
                  <div className="grid grid-cols-3 gap-2">
                    {detail.credentialImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`资质证明 ${i + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border-light"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 提交的店铺信息 */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-tertiary">店铺名称</span>
                  <span className="text-text-body font-medium">{detail.newShopName}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-tertiary">经营类型</span>
                  <span className="text-text-body">{categoryLabel(detail.newCategory ?? "")}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-tertiary">店铺地址</span>
                  <span className="text-text-body">{detail.newAddress}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-tertiary">店铺电话</span>
                  <span className="text-text-body">{detail.newPhone}</span>
                </div>
                {detail.newLat != null && detail.newLng != null && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-text-tertiary">坐标</span>
                    <span className="text-text-body">
                      {detail.newLat}, {detail.newLng}
                    </span>
                  </div>
                )}
                <div className="text-[12px]">
                  <span className="text-text-tertiary">店铺简介</span>
                  <p className="text-text-body mt-1">{detail.newDescription}</p>
                </div>
              </div>

              {/* 审核信息 */}
              {detail.status !== "pending" && (
                <p className="text-[12px] text-text-tertiary">
                  {detail.status === "approved" ? "已通过" : `已驳回：${detail.rejectReason}`} · {detail.reviewedAt}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            {detail?.status === "pending" && (
              <>
                <Button variant="outline" onClick={() => { setRejectTarget(detail); setRejectReason("") }}>
                  驳回
                </Button>
                <Button onClick={() => handleApprove(detail)}>通过（追加商户身份）</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 驳回弹窗 */}
      <RejectDialog
        open={!!rejectTarget}
        onOpenChange={(o) => { if (!o) setRejectTarget(null) }}
        title="驳回入驻申请"
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleReject}
      />
    </>
  )
}

/* =======================================================================
   信息变更审核 — 已有商户修改店铺信息
   详情弹窗：提交商户信息 + Diff 表（逐字段通过/驳回）
   ======================================================================= */
function InfoChangeReview() {
  const requests = useMerchantReviewStore((s) => s.requests)
  const pendingCount = useMerchantReviewStore((s) => s.getPending().length)
  const approveField = useMerchantReviewStore((s) => s.approveField)
  const rejectField = useMerchantReviewStore((s) => s.rejectField)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [rejectFieldTarget, setRejectFieldTarget] = useState<{ id: string; fieldKey: string } | null>(null)
  const [rejectFieldReason, setRejectFieldReason] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const detail = useMemo(
    () => (detailId ? requests.find((r) => r.id === detailId) ?? null : null),
    [detailId, requests],
  )

  // 表格操作：批量通过/驳回
  const approve = useMerchantReviewStore((s) => s.approve)
  const reject = useMerchantReviewStore((s) => s.reject)
  const [rejectTarget, setRejectTarget] = useState<MerchantChangeRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const filteredList = useMemo(() => {
    let list = [...requests]
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (r) =>
          (r.merchantName || "").toLowerCase().includes(q) ||
          (r.supplierName || "").toLowerCase().includes(q),
      )
    }
    return list
  }, [requests, searchQuery])
  const pagination = usePagination(filteredList, 10)

  const handleApprove = (r: MerchantChangeRequest) => {
    approve(r.id, "管理员")
    toast.success(`已通过 ${r.merchantName} 的变更`)
    setDetailId(null)
  }

  const handleReject = () => {
    if (rejectTarget) {
      reject(rejectTarget.id, "管理员", rejectReason)
      toast.success("已驳回")
      setRejectTarget(null)
      setRejectReason("")
    }
  }

  const handleRejectField = () => {
    if (rejectFieldTarget) {
      rejectField(rejectFieldTarget.id, rejectFieldTarget.fieldKey)
      toast.success("已驳回该字段变更")
      setRejectFieldTarget(null)
      setRejectFieldReason("")
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4 text-[13px] text-text-secondary">
        <Store size={15} /> 共 {requests.length} 条申请
        {pendingCount > 0 && <Badge className="bg-rose-500">待审核 {pendingCount}</Badge>}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="搜索店铺名称、商户..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 max-w-xs"
        />
      </div>

      <div className="bg-white rounded-lg border border-border-light overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>店铺</TableHead>
              <TableHead>提交商户</TableHead>
              <TableHead>变更字段</TableHead>
              <TableHead>提交时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-text-tertiary">
                  暂无变更申请
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedItems.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.merchantName}</TableCell>
                  <TableCell className="text-[12px] text-text-secondary">{r.supplierName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.fields.map((f) => (
                        <Badge key={f.field} variant="outline" className="text-[11px]">
                          {f.label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-text-secondary">{r.submittedAt}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {r.status === "approved" ? "已通过" : r.status === "rejected" ? "已驳回" : "待审核"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setDetailId(r.id)}>
                      详情
                    </Button>
                    {r.status === "pending" && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleApprove(r)} className="text-emerald-600">
                          <Check size={14} className="mr-1" />
                          通过
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setRejectTarget(r); setRejectReason("") }}
                          className="text-rose-500"
                        >
                          <X size={14} className="mr-1" />
                          驳回
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        page={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setCurrentPage}
        pageSize={10}
        onPageSizeChange={() => {}}
        total={pagination.total}
      />

      {/* 详情弹窗 — 逐字段审核 */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetailId(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.merchantName} - 变更详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 py-2">
              {/* 提交商户信息 */}
              <p className="text-[12px] text-text-tertiary">
                提交商户：{detail.supplierName} · {detail.submittedAt}
              </p>

              {/* Diff 表 + 逐字段操作 */}
              <div className="border border-border-light rounded-lg overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 text-text-tertiary font-medium w-[100px]">字段</th>
                      <th className="text-left px-3 py-2 text-text-tertiary font-medium">旧值</th>
                      <th className="text-left px-3 py-2 text-text-tertiary font-medium">新值</th>
                      <th className="text-center px-3 py-2 text-text-tertiary font-medium w-[100px]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.fields.map((f) => (
                      <tr key={f.field} className="border-t border-border-light">
                        <td className="px-3 py-2 font-medium text-text-heading">{f.label}</td>
                        <td className="px-3 py-2 text-text-tertiary line-through">{f.oldValue || "（空）"}</td>
                        <td className="px-3 py-2 text-primary font-medium">{f.newValue}</td>
                        <td className="px-3 py-2 text-center">
                          {f.status === "approved" ? (
                            <Badge variant="default" className="text-[11px]">
                              已通过
                            </Badge>
                          ) : f.status === "rejected" ? (
                            <Badge variant="destructive" className="text-[11px]">
                              已驳回
                            </Badge>
                          ) : detail.status === "pending" ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  approveField(detail.id, f.field, "管理员")
                                  toast.success(`${f.label} 已通过`)
                                }}
                                className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                                title="通过"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setRejectFieldTarget({ id: detail.id, fieldKey: f.field })
                                  setRejectFieldReason("")
                                }}
                                className="p-1 rounded hover:bg-rose-50 text-rose-500 transition-colors"
                                title="驳回"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-text-tertiary text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 请求级审核信息 */}
              {detail.status !== "pending" && (
                <p className="text-[12px] text-text-tertiary">
                  {detail.status === "approved" ? "已通过" : `已驳回：${detail.rejectReason}`} · {detail.reviewedAt}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 逐字段驳回弹窗 */}
      <Dialog open={!!rejectFieldTarget} onOpenChange={(o) => { if (!o) setRejectFieldTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回字段变更</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectFieldReason}
            onChange={(e) => setRejectFieldReason(e.target.value)}
            placeholder="驳回原因（可选）"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFieldTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleRejectField}>
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 整体驳回弹窗（表格行操作） */}
      <RejectDialog
        open={!!rejectTarget}
        onOpenChange={(o) => { if (!o) setRejectTarget(null) }}
        title="驳回变更申请"
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleReject}
      />
    </>
  )
}