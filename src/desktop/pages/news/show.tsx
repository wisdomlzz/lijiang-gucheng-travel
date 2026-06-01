import { useParams, useNavigate } from "react-router";
import { useContentManageStore } from "../../../shared/stores/content-manage-store";
import { PageLayout } from "../../components/common/PageLayout";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { Card } from "../../../shared/components/ui/card";
import { ChevronLeft, Pencil } from "lucide-react";

export default function NewsShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = useContentManageStore((s) => s.news.find((n) => n.id === id));

  if (!item) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate("/desktop/news")} className="w-8 h-8 flex items-center justify-center -ml-1">
            <ChevronLeft size={18} className="text-muted-foreground" />
          </button>
          <h1 className="text-lg font-medium">资讯不存在</h1>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title={item.title}
      description={
        <span>
          <Badge style={{ backgroundColor: item.tagColor, color: "#fff" }} className="mr-2">{item.tag}</Badge>
          {item.category} · {item.date}
        </span>
      }
      actions={
        <Button size="sm" variant="outline" onClick={() => navigate(`/desktop/news/${item.id}/edit`)}>
          <Pencil className="size-3.5 mr-1" />编辑
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">标签</p>
          <p className="text-lg font-bold mt-1">{item.tag}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">分类</p>
          <p className="text-lg font-bold mt-1">{item.category}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">日期</p>
          <p className="text-lg font-bold mt-1">{item.date}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">详细信息</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {item.heroTitle && <div className="col-span-2"><span className="text-muted-foreground">副标题：</span>{item.heroTitle}</div>}
          <div className="col-span-2"><span className="text-muted-foreground">摘要：</span>{item.summary}</div>
          {item.imageUrl && (
            <div className="col-span-2">
              <span className="text-muted-foreground">封面图：</span>
              <img src={item.imageUrl} alt={item.title} className="mt-2 rounded-lg max-w-sm" />
            </div>
          )}
        </div>
        {item.body && item.body.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-2">正文</h3>
            <div className="space-y-2 text-sm">
              {item.body.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
