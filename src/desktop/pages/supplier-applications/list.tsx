import { useState } from "react";
import { useNavigate } from "react-router";
import { PageLayout } from "../../components/common/PageLayout";
import { DataTable } from "../../components/common/DataTable";
import { Button } from "../../../shared/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "../../../shared/components/ui/dialog";
import { useSupplierStore } from "../../../shared/services/supplier";
import type { SupplierApplication } from "../../../shared/types";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Building2, Phone, Clock } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

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

export default function SupplierApplicationsList() {
  const navigate = useNavigate();
  const { applications, updateStatus } = useSupplierStore();
  const [filter, setFilter] = useState<"all" | SupplierApplication["status"]>("all");
  const [approveTarget, setApproveTarget] = useState<SupplierApplication | null>(null);

  const filtered = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  const columns: ColumnDef<SupplierApplication>[] = [
    {
      accessorKey: "companyName",
      header: "公司名称",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 size={14} className="text-primary" />
          </div>
          <span className="font-medium">{row.original.companyName}</span>
        </div>
      ),
    },
    { accessorKey: "contactName", header: "联系人" },
    {
      accessorKey: "phone",
      header: "联系电话",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs">
          <Phone size={12} className="text-text-tertiary" />
          {row.original.phone}
        </span>
      ),
    },
    { accessorKey: "businessType", header: "经营类型" },
    {
      accessorKey: "submittedAt",
      header: "申请时间",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs text-text-secondary">
          <Clock size={12} />
          {row.original.submittedAt}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => (
        <StatusBadge
          status={STATUS_LABELS[row.original.status]}
          color={STATUS_COLORS[row.original.status]}
        />
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => navigate(`/desktop/supplier-applications/${row.original.id}`)}
          >
            查看
          </Button>
          {row.original.status === "pending" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-green-600"
                onClick={() => setApproveTarget(row.original)}
              >
                通过
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-600"
                onClick={() => navigate(`/desktop/supplier-applications/${row.original.id}?action=reject`)}
              >
                驳回
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageLayout
      title="供应商入驻申请"
      breadcrumbs={[{ label: "商城管理" }, { label: "供应商入驻申请" }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(["all", "pending", "approved", "rejected"] as const).map((f, i) => {
          const count = f === "all" ? applications.length : applications.filter((a) => a.status === f).length;
          const colors = ["bg-blue-50 text-blue-600", "bg-amber-50 text-amber-600", "bg-green-50 text-green-600", "bg-red-50 text-red-600"];
          const labels = ["全部申请", "待审核", "已通过", "已驳回"];
          return (
            <div
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${colors[i]} ${
                filter === f ? "ring-2 ring-primary" : ""
              }`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs mt-1 opacity-80">{labels[i]}</p>
            </div>
          );
        })}
      </div>

      <DataTable columns={columns} data={filtered} />

      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认通过申请</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              确定要通过 <span className="font-medium text-foreground">{approveTarget?.companyName}</span> 的入驻申请吗？
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              联系人：{approveTarget?.contactName} · {approveTarget?.phone}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>取消</Button>
            <Button onClick={() => {
              if (approveTarget) {
                updateStatus(approveTarget.id, "approved", "管理员");
                toast.success(`已通过：${approveTarget.companyName}`);
                setApproveTarget(null);
              }
            }}>确认通过</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
