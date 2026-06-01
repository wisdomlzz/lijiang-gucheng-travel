import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { PageHeader } from "./shop/PageHeader";
import { useComplaintStore } from "../../shared/mock/complaint";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { MapPin, Clock, CheckCircle, XCircle, Phone, FileText, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  C10: { label: "已提交", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  C40: { label: "已处理", icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
  CR: { label: "已驳回", icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
};

const TIMELINE = [
  { status: "C10", label: "提交投诉" },
  { status: "C40", label: "处理完成" },
];

export function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const complaints = useComplaintStore((s) => s.complaints);
  const complaintPhone = useComplaintStore((s) => s.complaintPhone);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const complaint = complaints.find((c) => c.id === id);

  if (!complaint) {
    return (
      <div className="min-h-full bg-surface-page">
        <PageHeader title="投诉详情" back="/c/my-complaints" />
        <div className="flex flex-col items-center py-24 text-text-tertiary">
          <p className="text-[14px]">投诉不存在</p>
          <button
            onClick={() => navigate("/c/my-complaints")}
            className="mt-4 px-6 h-9 rounded-full bg-primary text-white text-[13px]"
          >
            返回我的投诉
          </button>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.C10;
  const Icon = cfg.icon;
  const isRejected = complaint.status === "CR";
  const isPending = complaint.status === "C10";
  const isResolved = complaint.status === "C40";
  const currentStep = isResolved ? 1 : 0;

  return (
    <div className="min-h-full bg-surface-page pb-6">
      <PageHeader title="投诉详情" back="/c/my-complaints" />

      <div className="px-3 py-4 space-y-4">
        {/* 状态 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color}`}>
              <Icon size={12} />
              {cfg.label}
            </span>
            <span className="text-[11px] text-text-tertiary font-mono">{complaint.id}</span>
          </div>

          {/* 进度时间线 - 已驳回为独立分支状态 */}
          {isRejected ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center w-full">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium bg-primary text-white">
                    <CheckCircle size={12} />
                  </div>
                  <span className="text-[10px] mt-1 text-primary">提交投诉</span>
                </div>
                <div className="flex-1 h-0.5 mx-1 bg-slate-200" />
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium bg-red-500 text-white">
                    <XCircle size={12} />
                  </div>
                  <span className="text-[10px] mt-1 text-red-500">已驳回</span>
                </div>
              </div>
              <div className="mt-2 w-full rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600">
                投诉已被驳回，如有异议可补充材料后重新提交
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              {TIMELINE.map((step, idx) => {
                const done = idx <= currentStep;
                return (
                  <div key={step.status} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
                        done ? "bg-primary text-white" : "bg-slate-100 text-text-tertiary"
                      }`}>
                        {done ? <CheckCircle size={12} /> : idx + 1}
                      </div>
                      <span className={`text-[10px] mt-1 ${done ? "text-primary" : "text-text-tertiary"}`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < TIMELINE.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${idx < currentStep ? "bg-primary" : "bg-slate-100"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 操作按钮 - 待处理状态 */}
        {isPending && (
          <div className="flex gap-2">
            <button
              onClick={() => toast.info("补充材料功能开发中")}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-primary text-white text-[13px] font-medium active:opacity-80"
            >
              <FileText size={14} />
              补充材料
            </button>
            <button
              onClick={() => {
                if (confirm("确定要撤回该投诉吗？")) {
                  toast.success("投诉已撤回");
                  navigate("/c/my-complaints");
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white border border-slate-200 text-text-secondary text-[13px] font-medium active:opacity-80"
            >
              <RotateCcw size={14} />
              撤回投诉
            </button>
          </div>
        )}

        {/* 操作按钮 - 已驳回状态 */}
        {isRejected && (
          <div className="flex gap-2">
            <button
              onClick={() => toast.info("补充材料功能开发中")}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-primary text-white text-[13px] font-medium active:opacity-80"
            >
              <FileText size={14} />
              补充材料
            </button>
            <button
              onClick={() => {
                if (confirm("确定要撤回该投诉吗？")) {
                  toast.success("投诉已撤回");
                  navigate("/c/my-complaints");
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white border border-slate-200 text-text-secondary text-[13px] font-medium active:opacity-80"
            >
              <RotateCcw size={14} />
              撤回投诉
            </button>
          </div>
        )}

        {/* 基本信息 */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <div className="text-[13px] font-medium text-text-heading border-b border-slate-50 pb-2">投诉信息</div>
          <InfoRow label="问题类型">{complaint.type}</InfoRow>
          <InfoRow label="反映内容">
            <span className="whitespace-pre-wrap">{complaint.content}</span>
          </InfoRow>
          {complaint.targetName && <InfoRow label="当事对象">{complaint.targetName}</InfoRow>}
          {complaint.objectType && <InfoRow label="对象类型">{complaint.objectType}</InfoRow>}
          {complaint.incidentArea && <InfoRow label="事发区域">{complaint.incidentArea}</InfoRow>}
          {complaint.incidentLocation && <InfoRow label="事发地点">{complaint.incidentLocation}</InfoRow>}
          {complaint.doorplate && <InfoRow label="门牌号">{complaint.doorplate}</InfoRow>}
          <InfoRow label="上报人">{complaint.reporterName || "—"}{complaint.reporterType ? `（${complaint.reporterType}）` : ""}</InfoRow>
          <InfoRow label="联系电话">{complaint.reporterPhone || "—"}</InfoRow>
          <InfoRow label="提交时间">{new Date(complaint.createdAt).toLocaleString("zh-CN")}</InfoRow>
        </div>

        {/* 处理结果 */}
        {complaint.result && (
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
            <div className="text-[13px] font-medium text-text-heading border-b border-slate-50 pb-2">
              {complaint.status === "CR" ? "驳回原因" : "处理结果"}
            </div>
            <p className="text-[13px] text-text-secondary whitespace-pre-wrap leading-relaxed">{complaint.result}</p>
            {complaint.handledAt && (
              <p className="text-[11px] text-text-tertiary">处理时间：{complaint.handledAt}</p>
            )}
          </div>
        )}

        {/* 附件图片 - 可点击预览 */}
        {complaint.images.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
            <div className="text-[13px] font-medium text-text-heading border-b border-slate-50 pb-2">附件图片</div>
            <div className="flex gap-2 flex-wrap">
              {complaint.images.map((img) => (
                <button
                  key={img}
                  onClick={() => setPreviewImage(img)}
                  className="w-20 h-16 rounded-lg overflow-hidden active:opacity-80"
                >
                  <ImageWithFallback src={img} alt="附件" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 紧急联系电话 */}
        {complaintPhone && (
          <div className="rounded-xl bg-white p-4 flex items-center gap-3 shadow-sm">
            <Phone size={16} className="text-primary shrink-0" />
            <div className="flex-1">
              <div className="text-[12px] text-text-tertiary">紧急问题可拨打平台投诉电话</div>
              <a href={`tel:${complaintPhone}`} className="text-[15px] font-medium text-primary">{complaintPhone}</a>
            </div>
          </div>
        )}
      </div>

      {/* 图片全屏预览 */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
        >
          <img
            src={previewImage}
            alt="大图预览"
            className="max-w-full max-h-full object-contain p-4"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-20 text-[12px] text-text-tertiary">{label}</span>
      <span className="flex-1 text-[13px] text-text-secondary">{children}</span>
    </div>
  );
}
