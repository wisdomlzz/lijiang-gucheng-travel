import { useNavigate } from "react-router";
import { useContentManageStore } from "../../../shared/stores/content-manage-store";
import { useState } from "react";
import type { TravelGuide } from "../../../shared/types/content-types";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/components/ui/select";
import { PageLayout } from "../../components/common/PageLayout";
import { DataTable } from "../../components/common/DataTable";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function TravelGuidesList() {
  const navigate = useNavigate();
  const guides = useContentManageStore((s) => s.guides);
  const deleteGuide = useContentManageStore((s) => s.deleteGuide);
  const [deleteTarget, setDeleteTarget] = useState<TravelGuide | null>(null);
  const [difficulty, setDifficulty] = useState("全部");

  const filteredData = guides.filter((item) => {
    const matchedDifficulty = difficulty === "全部" || item.difficulty === difficulty;
    return matchedDifficulty;
  });

  const columns: ColumnDef<TravelGuide>[] = [
    { accessorKey: "name", header: "名称", cell: ({ row }) => <span className="font-medium max-w-xs truncate">{row.original.name}</span> },
    { accessorKey: "cover", header: "图片", cell: ({ row }) => row.original.cover ? "已上传" : "—" },
    {
      accessorKey: "tags", header: "标签",
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.tags.slice(0, 2).map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}
        </div>
      ),
    },
    { accessorKey: "difficulty", header: "难度", cell: ({ row }) => <Badge variant="outline">{row.original.difficulty}</Badge> },
    { accessorKey: "duration", header: "时长" },
    { accessorKey: "stops", header: "景点数", cell: ({ row }) => `${row.original.stops} 个` },
    { accessorKey: "distance", header: "距离" },
    {
      id: "actions", header: "操作",
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/desktop/travel-guides/${row.original.id}`)}>
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/desktop/travel-guides/${row.original.id}/edit`)}>
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setDeleteTarget(row.original)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const handleDelete = () => {
    if (deleteTarget) {
      deleteGuide(deleteTarget.id);
      toast.success("已删除");
      setDeleteTarget(null);
    }
  };

  return (
    <PageLayout
      title="古城攻略"
      description="管理古城攻略图文内容，支持按名称和难度检索"
      actions={<Button size="sm" onClick={() => navigate("/desktop/travel-guides/new")}><Plus className="size-3.5 mr-1" />新建攻略</Button>}
    >
      <div className="mb-3 flex flex-wrap gap-3">
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="全部">全部难度</SelectItem>
            <SelectItem value="简单">简单</SelectItem>
            <SelectItem value="中等">中等</SelectItem>
            <SelectItem value="较难">较难</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} searchPlaceholder="搜索攻略名称" pageSize={10} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="确认删除"
        description={`确定删除攻略「${deleteTarget?.name}」？此操作不可撤销。`}
        onConfirm={handleDelete}
      />
    </PageLayout>
  );
}
