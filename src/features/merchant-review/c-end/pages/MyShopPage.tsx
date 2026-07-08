import { useState, useMemo, useRef } from "react"
import { useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { useContentMerchantStore } from "@/platform/content/merchant-store"
import { useMerchantReviewStore } from "@/features/merchant-review/store"
import { useAuthStore } from "@/platform/auth"
import {
  Store, Phone, FileText, Power, CheckCircle2, Clock3, XCircle,
  BadgeCheck, X, Image, Tag, Edit3, MapPin, Shield, Camera, User,
} from "lucide-react"
import { toast } from "sonner"

const STATUS_META = {
  pending: { label: "审核中", icon: Clock3, color: "text-amber-600", bg: "bg-amber-50" },
  approved: { label: "已通过", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  rejected: { label: "已驳回", icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
}

type SheetType = "cover" | "description" | "detailImages" | "name" | "address" | "phone" | "category" | "lat" | "contactName" | "contactPhone" | "businessLicense" | null

function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-[20px] max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="text-[16px] text-text-body font-medium">{title}</h3>
          <button onClick={onClose} className="p-1">
            <X size={20} className="text-text-tertiary" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4 pb-8">{children}</div>
      </div>
    </div>
  )
}

export function MyShopPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isSupplier = user?.roles?.includes("supplier") ?? false

  // ── 非商户身份 → 入驻引导 ──
  if (!isSupplier) {
    return (
      <div className="min-h-full bg-surface-page pb-6">
        <PageHeader title="我的店铺" back="/c/profile" />
        <div className="px-4 pt-12 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Store size={40} className="text-primary" />
          </div>
          <h2 className="text-[18px] font-semibold text-text-heading mb-2">您还不是商户</h2>
          <p className="text-[13px] text-text-secondary mb-6 max-w-xs">
            入驻成为古城商户后，即可在此管理您的店铺信息、营业状态等
          </p>
          <button
            onClick={() => navigate("/c/merchant-register")}
            className="h-11 px-8 rounded-full bg-primary text-white text-[14px] font-medium"
          >
            立即入驻
          </button>
        </div>
      </div>
    )
  }

  // ── 商户已认证 ──
  const supplierId = user?.supplierId ?? "sup_001"
  const supplierName = user?.name ?? "商户"
  const merchants = useContentMerchantStore((s) => s.merchants)
  const allRequests = useMerchantReviewStore((s) => s.requests)
  const submitChange = useMerchantReviewStore((s) => s.submitChange)

  const merchant = useMemo(
    () => merchants.find((m) => m.relatedUser === supplierName) ?? merchants[0],
    [merchants, supplierName],
  )
  const myRequests = useMemo(
    () => allRequests.filter((r) => r.supplierId === supplierId),
    [allRequests, supplierId],
  )
  const pendingCount = useMemo(
    () => myRequests.filter((r) => r.status === "pending").length,
    [myRequests],
  )

  const [shopOpen, setShopOpen] = useState(merchant.status !== "closed")
  const [activeSheet, setActiveSheet] = useState<SheetType>(null)
  const [sheetValue, setSheetValue] = useState("")

  // Refs for image upload (Finding 4)
  const businessLicenseInputRef = useRef<HTMLInputElement>(null)
  const [businessLicenseUpload, setBusinessLicenseUpload] = useState<string>("")

  // Lat/Lng state for edit (Finding 4)
  const [sheetLat, setSheetLat] = useState("")
  const [sheetLng, setSheetLng] = useState("")

  if (!merchant) return <div className="p-4 text-center text-text-tertiary">暂无店铺信息</div>

  const closeSheet = () => {
    setActiveSheet(null)
    setSheetValue("")
    setBusinessLicenseUpload("")
    setSheetLat("")
    setSheetLng("")
  }

  const handleDirectSave = async (field: string, value: string) => {
    try {
      await useContentMerchantStore.getState().updateMerchant(merchant.id, { [field]: value })
      toast.success("修改已保存")
      closeSheet()
    } catch {
      toast.error("保存失败")
    }
  }

  const handleDetailImagesSave = async (value: string) => {
    const urls = value.split("\n").map((s) => s.trim()).filter(Boolean)
    if (urls.length === 0) {
      toast.error("请输入至少一张图片链接")
      return
    }
    try {
      await useContentMerchantStore.getState().updateMerchant(merchant.id, { detailImages: urls })
      toast.success("图片已更新")
      closeSheet()
    } catch {
      toast.error("保存失败")
    }
  }

  const handleChangeRequest = async (field: string, label: string, newValue: string) => {
    if (!newValue.trim()) {
      toast.error("请输入新值")
      return
    }
    try {
      await submitChange({
        supplierId,
        supplierName,
        merchantName: merchant.name,
        fields: [
          {
            field,
            label,
            oldValue: String((merchant as any)[field] ?? ""),
            newValue: newValue.trim(),
          },
        ],
      })
      toast.success("修改申请已提交，等待审核")
      closeSheet()
    } catch {
      toast.error("提交失败")
    }
  }

  const latestRequest = myRequests[0]

  // ── Bottom sheet content ──
  const renderSheet = () => {
    if (!activeSheet) return null

    // 封面（直接编辑）
    if (activeSheet === "cover") {
      return (
        <Sheet open onClose={closeSheet} title="修改封面图">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src={merchant.cover} alt="" className="w-20 h-14 rounded-lg object-cover" />
              <span className="text-[12px] text-text-tertiary">当前封面</span>
            </div>
            <input
              value={sheetValue}
              onChange={(e) => setSheetValue(e.target.value)}
              placeholder="输入新的图片链接"
              className="w-full h-10 px-3 rounded-xl bg-gray-50 text-[13px] outline-none"
            />
            <button
              onClick={() => handleDirectSave("cover", sheetValue)}
              className="w-full h-10 rounded-xl bg-primary text-white text-[13px] font-medium"
            >
              保存
            </button>
          </div>
        </Sheet>
      )
    }

    // 简介（直接编辑）
    if (activeSheet === "description") {
      return (
        <Sheet open onClose={closeSheet} title="修改店铺简介">
          <div className="space-y-3">
            <p className="text-[12px] text-text-tertiary">当前简介</p>
            <p className="text-[13px] text-text-body bg-gray-50 rounded-xl p-3">{merchant.description}</p>
            <textarea
              value={sheetValue}
              onChange={(e) => setSheetValue(e.target.value)}
              placeholder="输入新的简介"
              rows={4}
              className="w-full text-[13px] outline-none bg-gray-50 rounded-xl p-3 resize-none"
            />
            <button
              onClick={() => handleDirectSave("description", sheetValue)}
              className="w-full h-10 rounded-xl bg-primary text-white text-[13px] font-medium"
            >
              保存
            </button>
          </div>
        </Sheet>
      )
    }

    // 详情图片（直接编辑）
    if (activeSheet === "detailImages") {
      const currentImages = merchant.detailImages ?? []
      return (
        <Sheet open onClose={closeSheet} title="修改详情图片">
          <div className="space-y-3">
            <p className="text-[12px] text-text-tertiary">
              当前图片（{currentImages.length} 张）
            </p>
            {currentImages.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {currentImages.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-text-tertiary">暂无图片</p>
            )}
            <p className="text-[12px] text-text-tertiary">新图片链接（每行一个）</p>
            <textarea
              value={sheetValue}
              onChange={(e) => setSheetValue(e.target.value)}
              placeholder="https://example.com/image1.jpg"
              rows={4}
              className="w-full text-[13px] outline-none bg-gray-50 rounded-xl p-3 resize-none"
            />
            <button
              onClick={() => handleDetailImagesSave(sheetValue)}
              className="w-full h-10 rounded-xl bg-primary text-white text-[13px] font-medium"
            >
              保存
            </button>
          </div>
        </Sheet>
      )
    }

    // 坐标修改（两个输入框）
    if (activeSheet === "lat") {
      return (
        <Sheet open onClose={closeSheet} title="修改坐标">
          <div className="space-y-3">
            <div>
              <p className="text-[12px] text-text-tertiary mb-1">当前坐标</p>
              <p className="text-[13px] text-text-body bg-gray-50 rounded-xl p-3">
                纬度: {merchant.lat ?? "未设置"} / 经度: {merchant.lng ?? "未设置"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[12px] text-text-tertiary mb-1">纬度</p>
                <input
                  value={sheetLat}
                  onChange={(e) => setSheetLat(e.target.value)}
                  placeholder="如 26.8723"
                  type="number"
                  step="any"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 text-[13px] outline-none"
                />
              </div>
              <div>
                <p className="text-[12px] text-text-tertiary mb-1">经度</p>
                <input
                  value={sheetLng}
                  onChange={(e) => setSheetLng(e.target.value)}
                  placeholder="如 100.2299"
                  type="number"
                  step="any"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 text-[13px] outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-amber-600 flex items-center gap-1">
              <Clock3 size={12} /> 修改需平台审核通过后生效
            </p>
            <button
              onClick={async () => {
                if (!sheetLat.trim() && !sheetLng.trim()) {
                  toast.error("请至少输入一个坐标值")
                  return
                }
                const fields = []
                if (sheetLat.trim()) fields.push({ field: "lat" as const, label: "纬度" as const, oldValue: String(merchant.lat ?? ""), newValue: sheetLat.trim() })
                if (sheetLng.trim()) fields.push({ field: "lng" as const, label: "经度" as const, oldValue: String(merchant.lng ?? ""), newValue: sheetLng.trim() })
                try {
                  await submitChange({
                    supplierId,
                    supplierName,
                    merchantName: merchant.name,
                    fields: fields.map((f) => ({ ...f, status: undefined })),
                  })
                  toast.success("修改申请已提交，等待审核")
                  closeSheet()
                } catch {
                  toast.error("提交失败")
                }
              }}
              className="w-full h-10 rounded-xl bg-primary text-white text-[13px] font-medium"
            >
              提交申请
            </button>
          </div>
        </Sheet>
      )
    }

    // 营业执照修改（图片上传）
    if (activeSheet === "businessLicense") {
      return (
        <Sheet open onClose={closeSheet} title="修改营业执照">
          <div className="space-y-3">
            <div>
              <p className="text-[12px] text-text-tertiary mb-1">当前营业执照</p>
              {merchant.businessLicense ? (
                <img src={merchant.businessLicense} alt="营业执照" className="w-full h-28 rounded-xl object-cover bg-gray-50" />
              ) : (
                <p className="text-[13px] text-text-body bg-gray-50 rounded-xl p-3">未设置</p>
              )}
            </div>
            <div>
              <p className="text-[12px] text-text-tertiary mb-1">上传新营业执照</p>
              {businessLicenseUpload ? (
                <div className="relative h-28 rounded-xl overflow-hidden bg-gray-100">
                  <img src={businessLicenseUpload} alt="新营业执照" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setBusinessLicenseUpload("")}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-[12px]"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => businessLicenseInputRef.current?.click()}
                  className="w-full h-28 rounded-xl border-2 border-dashed border-border-light flex flex-col items-center justify-center gap-1 text-text-muted hover:border-primary hover:text-primary transition-colors"
                >
                  <Camera size={28} />
                  <span className="text-[12px]">点击上传营业执照</span>
                </button>
              )}
              <input ref={businessLicenseInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => {
                  if (ev.target?.result) setBusinessLicenseUpload(ev.target.result as string)
                }
                reader.readAsDataURL(file)
                e.target.value = ""
              }} />
            </div>
            <p className="text-[11px] text-amber-600 flex items-center gap-1">
              <Clock3 size={12} /> 修改需平台审核通过后生效
            </p>
            <button
              onClick={async () => {
                if (!businessLicenseUpload) {
                  toast.error("请上传营业执照图片")
                  return
                }
                try {
                  await submitChange({
                    supplierId,
                    supplierName,
                    merchantName: merchant.name,
                    fields: [
                      {
                        field: "businessLicense",
                        label: "营业执照",
                        oldValue: merchant.businessLicense ?? "",
                        newValue: businessLicenseUpload,
                      },
                    ],
                  })
                  toast.success("修改申请已提交，等待审核")
                  closeSheet()
                } catch {
                  toast.error("提交失败")
                }
              }}
              className="w-full h-10 rounded-xl bg-primary text-white text-[13px] font-medium"
            >
              提交申请
            </button>
          </div>
        </Sheet>
      )
    }

    // 联系电话修改（带手机号验证）
    if (activeSheet === "contactPhone") {
      const currentValue = String(merchant.contactPhone ?? "")
      return (
        <Sheet open onClose={closeSheet} title="修改联系电话">
          <div className="space-y-3">
            <div>
              <p className="text-[12px] text-text-tertiary mb-1">当前值</p>
              <p className="text-[13px] text-text-body bg-gray-50 rounded-xl p-3">
                {currentValue || "未设置"}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-text-tertiary mb-1">新值</p>
              <input
                value={sheetValue}
                onChange={(e) => setSheetValue(e.target.value)}
                placeholder="输入新的联系电话"
                type="tel"
                className="w-full h-10 px-3 rounded-xl bg-gray-50 text-[13px] outline-none"
              />
            </div>
            <p className="text-[11px] text-amber-600 flex items-center gap-1">
              <Clock3 size={12} /> 修改需平台审核通过后生效
            </p>
            <button
              onClick={() => {
                if (!sheetValue.trim()) {
                  toast.error("请输入联系电话")
                  return
                }
                if (!/^1[3-9]\d{9}$/.test(sheetValue.trim())) {
                  toast.error("手机号格式不正确")
                  return
                }
                handleChangeRequest("contactPhone", "联系电话", sheetValue.trim())
              }}
              className="w-full h-10 rounded-xl bg-primary text-white text-[13px] font-medium"
            >
              提交申请
            </button>
          </div>
        </Sheet>
      )
    }

    // 审核类字段（需提交审核）
    const CRITICAL_META: Record<string, { label: string }> = {
      name: { label: "店铺名称" },
      address: { label: "店铺地址" },
      phone: { label: "联系电话" },
      category: { label: "店铺分类" },
      contactName: { label: "联系人" },
    }
    const meta = CRITICAL_META[activeSheet]
    if (meta) {
      const currentValue = String((merchant as any)[activeSheet] ?? "")
      return (
        <Sheet open onClose={closeSheet} title={`修改${meta.label}`}>
          <div className="space-y-3">
            <div>
              <p className="text-[12px] text-text-tertiary mb-1">当前值</p>
              <p className="text-[13px] text-text-body bg-gray-50 rounded-xl p-3">
                {currentValue || "未设置"}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-text-tertiary mb-1">新值</p>
              <input
                value={sheetValue}
                onChange={(e) => setSheetValue(e.target.value)}
                placeholder={`输入新的${meta.label}`}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 text-[13px] outline-none"
              />
            </div>
            <p className="text-[11px] text-amber-600 flex items-center gap-1">
              <Clock3 size={12} /> 修改需平台审核通过后生效
            </p>
            <button
              onClick={() => handleChangeRequest(activeSheet, meta.label, sheetValue)}
              className="w-full h-10 rounded-xl bg-primary text-white text-[13px] font-medium"
            >
              提交申请
            </button>
          </div>
        </Sheet>
      )
    }

    return null
  }

  return (
    <div className="min-h-full bg-surface-page pb-6">
      <PageHeader title="我的店铺" back="/c/profile" />

      {/* 商户身份标识 */}
      <div className="mx-4 mt-3 px-4 h-9 rounded-xl bg-emerald-50 flex items-center gap-2">
        <BadgeCheck size={14} className="text-emerald-500" />
        <span className="text-[12px] text-emerald-700">已验证商户</span>
      </div>

      {/* 待审核提醒 */}
      {pendingCount > 0 && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-amber-50 flex items-center gap-2">
          <Clock3 size={16} className="text-amber-600 shrink-0" />
          <span className="text-[12px] text-amber-700">
            您有 {pendingCount} 个修改申请正在审核中
          </span>
        </div>
      )}

      {/* 店铺头 */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="relative">
            <img src={merchant.cover} alt={merchant.name} className="w-full h-32 object-cover" />
            <button
              onClick={() => {
                setSheetValue(merchant.cover)
                setActiveSheet("cover")
              }}
              className="absolute top-2 right-2 size-8 rounded-full bg-black/40 flex items-center justify-center active:bg-black/60"
            >
              <Edit3 size={14} className="text-white" />
            </button>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-[17px] font-semibold text-text-heading truncate">
                  {merchant.name}
                </p>
                <button
                  onClick={() => {
                    setSheetValue(merchant.name)
                    setActiveSheet("name")
                  }}
                  className="text-[11px] text-primary shrink-0"
                >
                  申请修改
                </button>
                <button
                  onClick={async () => {
                    const newStatus = shopOpen ? "closed" : "open"
                    try {
                      await useContentMerchantStore.getState().updateMerchant(merchant.id, { status: newStatus })
                      setShopOpen(!shopOpen)
                      toast.success(newStatus === "open" ? "店铺已恢复营业" : "店铺已暂停营业")
                    } catch {
                      toast.error("操作失败")
                    }
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${shopOpen ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-text-tertiary"}`}
                >
                  <Power size={11} /> {shopOpen ? "营业中" : "休息中"}
                </button>
              </div>
              <span className="text-[12px] text-amber-500 shrink-0">⭐ {merchant.rating}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[12px] text-text-tertiary truncate">{merchant.address}</p>
              <button
                onClick={() => {
                  setSheetValue(merchant.address)
                  setActiveSheet("address")
                }}
                className="text-[11px] text-primary shrink-0"
              >
                申请修改
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 审核状态提示 */}
      {latestRequest && (
        <div className="px-4 mt-3">
          <div
            className={`rounded-xl p-3 flex items-center gap-2 ${STATUS_META[latestRequest.status].bg}`}
          >
            {(() => {
              const Icon = STATUS_META[latestRequest.status].icon
              return <Icon size={16} className={STATUS_META[latestRequest.status].color} />
            })()}
            <div className="flex-1">
              <p className={`text-[12px] font-medium ${STATUS_META[latestRequest.status].color}`}>
                最近变更：{STATUS_META[latestRequest.status].label}
              </p>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                {latestRequest.fields.map((f) => f.label).join("、")} ·{" "}
                {latestRequest.submittedAt}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 店铺信息 */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-4">
          <p className="text-[14px] font-semibold text-text-heading flex items-center gap-1.5 mb-2">
            <Store size={16} /> 店铺信息
          </p>

          {/* 分类 */}
          <div className="flex items-center gap-3 py-3 border-b border-gray-50">
            <Tag size={16} className="text-text-tertiary shrink-0" />
            <span className="text-[13px] text-text-secondary w-16">店铺分类</span>
            <span className="flex-1 text-[13px] text-text-heading text-right">
              {merchant.category}
            </span>
            <button
              onClick={() => {
                setSheetValue(merchant.category)
                setActiveSheet("category")
              }}
              className="text-[12px] text-primary shrink-0"
            >
              申请修改
            </button>
          </div>

          {/* 电话 */}
          <div className="flex items-center gap-3 py-3 border-b border-gray-50">
            <Phone size={16} className="text-text-tertiary shrink-0" />
            <span className="text-[13px] text-text-secondary w-16">联系电话</span>
            <span className="flex-1 text-[13px] text-text-heading text-right">
              {merchant.phone}
            </span>
            <button
              onClick={() => {
                setSheetValue(merchant.phone)
                setActiveSheet("phone")
              }}
              className="text-[12px] text-primary shrink-0"
            >
              申请修改
            </button>
          </div>

          {/* 联系人 */}
          <div className="flex items-center gap-3 py-3 border-b border-gray-50">
            <User size={16} className="text-text-tertiary shrink-0" />
            <span className="text-[13px] text-text-secondary w-16">联系人</span>
            <span className="flex-1 text-[13px] text-text-heading text-right">
              {merchant.contactName || "未设置"}
            </span>
            <button
              onClick={() => {
                setSheetValue(merchant.contactName ?? "")
                setActiveSheet("contactName")
              }}
              className="text-[12px] text-primary shrink-0"
            >
              申请修改
            </button>
          </div>

          {/* 联系电话（商户） */}
          <div className="flex items-center gap-3 py-3 border-b border-gray-50">
            <Phone size={16} className="text-text-tertiary shrink-0" />
            <span className="text-[13px] text-text-secondary w-16">联系手机</span>
            <span className="flex-1 text-[13px] text-text-heading text-right">
              {merchant.contactPhone || "未设置"}
            </span>
            <button
              onClick={() => {
                setSheetValue(merchant.contactPhone ?? "")
                setActiveSheet("contactPhone")
              }}
              className="text-[12px] text-primary shrink-0"
            >
              申请修改
            </button>
          </div>

          {/* 坐标 */}
          <div className="flex items-center gap-3 py-3 border-b border-gray-50">
            <MapPin size={16} className="text-text-tertiary shrink-0" />
            <span className="text-[13px] text-text-secondary w-16">坐标</span>
            <span className="flex-1 text-[13px] text-text-heading text-right">
              {merchant.lat != null ? `${merchant.lat}, ${merchant.lng ?? "-"}` : "未设置"}
            </span>
            <button
              onClick={() => {
                setSheetLat(String(merchant.lat ?? ""))
                setSheetLng(String(merchant.lng ?? ""))
                setActiveSheet("lat")
              }}
              className="text-[12px] text-primary shrink-0"
            >
              申请修改
            </button>
          </div>

          {/* 简介 */}
          <div className="py-3 border-b border-gray-50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-text-tertiary shrink-0" />
                <span className="text-[13px] text-text-secondary">店铺简介</span>
              </div>
              <button
                onClick={() => {
                  setSheetValue(merchant.description)
                  setActiveSheet("description")
                }}
                className="text-[12px] text-primary"
              >
                编辑
              </button>
            </div>
            <p className="text-[13px] text-text-body leading-relaxed mt-1">
              {merchant.description}
            </p>
          </div>

          {/* 详情图片 */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Image size={16} className="text-text-tertiary shrink-0" />
                <span className="text-[13px] text-text-secondary">详情图片</span>
              </div>
              <button
                onClick={() => {
                  setSheetValue((merchant.detailImages ?? []).join("\n"))
                  setActiveSheet("detailImages")
                }}
                className="text-[12px] text-primary"
              >
                编辑
              </button>
            </div>
            {(merchant.detailImages ?? []).length > 0 ? (
              <div className="flex gap-2 flex-wrap mt-1">
                {merchant.detailImages!.slice(0, 4).map((url, i) => (
                  <img key={i} src={url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                ))}
                {merchant.detailImages!.length > 4 && (
                  <span className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center text-[12px] text-text-tertiary">
                    +{merchant.detailImages!.length - 4}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-text-tertiary">暂无详情图片</p>
            )}
          </div>

          {/* 营业执照 */}
          <div className="py-3 border-t border-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-text-tertiary shrink-0" />
                <span className="text-[13px] text-text-secondary">营业执照</span>
              </div>
              <button
                onClick={() => {
                  setActiveSheet("businessLicense")
                }}
                className="text-[12px] text-primary"
              >
                申请修改
              </button>
            </div>
            {merchant.businessLicense ? (
              <img src={merchant.businessLicense} alt="营业执照" className="w-full h-28 rounded-xl object-cover bg-gray-50" />
            ) : (
              <p className="text-[12px] text-text-tertiary">未上传</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom sheets */}
      {renderSheet()}

      <p className="text-center text-[11px] text-text-quaternary mt-4 px-8">
        店铺信息变更需平台审核通过后生效，保障古城商铺信息准确
      </p>
    </div>
  )
}