# 遗产知识 — 功能需求规格

> **话题标签:** `010-heritage`
> **上次更新:** 2026-07-05

## 业务定位

遗产知识是丽江古城文化遗产的百科式展示模块。按类型分：**道路水系、桥梁古井、保护民居、历史建筑、古树名木、人文环境**。游客可浏览列表、就近查看、查看详情和地图位置。

**本质：** 旅游资源知识库 + 位置发现。

## 数据模型

```typescript
// 按类型分别定义数据结构，在 features/heritage/shared/types.ts
type HeritageCategory = "road" | "water" | "bridge" | "well" | "protectedHouse" | "historicBuilding" | "ancientTree" | "humanEnvironment"

interface HeritageItem {
  id: string
  name: string
  category: HeritageCategory
  description: string
  address: string
  lat?: number
  lng?: number
  images: string[]
  era?: string
  protected_level?: string
  significance?: string
}
```

数据在 `features/heritage/shared/data/` 按类型分别文件存放（roads.ts, waters.ts, bridges.ts 等）。

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | HeritagePage | `/c/heritage` | 遗产列表（类型 Tab + 附近排序） |
| C | Various detail pages | `/c/heritage/:type/:id` | 按类型分别的详情页（RoadDetail, WaterDetail 等 8 个） |

## 依赖关系

- content（详情页中的 ContactSheet 商户联系方式，但 current ContactSheet 已在 shared 中）

## 约束

1. 全部数据硬编码在 `features/heritage/shared/data/`，无后端
2. 地图位用 Leaflet 标注，只有位置、无路径
3. 遗产分类体系已经固定，不动态扩展
