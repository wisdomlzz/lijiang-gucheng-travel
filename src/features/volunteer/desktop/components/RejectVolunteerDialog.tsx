import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../shared/components/ui/dialog"
import { Button } from "../../../../shared/components/ui/button"
import { Label } from "../../../../shared/components/ui/label"

interface RejectVolunteerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason: string
  onReasonChange: (v: string) => void
  onReject: () => void
}

export function RejectVolunteerDialog({ open, onOpenChange, reason, onReasonChange, onReject }: RejectVolunteerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[15px]">驳回志愿者</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Label className="text-[12px]">
            驳回原因 <span className="text-red-400">*</span>
          </Label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
            placeholder="请说明驳回原因..."
            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-200 resize-y"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button size="sm" className="h-8 text-xs rounded-lg bg-red-500 hover:bg-red-600" onClick={onReject}>
            驳回
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}