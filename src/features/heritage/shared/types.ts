// 遗产知识类型
export type HeritageType =
  "road" | "water" | "well" | "bridge" | "ancient-tree" | "protected-house" | "historic-building" | "human-environment"

// 片区
export type Area = "大研" | "白沙" | "束河" | "大研古城" | "大研古城（含黑龙潭）"

// 统一遗产接口
export interface HeritageItem {
  // ── 固定字段（全部类型通用）──
  id: string
  type: HeritageType
  name: string
  area: Area
  location: { lat: number; lng: number }
  description: string
  photos: string[]
  address?: string
  preservationStatus?: string
  basicInfo?: string
  drawings?: string[]
  heritageSubType?: string

  // ── 灵活字段（类型特有）──
  extra?: Record<string, string | string[] | boolean>
}

// 类型元数据
export const heritageTypeMeta: Record<HeritageType, { label: string; icon: string }> = {
  road: { label: "道路", icon: "road" },
  water: { label: "水系", icon: "droplets" },
  well: { label: "井/泉", icon: "well" },
  bridge: { label: "古桥", icon: "bridge" },
  "ancient-tree": { label: "古树", icon: "tree" },
  "protected-house": { label: "保护民居", icon: "home" },
  "historic-building": { label: "历史建筑", icon: "building" },
  "human-environment": { label: "人文环境", icon: "landmark" },
}

// 每种类型的灵活字段定义（key → 中文标签）
export const heritageExtraFields: Record<HeritageType, { key: string; label: string }[]> = {
  road: [{ key: "orientation", label: "朝向" }],
  water: [{ key: "flowDirection", label: "流向" }],
  well: [{ key: "eyeCount", label: "眼数" }],
  bridge: [
    { key: "material", label: "材质" },
    { key: "loadCapacity", label: "荷载" },
    { key: "bridgeHeight", label: "高度" },
    { key: "pointWidth", label: "宽度" },
  ],
  "ancient-tree": [
    { key: "familyName", label: "科名" },
    { key: "genusName", label: "属名" },
    { key: "speciesName", label: "树种名" },
    { key: "latinName", label: "拉丁名" },
    { key: "protectionLevel", label: "保护等级" },
    { key: "treeAge", label: "树龄" },
    { key: "treeHeight", label: "树高" },
    { key: "chestCircumference", label: "胸围" },
    { key: "remark", label: "备注" },
  ],
  "protected-house": [
    { key: "buildingPattern", label: "建筑格局" },
    { key: "heritageElements", label: "遗产要素" },
    { key: "propertyOwner", label: "产权" },
    { key: "managementUnit", label: "经营管理" },
    { key: "remark", label: "备注" },
  ],
  "historic-building": [
    { key: "buildingPattern", label: "建筑格局" },
    { key: "heritageElements", label: "遗产要素" },
    { key: "propertyOwner", label: "产权" },
    { key: "managementUnit", label: "经营管理" },
    { key: "remark", label: "备注" },
  ],
  "human-environment": [
    { key: "buildingPattern", label: "建筑格局" },
    { key: "heritageElements", label: "遗产要素" },
  ],
}
