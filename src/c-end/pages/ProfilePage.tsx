import { useState } from "react";
import {
  ChevronRight, MapPin, Bell, MessageSquareWarning,
  Heart, Edit3, Scan, Camera, Store, Plus,
} from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import userAvatar from "../imports/ad6ed0a0-af1e-4e61-a615-ab7234c09411.png";
import { useConvenienceStore } from "../../shared/mock";
import { useAuthStore } from "../../shared/stores/auth-store";

export function ProfilePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const pendingServiceOrders = useConvenienceStore(
    (s) => s.orders.filter((o) => o.status !== "S40" && o.status !== "S50").length
  );

  const menu = [
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
        {/* Side-by-side feature cards */}
        <div className="px-4 grid grid-cols-3 gap-3">
          <div className="group relative bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(59,130,246,0.08)] overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Heart size={20} className="text-primary" />
              </div>
              <div className="text-[13px] text-text-body font-medium">我的收藏</div>
              <div className="text-[11px] text-text-tertiary mt-0.5">收藏内容</div>
            </div>
          </div>
          <div className="group relative bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(30,58,95,0.06)] overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-xl bg-text-heading/10 flex items-center justify-center mb-3">
                <Edit3 size={20} className="text-text-heading" />
              </div>
              <div className="text-[13px] text-text-body font-medium">我的发布</div>
              <div className="text-[11px] text-text-tertiary mt-0.5">便民信息</div>
            </div>
          </div>
          <button
            onClick={() => navigate("/c/photo-records")}
            className="group relative bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(168,85,247,0.08)] active:scale-[0.97] transition-transform overflow-hidden"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-xl bg-[#A855F7]/10 flex items-center justify-center mb-3">
                <Camera size={20} className="text-[#A855F7]" />
              </div>
              <div className="text-[13px] text-text-body font-medium">随手拍</div>
              <div className="text-[11px] text-text-tertiary mt-0.5">问题上报</div>
            </div>
          </button>
        </div>

        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="w-full flex items-center justify-between px-4 h-[52px]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#22C55E15" }}>
                <span className="text-[16px]">🔧</span>
              </div>
              <span className="text-[14px] text-text-body">便民服务订单</span>
              {pendingServiceOrders > 0 && (
                <span className="text-[11px] text-primary">{pendingServiceOrders} 个进行中</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
              查看全部 <ChevronRight size={14} className="text-[#CCC]" />
            </div>
          </div>
        </div>

        {/* Menu list */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          {menu.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <button
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
              </motion.div>
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

      {/* 浮动新增按钮 */}
      {showFabMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setShowFabMenu(false)} />
      )}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {showFabMenu && (
          <>
            <button
              onClick={() => { setShowFabMenu(false); navigate("/c/photo-report"); }}
              className="flex items-center gap-2 px-4 h-11 rounded-full bg-white shadow-lg text-[14px] text-text-body font-medium active:scale-95 transition-transform"
            >
              <Camera size={16} className="text-[#A855F7]" />
              随手拍上报
            </button>
            <button
              onClick={() => { setShowFabMenu(false); navigate("/c/complaint"); }}
              className="flex items-center gap-2 px-4 h-11 rounded-full bg-white shadow-lg text-[14px] text-text-body font-medium active:scale-95 transition-transform"
            >
              <MessageSquareWarning size={16} className="text-[#1E3A5F]" />
              提交投诉
            </button>
          </>
        )}
        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          style={{ boxShadow: "0 4px 20px rgba(37, 99, 235, 0.4)" }}
        >
          <Plus size={24} className={`transition-transform ${showFabMenu ? "rotate-45" : ""}`} />
        </button>
      </div>
    </div>
  );
}
