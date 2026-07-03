import { useState, useEffect, useRef } from "react";
import {
  X,
  Wallet,
  AlertTriangle,
  Camera,
  CheckCircle2,
  MapPin,
  Clock,
} from "lucide-react";
import { useConvenienceStore } from "../../store";

type Step = "quote" | "waiting" | "photo" | "proof" | "result";

type FlowOrder = {
  id: string;
  serviceType: string;
  address: string;
  addressTo?: string;
  pay?: "online" | "cash";
  refPrice?: number;
  amount?: string;
};

export function QuoteAndPhotoFlow({
  open,
  initial,
  onClose,
  order,
}: {
  open: boolean;
  initial: "quote" | "photo" | "proof";
  onClose: () => void;
  order?: FlowOrder;
}) {
  const [step, setStep] = useState<Step>(initial);
  const [amount, setAmount] = useState("");
  const [photos, setPhotos] = useState(0);
  const [waitTime, setWaitTime] = useState(900);
  const [timedOut, setTimedOut] = useState(false);
  const timeoutFired = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [captureTarget, setCaptureTarget] = useState<"photo" | "proof" | null>(null);

  useEffect(() => {
    if (open) {
      setStep(initial);
      setAmount("");
      setPhotos(0);
      setWaitTime(900);
      setTimedOut(false);
      timeoutFired.current = false;
      setCaptureTarget(null);
    }
  }, [open, initial]);

  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (captureTarget === "photo") {
        setPhotos((p) => Math.min(4, p + 1));
      } else if (captureTarget === "proof") {
        setPhotos((p) => Math.min(2, p + 1));
      }
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setCaptureTarget(null);
  };

  const triggerCapture = (target: "photo" | "proof") => {
    setCaptureTarget(target);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  useEffect(() => {
    if (!open || step !== "waiting") return;
    const t = setInterval(() => setWaitTime((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [open, step]);

  // Handle payment timeout → visual feedback only; store handles state via submitQuote timeout
  useEffect(() => {
    if (!open || step !== "waiting" || waitTime > 0 || timeoutFired.current) return;
    timeoutFired.current = true;
    setTimedOut(true);
  }, [open, step, waitTime]);

  if (!open) return null;

  const num = Number(amount) || 0;
  const refMax = order?.refPrice ?? 80;
  const refMin = Math.round(refMax * 0.4);
  const overRef = num > refMax;
  const underMin = amount !== "" && num > 0 && num < 1;
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  const onKey = (k: string) => {
    if (k === "del") setAmount((v) => v.slice(0, -1));
    else if (k === "." && amount.includes(".")) return;
    else if (amount.length < 6) setAmount((v) => v + k);
  };

  return (
    <div className="absolute inset-0 z-40 bg-surface-page flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={onClose}
          className="size-9 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(60,120,200,0.08)]"
        >
          <X className="size-4 text-text-secondary" />
        </button>
        <span className="text-[14px] text-text-heading">
          {step === "quote"
            ? "录入金额"
            : step === "waiting"
            ? "等待用户支付"
            : step === "photo"
            ? "完工拍照"
            : step === "proof"
            ? "上传支付凭证"
            : "完成"}
        </span>
        <div className="size-9" />
      </div>

      {step === "quote" && (
        <div className="flex-1 flex flex-col px-4">
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)]">
            <div className="text-[12px] text-text-tertiary">订单</div>
            <div className="mt-0.5 text-[14px] text-text-heading">
              {order?.serviceType ?? "生活垃圾清运"}{order?.address ? ` · ${order.address}` : ""}{order?.addressTo ? ` · ${order.addressTo}` : ""}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-text-tertiary">
              <MapPin className="size-3" /> 距您 0.8km · 已到场
            </div>
          </div>

          <div className="mt-3 bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)]">
            <div className="text-[12px] text-text-tertiary mb-1">服务金额</div>
            <div className="flex items-baseline gap-1">
              <span className="text-[30px] text-text-heading font-medium">
                ¥
              </span>
              <span className="text-[36px] text-text-heading font-medium tabular-nums">
                {amount || "0"}
              </span>
              <span className="ml-auto text-[11px] text-text-tertiary">
                参考 ¥{refMin}~¥{refMax}
              </span>
            </div>
            {overRef && (
              <div
                className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "#FEF3C7" }}
              >
                <AlertTriangle
                  className="size-3.5 shrink-0"
                  style={{ color: "#F59E0B" }}
                />
                <span className="text-[11px]" style={{ color: "#92400E" }}>
                  该金额高于参考价上限，用户可能发起价格异议
                </span>
              </div>
            )}
            {underMin && (
              <div
                className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "#FEE2E2" }}
              >
                <AlertTriangle
                  className="size-3.5 shrink-0"
                  style={{ color: "#EF4444" }}
                />
                <span className="text-[11px]" style={{ color: "#991B1B" }}>
                  报价金额不能低于 ¥1
                </span>
              </div>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
              {[String(refMin), String(Math.round((refMin + refMax) / 2)), String(refMax)].map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p)}
                  className="h-8 rounded-full bg-primary-50 text-primary"
                >
                  ¥{p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pb-3">
            <button
              disabled={num < 1}
              onClick={() => {
                if (order && num >= 1) {
                  useConvenienceStore.getState().submitQuote(order.id, num);
                }
                setStep("waiting");
              }}
              className="w-full h-12 rounded-2xl text-white text-[14px] font-medium disabled:opacity-40"
              style={{
                background: "#F59E0B",
                boxShadow: "0 4px 12px rgba(245,158,11,0.32)",
              }}
            >
              确认报价 · ¥{amount || "0"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 px-3 pb-6 bg-[#F8FAFC] -mx-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map(
              (k, i) => (
                <button
                  key={i}
                  onClick={() => onKey(k)}
                  className="h-12 rounded-xl bg-white text-[20px] text-text-heading flex items-center justify-center active:bg-primary-50"
                >
                  {k === "del" ? "⌫" : k}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {step === "waiting" && (
        <div className="flex-1 flex flex-col items-center px-6 pt-8">
          <div
            className="size-20 rounded-full flex items-center justify-center"
            style={{ background: timedOut ? "#FEE2E2" : "#EDE9FE", color: timedOut ? "#EF4444" : "#7C3AED" }}
          >
            {timedOut ? <AlertTriangle className="size-10" /> : <Wallet className="size-10" />}
          </div>
          <div className="mt-4 text-[16px] text-text-heading font-medium">
            {timedOut ? "支付超时" : "等待用户线上支付"}
          </div>
          {timedOut ? (
            <div className="mt-3 text-[13px] text-text-secondary text-center leading-relaxed">
              用户 15 分钟内未完成支付，订单已自动转入「待人工处理」，请联系客服或用户线下处理。
            </div>
          ) : (
            <div
              className="mt-3 px-5 py-2 rounded-2xl text-white text-[24px] font-medium tabular-nums"
              style={{ background: "#7C3AED" }}
            >
              {fmt(waitTime)}
            </div>
          )}
          {!timedOut && (
            <div className="mt-2 text-[11px] text-text-tertiary text-center">
              超时 15 分钟未支付订单将转入「待人工处理」
            </div>
          )}

          <div className="mt-5 w-full bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)] space-y-2">
            <Row label="服务金额" value={`¥${amount}`} />
            <Row label="收款方式" value={order?.pay === "cash" ? "现金收款" : "线上预付（资金平台托管）"} />
            <Row label="订单号" value={order?.id ?? "LJ-S-2026050899"} />
          </div>

          <div className="mt-auto w-full pb-6 pt-4 space-y-2">
            {timedOut ? (
              <button
                onClick={onClose}
                className="w-full h-12 rounded-2xl text-white text-[14px] font-medium"
                style={{
                  background: "#9F1239",
                  boxShadow: "0 4px 12px rgba(159,18,57,0.32)",
                }}
              >
                返回订单列表
              </button>
            ) : order?.pay === "cash" ? (
              <>
                <div className="w-full h-12 rounded-2xl bg-gray-100 text-text-tertiary text-[14px] flex items-center justify-center">
                  等待用户现金支付
                </div>
                <button
                  onClick={() => {
                    if (order) {
                      useConvenienceStore.getState().markPaid(order.id, "cash");
                    }
                    setStep("photo");
                  }}
                  className="w-full h-10 rounded-2xl bg-white border border-[#E5E7EB] text-[12px] text-text-secondary"
                >
                  用户已支付，去开始服务
                </button>
                <button
                  onClick={onClose}
                  className="w-full h-10 rounded-2xl bg-white border border-[#E5E7EB] text-[12px] text-text-secondary"
                >
                  返回订单列表
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (order) {
                      useConvenienceStore.getState().markPaid(order.id, "online");
                    }
                    setStep("photo");
                  }}
                  className="w-full h-12 rounded-2xl text-white text-[14px] font-medium"
                  style={{
                    background: "#10B981",
                    boxShadow: "0 4px 12px rgba(16,185,129,0.32)",
                  }}
                >
                  用户已支付，去开始服务
                </button>
                <button
                  onClick={onClose}
                  className="w-full h-10 rounded-2xl bg-white border border-[#E5E7EB] text-[12px] text-text-secondary"
                >
                  返回订单列表
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {step === "photo" && (
        <div className="flex-1 flex flex-col px-4">
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)]">
            <div className="text-[12px] text-text-tertiary">服务时长</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[14px] text-text-heading">
              <Clock className="size-4" /> 18 分钟
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => {
              const filled = i < photos;
              return (
                <button
                  key={i}
                  onClick={() => { if (!filled) triggerCapture("photo"); }}
                  className="aspect-square rounded-2xl overflow-hidden relative border-2 border-dashed"
                  style={{
                    borderColor: filled ? "#F59E0B" : "#D6E8F8",
                    background: filled
                      ? "linear-gradient(135deg,#FCD9A8,#F59E0B)"
                      : "#F8FAFC",
                  }}
                >
                  {filled ? (
                    <>
                      <Camera className="size-8 text-white absolute inset-0 m-auto" />
                      <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded-md bg-black/45 backdrop-blur text-white text-[9px]">
                        {new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })} · 大研街道
                      </div>
                    </>
                  ) : (
                    <div className="size-full flex flex-col items-center justify-center gap-1 text-text-tertiary">
                      <Camera className="size-5" />
                      <span className="text-[10px]">拍摄完工照</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-1 text-[11px] text-text-tertiary px-1">
            照片自带时间和位置水印 · 已上传 {photos} / 4 张（至少 1 张）
          </div>

          <div className="mt-auto pb-6">
            <button
              disabled={photos === 0}
              onClick={() => {
                if (order && photos > 0) {
                  useConvenienceStore.getState().completeService(order.id, [`photo_${order.id}_${Date.now()}`]);
                }
                setStep("result");
              }}
              className="w-full h-12 rounded-2xl text-white text-[14px] font-medium disabled:opacity-40"
              style={{
                background: "#F59E0B",
                boxShadow: "0 4px 12px rgba(245,158,11,0.32)",
              }}
            >
              确认完成
            </button>
          </div>
        </div>
      )}

      {step === "proof" && (
        <div className="flex-1 flex flex-col px-4">
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(60,120,200,0.08)]">
            <div className="text-[12px] text-text-tertiary">订单</div>
            <div className="mt-0.5 text-[14px] text-text-heading">
              {order?.serviceType ?? "生活垃圾清运"} · ¥{amount || "0"}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {[0, 1].map((i) => {
              const filled = i < photos;
              return (
                <button
                  key={i}
                  onClick={() => { if (!filled) triggerCapture("proof"); }}
                  className="aspect-square rounded-2xl overflow-hidden relative border-2 border-dashed"
                  style={{
                    borderColor: filled ? "#10B981" : "#D6E8F8",
                    background: filled
                      ? "linear-gradient(135deg,#A7F3D0,#10B981)"
                      : "#F8FAFC",
                  }}
                >
                  {filled ? (
                    <Camera className="size-8 text-white absolute inset-0 m-auto" />
                  ) : (
                    <div className="size-full flex flex-col items-center justify-center gap-1 text-text-tertiary">
                      <Camera className="size-5" />
                      <span className="text-[10px]">拍摄支付凭证</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-1 text-[11px] text-text-tertiary px-1">
            至少上传 1 张支付凭证照片
          </div>

          <div className="mt-auto pb-6">
            <button
              disabled={photos === 0}
              onClick={() => {
                if (order && photos > 0) {
                  useConvenienceStore.getState().uploadPaymentProof(order.id, `proof_${order.id}`);
                }
                onClose();
              }}
              className="w-full h-12 rounded-2xl text-white text-[14px] font-medium disabled:opacity-40"
              style={{
                background: "#10B981",
                boxShadow: "0 4px 12px rgba(16,185,129,0.32)",
              }}
            >
              确认已上传
            </button>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="flex-1 flex flex-col items-center px-6 pt-12">
          <div
            className="size-20 rounded-full flex items-center justify-center"
            style={{ background: "#D1FAE5", color: "#059669" }}
          >
            <CheckCircle2 className="size-10" />
          </div>
          <div className="mt-4 text-[18px] text-text-heading font-medium">
            订单已完成
          </div>
          <div className="mt-1 text-[12px] text-text-tertiary text-center">
            服务已完成，等待 C 端用户确认后即可到账
          </div>

          <div className="mt-5 w-full bg-primary-50/60 rounded-2xl p-4 space-y-2">
            <Row label="订单号" value={order?.id ?? "LJ-S-2026050899"} />
            <Row label="服务金额" value={`¥${amount || "0"}`} />
            <Row label="服务时长" value="18 分钟" />
            <Row label="完工照片" value={`${photos || 1} 张`} />
          </div>

          <div className="mt-auto w-full pb-6 pt-6">
            <button
              onClick={onClose}
              className="w-full h-12 rounded-2xl text-white text-[14px] font-medium"
              style={{
                background: "#F59E0B",
                boxShadow: "0 4px 12px rgba(245,158,11,0.32)",
              }}
            >
              完成
            </button>
          </div>
        </div>
      )}
      {/* Hidden file input for camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="camera"
        onChange={handleFileCapture}
        className="hidden"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-text-tertiary">{label}</span>
      <span className="text-[12px] text-text-heading">{value}</span>
    </div>
  );
}
