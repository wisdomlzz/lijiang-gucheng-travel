import { Search, Image as ImageIcon } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog"
import { StatusBadge } from "@/shared/components/ui/status-badge"
import type { ConvenienceOrder } from "@/shared/types"
import type { StaffItem } from "@/features/convenience/store/staff-store"

interface OrderDialogsProps {
  manualDialogOpen: boolean
  setManualDialogOpen: (open: boolean) => void
  staffSearch: string
  setStaffSearch: (value: string) => void
  filteredCandidates: StaffItem[]
  confirmManualDispatch: (staffId: string) => void
  rejectDialogId: string | null
  setRejectDialogId: (id: string | null) => void
  rejectReason: string
  setRejectReason: (value: string) => void
  handleRejectCancel: () => void
  detailOrderId: string | null
  setDetailOrderId: (id: string | null) => void
  detailOrder: ConvenienceOrder | null | undefined
  forceCancelTarget: string | null
  setForceCancelTarget: (id: string | null) => void
  forceCancelReason: string
  setForceCancelReason: (value: string) => void
  handleForceCancel: () => void
}

export function OrderDialogs({
  manualDialogOpen,
  setManualDialogOpen,
  staffSearch,
  setStaffSearch,
  filteredCandidates,
  confirmManualDispatch,
  rejectDialogId,
  setRejectDialogId,
  rejectReason,
  setRejectReason,
  handleRejectCancel,
  detailOrderId,
  setDetailOrderId,
  detailOrder,
  forceCancelTarget,
  setForceCancelTarget,
  forceCancelReason,
  setForceCancelReason,
  handleForceCancel,
}: OrderDialogsProps) {
  return (
    <>
      {/* 手动派单弹窗 */}
      <Dialog
        open={manualDialogOpen}
        onOpenChange={(open) => {
          setManualDialogOpen(open)
          if (!open) setStaffSearch("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>手动派单</DialogTitle>
            <DialogDescription>选择服务人员进行手工派单</DialogDescription>
          </DialogHeader>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索姓名或手机号..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredCandidates.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                {staffSearch.trim()
                  ? "无匹配的服务人员"
                  : "无可用服务人员"}
              </div>
            ) : (
              filteredCandidates.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors text-left"
                  onClick={() => confirmManualDispatch(s.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 grid place-items-center text-blue-700 text-xs font-medium">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.phone} · 今日接单 {s.assignedOrders}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      s.status === "online"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-700"
                    }
                  >
                    {s.status === "online" ? "在线" : "忙碌"}
                  </Badge>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialogOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝取消弹窗 */}
      <Dialog
        open={rejectDialogId !== null}
        onOpenChange={(open) => !open && setRejectDialogId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>拒绝取消</DialogTitle>
            <DialogDescription>请输入拒绝取消的原因</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="请输入拒绝原因..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogId(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleRejectCancel}>
              确认拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 订单详情弹窗 */}
      <Dialog
        open={detailOrderId !== null}
        onOpenChange={(open) => !open && setDetailOrderId(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">订单号：</span>
                  <span className="font-mono">{detailOrder.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">服务类型：</span>
                  <span>{detailOrder.serviceType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">地址：</span>
                  <span>{detailOrder.address}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">状态：</span>
                  <StatusBadge status={detailOrder.status} kind="order" />
                </div>
                <div>
                  <span className="text-muted-foreground">服务人员：</span>
                  <span>{detailOrder.staffName || "未指派"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">金额：</span>
                  <span>
                    {detailOrder.priceQuote
                      ? `¥${detailOrder.priceQuote}`
                      : "未报价"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">下单时间：</span>
                  <span>{detailOrder.createdAt}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">支付方式：</span>
                  <span>
                    {detailOrder.payMethod === "online"
                      ? "线上支付"
                      : detailOrder.payMethod === "cash"
                        ? "现金"
                        : "未支付"}
                  </span>
                </div>
              </div>
              {detailOrder.note && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    备注：
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {detailOrder.note}
                  </div>
                </div>
              )}
              {detailOrder.completionPhotos &&
                detailOrder.completionPhotos.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      完工照片：
                    </div>
                    <div className="flex gap-2">
                      {detailOrder.completionPhotos.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`完工照${i + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              {detailOrder.paymentProof && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    付款凭证：
                  </div>
                  <a
                    href={detailOrder.paymentProof}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={detailOrder.paymentProof}
                      alt="付款凭证"
                      className="w-40 h-auto rounded-lg border"
                    />
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 强制取消弹窗 */}
      <Dialog
        open={forceCancelTarget !== null}
        onOpenChange={(open) => !open && setForceCancelTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>强制取消订单</DialogTitle>
            <DialogDescription>此操作不可撤销，请输入取消理由</DialogDescription>
          </DialogHeader>
          <Textarea
            value={forceCancelReason}
            onChange={(e) => setForceCancelReason(e.target.value)}
            placeholder="取消理由（必填）"
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setForceCancelTarget(null)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleForceCancel}>
              确认强制取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}