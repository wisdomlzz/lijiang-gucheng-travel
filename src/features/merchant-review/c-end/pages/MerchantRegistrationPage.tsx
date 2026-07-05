import { useState, useMemo } from "react"
import { useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { useAuthStore } from "@/platform/auth"
import { useMerchantRegistrationStore } from "../../store/registration-store"
import { useContentMerchantStore } from "../../../content/store/merchant-store"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { Search, Store, User, Phone, MapPin, Clock, AlignLeft, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import type { Merchant } from "../../../../shared/types/content-types"

const CATEGORIES = [
  { key: "food", label: "餐饮" },
  { key: "hotel", label: "住宿" },
  { key: "bar", label: "酒吧" },
  { key: "shopping", label: "购物" },
]

type PagePhase = "list" | "claim" | "new-shop" | "success"

export function MerchantRegistrationPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const submitClaim = useMerchantRegistrationStore((s) => s.submitClaim)
  const submitRegistration = useMerchantRegistrationStore((s) => s.submitRegistration)
  const storeMerchants = useContentMerchantStore((s) => s.merchants)

  const [phase, setPhase] = useState<PagePhase>("list")
  const [query, setQuery] = useState("")
  const [selectedShop, setSelectedShop] = useState<Merchant | null>(null)

  // Claim form state
  const [claimForm, setClaimForm] = useState({
    contactName: user?.name ?? "",
    contactPhone: user?.phone ?? "",
  })
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({})

  // New shop form state
  const [form, setForm] = useState({
    shopName: "",
    contactName: user?.name ?? "",
    contactPhone: user?.phone ?? "",
    category: "",
    address: "",
    phone: "",
    hours: "09:00-22:00",
    description: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Unclaimed merchants only
  const unclaimedMerchants = useMemo(
    () => storeMerchants.filter((m) => m.claimStatus !== "claimed"),
    [storeMerchants],
  )

  // Search filtering
  const displayedMerchants = useMemo(() => {
    if (!query.trim()) return unclaimedMerchants
    const q = query.toLowerCase()
    return unclaimedMerchants.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.address && m.address.toLowerCase().includes(q)),
    )
  }, [query, unclaimedMerchants])

  const validateClaim = () => {
    const errs: Record<string, string> = {}
    if (!claimForm.contactName.trim()) errs.contactName = "请输入联系人"
    if (!claimForm.contactPhone.trim()) errs.contactPhone = "请输入联系电话"
    else if (!/^1[3-9]\d{9}$/.test(claimForm.contactPhone)) errs.contactPhone = "手机号格式不正确"
    return errs
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.shopName.trim()) errs.shopName = "请输入店铺名称"
    if (!form.contactName.trim()) errs.contactName = "请输入联系人"
    if (!form.contactPhone.trim()) errs.contactPhone = "请输入联系电话"
    else if (!/^1[3-9]\d{9}$/.test(form.contactPhone)) errs.contactPhone = "手机号格式不正确"
    if (!form.category) errs.category = "请选择经营类型"
    if (!form.address.trim()) errs.address = "请填写店铺地址"
    if (!form.phone.trim()) errs.phone = "请填写店铺联系电话"
    if (!form.description.trim()) errs.description = "请填写店铺简介"
    return errs
  }

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateClaim()
    if (Object.keys(errs).length > 0) {
      setClaimErrors(errs)
      return
    }
    if (!selectedShop) return

    submitClaim({
      userId: user?.id ?? `u_c_${Date.now()}`,
      userName: claimForm.contactName,
      userPhone: claimForm.contactPhone,
      claimedShopId: selectedShop.id,
      claimedShopName: selectedShop.name,
    })

    setPhase("success")
    toast.success("认领申请已提交，等待平台审核")
  }

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    submitRegistration({
      userId: user?.id ?? `u_c_${Date.now()}`,
      userName: form.contactName,
      userPhone: form.contactPhone,
      newShopName: form.shopName,
      newCategory: form.category,
      newAddress: form.address,
      newPhone: form.phone,
      newDescription: form.description,
      newHours: form.hours,
    })

    setPhase("success")
    toast.success("入驻申请已提交，等待平台审核")
  }

  const handleStartClaim = (merchant: Merchant) => {
    setSelectedShop(merchant)
    setClaimForm({
      contactName: user?.name ?? "",
      contactPhone: user?.phone ?? "",
    })
    setClaimErrors({})
    setPhase("claim")
  }

  const handleStartNewShop = () => {
    setForm({
      shopName: "",
      contactName: user?.name ?? "",
      contactPhone: user?.phone ?? "",
      category: "",
      address: "",
      phone: "",
      hours: "09:00-22:00",
      description: "",
    })
    setErrors({})
    setPhase("new-shop")
  }

  // ================================================================
  // SUCCESS SCREEN
  // ================================================================
  if (phase === "success") {
    return (
      <div className="min-h-full bg-surface-page flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-[18px] font-semibold text-text-heading mb-2">申请已提交</h2>
        <p className="text-[13px] text-text-secondary text-center mb-6">
          平台将在 1-3 个工作日内完成审核<br />
          审核通过后您将获得商户身份，可管理店铺信息
        </p>
        <button
          onClick={() => navigate("/c/merchant-services")}
          className="h-11 px-10 rounded-full bg-primary text-white text-[14px] font-medium"
        >
          返回商户服务
        </button>
      </div>
    )
  }

  // ================================================================
  // CLAIM FORM
  // ================================================================
  if (phase === "claim" && selectedShop) {
    return (
      <div className="min-h-full bg-surface-page pb-8">
        <PageHeader title="认领店铺" back={() => { setPhase("list"); setSelectedShop(null) }} />

        <div className="px-4 mt-3">
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
            <p className="text-[13px] text-text-secondary mb-5">
              确认这是您的店铺，填写信息完成认领。
            </p>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Store size={14} className="text-primary" /> 店铺名称
                </label>
                <input value={selectedShop.name} readOnly className="w-full h-11 px-4 rounded-xl border border-border-light text-[13px] bg-gray-50 text-text-muted outline-none" />
              </div>

              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5"><User size={14} className="text-primary" /> 联系人</label>
                <input value={claimForm.contactName} onChange={(e) => setClaimForm({ ...claimForm, contactName: e.target.value })} placeholder="您的姓名" className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${claimErrors.contactName ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20"}`} />
                {claimErrors.contactName && <p className="text-[11px] text-red-500 mt-1">{claimErrors.contactName}</p>}
              </div>

              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5"><Phone size={14} className="text-primary" /> 联系电话</label>
                <input value={claimForm.contactPhone} onChange={(e) => setClaimForm({ ...claimForm, contactPhone: e.target.value })} placeholder="手机号" className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${claimErrors.contactPhone ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20"}`} />
                {claimErrors.contactPhone && <p className="text-[11px] text-red-500 mt-1">{claimErrors.contactPhone}</p>}
              </div>

              <button type="submit" className="w-full h-12 rounded-full bg-primary text-white text-[14px] font-medium">提交认领申请</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ================================================================
  // NEW SHOP FORM
  // ================================================================
  if (phase === "new-shop") {
    return (
      <div className="min-h-full bg-surface-page pb-8">
        <PageHeader title="新建店铺入驻" back={() => setPhase("list")} />

        <div className="px-4 mt-3">
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
            <p className="text-[13px] text-text-secondary mb-5">
              填写以下信息申请成为古城商户，审核通过后即可管理您的店铺。
            </p>

            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5"><Store size={14} className="text-primary" /> 店铺名称</label>
                <input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} placeholder="请输入您的店铺名称" className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.shopName ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20"}`} />
                {errors.shopName && <p className="text-[11px] text-red-500 mt-1">{errors.shopName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5"><User size={14} className="text-primary" /> 联系人</label>
                  <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="您的姓名" className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.contactName ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`} />
                  {errors.contactName && <p className="text-[11px] text-red-500 mt-1">{errors.contactName}</p>}
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5"><Phone size={14} className="text-primary" /> 联系电话</label>
                  <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="手机号" className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.contactPhone ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`} />
                  {errors.contactPhone && <p className="text-[11px] text-red-500 mt-1">{errors.contactPhone}</p>}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5"><Store size={14} className="text-primary" /> 经营类型</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button key={cat.key} type="button" onClick={() => { setForm({ ...form, category: cat.key }); setErrors({ ...errors, category: "" }) }} className={`px-4 h-9 rounded-full text-[12px] transition-all ${form.category === cat.key ? "bg-primary text-white" : "bg-surface-page text-text-secondary"}`}>{cat.label}</button>
                  ))}
                </div>
                {errors.category && <p className="text-[11px] text-red-500 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5"><MapPin size={14} className="text-primary" /> 店铺地址</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="丽江古城内详细地址" className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.address ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`} />
                {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5"><Phone size={14} className="text-primary" /> 店铺电话</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="游客咨询电话" className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.phone ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`} />
                {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5"><Clock size={14} className="text-primary" /> 营业时间</label>
                <input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="如 09:00-22:00" className="w-full h-11 px-4 rounded-xl border border-border-light text-[13px] outline-none focus:border-primary" />
              </div>

              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5"><AlignLeft size={14} className="text-primary" /> 店铺简介</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="简要描述您的店铺特色和服务" rows={3} className={`w-full px-4 py-3 rounded-xl border text-[13px] outline-none resize-none ${errors.description ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`} />
                {errors.description && <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>}
              </div>

              <button type="submit" className="w-full h-12 rounded-full bg-primary text-white text-[14px] font-medium">提交入驻申请</button>
            </form>

            <p className="text-center text-[11px] text-text-tertiary mt-4">提交后需平台管理员审核，审核通过后即可管理您的店铺信息</p>
          </div>
        </div>
      </div>
    )
  }

  // ================================================================
  // LIST PHASE — like 购在古城, only unclaimed merchants
  // ================================================================
  return (
    <div className="min-h-full bg-surface-page pb-8">
      <PageHeader title="认领或入驻店铺" back="/c/merchant-services" />

      <div className="px-4 pt-3">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索店铺名称或地址"
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-light text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Unclaimed shop list */}
        <p className="text-[11px] text-text-tertiary mb-3">可认领的店铺（{displayedMerchants.length} 家）</p>

        {displayedMerchants.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <Store size={36} className="text-text-tertiary mb-3" />
            <p className="text-[13px] text-text-tertiary">暂无未认领的店铺</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedMerchants.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(60,120,200,0.10)]">
                <div className="relative h-28">
                  <ImageWithFallback src={m.cover} alt={m.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <span className="text-white text-[15px] drop-shadow">{m.name}</span>
                  </div>
                </div>
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-text-tertiary min-w-0">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={10} className="flex-shrink-0" />
                      {m.address}
                    </span>
                    <span className="flex-shrink-0">{m.phone}</span>
                  </div>
                  <button
                    onClick={() => handleStartClaim(m)}
                    className="ml-2 h-8 px-4 rounded-full bg-primary text-white text-[12px] font-medium flex-shrink-0"
                  >
                    认领
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New shop entry */}
        <div className="mt-6 pb-4 text-center">
          <span className="text-[13px] text-text-secondary">没找到您的店？</span>
          <button onClick={handleStartNewShop} className="text-[13px] text-primary font-medium underline ml-1">
            点此提交新店铺信息
          </button>
        </div>
      </div>
    </div>
  )
}