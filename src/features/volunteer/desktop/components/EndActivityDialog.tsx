import { AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../shared/components/ui/dialog"
import { Button } from "../../../../shared/components/ui/button"
import type { VolunteerActivity, VolunteerSignUp, VolunteerDailyRecord } from "../../store"

interface EndActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: VolunteerActivity | null
  signUps: VolunteerSignUp[]
  dailyRecords: VolunteerDailyRecord[]
  onEnd: () => void
}

export function EndActivityDialog({ open, onOpenChange, activity, signUps, dailyRecords, onEnd }: EndActivityDialogProps) {
  if (!activity) return null

  const suCount = signUps.filter((s) => s.activityId === activity.id).length

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[15px] flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            {activity.status === "in_progress" ? "结束活动" : "取消活动"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-2">
          {activity.status === "in_progress" ? (
            <>
              <EndActivityContent activity={activity} dailyRecords={dailyRecords} suCount={suCount} />
            </>
          ) : (
            <>
              <p className="text-[13px] text-slate-600 leading-relaxed">取消后活动状态变为已取消，无法继续报名。</p>
              {suCount > 0 && (
                <p className="text-[12px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  {suCount} 人已报名，取消后报名记录保留。
                </p>
              )}
            </>
          )}
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
            className="h-8 text-xs rounded-lg bg-red-500 hover:bg-red-600"
            onClick={onEnd}
          >
            确认结束
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EndActivityContent({
  activity,
  dailyRecords,
  suCount,
}: {
  activity: VolunteerActivity
  dailyRecords: VolunteerDailyRecord[]
  suCount: number
}) {
  const pending = dailyRecords.filter((d) => d.activityId === activity.id && d.status === "pending")
  const checkedIn = dailyRecords.filter((d) => d.activityId === activity.id && d.status === "checked_in")

  return (
    <>
      <p className="text-[13px] text-slate-600 leading-relaxed">结束活动后：</p>
      <ul className="space-y-1.5 text-[12px]">
        <li className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
          <AlertTriangle size={12} />
          {pending.length} 条待签到记录 → 标记为未参与
        </li>
        <li className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
          <AlertTriangle size={12} />
          {checkedIn.length} 条已签到记录 → 标记为待补签退
        </li>
        {suCount > 0 && <li className="text-slate-400 px-3 py-1">已有 {suCount} 人报名，记录保留</li>}
      </ul>
    </>
  )
}