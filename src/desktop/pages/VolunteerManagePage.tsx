import { useState, useMemo } from "react"
import { useVolunteerStore } from "../../shared/stores/volunteer-store"
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
  Search, Plus, MapPin, Clock, Users, Pencil, Trash2,
  Heart, BadgeCheck, Calendar, Activity, UserCheck, ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "motion/react"

const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  signed_up: { label: "已报名", bg: "#DBEAFE", fg: "#2563EB" },
  checked_in: { label: "已签到", bg: "#D1FAE5", fg: "#059669" },
  checked_out: { label: "已签退", bg: "#F1F5F9", fg: "#64748B" },
}

const ACT_STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  ended: { label: "已结束", bg: "#F1F5F9", fg: "#64748B" },
  published: { label: "进行中", bg: "#D1FAE5", fg: "#059669" },
  draft: { label: "草稿", bg: "#FEF3C7", fg: "#D97706" },
}

export function VolunteerManagePage() {
  const volunteers = useVolunteerStore((s) => s.volunteers)
  const activities = useVolunteerStore((s) => s.activities)
  const signUps = useVolunteerStore((s) => s.signUps)
  const addActivity = useVolunteerStore((s) => s.addActivity)
  const endActivity = useVolunteerStore((s) => s.endActivity)
  const editActivity = useVolunteerStore((s) => s.editActivity)
  const deleteActivity = useVolunteerStore((s) => s.deleteActivity)
  const searchVolunteers = useVolunteerStore((s) => s.searchVolunteers)

  const [tab, setTab] = useState<"volunteers" | "activities">("volunteers")
  const [keyword, setKeyword] = useState("")
  const [politicalFilter, setPoliticalFilter] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedAct, setSelectedAct] = useState<string | null>(null)
  const [editActTarget, setEditActTarget] = useState<string | null>(null)
  const [deleteActTarget, setDeleteActTarget] = useState<string | null>(null)
  const [editFormTitle, setEditFormTitle] = useState("")
  const [editFormDesc, setEditFormDesc] = useState("")
  const [editFormLocation, setEditFormLocation] = useState("")
  const [editFormStart, setEditFormStart] = useState("")
  const [editFormEnd, setEditFormEnd] = useState("")
  const [editFormDeadline, setEditFormDeadline] = useState("")
  const [editFormMax, setEditFormMax] = useState("20")

  const [actKeyword, setActKeyword] = useState("")
  const [actStatusFilter, setActStatusFilter] = useState("")

  const [formTitle, setFormTitle] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formLocation, setFormLocation] = useState("")
  const [formStart, setFormStart] = useState("")
  const [formEnd, setFormEnd] = useState("")
  const [formDeadline, setFormDeadline] = useState("")
  const [formMax, setFormMax] = useState("20")

  const filteredVolunteers = useMemo(() => {
    let list = keyword ? searchVolunteers(keyword) : volunteers
    if (politicalFilter) list = list.filter((v) => v.politicalStatus === politicalFilter)
    return list
  }, [volunteers, keyword, politicalFilter, searchVolunteers])

  const volunteerPagination = usePagination(filteredVolunteers, 10)

  const politicalStats = useMemo(() => {
    const m: Record<string, number> = {}
    volunteers.forEach((v) => { m[v.politicalStatus] = (m[v.politicalStatus] || 0) + 1 })
    return m
  }, [volunteers])

  const actStats = useMemo(() => {
    const stats = activities.map((a) => {
      const su = signUps.filter((s) => s.activityId === a.id)
      const checkedIn = su.filter((s) => s.status === "checked_in" || s.status === "checked_out")
      const totalHours = su.reduce((acc, s) => acc + (s.serviceHours || 0), 0)
      return { ...a, signUpCount: su.length, checkedInCount: checkedIn.length, totalHours }
    })
    return stats.filter((a) => {
      const kw = actKeyword.trim().toLowerCase()
      const kwHit = !kw || a.title.toLowerCase().includes(kw) || a.location.toLowerCase().includes(kw) || (a.description || "").toLowerCase().includes(kw)
      const statusHit = !actStatusFilter || a.status === actStatusFilter
      return kwHit && statusHit
    })
  }, [activities, signUps, actKeyword, actStatusFilter])

  const activityPagination = usePagination(actStats, 10)

  const handleCreate = () => {
    if (!formTitle.trim() || !formDesc.trim() || !formLocation.trim() || !formStart || !formEnd || !formDeadline) {
      toast.error("请填写完整信息"); return
    }
    addActivity({
      title: formTitle.trim(), description: formDesc.trim(), images: [],
      location: formLocation.trim(), startTime: formStart, endTime: formEnd,
      signUpDeadline: formDeadline, maxParticipants: parseInt(formMax) || 20,
    })
    toast.success("活动创建成功")
    setCreateOpen(false)
    setFormTitle(""); setFormDesc(""); setFormLocation(""); setFormStart(""); setFormEnd(""); setFormDeadline(""); setFormMax("20")
  }

  const handleEnd = (id: string) => { endActivity(id); toast.success("活动已结束") }

  const openEditActivity = (act: typeof actStats[0]) => {
    setEditActTarget(act.id)
    setEditFormTitle(act.title); setEditFormDesc(act.description || ""); setEditFormLocation(act.location)
    setEditFormStart(act.startTime); setEditFormEnd(act.endTime); setEditFormDeadline(act.signUpDeadline)
    setEditFormMax(String(act.maxParticipants))
  }

  const handleEditSave = () => {
    if (!editActTarget) return
    if (!editFormTitle.trim() || !editFormLocation.trim()) { toast.error("请填写完整信息"); return }
    editActivity(editActTarget, {
      title: editFormTitle.trim(), description: editFormDesc.trim(), location: editFormLocation.trim(),
      startTime: editFormStart, endTime: editFormEnd, signUpDeadline: editFormDeadline,
      maxParticipants: parseInt(editFormMax) || 20,
    })
    toast.success("活动已更新"); setEditActTarget(null)
  }

  const handleDeleteActivity = () => {
    if (!deleteActTarget) return
    deleteActivity(deleteActTarget); toast.success("活动已删除"); setDeleteActTarget(null)
  }

  const selectedActStats = useMemo(() => {
    if (!selectedAct) return null
    return actStats.find((a) => a.id === selectedAct) || null
  }, [selectedAct, actStats])

  const overviewStats = useMemo(() => [
    { label: "志愿者总数", value: volunteers.length, icon: Users, color: "#2563EB", bg: "#EFF6FF" },
    { label: "活动总数", value: activities.length, icon: Activity, color: "#059669", bg: "#ECFDF5" },
    { label: "总报名人次", value: signUps.length, icon: UserCheck, color: "#7C3AED", bg: "#F5F3FF" },
    { label: "总服务时长", value: `${signUps.reduce((a, s) => a + (s.serviceHours || 0), 0)}h`, icon: Clock, color: "#D97706", bg: "#FFFBEB" },
  ], [volunteers, activities, signUps])

  return (
    <PageLayout title="志愿服务管理" description="管理志愿者注册信息和志愿服务活动">

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {overviewStats.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
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
      <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1">
        {(["volunteers", "activities"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedAct(null) }}
            className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all ${
              tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "volunteers" ? "志愿者管理" : "活动管理"}
          </button>
        ))}
      </div>

      {/* Tab: Volunteers */}
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
            {politicalFilter && (
              <button onClick={() => setPoliticalFilter("")} className="text-[11px] text-slate-400 hover:text-slate-600">清除</button>
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
                  <TableHead className="text-[11px] text-slate-400 font-medium">注册时间</TableHead>
                  <TableHead className="text-[11px] text-slate-400 font-medium">参与次数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-300 text-[13px]">暂无志愿者数据</TableCell>
                  </TableRow>
                ) : (
                  volunteerPagination.paginatedItems.map((v) => {
                    const count = signUps.filter((s) => s.volunteerId === v.id).length
                    return (
                      <TableRow key={v.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="font-medium text-[13px] text-slate-700">{v.name}</TableCell>
                        <TableCell className="text-[12px] text-slate-500 font-mono">{v.phone}</TableCell>
                        <TableCell>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">{v.politicalStatus}</span>
                        </TableCell>
                        <TableCell className="text-[12px] text-slate-500">{v.workUnit}</TableCell>
                        <TableCell className="text-[11px] text-slate-400">{v.createdAt}</TableCell>
                        <TableCell>
                          <span className="text-[12px] font-medium text-slate-600">{count} 次</span>
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

      {/* Tab: Activities */}
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
            /* Activity Detail */
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

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "报名人次", value: selectedActStats.signUpCount, color: "#2563EB" },
                  { label: "签到人次", value: selectedActStats.checkedInCount, color: "#059669" },
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

              <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] text-slate-400 font-medium">志愿者</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">电话</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">状态</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">签到时间</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">签退时间</TableHead>
                      <TableHead className="text-[11px] text-slate-400 font-medium">服务时长</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signUps.filter((s) => s.activityId === selectedAct).map((su) => {
                      const v = volunteers.find((x) => x.id === su.volunteerId)
                      const cfg = STATUS_CONFIG[su.status] || { label: su.status, bg: "#F1F5F9", fg: "#64748B" }
                      return (
                        <TableRow key={su.id} className="hover:bg-slate-50/60">
                          <TableCell className="text-[13px] font-medium text-slate-700">{v?.name || su.volunteerId}</TableCell>
                          <TableCell className="text-[12px] text-slate-500 font-mono">{v?.phone || "-"}</TableCell>
                          <TableCell>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.fg }}>{cfg.label}</span>
                          </TableCell>
                          <TableCell className="text-[11px] text-slate-400">{su.checkInTime || "-"}</TableCell>
                          <TableCell className="text-[11px] text-slate-400">{su.checkOutTime || "-"}</TableCell>
                          <TableCell className="text-[12px] text-slate-600 font-medium">{su.serviceHours ? `${su.serviceHours}h` : "-"}</TableCell>
                        </TableRow>
                      )
                    })}
                    {signUps.filter((s) => s.activityId === selectedAct).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-slate-300 text-[13px]">暂无报名</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            /* Activity List */
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
                  <option value="published">进行中</option>
                  <option value="ended">已结束</option>
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
                      <TableHead className="text-[11px] text-slate-400 font-medium text-right">操作</TableHead>
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
                      activityPagination.paginatedItems.map((a) => {
                        const cfg = ACT_STATUS_CONFIG[a.status] || ACT_STATUS_CONFIG.draft
                        return (
                          <TableRow key={a.id} className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="font-medium text-[13px] text-slate-700">{a.title}</TableCell>
                            <TableCell className="text-[11px] text-slate-500">{a.startTime}</TableCell>
                            <TableCell className="text-[12px] text-slate-500">{a.location}</TableCell>
                            <TableCell>
                              <span className="text-[12px] font-medium text-slate-600">{a.signUpCount}/{a.maxParticipants}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.fg }}>{cfg.label}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center gap-1">
                                <button onClick={() => setSelectedAct(a.id)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition">
                                  <ChevronRight size={14} />
                                </button>
                                <button onClick={() => openEditActivity(a)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition">
                                  <Pencil size={13} />
                                </button>
                                {a.status === "published" && (
                                  <button onClick={() => handleEnd(a.id)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition">
                                    <Clock size={13} />
                                  </button>
                                )}
                                <button onClick={() => setDeleteActTarget(a.id)} className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) { setFormTitle(""); setFormDesc(""); setFormLocation(""); setFormStart(""); setFormEnd(""); setFormDeadline(""); setFormMax("20") }}}>
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
              <div><Label className="text-[12px]">报名截止</Label><input type="datetime-local" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none" /></div>
              <div><Label className="text-[12px]">人数上限</Label><Input type="number" value={formMax} onChange={(e) => setFormMax(e.target.value)} min={1} className="mt-1 rounded-lg" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button size="sm" className="h-8 text-xs rounded-lg bg-[#059669] hover:bg-[#047857]" onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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
              <div><Label className="text-[12px]">报名截止</Label><input type="datetime-local" value={editFormDeadline} onChange={(e) => setEditFormDeadline(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] focus:outline-none" /></div>
              <div><Label className="text-[12px]">人数上限</Label><Input type="number" value={editFormMax} onChange={(e) => setEditFormMax(e.target.value)} min={1} className="mt-1 rounded-lg" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setEditActTarget(null)}>取消</Button>
            <Button size="sm" className="h-8 text-xs rounded-lg" onClick={handleEditSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
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
