import { useState, useMemo } from "react"
import { useVolunteerStore } from "../../store"
import type { VolunteerActivity, VolunteerSignUp, VolunteerDailyRecord } from "../../store"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { ConfirmDialog } from "../../../../desktop/components/common/ConfirmDialog"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { usePagination } from "@/shared/hooks/usePagination"
import { VolunteerTabs } from "../components/VolunteerTabs"
import { VolunteerListView } from "../components/VolunteerListView"
import { VolunteerDetailView } from "../components/VolunteerDetailView"
import { ActivityListView } from "../components/ActivityListView"
import { ActivityDetailView } from "../components/ActivityDetailView"
import { CreateActivityDialog } from "../components/CreateActivityDialog"
import { EditActivityDialog } from "../components/EditActivityDialog"
import { RejectVolunteerDialog } from "../components/RejectVolunteerDialog"
import { ResolveAbnormalDialog } from "../components/ResolveAbnormalDialog"
import { EndActivityDialog } from "../components/EndActivityDialog"

// ── Excel export ──

function exportSignUpXlsx(activityId: string | null) {
  const state = useVolunteerStore.getState()
  const act = state.activities.find((a) => a.id === activityId)
  if (!act) {
    toast.error("活动不存在")
    return
  }
  const rows: Record<string, any>[] = []
  const su = state.signUps.filter((s) => s.activityId === activityId)
  for (const s of su) {
    const v = state.volunteers.find((x) => x.id === s.volunteerId)
    const drs = state.dailyRecords.filter((d) => d.signUpId === s.id).sort((a, b) => a.date.localeCompare(b.date))
    for (const dr of drs) {
      rows.push({
        志愿者: v?.name || s.volunteerId,
        电话: v?.phone || "",
        日期: dr.date,
        状态:
          {
            pending: "待签到",
            checked_in: "已签到",
            checked_out: "已签退",
            no_show: "未参与",
            checkout_overdue: "待补签退",
          }[dr.status] || dr.status,
        签到时间: dr.checkInTime || "",
        签退时间: dr.checkOutTime || "",
        "服务时长(h)": dr.serviceHours ?? "",
        补录: dr.isManual ? "是" : "否",
        备注: dr.reviewNote || "",
      })
    }
  }
  if (!rows.length) {
    toast.error("暂无报名数据")
    return
  }
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "报名签到")
  ws["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 20 }]
  XLSX.writeFile(wb, `${act.title}-报名签到.xlsx`)
  toast.success("已导出 Excel")
}

// ── initial form state ──

const DEFAULT_FORM = {
  title: "",
  description: "",
  location: "",
  dateStart: "",
  dateEnd: "",
  timeStart: "09:00",
  timeEnd: "17:00",
  enrollStart: "",
  deadline: "",
  max: "20",
}

// ── main page ──

export function VolunteerManagePage() {
  const volunteers = useVolunteerStore((s) => s.volunteers)
  const activities = useVolunteerStore((s) => s.activities)
  const signUps = useVolunteerStore((s) => s.signUps)
  const dailyRecords = useVolunteerStore((s) => s.dailyRecords)
  const addActivity = useVolunteerStore((s) => s.addActivity)
  const editActivity = useVolunteerStore((s) => s.editActivity)
  const publishActivity = useVolunteerStore((s) => s.publishActivity)
  const cancelActivity = useVolunteerStore((s) => s.cancelActivity)
  const forceEndActivity = useVolunteerStore((s) => s.forceEndActivity)
  const deleteActivity = useVolunteerStore((s) => s.deleteActivity)
  const searchVolunteers = useVolunteerStore((s) => s.searchVolunteers)
  const approveVolunteer = useVolunteerStore((s) => s.approveVolunteer)
  const rejectVolunteer = useVolunteerStore((s) => s.rejectVolunteer)
  const resolveAbnormal = useVolunteerStore((s) => s.resolveAbnormal)

  // ── tab state ──
  const [tab, setTab] = useState<"volunteers" | "activities">("activities")

  // ── volunteer state ──
  const [keyword, setKeyword] = useState("")
  const [politicalFilter, setPoliticalFilter] = useState("")
  const [volStatusFilter, setVolStatusFilter] = useState("")
  const [selectedVol, setSelectedVol] = useState<string | null>(null)
  const [rejectVolTarget, setRejectVolTarget] = useState<string | null>(null)
  const [rejectVolReason, setRejectVolReason] = useState("")

  // ── activity state ──
  const [actKeyword, setActKeyword] = useState("")
  const [actStatusFilter, setActStatusFilter] = useState("")
  const [selectedAct, setSelectedAct] = useState<string | null>(null)
  const [editActTarget, setEditActTarget] = useState<string | null>(null)
  const [deleteActTarget, setDeleteActTarget] = useState<string | null>(null)
  const [endActTarget, setEndActTarget] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  // ── form state ──
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [editForm, setEditForm] = useState({ ...DEFAULT_FORM })

  // ── resolve state ──
  const [resolveTarget, setResolveTarget] = useState<string | null>(null)
  const [resolveCheckIn, setResolveCheckIn] = useState("")
  const [resolveCheckOut, setResolveCheckOut] = useState("")
  const [resolveNote, setResolveNote] = useState("")
  const resolveTargetStatus = resolveTarget ? (dailyRecords.find((d) => d.id === resolveTarget)?.status ?? null) : null

  // ── form helpers ──

  const setFormField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))
  const setEditFormField = (key: string, value: string) => setEditForm((f) => ({ ...f, [key]: value }))
  const resetForm = () => setForm({ ...DEFAULT_FORM })

  // ── computed: volunteers ──

  const volStatusOrder: Record<string, number> = { pending: 0, rejected: 1, approved: 2 }

  const filteredVolunteers = useMemo(() => {
    let list = keyword ? searchVolunteers(keyword) : volunteers
    if (politicalFilter) list = list.filter((v) => v.politicalStatus === politicalFilter)
    if (volStatusFilter) list = list.filter((v) => v.status === volStatusFilter)
    return [...list].sort((a, b) => (volStatusOrder[a.status] ?? 9) - (volStatusOrder[b.status] ?? 9))
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
      const drs = dailyRecords.filter((d) => d.activityId === a.id)
      const checkedIn = drs.filter((d) => d.status === "checked_in" || d.status === "checked_out")
      const abnormal = drs.filter((d) => d.status === "no_show" || d.status === "checkout_overdue")
      const totalHours = Math.round(drs.reduce((acc, d) => acc + (d.serviceHours || 0), 0) * 10) / 10
      return { ...a, signUpCount: su.length, checkedInCount: checkedIn.length, abnormalCount: abnormal.length, totalHours }
    })
    return stats
      .filter((a) => {
        const kw = actKeyword.trim().toLowerCase()
        const kwHit = !kw || a.title.toLowerCase().includes(kw) || a.location.toLowerCase().includes(kw) || (a.description || "").toLowerCase().includes(kw)
        const statusHit = !actStatusFilter || a.status === actStatusFilter
        return kwHit && statusHit
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [activities, signUps, dailyRecords, actKeyword, actStatusFilter])

  const activityPagination = usePagination(actStats, 10)

  const selectedActStats = useMemo(() => {
    if (!selectedAct) return null
    return actStats.find((a) => a.id === selectedAct) || null
  }, [selectedAct, actStats])

  // ── handlers ──

  const handleTabChange = (t: "volunteers" | "activities") => {
    setTab(t)
    setSelectedAct(null)
    setSelectedVol(null)
  }

  const handleCreate = () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim() || !form.dateStart || !form.dateEnd || !form.deadline) {
      toast.error("请填写完整信息")
      return
    }
    if (new Date(form.dateEnd) <= new Date(form.dateStart)) {
      toast.error("结束日期必须在开始日期之后")
      return
    }
    if (new Date(form.deadline) > new Date(form.dateStart)) {
      toast.error("报名截止时间必须在活动开始时间之前")
      return
    }
    const startTime = `${form.dateStart}T${form.timeStart}:00`
    const endTime = `${form.dateEnd}T${form.timeEnd}:00`
    const id = addActivity({
      title: form.title.trim(),
      description: form.description.trim(),
      images: [],
      location: form.location.trim(),
      startTime,
      endTime,
      timeMode: "multi",
      dailyStartTime: form.timeStart,
      dailyEndTime: form.timeEnd,
      enrollStartTime: form.enrollStart || undefined,
      signUpDeadline: form.deadline,
      maxParticipants: parseInt(form.max) || 20,
    })
    const res = publishActivity(id)
    if (res.ok) {
      toast.success("活动已创建并发布")
      setCreateOpen(false)
      resetForm()
    } else toast.error(res.msg)
  }

  const handleEndActivity = () => {
    if (!endActTarget) return
    const act = activities.find((a) => a.id === endActTarget)
    if (!act) return
    if (act.status === "in_progress") {
      const r = forceEndActivity(endActTarget)
      if (r.ok) toast.success(r.msg); else toast.error(r.msg)
    } else {
      const r = cancelActivity(endActTarget)
      if (r.ok) toast.success(r.msg); else toast.error(r.msg)
    }
    setEndActTarget(null)
  }

  const handlePublishAct = (id: string) => {
    const res = publishActivity(id)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
  }

  const handleDeleteActivity = () => {
    if (!deleteActTarget) return
    deleteActivity(deleteActTarget)
    toast.success("活动已删除")
    setDeleteActTarget(null)
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
    setRejectVolTarget(null)
    setRejectVolReason("")
  }

  const handleResolve = () => {
    if (!resolveTarget) return
    if (!resolveCheckIn || !resolveCheckOut) { toast.error("请填写签到和签退时间"); return }
    if (!resolveNote.trim()) { toast.error("请填写补录备注"); return }
    const res = resolveAbnormal(resolveTarget, resolveCheckIn, resolveCheckOut, resolveNote)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
    setResolveTarget(null)
    setResolveCheckIn("")
    setResolveCheckOut("")
    setResolveNote("")
  }

  const openEditActivity = (act: (typeof actStats)[0]) => {
    setEditActTarget(act.id)
    setEditForm({
      title: act.title,
      description: act.description || "",
      location: act.location,
      dateStart: act.startTime.slice(0, 10),
      dateEnd: act.endTime.slice(0, 10),
      timeStart: act.dailyStartTime || "09:00",
      timeEnd: act.dailyEndTime || "17:00",
      enrollStart: act.enrollStartTime?.slice(0, 16) || "",
      deadline: act.signUpDeadline.slice(0, 16),
      max: String(act.maxParticipants),
    })
  }

  const handleEditSave = () => {
    if (!editActTarget) return
    if (!editForm.title.trim() || !editForm.location.trim()) { toast.error("请填写完整信息"); return }
    const startTime = `${editForm.dateStart}T${editForm.timeStart}:00`
    const endTime = `${editForm.dateEnd}T${editForm.timeEnd}:00`
    editActivity(editActTarget, {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      location: editForm.location.trim(),
      startTime,
      endTime,
      timeMode: "multi",
      dailyStartTime: editForm.timeStart,
      dailyEndTime: editForm.timeEnd,
      enrollStartTime: editForm.enrollStart || undefined,
      signUpDeadline: editForm.deadline,
      maxParticipants: parseInt(editForm.max) || 20,
    })
    toast.success("活动已更新")
    setEditActTarget(null)
  }

  const handleResolveOpen = (record: VolunteerDailyRecord) => {
    setResolveCheckIn(record.dayStartTime.slice(0, 16))
    setResolveCheckOut(record.dayEndTime.slice(0, 16))
    setResolveTarget(record.id)
    setResolveNote("")
  }

  const endActActivity = endActTarget ? activities.find((a) => a.id === endActTarget) ?? null : null

  // ── render ──

  return (
    <PageLayout title="志愿服务管理" description="管理志愿者注册信息和志愿服务活动">
      <VolunteerTabs tab={tab} onTabChange={handleTabChange} pendingVolCount={pendingVolCount} />

      {/* ═══════ Tab: Volunteers ═══════ */}
      {tab === "volunteers" && !selectedVol && (
        <VolunteerListView
          volunteers={filteredVolunteers}
          keyword={keyword}
          onKeywordChange={setKeyword}
          filters={{ political: politicalFilter, status: volStatusFilter }}
          onFilterChange={(key, val) => {
            if (key === "political") setPoliticalFilter(val)
            if (key === "status") setVolStatusFilter(val)
          }}
          pagination={volunteerPagination}
          onSelect={setSelectedVol}
          politicalStats={politicalStats}
        />
      )}

      {tab === "volunteers" && selectedVol && (
        <VolunteerDetailView
          volunteer={volunteers.find((v) => v.id === selectedVol)!}
          onBack={() => setSelectedVol(null)}
          onApprove={handleApproveVol}
          onRejectDialogOpen={(id) => { setRejectVolTarget(id); setRejectVolReason("") }}
        />
      )}

      {/* ═══════ Tab: Activities ═══════ */}
      {tab === "activities" && selectedAct && selectedActStats && (
        <ActivityDetailView
          activity={selectedActStats}
          signUps={signUps}
          dailyRecords={dailyRecords}
          volunteers={volunteers}
          onBack={() => setSelectedAct(null)}
          onExportXlsx={exportSignUpXlsx}
          onResolve={handleResolveOpen}
        />
      )}

      {tab === "activities" && !(selectedAct && selectedActStats) && (
        <ActivityListView
          activities={actStats}
          keyword={actKeyword}
          onKeywordChange={setActKeyword}
          statusFilter={actStatusFilter}
          onStatusFilterChange={setActStatusFilter}
          pagination={activityPagination}
          onSelect={setSelectedAct}
          onEdit={openEditActivity}
          onPublish={handlePublishAct}
          onDelete={setDeleteActTarget}
          onEnd={setEndActTarget}
          onCreate={() => { resetForm(); setCreateOpen(true) }}
        />
      )}

      {/* ═══════ Dialogs ═══════ */}

      <CreateActivityDialog
        open={createOpen}
        onOpenChange={(v) => { setCreateOpen(v); if (!v) resetForm() }}
        form={{
          title: form.title,
          description: form.description,
          location: form.location,
          dateStart: form.dateStart,
          dateEnd: form.dateEnd,
          timeStart: form.timeStart,
          timeEnd: form.timeEnd,
          enrollStart: form.enrollStart,
          deadline: form.deadline,
          max: form.max,
        }}
        onFormChange={setFormField}
        onCreate={handleCreate}
      />

      <EditActivityDialog
        open={!!editActTarget}
        onOpenChange={(v) => !v && setEditActTarget(null)}
        form={editForm}
        onFormChange={setEditFormField}
        onSave={handleEditSave}
      />

      <RejectVolunteerDialog
        open={!!rejectVolTarget}
        onOpenChange={(v) => !v && setRejectVolTarget(null)}
        reason={rejectVolReason}
        onReasonChange={setRejectVolReason}
        onReject={handleRejectVol}
      />

      <ResolveAbnormalDialog
        open={!!resolveTarget}
        onOpenChange={(v) => !v && setResolveTarget(null)}
        status={resolveTargetStatus}
        checkIn={resolveCheckIn}
        checkOut={resolveCheckOut}
        note={resolveNote}
        onCheckInChange={setResolveCheckIn}
        onCheckOutChange={setResolveCheckOut}
        onNoteChange={setResolveNote}
        onResolve={handleResolve}
      />

      <ConfirmDialog
        open={!!deleteActTarget}
        onOpenChange={(v) => !v && setDeleteActTarget(null)}
        title="确认删除活动"
        description="删除活动后，相关的报名记录也将被清除，此操作不可撤销。"
        onConfirm={handleDeleteActivity}
        confirmText="删除"
      />

      <EndActivityDialog
        open={!!endActTarget}
        onOpenChange={(v) => !v && setEndActTarget(null)}
        activity={endActActivity}
        signUps={signUps}
        dailyRecords={dailyRecords}
        onEnd={handleEndActivity}
      />
    </PageLayout>
  )
}