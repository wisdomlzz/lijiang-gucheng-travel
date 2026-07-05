# 精选路线 — 功能需求规格

> **话题标签:** `009-route`
> **上次更新:** 2026-07-05

## 业务定位

精选路线是古城游览推荐攻略。每条路线包含多个景点/店铺/打卡点，按主题组织（非遗之旅、美食地图等）。

**本质：** 旅游攻略内容卡片，非导航路线（无地图路径绘制）。

## 数据模型

```typescript
interface Route {
  id: string          // routeId in recommendRoutes
  name: string
  subtitle: string
  tag: string
  tagColor: string
  img: string
  waypoints?: {       // 途经点（未来可选）
    name: string
    description: string
    lat?: number
    lng?: number
  }[]
}
```

当前数据定义在 `HomePage.tsx` 中的 `recommendRoutes` 常量数组（硬编码）。

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | RoutesPage | `/c/routes` | 路线列表 |
| C | RouteDetailPage | `/c/routes/:id` | 路线详情 |
| C | RoutePreviewPage | `/c/routes/:id/preview` | 路线预览（H5 分享用） |

## 依赖关系

- content（路线中的商户/景点数据）

## 差距分析

1. `recommendRoutes` 当前硬编码在 `HomePage.tsx` 中，`SearchResultsPage.tsx` 重复定义了同一份数据。应抽到 `features/route/shared/routes-data.ts`
2. 路线无独立 store（通过首页配置展现），未来可扩展
