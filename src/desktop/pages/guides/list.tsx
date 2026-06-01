import { useNavigate } from "react-router";
import { useContentManageStore } from "../../../shared/stores/content-manage-store";
import { useState } from "react";
import type { TravelGuide } from "../../../shared/types/content-types";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { PageLayout } from "../../components/common/PageLayout";
import { DataTable } from "../../components/common/DataTable";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function GuideList() {
  const navigate = useNavigate();
  const guides = useContentManageStore((s) => s.guides);
  const deleteGuide = useContentManageStore((s) => s.deleteGuide);
  const [deleteTarget, setDeleteTarget] = useState<TravelGuide | null>(null);

  const columns: ColumnDef<TravelGuide>[] = [
    { accessorKey: "name", header: "名称", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "difficulty", header: "难度", cell: ({ row }) => <Badge variant="outline">{row.original.difficulty}</Badge> },
    { accessorKey: "duration", header: "时长" },
    { accessorKey: "stops", header: "景点数", cell: ({ row }) => `${row.original.stops} 个` },
    { accessorKey: "distance", header: "距离" },
    {
      accessorKey: "tags", header: "标签",
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.tags.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}
        </div>
      ),
    },
    {
      id: "actions", header: "操作",
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/desktop/guides/${row.original.id}`)}>
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/desktop/guides/${row.original.id}/edit`)}>
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
      title="游玩攻略管理"
      description="管理古城游玩路线与攻略内容"
      actions={<Button size="sm" onClick={() => navigate("/desktop/guides/new")}><Plus className="size-3.5 mr-1" />新建攻略</Button>}
    >
      <DataTable columns={columns} data={guides} searchPlaceholder="搜索攻略名称" pageSize={10} />
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
