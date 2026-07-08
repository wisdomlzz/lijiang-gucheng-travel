import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../shared/components/ui/dialog"
import { Button } from "../../../../shared/components/ui/button"
import { Label } from "../../../../shared/components/ui/label"
import { Input } from "../../../../shared/components/ui/input"
import { LocationMapField } from "./LocationMapField"

interface EditActivityForm {
  title: string
  description: string
  location: string
  dateStart: string
  dateEnd: string
  timeStart: string
  timeEnd: string
  enrollStart: string
  deadline: string
  max: string
}

interface EditActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: EditActivityForm
  onFormChange: (key: keyof EditActivityForm, value: string) => void
  onSave: () => void
}

export function EditActivityDialog({ open, onOpenChange, form, onFormChange, onSave }: EditActivityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[15px]">编辑活动</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-[12px]">
              活动名称 <span className="text-red-400">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => onFormChange("title", e.target.value)}
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label className="text-[12px]">
              活动描述 <span className="text-red-400">*</span>
            </Label>
            <textarea
              value={form.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              rows={3}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#059669]/20 resize-y"
            />
          </div>
          <div>
            <Label className="text-[12px]">
              活动地点 <span className="text-red-400">*</span>
            </Label>
            <LocationMapField value={form.location} onChange={(v) => onFormChange("location", v)} />
          </div>
          <div>
            <Label className="text-[12px]">
              活动日期 <span className="text-red-400">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                type="date"
                value={form.dateStart}
                onChange={(e) => onFormChange("dateStart", e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
              />
              <input
                type="date"
                value={form.dateEnd}
                onChange={(e) => onFormChange("dateEnd", e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <Label className="text-[12px]">
              每日时段 <span className="text-red-400">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                type="time"
                value={form.timeStart}
                onChange={(e) => onFormChange("timeStart", e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
              />
              <input
                type="time"
                value={form.timeEnd}
                onChange={(e) => onFormChange("timeEnd", e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <Label className="text-[12px]">
              报名日期 <span className="text-red-400">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                type="date"
                value={form.enrollStart}
                onChange={(e) => onFormChange("enrollStart", e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
              />
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => onFormChange("deadline", e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <Label className="text-[12px]">
              人数上限 <span className="text-red-400">*</span>
            </Label>
            <Input
              type="number"
              value={form.max}
              onChange={(e) => onFormChange("max", e.target.value)}
              min={1}
              className="mt-1 rounded-lg w-32"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button size="sm" className="h-8 text-xs rounded-lg" onClick={onSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}