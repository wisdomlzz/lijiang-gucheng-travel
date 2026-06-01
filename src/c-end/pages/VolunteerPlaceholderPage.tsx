import { useEffect, useState } from "react"
import { Heart, Phone, User, Building2 } from "lucide-react"
import { PageHeader } from "./shop/PageHeader"
import { useVolunteerStore } from "../../shared/stores/volunteer-store"
import { useNavigate } from "react-router"
import { toast } from "sonner"

const POLITICAL_OPTIONS = ["中共党员", "共青团员", "群众", "其他"]

export function VolunteerPlaceholderPage() {
  const navigate = useNavigate()
  const register = useVolunteerStore((s) => s.register)
  const getByUserId = useVolunteerStore((s) => s.getByUserId)

  const [userId] = useState("user-1")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [politicalStatus, setPoliticalStatus] = useState("")
  const [workUnit, setWorkUnit] = useState("")

  const existing = getByUserId(userId)

  useEffect(() => {
    if (existing) navigate("/c/volunteer/activities", { replace: true })
  }, [existing, navigate])

  const handleSubmit = () => {
    const res = register(userId, name, phone, politicalStatus, workUnit)
    toast.success(res.msg)
    if (res.ok) navigate("/c/volunteer/activities", { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface-page pb-6">
      <PageHeader title="志愿者注册" back="/c/home" />

      <div className="px-4 py-6">
        <div className="rounded-3xl bg-white p-5 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Heart size={22} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-text-heading">志愿者注册</h2>
              <p className="text-[12px] text-text-tertiary">填写信息完成注册，即可报名参与活动</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[13px] text-text-secondary mb-1.5 block">姓名</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入姓名"
                  className="w-full h-[42px] rounded-xl border border-[#E5E7EB] bg-surface-page pl-9 pr-3 text-[14px] outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] text-text-secondary mb-1.5 block">电话</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  maxLength={11}
                  className="w-full h-[42px] rounded-xl border border-[#E5E7EB] bg-surface-page pl-9 pr-3 text-[14px] outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] text-text-secondary mb-1.5 block">政治面貌</label>
              <div className="flex gap-2 flex-wrap">
                {POLITICAL_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPoliticalStatus(opt)}
                    className={`px-4 py-2 rounded-full text-[13px] border transition-colors ${
                      politicalStatus === opt
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-text-secondary border-[#E5E7EB]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[13px] text-text-secondary mb-1.5 block">工作单位</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  value={workUnit}
                  onChange={(e) => setWorkUnit(e.target.value)}
                  placeholder="请输入工作单位"
                  className="w-full h-[42px] rounded-xl border border-[#E5E7EB] bg-surface-page pl-9 pr-3 text-[14px] outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full h-[44px] rounded-full bg-primary text-white text-[15px] font-medium mt-2"
            >
              提交注册
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
