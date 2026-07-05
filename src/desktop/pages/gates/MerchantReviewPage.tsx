import { useState } from "react"
import { PageLayout } from "../../components/common/PageLayout"
import { Button } from "../../../shared/components/ui/button"
import { Badge } from "../../../shared/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../shared/components/ui/dialog"
import { Textarea } from "../../../shared/components/ui/textarea"
import { Store, Check, X, UserPlus } from "lucide-react"
import { toast } from "sonner"
import {
  useMerchantReviewStore,
  useMerchantRegistrationStore,
  type MerchantChangeRequest,
  type ShopClaimRequest,
} from "../../../features/merchant-review/store"

type Tab = "claim" | "new-shop" | "info-change"

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

/* ====== 认领审核 ====== */
function ClaimReview() {
  const requests = useMerchantRegistrationStore((s) => s.requests)
  const claimRequests = requests.filter((r) => r.type === "claim")
  const approveRegistration = useMerchantRegistrationStore((s) => s.approveRegistration)
  const rejectRegistration = useMerchantRegistrationStore((s) => s.rejectRegistration)
  const pendingCount = claimRequests.filter((r) => r.status === "pending").length

  const [detail, setDetail] = useState<ShopClaimRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ShopClaimRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")

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
      <div className="flex items-center gap-2 mb-4 text-[13px] text-text-secondary">
        <UserPlus size={15} /> 共 {claimRequests.length} 条认领申请
        {pendingCount > 0 && <Badge className="bg-rose-500">待审核 {pendingCount}</Badge>}
      </div>

      <div className="bg-white rounded-lg border border-border-light overflow-hidden">
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
            {claimRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-text-tertiary">
                  暂无认领申请
                </TableCell>
              </TableRow>
            ) : (
              claimRequests.map((r) => (
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
                          onClick={() => {
                            setRejectTarget(r)
                            setRejectReason("")
                          }}
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

      {/* 详情弹窗 */}
      <Dialog
        open={!!detail}
        onOpenChange={(o) => {
          if (!o) setDetail(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.claimedShopName} - 认领申请详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 py-2">
              <p className="text-[12px] text-text-tertiary">
                申请人：{detail.userName} · {detail.userPhone}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-tertiary">认领店铺</span>
                  <span className="text-text-body font-medium">{detail.claimedShopName}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-tertiary">店铺 ID</span>
                  <span className="text-text-body">{detail.claimedShopId}</span>
                </div>
              </div>
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectTarget(detail)
                    setRejectReason("")
                  }}
                >
                  驳回
                </Button>
                <Button onClick={() => handleApprove(detail)}>通过（追加商户身份）</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 驳回弹窗 */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) setRejectTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回认领申请</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="驳回原因"
            rows={3}
          />
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
    </>
  )
}

/* ====== 新建入驻审核 ====== */
function NewShopReview() {
  const requests = useMerchantRegistrationStore((s) => s.requests)
  const newShopRequests = requests.filter((r) => r.type === "new_shop")
  const approveRegistration = useMerchantRegistrationStore((s) => s.approveRegistration)
  const rejectRegistration = useMerchantRegistrationStore((s) => s.rejectRegistration)
  const pendingCount = newShopRequests.filter((r) => r.status === "pending").length

  const [detail, setDetail] = useState<ShopClaimRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ShopClaimRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")

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
      <div className="flex items-center gap-2 mb-4 text-[13px] text-text-secondary">
        <UserPlus size={15} /> 共 {newShopRequests.length} 条入驻申请
        {pendingCount > 0 && <Badge className="bg-rose-500">待审核 {pendingCount}</Badge>}
      </div>

      <div className="bg-white rounded-lg border border-border-light overflow-hidden">
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
            {newShopRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-text-tertiary">
                  暂无入驻申请
                </TableCell>
              </TableRow>
            ) : (
              newShopRequests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.newShopName}</TableCell>
                  <TableCell className="text-[12px] text-text-secondary">{r.userName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px]">
                      {r.newCategory === "food"
                        ? "餐饮"
                        : r.newCategory === "hotel"
                          ? "住宿"
                          : r.newCategory === "bar"
                            ? "酒吧"
                            : "购物"}
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
                          onClick={() => {
                            setRejectTarget(r)
                            setRejectReason("")
                          }}
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

      {/* 详情弹窗 */}
      <Dialog
        open={!!detail}
        onOpenChange={(o) => {
          if (!o) setDetail(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.newShopName} - 入驻申请详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 py-2">
              <p className="text-[12px] text-text-tertiary">
                申请人：{detail.userName} · {detail.userPhone}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-tertiary">店铺名称</span>
                  <span className="text-text-body font-medium">{detail.newShopName}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-tertiary">经营类型</span>
                  <span className="text-text-body">
                    {detail.newCategory === "food"
                      ? "餐饮"
                      : detail.newCategory === "hotel"
                        ? "住宿"
                        : detail.newCategory === "bar"
                          ? "酒吧"
                          : "购物"}
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-tertiary">店铺地址</span>
                  <span className="text-text-body">{detail.newAddress}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-tertiary">店铺电话</span>
                  <span className="text-text-body">{detail.newPhone}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-tertiary">营业时间</span>
                  <span className="text-text-body">{detail.newHours}</span>
                </div>
                <div className="text-[12px]">
                  <span className="text-text-tertiary">店铺简介</span>
                  <p className="text-text-body mt-1">{detail.newDescription}</p>
                </div>
              </div>
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectTarget(detail)
                    setRejectReason("")
                  }}
                >
                  驳回
                </Button>
                <Button onClick={() => handleApprove(detail)}>通过（追加商户身份）</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 驳回弹窗 */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) setRejectTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回入驻申请</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="驳回原因"
            rows={3}
          />
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
    </>
  )
}

/* ====== 信息变更审核（原有） ====== */
function InfoChangeReview() {
  const requests = useMerchantReviewStore((s) => s.requests)
  const pendingCount = useMerchantReviewStore((s) => s.getPending().length)
  const approve = useMerchantReviewStore((s) => s.approve)
  const reject = useMerchantReviewStore((s) => s.reject)

  const [detail, setDetail] = useState<MerchantChangeRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<MerchantChangeRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const handleApprove = (r: MerchantChangeRequest) => {
    approve(r.id, "管理员")
    toast.success(`已通过 ${r.merchantName} 的变更`)
    setDetail(null)
  }
  const handleReject = () => {
    if (rejectTarget) {
      reject(rejectTarget.id, "管理员", rejectReason)
      toast.success("已驳回")
      setRejectTarget(null)
      setRejectReason("")
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4 text-[13px] text-text-secondary">
        <Store size={15} /> 共 {requests.length} 条申请
        {pendingCount > 0 && <Badge className="bg-rose-500">待审核 {pendingCount}</Badge>}
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
            {requests.map((r) => (
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
                        onClick={() => {
                          setRejectTarget(r)
                          setRejectReason("")
                        }}
                        className="text-rose-500"
                      >
                        <X size={14} className="mr-1" />
                        驳回
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 详情弹窗 */}
      <Dialog
        open={!!detail}
        onOpenChange={(o) => {
          if (!o) setDetail(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.merchantName} - 变更详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 py-2">
              <p className="text-[12px] text-text-tertiary">
                提交商户：{detail.supplierName} · {detail.submittedAt}
              </p>
              <div className="space-y-2">
                {detail.fields.map((f: { field: string; label: string; oldValue?: string; newValue: string }) => (
                  <div key={f.field} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[12px] font-medium text-text-heading mb-1.5">{f.label}</p>
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="text-text-tertiary line-through">{f.oldValue || "（空）"}</span>
                      <span className="text-text-tertiary">→</span>
                      <span className="text-primary font-medium">{f.newValue}</span>
                    </div>
                  </div>
                ))}
              </div>
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectTarget(detail)
                    setRejectReason("")
                  }}
                >
                  驳回
                </Button>
                <Button onClick={() => handleApprove(detail)}>通过</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 驳回弹窗 */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) setRejectTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回变更申请</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="驳回原因"
            rows={3}
          />
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
    </>
  )
}
