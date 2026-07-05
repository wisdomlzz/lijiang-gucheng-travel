import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useVolunteerStore } from "../../store"
import type { VolunteerActivityStatus, VolunteerReviewRecord } from "../../store"
import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import { Label } from "../../../../shared/components/ui/label"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../shared/components/ui/dialog"
import { ConfirmDialog } from "../../../../desktop/components/common/ConfirmDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { usePagination } from "@/shared/hooks/usePagination"
import {
  Search,
  Plus,
  MapPin,
  Clock,
  AlertTriangle,
  Heart,
  Crosshair,
  Loader2,
  Phone,
  Building2,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "motion/react"
import * as XLSX from "xlsx"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import iconUrl from "leaflet/dist/images/marker-icon.png"
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import shadowUrl from "leaflet/dist/images/marker-shadow.png"

// ── status configs ──

const VOL_STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "待审核", bg: "#FEF3C7", fg: "#D97706" },
  approved: { label: "已通过", bg: "#D1FAE5", fg: "#059669" },
  rejected: { label: "已驳回", bg: "#FEE2E2", fg: "#DC2626" },
}

const ACT_STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: "草稿", bg: "#FEF3C7", fg: "#D97706" },
  published: { label: "已发布", bg: "#D1FAE5", fg: "#059669" },
  in_progress: { label: "进行中", bg: "#A7F3D0", fg: "#047857" },
  ended: { label: "已结束", bg: "#F1F5F9", fg: "#64748B" },
  cancelled: { label: "已取消", bg: "#F1F5F9", fg: "#94A3B8" },
}

const DAILY_STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "待签到", bg: "#DBEAFE", fg: "#2563EB" },
  checked_in: { label: "已签到", bg: "#D1FAE5", fg: "#059669" },
  checked_out: { label: "已签退", bg: "#F1F5F9", fg: "#64748B" },
  no_show: { label: "未参与", bg: "#FEF3C7", fg: "#B45309" },
  checkout_overdue: { label: "待补签退", bg: "#FEF3C7", fg: "#D97706" },
}

// ── Inline map picker component ──

type NominatimResult = { display_name: string; lat: string; lon: string }

const MAP_DEFAULT: [number, number] = [26.8753, 100.2299]

function LocationMapField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })
    const map = L.map(containerRef.current, { center: MAP_DEFAULT, zoom: 15 })
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OSM" }).addTo(map)
    const marker = L.marker(MAP_DEFAULT, { draggable: true }).addTo(map)
    markerRef.current = marker
    map.on("click", async (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&accept-language=zh`
        )
        const data = await res.json()
        onChange(data.display_name || `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`)
      } catch {
        onChange(`${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`)
      }
    })
    marker.on("dragend", async () => {
      const pos = marker.getLatLng()
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=18&accept-language=zh`
        )
        const data = await res.json()
        onChange(data.display_name || `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`)
      } catch {
        onChange(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`)
      }
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=5&accept-language=zh`
      )
      const data: NominatimResult[] = await res.json()
      setResults(data)
    } catch {
      setResults([])
    }
    setSearching(false)
  }

  const handleSelectResult = (r: NominatimResult) => {
    const lat = parseFloat(r.lat),
      lng = parseFloat(r.lon)
    onChange(r.display_name)
    setResults([])
    mapRef.current?.setView([lat, lng], 16)
    markerRef.current?.setLatLng([lat, lng])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="搜索地点名称…"
            className="pl-9 h-8 text-[12px] rounded-lg"
          />
        </div>
        <Button size="sm" className="h-8 text-[11px] rounded-lg" onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          搜索
        </Button>
        <button
          onClick={() => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition((p) => {
              mapRef.current?.setView([p.coords.latitude, p.coords.longitude], 16)
              markerRef.current?.setLatLng([p.coords.latitude, p.coords.longitude])
            })
          }}
          className="size-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 shrink-0"
          title="定位"
        >
          <Crosshair size={13} className="text-slate-400" />
        </button>
      </div>
      {results.length > 0 && (
        <div className="max-h-28 overflow-y-auto rounded-lg border border-slate-100 bg-white divide-y">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelectResult(r)}
              className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 flex items-start gap-1.5"
            >
              <MapPin size={11} className="mt-0.5 shrink-0 text-slate-300" />
              <span className="line-clamp-1">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
      <div ref={containerRef} className="w-full h-44 rounded-lg border border-slate-200 overflow-hidden" />
      {value && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 flex items-center gap-1.5">
          <MapPin size={12} className="shrink-0 text-emerald-600" />
          <span className="text-[11px] text-emerald-700 line-clamp-1">{value}</span>
        </div>
      )}
    </div>
  )
}

function StatusBadge({
  status,
  config,
}: {
  status: string
  config: Record<string, { label: string; bg: string; fg: string }>
}) {
  const c = config[status] || { label: status, bg: "#F1F5F9", fg: "#64748B" }
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  )
}

// ── main page ──

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
  // 列宽
  ws["!cols"] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 8 },
    { wch: 20 },
  ]
  XLSX.writeFile(wb, `${act.title}-报名签到.xlsx`)
  toast.success("已导出 Excel")
}

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

  // ── volunteer filters ──
  const [keyword, setKeyword] = useState("")
  const [politicalFilter, setPoliticalFilter] = useState("")
  const [volStatusFilter, setVolStatusFilter] = useState("")

  // ── volunteer review dialog ──
  const [rejectVolTarget, setRejectVolTarget] = useState<string | null>(null)
  const [rejectVolReason, setRejectVolReason] = useState("")
  const [selectedVol, setSelectedVol] = useState<string | null>(null)

  // ── activity filters ──
  const [actKeyword, setActKeyword] = useState("")
  const [actStatusFilter, setActStatusFilter] = useState("")

  // ── activity CRUD dialogs ──
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedAct, setSelectedAct] = useState<string | null>(null)
  const [editActTarget, setEditActTarget] = useState<string | null>(null)
  const [deleteActTarget, setDeleteActTarget] = useState<string | null>(null)
  const [endActTarget, setEndActTarget] = useState<string | null>(null)

  // ── activity form fields ──
  const [formTitle, setFormTitle] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formLocation, setFormLocation] = useState("")
  const [formDateStart, setFormDateStart] = useState("")
  const [formDateEnd, setFormDateEnd] = useState("")
  const [formTimeStart, setFormTimeStart] = useState("09:00")
  const [formTimeEnd, setFormTimeEnd] = useState("17:00")
  const [formEnrollStart, setFormEnrollStart] = useState("")
  const [formDeadline, setFormDeadline] = useState("")
  const [formMax, setFormMax] = useState("20")

  const [editFormTitle, setEditFormTitle] = useState("")
  const [editFormDesc, setEditFormDesc] = useState("")
  const [editFormLocation, setEditFormLocation] = useState("")
  const [editFormDateStart, setEditFormDateStart] = useState("")
  const [editFormDateEnd, setEditFormDateEnd] = useState("")
  const [editFormTimeStart, setEditFormTimeStart] = useState("09:00")
  const [editFormTimeEnd, setEditFormTimeEnd] = useState("17:00")
  const [editFormEnrollStart, setEditFormEnrollStart] = useState("")
  const [editFormDeadline, setEditFormDeadline] = useState("")
  const [editFormMax, setEditFormMax] = useState("20")

  // ── resolve abnormal dialog ──
  const [resolveTarget, setResolveTarget] = useState<string | null>(null)
  const [resolveCheckIn, setResolveCheckIn] = useState("")
  const [resolveCheckOut, setResolveCheckOut] = useState("")
  const [resolveNote, setResolveNote] = useState("")
  const resolveTargetStatus = resolveTarget ? dailyRecords.find((d) => d.id === resolveTarget)?.status : null
  const resolveTargetRecord = resolveTarget ? dailyRecords.find((d) => d.id === resolveTarget) : undefined

  // ── computed: volunteers ──
  // 排序：待审核 → 已驳回 → 已通过（需要操作的排前面）
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
    volunteers.forEach((v) => {
      m[v.politicalStatus] = (m[v.politicalStatus] || 0) + 1
    })
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
      return {
        ...a,
        signUpCount: su.length,
        checkedInCount: checkedIn.length,
        abnormalCount: abnormal.length,
        totalHours,
      }
    })
    const filtered = stats.filter((a) => {
      const kw = actKeyword.trim().toLowerCase()
      const kwHit =
        !kw ||
        a.title.toLowerCase().includes(kw) ||
        a.location.toLowerCase().includes(kw) ||
        (a.description || "").toLowerCase().includes(kw)
      const statusHit = !actStatusFilter || a.status === actStatusFilter
      return kwHit && statusHit
    })
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [activities, signUps, dailyRecords, actKeyword, actStatusFilter])

  const activityPagination = usePagination(actStats, 10)

  const selectedActStats = useMemo(() => {
    if (!selectedAct) return null
    return actStats.find((a) => a.id === selectedAct) || null
  }, [selectedAct, actStats])

  // ── handlers ──

  const handleCreate = () => {
    if (
      !formTitle.trim() ||
      !formDesc.trim() ||
      !formLocation.trim() ||
      !formDateStart ||
      !formDateEnd ||
      !formDeadline
    ) {
      toast.error("请填写完整信息")
      return
    }
    if (new Date(formDateEnd) <= new Date(formDateStart)) {
      toast.error("结束日期必须在开始日期之后")
      return
    }
    if (new Date(formDeadline) > new Date(formDateStart)) {
      toast.error("报名截止时间必须在活动开始时间之前")
      return
    }
    const startTime = `${formDateStart}T${formTimeStart}:00`
    const endTime = `${formDateEnd}T${formTimeEnd}:00`
    const id = addActivity({
      title: formTitle.trim(),
      description: formDesc.trim(),
      images: [],
      location: formLocation.trim(),
      startTime,
      endTime,
      timeMode: "multi",
      dailyStartTime: formTimeStart,
      dailyEndTime: formTimeEnd,
      enrollStartTime: formEnrollStart || undefined,
      signUpDeadline: formDeadline,
      maxParticipants: parseInt(formMax) || 20,
    })
    // 直接发布
    const res = publishActivity(id)
    if (res.ok) {
      toast.success("活动已创建并发布")
      setCreateOpen(false)
      resetForm()
    } else toast.error(res.msg)
  }

  const handleEnd = (id: string) => {
    const res = forceEndActivity(id)
    if (res.ok) toast.success(res.msg)
    else toast.error(res.msg)
  }

  const handlePublishAct = (id: string) => {
    const res = publishActivity(id)
    if (res.ok) toast.success(res.msg)
    else toast.error(res.msg)
  }

  const handleEndActivity = () => {
    if (!endActTarget) return
    const act = activities.find((a) => a.id === endActTarget)
    if (!act) return
    if (act.status === "in_progress") {
      const res = forceEndActivity(endActTarget)
      if (res.ok) toast.success(res.msg)
      else toast.error(res.msg)
    } else {
      const res = cancelActivity(endActTarget)
      if (res.ok) toast.success(res.msg)
      else toast.error(res.msg)
    }
    setEndActTarget(null)
  }

  const handleApproveVol = (id: string) => {
    const res = approveVolunteer(id)
    if (res.ok) toast.success(res.msg)
    else toast.error(res.msg)
  }

  const handleRejectVol = () => {
    if (!rejectVolTarget) return
    if (!rejectVolReason.trim()) {
      toast.error("请填写驳回原因")
      return
    }
    const res = rejectVolunteer(rejectVolTarget, rejectVolReason)
    if (res.ok) toast.success(res.msg)
    else toast.error(res.msg)
    setRejectVolTarget(null)
    setRejectVolReason("")
  }

  const handleDeleteActivity = () => {
    if (!deleteActTarget) return
    deleteActivity(deleteActTarget)
    toast.success("活动已删除")
    setDeleteActTarget(null)
  }

  const handleResolve = () => {
    if (!resolveTarget) return
    if (!resolveCheckIn || !resolveCheckOut) {
      toast.error("请填写签到和签退时间")
      return
    }
    if (!resolveNote.trim()) {
      toast.error("请填写补录备注")
      return
    }
    const res = resolveAbnormal(resolveTarget, resolveCheckIn, resolveCheckOut, resolveNote)
    if (res.ok) toast.success(res.msg)
    else toast.error(res.msg)
    setResolveTarget(null)
    setResolveCheckIn("")
    setResolveCheckOut("")
    setResolveNote("")
  }

  const openEditActivity = (act: (typeof actStats)[0]) => {
    setEditActTarget(act.id)
    setEditFormTitle(act.title)
    setEditFormDesc(act.description || "")
    setEditFormLocation(act.location)
    setEditFormDateStart(act.startTime.slice(0, 10))
    setEditFormDateEnd(act.endTime.slice(0, 10))
    setEditFormTimeStart(act.dailyStartTime || "09:00")
    setEditFormTimeEnd(act.dailyEndTime || "17:00")
    setEditFormEnrollStart(act.enrollStartTime?.slice(0, 16) || "")
    setEditFormDeadline(act.signUpDeadline.slice(0, 16))
    setEditFormMax(String(act.maxParticipants))
  }

  const handleEditSave = () => {
    if (!editActTarget) return
    if (!editFormTitle.trim() || !editFormLocation.trim()) {
      toast.error("请填写完整信息")
      return
    }
    const startTime = `${editFormDateStart}T${editFormTimeStart}:00`
    const endTime = `${editFormDateEnd}T${editFormTimeEnd}:00`
    editActivity(editActTarget, {
      title: editFormTitle.trim(),
      description: editFormDesc.trim(),
      location: editFormLocation.trim(),
      startTime,
      endTime,
      timeMode: "multi",
      dailyStartTime: editFormTimeStart,
      dailyEndTime: editFormTimeEnd,
      enrollStartTime: editFormEnrollStart || undefined,
      signUpDeadline: editFormDeadline,
      maxParticipants: parseInt(editFormMax) || 20,
    })
    toast.success("活动已更新")
    setEditActTarget(null)
  }

  const resetForm = () => {
    setFormTitle("")
    setFormDesc("")
    setFormLocation("")
    setFormDateStart("")
    setFormDateEnd("")
    setFormTimeStart("09:00")
    setFormTimeEnd("17:00")
    setFormEnrollStart("")
    setFormDeadline("")
    setFormMax("20")
  }

  // ── text action buttons ──

  function TextAction({
    label,
    onClick,
    color,
    bg,
  }: {
    label: string
    onClick: () => void
    color: string
    bg?: string
  }) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[12px] font-medium transition-all whitespace-nowrap"
        style={{ color, background: bg || `${color}0d` }}
        onMouseEnter={(e) => (e.currentTarget.style.background = `${color}1a`)}
        onMouseLeave={(e) => (e.currentTarget.style.background = bg || `${color}0d`)}
      >
        {label}
      </button>
    )
  }

  // ── act table action buttons ──
  const renderActActions = (a: (typeof actStats)[0]) => {
    const status = a.status as VolunteerActivityStatus
    return (
      <div className="inline-flex items-center gap-1 justify-end whitespace-nowrap">
        <TextAction label="详情" color="#2563EB" onClick={() => setSelectedAct(a.id)} />
        {status === "draft" && (
          <>
            <TextAction label="编辑" color="#2563EB" onClick={() => openEditActivity(a)} />
            <TextAction label="发布" color="#059669" onClick={() => handlePublishAct(a.id)} />
            <TextAction label="删除" color="#DC2626" bg="#FEF2F2" onClick={() => setDeleteActTarget(a.id)} />
          </>
        )}
        {status === "published" || status === "in_progress" ? (
          <TextAction label="结束活动" color="#DC2626" bg="#FEF2F2" onClick={() => setEndActTarget(a.id)} />
        ) : null}
      </div>
    )
  }

  // ── render ──

  return (
    <PageLayout title="志愿服务管理" description="管理志愿者注册信息和志愿服务活动">
      {/* Tabs */}
      <div className="flex items-center gap-6 mb-5 border-b border-slate-200">
        {(["activities", "volunteers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setSelectedAct(null)
              setSelectedVol(null)
            }}
            className={`relative pb-2.5 text-[13px] font-medium transition-colors ${
              tab === t ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="flex items-center gap-2">
              {t === "volunteers" ? "志愿者审核" : "活动管理"}
              {t === "volunteers" && pendingVolCount > 0 && (
                <span className="px-1.5 h-4 min-w-[16px] rounded bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {pendingVolCount}
                </span>
              )}
            </span>
            {tab === t && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-slate-800"
              />
            )}
          </button>
        ))}
      </div>

      {/* ═══════ Tab: Volunteers ═══════ */}
      {tab === "volunteers" && !selectedVol && (
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
              {Object.keys(politicalStats).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
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
              <button
                onClick={() => {
                  setPoliticalFilter("")
                  setVolStatusFilter("")
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600"
              >
                清除
              </button>
            )}
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
                  <TableHead className="text-[11px] text-slate-400 font-medium text-right min-w-[120px]">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-300 text-[13px]">
                      暂无志愿者数据
                    </TableCell>
                  </TableRow>
                ) : (
                  volunteerPagination.paginatedItems.map((v) => {
                    const isPending = v.status === "pending"
                    return (
                      <TableRow
                        key={v.id}
                        className={`hover:bg-slate-50/60 transition-colors ${isPending ? "bg-amber-50/40" : ""}`}
                      >
                        <TableCell className="font-medium text-[13px] text-slate-700">{v.name}</TableCell>
                        <TableCell className="text-[12px] text-slate-500 font-mono">{v.phone}</TableCell>
                        <TableCell>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                            {v.politicalStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-[12px] text-slate-500">{v.workUnit}</TableCell>
                        <TableCell>
                          {v.credentialImages?.length ? (
                            <span className="text-[12px] text-slate-500">{v.credentialImages.length}张</span>
                          ) : (
                            <span className="text-[11px] text-slate-300">无</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={v.status} config={VOL_STATUS_CONFIG} />
                        </TableCell>
                        <TableCell className="text-[11px] text-slate-400">{v.createdAt}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <TextAction label="详情" color="#2563EB" onClick={() => setSelectedVol(v.id)} />
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

      {/* ═══════ Volunteer Detail ═══════ */}
      {tab === "volunteers" &&
        selectedVol &&
        (() => {
          const vol = volunteers.find((v) => v.id === selectedVol)
          if (!vol) return null
          const isPending = vol.status === "pending"
          const isRejected = vol.status === "rejected"
          return (
            <div className="space-y-4">
              {/* Breadcrumb */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setSelectedVol(null)}
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
                    onClick={() => handleApproveVol(vol.id)}
                    className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-medium transition-all active:scale-[0.98]"
                  >
                    审核通过
                  </button>
                  <button
                    onClick={() => {
                      setRejectVolTarget(vol.id)
                      setRejectVolReason("")
                    }}
                    className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-medium transition-all active:scale-[0.98]"
                  >
                    驳回
                  </button>
                </motion.div>
              )}
            </div>
          )
        })()}

      {/* ═══════ Tab: Activities ═══════ */}
      {tab === "activities" && (
        <div>
          {selectedAct && selectedActStats ? (
            /* ── Activity Detail ── */
            <div className="space-y-4">
              <button
                onClick={() => setSelectedAct(null)}
                className="text-[12px] text-slate-400 hover:text-[#2563EB] transition-colors"
              >
                &larr; 返回列表
              </button>
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
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {selectedActStats.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {selectedActStats.startTime} ~ {selectedActStats.endTime.slice(11)}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedActStats.description && (
                  <p className="text-[12px] text-slate-500 leading-relaxed bg-slate-50 rounded-lg px-3 py-2 mt-2">
                    {selectedActStats.description}
                  </p>
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
                    <div className="text-xl font-semibold" style={{ color: s.color }}>
                      {s.value}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Sign-up table (based on dailyRecords) */}
              <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <span className="text-[12px] font-medium text-slate-600">报名签到明细</span>
                  <button
                    onClick={() => exportSignUpXlsx(selectedAct)}
                    className="inline-flex items-center gap-1 px-3 h-7 rounded-md text-[11px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    导出 Excel
                  </button>
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
                      <TableHead className="text-[11px] text-slate-400 font-medium text-right min-w-[80px]">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signUps
                      .filter((s) => s.activityId === selectedAct)
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
                                    onClick={() => {
                                      setResolveCheckIn(dr.dayStartTime.slice(0, 16))
                                      setResolveCheckOut(dr.dayEndTime.slice(0, 16))
                                      setResolveTarget(dr.id)
                                      setResolveNote("")
                                    }}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      })
                      .flat()}
                    {signUps.filter((s) => s.activityId === selectedAct).length === 0 && (
                      <TableCell colSpan={9} className="text-center py-10 text-slate-300 text-[13px]">
                        暂无报名
                      </TableCell>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            /* ── Activity List ── */
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {selectedAct && (
                    <button
                      onClick={() => setSelectedAct(null)}
                      className="text-[12px] text-slate-400 hover:text-[#2563EB] transition-colors"
                    >
                      &larr; 返回列表
                    </button>
                  )}
                </div>
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
                  <option value="published">已发布</option>
                  <option value="in_progress">进行中</option>
                  <option value="ended">已结束</option>
                  <option value="cancelled">已取消</option>
                </select>
                {(actKeyword || actStatusFilter) && (
                  <button
                    onClick={() => {
                      setActKeyword("")
                      setActStatusFilter("")
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600"
                  >
                    清除
                  </button>
                )}
                <Button size="sm" className="h-8 text-xs rounded-lg ml-auto" onClick={() => setCreateOpen(true)}>
                  <Plus className="size-3.5 mr-1.5" />
                  创建活动
                </Button>
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
                      <TableHead className="text-[11px] text-slate-400 font-medium text-right min-w-[160px]">
                        操作
                      </TableHead>
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
                          <TableCell className="text-[11px] text-slate-500">
                            {(() => {
                              const sd = new Date(a.startTime),
                                ed = new Date(a.endTime)
                              const sameDay = sd.toDateString() === ed.toDateString()
                              const fmtDate = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
                              const fmtHM = (d: Date) =>
                                `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                              if (sameDay) return `${fmtDate(sd)} ${fmtHM(sd)}~${fmtHM(ed)}`
                              return `${fmtDate(sd)}~${fmtDate(ed)} 每天${a.dailyStartTime || fmtHM(sd)}-${a.dailyEndTime || fmtHM(ed)}`
                            })()}
                          </TableCell>
                          <TableCell className="text-[12px] text-slate-500">{a.location}</TableCell>
                          <TableCell>
                            <span className="text-[12px] font-medium text-slate-600">
                              {a.signUpCount}/{a.maxParticipants}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={a.status} config={ACT_STATUS_CONFIG} />
                          </TableCell>
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
      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v)
          if (!v) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px]">创建志愿活动</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[12px]">
                活动名称 <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="例如：古城环境清洁日"
                className="mt-1 rounded-lg"
              />
            </div>
            <div>
              <Label className="text-[12px]">
                活动描述 <span className="text-red-400">*</span>
              </Label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="描述活动内容..."
                rows={3}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669]/40 resize-y"
              />
            </div>
            <div>
              <Label className="text-[12px]">
                活动地点 <span className="text-red-400">*</span>
              </Label>
              <LocationMapField value={formLocation} onChange={setFormLocation} />
            </div>
            <div>
              <Label className="text-[12px]">
                活动日期 <span className="text-red-400">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="date"
                  value={formDateStart}
                  onChange={(e) => setFormDateStart(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
                />
                <input
                  type="date"
                  value={formDateEnd}
                  onChange={(e) => setFormDateEnd(e.target.value)}
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
                  value={formTimeStart}
                  onChange={(e) => setFormTimeStart(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
                />
                <input
                  type="time"
                  value={formTimeEnd}
                  onChange={(e) => setFormTimeEnd(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px]">
                  报名开始 <span className="text-slate-400">(可选)</span>
                </Label>
                <input
                  type="date"
                  value={formEnrollStart}
                  onChange={(e) => setFormEnrollStart(e.target.value)}
                  className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
                />
              </div>
              <div>
                <Label className="text-[12px]">
                  报名截止 <span className="text-red-400">*</span>
                </Label>
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <Label className="text-[12px]">
                人数上限 <span className="text-red-400">*</span>
              </Label>
              <Input
                type="number"
                value={formMax}
                onChange={(e) => setFormMax(e.target.value)}
                min={1}
                className="mt-1 rounded-lg w-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button size="sm" className="h-8 text-xs rounded-lg bg-[#059669] hover:bg-[#047857]" onClick={handleCreate}>
              创建并发布
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Activity */}
      <Dialog open={!!editActTarget} onOpenChange={(v) => !v && setEditActTarget(null)}>
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
                value={editFormTitle}
                onChange={(e) => setEditFormTitle(e.target.value)}
                className="mt-1 rounded-lg"
              />
            </div>
            <div>
              <Label className="text-[12px]">
                活动描述 <span className="text-red-400">*</span>
              </Label>
              <textarea
                value={editFormDesc}
                onChange={(e) => setEditFormDesc(e.target.value)}
                rows={3}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#059669]/20 resize-y"
              />
            </div>
            <div>
              <Label className="text-[12px]">
                活动地点 <span className="text-red-400">*</span>
              </Label>
              <LocationMapField value={editFormLocation} onChange={setEditFormLocation} />
            </div>
            <div>
              <Label className="text-[12px]">
                活动日期 <span className="text-red-400">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="date"
                  value={editFormDateStart}
                  onChange={(e) => setEditFormDateStart(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
                />
                <input
                  type="date"
                  value={editFormDateEnd}
                  onChange={(e) => setEditFormDateEnd(e.target.value)}
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
                  value={editFormTimeStart}
                  onChange={(e) => setEditFormTimeStart(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
                />
                <input
                  type="time"
                  value={editFormTimeEnd}
                  onChange={(e) => setEditFormTimeEnd(e.target.value)}
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
                  value={editFormEnrollStart}
                  onChange={(e) => setEditFormEnrollStart(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none"
                />
                <input
                  type="date"
                  value={editFormDeadline}
                  onChange={(e) => setEditFormDeadline(e.target.value)}
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
                value={editFormMax}
                onChange={(e) => setEditFormMax(e.target.value)}
                min={1}
                className="mt-1 rounded-lg w-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-lg"
              onClick={() => setEditActTarget(null)}
            >
              取消
            </Button>
            <Button size="sm" className="h-8 text-xs rounded-lg" onClick={handleEditSave}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Volunteer */}
      <Dialog open={!!rejectVolTarget} onOpenChange={(v) => !v && setRejectVolTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">驳回志愿者</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-[12px]">
              驳回原因 <span className="text-red-400">*</span>
            </Label>
            <textarea
              value={rejectVolReason}
              onChange={(e) => setRejectVolReason(e.target.value)}
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
              onClick={() => setRejectVolTarget(null)}
            >
              取消
            </Button>
            <Button size="sm" className="h-8 text-xs rounded-lg bg-red-500 hover:bg-red-600" onClick={handleRejectVol}>
              驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve / Manual record */}
      <Dialog open={!!resolveTarget} onOpenChange={(v) => !v && setResolveTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">补录服务记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {/* 根据异常类型显示不同上下文提示 */}
            {resolveTargetStatus === "no_show" ? (
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

            {/* 签到时间 */}
            <div>
              <Label className="text-[12px]">签到时间</Label>
              <Input
                type="datetime-local"
                value={resolveCheckIn}
                onChange={(e) => setResolveCheckIn(e.target.value)}
                className="mt-1 rounded-lg"
              />
            </div>

            {/* 签退时间 */}
            <div>
              <Label className="text-[12px]">签退时间</Label>
              <Input
                type="datetime-local"
                value={resolveCheckOut}
                onChange={(e) => setResolveCheckOut(e.target.value)}
                className="mt-1 rounded-lg"
              />
            </div>

            {/* 自动计算时长 */}
            {(() => {
              if (!resolveCheckIn || !resolveCheckOut) return null
              const ci = new Date(resolveCheckIn),
                co = new Date(resolveCheckOut)
              if (co <= ci) return null
              const hours = Math.round(((co.getTime() - ci.getTime()) / 3600000) * 10) / 10
              return (
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-[12px] flex items-center justify-between">
                  <span className="text-slate-500">服务时长</span>
                  <span className="font-semibold text-emerald-600">{hours}h</span>
                </div>
              )
            })()}

            <div>
              <Label className="text-[12px]">
                补录备注 <span className="text-red-400">*</span>
              </Label>
              <textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
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
              onClick={() => setResolveTarget(null)}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8]"
              onClick={handleResolve}
            >
              确认补录
            </Button>
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

      {/* End Activity Dialog */}
      <Dialog open={!!endActTarget} onOpenChange={(v) => !v && setEndActTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              {(() => {
                const act = endActTarget ? activities.find((a) => a.id === endActTarget) : null
                return act?.status === "in_progress" ? "结束活动" : "取消活动"
              })()}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            {(() => {
              const act = endActTarget ? activities.find((a) => a.id === endActTarget) : null
              if (!act) return null
              const suCount = signUps.filter((s) => s.activityId === act.id).length
              if (act.status === "in_progress") {
                const pending = dailyRecords.filter((d) => d.activityId === act.id && d.status === "pending")
                const checkedIn = dailyRecords.filter((d) => d.activityId === act.id && d.status === "checked_in")
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
              return (
                <>
                  <p className="text-[13px] text-slate-600 leading-relaxed">取消后活动状态变为已取消，无法继续报名。</p>
                  {suCount > 0 && (
                    <p className="text-[12px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                      {suCount} 人已报名，取消后报名记录保留。
                    </p>
                  )}
                </>
              )
            })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-lg"
              onClick={() => setEndActTarget(null)}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs rounded-lg bg-red-500 hover:bg-red-600"
              onClick={handleEndActivity}
            >
              确认结束
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
