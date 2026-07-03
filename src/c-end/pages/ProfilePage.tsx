import {
  ChevronRight, MapPin, Bell, MessageSquareWarning,
  Heart, Edit3, Scan, Camera, Store, Gift, CalendarCheck, Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useMemo } from "react";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import userAvatar from "../assets/ad6ed0a0-af1e-4e61-a615-ab7234c09411.png";
import { useConvenienceStore } from "../../features/convenience/store";
import { usePointsStore } from "../../shared/services/points";
import { useAuthStore } from "../../shared/stores/auth-store";
import { useVolunteerStore } from "../../features/volunteer/store";

export function ProfilePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const userId = useAuthStore((s) => s.user?.id);
  const userRole = useAuthStore((s) => s.user?.roles?.[0]);
  const points = usePointsStore((s) => s.accounts[userId ?? "u_c_001"]?.balance ?? 0);
  const isMerchant = useAuthStore((s) => s.user?.roles?.includes("supplier") ?? false);
  const allOrders = useConvenienceStore((s) => s.orders);
  const pendingServiceOrders = useMemo(
    () => allOrders.filter((o) => !userId || o.userId === userId).filter((o) => o.status !== "S40" && o.status !== "S50").length,
    [allOrders, userId]
  );

  // ── Volunteer stats ──
  const volunteer = useVolunteerStore((s) => userId ? s.getByUserId(userId) : undefined)
  const allSignUps = useVolunteerStore((s) => s.signUps)
  const allDailyRecords = useVolunteerStore((s) => s.dailyRecords)
  const volStats = useMemo(() => {
    if (!volunteer || volunteer.status !== "approved") return null
    const mySignUps = allSignUps.filter((s) => s.volunteerId === volunteer.id)
    const myRecords = allDailyRecords.filter((d) => mySignUps.some((su) => su.id === d.signUpId))
    const totalHours = Math.round(myRecords.reduce((sum, d) => sum + (d.serviceHours || 0), 0) * 10) / 10
    const activityCount = mySignUps.length
    return { totalHours, activityCount }
  }, [volunteer, allSignUps, allDailyRecords])

  const menu = [
    { icon: Gift, label: "积分中心", color: "#F59E0B", to: "/c/points" },
    { icon: CalendarCheck, label: "我的预约", color: "#10B981", to: "/c/my-bookings" },
    { icon: Sparkles, label: "纳西人打卡", color: "#F43F5E", to: "/c/naxi-checkin" },
    ...(isMerchant ? [{ icon: Store, label: "我的店铺", color: "#3B82F6", to: "/c/my-shop" }] : []),
    { icon: MapPin, label: "收货地址", color: "#60A5FA", to: "/c/addresses" },
    { icon: Bell, label: "消息通知", color: "#3B82F6", to: "/c/notifications" },
    { icon: MessageSquareWarning, label: "我的投诉", color: "#1E3A5F", to: "/c/my-complaints" },
  ];

  return (
    <div className="min-h-full bg-surface-page">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[#1D4ED8] px-5 pt-6 pb-20">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-16 w-52 h-52 rounded-full bg-white/8" />
        <div className="absolute -bottom-8 -left-10 w-36 h-36 rounded-full bg-white/8" />
        <div className="absolute top-1/2 -right-8 w-24 h-24 rounded-full bg-white/5" />

        {/* Top action bar */}
        <div className="relative flex items-center justify-end gap-2">
          <button className="w-8 h-8 flex items-center justify-center">
            <Scan size={18} className="text-white/90" />
          </button>
        </div>

        {/* User identity */}
        <div className="relative mt-2 flex items-center gap-4">
          <div className="relative">
            <div className="w-[70px] h-[70px] rounded-full overflow-hidden ring-2 ring-white/50 shadow-lg">
              <ImageWithFallback
                src={userAvatar}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute -right-0.5 -bottom-0.5 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow">
              <Edit3 size={11} className="text-primary" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white text-[18px] truncate">纳西小旅人</span>
              <ChevronRight size={14} className="text-white/70" />
            </div>
            <p className="text-white/60 text-[11px] mt-1">ID: LJ88392156</p>
          </div>
        </div>
      </div>

      {/* Content area - pulled up onto hero */}
      <div className="relative -mt-14 pb-8">
        {/* 积分入口卡 */}
        <div className="px-4 mb-3">
          <button onClick={() => navigate("/c/points")} className="w-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform shadow-[0_4px_16px_rgba(245,158,11,0.25)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center">
                <Gift size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-white text-[12px] opacity-90">我的积分</p>
                <p className="text-white text-[22px] font-bold leading-tight">{points}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white/90 text-[12px]">
              积分中心 <ChevronRight size={14} />
            </div>
          </button>
        </div>

        {/* 志愿服务统计（仅已认证志愿者显示） */}
        {volStats && (
          <button onClick={() => navigate("/c/volunteer/activities")}
            className="px-4 mb-3 block w-full">
            <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center justify-between active:scale-[0.98] transition-transform shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
                  <Heart size={16} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-medium text-slate-800">志愿服务</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    累计 {volStats.totalHours}h · 参与 {volStats.activityCount} 场
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
          </button>
        )}

        {/* 功能卡片区 */}
        <div className="px-4">
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(59,130,246,0.08)] overflow-hidden">
            <div className="grid grid-cols-3">
              <button
                onClick={() => navigate("/c/favorites")}
                className="flex flex-col items-center py-4 active:scale-[0.97] transition-transform"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <Heart size={20} className="text-primary" />
                </div>
                <div className="text-[13px] text-text-body font-medium">我的收藏</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">收藏内容</div>
              </button>
              <button
                onClick={() => navigate("/c/my-posts")}
                className="flex flex-col items-center py-4 border-x border-[#F3F3F3] active:scale-[0.97] transition-transform"
              >
                <div className="w-11 h-11 rounded-xl bg-text-heading/10 flex items-center justify-center mb-2">
                  <Edit3 size={20} className="text-text-heading" />
                </div>
                <div className="text-[13px] text-text-body font-medium">我的发布</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">便民信息</div>
              </button>
              <button
                onClick={() => navigate("/c/photo-records")}
                className="flex flex-col items-center py-4 active:scale-[0.97] transition-transform"
              >
                <div className="w-11 h-11 rounded-xl bg-[#A855F7]/10 flex items-center justify-center mb-2">
                  <Camera size={20} className="text-[#A855F7]" />
                </div>
                <div className="text-[13px] text-text-body font-medium">随手拍</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">问题上报</div>
              </button>
            </div>
          </div>
        </div>

        {/* 订单快捷入口 */}
        <div className="px-4 mt-3">
          <button
            onClick={() => navigate("/c/orders")}
            className="w-full bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-4 h-[52px] flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#22C55E15" }}>
                <span className="text-[16px]">🔧</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[14px] text-text-body">便民服务订单</span>
                {pendingServiceOrders > 0 && (
                  <span className="text-[10px] text-primary">{pendingServiceOrders}单进行中</span>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
        </div>

        {/* 菜单列表 */}
        <div className="px-4 mt-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          {menu.map((m, i) => {
            const Icon = m.icon;
            return (
              <button
                key={m.label}
                onClick={() => {
                  if (m.to) navigate(m.to);
                }}
                className={`w-full flex items-center px-4 h-[52px] active:bg-[#FAFAFA] transition-colors ${
                  i !== menu.length - 1 ? "border-b border-[#F3F3F3]" : ""
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                  style={{ backgroundColor: `${m.color}15` }}
                >
                  <Icon size={16} style={{ color: m.color }} />
                </div>
                <span className="flex-1 text-left text-[14px] text-text-body">{m.label}</span>
                <ChevronRight size={16} className="text-[#CCC]" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="px-4 mt-8">
          <button
            onClick={() => { logout(); navigate("/c"); }}
            className="w-full h-11 rounded-full bg-white text-[#EF4444] text-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] active:scale-[0.99] transition-transform"
          >
            退出登录
          </button>
        </div>

        {/* Supplier entry */}
        <div className="mx-4 mt-6">
          <div
            onClick={() => navigate("/c/supplier-entry")}
            className="bg-gradient-to-r from-primary/8 to-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Store size={20} className="text-white" />
              </div>
              <div>
                <div className="text-[14px] text-text-body font-medium">供应商入驻</div>
                <div className="text-[11px] text-text-tertiary mt-0.5">入驻开启线上经营</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-primary text-[12px]">
              <span>立即入驻</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
