import { useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "../../../../c-end/components/PageHeader";
import { Camera, ChevronDown } from "lucide-react";
import { useLoadMore } from "../../../../shared/hooks/useLoadMore";

interface ReportRecord {
  id: string;
  title: string;
  status: "pending" | "processed" | "rejected";
  createdAt: string;
  rejectReason?: string;
  processedReason?: string;
  date: string;
}

const mockRecords: ReportRecord[] = [
  {
    id: "r1",
    title: "随手拍上报",
    status: "pending",
    createdAt: "2026-05-17 14:30",
    date: "2026-05-17",
  },
  {
    id: "r2",
    title: "随手拍上报",
    status: "processed",
    createdAt: "2026-05-16 10:15",
    date: "2026-05-16",
    processedReason: "经核查，问题属实，已安排人员处理",
  },
  {
    id: "r3",
    title: "随手拍上报",
    status: "rejected",
    createdAt: "2026-04-20 16:45",
    date: "2026-04-20",
    rejectReason: "照片模糊，请重新拍摄清晰照片",
  },
  {
    id: "r4",
    title: "木府-忠义市场随手拍上报",
    status: "pending",
    createdAt: "2026-05-15 09:20",
    date: "2026-05-15",
  },
  {
    id: "r5",
    title: "黑龙潭-玉泉公园随手拍上报",
    status: "processed",
    createdAt: "2026-05-14 15:45",
    date: "2026-05-14",
    processedReason: "经核查，问题属实，已安排人员处理",
  },
];

const statusMeta = {
  pending: { label: "待处理", color: "text-primary", bg: "bg-primary-50" },
  processed: { label: "已核实", color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
  rejected: { label: "驳回", color: "text-destructive", bg: "bg-destructive/10" },
};

const dateOptions = [
  { value: "all", label: "全部时间" },
  { value: "2026-05", label: "2026.05" },
  { value: "2026-04", label: "2026.04" },
  { value: "2026-03", label: "2026.03" },
  { value: "2026-02", label: "2026.02" },
  { value: "2026-01", label: "2026.01" },
];

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "processed", label: "已核实" },
  { value: "rejected", label: "驳回" },
];

function FilterDropdown({
  value,
  options,
  onChange,
  icon,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  icon: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative flex-1">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-full h-9 bg-[#F3F3F5] rounded-xl px-3 text-[13px] text-text-secondary flex items-center justify-between gap-1.5"
      >
        <span className="mr-1">{icon}</span>
        <span className="flex-1 text-left truncate">{selected?.label}</span>
        <ChevronDown size={12} className={`text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-border-light py-1 max-h-48 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
                className={`w-full px-3 py-2 text-left text-[13px] hover:bg-[#F5F5F5] ${
                  opt.value === value ? "text-primary bg-primary-50" : "text-text-body"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PhotoRecordsPage() {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockRecords.filter(r => {
    if (dateFilter !== "all" && !r.date.startsWith(dateFilter)) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });
  const { visible, hasMore, loadMore } = useLoadMore(filtered, 6);

  return (
    <div className="min-h-full bg-surface-page flex flex-col">
      <PageHeader title="随手拍记录" back="/c/profile" />

      {/* 筛选栏 */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <FilterDropdown
            value={dateFilter}
            options={dateOptions}
            onChange={setDateFilter}
            icon="📅"
          />
          <FilterDropdown
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
            icon="📋"
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-20">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-16 h-16 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-center mb-4">
              <Camera size={28} className="text-text-tertiary" />
            </div>
            <p className="text-[14px] text-text-tertiary">暂无随手拍记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(record => {
              const s = statusMeta[record.status];
              return (
                <div
                  key={record.id}
                  className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2.5">
                      <span className="text-[15px] font-semibold text-text-heading flex-1 mr-3 leading-snug">{record.title}</span>
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.bg} ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                    <div className="text-[12px] text-text-tertiary">
                      提交时间：{record.createdAt}
                    </div>
                    {record.rejectReason && (
                      <div className="text-[12px] text-destructive mt-2.5 pt-2.5 border-t border-dashed border-border-light leading-relaxed">
                        核实结果：{record.rejectReason}
                      </div>
                    )}
                    {record.processedReason && (
                      <div className="text-[12px] text-[#10B981] mt-2.5 pt-2.5 border-t border-dashed border-border-light leading-relaxed">
                        核实结果：{record.processedReason}
                      </div>
                    )}
                  </div>
                  <div className="px-4 pb-4 flex justify-end">
                    <button
                      onClick={() => navigate(`/c/photo-records/${record.id}`)}
                      className="h-9 px-6 rounded-full bg-primary text-white text-[13px] font-medium shadow-[0_2px_8px_rgba(37,99,235,0.2)] active:scale-[0.97] transition-transform"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <button onClick={loadMore} className="w-full py-3 text-[13px] text-primary font-medium">
                加载更多
              </button>
            )}
          </div>
        )}
      </div>

      {/* 浮动新增按钮 */}
      <button
        onClick={() => navigate("/c/photo-report")}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#A855F7] text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-50"
        style={{ boxShadow: "0 4px 20px rgba(168, 85, 247, 0.4)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
