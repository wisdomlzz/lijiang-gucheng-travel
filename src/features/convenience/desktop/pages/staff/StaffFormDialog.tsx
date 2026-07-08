import { Label } from "@/shared/components/ui/label"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Switch } from "@/shared/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import type { StaffItem } from "@/features/convenience/store/staff-store"
import type { ConvenienceServiceType } from "@/shared/types"
import type { Zone } from "@/features/convenience/store/zone-store"

const STATUS_MAP: Record<string, { label: string; className: string; dotColor: string }> = {
  online: { label: "在线", className: "bg-emerald-100 text-emerald-700", dotColor: "text-emerald-500" },
  busy: { label: "忙碌", className: "bg-amber-100 text-amber-700", dotColor: "text-amber-500" },
  rest: { label: "休息", className: "bg-gray-100 text-gray-700", dotColor: "text-gray-400" },
  offline: { label: "离线", className: "bg-slate-100 text-slate-700", dotColor: "text-slate-400" },
}

const SERVICE_TYPE_OPTIONS: ConvenienceServiceType[] = [
  "送货服务",
  "行李搬运",
  "生活垃圾清运",
  "建筑垃圾清运",
  "送水服务",
  "布草配送",
]

const STATUS_OPTIONS: StaffItem["status"][] = ["online", "busy", "rest", "offline"]

export interface StaffFormState {
  name: string
  phone: string
  supplierId: string
  status: StaffItem["status"]
  serviceTypes: ConvenienceServiceType[]
  zoneIds: string[]
  enabled: boolean
  joinedAt: string
}

interface StaffFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  form: StaffFormState
  onFormChange: React.Dispatch<React.SetStateAction<StaffFormState>>
  zones: Zone[]
  supplierOptions: string[]
  submitting: boolean
  onSubmit: () => void
}

export function StaffFormDialog({
  open,
  onOpenChange,
  mode,
  form,
  onFormChange,
  zones,
  supplierOptions,
  submitting,
  onSubmit,
}: StaffFormDialogProps) {
  const toggleServiceType = (type: ConvenienceServiceType) => {
    onFormChange((f) => ({
      ...f,
      serviceTypes: f.serviceTypes.includes(type)
        ? f.serviceTypes.filter((t) => t !== type)
        : [...f.serviceTypes, type],
    }))
  }

  const toggleZone = (zoneId: string) => {
    onFormChange((f) => ({
      ...f,
      zoneIds: f.zoneIds.includes(zoneId)
        ? f.zoneIds.filter((z) => z !== zoneId)
        : [...f.zoneIds, zoneId],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "新增服务人员" : "编辑服务人员"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="staff-name">
                姓名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="staff-name"
                value={form.name}
                onChange={(e) => onFormChange((f) => ({ ...f, name: e.target.value }))}
                placeholder="请输入姓名"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="staff-phone">
                手机号 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="staff-phone"
                value={form.phone}
                onChange={(e) => onFormChange((f) => ({ ...f, phone: e.target.value }))}
                placeholder="139-****-6666"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="staff-supplier">供应商</Label>
              <select
                id="staff-supplier"
                value={form.supplierId}
                onChange={(e) => onFormChange((f) => ({ ...f, supplierId: e.target.value }))}
                className="h-9 rounded-md border border-input bg-input-background px-3 text-sm"
              >
                {supplierOptions.map((sid) => (
                  <option key={sid} value={sid}>
                    {sid}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="staff-status">状态</Label>
              <select
                id="staff-status"
                value={form.status}
                onChange={(e) =>
                  onFormChange((f) => ({
                    ...f,
                    status: e.target.value as StaffItem["status"],
                  }))
                }
                className="h-9 rounded-md border border-input bg-input-background px-3 text-sm"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_MAP[st]?.label ?? st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>服务类型</Label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_TYPE_OPTIONS.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.serviceTypes.includes(t)}
                    onCheckedChange={() => toggleServiceType(t)}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>片区</Label>
            {zones.length === 0 ? (
              <div className="text-xs text-muted-foreground">暂无可分配的片区</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {zones.map((z) => (
                  <label key={z.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.zoneIds.includes(z.id)}
                      onCheckedChange={() => toggleZone(z.id)}
                    />
                    <span>{z.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="staff-joined">加入时间</Label>
              <Input
                id="staff-joined"
                type="date"
                value={form.joinedAt}
                onChange={(e) => onFormChange((f) => ({ ...f, joinedAt: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>启用状态</Label>
              <div className="flex items-center h-9 gap-2">
                <Switch
                  checked={form.enabled}
                  onCheckedChange={(v) => onFormChange((f) => ({ ...f, enabled: v }))}
                />
                <span className="text-sm text-muted-foreground">
                  {form.enabled ? "已启用" : "已禁用"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting
              ? "保存中..."
              : mode === "add"
                ? "新增"
                : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}