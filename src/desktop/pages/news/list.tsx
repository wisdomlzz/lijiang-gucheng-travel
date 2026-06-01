import { useNavigate } from "react-router";
import { useContentManageStore } from "../../../shared/stores/content-manage-store";
import { useState } from "react";
import type { NewsItem } from "../../../shared/types/content-types";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { PageLayout } from "../../components/common/PageLayout";
import { DataTable } from "../../components/common/DataTable";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function NewsList() {
  const navigate = useNavigate();
  const news = useContentManageStore((s) => s.news);
  const deleteNews = useContentManageStore((s) => s.deleteNews);
  const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null);

  const columns: ColumnDef<NewsItem>[] = [
    {
      accessorKey: "title", header: "标题",
      cell: ({ row }) => <span className="font-medium truncate max-w-[200px] inline-block">{row.original.title}</span>,
    },
    {
      accessorKey: "tag", header: "标签",
      cell: ({ row }) => <Badge style={{ backgroundColor: row.original.tagColor, color: "#fff" }}>{row.original.tag}</Badge>,
    },
    { accessorKey: "category", header: "分类" },
    { accessorKey: "date", header: "日期" },
    {
      accessorKey: "summary", header: "摘要",
      cell: ({ row }) => <span className="text-xs text-muted-foreground truncate max-w-[200px] inline-block">{row.original.summary}</span>,
    },
    {
      id: "actions", header: "操作",
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/desktop/news/${row.original.id}`)}>
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/desktop/news/${row.original.id}/edit`)}>
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
      deleteNews(deleteTarget.id);
      toast.success("已删除");
      setDeleteTarget(null);
    }
  };

  return (
    <PageLayout
      title="资讯管理"
      description="管理公告、活动与资讯内容"
      actions={<Button size="sm" onClick={() => navigate("/desktop/news/new")}><Plus className="size-3.5 mr-1" />新建资讯</Button>}
    >
      <DataTable columns={columns} data={news} searchPlaceholder="搜索资讯标题" pageSize={10} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="确认删除"
        description={`确定删除资讯「${deleteTarget?.title}」？此操作不可撤销。`}
        onConfirm={handleDelete}
      />
    </PageLayout>
  );
}
