import { useParams, useNavigate } from "react-router";
import { useContentManageStore } from "../../../shared/stores/content-manage-store";
import { PageLayout } from "../../components/common/PageLayout";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { Card } from "../../../shared/components/ui/card";
import { ChevronLeft, Pencil } from "lucide-react";

export default function ScenicNewsShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const newsItem = useContentManageStore((s) => s.news.find((n) => n.id === id));

  if (!newsItem) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate("/desktop/scenic-news")} className="w-8 h-8 flex items-center justify-center -ml-1">
            <ChevronLeft size={18} className="text-muted-foreground" />
          </button>
          <h1 className="text-lg font-medium">资讯不存在</h1>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title={newsItem.title}
      description={`${newsItem.category} · ${newsItem.date}`}
      actions={
        <Button size="sm" variant="outline" onClick={() => navigate(`/desktop/scenic-news/${newsItem.id}/edit`)}>
          <Pencil className="size-3.5 mr-1" />编辑
        </Button>
      }
    >
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">分类</p>
          <p className="text-sm font-bold mt-1">{newsItem.category}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">标签</p>
          <div className="mt-1">
            <Badge variant="secondary" className="text-xs" style={{ backgroundColor: newsItem.tagColor + "20", color: newsItem.tagColor }}>{newsItem.tag}</Badge>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">发布日期</p>
          <p className="text-sm font-bold mt-1">{newsItem.date || "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">大标题</p>
          <p className="text-sm font-bold mt-1">{newsItem.heroTitle || "—"}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">摘要</h3>
          <p className="text-sm text-muted-foreground">{newsItem.summary}</p>
        </div>
        {newsItem.imageUrl && (
          <div>
            <h3 className="text-sm font-medium mb-2">封面图</h3>
            <img src={newsItem.imageUrl} alt={newsItem.title} className="rounded-lg max-w-sm" />
          </div>
        )}
        {newsItem.subImage && (
          <div>
            <h3 className="text-sm font-medium mb-2">配图</h3>
            <img src={newsItem.subImage} alt={newsItem.title} className="rounded-lg max-w-sm" />
          </div>
        )}
        {newsItem.body && newsItem.body.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">正文内容</h3>
            <div className="space-y-2">
              {newsItem.body.map((p, i) => (
                <p key={i} className="text-sm text-muted-foreground">{p}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
