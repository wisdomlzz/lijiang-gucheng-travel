import { useState, useMemo } from "react"
import { useVolunteerStore } from "../../shared/services/volunteer"
import { Button } from "../../shared/components/ui/button"
import { Input } from "../../shared/components/ui/input"
import { Label } from "../../shared/components/ui/label"
import { PageLayout } from "../components/common/PageLayout"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "../../shared/components/ui/dialog"
import { ConfirmDialog } from "../components/common/ConfirmDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shared/components/ui/table"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { usePagination } from "@/shared/hooks/usePagination"
import {
  Search, Plus, MapPin, Clock, Users, Activity, UserCheck, AlertTriangle, Heart,
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "motion/react"
import type { Volunteer, VolunteerActivity, VolunteerSignUp, VolunteerActivityStatus } from "../../shared/services/volunteer"

// ── status configs ──

const VOL_STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  pending:  { label: "待审核", bg: "#FEF3C7", fg: "#D97706" },
  approved: { label: "已通过", bg: "#D1FAE5", fg: "#059669" },
  rejected: { label: "已驳回", bg: "#FEE2E2", fg: "#DC2626" },
}

const ACT_STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  draft:           { label: "草稿",   bg: "#FEF3C7", fg: "#D97706" },
  pending_review:  { label: "待审核", bg: "#DBEAFE", fg: "#2563EB" },
  published:       { label: "已发布", bg: "#D1FAE5", fg: "#059669" },
  in_progress:     { label: "进行中", bg: "#A7F3D0", fg: "#047857" },
  ended:           { label: "已结束", bg: "#F1F5F9", fg: "#64748B" },
  cancelled:       { label: "已取消", bg: "#F1F5F9", fg: "#94A3B8" },
}

const SU_STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  signed_up:        { label: "已报名",   bg: "#DBEAFE", fg: "#2563EB" },
  checked_in:       { label: "已签到",   bg: "#D1FAE5", fg: "#059669" },
  checked_out:      { label: "已签退",   bg: "#F1F5F9", fg: "#64748B" },
  no_show:          { label: "未签到",   bg: "#FEE2E2", fg: "#DC2626" },
  checkout_overdue: { label: "未签退",   bg: "#FEF3C7", fg: "#D97706" },
}

function StatusBadge({ status, config }: { status: string; config: Record<string, { label: string; bg: string; fg: string }> }) {
  const c = config[status] || { label: status, bg: "#F1F5F9", fg: "#64748B" }
  return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap" style={{ background: c.bg, color: c.fg }}>{c.label}</span>
}

// ── main page ──

export function VolunteerManagePage() {
  const volunteers = useVolunteerStore((s) => s.volunteers)
  const activities = useVolunteerStore((s) => s.activities)
  const signUps = useVolunteerStore((s) => s.signUps)
  const addActivity = useVolunteerStore((s) => s.addActivity)
  const editActivity = useVolunteerStore((s) => s.editActivity)
  const submitActivity = useVolunteerStore((s) => s.submitActivity)
  const approveActivity = useVolunteerStore((s) => s.approveActivity)
  const rejectActivity = useVolunteerStore((s) => s.rejectActivity)
  const cancelActivity = useVolunteerStore((s) => s.cancelActivity)
  const forceEndActivity = useVolunteerStore((s) => s.forceEndActivity)
  const deleteActivity = useVolunteerStore((s) => s.deleteActivity)
  const searchVolunteers = useVolunteerStore((s) => s.searchVolunteers)
  const approveVolunteer = useVolunteerStore((s) => s.approveVolunteer)
  const rejectVolunteer = useVolunteerStore((s) => s.rejectVolunteer)
  const resolveAbnormal = useVolunteerStore((s) => s.resolveAbnormal)

  // ── tab state ──
  const [tab, setTab] = useState<"volunteers" | "activities">("activities")

  // ── volunteer filters ──
  const [keyword, setKeyword] = useState("")
  const [politicalFilter, setPoliticalFilter] = useState("")
  const [volStatusFilter, setVolStatusFilter] = useState("")

  // ── volunteer review dialog ──
  const [rejectVolTarget, setRejectVolTarget] = useState<string | null>(null)
  const [rejectVolReason, setRejectVolReason] = useState("")
  const [viewImagesVol, setViewImagesVol] = useState<string | null>(null)

  // ── activity filters ──
  const [actKeyword, setActKeyword] = useState("")
  const [actStatusFilter, setActStatusFilter] = useState("")

  // ── activity CRUD dialogs ──
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedAct, setSelectedAct] = useState<string | null>(null)
  const [editActTarget, setEditActTarget] = useState<string | null>(null)
  const [deleteActTarget, setDeleteActTarget] = useState<string | null>(null)
  const [rejectActTarget, setRejectActTarget] = useState<string | null>(null)
  const [rejectActReason, setRejectActReason] = useState("")

  // ── activity form fields ──
  const [formTitle, setFormTitle] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formLocation, setFormLocation] = useState("")
  const [formStart, setFormStart] = useState("")
  const [formEnd, setFormEnd] = useState("")
  const [formEnrollStart, setFormEnrollStart] = useState("")
  const [formDeadline, setFormDeadline] = useState("")
  const [formMax, setFormMax] = useState("20")

  const [editFormTitle, setEditFormTitle] = useState("")
  const [editFormDesc, setEditFormDesc] = useState("")
  const [editFormLocation, setEditFormLocation] = useState("")
  const [editFormStart, setEditFormStart] = useState("")
  const [editFormEnd, setEditFormEnd] = useState("")
  const [editFormEnrollStart, setEditFormEnrollStart] = useState("")
  const [editFormDeadline, setEditFormDeadline] = useState("")
  const [editFormMax, setEditFormMax] = useState("20")

  // ── resolve abnormal dialog ──
  const [resolveTarget, setResolveTarget] = useState<string | null>(null)
  const [resolveHours, setResolveHours] = useState("")
  const [resolveNote, setResolveNote] = useState("")

  // ── computed: volunteers ──
  const filteredVolunteers = useMemo(() => {
    let list = keyword ? searchVolunteers(keyword) : volunteers
    if (politicalFilter) list = list.filter((v) => v.politicalStatus === politicalFilter)
    if (volStatusFilter) list = list.filter((v) => v.status === volStatusFilter)
    return list
  }, [volunteers, keyword, politicalFilter, volStatusFilter, searchVolunteers])

  const volunteerPagination = usePagination(filteredVolunteers, 10)

  const politicalStats = useMemo(() => {
    const m: Record<string, number> = {}
    volunteers.forEach((v) => { m[v.politicalStatus] = (m[v.politicalStatus] || 0) + 1 })
    return m
  }, [volunteers])

  const pendingVolCount = useMemo(() => volunteers.filter((v) => v.status === "pending").length, [volunteers])

  // ── computed: activities ──
  const actStats = useMemo(() => {
    const stats = activities.map((a) => {
      const su = signUps.filter((s) => s.activityId === a.id)
      const checkedIn = su.filter((s) => s.status === "checked_in" || s.status === "checked_out")
      const abnormal = su.filter((s) => s.status === "no_show" || s.status === "checkout_overdue")
      const totalHours = su.reduce((acc, s) => acc + (s.serviceHours || 0), 0)
      return { ...a, signUpCount: su.length, checkedInCount: checkedIn.length, abnormalCount: abnormal.length, totalHours }
    })
    return stats.filter((a) => {
      const kw = actKeyword.trim().toLowerCase()
      const kwHit = !kw || a.title.toLowerCase().includes(kw) || a.location.toLowerCase().includes(kw) || (a.description || "").toLowerCase().includes(kw)
      const statusHit = !actStatusFilter || a.status === actStatusFilter
      return kwHit && statusHit
    })
  }, [activities, signUps, actKeyword, actStatusFilter])

  const activityPagination = usePagination(actStats, 10)

  const selectedActStats = useMemo(() => {
    if (!selectedAct) return null
    return actStats.find((a) => a.id === selectedAct) || null
  }, [selectedAct, actStats])

  // ── overview stats ──
  const overviewStats = useMemo(() => [
    { label: "志愿者总数", value: volunteers.length, icon: Users, color: "#D4A574", bg: "#FEF7EE" },
    { label: "待审核", value: pendingVolCount, icon: AlertTriangle, color: "#D97706", bg: "#FFFBEB" },
    { label: "活动总数", value: activities.length, icon: Activity, color: "#2563EB", bg: "#EFF6FF" },
    { label: "异常记录", value: signUps.filter((s) => s.status === "no_show" || s.status === "checkout_overdue").length, icon: AlertTriangle, color: "#DC2626", bg: "#FEF2F2" },
    { label: "总报名人次", value: signUps.length, icon: UserCheck, color: "#7C3AED", bg: "#F5F3FF" },
    { label: "总服务时长", value: `${signUps.reduce((a, s) => a + (s.serviceHours || 0), 0)}h`, icon: Clock, color: "#D4A574", bg: "#FEF7EE" },
  ], [volunteers, activities, signUps, pendingVolCount])

  // ── handlers ──

  const handleCreate = () => {
    if (!formTitle.trim() || !formDesc.trim() || !formLocation.trim() || !formStart || !formEnd || !formDeadline) {
      toast.error("请填写完整信息"); return
    }
    addActivity({
      title: formTitle.trim(), description: formDesc.trim(), images: [],
      location: formLocation.trim(), startTime: formStart, endTime: formEnd,
      enrollStartTime: formEnrollStart || undefined,
      signUpDeadline: formDeadline, maxParticipants: parseInt(formMax) || 20,
    })
    toast.success("活动已创建为草稿")
    setCreateOpen(false)
    resetForm()
  }

  const handleEnd = (id: string) => {
    const res = forceEndActivity(id)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
  }

  const handleSubmitForReview = (id: string) => {
    const res = submitActivity(id)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
  }

  const handleApproveAct = (id: string) => {
    const res = approveActivity(id)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
  }

  const handleRejectAct = () => {
    if (!rejectActTarget) return
    if (!rejectActReason.trim()) { toast.error("请填写驳回原因"); return }
    const res = rejectActivity(rejectActTarget, rejectActReason)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
    setRejectActTarget(null); setRejectActReason("")
  }

  const handleCancelAct = (id: string) => {
    const res = cancelActivity(id)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
  }

  const handleApproveVol = (id: string) => {
    const res = approveVolunteer(id)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
  }

  const handleRejectVol = () => {
    if (!rejectVolTarget) return
    if (!rejectVolReason.trim()) { toast.error("请填写驳回原因"); return }
    const res = rejectVolunteer(rejectVolTarget, rejectVolReason)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
    setRejectVolTarget(null); setRejectVolReason("")
  }

  const handleDeleteActivity = () => {
    if (!deleteActTarget) return
    deleteActivity(deleteActTarget); toast.success("活动已删除"); setDeleteActTarget(null)
  }

  const handleResolve = () => {
    if (!resolveTarget) return
    const hours = parseFloat(resolveHours) || 0
    if (!resolveNote.trim()) { toast.error("请填写处理备注"); return }
    const res = resolveAbnormal(resolveTarget, hours, resolveNote)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
    setResolveTarget(null); setResolveHours(""); setResolveNote("")
  }

  const openEditActivity = (act: typeof actStats[0]) => {
    setEditActTarget(act.id)
    setEditFormTitle(act.title); setEditFormDesc(act.description || ""); setEditFormLocation(act.location)
    setEditFormStart(act.startTime.slice(0, 16)); setEditFormEnd(act.endTime.slice(0, 11) + act.endTime.slice(11))
    setEditFormEnrollStart(act.enrollStartTime?.slice(0, 16) || "")
    setEditFormDeadline(act.signUpDeadline.slice(0, 16)); setEditFormMax(String(act.maxParticipants))
  }

  const handleEditSave = () => {
    if (!editActTarget) return
    if (!editFormTitle.trim() || !editFormLocation.trim()) { toast.error("请填写完整信息"); return }
    editActivity(editActTarget, {
      title: editFormTitle.trim(), description: editFormDesc.trim(), location: editFormLocation.trim(),
      startTime: editFormStart, endTime: editFormEnd,
      enrollStartTime: editFormEnrollStart || undefined,
      signUpDeadline: editFormDeadline, maxParticipants: parseInt(editFormMax) || 20,
    })
    toast.success("活动已更新"); setEditActTarget(null)
  }

  const resetForm = () => {
    setFormTitle(""); setFormDesc(""); setFormLocation(""); setFormStart(""); setFormEnd("")
    setFormEnrollStart(""); setFormDeadline(""); setFormMax("20")
  }

  // ── text action buttons ──

  function TextAction({ label, onClick, color, bg }: { label: string; onClick: () => void; color: string; bg?: string }) {
    return (
      <button onClick={onClick}
        className="inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[12px] font-medium transition-all whitespace-nowrap"
        style={{ color, background: bg || `${color}0d` }}
        onMouseEnter={(e) => e.currentTarget.style.background = `${color}1a`}
        onMouseLeave={(e) => e.currentTarget.style.background = bg || `${color}0d`}>
        {label}
      </button>
    )
  }

  // ── act table action buttons ──
  const renderActActions = (a: typeof actStats[0]) => {
    const status = a.status as VolunteerActivityStatus
    return (
      <div className="inline-flex items-center gap-1 justify-end whitespace-nowrap">
        <TextAction label="详情" color="#2563EB" onClick={() => setSelectedAct(a.id)} />
        {status === "draft" && (
          <>
            <TextAction label="编辑" color="#2563EB" onClick={() => openEditActivity(a)} />
            <TextAction label="提交审核" color="#059669" onClick={() => handleSubmitForReview(a.id)} />
            <TextAction label="删除" color="#DC2626" bg="#FEF2F2" onClick={() => setDeleteActTarget(a.id)} />
          </>
        )}
        {status === "pending_review" && (
          <>
            <TextAction label="通过" color="#059669" onClick={() => handleApproveAct(a.id)} />
            <TextAction label="驳回" color="#DC2626" bg="#FEF2F2" onClick={() => { setRejectActTarget(a.id); setRejectActReason("") }} />
          </>
        )}
        {status === "published" && a.signUpCount === 0 && (
          <TextAction label="取消活动" color="#DC2626" bg="#FEF2F2" onClick={() => handleCancelAct(a.id)} />
        )}
        {status === "in_progress" && (
          <TextAction label="强制结束" color="#D97706" bg="#FFFBEB" onClick={() => handleEnd(a.id)} />
        )}
      </div>
    )
  }

  // ── render ──

  return (
    <PageLayout title="志愿服务管理" description="管理志愿者注册信息和志愿服务活动">

      {/* Overview Stats */}
      <div className="grid grid-cols-6 gap-3 mb-5">
        {overviewStats.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-slate-100 bg-white p-4 overflow-hidden relative"
            >
              <div className="absolute -right-2 -top-2 size-14 rounded-full opacity-[0.06]" style={{ background: s.color }} />
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">{s.label}</div>
                  <div className="text-xl font-semibold mt-0.5" style={{ color: s.color }}>{s.value}</div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 mb-5 border-b border-slate-200">
        {(["activities", "volunteers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedAct(null) }}
            className={`relative pb-2.5 text-[13px] font-medium transition-colors ${
              tab === t ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="flex items-center gap-2">
              {t === "volunteers" ? "志愿者审核" : "活动管理"}
              {t === "volunteers" && pendingVolCount > 0 && (
                <span className="px-1.5 h-4 min-w-[16px] rounded bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">{pendingVolCount}</span>
              )}
            </span>
            {tab === t && (
              <motion.div layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-slate-800" />
            )}
          </button>
        ))}
      </div>

      {/* ═══════ Tab: Volunteers ═══════ */}
      {tab === "volunteers" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-300" />
              <Input
                placeholder="搜索姓名/电话..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9 h-9 text-[13px] rounded-lg border-slate-150"
              />
            </div>
            <select
              value={politicalFilter}
              onChange={(e) => setPoliticalFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-150 bg-white px-2.5 text-[12px] text-slate-600 focus:outline-none"
            >
              <option value="">全部政治面貌</option>
              {Object.keys(politicalStats).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <select
              value={volStatusFilter}
              onChange={(e) => setVolStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-150 bg-white px-2.5 text-[12px] text-slate-600 focus:outline-none"
            >
              <option value="">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
            </select>
            {(politicalFilter || volStatusFilter) && (
              <button onClick={() => { setPoliticalFilter(""); setVolStatusFilter("") }} className="text-[11px] text-slate-400 hover:text-slate-600">清除</button>
            )}
          </div>

          {/* Political stats pills */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {Object.entries(politicalStats).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-slate-50 text-slate-500 border border-slate-100">
                {k} <span className="font-medium text-slate-700">{v}</span>
              </span>
            ))}
          </div>

          <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] text-slate-400 font-medium">姓名</TableHead>
                  <TableHead className="text-[11px] text-slate-400 font-medium">电话</TableHead>
                  <TableHead className="text-[11px] text-slate-400 font-medium">政治面貌</TableHead>
                  <TableHead className="text-[11px] text-slate-400 font-medium">工作单位</TableHead>
                  <TableHead className="text-[11px] text-slate-400 font-medium">资质</TableHead>
                  <TableHead className="text-[11px] text-slate-400 font-medium">状态</TableHead>
                  <TableHead className="text-[11px] text-slate-400 font-medium">注册时间</TableHead>
                  <TableHead className="text-[11px] text-slate-400 font-medium text-right min-w-[120px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-300 text-[13px]">暂无志愿者数据</TableCell>
                  </TableRow>
                ) : (
                  volunteerPagination.paginatedItems.map((v) => {
                    const isPending = v.status === "pending"
                    return (
                      <TableRow key={v.id} className={`hover:bg-slate-50/60 transition-colors ${isPending ? "bg-amber-50/40" : ""}`}>
                        <TableCell className="font-medium text-[13px] text-slate-700">{v.name}</TableCell>
                        <TableCell className="text-[12px] text-slate-500 font-mono">{v.phone}</TableCell>
                        <TableCell>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">{v.politicalStatus}</span>
                        </TableCell>
                        <TableCell className="text-[12px] text-slate-500">{v.workUnit}</TableCell>
                        <TableCell>
                          {v.credentialImages?.length ? (
                            <button onClick={() => setViewImagesVol(v.id)}
                              className="text-[12px] text-blue-600 hover:text-blue-700 font-medium transition-colors">{v.credentialImages.length}张</button>
                          ) : (<span className="text-[11px] text-slate-300">无</span>)}
                        </TableCell>
                        <TableCell><StatusBadge status={v.status} config={VOL_STATUS_CONFIG} /></TableCell>
                        <TableCell className="text-[11px] text-slate-400">{v.createdAt}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {v.status === "pending" && (
                              <>
                                <TextAction label="通过" color="#059669" onClick={() => handleApproveVol(v.id)} />
                                <TextAction label="驳回" color="#DC2626" bg="#FEF2F2" onClick={() => { setRejectVolTarget(v.id); setRejectVolReason("") }} />
                              </>
                            )}
                            {v.status === "rejected" && v.reviewNote && (
                              <span className="text-[11px] text-red-400 max-w-[140px] truncate inline-block align-middle" title={v.reviewNote}>{v.reviewNote}</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filteredVolunteers.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <PaginationBar
                page={volunteerPagination.currentPage}
                totalPages={volunteerPagination.totalPages}
                onPageChange={volunteerPagination.setCurrentPage}
                pageSize={10}
                onPageSizeChange={() => {}}
                total={volunteerPagination.total}
              />
            </div>
          )}
        </div>
      )}

      {/* ═══════ Tab: Activities ═══════ */}
      {tab === "activities" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {selectedAct && (
                <button onClick={() => setSelectedAct(null)}
                  className="text-[12px] text-slate-400 hover:text-[#2563EB] transition-colors">
                  &larr; 返回列表
                </button>
              )}
            </div>
            {!selectedAct && (
              <Button size="sm" className="h-8 text-xs rounded-lg" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5 mr-1.5" />创建活动
              </Button>
            )}
          </div>

          {selectedAct && selectedActStats ? (
            /* ── Activity Detail ── */
            <div className="space-y-4">
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
                    <h3 className="text-[15px] font-semibold text-slate-800">{selectedActStats.title}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1"><MapPin size={11} />{selectedActStats.location}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{selectedActStats.startTime} ~ {selectedActStats.endTime.slice(11)}</span>
                    </div>
                  </div>
                </div>
                {selectedActStats.description && (
                  <p className="text-[12px] text-slate-500 leading-relaxed bg-slate-50 rounded-lg px-3 py-2 mt-2">{selectedActStats.description}</p>
                )}
              </motion.div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "报名人次", value: selectedActStats.signUpCount, color: "#2563EB" },
                  { label: "签到人次", value: selectedActStats.checkedInCount, color: "#059669" },
                  { label: "异常记录", value: selectedActStats.abnormalCount, color: "#DC2626" },
                  { label: "总服务时长", value: `${selectedActStats.totalHours}h`, color: "#D97706" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-xl border border-slate-100 bg-white p-4 text-center"
                  >
                    <div className="text-xl font-semibold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Sign-up table */}
              <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] text-slate-400 font-medium">志愿者</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">电话</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">状态</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">签到</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">签退</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">时长</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium text-right min-w-[80px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signUps.filter((s) => s.activityId === selectedAct).map((su) => {
                      const v = volunteers.find((x) => x.id === su.volunteerId)
                      const isAbnormal = su.status === "no_show" || su.status === "checkout_overdue"
                      return (
                        <TableRow key={su.id} className={`hover:bg-slate-50/60 ${isAbnormal ? "bg-red-50/30" : ""}`}>
                          <TableCell className="text-[13px] font-medium text-slate-700">
                            {v?.name || su.volunteerId}
                            {su.isLate && <span className="ml-1 text-[10px] text-amber-600">迟到{su.lateMinutes}min</span>}
                            {su.isManual && <span className="ml-1 text-[10px] text-blue-500">补录</span>}
                          </TableCell>
                          <TableCell className="text-[12px] text-slate-500 font-mono">{v?.phone || "-"}</TableCell>
                          <TableCell><StatusBadge status={su.status} config={SU_STATUS_CONFIG} /></TableCell>
                          <TableCell className="text-[11px] text-slate-400">{su.checkInTime || "-"}</TableCell>
                          <TableCell className="text-[11px] text-slate-400">{su.checkOutTime || "-"}</TableCell>
                          <TableCell className="text-[12px] text-slate-600 font-medium">{su.serviceHours != null ? `${su.serviceHours}h` : "-"}</TableCell>
                          <TableCell className="text-right">
                            {isAbnormal && (
                              <TextAction label="处理" color="#D97706" bg="#FFFBEB" onClick={() => { setResolveTarget(su.id); setResolveHours(""); setResolveNote("") }} />
                            )}
                            {su.reviewNote && su.isManual && (
                              <span className="text-[10px] text-slate-400 ml-2" title={su.reviewNote}>📝</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {signUps.filter((s) => s.activityId === selectedAct).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-slate-300 text-[13px]">暂无报名</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            /* ── Activity List ── */
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-300" />
                  <Input
                    placeholder="搜索活动名称/地点..."
                    value={actKeyword}
                    onChange={(e) => setActKeyword(e.target.value)}
                    className="pl-9 h-9 text-[13px] rounded-lg border-slate-150"
                  />
                </div>
                <select
                  value={actStatusFilter}
                  onChange={(e) => setActStatusFilter(e.target.value)}
                  className="h-9 rounded-lg border border-slate-150 bg-white px-2.5 text-[12px] text-slate-600 focus:outline-none"
                >
                  <option value="">全部状态</option>
                  <option value="draft">草稿</option>
                  <option value="pending_review">待审核</option>
                  <option value="published">已发布</option>
                  <option value="in_progress">进行中</option>
                  <option value="ended">已结束</option>
                  <option value="cancelled">已取消</option>
                </select>
                {(actKeyword || actStatusFilter) && (
                  <button onClick={() => { setActKeyword(""); setActStatusFilter("") }} className="text-[11px] text-slate-400 hover:text-slate-600">清除</button>
                )}
              </div>
              <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] text-slate-400 font-medium">活动名称</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">时间</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">地点</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">报名</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">状态</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium text-right min-w-[160px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-slate-300 text-[13px]">
                          {actKeyword || actStatusFilter ? "没有匹配的活动" : "暂无活动，点击创建"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      activityPagination.paginatedItems.map((a) => (
                        <TableRow key={a.id} className="hover:bg-slate-50/60 transition-colors">
                          <TableCell className="font-medium text-[13px] text-slate-700">{a.title}</TableCell>
                          <TableCell className="text-[11px] text-slate-500">{a.startTime}</TableCell>
                          <TableCell className="text-[12px] text-slate-500">{a.location}</TableCell>
                          <TableCell>
                            <span className="text-[12px] font-medium text-slate-600">{a.signUpCount}/{a.maxParticipants}</span>
                          </TableCell>
                          <TableCell><StatusBadge status={a.status} config={ACT_STATUS_CONFIG} /></TableCell>
                          <TableCell className="text-right">{renderActActions(a)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {actStats.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <PaginationBar
                    page={activityPagination.currentPage}
                    totalPages={activityPagination.totalPages}
                    onPageChange={activityPagination.setCurrentPage}
                    pageSize={10}
                    onPageSizeChange={() => {}}
                    total={activityPagination.total}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════ Dialogs ═══════ */}

      {/* Create Activity */}
      <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) resetForm() }}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="text-[15px]">创建志愿活动</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-[12px]">活动标题</Label><Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="例如：古城环境清洁日" className="mt-1 rounded-lg" /></div>
            <div><Label className="text-[12px]">活动描述</Label><textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="描述活动内容..." rows={3} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669]/40 resize-y" /></div>
            <div><Label className="text-[12px]">活动地点</Label><Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="例如：丽江古城四方街" className="mt-1 rounded-lg" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[12px]">开始时间</Label><input type="datetime-local" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none" /></div>
              <div><Label className="text-[12px]">结束时间</Label><input type="datetime-local" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[12px]">报名开始 <span className="text-slate-300">(可选)</span></Label><input type="datetime-local" value={formEnrollStart} onChange={(e) => setFormEnrollStart(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none" placeholder="留空=发布即报名" /></div>
              <div><Label className="text-[12px]">报名截止</Label><input type="datetime-local" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none" /></div>
            </div>
            <div><Label className="text-[12px]">人数上限</Label><Input type="number" value={formMax} onChange={(e) => setFormMax(e.target.value)} min={1} className="mt-1 rounded-lg w-32" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button size="sm" className="h-8 text-xs rounded-lg bg-[#059669] hover:bg-[#047857]" onClick={handleCreate}>创建草稿</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Activity */}
      <Dialog open={!!editActTarget} onOpenChange={(v) => !v && setEditActTarget(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="text-[15px]">编辑活动</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-[12px]">活动标题</Label><Input value={editFormTitle} onChange={(e) => setEditFormTitle(e.target.value)} className="mt-1 rounded-lg" /></div>
            <div><Label className="text-[12px]">活动描述</Label><textarea value={editFormDesc} onChange={(e) => setEditFormDesc(e.target.value)} rows={3} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#059669]/20 resize-y" /></div>
            <div><Label className="text-[12px]">活动地点</Label><Input value={editFormLocation} onChange={(e) => setEditFormLocation(e.target.value)} className="mt-1 rounded-lg" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[12px]">开始时间</Label><input type="datetime-local" value={editFormStart} onChange={(e) => setEditFormStart(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none" /></div>
              <div><Label className="text-[12px]">结束时间</Label><input type="datetime-local" value={editFormEnd} onChange={(e) => setEditFormEnd(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[12px]">报名开始 <span className="text-slate-300">(可选)</span></Label><input type="datetime-local" value={editFormEnrollStart} onChange={(e) => setEditFormEnrollStart(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none" /></div>
              <div><Label className="text-[12px]">报名截止</Label><input type="datetime-local" value={editFormDeadline} onChange={(e) => setEditFormDeadline(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none" /></div>
            </div>
            <div><Label className="text-[12px]">人数上限</Label><Input type="number" value={editFormMax} onChange={(e) => setEditFormMax(e.target.value)} min={1} className="mt-1 rounded-lg w-32" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setEditActTarget(null)}>取消</Button>
            <Button size="sm" className="h-8 text-xs rounded-lg" onClick={handleEditSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Volunteer */}
      <Dialog open={!!rejectVolTarget} onOpenChange={(v) => !v && setRejectVolTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-[15px]">驳回志愿者</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label className="text-[12px]">驳回原因 <span className="text-red-400">*</span></Label>
            <textarea value={rejectVolReason} onChange={(e) => setRejectVolReason(e.target.value)} rows={3} placeholder="请说明驳回原因..."
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-200 resize-y" />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setRejectVolTarget(null)}>取消</Button>
            <Button size="sm" className="h-8 text-xs rounded-lg bg-red-500 hover:bg-red-600" onClick={handleRejectVol}>驳回</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Activity */}
      <Dialog open={!!rejectActTarget} onOpenChange={(v) => !v && setRejectActTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-[15px]">驳回活动</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label className="text-[12px]">驳回原因 <span className="text-red-400">*</span></Label>
            <textarea value={rejectActReason} onChange={(e) => setRejectActReason(e.target.value)} rows={3} placeholder="请说明驳回原因..."
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-200 resize-y" />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setRejectActTarget(null)}>取消</Button>
            <Button size="sm" className="h-8 text-xs rounded-lg bg-red-500 hover:bg-red-600" onClick={handleRejectAct}>驳回</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Volunteer Images */}
      <Dialog open={!!viewImagesVol} onOpenChange={(v) => !v && setViewImagesVol(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-[15px]">资质图片</DialogTitle></DialogHeader>
          <div className="py-2 space-y-2">
            {viewImagesVol && (() => {
              const vol = volunteers.find((v) => v.id === viewImagesVol)
              if (!vol?.credentialImages?.length) return <p className="text-[13px] text-slate-400 text-center py-4">暂无资质图片</p>
              return vol.credentialImages.map((url, i) => (
                <img key={i} src={url} alt={`资质${i + 1}`} className="w-full rounded-lg border border-slate-100" />
              ))
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Abnormal */}
      <Dialog open={!!resolveTarget} onOpenChange={(v) => !v && setResolveTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-[15px]">处理异常记录</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[12px]">补录服务时长 <span className="text-slate-300">(0=缺席)</span></Label>
              <Input type="number" step="0.5" min={0} value={resolveHours} onChange={(e) => setResolveHours(e.target.value)} placeholder="0" className="mt-1 rounded-lg w-32" />
            </div>
            <div>
              <Label className="text-[12px]">处理备注 <span className="text-red-400">*</span></Label>
              <textarea value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} rows={3} placeholder="请说明处理情况..."
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 resize-y" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setResolveTarget(null)}>取消</Button>
            <Button size="sm" className="h-8 text-xs rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8]" onClick={handleResolve}>确认处理</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Activity */}
      <ConfirmDialog
        open={!!deleteActTarget}
        onOpenChange={(v) => !v && setDeleteActTarget(null)}
        title="确认删除活动"
        description="删除活动后，相关的报名记录也将被清除，此操作不可撤销。"
        onConfirm={handleDeleteActivity}
        confirmText="删除"
      />
    </PageLayout>
  )
}
