import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog"
import { Textarea } from "./textarea"
import { Button } from "./button"

interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  reason: string
  onReasonChange: (reason: string) => void
  onConfirm: () => void
}

export function RejectDialog({ open, onOpenChange, title = "驳回申请", reason, onReasonChange, onConfirm }: RejectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => onReasonChange(e.target.value)} placeholder="驳回原因" rows={3} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button variant="destructive" onClick={onConfirm}>确认驳回</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}