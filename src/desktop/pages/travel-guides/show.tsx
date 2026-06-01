import { useParams, useNavigate } from "react-router";
import { useContentManageStore } from "../../../shared/stores/content-manage-store";
import { PageLayout } from "../../components/common/PageLayout";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { Card } from "../../../shared/components/ui/card";
import { ChevronLeft, Pencil } from "lucide-react";

export default function TravelGuidesShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const guide = useContentManageStore((s) => s.guides.find((g) => g.id === id));

  if (!guide) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate("/desktop/travel-guides")} className="w-8 h-8 flex items-center justify-center -ml-1">
            <ChevronLeft size={18} className="text-muted-foreground" />
          </button>
          <h1 className="text-lg font-medium">攻略不存在</h1>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title={guide.name}
      description={`${guide.difficulty} · ${guide.duration}`}
      actions={
        <Button size="sm" variant="outline" onClick={() => navigate(`/desktop/travel-guides/${guide.id}/edit`)}>
          <Pencil className="size-3.5 mr-1" />编辑
        </Button>
      }
    >
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">时长</p>
          <p className="text-xl font-bold mt-1">{guide.duration}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">难度</p>
          <p className="text-xl font-bold mt-1">{guide.difficulty}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">景点数</p>
          <p className="text-xl font-bold mt-1">{guide.stops}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">距离</p>
          <p className="text-xl font-bold mt-1">{guide.distance || "—"}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">基本信息</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">标签：</span>
            <div className="inline-flex gap-1 ml-1">
              {guide.tags.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}
            </div>
          </div>
          <div><span className="text-muted-foreground">途径景点：</span>{guide.spotNames.join("、") || "—"}</div>
          {guide.description && (
            <div className="col-span-2"><span className="text-muted-foreground">描述：</span>{guide.description}</div>
          )}
          {guide.cover && (
            <div className="col-span-2">
              <span className="text-muted-foreground">封面图：</span>
              <img src={guide.cover} alt={guide.name} className="mt-2 rounded-lg max-w-sm" />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
