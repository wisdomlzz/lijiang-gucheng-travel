// 遗产知识类型
export type HeritageType = 'road' | 'water' | 'well' | 'bridge' | 'tree' | 'residence' | 'publicStructure' | 'culturalEnvironment';

// 片区
export type Area = '大研' | '白沙' | '束河' | '大研古城（含黑龙潭）';

// 统一遗产接口
export interface HeritageItem {
  // ── 固定字段（全部类型通用）──
  id: string;
  type: HeritageType;
  name: string;                    // 名称
  area: Area;                      // 片区
  location: { lat: number; lng: number };  // 坐标
  description: string;             // 文字介绍（合并 history + description）
  photos: string[];                // 照片
  address?: string;                // 位置/门牌
  preservationStatus?: string;     // 保护状况/级别
  basicInfo?: string;              // 基本情况/特征（合并 features + 基本情况）
  drawings?: string[];             // 图纸（合并 cadDrawings + blueprints）
  heritageSubType?: string;        // 遗产子类型（合并 heritageElement + heritageSubType）

  // ── 灵活字段（类型特有，key-value 自由渲染）──
  extra?: Record<string, string | string[] | boolean>;
}

// 类型元数据
export const heritageTypeMeta: Record<HeritageType, { label: string; icon: string }> = {
  road: { label: '道路', icon: 'road' },
  water: { label: '水系', icon: 'droplets' },
  well: { label: '古井', icon: 'well' },
  bridge: { label: '古桥', icon: 'bridge' },
  tree: { label: '古树名木', icon: 'tree' },
  residence: { label: '代表性民居', icon: 'home' },
  publicStructure: { label: '公共构建物', icon: 'building' },
  culturalEnvironment: { label: '人文环境', icon: 'landmark' },
};

// 每种类型的灵活字段定义（key → 中文标签）
export const heritageExtraFields: Record<HeritageType, { key: string; label: string }[]> = {
  road: [
    { key: 'orientation', label: '朝向' },
    { key: 'scale', label: '规模' },
  ],
  water: [
    { key: 'waterType', label: '水系类型' },
    { key: 'flow', label: '流向' },
    { key: 'scale', label: '规模' },
  ],
  well: [
    { key: 'wellType', label: '井型' },
    { key: 'wellCount', label: '眼数' },
  ],
  bridge: [
    { key: 'bridgeType', label: '桥梁类型' },
    { key: 'material', label: '材质' },
    { key: 'holeCount', label: '孔数' },
    { key: 'height', label: '高度' },
    { key: 'width', label: '宽度' },
    { key: 'video', label: '视频' },
  ],
  tree: [
    { key: 'code', label: '编号' },
    { key: 'family', label: '科名' },
    { key: 'genus', label: '属名' },
    { key: 'species', label: '树种名' },
    { key: 'latinName', label: '拉丁名' },
    { key: 'treeAge', label: '树龄' },
    { key: 'treeHeight', label: '树高' },
    { key: 'trunkCircumference', label: '胸围' },
    { key: 'remark', label: '备注' },
  ],
  residence: [
    { key: 'zoneType', label: '遗产区/缓冲区' },
    { key: 'community', label: '社区' },
    { key: 'buildingLayout', label: '建筑格局' },
    { key: 'structureType', label: '结构类型' },
    { key: 'isHeritageUnit', label: '是否文保单位' },
    { key: 'heritageUnitLevel', label: '文保级别' },
    { key: 'buildingArea', label: '建筑面积' },
    { key: 'usage', label: '用途' },
    { key: 'propertyRight', label: '产权' },
    { key: 'operator', label: '经营管理' },
    { key: 'constructionYear', label: '建造年代' },
    { key: 'pointCloud', label: '点云数据' },
    { key: 'remark', label: '备注' },
  ],
  publicStructure: [
    { key: 'zoneType', label: '遗产区/缓冲区' },
    { key: 'community', label: '社区' },
    { key: 'buildingLayout', label: '建筑格局' },
    { key: 'structureType', label: '结构类型' },
    { key: 'isHeritageUnit', label: '是否文保单位' },
    { key: 'heritageUnitLevel', label: '文保级别' },
    { key: 'usage', label: '用途' },
    { key: 'propertyRight', label: '产权' },
    { key: 'operator', label: '经营管理' },
  ],
  culturalEnvironment: [
    { key: 'zoneType', label: '遗产区/缓冲区' },
    { key: 'community', label: '社区' },
    { key: 'buildingLayout', label: '建筑格局' },
    { key: 'structureType', label: '结构类型' },
    { key: 'isHeritageUnit', label: '是否文保单位' },
  ],
};
