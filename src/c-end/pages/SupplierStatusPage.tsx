import { useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "./shop/PageHeader";
import { Phone, Clock, CheckCircle, XCircle, Hourglass, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useSupplierStore } from "../../shared/stores/supplier-store";
import type { SupplierApplication } from "../../shared/types";

const STATUS_CONFIG = {
  pending: { label: "审核中", icon: Hourglass, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  approved: { label: "已通过", icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-200" },
  rejected: { label: "已驳回", icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
};

export function SupplierStatusPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<SupplierApplication[]>([]);
  const getByPhone = useSupplierStore((s) => s.getByPhone);

  const handleSearch = () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error("请输入正确的手机号");
      return;
    }
    const apps = getByPhone(phone);
    setResults(apps);
    setSearched(true);
  };

  return (
    <div className="min-h-full bg-surface-page pb-6">
      <PageHeader title="审核进度查询" back="/c/home" />

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <h3 className="text-[14px] font-medium text-text-heading">输入手机号查询</h3>
          <div className="flex gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入申请时填写的手机号"
              className="flex-1 h-11 px-4 rounded-xl border border-border-light bg-surface-page text-[14px] outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleSearch}
              className="h-11 px-5 rounded-xl bg-primary text-white text-[14px] font-medium active:scale-95 transition-transform"
            >
              查询
            </button>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div className="space-y-3">
            {results.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Phone size={24} className="text-gray-400" />
                </div>
                <p className="text-[14px] text-text-secondary">未查询到入驻申请记录</p>
                <p className="text-[12px] text-text-tertiary mt-1">请确认手机号是否正确</p>
                <button
                  onClick={() => navigate("/c/supplier-entry")}
                  className="mt-4 px-6 h-9 rounded-full border border-primary text-primary text-[13px]"
                >
                  前往入驻申请
                </button>
              </div>
            ) : (
              results.map((app) => {
                const cfg = STATUS_CONFIG[app.status];
                const StatusIcon = cfg.icon;
                return (
                  <div
                    key={app.id}
                    className={`bg-white rounded-2xl p-4 border ${cfg.border}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center`}>
                          <StatusIcon size={20} className={cfg.color} />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-medium text-text-heading flex items-center gap-1">
                            <Building2 size={14} className="text-text-tertiary" />
                            {app.companyName}
                          </h4>
                          <p className="text-[11px] text-text-tertiary">{app.businessType} · {app.contactName}</p>
                        </div>
                      </div>
                      <span className={`text-[12px] px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} font-medium`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="space-y-2 text-[12px] text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-text-tertiary" />
                        {app.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-text-tertiary" />
                        提交时间：{app.submittedAt}
                      </div>
                      {app.reviewedAt && (
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-text-tertiary" />
                          审核时间：{app.reviewedAt}
                        </div>
                      )}
                      {app.rejectReason && (
                        <div className="mt-2 p-2 rounded-lg bg-red-50 text-red-600 text-[12px]">
                          驳回原因：{app.rejectReason}
                        </div>
                      )}
                    </div>

                    {app.status === "approved" && (
                      <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
                        <p className="text-[12px] text-green-700">
                          恭喜！您的入驻申请已通过审核。<br />
                          现已获得丽江古城游桌面端登录权限，请前往使用。
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
