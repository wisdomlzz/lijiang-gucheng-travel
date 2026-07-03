import { useState } from "react"
import { PageLayout } from "../../components/common/PageLayout"
import { Button } from "../../../shared/components/ui/button"
import { Badge } from "../../../shared/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../shared/components/ui/dialog"
import { Textarea } from "../../../shared/components/ui/textarea"
import { Store, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useMerchantReviewStore, type MerchantChangeRequest } from "../../../features/merchant-review/store"

export function MerchantReviewPage() {
  const requests = useMerchantReviewStore((s) => s.requests)
  const pendingCount = useMerchantReviewStore((s) => s.getPending().length)
  const approve = useMerchantReviewStore((s) => s.approve)
  const reject = useMerchantReviewStore((s) => s.reject)

  const [detail, setDetail] = useState<MerchantChangeRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<MerchantChangeRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const handleApprove = (r: MerchantChangeRequest) => { approve(r.id, "管理员"); toast.success(`已通过 ${r.merchantName} 的变更`); setDetail(null) }
  const handleReject = () => {
    if (rejectTarget) { reject(rejectTarget.id, "管理员", rejectReason); toast.success("已驳回"); setRejectTarget(null); setRejectReason("") }
  }

  return (
    <PageLayout title="商家信息审核" description="商户自助提交的店铺信息变更审核（商家入驻闭环）">
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
                    {r.fields.map((f) => <Badge key={f.field} variant="outline" className="text-[11px]">{f.label}</Badge>)}
                  </div>
                </TableCell>
                <TableCell className="text-[12px] text-text-secondary">{r.submittedAt}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                    {r.status === "approved" ? "已通过" : r.status === "rejected" ? "已驳回" : "待审核"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDetail(r)}>详情</Button>
                  {r.status === "pending" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleApprove(r)} className="text-emerald-600"><Check size={14} className="mr-1" />通过</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setRejectTarget(r); setRejectReason("") }} className="text-rose-500"><X size={14} className="mr-1" />驳回</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 详情弹窗 */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{detail?.merchantName} - 变更详情</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 py-2">
              <p className="text-[12px] text-text-tertiary">提交商户：{detail.supplierName} · {detail.submittedAt}</p>
              <div className="space-y-2">
                {detail.fields.map((f) => (
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
                <p className="text-[12px] text-text-tertiary">{detail.status === "approved" ? "已通过" : `已驳回：${detail.rejectReason}`} · {detail.reviewedAt}</p>
              )}
            </div>
          )}
          <DialogFooter>
            {detail?.status === "pending" && (
              <>
                <Button variant="outline" onClick={() => { setRejectTarget(detail); setRejectReason("") }}>驳回</Button>
                <Button onClick={() => handleApprove(detail)}>通过</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 驳回弹窗 */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) setRejectTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>驳回变更申请</DialogTitle></DialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="驳回原因" rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleReject}>确认驳回</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
