import { useState } from "react"
import { useNavigate } from "react-router"
import { Building2, User, Phone, MapPin, FileText, AlignLeft, Check } from "lucide-react"
import { toast } from "sonner"
import { useSupplierStore } from "../../../features/supplier/store"
import { ImageUpload } from "../../../shared/components/ui/image-upload"

const BUSINESS_TYPES = ["餐饮", "住宿", "酒吧", "文创", "手工艺", "服装", "其他"]

export function SupplierEntryDesktop() {
  const navigate = useNavigate()
  const addApplication = useSupplierStore((s) => s.addApplication)

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    businessType: "",
    address: "",
    licenseNo: "",
    licenseImg: "",
    description: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.companyName.trim()) errs.companyName = "请填写公司名称"
    if (!form.contactName.trim()) errs.contactName = "请填写联系人"
    if (!form.phone.trim()) errs.phone = "请填写联系电话"
    else if (!/^1[3-9]\d{9}$/.test(form.phone)) errs.phone = "手机号格式不正确"
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
    addApplication(form)
    toast.success("提交成功，等待审核")
    navigate("/desktop/login", { state: { submitted: true } })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">供应商入驻申请</h1>
          <p className="text-sm text-slate-500 mt-2">入驻丽江古城游平台，开启您的商业之旅</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
              <Building2 size={14} /> 公司/店铺名称
            </label>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="请输入公司/店铺名称"
              className={`w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all ${
                errors.companyName
                  ? "border-red-400 bg-red-50"
                  : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              }`}
            />
            {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                <User size={14} /> 联系人
              </label>
              <input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="姓名"
                className={`w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all ${
                  errors.contactName ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                <Phone size={14} /> 联系电话
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="手机号"
                className={`w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all ${
                  errors.phone ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">经营类型</label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, businessType: t })}
                  className={`px-4 h-9 rounded-full text-sm transition-all ${
                    form.businessType === t
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {errors.businessType && <p className="text-xs text-red-500 mt-1">{errors.businessType}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
              <MapPin size={14} /> 经营地址
            </label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="请输入详细地址"
              className={`w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all ${
                errors.address ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
              <FileText size={14} /> 营业执照号
            </label>
            <input
              value={form.licenseNo}
              onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
              placeholder="统一社会信用代码"
              className={`w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all ${
                errors.licenseNo ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {errors.licenseNo && <p className="text-xs text-red-500 mt-1">{errors.licenseNo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
              <FileText size={14} /> 营业执照照片
            </label>
            <ImageUpload
              value={form.licenseImg}
              onChange={(v) => setForm({ ...form, licenseImg: v })}
              error={!!errors.licenseImg}
            />
            {errors.licenseImg && <p className="text-xs text-red-500 mt-1">{errors.licenseImg}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
              <AlignLeft size={14} /> 经营范围简介
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="请简要描述您的经营范围和特色"
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all resize-none ${
                errors.description ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <Check size={18} />
            提交申请
          </button>

          <p className="text-center text-xs text-slate-400">提交后预计 1-3 个工作日内完成审核</p>
        </form>

        {/* Back */}
        <button
          onClick={() => navigate("/desktop/login")}
          className="w-full mt-4 text-center text-sm text-slate-500 hover:text-blue-600 transition-colors"
        >
          返回登录
        </button>
      </div>
    </div>
  )
}
