import { motion } from "motion/react"
import {
  Clock,
  Phone,
  Building2,
  Heart,
  Image as ImageIcon,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { StatusBadge } from "./StatusBadge"
import { VOL_STATUS_CONFIG } from "./VolunteerStatusConfig"
import type { Volunteer, VolunteerReviewRecord } from "../../store"

interface VolunteerDetailViewProps {
  volunteer: Volunteer
  onBack: () => void
  onApprove: (id: string) => void
  onRejectDialogOpen: (id: string) => void
}

export function VolunteerDetailView({
  volunteer: vol,
  onBack,
  onApprove,
  onRejectDialogOpen,
}: VolunteerDetailViewProps) {
  const isPending = vol.status === "pending"
  const isRejected = vol.status === "rejected"

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="text-[12px] text-slate-400 hover:text-[#2563EB] transition-colors"
        >
          &larr; 返回列表
        </button>
      </div>

      {/* Basic Info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border p-5 ${isPending ? "border-amber-200 bg-amber-50/30" : "border-slate-100 bg-white"}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-lg bg-gradient-to-br from-[#D4A574] to-[#B8864A] flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-800">{vol.name}</h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <StatusBadge status={vol.status} config={VOL_STATUS_CONFIG} />
              <span className="text-slate-200">·</span>
              <span>{vol.createdAt}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px]">
          <div className="flex items-center gap-2 text-slate-500">
            <Phone size={13} className="shrink-0 text-slate-300" />
            <span>{vol.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Building2 size={13} className="shrink-0 text-slate-300" />
            <span>{vol.workUnit}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Heart size={13} className="shrink-0 text-slate-300" />
            <span>{vol.politicalStatus}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <ImageIcon size={13} className="shrink-0 text-slate-300" />
            <span>{vol.credentialImages?.length || 0} 张资质图片</span>
          </div>
        </div>
      </motion.div>

      {/* Credential Images */}
      {vol.credentialImages && vol.credentialImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-slate-100 bg-white p-5"
        >
          <h4 className="text-[12px] font-medium text-slate-600 mb-3 flex items-center gap-1.5">
            <ImageIcon size={14} className="text-slate-300" />
            资质图片
          </h4>
          <div className="grid grid-cols-4 gap-3">
            {vol.credentialImages.map((url, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-50">
                <img src={url} alt={`资质${i + 1}`} className="size-full object-cover" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Review History */}
      {vol.reviewHistory && vol.reviewHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-xl border border-slate-100 bg-white p-5"
        >
          <h4 className="text-[12px] font-medium text-slate-600 mb-3 flex items-center gap-1.5">
            <Clock size={14} className="text-slate-300" />
            审核记录
          </h4>
          <div className="space-y-2.5">
            {vol.reviewHistory.map((r: VolunteerReviewRecord, i: number) => {
              const isApproved = r.action === "approved"
              const isRejected = r.action === "rejected"
              const actionLabel = isApproved ? "审核通过" : isRejected ? "审核驳回" : "重新提交"
              const borderColor = isApproved
                ? "border-emerald-100 bg-emerald-50/40"
                : isRejected
                  ? "border-red-100 bg-red-50/40"
                  : "border-sky-100 bg-sky-50/40"
              const textColor = isApproved ? "text-emerald-700" : isRejected ? "text-red-700" : "text-sky-700"
              return (
                <div key={i} className={`rounded-lg border px-4 py-3 ${borderColor}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[12px] font-medium flex items-center gap-1 ${textColor}`}>
                      {isApproved ? (
                        <CheckCircle2 size={13} />
                      ) : isRejected ? (
                        <XCircle size={13} />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                      {actionLabel}
                    </span>
                    <span className="text-[11px] text-slate-400">{r.reviewedAt}</span>
                  </div>
                  {r.note && <p className="text-[12px] text-slate-600 mt-1">{r.note}</p>}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Rejection info (for rejected state with no history) */}
      {isRejected && vol.reviewNote && !vol.reviewHistory?.length && (
        <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
          <p className="text-[12px] text-red-600 flex items-start gap-1.5">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            {vol.reviewNote}
          </p>
        </div>
      )}

      {/* Approve / Reject actions for pending status */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 pt-2"
        >
          <button
            onClick={() => onApprove(vol.id)}
            className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-medium transition-all active:scale-[0.98]"
          >
            审核通过
          </button>
          <button
            onClick={() => onRejectDialogOpen(vol.id)}
            className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-medium transition-all active:scale-[0.98]"
          >
            驳回
          </button>
        </motion.div>
      )}
    </div>
  )
}