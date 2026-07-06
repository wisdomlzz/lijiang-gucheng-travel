import { useState } from "react"
import { useNavigate } from "react-router"
import { motion } from "motion/react"
import { useAuthStore } from "@/platform/auth"
import { seedUsers } from "../types/seed-users"
import { Shield, Store, ChevronRight, User, Smartphone, Eye, EyeOff } from "lucide-react"
import { CRMEB_ADMIN_URL } from "../constants"
import { api } from "@/api/client"

const ADMIN_USER = seedUsers.find((u) => u.roles.includes("platform_admin"))!
const SUPPLIER_USER = seedUsers.find((u) => u.roles.includes("supplier") && u.platform.includes("desktop"))!

const HERO_IMG = "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=1200&q=70"

const PRESET_ACCOUNTS = [
  {
    user: ADMIN_USER,
    label: "平台管理员",
    desc: "全部权限 · 运营管控 · 数据分析",
    icon: Shield,
    gradient: "from-blue-600 to-blue-700",
    border: "border-blue-200",
    bg: "bg-blue-50/60",
    hoverBg: "hover:bg-blue-50",
  },
  {
    user: SUPPLIER_USER,
    label: "供应商",
    desc: "商品、订单、核销由商城后台承接",
    icon: Store,
    gradient: "from-slate-600 to-slate-700",
    border: "border-slate-200",
    bg: "bg-slate-50/60",
    hoverBg: "hover:bg-slate-50",
  },
]

export function LoginPageDesktop() {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const login = useAuthStore((s) => s.login)
  const currentUser = useAuthStore((s) => s.user)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const navigate = useNavigate()

  const doLogin = async (u: typeof ADMIN_USER) => {
    if (u.roles.includes("supplier")) {
      window.open(CRMEB_ADMIN_URL, "_blank")
      return
    }
    try {
      const { token, user } = await api.login(u.phone)
      login(user, "desktop", token)
    } catch {
      login(u, "desktop", "mock-token-" + u.id)
    }
    navigate("/desktop/workbench")
  }

  const handleLogin = () => {
    if (!phone) return
    const user = seedUsers.find((u) => u.platform.includes("desktop") && u.phone === phone)
    if (user) doLogin(user)
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left — brand panel with imagery */}
      <div className="hidden lg:flex w-[480px] xl:w-[540px] relative overflow-hidden">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        {/* Rich gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-blue-900/70 to-indigo-950/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col justify-between p-12 xl:p-14 text-white w-full">
          {/* Top: brand */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                <span className="text-lg font-bold">丽</span>
              </div>
              <span className="text-sm font-medium tracking-[0.1em] text-white/80">丽江古城游</span>
            </div>
          </motion.div>

          {/* Center: tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-center"
          >
            <h2 className="text-[15px] tracking-[0.3em] text-white/60 mb-4">V2.0 · 管理后台</h2>
            <h1 className="text-[36px] xl:text-[40px] font-bold tracking-[0.02em] leading-tight">
              智慧古城
              <br />
              <span className="text-blue-200">运营管理平台</span>
            </h1>
            <p className="mt-4 text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
              覆盖游客服务、信息维护、便民服务与平台运营的协同后台
            </p>

            {/* Feature pills */}
            <div className="flex justify-center gap-2 mt-6">
              {["实时数据", "订单管理", "权限控制", "内容运营"].map((f) => (
                <span
                  key={f}
                  className="px-3 py-1 rounded-full bg-white/8 text-white/50 text-[11px] backdrop-blur-sm ring-1 ring-white/10"
                >
                  {f}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Bottom: quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-white/30 text-xs text-center tracking-[0.1em]"
          >
            探索千年古城的美 · 用数据驱动服务
          </motion.p>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-6 xl:p-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-xl text-white font-bold">丽</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800">丽江古城游</h2>
            <p className="text-slate-400 text-sm">管理后台</p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-800">登录</h3>
            <p className="text-slate-400 text-sm mt-1">平台管理员进入运营后台；供应商进入商城后台</p>
          </div>

          {/* Preset accounts */}
          <div className="space-y-3 mb-7">
            {PRESET_ACCOUNTS.map((preset) => {
              const Icon = preset.icon
              return (
                <motion.button
                  key={preset.user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  onClick={() => doLogin(preset.user)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border ${preset.border} ${preset.bg} ${preset.hoverBg} hover:shadow-md active:scale-[0.99] transition-all group text-left`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${preset.gradient} flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="size-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-slate-800">{preset.label}</div>
                    <div className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <User size={12} />
                      <span>{preset.user.phone}</span>
                      <span className="text-slate-300">|</span>
                      <span>{preset.desc}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </motion.button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-7">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">或手动输入</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Manual login form */}
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={11}
                placeholder="请输入手机号"
                className="w-full h-[46px] rounded-xl border border-slate-200 px-4 text-[14px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all bg-white placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">密码</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full h-[46px] rounded-xl border border-slate-200 px-4 pr-12 text-[14px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all bg-white placeholder:text-slate-300"
                />
                <button
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              onClick={handleLogin}
              disabled={!phone}
              className="w-full h-[46px] rounded-xl bg-blue-600 text-white font-medium text-[15px] hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-40 shadow-lg shadow-blue-600/15 hover:shadow-xl hover:shadow-blue-600/20"
            >
              登 录
            </button>
          </div>

          {/* Bottom links */}
          <div className="mt-6 text-center">
            {isLoggedIn && currentUser && !currentUser.platform.includes("desktop") && (
              <p className="text-xs text-slate-400 mb-2">
                当前已登录：{currentUser.name}（{currentUser.phone}）
              </p>
            )}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 flex-wrap">
              <button
                onClick={() => navigate("/c")}
                className="flex items-center gap-1 hover:text-blue-500 transition-colors px-1"
              >
                <Smartphone size={12} /> 游客端
              </button>
              <span className="text-slate-300">·</span>
              <button
                onClick={() => navigate("/b")}
                className="flex items-center gap-1 hover:text-blue-500 transition-colors px-1"
              >
                <Smartphone size={12} /> 便民服务人员端
              </button>
              <span className="text-slate-300">·</span>
              <button
                onClick={() => navigate("/desktop/supplier-entry")}
                className="hover:text-blue-500 transition-colors px-1"
              >
                供应商入驻
              </button>
              <span className="text-slate-300">·</span>
              <button
                onClick={() => alert("请联系平台管理员重置密码")}
                className="hover:text-blue-500 transition-colors px-1"
              >
                忘记密码
              </button>
            </div>
          </div>

          {/* Trust indicator */}
          <p className="mt-5 text-center text-[11px] text-slate-300 flex items-center justify-center gap-1">
            <span>🔒</span> 安全连接 · 数据加密传输
          </p>
        </motion.div>
      </div>
    </div>
  )
}
