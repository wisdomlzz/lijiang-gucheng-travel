import { useState } from "react"
import { useNavigate } from "react-router"
import { ChevronRight, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { MiniProgramFrame } from "./MiniProgramFrame"
import { useAuthStore } from "@/platform/auth"
import { seedUsers } from "../types/seed-users"
import type { User } from "../types"
import { api } from "@/api/client"

const HERO_IMG = "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=800&q=70"

export function LoginPageB() {
  const [mode, setMode] = useState<"wechat" | "password">("wechat")
  const [showWechatAuth, setShowWechatAuth] = useState(false)
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const login = useAuthStore((s) => s.login)
  const currentUser = useAuthStore((s) => s.user)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const navigate = useNavigate()

  const handleWechatLogin = () => {
    setShowWechatAuth(true)
  }

  const getRolePath = (_role: string) => "service"

  const confirmWechatUser = async (user: User) => {
    try {
      const { token, user: serverUser } = await api.login(user.phone)
      login(serverUser, "b", token)
    } catch {
      login(user, "b", "mock-token-" + user.id)
    }
    navigate(`/b/${getRolePath(user.roles[0] ?? "service")}`)
  }

  const handlePasswordLogin = async () => {
    if (!phone) return
    try {
      const { token, user } = await api.login(phone)
      login(user, "b", token)
      navigate(`/b/${getRolePath(user.roles[0] ?? "service")}`)
    } catch {
      const user = seedUsers.find((u) => u.platform.includes("b") && u.roles.includes("service") && u.phone === phone)
      if (user) {
        login(user, "b", "mock-token-" + user.id)
        navigate(`/b/${getRolePath(user.roles[0] ?? "service")}`)
      }
    }
  }

  const bUsers = seedUsers.filter((u) => u.platform.includes("b") && u.roles.includes("service"))

  // WeChat auth — role selection screen
  if (showWechatAuth) {
    return (
      <MiniProgramFrame>
        <div className="flex flex-col min-h-full bg-white">
          {/* Compact header */}
          <div className="relative h-[160px] overflow-hidden shrink-0">
            <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-indigo-900/60 to-white" />
          </div>

          <div className="relative -mt-16 bg-white rounded-t-[28px] flex-1 px-6 pt-6">
            <button
              onClick={() => setShowWechatAuth(false)}
              className="mb-4 flex items-center gap-1 text-[13px] text-text-tertiary"
            >
              <ArrowLeft size={16} /> 返回
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👤</span>
              </div>
              <h2 className="text-[17px] text-text-heading font-medium">微信授权登录</h2>
              <p className="text-[12px] text-text-tertiary mt-1">选择要登录的便民服务人员账号</p>
            </div>

            <div className="space-y-2.5">
              {bUsers.map((user, i) => (
                <motion.button
                  key={user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  onClick={() => confirmWechatUser(user)}
                  className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-[#F8F9FF] border border-indigo-100 active:scale-[0.98] hover:bg-indigo-50 transition-all text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-[15px] shadow-sm">
                    {user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-text-heading">{user.name}</p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      {user.roleTag ?? "服务人员"}
                      <span className="mx-1.5">·</span>
                      {user.phone}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-text-tertiary shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </MiniProgramFrame>
    )
  }

  return (
    <MiniProgramFrame>
      <div className="flex flex-col min-h-full bg-white">
        {/* Hero */}
        <div className="relative shrink-0 h-[260px] overflow-hidden">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-indigo-950/50 to-indigo-950/90" />

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

        {/* Content */}
        <div className="relative -mt-6 bg-white rounded-t-[28px] flex-1 px-6 pt-7 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex justify-center gap-2.5 mb-7"
          >
            <div className="flex-1 max-w-[160px] rounded-xl border border-amber-100 bg-amber-50 text-amber-600 px-3 py-2.5 text-center">
              <div className="text-[13px] font-medium">服务人员</div>
              <div className="text-[10px] opacity-60 mt-0.5">接单 · 报价 · 服务</div>
            </div>
          </motion.div>

          {mode === "wechat" ? (
            <>
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                onClick={handleWechatLogin}
                className="w-full h-[50px] rounded-2xl bg-[#07C160] text-white font-medium text-[15px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-lg shadow-[#07C160]/25 hover:shadow-xl hover:shadow-[#07C160]/30"
              >
                <svg viewBox="0 0 24 24" className="size-5 fill-current">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18z" />
                </svg>
                微信一键登录
              </motion.button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="mt-5"
              >
                <button
                  onClick={() => setMode("password")}
                  className="mx-auto flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-text-body transition-colors"
                >
                  账号密码登录
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3.5"
            >
              <div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={11}
                  placeholder="手机号"
                  className="w-full h-[48px] rounded-xl bg-[#F5F5F5] px-4 text-[14px] outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 border border-transparent transition-all"
                />
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                  className="w-full h-[48px] rounded-xl bg-[#F5F5F5] px-4 pr-12 text-[14px] outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 border border-transparent transition-all"
                />
                <button
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                onClick={handlePasswordLogin}
                disabled={!phone}
                className="w-full h-[48px] rounded-xl bg-indigo-600 text-white font-medium text-[15px] active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-indigo-600/25"
              >
                登录
              </button>
              <button
                onClick={() => setMode("wechat")}
                className="w-full text-center text-[12px] text-text-tertiary hover:text-indigo-600 transition-colors py-1"
              >
                返回微信登录
              </button>
            </motion.div>
          )}

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
