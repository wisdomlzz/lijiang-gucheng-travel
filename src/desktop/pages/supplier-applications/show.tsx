import { useParams, useNavigate, useSearchParams } from "react-router";
import { useState } from "react";
import { PageLayout } from "../../components/common/PageLayout";
import { Button } from "../../../shared/components/ui/button";
import { useSupplierStore } from "../../../features/supplier/store";
import type { SupplierApplication } from "../../../shared/types";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import {
  ArrowLeft, Check, X, Building2, User, Phone, MapPin, FileText,
  AlignLeft, Clock, CheckCircle, XCircle
} from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<SupplierApplication["status"], string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回",
};

const STATUS_COLORS: Record<SupplierApplication["status"], string> = {
  pending: "bg-amber-50 text-amber-600",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
};

export default function SupplierApplicationShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { applications, updateStatus } = useSupplierStore();
  const app = applications.find((a) => a.id === id);

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(searchParams.get("action") === "reject");

  if (!app) {
    return (
      <PageLayout
        title="申请详情"
        breadcrumbs={[{ label: "商城管理" }, { label: "供应商入驻申请" }, { label: "详情" }]}
      >
        <div className="text-center py-20 text-text-tertiary">申请不存在</div>
      </PageLayout>
    );
  }

  const handleApprove = () => {
    updateStatus(app.id, "approved", "管理员");
    toast.success("已通过申请");
    navigate("/desktop/supplier-applications");
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("请填写驳回原因");
      return;
    }
    updateStatus(app.id, "rejected", "管理员", rejectReason);
    toast.success("已驳回申请");
    navigate("/desktop/supplier-applications");
  };

  const infoRows = [
    { label: "公司名称", value: app.companyName, icon: Building2 },
    { label: "联系人", value: app.contactName, icon: User },
    { label: "联系电话", value: app.phone, icon: Phone },
    { label: "经营类型", value: app.businessType, icon: FileText },
    { label: "经营地址", value: app.address, icon: MapPin },
    { label: "营业执照号", value: app.licenseNo, icon: FileText },
    { label: "提交时间", value: app.submittedAt, icon: Clock },
    { label: "经营范围", value: app.description, icon: AlignLeft, span: true },
  ];

  return (
    <PageLayout
      title="申请详情"
      breadcrumbs={[{ label: "商城管理" }, { label: "供应商入驻申请" }, { label: app.companyName }]}
    >
      <div className="max-w-2xl">
        {/* Status Banner */}
        <div className={`rounded-xl p-4 mb-6 border flex items-center justify-between ${
          app.status === "pending" ? "bg-amber-50 border-amber-200" :
          app.status === "approved" ? "bg-green-50 border-green-200" :
          "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-3">
            {app.status === "pending" && <Clock size={24} className="text-amber-500" />}
            {app.status === "approved" && <CheckCircle size={24} className="text-green-500" />}
            {app.status === "rejected" && <XCircle size={24} className="text-red-500" />}
            <div>
              <p className="text-[14px] font-medium">{STATUS_LABELS[app.status]}</p>
              {app.reviewedAt && (
                <p className="text-[12px] text-text-secondary mt-0.5">
                  审核时间：{app.reviewedAt} · {app.reviewer}
                </p>
              )}
            </div>
          </div>
          <StatusBadge
            status={STATUS_LABELS[app.status]}
            color={STATUS_COLORS[app.status]}
          />
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl p-6 mb-6">
          <h3 className="text-[14px] font-medium text-text-heading mb-4">基本信息</h3>
          <div className="space-y-3">
            {infoRows.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className={`flex items-start gap-3 ${row.span ? "flex-col" : ""}`}
                >
                  <div className="flex items-center gap-2 w-28 flex-shrink-0">
                    <Icon size={14} className="text-text-tertiary" />
                    <span className="text-[13px] text-text-tertiary">{row.label}</span>
                  </div>
                  <span className={`text-[13px] text-text-body ${row.span ? "mt-1" : ""}`}>
                    {row.value}
                  </span>
                </div>
              );
            })}
          </div>

          {/* License Image */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-[13px] text-text-tertiary mb-2">营业执照</p>
            <img
              src={app.licenseImg}
              alt="营业执照"
              className="w-full max-w-md rounded-xl object-cover h-48"
            />
          </div>

          {/* Reject Reason */}
          {app.rejectReason && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-[12px] text-red-600">驳回原因：{app.rejectReason}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {app.status === "pending" && (
          <div className="bg-white rounded-xl p-6">
            {showRejectForm ? (
              <div className="space-y-3">
                <label className="text-[13px] text-text-secondary">驳回原因</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入驳回原因"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border-light text-[14px] outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    onClick={handleApprove}
                  >
                    <Check size={16} className="mr-1" />
                    确认通过
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleReject}
                  >
                    <X size={16} className="mr-1" />
                    确认驳回
                  </Button>
                </div>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="w-full text-center text-[13px] text-text-tertiary"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={handleApprove}
                >
                  <Check size={16} className="mr-1" />
                  通过
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setShowRejectForm(true)}
                >
                  <X size={16} className="mr-1" />
                  驳回
                </Button>
              </div>
            )}
          </div>
        )}

        <Button variant="outline" className="mt-4" onClick={() => navigate("/desktop/supplier-applications")}>
          <ArrowLeft size={16} className="mr-1" />
          返回列表
        </Button>
      </div>
    </PageLayout>
  );
}
