import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { PageLayout } from "../../components/common/PageLayout";
import { Card } from "../../../shared/components/ui/card";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../shared/components/ui/alert-dialog";
import { useHeritageManageStore, heritageTypeMeta } from "../../../shared/stores/heritage-manage-store";
import { ChevronLeft, MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { HeritageType, RoadHeritage, WaterHeritage, WellHeritage, BridgeHeritage, TreeHeritage, ResidenceHeritage } from "../../../c-end/types/heritage";

function FieldRow({ label, value }: { label: string; value?: string | string[] }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="flex gap-2 py-2 border-b border-border-light">
      <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm text-text-body flex-1">
        {Array.isArray(value) ? value.join("、") : value}
      </span>
    </div>
  );
}

export default function HeritageShowPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { items, deleteItem } = useHeritageManageStore();

  const typeKey = type as HeritageType;
  const meta = heritageTypeMeta[typeKey];
  const item = items[typeKey]?.find((h) => h.id === id);

  const handleDelete = () => {
    deleteItem(typeKey, id!);
    toast.success("删除成功");
    navigate("/desktop/heritage");
  };

  if (!item) {
    return (
      <PageLayout title="遗产详情" description="未找到该遗产记录">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">未找到该遗产记录</p>
          <button onClick={() => navigate("/desktop/heritage")} className="mt-4 text-sm text-primary">返回列表</button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={item.name}
      description={`${meta?.label || ""} · ${item.area}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/desktop/heritage")}>
            <ChevronLeft className="size-3.5 mr-1" />
            返回列表
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/desktop/heritage/${typeKey}/${id}/edit`)}>
            <Pencil className="size-3.5 mr-1" />
            编辑
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-3.5 mr-1" />
                删除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除「{item.name}」吗？此操作不可撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>确认删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      }
    >
      {/* Photo gallery */}
      {item.photos?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {item.photos.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt={item.name} className={`rounded-lg object-cover w-full ${i === 0 ? "row-span-2 h-48" : "h-24"}`} />
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-border-light divide-y divide-border-light">
        {/* Common fields */}
        <FieldRow label="遗产名称" value={item.name} />
        <FieldRow label="所在区域" value={item.area} />
        {item.location && (
          <FieldRow label="经纬度" value={`${item.location.lat}, ${item.location.lng}`} />
        )}

        {/* Type-specific fields */}
        {typeKey === "road" && (item as RoadHeritage).orientation && (
          <FieldRow label="朝向" value={(item as RoadHeritage).orientation} />
        )}
        {typeKey === "road" && (item as RoadHeritage).roadLength && (
          <FieldRow label="规模/长度" value={(item as RoadHeritage).roadLength} />
        )}
        {typeKey === "road" && (item as RoadHeritage).cadDrawings?.length && (
          <FieldRow label="CAD图纸" value={(item as RoadHeritage).cadDrawings} />
        )}

        {typeKey === "water" && (item as WaterHeritage).flow && (
          <FieldRow label="流向" value={(item as WaterHeritage).flow} />
        )}
        {typeKey === "water" && (item as WaterHeritage).waterType && (
          <FieldRow label="水系类型" value={(item as WaterHeritage).waterType} />
        )}

        {typeKey === "well" && (item as WellHeritage).wellCount && (
          <FieldRow label="眼数" value={(item as WellHeritage).wellCount} />
        )}
        {typeKey === "well" && (item as WellHeritage).wellType && (
          <FieldRow label="井型" value={(item as WellHeritage).wellType} />
        )}

        {typeKey === "bridge" && (item as BridgeHeritage).lengthNorth && (
          <FieldRow label="北侧长度" value={(item as BridgeHeritage).lengthNorth} />
        )}
        {typeKey === "bridge" && (item as BridgeHeritage).lengthSouth && (
          <FieldRow label="南侧长度" value={(item as BridgeHeritage).lengthSouth} />
        )}
        {typeKey === "bridge" && (item as BridgeHeritage).height && (
          <FieldRow label="高度" value={(item as BridgeHeritage).height} />
        )}
        {typeKey === "bridge" && (item as BridgeHeritage).width && (
          <FieldRow label="宽度" value={(item as BridgeHeritage).width} />
        )}
        {typeKey === "bridge" && (item as BridgeHeritage).material && (
          <FieldRow label="材质" value={(item as BridgeHeritage).material} />
        )}
        {typeKey === "bridge" && (item as BridgeHeritage).holeCount && (
          <FieldRow label="孔数" value={(item as BridgeHeritage).holeCount} />
        )}
        {typeKey === "bridge" && (item as BridgeHeritage).blueprints?.length && (
          <FieldRow label="图纸" value={(item as BridgeHeritage).blueprints} />
        )}

        {typeKey === "tree" && (item as TreeHeritage).code && (
          <FieldRow label="编号" value={(item as TreeHeritage).code} />
        )}
        {typeKey === "tree" && (item as TreeHeritage).family && (
          <FieldRow label="科名" value={(item as TreeHeritage).family} />
        )}
        {typeKey === "tree" && (item as TreeHeritage).genus && (
          <FieldRow label="属名" value={(item as TreeHeritage).genus} />
        )}
        {typeKey === "tree" && (item as TreeHeritage).species && (
          <FieldRow label="树种名" value={(item as TreeHeritage).species} />
        )}
        {typeKey === "tree" && (item as TreeHeritage).latinName && (
          <FieldRow label="拉丁名" value={(item as TreeHeritage).latinName} />
        )}
        {typeKey === "tree" && (item as TreeHeritage).treeAge && (
          <FieldRow label="树龄" value={(item as TreeHeritage).treeAge} />
        )}
        {typeKey === "tree" && (item as TreeHeritage).treeHeight && (
          <FieldRow label="树高" value={(item as TreeHeritage).treeHeight} />
        )}
        {typeKey === "tree" && (item as TreeHeritage).trunkCircumference && (
          <FieldRow label="胸围" value={(item as TreeHeritage).trunkCircumference} />
        )}
        {typeKey === "tree" && (item as TreeHeritage).protectionLevel && (
          <FieldRow label="保护级别" value={(item as TreeHeritage).protectionLevel} />
        )}
        {typeKey === "tree" && (item as TreeHeritage).remark && (
          <FieldRow label="备注" value={(item as TreeHeritage).remark} />
        )}

        {typeKey === "residence" && (item as ResidenceHeritage).heritageSubType && (
          <FieldRow label="遗产要素类型" value={(item as ResidenceHeritage).heritageSubType} />
        )}
        {typeKey === "residence" && (item as ResidenceHeritage).zoneType && (
          <FieldRow label="遗产区/缓冲区" value={(item as ResidenceHeritage).zoneType} />
        )}
        {typeKey === "residence" && (item as ResidenceHeritage).community && (
          <FieldRow label="社区" value={(item as ResidenceHeritage).community} />
        )}
        {typeKey === "residence" && (item as ResidenceHeritage).preservationStatus && (
          <FieldRow label="保护状况" value={(item as ResidenceHeritage).preservationStatus} />
        )}
        {typeKey === "residence" && (item as ResidenceHeritage).buildingLayout && (
          <FieldRow label="建筑格局" value={(item as ResidenceHeritage).buildingLayout} />
        )}
        {typeKey === "residence" && (item as ResidenceHeritage).structureType && (
          <FieldRow label="结构类型" value={(item as ResidenceHeritage).structureType} />
        )}
        {typeKey === "residence" && (item as ResidenceHeritage).isHeritageUnit != null && (
          <FieldRow label="文保单位" value={(item as ResidenceHeritage).isHeritageUnit ? "是" : "否"} />
        )}
        {typeKey === "residence" && (item as ResidenceHeritage).buildingArea && (
          <FieldRow label="建筑面积" value={(item as ResidenceHeritage).buildingArea} />
        )}
        {typeKey === "residence" && (item as ResidenceHeritage).usage && (
          <FieldRow label="用途" value={(item as ResidenceHeritage).usage} />
        )}
        {typeKey === "residence" && (item as ResidenceHeritage).propertyRight && (
          <FieldRow label="产权" value={(item as ResidenceHeritage).propertyRight} />
        )}
        {typeKey === "residence" && (item as ResidenceHeritage).operator && (
          <FieldRow label="经营管理" value={(item as ResidenceHeritage).operator} />
        )}
        {typeKey === "residence" && (item as ResidenceHeritage).remark && (
          <FieldRow label="备注" value={(item as ResidenceHeritage).remark} />
        )}

        {/* Common fields continued */}
        {item.description && (
          <FieldRow label="描述" value={item.description} />
        )}
        {item.features && (
          <FieldRow label="基本情况" value={item.features} />
        )}
        {item.history && (
          <FieldRow label="历史成因" value={item.history} />
        )}
      </div>
    </PageLayout>
  );
}