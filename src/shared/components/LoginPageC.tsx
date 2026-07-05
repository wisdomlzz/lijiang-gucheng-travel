import { useState } from "react"
import { useNavigate } from "react-router"
import { ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { MiniProgramFrame } from "./MiniProgramFrame"
import { useAuthStore } from "@/platform/auth"
import { seedUsers } from "../types/seed-users"

const HERO_IMG = "https://images.unsplash.com/photo-1775120246271-cd4b6a3ef428?auto=format&fit=crop&w=800&q=70"

export function LoginPageC() {
  const [showPhone, setShowPhone] = useState(false)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [countdown, setCountdown] = useState(0)
  const login = useAuthStore((s) => s.login)
  const currentUser = useAuthStore((s) => s.user)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const navigate = useNavigate()

  const handleWechatLogin = () => {
    const defaultUser = seedUsers.find((u) => u.platform.includes("c"))
    if (defaultUser) {
      login(defaultUser, "c")
      navigate("/c/home")
    }
  }

  const sendCode = () => {
    if (countdown > 0 || phone.length < 11) return
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handlePhoneLogin = () => {
    if (!phone || !code) return
    const user = seedUsers.find((u) => u.phone === phone && u.platform.includes("c"))
    if (user) {
      login(user, "c")
      navigate("/c/home")
    }
  }

  return (
    <MiniProgramFrame>
      <div className="flex flex-col min-h-full bg-white">
        {/* Hero image with gradient overlay */}
        <div className="relative shrink-0 h-[280px] overflow-hidden">
          <img src={HERO_IMG} alt="Lijiang" className="w-full h-full object-cover" />
          {/* Multi-layer gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-transparent to-primary/60" />

          {/* Brand text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              <div className="w-[72px] h-[72px] rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 shadow-2xl ring-1 ring-white/30">
                <span className="text-[32px] text-white font-bold drop-shadow-lg">古</span>
              </div>
              <h1 className="text-[26px] text-white font-bold tracking-[0.05em] drop-shadow-lg">丽江古城游</h1>
              <p className="text-white/70 text-[13px] mt-1.5 tracking-[0.15em]">探索千年古城 · 遇见纳西之美</p>
            </motion.div>
          </div>
        </div>

        {/* Login card — pulled up with negative margin */}
        <div className="relative -mt-6 bg-white rounded-t-[28px] flex-1 px-6 pt-8 pb-4">
          {/* Welcome text */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center mb-7"
          >
            <h2 className="text-[17px] text-text-heading font-medium">欢迎回来</h2>
            <p className="text-[12px] text-text-tertiary mt-1">登录后享受完整的古城服务</p>
          </motion.div>

          {/* Login mode switcher */}
          <AnimatePresence mode="wait">
            {!showPhone ? (
              <motion.div
                key="wechat"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={handleWechatLogin}
                  className="w-full h-[50px] rounded-2xl bg-[#07C160] text-white font-medium text-[15px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-lg shadow-[#07C160]/25"
                >
                  <svg viewBox="0 0 24 24" className="size-5 fill-current">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18z" />
                  </svg>
                  微信一键登录
                </button>
                <div className="mt-5 text-center">
                  <button
                    onClick={() => setShowPhone(true)}
                    className="text-[12px] text-text-tertiary hover:text-text-body transition-colors"
                  >
                    其他方式登录
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="phone"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.slice(0, 11))}
                  placeholder="手机号"
                  className="w-full h-[48px] rounded-xl bg-[#F5F5F5] px-4 text-[14px] outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="验证码"
                    maxLength={6}
                    className="flex-1 h-[48px] rounded-xl bg-[#F5F5F5] px-4 text-[14px] outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all"
                  />
                  <button
                    onClick={sendCode}
                    disabled={countdown > 0 || phone.length < 11}
                    className="w-[120px] h-[48px] rounded-xl text-[13px] font-medium shrink-0 transition-all disabled:opacity-40 bg-primary/10 text-primary active:bg-primary/20"
                  >
                    {countdown > 0 ? `${countdown}s` : "获取验证码"}
                  </button>
                </div>
                <button
                  onClick={handlePhoneLogin}
                  disabled={!phone || !code}
                  className="w-full h-[48px] rounded-xl bg-primary text-white font-medium text-[15px] active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-primary/20"
                >
                  登录
                </button>
                <div className="text-center">
                  <button
                    onClick={() => {
                      setShowPhone(false)
                      setPhone("")
                      setCode("")
                    }}
                    className="text-[12px] text-text-tertiary hover:text-text-body transition-colors"
                  >
                    返回微信登录
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agreement */}
          <p className="mt-7 text-[11px] text-text-tertiary text-center leading-relaxed">
            登录即代表同意
            <span className="text-primary">《用户协议》</span>和<span className="text-primary">《隐私政策》</span>
          </p>

          {/* Trust badges */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-text-tertiary/60">
            <span>🔒 安全登录</span>
            <span>·</span>
            <span>数据加密传输</span>
          </div>

          {/* Bottom links */}
          <div className="mt-6 pt-4 border-t border-[#F3F3F3]">
            {isLoggedIn && currentUser && !currentUser.platform.includes("c") && (
              <p className="text-[11px] text-text-tertiary text-center mb-2">
                当前已登录：{currentUser.name}（{currentUser.phone}）
              </p>
            )}
            <button
              onClick={() => navigate("/b")}
              className="w-full text-center text-[12px] text-text-tertiary hover:text-primary transition-colors py-1"
            >
              我是便民服务人员 <ChevronRight size={12} className="inline" />
            </button>
          </div>
        </div>
      </div>
    </MiniProgramFrame>
  )
}
