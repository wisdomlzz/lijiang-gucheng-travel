import { useNavigate } from "react-router";
import { useContentManageStore } from "../../../shared/stores/content-manage-store";
import { useState } from "react";
import type { NewsItem } from "../../../shared/types/content-types";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/components/ui/select";
import { PageLayout } from "../../components/common/PageLayout";
import { DataTable } from "../../components/common/DataTable";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function ScenicNewsList() {
  const navigate = useNavigate();
  const news = useContentManageStore((s) => s.news);
  const deleteNews = useContentManageStore((s) => s.deleteNews);
  const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null);
  const [category, setCategory] = useState("全部");

  const filteredData = news.filter((item) => {
    const matchedCategory = category === "全部" || item.category === category;
    return matchedCategory;
  });

  const columns: ColumnDef<NewsItem>[] = [
    { accessorKey: "title", header: "标题", cell: ({ row }) => <span className="font-medium max-w-xs truncate">{row.original.title}</span> },
    { accessorKey: "category", header: "分类", cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge> },
    { accessorKey: "tag", header: "标签", cell: ({ row }) => <Badge variant="secondary" className="text-xs">{row.original.tag}</Badge> },
    { accessorKey: "date", header: "发布日期" },
    { accessorKey: "imageUrl", header: "图片", cell: ({ row }) => row.original.imageUrl ? "已上传" : "—" },
    {
      id: "actions", header: "操作",
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/desktop/scenic-news/${row.original.id}`)}>
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/desktop/scenic-news/${row.original.id}/edit`)}>
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
      title="景区资讯"
      description="管理景区动态、公告、公房公告等内容，支持按标题和分类检索"
      actions={<Button size="sm" onClick={() => navigate("/desktop/scenic-news/new")}><Plus className="size-3.5 mr-1" />新建资讯</Button>}
    >
      <div className="mb-3 flex flex-wrap gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="全部">全部分类</SelectItem>
            <SelectItem value="公房公告">公房公告</SelectItem>
            <SelectItem value="房屋信息">房屋信息</SelectItem>
            <SelectItem value="举贤纳仕">举贤纳仕</SelectItem>
            <SelectItem value="其它">其它</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} searchPlaceholder="搜索文章标题" pageSize={10} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="确认删除"
        description={`确定删除「${deleteTarget?.title}」？此操作不可撤销。`}
        onConfirm={handleDelete}
      />
    </PageLayout>
  );
}
