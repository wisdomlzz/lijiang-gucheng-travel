import { useEffect, useState, useRef } from "react"
import { Heart, Phone, User, Building2, Upload, X, AlertCircle, RefreshCw, CheckCircle2, Zap } from "lucide-react"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { useVolunteerStore } from "../../store"
import { useAuthStore } from "@/platform/auth"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"

const POLITICAL_OPTIONS = ["中共党员", "共青团员", "群众", "其他"]
const MAX_CREDENTIAL_IMAGES = 5

// ── Credential Image Upload ──

function CredentialUpload({ images, onAdd, onRemove }: {
  images: string[]
  onAdd: (urls: string[]) => void
  onRemove: (idx: number) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const remain = Math.max(0, MAX_CREDENTIAL_IMAGES - images.length)
    if (!remain) return
    const newUrls: string[] = []
    for (let i = 0; i < Math.min(files.length, remain); i++) {
      newUrls.push(URL.createObjectURL(files[i]))
    }
    if (newUrls.length) {
      onAdd(newUrls)
      toast.success(`已添加 ${newUrls.length} 张图片`)
    }
    e.target.value = ""
  }

  const isFull = images.length >= MAX_CREDENTIAL_IMAGES

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

      {/* Upload zone (hidden when full) */}
      {!isFull && (
        <motion.div layout className="relative mb-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 px-4 py-6 cursor-pointer hover:border-amber-300 hover:bg-amber-50/60 transition-all group"
          >
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <Upload size={20} className="text-amber-600" />
              </div>
              <p className="text-[13px] font-medium text-amber-700">上传资质图片</p>
              <p className="text-[11px] text-amber-400">
                最多 {MAX_CREDENTIAL_IMAGES} 张
                <span className="mx-1.5 text-amber-300">·</span>
                <span className="text-amber-500">已选 {images.length}/{MAX_CREDENTIAL_IMAGES}</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <AnimatePresence mode="popLayout">
            {images.map((url, i) => (
              <motion.div
                key={`${url}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 group"
              >
                <img src={url} alt={`资质${i + 1}`}
                  className="size-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <button onClick={() => onRemove(i)}
                  className="absolute top-1 right-1 size-6 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500">
                  <X size={12} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/50 to-transparent">
                  <span className="text-[10px] text-white/80 font-medium">{i + 1}/{images.length}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add more button (only if not full) */}
          {!isFull && (
            <motion.button
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-300 hover:border-amber-300 hover:bg-amber-50/30 transition-all"
            >
              <Upload size={18} />
              <span className="text-[10px]">添加</span>
            </motion.button>
          )}
        </div>
      )}

      {isFull && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 mb-3">
          <CheckCircle2 size={13} />
          已上传 {MAX_CREDENTIAL_IMAGES} 张，已达上限
        </div>
      )}
    </div>
  )
}

// ── Page ──

export function VolunteerPlaceholderPage() {
  const navigate = useNavigate()
  const volunteers = useVolunteerStore((s) => s.volunteers)   // subscribe to data changes
  const register = useVolunteerStore((s) => s.register)
  const getByUserId = useVolunteerStore((s) => s.getByUserId)
  const resubmitVolunteer = useVolunteerStore((s) => s.resubmitVolunteer)
  const approveVolunteer = useVolunteerStore((s) => s.demoApprove)
  const user = useAuthStore((s) => s.user)

  const userId = user?.id ?? ""
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [politicalStatus, setPoliticalStatus] = useState("")
  const [workUnit, setWorkUnit] = useState("")
  const [credentialImages, setCredentialImages] = useState<string[]>([])

  const existing = userId ? getByUserId(userId) : undefined

  useEffect(() => {
    if (existing?.status === "approved") navigate("/c/volunteer/activities", { replace: true })
  }, [existing, navigate])

  const handleSubmit = () => {
    if (!userId) { toast.error("请先登录"); return }
    // 校验所有必填字段
    if (!name.trim()) { toast.error("请填写姓名"); return }
    if (!phone.trim()) { toast.error("请填写电话"); return }
    if (!/^1\d{10}$/.test(phone.trim())) { toast.error("请填写正确的11位手机号"); return }
    if (!politicalStatus) { toast.error("请选择政治面貌"); return }
    if (!workUnit.trim()) { toast.error("请填写工作单位"); return }
    if (credentialImages.length === 0) { toast.error("请上传资质图片"); return }
    const res = register(userId, name.trim(), phone.trim(), politicalStatus, workUnit.trim(), credentialImages)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
  }

  const handleResubmit = () => {
    if (credentialImages.length === 0) { toast.error("请上传资质图片"); return }
    if (!existing) return
    const res = resubmitVolunteer(existing.id, credentialImages)
    if (res.ok) toast.success(res.msg); else toast.error(res.msg)
  }

  // ── Waiting / rejected state ──
  if (existing && existing.status !== "approved") {
    const isPending = existing.status === "pending"
    return (
      <div className="min-h-screen bg-surface-page pb-6">
        <PageHeader title="志愿者认证" back="/c/home" />
        <div className="px-4 py-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-white p-6 shadow-[0_8px_28px_rgba(139,111,92,0.08)] overflow-hidden relative">

            {/* Decorative top accent */}
            <div className="absolute -top-10 -right-10 size-32 rounded-full bg-gradient-to-br from-amber-500/6 to-transparent" />

            {isPending ? (
              <div className="text-center">
                <div className="size-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                  <div className="size-3 rounded-full bg-amber-400 animate-pulse" />
                  <div className="size-3 rounded-full bg-amber-400 animate-pulse ml-1.5" style={{ animationDelay: "0.2s" }} />
                  <div className="size-3 rounded-full bg-amber-400 animate-pulse ml-1.5" style={{ animationDelay: "0.4s" }} />
                </div>
                <h2 className="text-[18px] font-semibold text-slate-800">审核中</h2>
                <p className="text-[13px] text-slate-400 mt-1 leading-relaxed max-w-[240px] mx-auto">
                  您的认证信息已提交，预计 1-2 个工作日完成审核
                </p>
                <div className="mt-5 bg-amber-50/60 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-amber-500">姓名</span>
                    <span className="font-medium text-amber-700">{existing.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-amber-500">电话</span>
                    <span className="font-medium text-amber-700">{existing.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-amber-500">资质图</span>
                    <span className="font-medium text-amber-700">{existing.credentialImages?.length ?? 0} 张</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-amber-500">提交时间</span>
                    <span className="font-medium text-amber-700">{existing.createdAt}</span>
                  </div>
                </div>

                {/* Demo shortcut: instantly approve for demo flow */}
                <button
                  onClick={() => {
                    const res = approveVolunteer(existing.id)
                    if (res.ok) toast.success(res.msg)
                  }}
                  className="mt-5 w-full h-10 rounded-2xl border border-dashed border-sky-300 bg-sky-50/50 text-sky-600 text-[12px] font-medium flex items-center justify-center gap-1.5 hover:bg-sky-100/60 active:scale-[0.98] transition-all"
                >
                  <Zap size={13} />
                  演示：立即通过
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-5">
                  <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={28} className="text-red-400" />
                  </div>
                  <h2 className="text-[18px] font-semibold text-slate-800">认证未通过</h2>
                  {existing.reviewNote && (
                    <div className="mt-3 bg-red-50/60 rounded-xl px-4 py-3">
                      <p className="text-[12px] text-red-600 leading-relaxed">{existing.reviewNote}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[13px] font-medium text-slate-700 mb-2 block">重新上传资质图片</label>
                  <CredentialUpload images={credentialImages} onAdd={(urls) => setCredentialImages((prev) => [...prev, ...urls])} onRemove={(i) => setCredentialImages((prev) => prev.filter((_, j) => j !== i))} />
                  <button onClick={handleResubmit} disabled={credentialImages.length === 0}
                    className="w-full h-11 rounded-2xl bg-primary text-white text-[14px] font-medium mt-4 flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform">
                    <RefreshCw size={15} /> 重新提交审核
                  </button>
                  <button
                    onClick={() => {
                      const res = approveVolunteer(existing.id)
                      if (res.ok) toast.success(res.msg)
                    }}
                    className="w-full h-9 rounded-2xl border border-dashed border-sky-300 bg-sky-50/50 text-sky-600 text-[12px] font-medium flex items-center justify-center gap-1.5 mt-2 hover:bg-sky-100/60 active:scale-[0.98] transition-all"
                  >
                    <Zap size={13} />
                    演示：立即通过
                  </button>
                </div>
              </div>
            )}

            <button onClick={() => navigate("/c/home")} className="mt-4 text-[12px] text-slate-300 hover:text-slate-500 transition-colors w-full text-center">
              返回首页
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Registration form ──
  return (
    <div className="min-h-screen bg-surface-page pb-6">
      <PageHeader title="志愿者认证" back="/c/home" />

      <div className="px-4 py-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(139,111,92,0.08)] overflow-hidden relative">

          {/* Decorative grain */}
          <div className="absolute -top-10 -right-10 size-36 rounded-full bg-gradient-to-br from-amber-500/5 to-transparent" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-200">
              <Heart size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-slate-800">志愿者认证</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">完成认证后可报名参与古城志愿服务活动</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">姓名</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入姓名"
                  className="w-full h-11 pl-10 pr-3 rounded-2xl border border-slate-200 bg-[#FAFAF8] text-[14px] outline-none focus:border-amber-300 focus:bg-white transition-colors placeholder:text-slate-300" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">电话</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" maxLength={11}
                  className="w-full h-11 pl-10 pr-3 rounded-2xl border border-slate-200 bg-[#FAFAF8] text-[14px] outline-none focus:border-amber-300 focus:bg-white transition-colors placeholder:text-slate-300" />
              </div>
            </div>

            {/* Political status */}
            <div>
              <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">政治面貌</label>
              <div className="flex gap-2 flex-wrap">
                {POLITICAL_OPTIONS.map((opt) => (
                  <button key={opt} onClick={() => setPoliticalStatus(opt)}
                    className={`px-4 py-2 rounded-xl text-[13px] border transition-all ${
                      politicalStatus === opt
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200"
                        : "bg-white text-slate-600 border-slate-200 hover:border-amber-200 hover:bg-amber-50/30"
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Work unit */}
            <div>
              <label className="text-[12px] font-medium text-slate-600 mb-1.5 block">工作单位</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input value={workUnit} onChange={(e) => setWorkUnit(e.target.value)} placeholder="请输入工作单位"
                  className="w-full h-11 pl-10 pr-3 rounded-2xl border border-slate-200 bg-[#FAFAF8] text-[14px] outline-none focus:border-amber-300 focus:bg-white transition-colors placeholder:text-slate-300" />
              </div>
            </div>

            {/* Credential images */}
            <div>
              <label className="text-[12px] font-medium text-slate-600 mb-2 block">资质图片</label>
              <CredentialUpload images={credentialImages} onAdd={(urls) => setCredentialImages((prev) => [...prev, ...urls])} onRemove={(i) => setCredentialImages((prev) => prev.filter((_, j) => j !== i))} />
            </div>

            {/* Submit */}
            <button onClick={handleSubmit}
              className="w-full h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white text-[15px] font-medium shadow-lg shadow-amber-200/50 active:scale-[0.98] transition-transform mt-1">
              提交认证
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
