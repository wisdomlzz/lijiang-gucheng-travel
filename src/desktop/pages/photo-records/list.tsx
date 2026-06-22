import { useNavigate } from "react-router";
import { useState, useMemo } from "react";
import { PageLayout } from "../../components/common/PageLayout";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { useCheckinStore } from "../../../shared/stores/checkin-store";
import {
  Eye, MapPin, Clock, Search, X, Camera, Users,
  Trophy, CalendarDays,
} from "lucide-react";

const PAGE_SIZE = 10;

type TimeRange = "all" | "month" | "week" | "today" | "custom";

export default function PhotoRecordsList() {
  const navigate = useNavigate();
  const checkins = useCheckinStore((s) => s.checkins);

  // — 页面级时间维度 —
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // — 表格筛选 —
  const [searchName, setSearchName] = useState("");
  const [courtyardFilter, setCourtyardFilter] = useState(""); // "" = 全部
  const [page, setPage] = useState(1);

  // — 排行榜展开 —
  const [rankExpanded, setRankExpanded] = useState(false);

  // ====== 日期范围计算 ======
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case "all":
        return { start: null, end: null };
      case "month":
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        };
      case "week": {
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day; // 周一 = 1
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return { start: monday, end: sunday };
      }
      case "today": {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return {
          start: today,
          end: new Date(today.getTime() + 86400000 - 1),
        };
      }
      case "custom":
        return {
          start: customStart ? new Date(customStart) : null,
          end: customEnd ? new Date(customEnd + "T23:59:59") : null,
        };
    }
  }, [timeRange, customStart, customEnd]);

  // ====== 按时间过滤后的全量打卡 ======
  const dateFilteredCheckins = useMemo(() => {
    if (!dateRange.start && !dateRange.end) return checkins;
    return checkins.filter((c) => {
      const created = new Date(c.createdAt.replace(/\//g, "-")).getTime();
      if (dateRange.start && created < dateRange.start.getTime()) return false;
      if (dateRange.end && created > dateRange.end.getTime()) return false;
      return true;
    });
  }, [checkins, dateRange]);

  // ====== KPI 指标 ======
  const totalCheckins = dateFilteredCheckins.length;
  const uniqueUsers = useMemo(
    () => new Set(dateFilteredCheckins.map((c) => c.userId)).size,
    [dateFilteredCheckins],
  );

  // ====== 排行榜 ======
  const courtyardStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    dateFilteredCheckins.forEach((c) => {
      const existing = map.get(c.courtyardId);
      if (existing) existing.count++;
      else map.set(c.courtyardId, { id: c.courtyardId, name: c.courtyardName, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [dateFilteredCheckins]);

  const maxCount = courtyardStats[0]?.count ?? 1;

  // ====== 表格筛选 ======
  const tableFiltered = useMemo(() => {
    return dateFilteredCheckins.filter((c) => {
      const nameMatch = !searchName || c.userName.includes(searchName);
      const courtyardMatch = !courtyardFilter || c.courtyardId === courtyardFilter;
      return nameMatch && courtyardMatch;
    });
  }, [dateFilteredCheckins, searchName, courtyardFilter]);

  const totalPages = Math.max(1, Math.ceil(tableFiltered.length / PAGE_SIZE));
  const paginated = tableFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ====== 所有有打卡记录的院落（供下拉用） ======
  const allCourtyards = useMemo(() => {
    const map = new Map<string, string>();
    checkins.forEach((c) => {
      if (!map.has(c.courtyardId)) map.set(c.courtyardId, c.courtyardName);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [checkins]);

  // ====== 交互 ======
  const handleTimeChange = (value: TimeRange) => {
    setTimeRange(value);
    setRankExpanded(false);
    setPage(1);
  };

  const clearTableFilters = () => {
    setSearchName("");
    setCourtyardFilter("");
    setPage(1);
  };

  const handleCourtyardChange = (value: string) => {
    setCourtyardFilter(value === "__all__" ? "" : value);
    setPage(1);
  };

  const hasTableFilters = searchName || courtyardFilter;

  // ====== 时间选择器显示文案 ======
  const formatDateLabel = (d: Date | null) => {
    if (!d) return "";
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  const timeLabel = useMemo(() => {
    switch (timeRange) {
      case "all":
        return "全部时间";
      case "month":
        return `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`;
      case "week":
        return `本周 (${formatDateLabel(dateRange.start)} ~ ${formatDateLabel(dateRange.end)})`;
      case "today":
        return formatDateLabel(new Date());
      case "custom":
        return `${customStart || "?"} ~ ${customEnd || "?"}`;
    }
  }, [timeRange, dateRange, customStart, customEnd]);

  // ====== 渲染 ======
  const TabButton = ({ value, label }: { value: TimeRange; label: string }) => (
    <button
      onClick={() => handleTimeChange(value)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        timeRange === value
          ? "bg-primary text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <PageLayout
      title="文化院落打卡记录"
      description="按时间维度统计各文化院落的游客打卡分布"
      breadcrumbs={[{ label: "运营管理" }, { label: "文化院落打卡记录" }]}
    >
      {/* ── ① 页面级时间维度选择器 ── */}
      <div className="bg-white rounded-xl border px-5 py-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-text-secondary mr-1">
            <CalendarDays size={15} className="text-primary" />
            <span className="text-xs font-medium">时间范围</span>
          </div>
          <TabButton value="all" label="全部" />
          <TabButton value="month" label="本月" />
          <TabButton value="week" label="本周" />
          <TabButton value="today" label="本日" />
          <TabButton value="custom" label="自定义" />

          {timeRange === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => { setCustomStart(e.target.value); setPage(1); }}
                className="w-36 h-8 text-xs rounded-lg"
              />
              <span className="text-xs text-text-tertiary">~</span>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => { setCustomEnd(e.target.value); setPage(1); }}
                className="w-36 h-8 text-xs rounded-lg"
              />
            </div>
          )}

          <span className="ml-auto text-xs text-text-tertiary">{timeLabel}</span>
        </div>
        <div className="text-[10px] text-text-tertiary/60 mt-1">
          自然月 · 自然周（周一~周日）· 自然日
        </div>
      </div>

      {/* ── ② KPI 行 ── */}
      <div className="flex items-center gap-5 bg-white rounded-xl border px-5 py-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Camera size={15} className="text-primary" />
          <span>
            总打卡{" "}
            <strong className="text-text-heading text-base">{totalCheckins}</strong>{" "}
            次
          </span>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Users size={15} className="text-emerald-500" />
          <span>
            参与游客{" "}
            <strong className="text-text-heading text-base">{uniqueUsers}</strong>{" "}
            人
          </span>
        </div>
      </div>

      {/* ── ③ 各院落打卡排行榜 ── */}
      <div className="bg-white rounded-xl border p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-heading flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            各院落打卡排行
          </h3>
          {courtyardStats.length > 5 && (
            <button
              onClick={() => setRankExpanded(!rankExpanded)}
              className="text-xs text-primary hover:underline"
            >
              {rankExpanded
                ? "收起（显示前 5）"
                : `展开全部 ${courtyardStats.length} 个`}
            </button>
          )}
        </div>

        <div className="space-y-1">
          {(rankExpanded ? courtyardStats : courtyardStats.slice(0, 5)).map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span
                className={`
                  w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0
                  ${idx === 0
                    ? "bg-primary text-white shadow-[0_1px_4px_rgba(37,99,235,0.3)]"
                    : "bg-slate-100 text-slate-500"
                  }
                `}
              >
                {idx + 1}
              </span>

              <span className="w-28 text-sm font-medium truncate text-text-heading">{item.name}</span>

              <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden min-w-0">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(4, (item.count / maxCount) * 100)}%`,
                    background: idx === 0
                      ? "linear-gradient(90deg, #2563eb, #60a5fa)"
                      : "linear-gradient(90deg, #94a3b8, #cbd5e1)",
                  }}
                />
              </div>

              <span className="w-14 text-right text-sm text-slate-600 shrink-0 font-medium">
                {item.count} 次
              </span>

              <span className="w-12 text-right text-xs text-text-tertiary shrink-0">
                {totalCheckins > 0 ? Math.round((item.count / totalCheckins) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>

        {courtyardStats.length === 0 && (
          <p className="text-center py-8 text-sm text-text-tertiary">
            {timeRange === "all" ? "暂无打卡数据" : `${timeLabel}暂无打卡数据`}
          </p>
        )}
      </div>

      {/* ── ④ 明细表格 ── */}
      <div className="bg-white rounded-xl border overflow-hidden mb-5">
        {/* 筛选栏 */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* 游客搜索 */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索游客..."
                value={searchName}
                onChange={(e) => { setSearchName(e.target.value); setPage(1); }}
                className="w-40 pl-9 h-9 rounded-lg text-sm"
              />
            </div>

            {/* 院落下拉 */}
            <div className="w-36">
              <Select
                value={courtyardFilter || "__all__"}
                onValueChange={handleCourtyardChange}
              >
                <SelectTrigger className="h-9 rounded-lg text-sm">
                  <SelectValue placeholder="全部院落" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部院落</SelectItem>
                  {allCourtyards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasTableFilters && (
              <Button variant="outline" size="sm" onClick={clearTableFilters} className="h-9 px-3 rounded-lg text-xs">
                <X size={13} className="mr-1" />清除筛选
              </Button>
            )}
          </div>
        </div>

        {/* 表格 */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left p-3 font-medium text-text-tertiary text-xs uppercase tracking-wide">院落</th>
              <th className="text-left p-3 font-medium text-text-tertiary text-xs uppercase tracking-wide">用户</th>
              <th className="text-left p-3 font-medium text-text-tertiary text-xs uppercase tracking-wide">位置</th>
              <th className="text-left p-3 font-medium text-text-tertiary text-xs uppercase tracking-wide">打卡时间</th>
              <th className="text-right p-3 font-medium text-text-tertiary text-xs uppercase tracking-wide">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((checkin) => (
              <tr
                key={checkin.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
              >
                <td className="p-3 font-medium">{checkin.courtyardName}</td>
                <td className="p-3 text-text-secondary">{checkin.userName}</td>
                <td className="p-3 text-text-secondary text-xs max-w-[200px] truncate">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="shrink-0" />
                    {checkin.address}
                  </span>
                </td>
                <td className="p-3 text-text-secondary text-xs">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="shrink-0" />
                    {checkin.createdAt}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => navigate(`/desktop/photo-records/${checkin.id}`)}
                  >
                    <Eye size={13} className="mr-1" />
                    查看
                  </Button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-text-tertiary text-sm">
                  暂无符合条件的打卡记录
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 记录数提示 */}
        <div className="px-4 py-2 border-t border-slate-100 text-xs text-text-tertiary text-right">
          {timeRange !== "all" && (
            <span className="mr-3">
              时间范围共 {dateFilteredCheckins.length} 条
              {hasTableFilters && `，筛选后 ${tableFiltered.length} 条`}
            </span>
          )}
          {(!hasTableFilters || timeRange === "all") && (
            <span>共 {tableFiltered.length} 条记录</span>
          )}
        </div>
      </div>

      {/* ── 分页 ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 mb-4">
          <span className="text-sm text-text-tertiary">
            显示第 {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, tableFiltered.length)} 条，共{" "}
            {tableFiltered.length} 条
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 rounded-lg text-sm"
            >
              上一页
            </Button>
            <span className="text-sm px-2 text-text-secondary">
              <span className="font-semibold">{page}</span> / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 rounded-lg text-sm"
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
