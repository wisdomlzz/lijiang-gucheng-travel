import { useNavigate } from "react-router";
import { useState, useMemo } from "react";
import { PageLayout } from "../../components/common/PageLayout";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { useCheckinStore } from "../../../shared/stores/checkin-store";
import { Eye, MapPin, Clock, Search, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Checkin } from "../../../shared/types";

const PAGE_SIZE = 10;

export default function PhotoRecordsList() {
  const navigate = useNavigate();
  const checkins = useCheckinStore((s) => s.checkins);

  const [searchName, setSearchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setSearchName("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters = searchName || startDate || endDate;

  const columns: ColumnDef<Checkin>[] = [
    {
      accessorKey: "photo",
      header: "照片",
      cell: ({ row }) => (
        <img
          src={row.original.photo}
          alt="打卡照片"
          className="w-16 h-12 object-cover rounded-lg"
        />
      ),
    },
    { accessorKey: "courtyardName", header: "院落" },
    { accessorKey: "userName", header: "用户" },
    {
      accessorKey: "address",
      header: "位置",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs text-text-secondary">
          <MapPin size={12} />
          {row.original.address}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "打卡时间",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs text-text-secondary">
          <Clock size={12} />
          {row.original.createdAt}
        </span>
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
            className="h-8 w-8 p-0"
            onClick={() => navigate(`/desktop/photo-records/${row.original.id}`)}
          >
            <Eye size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout
      title="文化院落打卡记录"
      description="游客在文化院落提交的打卡照片、位置与时间信息记录"
      breadcrumbs={[{ label: "运营管理" }, { label: "文化院落打卡记录" }]}
    >
      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border p-5 mb-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">游客姓名</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索游客..."
                value={searchName}
                onChange={(e) => { setSearchName(e.target.value); setPage(1); }}
                className="w-44 pl-9 h-10 rounded-lg"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">开始时间</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-40 h-10 rounded-lg"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">结束时间</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-40 h-10 rounded-lg"
            />
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-10 px-3 rounded-lg">
              <X size={14} className="mr-1.5" />清除筛选
            </Button>
          )}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground">共 <span className="font-semibold text-foreground">{filtered.length}</span> 条记录</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">照片</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">院落</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">用户</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">位置</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">打卡时间</th>
              <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((checkin) => (
              <tr key={checkin.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                <td className="p-4">
                  <img src={checkin.photo} alt={checkin.courtyardName} className="w-20 h-14 object-cover rounded-lg" />
                </td>
                <td className="p-4 font-medium">{checkin.courtyardName}</td>
                <td className="p-4 text-text-secondary">{checkin.userName}</td>
                <td className="p-4 text-text-secondary text-xs max-w-[200px] truncate">{checkin.address}</td>
                <td className="p-4 text-text-secondary text-xs">{checkin.createdAt}</td>
                <td className="p-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => navigate(`/desktop/photo-records/${checkin.id}`)}
                  >
                    查看
                  </Button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-muted-foreground">暂无打卡记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 px-1">
          <span className="text-sm text-muted-foreground">
            显示第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} 条，共 {filtered.length} 条
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 rounded-lg"
            >
              上一页
            </Button>
            <span className="text-sm px-2">
              <span className="font-semibold">{page}</span> / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 rounded-lg"
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
