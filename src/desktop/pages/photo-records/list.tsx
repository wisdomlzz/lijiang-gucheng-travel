import { useNavigate } from "react-router";
import { useState, useMemo } from "react";
import { PageLayout } from "../../components/common/PageLayout";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { useCheckinStore } from "../../../shared/stores/checkin-store";
import {
  Eye, MapPin, Clock, Search, X, Camera, Users,
  Trophy,
} from "lucide-react";

const PAGE_SIZE = 10;

export default function PhotoRecordsList() {
  const navigate = useNavigate();
  const checkins = useCheckinStore((s) => s.checkins);

  // — 筛选状态 —
  const [searchName, setSearchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // — 排行榜状态 —
  const [rankExpanded, setRankExpanded] = useState(false);

  // — 统计计算 —
  const totalCheckins = checkins.length;
  const uniqueUsers = useMemo(
    () => new Set(checkins.map((c) => c.userId)).size,
    [checkins],
  );

  const courtyardStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    checkins.forEach((c) => {
      const existing = map.get(c.courtyardId);
      if (existing) {
        existing.count++;
      } else {
        map.set(c.courtyardId, { id: c.courtyardId, name: c.courtyardName, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [checkins]);

  const maxCount = courtyardStats[0]?.count ?? 1;

  // — 筛选逻辑 —（纯文本 + 日期，不含院落联动）
  const filtered = useMemo(() => {
    return checkins.filter((c) => {
      const nameMatch = !searchName || c.userName.includes(searchName);
      const created = new Date(c.createdAt.replace(/\//g, "-"));
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate + "T23:59:59") : null;
      const afterStart = !start || created >= start;
      const beforeEnd = !end || created <= end;
      return nameMatch && afterStart && beforeEnd;
    });
  }, [checkins, searchName, startDate, endDate]);

  // — 分页 —
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // — 交互 —
  const clearFilters = () => {
    setSearchName("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters = searchName || startDate || endDate;

  // — 渲染 —
  return (
    <PageLayout
      title="文化院落打卡记录"
      description="全景统计各文化院落的游客打卡情况，支持按游客和日期筛选明细"
      breadcrumbs={[{ label: "运营管理" }, { label: "文化院落打卡记录" }]}
    >
      {/* ── KPI 精简行 ── */}
      <div className="flex items-center gap-5 bg-white rounded-xl border px-5 py-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Camera size={15} className="text-primary" />
          <span>总打卡 <strong className="text-text-heading text-base">{totalCheckins}</strong> 次</span>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Users size={15} className="text-emerald-500" />
          <span>参与游客 <strong className="text-text-heading text-base">{uniqueUsers}</strong> 人</span>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Trophy size={15} className="text-amber-500" />
          <span>
            已打卡 <strong className="text-text-heading text-base">{courtyardStats.length}</strong> 处院落
          </span>
        </div>
      </div>

      {/* ── 各院落打卡排行榜 ── */}
      <div className="bg-white rounded-xl border p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-heading flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            各院落打卡排行
          </h3>
          {courtyardStats.length > 10 && (
            <button
              onClick={() => setRankExpanded(!rankExpanded)}
              className="text-xs text-primary hover:underline"
            >
              {rankExpanded
                ? `收起（显示前 10）`
                : `展开全部 ${courtyardStats.length} 个`}
            </button>
          )}
        </div>

        <div className="space-y-1">
          {(rankExpanded ? courtyardStats : courtyardStats.slice(0, 10)).map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {/* 排名标号 */}
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

              {/* 院落名 */}
              <span className="w-28 text-sm font-medium truncate text-text-heading">{item.name}</span>

              {/* 进度条 */}
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

              {/* 次数 */}
              <span className="w-14 text-right text-sm text-slate-600 shrink-0 font-medium">
                {item.count} 次
              </span>

              {/* 占总打卡比例 */}
              <span className="w-12 text-right text-xs text-text-tertiary shrink-0">
                {totalCheckins > 0 ? Math.round((item.count / totalCheckins) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>

        {courtyardStats.length === 0 && (
          <p className="text-center py-8 text-sm text-text-tertiary">暂无打卡数据</p>
        )}
      </div>

      {/* ── 明细区域 ── */}
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

            {/* 日期筛选 */}
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-36 h-9 rounded-lg text-sm"
            />
            <span className="text-xs text-text-tertiary">至</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-36 h-9 rounded-lg text-sm"
            />

            {/* 清除筛选 */}
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="h-9 px-3 rounded-lg text-xs">
                <X size={13} className="mr-1" />清除筛选
              </Button>
            )}

            <span className="ml-auto text-xs text-text-tertiary">
              共 {filtered.length} 条记录
            </span>
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
      </div>

      {/* ── 分页 ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 mb-4">
          <span className="text-sm text-text-tertiary">
            显示第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} 条，共{" "}
            {filtered.length} 条
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
