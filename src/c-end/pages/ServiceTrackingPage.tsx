import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { PageHeader } from "./shop/PageHeader";
import { StatusProgress } from "../components/StatusProgress";
import { toast } from "sonner";
import { Phone, Clock, AlertCircle, User, Star } from "lucide-react";
import { useConvenienceStore } from "../../shared/mock";
import type { ConvenienceStatus } from "../../shared/types";

const STATUS_STEPS: ConvenienceStatus[] = ["S10", "A20", "A30", "A40", "S48", "S55", "S40"];
const STEP_LABELS = ["已下单", "已指派", "已接单", "已收款", "服务中", "完工待确认", "已完成"];

export function ServiceTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = useConvenienceStore((s) => s.orders.find((o) => o.id === id));
  const markPaid = useConvenienceStore((s) => s.markPaid);
  const completeService = useConvenienceStore((s) => s.completeService);
  const requestCancel = useConvenienceStore((s) => s.requestCancel);
  const [countdown, setCountdown] = useState(15 * 60);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputePrice, setDisputePrice] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [disputeImages, setDisputeImages] = useState<string[]>([]);
  const [waitTime, setWaitTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusSteps = useMemo(() => {
    const stateIdx = STATUS_STEPS.indexOf(order?.status ?? "S10");
    return STEP_LABELS.map((label, idx) => ({
      label,
      completed: order?.status === "S50" || (stateIdx >= 0 && idx < stateIdx),
    }));
  }, [order?.status]);

  // Countdown timer
  useEffect(() => {
    if (order?.status === "A35") {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [order?.status]);

  // Simulate wait time
  useEffect(() => {
    if (order?.status === "S10" || order?.status === "A10") {
      const t = setInterval(() => setWaitTime((prev) => prev + 1), 10000);
      return () => clearInterval(t);
    } else {
      setWaitTime(0);
    }
  }, [order?.status]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const isUrgent = countdown > 0 && countdown < 180;

  const handleCallStaff = () => {
    toast.info(`正在拨号 ${order?.staffPhone || "139****6666"}...`);
  };

  const handleConfirmPayment = () => {
    markPaid(order!.id, "online");
    toast.success("支付成功");
  };

  const handleDisputeSubmit = () => {
    if (!disputePrice.trim()) {
      toast.error("请输入期望价格");
      return;
    }
    if (!disputeReason) {
      toast.error("请选择异议原因");
      return;
    }
    toast.info("您的异议已提交，客服将在24小时内联系您");
    setShowDisputeForm(false);
    setDisputePrice("");
    setDisputeReason("");
    setDisputeImages([]);
  };

  const handleCancelOrder = () => {
    requestCancel(order!.id);
    toast("订单已取消");
  };

  const handleApplyCancel = () => {
    requestCancel(order!.id);
    toast.info("取消申请已提交，等待审批");
  };

  const handleViewDetail = () => {
    if (order) navigate(`/c/orders/${order.id}`);
  };

  const handleReview = () => {
    if (order) navigate(`/c/orders/${order.id}`);
  };

  // --- Bottom action bar ---

  const renderBottomBar = () => {
    const status = order?.status;
    if (!status) return null;
    if (["S10", "A10"].includes(status)) {
      return (
        <button
          onClick={handleCancelOrder}
          className="w-full h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
        >
          取消订单
        </button>
      );
    }
    if (["A20", "A30"].includes(status)) {
      return (
        <div className="flex gap-3">
          <button
            onClick={handleApplyCancel}
            className="flex-1 h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
          >
            申请取消
          </button>
          <button
            onClick={handleCallStaff}
            className="flex-1 h-11 rounded-full bg-primary text-white text-[14px]"
          >
            联系服务人员
          </button>
        </div>
      );
    }
    if (status === "A35") {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <button
              onClick={handleApplyCancel}
              className="flex-1 h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
            >
              申请取消
            </button>
            <button
              onClick={handleCallStaff}
              className="flex-1 h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
            >
              联系服务人员
            </button>
          </div>
          <button
            onClick={handleConfirmPayment}
            className="w-full h-11 rounded-full bg-primary text-white text-[14px]"
          >
            完成支付（{formatCountdown(countdown)}）
          </button>
        </div>
      );
    }
    if (["A40", "S48", "S55"].includes(status)) {
      return (
        <button
          onClick={handleCallStaff}
          className="w-full h-11 rounded-full bg-primary text-white text-[14px]"
        >
          联系服务人员
        </button>
      );
    }
    if (status === "S40") {
      return (
        <div className="flex gap-3">
          <button
            onClick={handleViewDetail}
            className="flex-1 h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
          >
            查看详情
          </button>
          <button
            onClick={handleReview}
            className="flex-1 h-11 rounded-full bg-primary text-white text-[14px]"
          >
            评价
          </button>
        </div>
      );
    }
    if (["S50", "R80"].includes(status)) {
      return (
        <button
          onClick={() => navigate(`/c/orders/${order?.id ?? "cancelled"}`)}
          className="w-full h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white"
        >
          查看详情
        </button>
      );
    }
    return null;
  };

  const showStaffCard = order?.status && !["S10", "A10", "S50", "R80"].includes(order.status);

  if (!order) {
    return (
      <div className="bg-surface-page min-h-full pb-[80px]">
        <PageHeader title="订单跟踪" />
        <div className="p-6 text-center text-text-tertiary">订单不存在</div>
      </div>
    );
  }

  return (
    <div className="bg-surface-page min-h-full pb-[80px]">
      <PageHeader title="订单跟踪" />

      <div className="px-3 pt-3 space-y-3">
        {/* Status progress bar */}
        <div className="bg-white rounded-2xl p-3">
          <StatusProgress steps={statusSteps} />
        </div>

        {/* Cancelled order card */}
        {(order?.status === "S50" || order?.status === "R80") && (
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-[28px] text-gray-400">!</span>
            </div>
            <p className="text-[15px] text-gray-500 font-medium">
              订单已取消
            </p>
            <p className="text-[13px] text-gray-400 mt-2">
              如有疑问请联系客服
            </p>
          </div>
        )}

        {/* Waiting experience area — shown before staff assignment */}
        {(order?.status === "S10" || order?.status === "A10") && (
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
              <div
                className="w-4 h-4 rounded-full bg-primary"
                style={{ animation: "pulse-soft 2s ease-in-out infinite" }}
              />
            </div>
            {waitTime < 5 && (
              <>
                <p className="text-[15px] text-text-heading font-medium">
                  正在为您安排服务人员...
                </p>
                <p className="text-[13px] text-text-tertiary mt-2">
                  通常5分钟内为您安排
                </p>
              </>
            )}
            {waitTime >= 5 && waitTime < 15 && (
              <>
                <p className="text-[15px] text-text-heading font-medium">
                  当前服务人员较忙，继续为您寻找中...
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setWaitTime(0)}
                    className="flex-1 h-10 rounded-full border border-border-light text-text-body text-[13px] bg-white"
                  >
                    继续等待
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    className="flex-1 h-10 rounded-full bg-primary text-white text-[13px]"
                  >
                    取消订单
                  </button>
                </div>
              </>
            )}
            {waitTime >= 15 && (
              <>
                <p className="text-[15px] text-text-heading font-medium">
                  暂无空闲服务人员
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setWaitTime(0)}
                    className="flex-1 h-10 rounded-full border border-border-light text-text-body text-[13px] bg-white"
                  >
                    继续等待（进人工队列）
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    className="flex-1 h-10 rounded-full bg-primary text-white text-[13px]"
                  >
                    取消订单
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Service staff card — shown after matching */}
        {showStaffCard && (
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center gap-3">
              {/* Avatar placeholder */}
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <User size={24} className="text-primary" />
              </div>

              {/* Staff info */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-text-heading font-medium">
                  {order?.staffName || "服务人员"}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[13px] text-text-secondary">
                    {order?.staffPhone || "暂无电话"}
                  </span>
                </div>
              </div>

              {/* Phone button */}
              <button
                onClick={handleCallStaff}
                className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
              >
                <Phone size={16} className="text-primary" />
              </button>
            </div>
          </div>
        )}

        {/* Price confirmation card — shown in prepay state only */}
        {order?.status === "A35" && (
          <div className="bg-white rounded-2xl p-4">
            <p className="text-[13px] text-text-body">
              服务人员已确认价格
            </p>

            {/* Amount display */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[32px] text-primary font-medium">
                ¥{(order.priceQuote ?? 0).toFixed(2)}
              </span>
              {order.refPrice != null && order.priceQuote != null && order.priceQuote > order.refPrice && (
                <span className="px-2 py-0.5 rounded-full text-[11px] text-orange-600 bg-orange-50 border border-orange-200">
                  高于参考价
                </span>
              )}
            </div>

            {/* Reference price hint */}
            {order.refPrice != null && (
              <p className="text-[12px] text-text-tertiary mt-1">
                该服务参考价为≤¥{order.refPrice.toFixed(2)}（仅供参考）
              </p>
            )}

            {/* Action buttons */}
            <div className="mt-4 space-y-3">
              <button
                onClick={handleConfirmPayment}
                className="w-full h-11 rounded-full bg-primary text-white text-[14px] active:opacity-90 transition-opacity"
              >
                确认支付
              </button>
              <button
                onClick={() => setShowDisputeForm(true)}
                className="w-full h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white active:bg-surface-page transition-colors"
              >
                价格有异议
              </button>
            </div>
          </div>
        )}

        {/* 15-min countdown — shown in A35 (quote pending) state */}
        {order?.status === "A35" && (
          <div className="bg-white rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              {isUrgent ? (
                <AlertCircle size={18} className="text-red-500" />
              ) : (
                <Clock size={18} className="text-primary" />
              )}
              <span className="text-[13px] text-text-secondary">
                支付剩余时间
              </span>
            </div>

            <p
              className={`text-[42px] font-mono mt-2 font-medium tracking-wider ${
                isUrgent ? "text-red-500" : "text-text-heading"
              }`}
            >
              {formatCountdown(countdown)}
            </p>

            <p className="text-[12px] text-text-tertiary mt-1">
              请尽快完成支付，超时订单将进入待人工处理
            </p>
          </div>
        )}

        {/* Dispute form */}
        {showDisputeForm && (
          <div className="bg-white rounded-2xl p-4 animate-fade-in-up">
            <p className="text-[15px] text-text-heading font-medium mb-4">
              价格异议
            </p>

            {/* Expected price input */}
            <div className="mb-3">
              <label className="text-[13px] text-text-secondary block mb-1">
                期望价格
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-text-tertiary">
                  ¥
                </span>
                <input
                  type="number"
                  value={disputePrice}
                  onChange={(e) => setDisputePrice(e.target.value)}
                  placeholder="请输入您期望的价格"
                  className="w-full h-10 pl-8 pr-3 rounded-lg bg-surface-page text-[14px] text-text-body outline-none placeholder:text-text-tertiary"
                />
              </div>
            </div>

            {/* Dispute reason select */}
            <div className="mb-4">
              <label className="text-[13px] text-text-secondary block mb-1">
                异议原因
              </label>
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

            {/* Photo upload */}
            <div className="mb-4">
              <label className="text-[13px] text-text-secondary block mb-1">
                现场照片
                <span className="text-text-tertiary ml-1">选填，最多3张</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;
                  const remaining = 3 - disputeImages.length;
                  const toRead = Array.from(files).slice(0, remaining);
                  toRead.forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        setDisputeImages((prev) => [...prev, ev.target.result as string]);
                      }
                    };
                    reader.readAsDataURL(file);
                  });
                  e.target.value = "";
                }}
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {disputeImages.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <img
                      src={img}
                      alt={`现场照片${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setDisputeImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/40 text-white text-[11px] flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {disputeImages.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border border-dashed border-border-light flex flex-col items-center justify-center text-text-tertiary text-[11px] gap-1"
                  >
                    <span className="text-[18px] leading-none">+</span>
                    <span>上传</span>
                  </button>
                )}
              </div>
            </div>

            {/* Form buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisputeForm(false);
                  setDisputePrice("");
                  setDisputeReason("");
                  setDisputeImages([]);
                }}
                className="flex-1 h-11 rounded-full border border-border-light text-text-body text-[14px] bg-white active:bg-surface-page transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDisputeSubmit}
                className="flex-1 h-11 rounded-full bg-primary text-white text-[14px] active:opacity-90 transition-opacity"
              >
                提交异议
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-border-light px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {renderBottomBar()}
      </div>
    </div>
  );
}
