import { useNavigate } from "react-router";
import { useState } from "react";
import { PageLayout } from "../../components/common/PageLayout";
import { DataTable } from "../../components/common/DataTable";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Button } from "../../../shared/components/ui/button";
import { Badge } from "../../../shared/components/ui/badge";
import { useHeritageManageStore, heritageTypeMeta } from "../../../shared/stores/heritage-manage-store";
import type { HeritageType, HeritageItem } from "../../../c-end/types/heritage";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

const TABS: HeritageType[] = ["road", "water", "well", "bridge", "tree", "residence", "publicStructure", "culturalEnvironment"];

const baseColumns: ColumnDef<HeritageItem>[] = [
  {
    accessorKey: "name",
    header: "名称",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.photos?.[0] && (
          <img src={row.original.photos[0]} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
        )}
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  { accessorKey: "area", header: "区域" },
  {
    id: "photos",
    header: "照片",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.photos?.length || 0} 张</span>
    ),
  },
];

const actionsColumn: ColumnDef<HeritageItem> = {
  id: "actions",
  header: () => <div className="text-right">操作</div>,
  cell: ({ row }) => (
    <div className="flex gap-1 justify-end">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => row.original._onView?.()}>
        <Eye size={14} />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => row.original._onEdit?.()}>
        <Pencil size={14} />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => row.original._onDelete?.()}>
        <Trash2 size={14} />
      </Button>
    </div>
  ),
};

// Road-specific columns
const roadColumns = (): ColumnDef<HeritageItem>[] => [
  ...baseColumns,
  { accessorKey: "orientation", header: "朝向" },
  { accessorKey: "scale", header: "规模" },
  actionsColumn,
];

// Water-specific columns
const waterColumns = (): ColumnDef<HeritageItem>[] => [
  ...baseColumns,
  { accessorKey: "waterType", header: "水系类型" },
  { accessorKey: "flow", header: "流向" },
  actionsColumn,
];

// Well-specific columns
const wellColumns = (): ColumnDef<HeritageItem>[] => [
  ...baseColumns,
  { accessorKey: "wellType", header: "井型" },
  { accessorKey: "wellCount", header: "眼数" },
  actionsColumn,
];

// Bridge-specific columns
const bridgeColumns = (): ColumnDef<HeritageItem>[] => [
  ...baseColumns,
  { accessorKey: "bridgeType", header: "桥梁类型" },
  { accessorKey: "material", header: "材质" },
  { accessorKey: "holeCount", header: "孔数" },
  actionsColumn,
];

// Tree-specific columns
const treeColumns = (): ColumnDef<HeritageItem>[] => [
  ...baseColumns,
  { accessorKey: "species", header: "树种名" },
  { accessorKey: "treeAge", header: "树龄" },
  { accessorKey: "protectionLevel", header: "保护级别" },
  actionsColumn,
];

// Residence/PublicStructure/CulturalEnvironment columns
const buildingColumns = (): ColumnDef<HeritageItem>[] => [
  ...baseColumns,
  { accessorKey: "address", header: "位置" },
  { accessorKey: "preservationStatus", header: "保护状况" },
  {
    accessorKey: "isHeritageUnit",
    header: "文保单位",
    cell: ({ row }) => row.original.isHeritageUnit
      ? <Badge variant="destructive">{row.original.heritageUnitLevel || "是"}</Badge>
      : <span className="text-muted-foreground">否</span>,
  },
  actionsColumn,
];

function getColumnsForType(type: HeritageType): ColumnDef<HeritageItem>[] {
  switch (type) {
    case "road": return roadColumns();
    case "water": return waterColumns();
    case "well": return wellColumns();
    case "bridge": return bridgeColumns();
    case "tree": return treeColumns();
    default: return buildingColumns();
  }
}

export default function HeritageListPage() {
  const navigate = useNavigate();
  const { activeType, setActiveType, items, deleteItem } = useHeritageManageStore();
  const [deleteTarget, setDeleteTarget] = useState<HeritageItem | null>(null);
  const currentItems = items[activeType] || [];

  const handleDelete = () => {
    if (deleteTarget) {
      deleteItem(activeType, deleteTarget.id);
      toast.success("已删除");
      setDeleteTarget(null);
    }
  };

  const onView = (item: HeritageItem) => navigate(`/desktop/heritage/${activeType}/${item.id}`);
  const onEdit = (item: HeritageItem) => navigate(`/desktop/heritage/${activeType}/${item.id}/edit`);
  const onDelete = (item: HeritageItem) => setDeleteTarget(item);

  const itemsWithActions = currentItems.map((item) => ({
    ...item,
    _onView: () => onView(item),
    _onEdit: () => onEdit(item),
    _onDelete: () => onDelete(item),
  }));

  const columns = getColumnsForType(activeType);

  return (
    <PageLayout
      title="遗产知识管理"
      description="管理古城八类文化遗产"
      actions={
        <Button size="sm" onClick={() => navigate(`/desktop/heritage/${activeType}/new`)}>
          <Plus className="size-3.5 mr-1" />新建
        </Button>
      }
    >
      {/* Tab filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {TABS.map((type) => {
          const meta = heritageTypeMeta[type];
          const count = items[type]?.length || 0;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeType === type
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <DataTable columns={columns} data={itemsWithActions} searchPlaceholder="搜索名称/描述" pageSize={15} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="确认删除"
        description={`确定删除「${deleteTarget?.name}」？此操作不可撤销。`}
        onConfirm={handleDelete}
      />
    </PageLayout>
  );
}
