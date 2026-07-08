import { useState } from "react"
import { useNavigate } from "react-router"
import { ChevronRight, ArrowLeft, Phone, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { MiniProgramFrame } from "./MiniProgramFrame"
import { useAuthStore } from "@/platform/auth"
import { seedUsers } from "../types/seed-users"
import type { User } from "../types"
import { api } from "@/api/client"

const HERO_IMG = "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=800&q=70"

/** B-end staff users available for quick-select login */
const B_STAFF_USERS: User[] = seedUsers.filter(
  (u) => u.platform.includes("b") && (u.roles.includes("service") || u.roles.includes("platform_admin"))
)

export function LoginPageB() {
  const [showPhone, setShowPhone] = useState(false)
  const [phone, setPhone] = useState("")
  const login = useAuthStore((s) => s.login)
  const currentUser = useAuthStore((s) => s.user)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const navigate = useNavigate()

  const handleStaffLogin = async (user: User) => {
    try {
      const { token, user: serverUser } = await api.login(user.phone)
      login(serverUser, "b", token)
    } catch {
      // Backend unavailable: fall back to seed user + mock token
      login(user, "b", "mock-token-" + user.id)
    }
    navigate("/b/service/workbench")
  }

  const handlePhoneLogin = async () => {
    if (!phone) return
    const matched = seedUsers.find((u) => u.phone === phone && u.platform.includes("b"))
    if (!matched) return
    await handleStaffLogin(matched)
  }

  return (
    <MiniProgramFrame>
      <div className="flex flex-col min-h-full bg-white">
        {/* ── Hero image ── */}
        <div className="relative shrink-0 h-[260px] overflow-hidden">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-blue-950/50 to-blue-950/90" />

          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-[68px] h-[68px] rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-2xl ring-1 ring-white/20">
                <span className="text-[30px] text-white font-bold drop-shadow-lg">服</span>
              </div>
              <h1 className="text-[24px] text-white font-bold tracking-[0.04em] drop-shadow-lg">服务人员端</h1>
              <p className="text-white/60 text-[12px] mt-1 tracking-[0.1em]">丽江古城游 · 服务端</p>
            </motion.div>
          </div>
        </div>

        {/* ── Card area ── */}
        <div className="relative -mt-6 bg-white rounded-t-[28px] flex-1 px-6 pt-7 pb-4">
          {/* Role badges */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex justify-center gap-2.5 mb-7"
          >
            <div className="flex-1 max-w-[160px] rounded-xl border border-blue-100 bg-blue-50 text-blue-600 px-3 py-2.5 text-center">
              <div className="text-[13px] font-medium">服务人员</div>
              <div className="text-[10px] opacity-60 mt-0.5">接单 · 报价 · 服务</div>
            </div>
            <div className="flex-1 max-w-[160px] rounded-xl border border-blue-100 bg-blue-50 text-blue-600 px-3 py-2.5 text-center">
              <div className="text-[13px] font-medium">平台管理员</div>
              <div className="text-[10px] opacity-60 mt-0.5">管理 · 监控 · 配置</div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {!showPhone ? (
              <motion.div
                key="staff-select"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {/* Section title */}
                <div className="text-center mb-5">
                  <h2 className="text-[16px] text-text-heading font-medium">选择账号登录</h2>
                  <p className="text-[12px] text-text-tertiary mt-1">点击下方账号即可快速登录</p>
                </div>

                {/* Staff account cards */}
                <div className="space-y-2.5">
                  {B_STAFF_USERS.map((user, i) => {
                    const isAdmin = user.roles.includes("platform_admin")
                    return (
                      <motion.button
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 + i * 0.1 }}
                        onClick={() => handleStaffLogin(user)}
                        className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-gray-100 active:scale-[0.98] hover:bg-blue-50/50 hover:border-blue-100 transition-all text-left"
                        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold text-[15px] shadow-sm ${
                            isAdmin
                              ? "bg-gradient-to-br from-blue-600 to-indigo-700"
                              : "bg-gradient-to-br from-emerald-500 to-emerald-600"
                          }`}
                        >
                          {user.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-text-heading">{user.name}</p>
                          <p className="text-[11px] text-text-tertiary mt-0.5 flex items-center gap-1">
                            {isAdmin ? (
                              <>
                                <ShieldCheck size={11} className="text-blue-500" />
                                <span className="text-blue-500">平台管理员</span>
                              </>
                            ) : (
                              <span>便民服务人员</span>
                            )}
                            <span className="mx-1">·</span>
                            {user.phone}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-text-tertiary shrink-0" />
                      </motion.button>
                    )
                  })}
                </div>

                {/* Other login method */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="mt-5"
                >
                  <button
                    onClick={() => setShowPhone(true)}
                    className="mx-auto flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-primary transition-colors"
                  >
                    <Phone size={13} />
                    手机号登录
                    <ChevronRight size={14} />
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="phone-login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {/* Back button */}
                <button
                  onClick={() => {
                    setShowPhone(false)
                    setPhone("")
                  }}
                  className="mb-4 flex items-center gap-1 text-[13px] text-text-tertiary"
                >
                  <ArrowLeft size={16} /> 返回账号选择
                </button>

                <div className="text-center mb-5">
                  <h2 className="text-[16px] text-text-heading font-medium">手机号登录</h2>
                  <p className="text-[12px] text-text-tertiary mt-1">输入已注册的手机号直接登录</p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.slice(0, 11))}
                      maxLength={11}
                      placeholder="请输入手机号"
                      className="w-full h-[48px] rounded-xl bg-[#F5F5F5] px-4 text-[14px] outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all"
                    />
                  </div>
                  <button
                    onClick={handlePhoneLogin}
                    disabled={!phone}
                    className="w-full h-[48px] rounded-xl bg-primary text-white font-medium text-[15px] active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-primary/20"
                  >
                    登录
                  </button>
                </div>

                {/* Quick-select for matched phone */}
                {phone.length === 11 && (() => {
                  const matched = seedUsers.find((u) => u.phone === phone && u.platform.includes("b"))
                  return matched ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-3"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-[14px] shadow-sm ${
                          matched.roles.includes("platform_admin")
                            ? "bg-gradient-to-br from-blue-600 to-indigo-700"
                            : "bg-gradient-to-br from-emerald-500 to-emerald-600"
                        }`}
                      >
                        {matched.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-text-heading">{matched.name}</p>
                        <p className="text-[11px] text-text-tertiary">{matched.roleTag ?? (matched.roles.includes("platform_admin") ? "平台管理员" : "便民服务人员")}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <p className="mt-3 text-[11px] text-text-tertiary text-center">
                      未找到该手机号对应的服务人员账号
                    </p>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom links */}
          <div className="mt-6 pt-4 border-t border-[#F3F3F3] space-y-2">
            {isLoggedIn && currentUser && !currentUser.platform.includes("b") && (
              <p className="text-[11px] text-text-tertiary text-center">
                当前已登录：{currentUser.name}（{currentUser.phone}）
              </p>
            )}
            <button
              onClick={() => navigate("/c")}
              className="w-full text-center text-[12px] text-text-tertiary hover:text-primary transition-colors py-1"
            >
              我是游客 <ChevronRight size={12} className="inline" />
            </button>
            <button
              onClick={() => {
                const w = window.open("/desktop", "_blank")
                w?.focus()
              }}
              className="w-full text-center text-[12px] text-text-tertiary hover:text-primary transition-colors py-1"
            >
              管理后台登录 <ChevronRight size={12} className="inline" />
            </button>
          </div>
        </div>
      </div>
    </MiniProgramFrame>
  )
}