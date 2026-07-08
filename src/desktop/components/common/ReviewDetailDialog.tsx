import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"

interface ReviewDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  applicant: { name: string; phone: string }
  credentialImages?: string[]
  children: React.ReactNode // detail-specific content
  status: "pending" | "approved" | "rejected"
  rejectReason?: string
  reviewedAt?: string
  onApprove?: () => void
  onReject?: () => void
  approveLabel?: string
}

export function ReviewDetailDialog(props: ReviewDetailDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-[12px] text-text-tertiary">
            申请人：{props.applicant.name} · {props.applicant.phone}
          </p>
          {props.credentialImages && props.credentialImages.length > 0 && (
            <div>
              <p className="text-[13px] font-medium text-text-heading mb-2">资质证明</p>
              <div className="grid grid-cols-3 gap-2">
                {props.credentialImages.map((img, i) => (
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
          {props.children}
          {props.status !== "pending" && (
            <p className="text-[12px] text-text-tertiary">
              {props.status === "approved" ? "已通过" : `已驳回：${props.rejectReason}`}
              {props.reviewedAt ? ` · ${props.reviewedAt}` : ""}
            </p>
          )}
        </div>
        {props.status === "pending" && (props.onApprove || props.onReject) && (
          <DialogFooter>
            {props.onReject && (
              <Button variant="outline" onClick={props.onReject}>
                驳回
              </Button>
            )}
            {props.onApprove && <Button onClick={props.onApprove}>{props.approveLabel || "通过"}</Button>}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
