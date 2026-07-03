import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ChevronRight,
  ShieldCheck,
  Award,
  TrendingUp,
  Star,
  FileText,
  HelpCircle,
  Settings,
  Wrench,
  MapPin,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../../../../platform/auth";
import { useConvenienceStore } from "../../store";
import { useTrustScoreStore } from "../../../../shared/services/trust-score";
import { ConfirmModal } from "../components/Sheet";

export function ServiceProfile() {
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const staffId = currentUser?.staffId ?? "";
  const storeTrustScore = useTrustScoreStore(s => s.getScore(staffId));
  const convOrders = useConvenienceStore((s) => s.orders);

  // Compute dynamic statistics from store
  const stats = useMemo(() => {
    const staffOrders = convOrders.filter((o) => o.staffId === staffId);
    const today = new Date();
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    // Monthly revenue
    const monthOrders = staffOrders.filter((o) => o.createdAt.startsWith(monthStr) && o.status === "S40");
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.priceQuote ?? 0), 0);

    // Average rating
    const ratedOrders = staffOrders.filter((o) => o.rating != null);
    const avgRating = ratedOrders.length > 0
      ? (ratedOrders.reduce((sum, o) => sum + (o.rating ?? 0), 0) / ratedOrders.length).toFixed(1)
      : "—";

    // Completion rate
    const terminalOrders = staffOrders.filter((o) => o.status === "S40" || o.status === "S50");
    const doneOrders = staffOrders.filter((o) => o.status === "S40");
    const completionRate = terminalOrders.length > 0
      ? `${Math.round((doneOrders.length / terminalOrders.length) * 100)}%`
      : "—";

    return { monthRevenue, avgRating, completionRate };
  }, [convOrders, staffId]);

  return (
    <div className="pb-4">
      {/* Credit restriction warning - RED for < 60 */}
      {(storeTrustScore?.trustScore ?? 100) < 60 && (
        <div className="mx-4 mt-3 bg-[#FEF2F2] border border-[#EF4444] rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-5 text-[#EF4444] shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-[14px] font-medium text-[#DC2626]">
                您当前的诚信评分为 {storeTrustScore?.trustScore} 分，已进入失信名单，限制经营。如有异议请联系客服。
              </div>
            </div>
          </div>
        </div>
      )}
      <div
        className="px-4 pt-5 pb-6"
        style={{
          background:
            "linear-gradient(180deg, #FCD9A8 0%, #FDE7C8 60%, #EFF6FC 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="size-14 rounded-full flex items-center justify-center text-white text-[18px] font-medium"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #FCD34D)",
              boxShadow: "0 4px 12px rgba(245,158,11,0.32)",
            }}
          >
            李
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] text-text-heading font-medium">
                李师傅
              </span>
              <ShieldCheck className="size-4" style={{ color: "#F59E0B" }} />
            </div>
            <div className="text-[11px] text-text-caption mt-0.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5">
                <Wrench className="size-3" /> 搬运 / 清运
              </span>
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="size-3" /> 大研片区
              </span>
            </div>
          </div>
        </div>

      {/* Trust score card - from trust score store */}
      {storeTrustScore && (
        <div className="mt-4 bg-white/90 backdrop-blur-xl rounded-2xl p-3.5 shadow-[0_4px_16px_rgba(60,120,200,0.10)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-text-caption">诚信评分</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[28px] text-text-heading font-medium leading-none">
                  {storeTrustScore.trustScore}
                </span>
                <span className="text-[12px] text-text-tertiary">/ 100</span>
                <span className={`ml-2 inline-flex items-center gap-0.5 text-[11px] ${
                  storeTrustScore.status === "正常" ? "text-[#059669]" : "text-[#DC2626]"
                }`}>
                  {storeTrustScore.status === "正常" ? <TrendingUp className="size-3" /> : <AlertCircle className="size-3" />}
                  {storeTrustScore.status}
                </span>
              </div>
            </div>
            <button className="text-[12px] flex items-center" style={{ color: "#F59E0B" }}>
              查看详情 <ChevronRight className="size-3.5" />
            </button>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-primary-50 overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: `${storeTrustScore.trustScore}%`,
              background: storeTrustScore.status === "正常"
                ? "linear-gradient(90deg, #FCD34D, #F59E0B)"
                : "linear-gradient(90deg, #FCA5A5, #EF4444)",
            }} />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-text-tertiary">
            <span>失信线 60</span>
            <span>好评率 {storeTrustScore.totalRatings > 0 ? Math.round((storeTrustScore.rating5Count + storeTrustScore.rating4Count) / storeTrustScore.totalRatings * 100) : 0}%</span>
          </div>
        </div>
      )}

      {!storeTrustScore && (
        <div className="mt-4 bg-white/90 backdrop-blur-xl rounded-2xl p-3.5 shadow-[0_4px_16px_rgba(60,120,200,0.10)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-text-caption">诚信评分</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[28px] text-text-heading font-medium leading-none">—</span>
                <span className="text-[12px] text-text-tertiary">暂无评分数据</span>
              </div>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden" />
        </div>
      )}
      </div>


      <div className="px-4 -mt-2 grid grid-cols-3 gap-2">
        <Stat tint="#F59E0B" label="本月收入" value={`¥${stats.monthRevenue.toLocaleString()}`} />
        <Stat tint="#FFD24A" label="平均评分" value={stats.avgRating} star />
        <Stat tint="#10B981" label="完单率" value={stats.completionRate} />
      </div>

      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(60,120,200,0.08)] overflow-hidden">
          <Row
            icon={<Award />}
            tint="#F59E0B"
            label="诚信评分详情"
            extra={storeTrustScore ? `${storeTrustScore.trustScore} 分` : "暂无"}
            onClick={() => {}}
          />
          <Row
            icon={<FileText />}
            tint="#3B82F6"
            label="收入明细"
            extra={`本月 ¥${stats.monthRevenue.toLocaleString()}`}
            onClick={() => navigate("/b/service/history")}
          />
          <Row
            icon={<MapPin />}
            tint="#10B981"
            label="服务片区"
            extra="大研 · 束河"
            onClick={() => {}}
          />
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(60,120,200,0.08)] overflow-hidden">
          <Row icon={<Settings />} tint="#64748B" label="个人资料" onClick={() => {}} />
          <Row
            icon={<ShieldCheck />}
            tint="#0891B2"
            label="资质证件"
            extra="健康证已上传"
            onClick={() => {}}
          />
          <Row icon={<HelpCircle />} tint="#7A93AE" label="帮助中心" onClick={() => {}} />
        </div>
      </div>

      <div className="px-4 mt-6">
        <button onClick={() => setLogoutConfirm(true)}
          className="w-full h-11 rounded-2xl bg-white text-[#EF4444] text-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] active:scale-[0.99] transition-transform">
          退出登录
        </button>
      </div>

      <ConfirmModal
        open={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        title="确认退出登录？"
        desc="退出后需要重新登录才能继续使用"
        tint="#EF4444"
        cancel="取消"
        confirm="确认退出"
        onConfirm={() => { setLogoutConfirm(false); logout(); }}
      />

      <div className="px-4 mt-4 text-center text-[11px] text-text-tertiary">
        丽江古城游 B 端 · 服务人员版 · v2.0.0
      </div>
    </div>
  );
}

function Stat({
  tint,
  label,
  value,
  star,
}: {
  tint: string;
  label: string;
  value: string;
  star?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-[0_4px_16px_rgba(60,120,200,0.08)]">
      <div className="text-[11px] text-text-caption">{label}</div>
      <div
        className="mt-1 text-[15px] font-medium flex items-center gap-1"
        style={{ color: tint }}
      >
        {star && <Star className="size-3.5 fill-[#FFD24A] text-[#FFD24A]" />}
        {value}
      </div>
    </div>
  );
}

function Row({
  icon,
  tint,
  label,
  extra,
  onClick,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  extra?: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#F0F0F0] last:border-b-0 active:bg-primary-50/40">
      <div
        className="size-8 rounded-full flex items-center justify-center [&>svg]:size-4"
        style={{ background: `${tint}14`, color: tint }}
      >
        {icon}
      </div>
      <span className="text-[13px] text-text-body flex-1 text-left">
        {label}
      </span>
      {extra && (
        <span className="text-[11px] text-text-tertiary">{extra}</span>
      )}
      <ChevronRight className="size-4 text-text-tertiary" />
    </button>
  );
}
