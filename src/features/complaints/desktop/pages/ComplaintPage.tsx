import { useMemo, useState } from "react";
import { Card, CardContent } from "../../../../shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table";
import { Button } from "../../../../shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../shared/components/ui/dialog";
import { Input } from "../../../../shared/components/ui/input";
import { PageLayout } from "../../../../desktop/components/common/PageLayout";
import { PaginationBar } from "@/shared/components/ui/data-toolbar";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { useAuthStore } from "../../../../platform/auth";
import { useConvenienceStore } from "../../../../features/convenience/store";
import { useComplaintStore } from "../../store";
import { usePagination } from "@/shared/hooks/usePagination";
import {
  Phone, Eye, MapPin, UserRound, Building2, Image as ImageIcon,
  CheckCircle2, XCircle, Clock, MessageSquare, BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import type { Complaint, ComplaintStatus } from "../../../../shared/types";

type ComplaintWithOrder = Complaint & { order?: any };

const STATUS_META: Record<ComplaintStatus, { label: string; accent: string; bg: string; icon: typeof Clock }> = {
  C10: { label: "已提交", accent: "#D97706", bg: "#FEF3C7", icon: Clock },
  C40: { label: "已处理", accent: "#059669", bg: "#D1FAE5", icon: BadgeCheck },
  CR:  { label: "已驳回", accent: "#DC2626", bg: "#FEE2E2", icon: XCircle },
};

const statusActions: Record<string, { label: string; action: string }[]> = {
  C10: [{ label: "处理完成", action: "resolve" }, { label: "驳回", action: "reject" }],
};

function getOrderSupplierId(staffId?: string): string {
  return staffId ? "sup_001" : "sup_004";
}

export default function ComplaintPage() {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"全部" | ComplaintStatus>("全部");
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resultText, setResultText] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.roles?.includes("platform_admin") ?? false;
  const complaints = useComplaintStore((s) => s.complaints);
  const orders = useConvenienceStore((s) => s.orders);
  const complaintPhone = useComplaintStore((s) => s.complaintPhone);
  const updateComplaintPhone = useComplaintStore((s) => s.updateComplaintPhone);

  const fullList = useMemo(() => {
    const raw = isSuperAdmin
      ? complaints
      : complaints.filter((c) => {
          const order = orders.find((o) => o.id === c.orderId);
          return getOrderSupplierId(order?.staffId) === user?.supplierId;
        });
    return raw.map((c) => ({
      ...c,
      order: orders.find((o) => o.id === c.orderId),
    }));
  }, [complaints, orders, isSuperAdmin, user?.supplierId]);

  const list = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return fullList.filter((item) => {
      const statusHit = statusFilter === "全部" || item.status === statusFilter;
      if (!keyword) return statusHit;
      const haystack = [
        item.id, item.orderId, item.reporterName, item.reporterPhone,
        item.targetName, item.objectType, item.incidentArea, item.incidentLocation,
        item.doorplate, item.type, item.content,
      ].filter(Boolean).join(" ").toLowerCase();
      return statusHit && haystack.includes(keyword);
    });
  }, [fullList, search, statusFilter]);

  const [pageSize, setPageSize] = useState(10);
  const pagination = usePagination(list, pageSize);

  const detail = useMemo(
    () => (detailId ? fullList.find((item) => item.id === detailId) ?? null : null),
    [detailId, fullList],
  );

  const stats = useMemo(() => [
    { label: "全部", value: fullList.length, color: "#2563EB", bg: "#EFF6FF", icon: MessageSquare },
    { label: "已提交", value: fullList.filter((c) => c.status === "C10").length, color: "#D97706", bg: "#FEF3C7", icon: Clock },
    { label: "已处理", value: fullList.filter((c) => c.status === "C40").length, color: "#059669", bg: "#D1FAE5", icon: BadgeCheck },
    { label: "已驳回", value: fullList.filter((c) => c.status === "CR").length, color: "#DC2626", bg: "#FEE2E2", icon: XCircle },
  ], [fullList]);

  const openResolveDialog = (id: string) => { setResolveId(id); setResultText(""); setShowResolveDialog(true); };
  const confirmResolve = () => {
    if (resolveId) {
      useComplaintStore.getState().resolveWithResult(resolveId, resultText || "已处理完毕，请知悉。");
      toast.success("已处理完成");
      setShowResolveDialog(false); setResolveId(null); setResultText("");
    }
  };
  const openRejectDialog = (id: string) => { setRejectId(id); setRejectReason(""); setShowRejectDialog(true); };
  const confirmReject = () => {
    if (!rejectId) return;
    if (!rejectReason.trim()) { toast.error("请填写驳回原因"); return; }
    useComplaintStore.getState().reject(rejectId, rejectReason.trim());
    toast.success("已驳回");
    setShowRejectDialog(false); setRejectId(null); setRejectReason("");
  };

  const actionFn: Record<string, (id: string) => void> = {
    resolve: (id) => openResolveDialog(id),
    reject: (id) => openRejectDialog(id),
  };

  const renderActions = (item: ComplaintWithOrder) => {
    const actions = statusActions[item.status];
    if (!actions) return <span className="text-xs text-slate-300">—</span>;
    return actions.map((act) => (
      <Button key={act.action} size="sm" variant="ghost" className="h-7 text-xs" onClick={() => actionFn[act.action]?.(item.id)}>
        {act.label}
      </Button>
    ));
  };

  return (
    <PageLayout title="投诉管理" description={isSuperAdmin ? "游客投诉处理与归档" : "与自己便民服务订单相关的投诉"}>

      {/* Platform Phone */}
      {isSuperAdmin && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3">
          <Phone size={15} className="text-slate-400 shrink-0" />
          <span className="text-[13px] text-slate-400 shrink-0">平台投诉电话</span>
          {editPhone ? (
            <>
              <Input value={phoneValue} onChange={(e) => setPhoneValue(e.target.value)} className="w-48 h-8 text-sm" placeholder="输入电话号码" />
              <Button size="sm" className="h-8 text-xs" onClick={() => { updateComplaintPhone(phoneValue); toast.success("已保存"); setEditPhone(false); }}>保存</Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditPhone(false)}>取消</Button>
            </>
          ) : (
            <>
              <span className="text-[13px] font-medium text-slate-700">{complaintPhone}</span>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-400" onClick={() => { setPhoneValue(complaintPhone); setEditPhone(true); }}>修改</Button>
            </>
          )}
          <span className="text-[11px] text-slate-300 ml-auto">同步展示在 C 端投诉页</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
            >
              <Card className="rounded-xl border-slate-100 overflow-hidden">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-lg" style={{ background: s.bg }}>
                    <Icon className="size-5" style={{ color: s.color }} />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 tracking-wide">{s.label}</div>
                    <div className="text-xl font-semibold tracking-tight mt-0.5" style={{ color: s.color }}>{s.value}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Table Card */}
      <Card className="rounded-xl border-slate-100">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="投诉单号 / 上报人 / 当事对象 / 门牌号"
              className="h-8 w-72 text-[12px]"
            />
            <select
              className="h-8 rounded-lg border border-slate-150 bg-white px-2.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "全部" | ComplaintStatus)}
            >
              <option value="全部">全部状态</option>
              <option value="C10">已提交</option>
              <option value="C40">已处理</option>
              <option value="CR">已驳回</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">投诉单号</TableHead>
                <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">上报人</TableHead>
                <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">当事对象</TableHead>
                <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">事发地点</TableHead>
                <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">问题类型</TableHead>
                <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">状态</TableHead>
                <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wider text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.map((c) => {
                const meta = STATUS_META[c.status];
                const Icon = meta.icon;
                return (
                  <TableRow key={c.id} className="group hover:bg-slate-50/60 transition-colors">
                    <TableCell>
                      <span className="font-mono text-[12px] text-slate-500">{c.id}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-[13px] text-slate-700 font-medium">{c.reporterName || "游客"}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{c.reporterType || "游客"} · {c.reporterPhone || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[13px] text-slate-700">{c.targetName ?? "—"}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{c.objectType ?? c.order?.serviceType ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[13px] text-slate-700">{c.incidentLocation || c.order?.address || "—"}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{c.incidentArea || "—"} · {c.doorplate || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[13px] text-slate-700">{c.type}</div>
                      {!c.order && (
                        <span className="text-[11px] text-slate-300 mt-0.5 inline-block">非订单投诉</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: meta.bg, color: meta.accent }}
                      >
                        <Icon className="size-3" />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500" onClick={() => setDetailId(c.id)}>
                        <Eye className="size-3.5 mr-1" />详情
                      </Button>
                      {renderActions(c)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <MessageSquare className="size-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-[13px] text-slate-300">暂无投诉数据</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {list.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <PaginationBar
                page={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={(s) => { setPageSize(s); pagination.setCurrentPage(1); }}
                total={pagination.total}
              />
            </div>
          )}
        </div>
      </Card>

      {/* ── Detail Dialog ── */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[16px]">投诉详情</DialogTitle>
                <DialogDescription className="text-[12px]">
                  {detail.id} · {new Date(detail.createdAt).toLocaleString("zh-CN")}
                </DialogDescription>
              </DialogHeader>

              {/* Status banner */}
              <div
                className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                style={{ background: STATUS_META[detail.status].bg }}
              >
                {(() => { const I = STATUS_META[detail.status].icon; return <I className="size-4" style={{ color: STATUS_META[detail.status].accent }} />; })()}
                <span className="text-[13px] font-medium" style={{ color: STATUS_META[detail.status].accent }}>
                  {STATUS_META[detail.status].label}
                </span>
                {detail.handledAt && <span className="text-[11px] ml-auto opacity-60" style={{ color: STATUS_META[detail.status].accent }}>{detail.handledAt}</span>}
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InfoCard icon={UserRound} title="上报人信息" lines={[
                  `${detail.reporterName || "—"}（${detail.reporterType || "游客"}）`,
                  `${detail.reporterGender || "—"} · ${detail.reporterPhone || "—"}`,
                ]} />
                <InfoCard icon={Building2} title="当事对象信息" lines={[
                  `${detail.targetName || "—"}（${detail.objectType || "—"}）`,
                  detail.type,
                ]} />
                <InfoCard icon={MapPin} title="事发位置" lines={[
                  `${detail.incidentArea || "—"} · ${detail.incidentLocation || "—"}`,
                  detail.doorplate || "—",
                ]} />
              </div>

              {/* Content */}
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="text-[12px] font-medium text-slate-700 mb-2">反映内容</div>
                <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{detail.content}</p>
              </div>

              {/* Images */}
              {detail.images.length > 0 && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700 mb-3">
                    <ImageIcon className="size-3.5" />
                    附件照片
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {detail.images.map((img) => (
                      <div key={img} className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                        <ImageWithFallback src={img} alt="投诉附件" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Result */}
              {detail.result && (
                <div className={`rounded-xl p-4 text-[13px] leading-relaxed border ${
                  detail.status === "CR" ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}>
                  <div className="font-medium text-[12px] mb-1">{detail.status === "CR" ? "驳回原因" : "处理结果"}</div>
                  {detail.result}
                </div>
              )}

              {/* Actions */}
              {detail.status === "C10" && (
                <DialogFooter className="gap-2 sm:gap-2">
                  <button
                    onClick={() => openRejectDialog(detail.id)}
                    className="h-9 px-4 rounded-lg border border-red-200 text-red-600 text-[12px] font-medium hover:bg-red-50 transition"
                  >
                    <XCircle className="size-3.5 inline mr-1.5 -mt-px" />
                    驳回
                  </button>
                  <button
                    onClick={() => openResolveDialog(detail.id)}
                    className="h-9 px-5 rounded-lg bg-[#059669] text-white text-[12px] font-medium shadow-sm hover:bg-[#047857] transition"
                  >
                    <CheckCircle2 className="size-3.5 inline mr-1.5 -mt-px" />
                    处理完成
                  </button>
                </DialogFooter>
              )}

              {detail.status !== "C10" && (
                <DialogFooter>
                  <Button variant="outline" className="h-8 text-xs rounded-lg" onClick={() => setDetailId(null)}>关闭</Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Resolve Dialog ── */}
      <Dialog open={showResolveDialog} onOpenChange={(open) => { if (!open) { setShowResolveDialog(false); setResolveId(null); setResultText(""); } }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">处理完成</DialogTitle>
          </DialogHeader>
          <textarea
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            placeholder="请输入处理结果，该内容将同步展示给用户"
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669]/40 resize-none transition"
          />
          <DialogFooter>
            <Button variant="outline" className="h-8 text-xs rounded-lg" onClick={() => { setShowResolveDialog(false); setResolveId(null); setResultText(""); }}>取消</Button>
            <Button className="h-8 text-xs rounded-lg bg-[#059669] hover:bg-[#047857]" onClick={confirmResolve}>确认处理完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => { if (!open) { setShowRejectDialog(false); setRejectId(null); setRejectReason(""); } }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">驳回投诉</DialogTitle>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请填写驳回原因，该内容将同步展示给用户"
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none transition"
          />
          <DialogFooter>
            <Button variant="outline" className="h-8 text-xs rounded-lg" onClick={() => { setShowRejectDialog(false); setRejectId(null); setRejectReason(""); }}>取消</Button>
            <Button variant="destructive" className="h-8 text-xs rounded-lg" onClick={confirmReject}>确认驳回</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

function InfoCard({ icon: Icon, title, lines }: { icon: any; title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
      <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700 mb-2">
        <Icon className="size-3.5 text-[#2563EB]" />
        {title}
      </div>
      <div className="space-y-1">
        {lines.map((line) => (
          <p key={line} className="text-[12px] text-slate-500">{line}</p>
        ))}
      </div>
    </div>
  );
}
