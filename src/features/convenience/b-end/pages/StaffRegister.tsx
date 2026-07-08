import { useState } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft, Wrench, Check } from "lucide-react"
import { api } from "@/api/client"
import { useAuthStore } from "@/platform/auth"
import { toast } from "sonner"
import { ALL_CONVENIENCE_TYPES } from "@/features/convenience/shared/types"

export function StaffRegister() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const supplierId = currentUser?.supplierId || "sup_001"
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [idCard, setIdCard] = useState("")
  const [idCardFront, setIdCardFront] = useState("")
  const [idCardBack, setIdCardBack] = useState("")
  const [serviceTypes, setServiceTypes] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const toggleServiceType = (type: string) => {
    setServiceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("请输入姓名")
      return
    }
    if (!phone.trim()) {
      toast.error("请输入手机号")
      return
    }
    if (!idCard.trim()) {
      toast.error("请输入身份证号")
      return
    }
    if (serviceTypes.length === 0) {
      toast.error("请选择至少一项服务类型")
      return
    }

    setSubmitting(true)
    try {
      await api.create("staff", {
        supplierId: supplierId,
        name: name.trim(),
        phone: phone.trim(),
        idCard: idCard.trim(),
        idCardFront: idCardFront.trim() || undefined,
        idCardBack: idCardBack.trim() || undefined,
        serviceTypes,
        applyStatus: "pending",
        enabled: false,
        status: "offline",
        staffType: "partner",
        assignedOrders: 0,
        joinedAt: new Date().toISOString().slice(0, 10),
      })
      toast.success("入驻申请已提交，请等待管理员审核")
      navigate("/b/login")
    } catch (err) {
      toast.error(`提交失败：${(err as Error).message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-6"
        style={{
          background: "linear-gradient(180deg, #FCD9A8 0%, #FDE7C8 60%, #EFF6FC 100%)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="size-8 rounded-full bg-white/80 backdrop-blur-xl flex items-center justify-center"
          >
            <ArrowLeft className="size-4" style={{ color: "#F59E0B" }} />
          </button>
          <div>
            <h1 className="text-[18px] font-medium text-text-heading">服务人员入驻</h1>
            <p className="text-[12px] text-text-caption mt-0.5">填写信息提交审核</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/85 backdrop-blur-xl rounded-2xl p-3 shadow-[0_4px_16px_rgba(60,120,200,0.10)]">
          <div
            className="size-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#F59E0B14", color: "#F59E0B" }}
          >
            <Wrench className="size-5" />
          </div>
          <div className="text-[12px] text-text-tertiary">
            入驻成为丽江古城便民服务人员，为游客提供优质服务
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 -mt-2 space-y-3">
        <form onSubmit={handleSubmit}>
          {/* 基本信息 */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)] space-y-3">
            <h3 className="text-[14px] font-medium text-text-heading">基本信息</h3>

            <div>
              <label className="text-[12px] text-text-caption mb-1.5 block">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入真实姓名"
                className="w-full h-11 rounded-xl border border-border-light px-3.5 text-[14px] outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>

            <div>
              <label className="text-[12px] text-text-caption mb-1.5 block">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full h-11 rounded-xl border border-border-light px-3.5 text-[14px] outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>

            <div>
              <label className="text-[12px] text-text-caption mb-1.5 block">
                身份证号 <span className="text-red-500">*</span>
              </label>
              <input
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                placeholder="请输入身份证号"
                className="w-full h-11 rounded-xl border border-border-light px-3.5 text-[14px] outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>
          </div>

          {/* 证件照片 */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)] space-y-3">
            <h3 className="text-[14px] font-medium text-text-heading">证件照片</h3>

            <div>
              <label className="text-[12px] text-text-caption mb-1.5 block">身份证正面照</label>
              <input
                value={idCardFront}
                onChange={(e) => setIdCardFront(e.target.value)}
                placeholder="粘贴图片链接或留空"
                className="w-full h-11 rounded-xl border border-border-light px-3.5 text-[14px] outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>

            <div>
              <label className="text-[12px] text-text-caption mb-1.5 block">身份证反面照</label>
              <input
                value={idCardBack}
                onChange={(e) => setIdCardBack(e.target.value)}
                placeholder="粘贴图片链接或留空"
                className="w-full h-11 rounded-xl border border-border-light px-3.5 text-[14px] outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>
          </div>

          {/* 服务类型 */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)]">
            <h3 className="text-[14px] font-medium text-text-heading mb-3">
              服务类型 <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ALL_CONVENIENCE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleServiceType(type)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[13px] border transition ${
                    serviceTypes.includes(type)
                      ? "border-[#F59E0B] bg-[#F59E0B0A] text-[#D97706]"
                      : "border-border-light text-text-body hover:border-[#FCD9A8]"
                  }`}
                >
                  <div
                    className={`size-4 rounded flex items-center justify-center ${
                      serviceTypes.includes(type)
                        ? "bg-[#F59E0B] text-white"
                        : "border border-border-light"
                    }`}
                  >
                    {serviceTypes.includes(type) && <Check className="size-3" />}
                  </div>
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-2xl text-white text-[15px] font-medium disabled:opacity-60 active:scale-[0.98] transition-transform"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #FCD34D)",
              boxShadow: "0 4px 16px rgba(245,158,11,0.32)",
            }}
          >
            {submitting ? "提交中..." : "提交入驻申请"}
          </button>
        </form>
      </div>
    </div>
  )
}