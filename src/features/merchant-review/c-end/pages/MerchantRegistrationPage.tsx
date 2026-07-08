import { useState, useMemo, useRef } from "react"
import { useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { useAuthStore } from "@/platform/auth"
import { useMerchantRegistrationStore } from "../../store/registration-store"
import { useContentMerchantStore } from "../../../../platform/content/merchant-store"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { Search, Store, User, Phone, MapPin, Clock, AlignLeft, CheckCircle, Shield, Camera } from "lucide-react"
import { PHONE_REGEX, readFileAsDataURL } from "@/shared/utils/validation"
import { merchantCategoryLabels } from "@/shared/constants/content-config"
import { toast } from "sonner"
import type { Merchant } from "../../../../shared/types/content-types"

const CATEGORIES = Object.entries(merchantCategoryLabels).map(([key, label]) => ({ key, label }))

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
    category: "",
    shopPhone: "",
    shopDesc: "",
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
    description: "",
    lat: "",
    lng: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Credential images (shared between claim and new-shop forms, reset on phase change)
  const [credentialImages, setCredentialImages] = useState<string[]>([])
  const credentialInputRef = useRef<HTMLInputElement>(null)

  // New-shop cover upload
  const [newShopCover, setNewShopCover] = useState<string>("")
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Claim cover upload (Finding 7)
  const [claimCover, setClaimCover] = useState<string>("")
  const claimCoverInputRef = useRef<HTMLInputElement>(null)

  // Unclaimed merchants only
  const unclaimedMerchants = useMemo(() => storeMerchants.filter((m) => m.claimStatus !== "claimed"), [storeMerchants])

  // Search filtering
  const displayedMerchants = useMemo(() => {
    if (!query.trim()) return unclaimedMerchants
    const q = query.toLowerCase()
    return unclaimedMerchants.filter(
      (m) => m.name.toLowerCase().includes(q) || (m.address && m.address.toLowerCase().includes(q))
    )
  }, [query, unclaimedMerchants])

  const handleCredentialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const results = await Promise.all(Array.from(files).map(readFileAsDataURL))
    setCredentialImages((prev) => [...prev, ...results])
    e.target.value = ""
  }

  const handleCoverUpload = (setter: (v: string) => void) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await readFileAsDataURL(file)
    setter(result)
    e.target.value = ""
  }

  const validateClaim = () => {
    const errs: Record<string, string> = {}
    if (!claimForm.contactName.trim()) errs.contactName = "请输入联系人"
    if (!claimForm.contactPhone.trim()) errs.contactPhone = "请输入联系电话"
    else if (!PHONE_REGEX.test(claimForm.contactPhone)) errs.contactPhone = "手机号格式不正确"
    if (!claimForm.category) errs.category = "请选择经营类型"
    if (credentialImages.length === 0) errs.credentialImages = "请上传至少一张资质证明"
    return errs
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.shopName.trim()) errs.shopName = "请输入店铺名称"
    if (!form.contactName.trim()) errs.contactName = "请输入联系人"
    if (!form.contactPhone.trim()) errs.contactPhone = "请输入联系电话"
    else if (!PHONE_REGEX.test(form.contactPhone)) errs.contactPhone = "手机号格式不正确"
    if (!form.category) errs.category = "请选择经营类型"
    if (!form.address.trim()) errs.address = "请填写店铺地址"
    if (!form.phone.trim()) errs.phone = "请填写店铺联系电话"
    if (!form.description.trim()) errs.description = "请填写店铺简介"
    if (!newShopCover) errs.cover = "请上传店铺封面"
    if (credentialImages.length === 0) errs.credentialImages = "请上传至少一张资质证明"
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
      credentialImages,
      claimedCategory: claimForm.category,
      claimedPhone: claimForm.shopPhone,
      claimedDesc: claimForm.shopDesc,
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
      credentialImages,
      newLat: form.lat ? parseFloat(form.lat) : undefined,
      newLng: form.lng ? parseFloat(form.lng) : undefined,
      newCoverImage: newShopCover || undefined,
    })

    setPhase("success")
    toast.success("入驻申请已提交，等待平台审核")
  }

  const handleStartClaim = (merchant: Merchant) => {
    setSelectedShop(merchant)
    setClaimForm({
      contactName: user?.name ?? "",
      contactPhone: user?.phone ?? "",
      category: merchant.category ?? "",
      shopPhone: merchant.phone ?? "",
      shopDesc: merchant.description ?? "",
    })
    setClaimErrors({})
    setCredentialImages([])
    setClaimCover("")
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
      description: "",
      lat: "",
      lng: "",
    })
    setCredentialImages([])
    setNewShopCover("")
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
          平台将在 1-3 个工作日内完成审核
          <br />
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
        <PageHeader
          title="认领店铺"
          back={() => {
            setPhase("list")
            setSelectedShop(null)
          }}
        />

        <div className="px-4 mt-3">
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
            <p className="text-[13px] text-text-secondary mb-5">这是系统已有店铺信息，确认后提交认领申请。</p>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              {/* 店铺封面 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Camera size={14} className="text-primary" /> 店铺封面
                </label>
                <div className="relative h-28 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={claimCover || selectedShop.cover}
                    alt={selectedShop.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => claimCoverInputRef.current?.click()}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center active:bg-black/70"
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <input ref={claimCoverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload(setClaimCover)} />
              </div>

              {/* 店铺名称（只读） */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Store size={14} className="text-primary" /> 店铺名称
                </label>
                <input value={selectedShop.name} readOnly className="w-full h-11 px-4 rounded-xl border border-border-light text-[13px] bg-gray-50 text-text-muted outline-none" />
              </div>

              {/* 经营类型 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Store size={14} className="text-primary" /> 经营类型
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => { setClaimForm({ ...claimForm, category: cat.key }); setClaimErrors({ ...claimErrors, category: "" }) }}
                      className={`px-4 h-9 rounded-full text-[12px] transition-all ${claimForm.category === cat.key ? "bg-primary text-white" : "bg-surface-page text-text-secondary"}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 店铺地址 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <MapPin size={14} className="text-primary" /> 店铺地址
                </label>
                <input value={selectedShop.address || ""} readOnly className="w-full h-11 px-4 rounded-xl border border-border-light text-[13px] bg-gray-50 text-text-muted outline-none" />
              </div>

              {/* 坐标（只读） */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <MapPin size={14} className="text-primary" /> 坐标
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input value={selectedShop.lat ? `纬度: ${selectedShop.lat}` : "纬度: -"} readOnly className="w-full h-11 px-4 rounded-xl border border-border-light text-[13px] bg-gray-50 text-text-muted outline-none" />
                  <input value={selectedShop.lng ? `经度: ${selectedShop.lng}` : "经度: -"} readOnly className="w-full h-11 px-4 rounded-xl border border-border-light text-[13px] bg-gray-50 text-text-muted outline-none" />
                </div>
              </div>

              {/* 店铺电话 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Phone size={14} className="text-primary" /> 店铺电话
                </label>
                <input
                  value={claimForm.shopPhone ?? selectedShop.phone ?? ""}
                  onChange={(e) => setClaimForm({ ...claimForm, shopPhone: e.target.value })}
                  placeholder="游客咨询电话"
                  className="w-full h-11 px-4 rounded-xl border border-border-light text-[13px] outline-none focus:border-primary"
                />
              </div>

              {/* 店铺简介 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <AlignLeft size={14} className="text-primary" /> 店铺简介
                </label>
                <textarea
                  value={claimForm.shopDesc ?? selectedShop.description ?? ""}
                  onChange={(e) => setClaimForm({ ...claimForm, shopDesc: e.target.value })}
                  placeholder="简要描述您的店铺特色和服务"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border-light text-[13px] outline-none focus:border-primary resize-none"
                />
              </div>

              {/* 资质证明 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Shield size={14} className="text-primary" /> 资质证明 <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-text-tertiary mb-2">上传营业执照等资质证明图片（至少1张）</p>
                <div className="grid grid-cols-3 gap-2">
                  {credentialImages.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border-light">
                      <img src={img} alt={`资质证明 ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCredentialImages((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => credentialInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border-light flex flex-col items-center justify-center gap-1 text-text-muted hover:border-primary hover:text-primary transition-colors"
                  >
                    <Camera size={20} />
                    <span className="text-[10px]">添加</span>
                  </button>
                </div>
                <input ref={credentialInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleCredentialUpload} />
                {claimErrors.credentialImages && <p className="text-[11px] text-red-500 mt-1">{claimErrors.credentialImages}</p>}
              </div>

              {/* 联系人 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <User size={14} className="text-primary" /> 联系人 <span className="text-red-500">*</span>
                </label>
                <input
                  value={claimForm.contactName ?? ""}
                  onChange={(e) => setClaimForm({ ...claimForm, contactName: e.target.value })}
                  placeholder="您的姓名"
                  className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${claimErrors.contactName ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20"}`}
                />
                {claimErrors.contactName && <p className="text-[11px] text-red-500 mt-1">{claimErrors.contactName}</p>}
              </div>

              {/* 联系电话 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Phone size={14} className="text-primary" /> 联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  value={claimForm.contactPhone ?? ""}
                  onChange={(e) => setClaimForm({ ...claimForm, contactPhone: e.target.value })}
                  placeholder="手机号"
                  className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${claimErrors.contactPhone ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20"}`}
                />
                {claimErrors.contactPhone && <p className="text-[11px] text-red-500 mt-1">{claimErrors.contactPhone}</p>}
              </div>

              <button type="submit" className="w-full h-12 rounded-full bg-primary text-white text-[14px] font-medium">
                提交认领申请
              </button>
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
              {/* 店铺封面 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Camera size={14} className="text-primary" /> 店铺封面 <span className="text-red-500">*</span>
                </label>
                {newShopCover ? (
                  <div className="relative h-28 rounded-xl overflow-hidden bg-gray-100">
                    <img src={newShopCover} alt="店铺封面" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setNewShopCover(""); setErrors({ ...errors, cover: "" }) }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-[12px]"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full h-28 rounded-xl border-2 border-dashed border-border-light flex flex-col items-center justify-center gap-1 text-text-muted hover:border-primary hover:text-primary transition-colors"
                  >
                    <Camera size={28} />
                    <span className="text-[12px]">点击上传店铺封面</span>
                  </button>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload(setNewShopCover)} />
                {errors.cover && <p className="text-[11px] text-red-500 mt-1">{errors.cover}</p>}
              </div>

              {/* 店铺名称 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Store size={14} className="text-primary" /> 店铺名称 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.shopName}
                  onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                  placeholder="请输入您的店铺名称"
                  className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.shopName ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20"}`}
                />
                {errors.shopName && <p className="text-[11px] text-red-500 mt-1">{errors.shopName}</p>}
              </div>

              {/* 经营类型 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Store size={14} className="text-primary" /> 经营类型 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, category: cat.key })
                        setErrors({ ...errors, category: "" })
                      }}
                      className={`px-4 h-9 rounded-full text-[12px] transition-all ${form.category === cat.key ? "bg-primary text-white" : "bg-surface-page text-text-secondary"}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                {errors.category && <p className="text-[11px] text-red-500 mt-1">{errors.category}</p>}
              </div>

              {/* 店铺地址 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <MapPin size={14} className="text-primary" /> 店铺地址 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="丽江古城内详细地址"
                  className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.address ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20"}`}
                />
                {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
              </div>

              {/* 坐标 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                    <MapPin size={14} className="text-primary" /> 纬度
                  </label>
                  <input
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    placeholder="如 26.8723"
                    className="w-full h-11 px-4 rounded-xl border border-border-light text-[13px] outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                    <MapPin size={14} className="text-primary" /> 经度
                  </label>
                  <input
                    value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                    placeholder="如 100.2299"
                    className="w-full h-11 px-4 rounded-xl border border-border-light text-[13px] outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* 店铺电话 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Phone size={14} className="text-primary" /> 店铺电话 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="游客咨询电话"
                  className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.phone ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20"}`}
                />
                {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* 店铺简介 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <AlignLeft size={14} className="text-primary" /> 店铺简介 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="简要描述您的店铺特色和服务"
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border text-[13px] outline-none resize-none ${errors.description ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20"}`}
                />
                {errors.description && <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>}
              </div>

              {/* 资质证明 */}
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Shield size={14} className="text-primary" /> 资质证明 <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-text-tertiary mb-2">上传营业执照、卫生许可证等资质证明图片（至少1张）</p>
                <div className="grid grid-cols-3 gap-2">
                  {credentialImages.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border-light">
                      <img src={img} alt={`资质证明 ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCredentialImages((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => credentialInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border-light flex flex-col items-center justify-center gap-1 text-text-muted hover:border-primary hover:text-primary transition-colors"
                  >
                    <Camera size={20} />
                    <span className="text-[10px]">添加</span>
                  </button>
                </div>
                <input ref={credentialInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleCredentialUpload} />
                {errors.credentialImages && <p className="text-[11px] text-red-500 mt-1">{errors.credentialImages}</p>}
              </div>

              {/* 联系人与电话 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                    <User size={14} className="text-primary" /> 联系人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="您的姓名"
                    className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.contactName ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`}
                  />
                  {errors.contactName && <p className="text-[11px] text-red-500 mt-1">{errors.contactName}</p>}
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                    <Phone size={14} className="text-primary" /> 联系电话 <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="手机号"
                    className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.contactPhone ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`}
                  />
                  {errors.contactPhone && <p className="text-[11px] text-red-500 mt-1">{errors.contactPhone}</p>}
                </div>
              </div>

              <button type="submit" className="w-full h-12 rounded-full bg-primary text-white text-[14px] font-medium">
                提交入驻申请
              </button>
            </form>

            <p className="text-center text-[11px] text-text-tertiary mt-4">
              提交后需平台管理员审核，审核通过后即可管理您的店铺信息
            </p>
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
              <div
                key={m.id}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(60,120,200,0.10)]"
              >
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


      {/* Fixed bottom CTA */}
      <div className="fixed left-0 right-0 bottom-0 bg-white/95 backdrop-blur-xl border-t border-border-light px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(60,120,200,0.08)] z-20">
        <button
          onClick={handleStartNewShop}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-primary text-white text-[14px] font-medium shadow-[0_4px_16px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          提交新店铺信息
        </button>
      </div>
      </div>
    </div>
  )
}
