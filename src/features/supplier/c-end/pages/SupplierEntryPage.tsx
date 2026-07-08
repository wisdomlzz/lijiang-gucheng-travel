import { useState } from "react"
import { useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { useSupplierStore } from "../../../../features/supplier/store/supplier-store"
import { PHONE_REGEX } from "@/shared/utils/validation"
import { Building2, User, Phone, MapPin, FileText, AlignLeft, CheckCircle } from "lucide-react"
import { toast } from "sonner"

const BUSINESS_TYPES = ["餐饮", "住宿", "酒吧", "文创", "手工艺", "服装", "其他"]

export function SupplierEntryPage() {
  const navigate = useNavigate()
  const addApplication = useSupplierStore((s) => s.addApplication)

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    businessType: "",
    address: "",
    licenseNo: "",
    description: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.companyName.trim()) errs.companyName = "请填写公司/店铺名称"
    if (!form.contactName.trim()) errs.contactName = "请填写联系人"
    if (!form.phone.trim()) errs.phone = "请填写联系电话"
    else if (!PHONE_REGEX.test(form.phone)) errs.phone = "手机号格式不正确"
    if (!form.businessType) errs.businessType = "请选择经营类型"
    if (!form.address.trim()) errs.address = "请填写经营地址"
    if (!form.licenseNo.trim()) errs.licenseNo = "请填写营业执照号"
    if (!form.description.trim()) errs.description = "请填写经营范围简介"
    return errs
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    addApplication({
      companyName: form.companyName,
      contactName: form.contactName,
      phone: form.phone,
      businessType: form.businessType,
      address: form.address,
      licenseNo: form.licenseNo,
      licenseImg: "",
      description: form.description,
    })
    setSubmitted(true)
    toast.success("入驻申请已提交，等待平台审核")
  }

  if (submitted) {
    return (
      <div className="min-h-full bg-surface-page flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-[18px] font-semibold text-text-heading mb-2">申请已提交</h2>
        <p className="text-[13px] text-text-secondary text-center mb-6">
          平台将在 1-3 个工作日内完成审核
          <br />
          审核通过后您可在桌面端管理商品和服务
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

  return (
    <div className="min-h-full bg-surface-page pb-8">
      <PageHeader title="线上商城供应商入驻" back="/c/merchant-services" />

      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
          <p className="text-[13px] text-text-secondary mb-5">
            申请成为线上商城供应商，审核通过后可在平台商城上架商品或服务。
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                <Building2 size={14} className="text-primary" /> 公司/店铺名称
              </label>
              <input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="请输入公司或店铺名称"
                className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.companyName ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary focus:ring-2 focus:ring-primary/20"}`}
              />
              {errors.companyName && <p className="text-[11px] text-red-500 mt-1">{errors.companyName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <User size={14} className="text-primary" /> 联系人
                </label>
                <input
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="姓名"
                  className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.contactName ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`}
                />
                {errors.contactName && <p className="text-[11px] text-red-500 mt-1">{errors.contactName}</p>}
              </div>
              <div>
                <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                  <Phone size={14} className="text-primary" /> 联系电话
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="手机号"
                  className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.phone ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`}
                />
                {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                <Building2 size={14} className="text-primary" /> 经营类型
              </label>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, businessType: t })
                      setErrors({ ...errors, businessType: "" })
                    }}
                    className={`px-4 h-9 rounded-full text-[12px] transition-all ${form.businessType === t ? "bg-primary text-white" : "bg-surface-page text-text-secondary"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {errors.businessType && <p className="text-[11px] text-red-500 mt-1">{errors.businessType}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                <MapPin size={14} className="text-primary" /> 经营地址
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="详细地址"
                className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.address ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`}
              />
              {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                <FileText size={14} className="text-primary" /> 营业执照号
              </label>
              <input
                value={form.licenseNo}
                onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                placeholder="统一社会信用代码"
                className={`w-full h-11 px-4 rounded-xl border text-[13px] outline-none ${errors.licenseNo ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`}
              />
              {errors.licenseNo && <p className="text-[11px] text-red-500 mt-1">{errors.licenseNo}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1 text-[13px] text-text-body mb-1.5">
                <AlignLeft size={14} className="text-primary" /> 经营范围简介
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="简要描述经营范围和特色"
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border text-[13px] outline-none resize-none ${errors.description ? "border-red-300 bg-red-50" : "border-border-light focus:border-primary"}`}
              />
              {errors.description && <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>}
            </div>

            <button type="submit" className="w-full h-12 rounded-full bg-primary text-white text-[14px] font-medium">
              提交入驻申请
            </button>
          </form>

          <p className="text-center text-[11px] text-text-tertiary mt-4">
            提交后由平台管理员审核，审核通过后可在桌面端管理商品
          </p>
        </div>
      </div>
    </div>
  )
}
