import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Phone, Star } from "lucide-react";
import { toast } from "sonner";
import { TrustScoreBadge } from "../../shared/components/TrustScoreBadge";
import { PageHeader } from "./shop/PageHeader";
import { StatusProgress } from "../components/StatusProgress";
import { ContactSheet } from "../components/ContactSheet";
import { useConvenienceStore, useSupplierRatingStore } from "../../shared/mock";
import { useTrustScoreStore } from "../../shared/mock/trust-score";
import type { ConvenienceOrder } from "../../shared/types";
import {
  CONVENIENCE_STATUS_META,
  getConvenienceActions,
  resolveStaff,
} from "../../shared/orders";

function CancelConfirmDialog({
  open,
  title,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#FEE2E2] flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-[17px] text-text-body font-medium mb-2">
            {title || "确认取消订单？"}
          </h3>
          <p className="text-[14px] text-text-secondary">
            确定要取消该订单吗？取消后无法恢复
          </p>
        </div>
        <div className="flex border-t border-border-light">
          <button
            onClick={onCancel}
            className="flex-1 h-12 text-[15px] text-text-secondary border-r border-border-light"
          >
            再考虑
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 text-[15px] text-[#EF4444] font-medium"
          >
            确认取消
          </button>
        </div>
      </div>
    </div>
  );
}

const CONVENIENCE_STEP_LABELS = ["已下单", "已指派", "已核价", "已收款", "服务中", "已完成"];

function getConvenienceSteps(status: string): { label: string; completed: boolean }[] {
  const meta = CONVENIENCE_STATUS_META[status as keyof typeof CONVENIENCE_STATUS_META];
  const idx = meta?.stepIndex ?? -1;
  return CONVENIENCE_STEP_LABELS.map((label, i) => ({
    label,
    completed: idx >= 0 && i <= idx,
  }));
}

function resolveConvenienceSupplierId(order: ConvenienceOrder): string {
  if (order.staffId) {
    const store = useTrustScoreStore.getState();
    return store.getScore(order.staffId)?.supplierId || "sup_004";
  }
  return "sup_004";
}

function OrderNotFound() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface-page min-h-full">
      <PageHeader title="订单详情" />
      <div className="px-6 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-[28px]">🔧</span>
        </div>
        <p className="text-[15px] text-text-body font-medium">订单不存在或已移除</p>
        <p className="text-[12px] text-text-tertiary mt-2 leading-relaxed">
          请返回便民服务订单列表查看当前订单。
        </p>
        <button
          onClick={() => navigate("/c/orders")}
          className="mt-6 h-10 px-5 rounded-full bg-primary text-white text-[13px]"
        >
          返回便民服务订单
        </button>
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const order = useConvenienceStore((s) => (id ? s.getOrder(id) : undefined));

  if (!id || !order) {
    return <OrderNotFound />;
  }

  return <ConvenienceOrderDetail id={id} data={order} />;
}

function ConvenienceOrderDetail({ id, data }: { id: string; data: ConvenienceOrder }) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showStaffContact, setShowStaffContact] = useState(false);
  const [activeStaff, setActiveStaff] = useState<{
    name: string;
    phone: string;
    avatar?: string;
    subtitle?: string;
  } | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [staffRating, setStaffRating] = useState(0);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputePrice, setDisputePrice] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeImages, setDisputeImages] = useState<string[]>([]);

  const status = CONVENIENCE_STATUS_META[data.status] || {
    label: "未知",
    color: "text-text-secondary",
    bg: "bg-[#F3F4F6]",
    stepIndex: -1,
    actions: [] as string[],
  };
  const steps = getConvenienceSteps(data.status);
  const actions = getConvenienceActions(data.status);
  const hasCancel = actions.includes("cancel");
  const hasContact = actions.includes("contact");
  const hasConfirm = actions.includes("confirm_complete");
  const needsPayment = data.status === "A35";
  const isCancelPending = data.status === "R80";

  useEffect(() => {
    if (data.status === "S40" && !data.rating && data.completedAt) {
      const completedMs = new Date(data.completedAt).getTime();
      const daysSince = (Date.now() - completedMs) / (1000 * 60 * 60 * 24);
      if (daysSince >= 7) {
        useConvenienceStore.getState().rateOrder(id, 5);
        useSupplierRatingStore.getState().addRating(resolveConvenienceSupplierId(data), 5);
        toast.success("服务完成超过7天，系统已自动好评");
      }
    }
  }, [data.status, data.rating, data.completedAt, data, id]);

  const openStaffContact = () => {
    const staff = resolveStaff(data.staffId || "");
    if (staff) {
      setActiveStaff({
        name: staff.name,
        phone: staff.phone,
        avatar: staff.avatar,
        subtitle: staff.roleTag,
      });
      setShowStaffContact(true);
    }
  };

  const handleConfirmCancel = () => {
    useConvenienceStore.getState().requestCancel(id);
    toast.success("取消申请已提交");
    setShowCancelDialog(false);
  };

  const handlePay = () => {
    useConvenienceStore.getState().markPaid(id, "online");
    toast.success("支付成功");
  };

  const handleOpenDispute = () => {
    setShowDisputeDialog(true);
  };

  const handleConfirmComplete = () => {
    useConvenienceStore.getState().confirmComplete(id);
    toast.success("已确认完成");
  };

  const handleSubmitDispute = () => {
    if (!disputePrice.trim()) {
      toast.error("请输入期望价格");
      return;
    }
    if (!disputeReason) {
      toast.error("请选择异议原因");
      return;
    }
    useConvenienceStore.getState().submitPriceDispute(id, {
      targetPrice: Number(disputePrice),
      reason: disputeReason,
      images: disputeImages,
    });
    toast.info("价格异议已提交");
    setShowDisputeDialog(false);
    setDisputePrice("");
    setDisputeReason("");
    setDisputeImages([]);
  };

  const handleSubmitRating = () => {
    if (selectedRating <= 0) return;
    useConvenienceStore.getState().rateOrder(id, selectedRating);
    useSupplierRatingStore.getState().addRating(resolveConvenienceSupplierId(data), selectedRating);
    if (data.staffId) {
      useTrustScoreStore.getState().addRatingBonus(data.staffId, staffRating || 5, id);
    }
    toast.success("评价成功");
  };

  return (
    <div className="bg-surface-page min-h-full pb-[72px]">
      <CancelConfirmDialog
        open={showCancelDialog}
        title="确认取消订单？"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelDialog(false)}
      />
      {showDisputeDialog && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="p-5">
              <h3 className="text-[17px] text-text-body font-medium mb-4 text-center">价格异议</h3>
              <div className="mb-3">
                <label className="text-[13px] text-text-secondary block mb-1">期望价格</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-text-tertiary">¥</span>
                  <input
                    type="number"
                    value={disputePrice}
                    onChange={(e) => setDisputePrice(e.target.value)}
                    placeholder="请输入您期望的价格"
                    className="w-full h-10 pl-8 pr-3 rounded-lg bg-surface-page text-[14px] text-text-body outline-none placeholder:text-text-tertiary"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-[13px] text-text-secondary block mb-1">异议原因</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-page text-[14px] text-text-body outline-none appearance-none"
                >
                  <option value="">请选择异议原因</option>
                  <option value="price_too_high">价格远超预期</option>
                  <option value="gap_too_large">与参考价差距大</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>
            <div className="flex border-t border-border-light">
              <button
                onClick={() => {
                  setShowDisputeDialog(false);
                  setDisputePrice("");
                  setDisputeReason("");
                  setDisputeImages([]);
                }}
                className="flex-1 h-12 text-[15px] text-text-secondary border-r border-border-light"
              >
                取消
              </button>
              <button
                onClick={handleSubmitDispute}
                className="flex-1 h-12 text-[15px] text-primary font-medium"
              >
                提交异议
              </button>
            </div>
          </div>
        </div>
      )}
      <ContactSheet
        open={showStaffContact}
        onOpenChange={setShowStaffContact}
        title="联系服务人员"
        name={activeStaff?.name || ""}
        phone={activeStaff?.phone || ""}
        avatar={activeStaff?.avatar}
        subtitle={activeStaff?.subtitle || "服务人员"}
      />
      <PageHeader title="订单详情" />

      <div className="bg-gradient-to-br from-primary to-primary px-4 py-5">
        <p className="text-white text-[18px]">{status.label}</p>
        <p className="text-white/80 text-[12px] mt-1">订单号：{data.id}</p>
      </div>

      <div className="mx-3 mt-3 bg-white rounded-xl p-4">
        <StatusProgress steps={steps} />
      </div>

      <div className="mx-3 mt-3 bg-white rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border-light pb-2">
          <span className="text-[13px] text-text-body">{data.serviceType}</span>
          <span className={`text-[11px] ${status.color} ${status.bg} px-2 py-0.5 rounded-full`}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[12px] text-text-secondary">订单号</span>
          <span className="text-[12px] text-text-body">{data.id}</span>
        </div>

        <div className="flex items-start justify-between">
          <span className="text-[12px] text-text-secondary">服务地址</span>
          <span className="text-[12px] text-text-body max-w-[180px] text-right">{data.address}</span>
        </div>

        {data.addressTo && (
          <div className="flex items-start justify-between">
            <span className="text-[12px] text-text-secondary">终点地址</span>
            <span className="text-[12px] text-text-body max-w-[180px] text-right">{data.addressTo}</span>
          </div>
        )}

        {data.note && (
          <div className="flex items-start justify-between">
            <span className="text-[12px] text-text-secondary">订单描述</span>
            <span className="text-[12px] text-text-body max-w-[180px] text-right">{data.note}</span>
          </div>
        )}

        {data.priceQuote && (
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-text-secondary">报价金额</span>
            <span className="text-[12px] text-text-body">¥{data.priceQuote}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[12px] text-text-secondary">下单时间</span>
          <span className="text-[12px] text-text-body">{data.createdAt}</span>
        </div>

        {data.images.length > 0 && (
          <div>
            <p className="text-[12px] text-text-secondary mb-2">现场照片</p>
            <div className="grid grid-cols-3 gap-2">
              {data.images.map((src, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-surface-page">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data.staffId && (() => {
        const staff = resolveStaff(data.staffId);
        if (!staff) return null;
        return (
          <div className="mx-3 mt-3 bg-white rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full overflow-hidden bg-primary-50 flex items-center justify-center flex-shrink-0">
                {staff.avatar ? (
                  <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[18px] text-primary font-medium">{staff.name[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-text-body font-medium">{staff.name}</p>
                <p className="text-[11px] text-text-tertiary">{staff.roleTag}</p>
                <div className="flex items-center gap-2 mt-1">
                  <TrustScoreBadge score={staff.trustScore} status={staff.trustStatus} />
                  {staff.phone && (
                    <span className="text-[11px] text-text-tertiary font-mono">{staff.phone}</span>
                  )}
                </div>
              </div>
              <button
                onClick={openStaffContact}
                className="px-3 h-8 rounded-full bg-primary text-white text-[12px] flex items-center gap-1 flex-shrink-0"
              >
                <Phone size={12} /> 联系
              </button>
            </div>
          </div>
        );
      })()}

      {data.status === "S40" && (
        <div className="mx-3 mt-3 bg-white rounded-xl p-5">
          <h3 className="text-[15px] text-text-body font-medium mb-4 text-center">
            {data.rating ? "我的评价" : "评价服务"}
          </h3>
          {data.rating ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={24}
                    className={star <= data.rating! ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#D1D5DB]"}
                  />
                ))}
              </div>
              <p className="text-[13px] text-text-tertiary">
                {data.ratedAt ? `已评价 · ${data.ratedAt}` : "已评价"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] text-text-body font-medium">服务评分</label>
                  <span className="text-[10px] text-text-tertiary">影响便民服务评价</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setSelectedRating(star)}>
                      <Star
                        size={28}
                        className={
                          star <= selectedRating
                            ? "text-[#F59E0B] fill-[#F59E0B]"
                            : "text-[#D1D5DB] hover:text-[#FCD34D] transition-colors"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {data.staffId && (
                <div className="border-t border-border-light pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[13px] text-text-body font-medium">服务人员评分</label>
                    <span className="text-[10px] text-text-tertiary">影响服务人员诚信分</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setStaffRating(star)}>
                        <Star
                          size={28}
                          className={
                            star <= (staffRating || 5)
                              ? "text-amber-400 fill-amber-400"
                              : "text-[#D1D5DB] hover:text-[#FCD34D] transition-colors"
                          }
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-[11px] text-text-tertiary">
                      {staffRating === 0 ? "默认5星" : `${staffRating}星`}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmitRating}
                disabled={selectedRating === 0}
                className={`w-full h-10 rounded-full text-[14px] ${
                  selectedRating > 0
                    ? "bg-primary text-white"
                    : "bg-[#E5E5E5] text-text-tertiary cursor-not-allowed"
                }`}
              >
                提交评价
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mx-3 mt-4 flex gap-3">
        {isCancelPending ? (
          <button className="flex-1 h-11 rounded-full border border-[#E5E5E5] text-text-secondary text-[14px]">
            取消申请已提交
          </button>
        ) : needsPayment ? (
          <>
            <button
              onClick={handleOpenDispute}
              className="flex-1 h-11 rounded-full border border-[#E5E5E5] text-text-secondary text-[14px]"
            >
              价格有异议
            </button>
            <button
              onClick={handlePay}
              className="flex-1 h-11 rounded-full bg-primary text-white text-[14px]"
            >
              立即支付
            </button>
          </>
        ) : hasCancel && hasConfirm ? (
          <>
            <button
              onClick={() => setShowCancelDialog(true)}
              className="flex-1 h-11 rounded-full border border-[#E5E5E5] text-text-secondary text-[14px]"
            >
              申请取消
            </button>
            <button
              onClick={handleConfirmComplete}
              className="flex-1 h-11 rounded-full bg-primary text-white text-[14px]"
            >
              确认完成
            </button>
          </>
        ) : hasCancel ? (
          <>
            <button
              onClick={() => setShowCancelDialog(true)}
              className="flex-1 h-11 rounded-full border border-[#E5E5E5] text-text-secondary text-[14px]"
            >
              申请取消
            </button>
            {hasContact && (
              <button
                onClick={openStaffContact}
                className="flex-1 h-11 rounded-full bg-primary text-white text-[14px]"
              >
                联系服务人员
              </button>
            )}
          </>
        ) : hasContact ? (
          <button
            onClick={openStaffContact}
            className="flex-1 h-11 rounded-full bg-primary text-white text-[14px]"
          >
            联系服务人员
          </button>
        ) : null}
      </div>
    </div>
  );
}
