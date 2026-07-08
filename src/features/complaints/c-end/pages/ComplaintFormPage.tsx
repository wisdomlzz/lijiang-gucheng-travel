import { useState } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router"
import { ChevronLeft, Camera, X, Phone, ChevronDown } from "lucide-react"
import { useComplaintStore } from "../../store"
import { useAuthStore } from "@/platform/auth"
import { BottomSheetPicker } from "../../../../shared/components/ui/bottom-sheet-picker"
import { PHONE_REGEX } from "@/shared/utils/validation"
import { toast } from "sonner"

const reporterTypes = ["工作人员", "本地居民", "游客"] as const

const objectTypes = ["酒吧", "客栈", "旅拍摄影", "餐饮", "商品零售", "民居", "公共环境", "其他", "个人"]

const areas = ["大研街道", "四方街社区", "七一社区", "新华社区", "五一社区"]
const locations = ["四方街", "五一街片区", "七一街片区", "新华街片区", "大水车周边", "木府周边"]
const issueTypes = ["服务态度", "服务质量", "服务时效", "价格争议", "安全隐患", "环境卫生", "噪音扰民", "其他"]

type ReporterType = (typeof reporterTypes)[number]

export function ComplaintFormPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const userId = currentUser?.id ?? "u_c_001"
  const createComplaint = useComplaintStore((s) => s.createComplaint)
  const complaintPhone = useComplaintStore((s) => s.complaintPhone)
  const [reporterType, setReporterType] = useState<ReporterType>("游客")
  const [reporterName, setReporterName] = useState("")
  const [gender, setGender] = useState<"男" | "女" | "">("")
  const [phone, setPhone] = useState("")
  const [objectType, setObjectType] = useState("")
  const [targetName, setTargetName] = useState("")
  const [area, setArea] = useState("")
  const [location, setLocation] = useState("")
  const [doorplate, setDoorplate] = useState("")
  const [issueType, setIssueType] = useState("")
  const [content, setContent] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setField = (key: string) =>
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })

  const validate = () => {
    const next: Record<string, string> = {}
    if (!reporterName.trim()) next.reporterName = "请填写上报人"
    if (!gender) next.gender = "请选择性别"
    if (!phone.trim()) next.phone = "请填写联系电话"
    else if (!PHONE_REGEX.test(phone)) next.phone = "请输入正确的手机号码"
    if (!objectType) next.objectType = "请选择对象类型"
    if (!targetName.trim()) next.targetName = "请填写当事对象"
    if (!area) next.area = "请选择片区"
    if (!location) next.location = "请选择事发地点"
    if (!doorplate.trim()) next.doorplate = "请填写门牌号"
    if (!issueType) next.issueType = "请选择问题类型"
    if (content.trim().length < 10) next.content = "请至少填写10个字"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const addImage = () => {
    if (images.length >= 3) {
      toast.error("最多上传3张照片")
      return
    }
    const seeds = [
      "https://images.unsplash.com/photo-1562621019-4d2f3980df96?w=400&q=70",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=70",
      "https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=400&q=70",
    ]
    setImages([...images, seeds[images.length]])
  }

  const submit = () => {
    if (!validate()) return
    createComplaint({
      orderId: "",
      userId: userId,
      type: issueType,
      content,
      images,
      targetName,
      reporterType,
      reporterName,
      reporterGender: gender as "男" | "女",
      reporterPhone: phone,
      objectType: objectType as
        "酒吧" | "客栈" | "旅拍摄影" | "餐饮" | "商品零售" | "民居" | "公共环境" | "其他" | "个人" | undefined,
      incidentArea: area,
      incidentLocation: location,
      doorplate,
      channelNote: "小程序自有投诉渠道，非微信官方投诉渠道",
    })
    toast.success("投诉已提交，平台将在24小时内受理")
    navigate("/c/my-complaints")
  }

  return (
    <div className="min-h-screen bg-surface-page pb-8">
      <div className="relative h-[132px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=900&q=70"
          alt="丽江古城"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/45" />
        <div className="relative z-10 h-12 flex items-center px-4">
          <button
            onClick={() => navigate(-1)}
            className="size-9 -ml-2 rounded-full flex items-center justify-center active:scale-95"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <div className="flex-1 text-center text-[16px] font-semibold text-white">游客投诉</div>
          <div className="w-9" />
        </div>
        <p className="absolute left-5 right-5 bottom-5 text-[13px] leading-relaxed text-white font-medium">
          此投诉为本小程序自有投诉渠道，非微信官方投诉渠道
        </p>
      </div>

      <div className="-mt-4 relative z-10 px-3 space-y-4">
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <SectionTitle title="上报人信息" />
          <div className="flex gap-2 mb-4">
            {reporterTypes.map((t) => (
              <button
                key={t}
                onClick={() => setReporterType(t)}
                className={`flex-1 h-10 rounded-full text-[13px] font-medium transition-all ${
                  reporterType === t
                    ? "bg-primary text-white shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
                    : "bg-slate-100 text-text-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            <InputRow required label="上报人" error={errors.reporterName}>
              <input
                value={reporterName}
                onChange={(e) => {
                  setReporterName(e.target.value)
                  setField("reporterName")
                }}
                placeholder="请输入上报人姓名"
                className="field-input"
              />
            </InputRow>
            <InputRow required label="性别" error={errors.gender}>
              <div className="flex gap-8 text-[14px] text-text-body">
                {(["男", "女"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setGender(g)
                      setField("gender")
                    }}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={`size-4 rounded-full border flex items-center justify-center ${gender === g ? "border-primary" : "border-slate-300"}`}
                    >
                      {gender === g && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    {g}
                  </button>
                ))}
              </div>
            </InputRow>
            <InputRow required label="联系电话" error={errors.phone}>
              <input
                value={phone}
                maxLength={11}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""))
                  setField("phone")
                }}
                placeholder="请输入联系电话"
                className="field-input"
              />
            </InputRow>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <SectionTitle title="当事对象信息" />
          <div className="mb-4">
            <SelectRow
              required
              label="对象类型"
              value={objectType}
              placeholder="请选择对象类型"
              options={objectTypes}
              error={errors.objectType}
              onChange={(v) => {
                setObjectType(v)
                setField("objectType")
              }}
            />
          </div>
          <div className="divide-y divide-slate-100">
            <InputRow required label="当事对象" error={errors.targetName}>
              <input
                value={targetName}
                onChange={(e) => {
                  setTargetName(e.target.value)
                  setField("targetName")
                }}
                placeholder="请输入当事对象名称"
                className="field-input"
              />
            </InputRow>
            <SelectRow
              required
              label="事发片区"
              value={area}
              placeholder="请选择"
              options={areas}
              error={errors.area}
              onChange={(v) => {
                setArea(v)
                setField("area")
              }}
            />
            <SelectRow
              required
              label="事发地点"
              value={location}
              placeholder="请选择"
              options={locations}
              error={errors.location}
              onChange={(v) => {
                setLocation(v)
                setField("location")
              }}
            />
            <InputRow required label="门牌号" error={errors.doorplate}>
              <input
                value={doorplate}
                onChange={(e) => {
                  setDoorplate(e.target.value)
                  setField("doorplate")
                }}
                placeholder="请输入门牌号"
                className="field-input"
              />
            </InputRow>
            <SelectRow
              required
              label="问题类型"
              value={issueType}
              placeholder="请选择问题类型"
              options={issueTypes}
              error={errors.issueType}
              onChange={(v) => {
                setIssueType(v)
                setField("issueType")
              }}
            />
            <InputRow required label="反映内容" alignTop error={errors.content}>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setField("content")
                }}
                placeholder="请输入反映内容"
                rows={5}
                className="w-full rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-[14px] outline-none focus:border-primary resize-none"
              />
            </InputRow>
            <div className="py-3">
              <div className="flex items-center gap-3">
                <span className="w-[96px] text-[14px] font-medium text-text-body">现场照片</span>
                <div className="flex gap-2">
                  {images.map((img, index) => (
                    <div key={img} className="relative size-16 rounded-xl overflow-hidden bg-slate-100">
                      <img src={img} alt="投诉附件" className="h-full w-full object-cover" />
                      <button
                        onClick={() => setImages(images.filter((_, i) => i !== index))}
                        className="absolute right-1 top-1 size-5 rounded-full bg-black/55 text-white grid place-items-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <button
                      onClick={addImage}
                      className="size-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 grid place-items-center"
                    >
                      <Camera size={22} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {complaintPhone && (
          <div className="rounded-2xl bg-white p-3 flex items-center gap-2 text-[12px] text-text-tertiary shadow-sm">
            <Phone size={14} className="text-primary" />
            紧急问题可拨打平台投诉电话
            <a href={`tel:${complaintPhone}`} className="text-primary font-medium">
              {complaintPhone}
            </a>
          </div>
        )}

        <button
          onClick={submit}
          className="w-full h-12 rounded-full bg-primary text-white text-[15px] font-medium active:scale-[0.98] transition-transform"
        >
          提交投诉
        </button>
      </div>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1 h-5 rounded-full bg-primary" />
      <h2 className="text-[17px] font-semibold text-text-heading">{title}</h2>
    </div>
  )
}

function InputRow({
  label,
  required,
  children,
  error,
  alignTop,
}: {
  label: string
  required?: boolean
  children: ReactNode
  error?: string
  alignTop?: boolean
}) {
  return (
    <div className={`py-3 ${alignTop ? "items-start" : "items-center"} flex gap-3`}>
      <span className={`w-[96px] text-[14px] font-medium ${error ? "text-red-500" : "text-text-body"}`}>
        {required && <span className="text-red-500">*</span>}
        {label}
      </span>
      <div className="flex-1 min-w-0">
        {children}
        {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  )
}

function SelectRow({
  label,
  required,
  value,
  placeholder,
  options,
  error,
  onChange,
}: {
  label: string
  required?: boolean
  value: string
  placeholder: string
  options: string[]
  error?: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <InputRow label={label} required={required} error={error}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`w-full h-11 rounded-xl border border-slate-100 bg-slate-50/60 px-3 text-left text-[14px] flex items-center justify-between ${
            value ? "text-text-body" : "text-slate-400"
          }`}
        >
          <span>{value || placeholder}</span>
          <ChevronDown size={16} className="text-text-tertiary" />
        </button>
      </InputRow>
      <BottomSheetPicker
        open={open}
        onClose={() => setOpen(false)}
        title={`选择${label}`}
        options={options}
        value={value}
        onSelect={onChange}
      />
    </>
  )
}
