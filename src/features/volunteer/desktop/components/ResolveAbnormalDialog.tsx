import { AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../shared/components/ui/dialog"
import { Button } from "../../../../shared/components/ui/button"
import { Label } from "../../../../shared/components/ui/label"
import { Input } from "../../../../shared/components/ui/input"

interface ResolveAbnormalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: string | null
  checkIn: string
  checkOut: string
  note: string
  onCheckInChange: (v: string) => void
  onCheckOutChange: (v: string) => void
  onNoteChange: (v: string) => void
  onResolve: () => void
}

export function ResolveAbnormalDialog({
  open,
  onOpenChange,
  status,
  checkIn,
  checkOut,
  note,
  onCheckInChange,
  onCheckOutChange,
  onNoteChange,
  onResolve,
}: ResolveAbnormalDialogProps) {
  const autoCalcHours = () => {
    if (!checkIn || !checkOut) return null
    const ci = new Date(checkIn),
      co = new Date(checkOut)
    if (co <= ci) return null
    return Math.round(((co.getTime() - ci.getTime()) / 3600000) * 10) / 10
  }

  const hours = autoCalcHours()

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[15px]">补录服务记录</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {status === "no_show" ? (
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-[12px] text-amber-700 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>该志愿者未签到，请填写实际签到/签退时间，时长自动计算。</span>
            </div>
          ) : (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-[12px] text-blue-700 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>该志愿者已签到但未签退，请根据实际情况填写签退时间，时长自动计算。</span>
            </div>
          )}

          <div>
            <Label className="text-[12px]">签到时间</Label>
            <Input
              type="datetime-local"
              value={checkIn}
              onChange={(e) => onCheckInChange(e.target.value)}
              className="mt-1 rounded-lg"
            />
          </div>

          <div>
            <Label className="text-[12px]">签退时间</Label>
            <Input
              type="datetime-local"
              value={checkOut}
              onChange={(e) => onCheckOutChange(e.target.value)}
              className="mt-1 rounded-lg"
            />
          </div>

          {hours !== null && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-[12px] flex items-center justify-between">
              <span className="text-slate-500">服务时长</span>
              <span className="font-semibold text-emerald-600">{hours}h</span>
            </div>
          )}

          <div>
            <Label className="text-[12px]">
              补录备注 <span className="text-red-400">*</span>
            </Label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={3}
              placeholder="请说明补录原因..."
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 resize-y"
            />
          </div>
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
          <Button
            size="sm"
            className="h-8 text-xs rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8]"
            onClick={onResolve}
          >
            确认补录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}