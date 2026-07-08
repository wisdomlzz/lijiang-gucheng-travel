import { useState, useRef } from "react"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { MapPin, ChevronDown, Camera, X } from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { readFileAsDataURL } from "@/shared/utils/validation"

const areaOptions = ["古城", "白沙", "束河"]

const areaTypeMap: Record<string, string[]> = {
  古城: ["历史街巷", "水系", "古井", "桥梁", "古树名木", "公共构筑物", "代表性民居", "文保单位", "人文环境", "商户"],
  白沙: ["历史街巷", "水系", "古井", "桥梁", "古树名木", "公共构筑物", "代表性民居", "文保单位", "人文环境", "商户"],
  束河: ["历史街巷", "水系", "古井", "桥梁", "古树名木", "公共构筑物", "代表性民居", "文保单位", "人文环境", "商户"],
}

const typeObjectMap: Record<string, string[]> = {
  历史街巷: ["四方街", "卖草场", "新华街", "五一街", "七一街", "新义街", "光义街"],
  水系: ["四方街", "卖草场", "新华街", "五一街", "七一街", "新义街", "光义街"],
  古井: ["四方街", "卖草场", "新华街", "五一街", "七一街", "新义街", "光义街"],
  桥梁: ["四方街", "卖草场", "新华街", "五一街", "七一街", "新义街", "光义街"],
  古树名木: ["四方街", "卖草场", "新华街", "五一街", "七一街", "新义街", "光义街"],
  公共构筑物: ["四方街", "卖草场", "新华街", "五一街", "七一街", "新义街", "光义街"],
  代表性民居: ["四方街", "卖草场", "新华街", "五一街", "七一街", "新义街", "光义街"],
  文保单位: ["四方街", "卖草场", "新华街", "五一街", "七一街", "新义街", "光义街"],
  人文环境: ["四方街", "卖草场", "新华街", "五一街", "七一街", "新义街", "光义街"],
  商户: ["四方街", "卖草场", "新华街", "五一街", "七一街", "新义街", "光义街"],
}

function SelectDropdown({
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  placeholder: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full h-11 rounded-xl px-4 text-[14px] text-left flex items-center justify-between outline-none transition-all ${
          disabled
            ? "bg-[#F3F3F5] text-text-tertiary cursor-not-allowed"
            : "bg-[#F3F3F5] focus:bg-white focus:ring-2 focus:ring-primary/20"
        }`}
      >
        <span className={value ? "text-text-body" : "text-text-tertiary"}>{value || placeholder}</span>
        <ChevronDown size={16} className={`text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-border-light py-1 max-h-48 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={`w-full px-4 h-10 text-left text-[14px] hover:bg-[#F5F5F5] ${opt === value ? "text-primary bg-primary-50" : "text-text-body"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function PhotoReportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [area, setArea] = useState("")
  const [type, setType] = useState("")
  const [object, setObject] = useState("")
  const [location, setLocation] = useState("")
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const typeOptions = area ? areaTypeMap[area] || [] : []
  const objectOptions = type ? typeObjectMap[type] || [] : []

  const handleAreaChange = (v: string) => {
    setArea(v)
    setType("")
    setObject("")
  }

  const handleTypeChange = (v: string) => {
    setType(v)
    setObject("")
  }

  const handleGetLocation = () => {
    setLocation("获取位置中...")
    setTimeout(() => {
      setLocation("云南省丽江市古城区四方街")
      toast.success("定位成功")
    }, 1000)
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    if (photos.length + files.length > 9) {
      toast.error("最多上传 9 张照片")
      return
    }
    const results = await Promise.all(Array.from(files).map(readFileAsDataURL))
    setPhotos((prev) => [...prev, ...results])
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!area) {
      toast.error("请选择片区")
      return
    }
    if (!type) {
      toast.error("请选择类型")
      return
    }
    if (!object) {
      toast.error("请选择对象")
      return
    }
    if (!location) {
      toast.error("请获取位置")
      return
    }
    if (!address.trim()) {
      toast.error("请输入详细地址")
      return
    }
    if (!description.trim()) {
      toast.error("请描述异常情况")
      return
    }
    if (photos.length === 0) {
      toast.error("请至少上传一张照片")
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    setShowSuccess(true)
  }

  return (
    <div className="min-h-full bg-surface-page flex flex-col">
      <PageHeader title="公众随手拍上报" back="/c/photo-records" />

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-24">
        {/* 基础信息 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-light">
            <span className="text-[15px] font-semibold text-text-heading">基础信息</span>
          </div>

          <div className="px-4 py-3 border-b border-border-light">
            <span className="text-[14px] text-text-body font-medium">遗产要素</span>
          </div>

          {/* 片区 / 类型 / 对象 */}
          <div className="flex gap-2 px-4 py-3 border-b border-border-light">
            <div className="flex-1">
              <label className="text-[12px] text-text-secondary mb-1.5 block">片区</label>
              <SelectDropdown value={area} options={areaOptions} onChange={handleAreaChange} placeholder="请选择片区" />
            </div>
            <div className="flex-1">
              <label className="text-[12px] text-text-secondary mb-1.5 block">类型</label>
              <SelectDropdown
                value={type}
                options={typeOptions}
                onChange={handleTypeChange}
                placeholder="请选择类型"
                disabled={!area}
              />
            </div>
            <div className="flex-1">
              <label className="text-[12px] text-text-secondary mb-1.5 block">对象</label>
              <SelectDropdown
                value={object}
                options={objectOptions}
                onChange={setObject}
                placeholder="请选择对象"
                disabled={!type}
              />
            </div>
          </div>

          {/* 位置 */}
          <div className="px-4 py-3 border-b border-border-light">
            <label className="text-[14px] text-text-body mb-1.5 block">
              <span className="text-destructive mr-0.5">*</span>位置
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="点击定位获取当前位置"
                className="w-full h-11 rounded-xl bg-[#F3F3F5] pl-4 pr-14 text-[14px] text-text-body outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                onClick={handleGetLocation}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-9 rounded-lg bg-[#8D6E63] flex items-center justify-center active:scale-95 transition-transform"
              >
                <MapPin size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* 详细地址 */}
          <div className="px-4 py-3">
            <label className="text-[14px] text-text-body mb-1.5 block">
              <span className="text-destructive mr-0.5">*</span>详细地址
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="请输入详细地址"
              className="w-full h-11 rounded-xl bg-[#F3F3F5] px-4 text-[14px] text-text-body outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* 补充信息 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-light">
            <span className="text-[15px] font-semibold text-text-heading">补充信息</span>
          </div>

          {/* 异常描述 */}
          <div className="px-4 py-3 border-b border-border-light">
            <label className="text-[14px] text-text-body mb-1.5 block">
              <span className="text-destructive mr-0.5">*</span>异常情况描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入异常情况描述"
              rows={3}
              className="w-full rounded-xl bg-[#F3F3F5] px-4 py-3 text-[14px] text-text-body outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* 照片上传 */}
          <div className="px-4 py-3">
            <label className="text-[14px] text-text-body mb-2 block">
              <span className="text-destructive mr-0.5">*</span>照片
            </label>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
              {photos.length < 9 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-1 bg-primary-50/50 active:scale-95 transition-transform"
                >
                  <Camera size={20} className="text-primary/50" />
                  <span className="text-[11px] text-text-tertiary">添加照片</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <p className="text-[11px] text-text-tertiary mt-2">支持JPG/PNG格式，支持多张上传</p>
          </div>
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 pb-6 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-30">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-12 rounded-full bg-primary text-white text-[15px] font-medium shadow-[0_4px_14px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {isSubmitting ? "提交中..." : "提交"}
        </button>
      </div>

      {/* 成功弹窗 */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="w-[280px] bg-white rounded-2xl p-6 text-center shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="text-[16px] font-semibold text-text-heading mb-3">感谢您的参与！</div>
            <div className="text-[14px] text-text-secondary mb-6 leading-relaxed">
              您的随手拍已成功提交，我们会尽快核实并安排巡检，一起守护丽江古城的美好！
            </div>
            <button
              onClick={() => navigate("/c/photo-records")}
              className="w-full h-11 rounded-full bg-primary text-white text-[14px] font-medium shadow-[0_4px_14px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-transform"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
