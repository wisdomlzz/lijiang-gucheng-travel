import { useState } from "react";
import {
  ChevronLeft, Share2, Heart, MapPin, Phone, Clock, ChevronRight, Navigation,
  Shield, BadgeCheck, FileText, Award, Star,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { toast } from "sonner";
import { useContentManageStore } from "../../shared/stores/content-manage-store";
import { useFavoriteStore } from "../../shared/mock";
import { useAuthStore } from "../../shared/stores/auth-store";
import { getMerchantCategoryLabel } from "../../shared/content-config";

function getBusinessStatus(hours: string): { label: string; color: string; bg: string } {
  if (!hours || hours === "全天" || hours === "24小时") {
    return { label: "营业中", color: "text-primary", bg: "bg-surface-page" };
  }
  const match = hours.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) {
    return { label: "营业中", color: "text-primary", bg: "bg-surface-page" };
  }
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
  const closeMinutes = parseInt(match[3]) * 60 + parseInt(match[4]);

  if (closeMinutes > openMinutes) {
    // Normal hours, e.g. 09:00-21:00
    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      return { label: "营业中", color: "text-primary", bg: "bg-surface-page" };
    }
    return { label: "已打烊", color: "text-text-tertiary", bg: "bg-slate-100" };
  } else {
    // Overnight hours, e.g. 18:00-02:00
    if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) {
      return { label: "营业中", color: "text-primary", bg: "bg-surface-page" };
    }
    return { label: "已打烊", color: "text-text-tertiary", bg: "bg-slate-100" };
  }
}

const qualificationBadges = [
  { icon: BadgeCheck, label: "实名认证", color: "#27AE60" },
  { icon: Shield, label: "诚信商户", color: "#3B82F6" },
  { icon: Award, label: "品质保证", color: "#3B82F6" },
];

export function MerchantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [previewCert, setPreviewCert] = useState<any | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const merchant = useContentManageStore((s) => s.merchants.find((m) => m.id === id));

  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? "u_c_001";
  const isFavorited = useFavoriteStore((s) => s.isFavorited(userId, "merchant", id ?? ""));
  const toggleFavorite = useFavoriteStore((s) => s.toggle);

  if (!merchant) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center px-6 text-center text-text-tertiary">
        未找到对应商户信息
      </div>
    );
  }

  const years = new Date().getFullYear() - merchant.openYear;
  const merchantCategory = getMerchantCategoryLabel(merchant.category);
  const bizStatus = getBusinessStatus(merchant.hours);

  return (
    <div className="min-h-screen bg-surface-page pb-[78px]">
      <div className="relative h-48">
        <ImageWithFallback src={merchant.cover} alt={merchant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-surface-page" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-3">
          <button
            onClick={() => navigate("/c/merchants")}
            className="w-9 h-9 rounded-full bg-white/70 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronLeft size={20} className="text-text-body" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.success("分享链接已复制")}
              className="w-9 h-9 rounded-full bg-white/70 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
            >
              <Share2 size={18} className="text-text-body" />
            </button>
            <button
              onClick={() => {
                if (merchant) {
                  toggleFavorite({ userId, type: "merchant", itemId: merchant.id, name: merchant.name, img: merchant.cover });
                  toast.success(isFavorited ? "已取消收藏" : "已添加收藏");
                }
              }}
              className="w-9 h-9 rounded-full bg-white/70 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
            >
              <Heart size={18} className={isFavorited ? "text-primary fill-primary" : "text-text-body"} />
            </button>
          </div>
        </div>
      </div>

      <div className="-mt-12 relative px-3">
        <div className="bg-white rounded-2xl p-4 shadow-[0_6px_20px_rgba(60,120,200,0.12)]">
          <div className="flex items-start gap-3">
            <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden ring-4 ring-white shadow -mt-9 flex-shrink-0">
              <ImageWithFallback src={merchant.logo} alt={merchant.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="text-[18px] text-text-body">{merchant.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-[12px] text-text-tertiary">
                <span>{merchantCategory}</span>
                <span>·</span>
                <span>开业 {years} 年</span>
              </div>
            </div>
          </div>

          <p className="text-[13px] text-text-secondary leading-relaxed mt-3 line-clamp-3">{merchant.description}</p>

          <div className="mt-3 grid grid-cols-4 divide-x divide-primary-200 bg-surface-page rounded-xl py-2.5">
            <div className="text-center">
              <p className="text-[16px] text-primary flex items-center justify-center gap-0.5">
                <Star size={14} fill="#FFD24A" stroke="#FFD24A" />
                {merchant.rating}
              </p>
              <p className="text-[10px] text-text-tertiary mt-0.5">综合评分</p>
            </div>
            <div className="text-center">
              <p className="text-[16px] text-text-body">{merchant.reviewCount.toLocaleString()}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">累计评价</p>
            </div>
            <div className="text-center">
              <p className="text-[16px] text-text-body">{merchant.openYear}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">创立年份</p>
            </div>
            <div className="text-center">
              <p className="text-[16px] text-[#F59E0B]">{merchant.creditScore}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">诚信评分</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-3 bg-white rounded-2xl p-4 space-y-3 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-page flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] text-text-body leading-relaxed">{merchant.address}</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              {merchant.distance ? `距您约 ${merchant.distance}` : "可在导览地图中查看位置"}
            </p>
          </div>
          <button
            onClick={() => window.open("https://maps.apple.com/?q=丽江市古城区", "_blank")}
            className="text-[13px] text-primary flex items-center gap-0.5 flex-shrink-0 active:opacity-60"
          >
            导航 <Navigation size={12} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-page flex items-center justify-center flex-shrink-0">
            <Phone size={16} className="text-primary" />
          </div>
          <div className="flex-1 text-[14px] text-text-body">{merchant.phone}</div>
          <button onClick={() => window.open("tel:" + merchant.phone, "_blank")} className="text-[13px] text-primary active:opacity-60">
            拨打
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-page flex items-center justify-center flex-shrink-0">
            <Clock size={16} className="text-primary" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <span className="text-[14px] text-text-body">{merchant.hours}</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded ${bizStatus.bg} ${bizStatus.color}`}>{bizStatus.label}</span>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] text-text-body flex items-center gap-1">
            <span className="w-1 h-3.5 bg-primary rounded-full" />
            商家相册
          </h3>
          <span className="text-[11px] text-text-tertiary">{merchant.gallery.length} 张</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {merchant.gallery.map((img, i) => (
            <div
              key={i}
              onClick={() => setPreviewImage(img)}
              className="w-[120px] h-[120px] rounded-xl overflow-hidden flex-shrink-0 active:opacity-80"
            >
              <ImageWithFallback src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] text-text-body flex items-center gap-1">
            <span className="w-1 h-3.5 bg-[#27AE60] rounded-full" />
            商家资质
          </h3>
          <span className="text-[11px] text-[#27AE60] flex items-center gap-0.5">
            <BadgeCheck size={12} />
            已通过平台审核
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {qualificationBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.label}
                className="flex flex-col items-center py-2.5 rounded-xl bg-gradient-to-br from-surface-page to-primary-100"
              >
                <Icon size={20} style={{ color: badge.color }} />
                <span className="text-[11px] text-text-heading mt-1">{badge.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 divide-y divide-primary-200">
          {merchant.certificates.map((certificate) => (
            <button
              key={certificate.no}
              onClick={() => setPreviewCert(certificate)}
              className="w-full py-3 flex items-center gap-3 text-left active:bg-[#FAFAFA]"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-page flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-text-body">{certificate.label}</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
                  编号 {certificate.no} · 有效期 {certificate.validUntil}
                </p>
              </div>
              <span className="text-[11px] text-primary flex items-center gap-0.5 flex-shrink-0">
                查看 <ChevronRight size={12} />
              </span>
            </button>
          ))}
        </div>

        <p className="mt-2 text-[11px] text-text-tertiary leading-relaxed">
          以上资质由商家上传，平台已完成资质核验。如发现虚假资质可通过「投诉反馈」举报。
        </p>
      </div>

      <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-border-light px-3 h-[64px] flex items-center gap-3 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => window.open("tel:" + merchant.phone, "_blank")}
          className="flex flex-col items-center justify-center w-14 text-text-secondary active:opacity-60"
        >
          <Phone size={18} />
          <span className="text-[10px] mt-0.5">联系</span>
        </button>
        <button
          onClick={() => window.open("https://maps.apple.com/?q=丽江市古城区", "_blank")}
          className="flex flex-col items-center justify-center w-14 text-text-secondary active:opacity-60"
        >
          <Navigation size={18} />
          <span className="text-[10px] mt-0.5">导航</span>
        </button>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
        >
          <img
            src={previewImage}
            alt="大图"
            className="max-w-full max-h-full object-contain p-4"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            ×
          </button>
        </div>
      )}

      {previewCert && (
        <div
          onClick={() => setPreviewCert(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-2xl overflow-hidden">
            <div className="aspect-[3/2] bg-black">
              <ImageWithFallback src={previewCert.img} alt={previewCert.label} className="w-full h-full object-contain" />
            </div>
            <div className="p-4">
              <p className="text-[15px] text-text-body">{previewCert.label}</p>
              <p className="text-[12px] text-text-secondary mt-1">编号：{previewCert.no}</p>
              <p className="text-[12px] text-text-secondary mt-0.5">有效期：{previewCert.validUntil}</p>
              <button
                onClick={() => setPreviewCert(null)}
                className="w-full h-10 mt-3 rounded-full bg-primary text-white text-[13px]"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
