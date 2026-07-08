import { motion } from "motion/react"
import { MapPin, Clock, Heart, AlertTriangle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Button } from "../../../../shared/components/ui/button"
import { StatusBadge } from "./StatusBadge"
import { TextAction } from "./TextAction"
import { DAILY_STATUS_CONFIG } from "./VolunteerStatusConfig"
import type { Volunteer, VolunteerSignUp, VolunteerDailyRecord } from "../../store"

interface ActivityStatsItem {
  id: string
  title: string
  description?: string
  location: string
  startTime: string
  endTime: string
  signUpCount: number
  checkedInCount: number
  abnormalCount: number
  totalHours: number
}

interface ActivityDetailViewProps {
  activity: ActivityStatsItem
  signUps: VolunteerSignUp[]
  dailyRecords: VolunteerDailyRecord[]
  volunteers: Volunteer[]
  onBack: () => void
  onExportXlsx: (id: string) => void
  onResolve: (record: VolunteerDailyRecord) => void
}

export function ActivityDetailView({
  activity,
  signUps,
  dailyRecords,
  volunteers,
  onBack,
  onExportXlsx,
  onResolve,
}: ActivityDetailViewProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-[12px] text-slate-400 hover:text-[#2563EB] transition-colors"
      >
        &larr; 返回列表
      </button>

      {/* Activity Info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-100 bg-white p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-lg bg-gradient-to-br from-[#059669] to-[#047857] flex items-center justify-center">
            <Heart size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-800">{activity.title}</h3>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {activity.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {activity.startTime} ~ {activity.endTime.slice(11)}
              </span>
            </div>
          </div>
        </div>
        {activity.description && (
          <p className="text-[12px] text-slate-500 leading-relaxed bg-slate-50 rounded-lg px-3 py-2 mt-2">
            {activity.description}
          </p>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "报名人次", value: activity.signUpCount, color: "#2563EB" },
          { label: "签到人次", value: activity.checkedInCount, color: "#059669" },
          { label: "异常记录", value: activity.abnormalCount, color: "#DC2626" },
          { label: "总服务时长", value: `${activity.totalHours}h`, color: "#D97706" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-slate-100 bg-white p-4 text-center"
          >
            <div className="text-xl font-semibold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Sign-up table */}
      <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-[12px] font-medium text-slate-600">报名签到明细</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={() => onExportXlsx(activity.id)}
          >
            导出 Excel
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] text-slate-400 font-medium">志愿者</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">电话</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">日期</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">状态</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">签到</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">签退</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">时长</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium">备注</TableHead>
              <TableHead className="text-[11px] text-slate-400 font-medium text-right min-w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signUps
              .filter((s) => s.activityId === activity.id)
              .map((su) => {
                const v = volunteers.find((x) => x.id === su.volunteerId)
                const drs = dailyRecords
                  .filter((d) => d.signUpId === su.id)
                  .sort((a, b) => a.date.localeCompare(b.date))
                return drs.map((dr, di) => {
                  const isAbnormal = dr.status === "no_show" || dr.status === "checkout_overdue"
                  const isResolved = dr.isManual
                  const fmtHM = (t?: string) => {
                    if (!t) return "-"
                    const d = new Date(t)
                    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                  }
                  return (
                    <TableRow
                      key={dr.id}
                      className={`hover:bg-slate-50/60 ${isAbnormal && !isResolved ? "bg-amber-50/30" : ""} ${isResolved ? "opacity-80" : ""}`}
                    >
                      <TableCell className="text-[13px] font-medium text-slate-700">
                        {v?.name || su.volunteerId}
                        {dr.isLate && dr.lateMinutes && (
                          <span className="ml-1 text-[10px] text-amber-600">延时{dr.lateMinutes}min</span>
                        )}
                        {isResolved && (
                          <span className="ml-1.5 text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                            补录
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-[12px] text-slate-500 font-mono">{v?.phone || "-"}</TableCell>
                      <TableCell className="text-[12px] text-slate-500">{dr.date}</TableCell>
                      <TableCell>
                        <StatusBadge status={dr.status} config={DAILY_STATUS_CONFIG} />
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-400">{fmtHM(dr.checkInTime)}</TableCell>
                      <TableCell className="text-[11px] text-slate-400">{fmtHM(dr.checkOutTime)}</TableCell>
                      <TableCell className="text-[12px] text-slate-600 font-medium">
                        {dr.serviceHours != null ? `${dr.serviceHours}h` : "-"}
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-400">
                        {dr.reviewNote || (dr.isManual ? dr.reviewNote || "" : "")}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAbnormal && !isResolved && (
                          <TextAction
                            label="补录"
                            color="#D97706"
                            bg="#FFFBEB"
                            onClick={() => onResolve(dr)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              })
              .flat()}
            {signUps.filter((s) => s.activityId === activity.id).length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-slate-300 text-[13px]">
                  暂无报名
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}