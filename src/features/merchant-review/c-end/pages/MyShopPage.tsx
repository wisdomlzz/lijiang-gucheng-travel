import { useState, useMemo } from "react"
import { useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { useContentMerchantStore } from "@/platform/content/merchant-store"
import { useMerchantReviewStore } from "@/features/merchant-review/store"
import { useAuthStore } from "@/platform/auth"
import { Store, Clock, Phone, FileText, Power, CheckCircle2, Clock3, XCircle, BadgeCheck } from "lucide-react"
import { toast } from "sonner"

const STATUS_META = {
  pending: { label: "审核中", icon: Clock3, color: "text-amber-600", bg: "bg-amber-50" },
  approved: { label: "已通过", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  rejected: { label: "已驳回", icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
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
    [merchants, supplierName]
  )
  const myRequests = useMemo(() => allRequests.filter((r) => r.supplierId === supplierId), [allRequests, supplierId])

  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(true) // 营业状态
  const [form, setForm] = useState({
    hours: merchant?.hours ?? "09:00-22:00",
    phone: merchant?.phone ?? "",
    description: merchant?.description ?? "",
  })

  if (!merchant) return <div className="p-4 text-center text-text-tertiary">暂无店铺信息</div>

  const handleSubmit = () => {
    const fields = []
    if (form.hours !== merchant.hours)
      fields.push({ field: "hours", label: "营业时间", oldValue: merchant.hours, newValue: form.hours })
    if (form.phone !== merchant.phone)
      fields.push({ field: "phone", label: "联系电话", oldValue: merchant.phone, newValue: form.phone })
    if (form.description !== merchant.description)
      fields.push({
        field: "description",
        label: "店铺简介",
        oldValue: merchant.description,
        newValue: form.description,
      })
    if (fields.length === 0) {
      toast.info("未修改任何信息")
      return
    }
    submitChange({ supplierId, supplierName, merchantName: merchant.name, fields })
    toast.success("变更已提交，等待平台审核")
    setEditing(false)
  }

  const latestRequest = myRequests[0]

  return (
    <div className="min-h-full bg-surface-page pb-6">
      <PageHeader title="我的店铺" back="/c/profile" />

      {/* 商户身份标识 */}
      <div className="mx-4 mt-3 px-4 h-9 rounded-xl bg-emerald-50 flex items-center gap-2">
        <BadgeCheck size={14} className="text-emerald-500" />
        <span className="text-[12px] text-emerald-700">已验证商户</span>
      </div>

      {/* 店铺头 */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl overflow-hidden">
          <img src={merchant.cover} alt={merchant.name} className="w-full h-32 object-cover" />
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[17px] font-semibold text-text-heading">{merchant.name}</p>
                <button
                  onClick={() => setOpen(!open)}
                  className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 ${open ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-text-tertiary"}`}
                >
                  <Power size={11} /> {open ? "营业中" : "休息中"}
                </button>
              </div>
              <span className="text-[12px] text-amber-500">⭐ {merchant.rating}</span>
            </div>
            <p className="text-[12px] text-text-tertiary mt-1">{merchant.address}</p>
          </div>
        </div>
      </div>

      {/* 审核状态提示 */}
      {latestRequest && (
        <div className="px-4 mt-3">
          <div className={`rounded-xl p-3 flex items-center gap-2 ${STATUS_META[latestRequest.status].bg}`}>
            {(() => {
              const Icon = STATUS_META[latestRequest.status].icon
              return <Icon size={16} className={STATUS_META[latestRequest.status].color} />
            })()}
            <div className="flex-1">
              <p className={`text-[12px] font-medium ${STATUS_META[latestRequest.status].color}`}>
                最近变更：{STATUS_META[latestRequest.status].label}
              </p>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                {latestRequest.fields.map((f) => f.label).join("、")} · {latestRequest.submittedAt}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 店铺信息编辑 */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-semibold text-text-heading flex items-center gap-1.5">
              <Store size={16} /> 店铺信息
            </p>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-[12px] text-primary">
                编辑
              </button>
            )}
          </div>

          {[
            { icon: Clock, label: "营业时间", key: "hours" as const },
            { icon: Phone, label: "联系电话", key: "phone" as const },
          ].map(({ icon: Icon, label, key }) => (
            <div key={key} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <Icon size={16} className="text-text-tertiary shrink-0" />
              <span className="text-[13px] text-text-secondary w-20">{label}</span>
              {editing ? (
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="flex-1 text-[13px] text-right outline-none bg-gray-50 rounded px-2 py-1"
                />
              ) : (
                <span className="flex-1 text-[13px] text-text-heading text-right">{form[key]}</span>
              )}
            </div>
          ))}

          <div className="py-3">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={16} className="text-text-tertiary shrink-0" />
              <span className="text-[13px] text-text-secondary">店铺简介</span>
            </div>
            {editing ? (
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full text-[13px] outline-none bg-gray-50 rounded-lg p-2 resize-none"
              />
            ) : (
              <p className="text-[13px] text-text-body leading-relaxed">{form.description}</p>
            )}
          </div>

          {editing && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setForm({ hours: merchant.hours, phone: merchant.phone, description: merchant.description })
                  setEditing(false)
                }}
                className="flex-1 h-10 rounded-xl bg-gray-100 text-text-body text-[13px]"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 h-10 rounded-xl bg-primary text-white text-[13px] font-medium"
              >
                提交审核
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] text-text-quaternary mt-4 px-8">
        店铺信息变更需平台审核通过后生效，保障古城商铺信息准确
      </p>
    </div>
  )
}
