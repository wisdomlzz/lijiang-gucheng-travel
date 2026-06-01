import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PageLayout } from "../../../components/common/PageLayout";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Textarea } from "../../../../shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../shared/components/ui/select";
import { toast } from "sonner";
import { useHeritageManageStore, heritageTypeMeta } from "../../../../shared/stores/heritage-manage-store";
import type {
  HeritageType,
  HeritageItem,
  RoadHeritage,
  WaterHeritage,
  WellHeritage,
  BridgeHeritage,
  TreeHeritage,
  ResidenceHeritage,
  PublicStructureHeritage,
  CulturalEnvironmentHeritage,
} from "../../../../c-end/types/heritage";
import { ChevronLeft } from "lucide-react";

interface HeritageFormProps {
  type: HeritageType;
  item?: HeritageItem;
  onSubmit?: (data: Partial<HeritageItem>) => void;
  mode: "create" | "edit";
}

interface FormState {
  // Base
  name: string;
  area: string;
  description: string;
  photos: string;
  location: { lat: string; lng: string };
  // Road
  orientation: string;
  scale: string;
  cadDrawings: string;
  // Water
  waterType: string;
  flow: string;
  blueprints: string;
  // Well
  wellType: string;
  wellCount: string;
  heritageElement: string;
  address: string;
  // Bridge
  bridgeType: string;
  lengthNorth: string;
  lengthSouth: string;
  height: string;
  width: string;
  material: string;
  holeCount: string;
  // Tree
  code: string;
  family: string;
  genus: string;
  species: string;
  latinName: string;
  treeAge: string;
  treeHeight: string;
  trunkCircumference: string;
  protectionLevel: string;
  remark: string;
  // Residence/PublicStructure/CulturalEnvironment
  heritageSubType: string;
  zoneType: string;
  community: string;
  preservationStatus: string;
  buildingLayout: string;
  structureType: string;
  isHeritageUnit: boolean;
  heritageUnitLevel: string;
  buildingArea: string;
  usage: string;
  propertyRight: string;
  operator: string;
  pointCloud: string;
  constructionYear: string;
  // Common
  history: string;
  features: string;
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-text-heading border-b border-border-light pb-2">{title}</div>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function FormField({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className || (required ? "col-span-2" : "")}>
      <label className="text-sm font-medium mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export function HeritageForm({ type, item, onSubmit, mode }: HeritageFormProps) {
  const navigate = useNavigate();
  const meta = heritageTypeMeta[type];
  const { createItem, updateItem } = useHeritageManageStore();
  const [submitting, setSubmitting] = useState(false);

  const initForm = (): FormState => {
    const base = {
      name: item?.name || "",
      area: item?.area || "大研",
      description: item?.description || "",
      photos: item?.photos?.join(", ") || "",
      location: {
        lat: item?.location?.lat?.toString() || "26.875",
        lng: item?.location?.lng?.toString() || "100.233",
      },
      history: (item as any)?.history || "",
      features: item?.features || "",
    };

    switch (type) {
      case "road":
        return {
          ...base,
          orientation: (item as RoadHeritage)?.orientation || "",
          scale: (item as RoadHeritage)?.scale || "",
          cadDrawings: (item as RoadHeritage)?.cadDrawings?.join(", ") || "",
          waterType: "", flow: "", blueprints: "", wellType: "", wellCount: "",
          heritageElement: "", address: "", bridgeType: "", lengthNorth: "",
          lengthSouth: "", height: "", width: "", material: "", holeCount: "",
          code: "", family: "", genus: "", species: "", latinName: "",
          treeAge: "", treeHeight: "", trunkCircumference: "", protectionLevel: "", remark: "",
          heritageSubType: "", zoneType: "", community: "", preservationStatus: "",
          buildingLayout: "", structureType: "", isHeritageUnit: false,
          heritageUnitLevel: "", buildingArea: "", usage: "", propertyRight: "",
          operator: "", pointCloud: "", constructionYear: "",
        };
      case "water":
        return {
          ...base,
          waterType: (item as WaterHeritage)?.waterType || "",
          flow: (item as WaterHeritage)?.flow || "",
          scale: (item as WaterHeritage)?.scale || (item as RoadHeritage)?.scale || "",
          blueprints: (item as WaterHeritage)?.blueprints?.join(", ") || "",
          orientation: "", cadDrawings: "", wellType: "", wellCount: "",
          heritageElement: "", address: "", bridgeType: "", lengthNorth: "",
          lengthSouth: "", height: "", width: "", material: "", holeCount: "",
          code: "", family: "", genus: "", species: "", latinName: "",
          treeAge: "", treeHeight: "", trunkCircumference: "", protectionLevel: "", remark: "",
          heritageSubType: "", zoneType: "", community: "", preservationStatus: "",
          buildingLayout: "", structureType: "", isHeritageUnit: false,
          heritageUnitLevel: "", buildingArea: "", usage: "", propertyRight: "",
          operator: "", pointCloud: "", constructionYear: "",
        };
      case "well":
        return {
          ...base,
          wellType: (item as WellHeritage)?.wellType || "",
          wellCount: (item as WellHeritage)?.wellCount || "",
          heritageElement: (item as WellHeritage)?.heritageElement || "",
          address: (item as WellHeritage)?.address || "",
          orientation: "", scale: "", cadDrawings: "", waterType: "", flow: "", blueprints: "",
          bridgeType: "", lengthNorth: "", lengthSouth: "", height: "", width: "", material: "", holeCount: "",
          code: "", family: "", genus: "", species: "", latinName: "",
          treeAge: "", treeHeight: "", trunkCircumference: "", protectionLevel: "", remark: "",
          heritageSubType: "", zoneType: "", community: "", preservationStatus: "",
          buildingLayout: "", structureType: "", isHeritageUnit: false,
          heritageUnitLevel: "", buildingArea: "", usage: "", propertyRight: "",
          operator: "", pointCloud: "", constructionYear: "",
        };
      case "bridge":
        return {
          ...base,
          bridgeType: (item as BridgeHeritage)?.bridgeType || "",
          lengthNorth: (item as BridgeHeritage)?.lengthNorth || "",
          lengthSouth: (item as BridgeHeritage)?.lengthSouth || "",
          height: (item as BridgeHeritage)?.height || "",
          width: (item as BridgeHeritage)?.width || "",
          material: (item as BridgeHeritage)?.material || "",
          holeCount: (item as BridgeHeritage)?.holeCount || "",
          blueprints: (item as BridgeHeritage)?.blueprints?.join(", ") || "",
          orientation: "", scale: "", cadDrawings: "", waterType: "", flow: "",
          wellType: "", wellCount: "", heritageElement: "", address: "",
          code: "", family: "", genus: "", species: "", latinName: "",
          treeAge: "", treeHeight: "", trunkCircumference: "", protectionLevel: "", remark: "",
          heritageSubType: "", zoneType: "", community: "", preservationStatus: "",
          buildingLayout: "", structureType: "", isHeritageUnit: false,
          heritageUnitLevel: "", buildingArea: "", usage: "", propertyRight: "",
          operator: "", pointCloud: "", constructionYear: "",
        };
      case "tree":
        return {
          ...base,
          code: (item as TreeHeritage)?.code || "",
          family: (item as TreeHeritage)?.family || "",
          genus: (item as TreeHeritage)?.genus || "",
          species: (item as TreeHeritage)?.species || "",
          latinName: (item as TreeHeritage)?.latinName || "",
          treeAge: (item as TreeHeritage)?.treeAge || "",
          treeHeight: (item as TreeHeritage)?.treeHeight || "",
          trunkCircumference: (item as TreeHeritage)?.trunkCircumference || "",
          protectionLevel: (item as TreeHeritage)?.protectionLevel || "",
          remark: (item as TreeHeritage)?.remark || "",
          orientation: "", scale: "", cadDrawings: "", waterType: "", flow: "", blueprints: "",
          wellType: "", wellCount: "", heritageElement: "", address: "",
          bridgeType: "", lengthNorth: "", lengthSouth: "", height: "", width: "", material: "", holeCount: "",
          heritageSubType: "", zoneType: "", community: "", preservationStatus: "",
          buildingLayout: "", structureType: "", isHeritageUnit: false,
          heritageUnitLevel: "", buildingArea: "", usage: "", propertyRight: "",
          operator: "", pointCloud: "", constructionYear: "",
        };
      case "residence":
      case "publicStructure":
      case "culturalEnvironment":
        const r = item as ResidenceHeritage | PublicStructureHeritage | CulturalEnvironmentHeritage;
        return {
          ...base,
          heritageSubType: r?.heritageSubType || "",
          address: r?.address || "",
          zoneType: r?.zoneType || "",
          community: r?.community || "",
          preservationStatus: r?.preservationStatus || "",
          buildingLayout: r?.buildingLayout || "",
          structureType: r?.structureType || "",
          isHeritageUnit: r?.isHeritageUnit || false,
          heritageUnitLevel: r?.heritageUnitLevel || "",
          buildingArea: r?.buildingArea || "",
          usage: r?.usage || "",
          propertyRight: r?.propertyRight || "",
          operator: r?.operator || "",
          pointCloud: r?.pointCloud || "",
          cadDrawings: r?.cadDrawings?.join(", ") || "",
          constructionYear: r?.constructionYear || "",
          orientation: "", scale: "", waterType: "", flow: "", blueprints: "",
          wellType: "", wellCount: "", heritageElement: "",
          bridgeType: "", lengthNorth: "", lengthSouth: "", height: "", width: "", material: "", holeCount: "",
          code: "", family: "", genus: "", species: "", latinName: "",
          treeAge: "", treeHeight: "", trunkCircumference: "", protectionLevel: "", remark: "",
        };
      default:
        return {
          ...base,
          orientation: "", scale: "", cadDrawings: "", waterType: "", flow: "", blueprints: "",
          wellType: "", wellCount: "", heritageElement: "", address: "",
          bridgeType: "", lengthNorth: "", lengthSouth: "", height: "", width: "", material: "", holeCount: "",
          code: "", family: "", genus: "", species: "", latinName: "",
          treeAge: "", treeHeight: "", trunkCircumference: "", protectionLevel: "", remark: "",
          heritageSubType: "", zoneType: "", community: "", preservationStatus: "",
          buildingLayout: "", structureType: "", isHeritageUnit: false,
          heritageUnitLevel: "", buildingArea: "", usage: "", propertyRight: "",
          operator: "", pointCloud: "", constructionYear: "",
        };
    }
  };

  const [form, setForm] = useState<FormState>(initForm);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const parsePhotos = (val: string): string[] => {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  };

  const parseArrayField = (val: string): string[] => {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  };

  const validate = (): boolean => {
    if (!form.name?.trim()) {
      toast.error("请填写名称");
      return false;
    }
    if (!form.area) {
      toast.error("请选择所在区域");
      return false;
    }

    // Latitude range check (-90 to 90)
    const lat = parseFloat(form.location.lat);
    if (form.location.lat && (isNaN(lat) || lat < -90 || lat > 90)) {
      toast.error("纬度必须在 -90 到 90 之间");
      return false;
    }

    // Longitude range check (-180 to 180)
    const lng = parseFloat(form.location.lng);
    if (form.location.lng && (isNaN(lng) || lng < -180 || lng > 180)) {
      toast.error("经度必须在 -180 到 180 之间");
      return false;
    }

    // Photo URL format validation
    const photos = parsePhotos(form.photos);
    const urlPattern = /^https?:\/\/.+/;
    for (const url of photos) {
      if (!urlPattern.test(url)) {
        toast.error(`照片URL格式不正确: ${url}`);
        return false;
      }
    }

    // Type-specific required field validation
    if (type === "tree" && !form.species?.trim()) {
      toast.error("请填写树种名");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (submitting) return;
    setSubmitting(true);

    const baseData = {
      name: form.name,
      area: form.area as any,
      location: {
        lat: parseFloat(form.location.lat) || 26.875,
        lng: parseFloat(form.location.lng) || 100.233,
      },
      description: form.description,
      photos: parsePhotos(form.photos),
      history: form.history,
      features: form.features,
    };

    let typeSpecificData: Partial<HeritageItem> = {};

    switch (type) {
      case "road":
        typeSpecificData = {
          orientation: form.orientation || undefined,
          scale: form.scale || undefined,
          cadDrawings: form.cadDrawings ? parseArrayField(form.cadDrawings) : undefined,
        };
        break;
      case "water":
        typeSpecificData = {
          waterType: form.waterType || undefined,
          flow: form.flow || undefined,
          scale: form.scale || undefined,
          blueprints: form.blueprints ? parseArrayField(form.blueprints) : undefined,
        };
        break;
      case "well":
        typeSpecificData = {
          wellType: form.wellType || undefined,
          wellCount: form.wellCount || undefined,
          heritageElement: form.heritageElement || undefined,
          address: form.address || undefined,
        };
        break;
      case "bridge":
        typeSpecificData = {
          bridgeType: form.bridgeType || undefined,
          lengthNorth: form.lengthNorth || undefined,
          lengthSouth: form.lengthSouth || undefined,
          height: form.height || undefined,
          width: form.width || undefined,
          material: form.material || undefined,
          holeCount: form.holeCount || undefined,
          blueprints: form.blueprints ? parseArrayField(form.blueprints) : undefined,
        };
        break;
      case "tree":
        typeSpecificData = {
          code: form.code || undefined,
          family: form.family || undefined,
          genus: form.genus || undefined,
          species: form.species,
          latinName: form.latinName || undefined,
          treeAge: form.treeAge || undefined,
          treeHeight: form.treeHeight || undefined,
          trunkCircumference: form.trunkCircumference || undefined,
          protectionLevel: form.protectionLevel || undefined,
          remark: form.remark || undefined,
        };
        break;
      case "residence":
      case "publicStructure":
      case "culturalEnvironment":
        typeSpecificData = {
          heritageSubType: form.heritageSubType || undefined,
          address: form.address,
          zoneType: form.zoneType || undefined,
          community: form.community || undefined,
          preservationStatus: form.preservationStatus || undefined,
          buildingLayout: form.buildingLayout || undefined,
          structureType: form.structureType || undefined,
          isHeritageUnit: form.isHeritageUnit,
          heritageUnitLevel: form.heritageUnitLevel || undefined,
          buildingArea: form.buildingArea || undefined,
          usage: form.usage || undefined,
          propertyRight: form.propertyRight || undefined,
          operator: form.operator || undefined,
          pointCloud: form.pointCloud || undefined,
          cadDrawings: form.cadDrawings ? parseArrayField(form.cadDrawings) : undefined,
          constructionYear: form.constructionYear || undefined,
          remark: form.remark || undefined,
        };
        break;
    }

    const data = { ...baseData, ...typeSpecificData } as HeritageItem;

    if (onSubmit) {
      onSubmit(data);
    } else if (mode === "create") {
      createItem(type, data as Omit<HeritageItem, "id" | "type">);
      toast.success("创建成功");
      navigate("/desktop/heritage");
    } else {
      updateItem(type, item!.id, data);
      toast.success("更新成功");
      navigate("/desktop/heritage");
    }
    setSubmitting(false);
  };

  const pageTitle = mode === "create" ? `新建${meta?.label || "遗产"}` : `编辑${meta?.label || "遗产"}`;
  const pageDesc = mode === "create" ? `添加新的${meta?.label}记录` : `编辑 ${item?.name} 的信息`;

  return (
    <PageLayout
      title={pageTitle}
      description={pageDesc}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(mode === "edit" ? `/desktop/heritage/${type}/${item?.id}` : "/desktop/heritage")}
          >
            <ChevronLeft className="size-3.5 mr-1" />
            返回
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "保存中..." : "保存"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <FieldGroup title="基本信息">
          <FormField label="名称" required>
            <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="请输入名称" />
          </FormField>
          <FormField label="所在区域">
            <Select value={form.area} onValueChange={(v) => setField("area", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="大研">大研</SelectItem>
                <SelectItem value="白沙">白沙</SelectItem>
                <SelectItem value="束河">束河</SelectItem>
                <SelectItem value="大研古城（含黑龙潭）">大研古城（含黑龙潭）</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="纬度">
            <Input
              type="number"
              step="any"
              value={form.location.lat}
              onChange={(e) => setField("location", { ...form.location, lat: e.target.value })}
            />
          </FormField>
          <FormField label="经度">
            <Input
              type="number"
              step="any"
              value={form.location.lng}
              onChange={(e) => setField("location", { ...form.location, lng: e.target.value })}
            />
          </FormField>
          <FormField label="照片URL" className="col-span-2">
            <Input
              value={form.photos}
              onChange={(e) => setField("photos", e.target.value)}
              placeholder="多个URL用逗号分隔"
            />
          </FormField>
          <FormField label="描述" className="col-span-2">
            <Textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={2}
              placeholder="请输入描述"
            />
          </FormField>
        </FieldGroup>

        {/* Type-specific fields */}
        {type === "road" && (
          <FieldGroup title="道路信息">
            <FormField label="朝向">
              <Input value={form.orientation} onChange={(e) => setField("orientation", e.target.value)} placeholder="如：南北向" />
            </FormField>
            <FormField label="规模">
              <Input value={form.scale} onChange={(e) => setField("scale", e.target.value)} placeholder="如：东西长76米" />
            </FormField>
            <FormField label="CAD图纸" className="col-span-2">
              <Input value={form.cadDrawings} onChange={(e) => setField("cadDrawings", e.target.value)} placeholder="多个URL用逗号分隔" />
            </FormField>
          </FieldGroup>
        )}

        {type === "water" && (
          <FieldGroup title="水系信息">
            <FormField label="水系类型">
              <Input value={form.waterType} onChange={(e) => setField("waterType", e.target.value)} placeholder="如水渠、河流等" />
            </FormField>
            <FormField label="流向">
              <Input value={form.flow} onChange={(e) => setField("flow", e.target.value)} placeholder="如水流方向" />
            </FormField>
            <FormField label="规模">
              <Input value={form.scale} onChange={(e) => setField("scale", e.target.value)} placeholder="如：潭面近5万平方米" />
            </FormField>
            <FormField label="图纸" className="col-span-2">
              <Input value={form.blueprints} onChange={(e) => setField("blueprints", e.target.value)} placeholder="多个URL用逗号分隔" />
            </FormField>
          </FieldGroup>
        )}

        {type === "well" && (
          <FieldGroup title="古井信息">
            <FormField label="井型">
              <Input value={form.wellType} onChange={(e) => setField("wellType", e.target.value)} placeholder="如：石井" />
            </FormField>
            <FormField label="眼数">
              <Input value={form.wellCount} onChange={(e) => setField("wellCount", e.target.value)} placeholder="如：4或四眼井" />
            </FormField>
            <FormField label="遗产要素">
              <Input value={form.heritageElement} onChange={(e) => setField("heritageElement", e.target.value)} placeholder="如：文保单位" />
            </FormField>
            <FormField label="位置/门牌号">
              <Input value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="请输入详细地址" />
            </FormField>
          </FieldGroup>
        )}

        {type === "bridge" && (
          <FieldGroup title="古桥信息">
            <FormField label="桥梁类型">
              <Input value={form.bridgeType} onChange={(e) => setField("bridgeType", e.target.value)} placeholder="如：石桥" />
            </FormField>
            <FormField label="孔数">
              <Input value={form.holeCount} onChange={(e) => setField("holeCount", e.target.value)} placeholder="如：2孔" />
            </FormField>
            <FormField label="北侧长度">
              <Input value={form.lengthNorth} onChange={(e) => setField("lengthNorth", e.target.value)} placeholder="请输入长度" />
            </FormField>
            <FormField label="南侧长度">
              <Input value={form.lengthSouth} onChange={(e) => setField("lengthSouth", e.target.value)} placeholder="请输入长度" />
            </FormField>
            <FormField label="高度">
              <Input value={form.height} onChange={(e) => setField("height", e.target.value)} placeholder="请输入高度" />
            </FormField>
            <FormField label="宽度">
              <Input value={form.width} onChange={(e) => setField("width", e.target.value)} placeholder="请输入宽度" />
            </FormField>
            <FormField label="材质">
              <Input value={form.material} onChange={(e) => setField("material", e.target.value)} placeholder="如：石材" />
            </FormField>
            <FormField label="图纸" className="col-span-2">
              <Input value={form.blueprints} onChange={(e) => setField("blueprints", e.target.value)} placeholder="多个URL用逗号分隔" />
            </FormField>
          </FieldGroup>
        )}

        {type === "tree" && (
          <FieldGroup title="古树信息">
            <FormField label="编号">
              <Input value={form.code} onChange={(e) => setField("code", e.target.value)} placeholder="请输入编号" />
            </FormField>
            <FormField label="科名">
              <Input value={form.family} onChange={(e) => setField("family", e.target.value)} placeholder="如：松科" />
            </FormField>
            <FormField label="属名">
              <Input value={form.genus} onChange={(e) => setField("genus", e.target.value)} placeholder="请输入属名" />
            </FormField>
            <FormField label="树种名" required>
              <Input value={form.species} onChange={(e) => setField("species", e.target.value)} placeholder="请输入树种名" />
            </FormField>
            <FormField label="拉丁名">
              <Input value={form.latinName} onChange={(e) => setField("latinName", e.target.value)} placeholder="请输入拉丁名" />
            </FormField>
            <FormField label="树龄">
              <Input value={form.treeAge} onChange={(e) => setField("treeAge", e.target.value)} placeholder="如：500年" />
            </FormField>
            <FormField label="树高">
              <Input value={form.treeHeight} onChange={(e) => setField("treeHeight", e.target.value)} placeholder="如：25米" />
            </FormField>
            <FormField label="胸围">
              <Input value={form.trunkCircumference} onChange={(e) => setField("trunkCircumference", e.target.value)} placeholder="如：3.5米" />
            </FormField>
            <FormField label="保护级别">
              <Select value={form.protectionLevel} onValueChange={(v) => setField("protectionLevel", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择保护级别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="一级">一级</SelectItem>
                  <SelectItem value="二级">二级</SelectItem>
                  <SelectItem value="三级">三级</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="备注" className="col-span-2">
              <Textarea value={form.remark} onChange={(e) => setField("remark", e.target.value)} rows={2} placeholder="其他补充信息" />
            </FormField>
          </FieldGroup>
        )}

        {(type === "residence" || type === "publicStructure" || type === "culturalEnvironment") && (
          <FieldGroup title="建筑信息">
            <FormField label="遗产要素类型">
              <Input value={form.heritageSubType} onChange={(e) => setField("heritageSubType", e.target.value)} placeholder="如：公共建(构)筑物" />
            </FormField>
            <FormField label="位置/门牌号">
              <Input value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="请输入详细地址" />
            </FormField>
            <FormField label="遗产区/缓冲区">
              <Select value={form.zoneType} onValueChange={(v) => setField("zoneType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="遗产区">遗产区</SelectItem>
                  <SelectItem value="缓冲区">缓冲区</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="社区">
              <Input value={form.community} onChange={(e) => setField("community", e.target.value)} placeholder="请输入社区名称" />
            </FormField>
            <FormField label="保护状况">
              <Select value={form.preservationStatus} onValueChange={(v) => setField("preservationStatus", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="完好">完好</SelectItem>
                  <SelectItem value="较好">较好</SelectItem>
                  <SelectItem value="一般">一般</SelectItem>
                  <SelectItem value="较差">较差</SelectItem>
                  <SelectItem value="损毁">损毁</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="建筑格局">
              <Input value={form.buildingLayout} onChange={(e) => setField("buildingLayout", e.target.value)} placeholder="如：三坊一照壁" />
            </FormField>
            <FormField label="结构类型">
              <Input value={form.structureType} onChange={(e) => setField("structureType", e.target.value)} placeholder="如：土木结构" />
            </FormField>
            <FormField label="建筑面积">
              <Input value={form.buildingArea} onChange={(e) => setField("buildingArea", e.target.value)} placeholder="如：300平方米" />
            </FormField>
            <FormField label="建造年代">
              <Input value={form.constructionYear} onChange={(e) => setField("constructionYear", e.target.value)} placeholder="如：清代光绪年间" />
            </FormField>
            <FormField label="用途">
              <Input value={form.usage} onChange={(e) => setField("usage", e.target.value)} placeholder="当前用途" />
            </FormField>
            <FormField label="产权">
              <Select value={form.propertyRight} onValueChange={(v) => setField("propertyRight", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="国有">国有</SelectItem>
                  <SelectItem value="集体">集体</SelectItem>
                  <SelectItem value="私有">私有</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="经营管理">
              <Input value={form.operator} onChange={(e) => setField("operator", e.target.value)} placeholder="请输入经营管理单位" />
            </FormField>
            <FormField label="文保单位" className="col-span-2">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isHeritageUnit}
                    onChange={(e) => setField("isHeritageUnit", e.target.checked)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <span className="text-sm">是否为文保单位</span>
                </label>
                {form.isHeritageUnit && (
                  <Select value={form.heritageUnitLevel} onValueChange={(v) => setField("heritageUnitLevel", v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="级别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="国家级">国家级</SelectItem>
                      <SelectItem value="省级">省级</SelectItem>
                      <SelectItem value="市级">市级</SelectItem>
                      <SelectItem value="县级">县级</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </FormField>
            <FormField label="点云" className="col-span-2">
              <Input value={form.pointCloud} onChange={(e) => setField("pointCloud", e.target.value)} placeholder="点云数据URL" />
            </FormField>
            <FormField label="CAD图纸" className="col-span-2">
              <Input value={form.cadDrawings} onChange={(e) => setField("cadDrawings", e.target.value)} placeholder="多个URL用逗号分隔" />
            </FormField>
            <FormField label="备注" className="col-span-2">
              <Textarea value={form.remark} onChange={(e) => setField("remark", e.target.value)} rows={2} placeholder="其他补充信息" />
            </FormField>
          </FieldGroup>
        )}

        {/* Common fields */}
        <FieldGroup title="详细描述">
          <FormField label="历史成因" className="col-span-2">
            <Textarea
              value={form.history}
              onChange={(e) => setField("history", e.target.value)}
              rows={3}
              placeholder="请输入历史成因"
            />
          </FormField>
          <FormField label="基本情况" className="col-span-2">
            <Textarea
              value={form.features}
              onChange={(e) => setField("features", e.target.value)}
              rows={3}
              placeholder="请输入基本情况"
            />
          </FormField>
        </FieldGroup>
      </div>
    </PageLayout>
  );
}

interface HeritageFormWrapperProps {
  mode: "create" | "edit";
}

export default function HeritageFormWrapper({ mode }: HeritageFormWrapperProps) {
  const { type, id } = useParams<{ type: string; id: string }>();
  const typeKey = type as HeritageType;
  const { items } = useHeritageManageStore();

  const item = mode === "edit" && id ? items[typeKey]?.find((h) => h.id === id) : undefined;

  return <HeritageForm type={typeKey} item={item} mode={mode} />;
}