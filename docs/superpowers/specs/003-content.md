# 购在古城（内容管理）— 功能需求规格

> **话题标签:** `003-content`
> **上次更新:** 2026-07-05

## 业务定位

"购在古城"是丽江古城店铺信息平台，让游客发现古城里有什么店、在哪、有什么特色。它**不是电子商城**，不做在线交易。

内容管理同时管理 POI 点、商户、Banner、宫格配置等。

## 数据模型

### Merchant
```typescript
interface Merchant {
  id: string
  name: string
  category: "food" | "hotel" | "bar" | "shopping"
  source: "后台添加" | "商家提交"
  reviewStatus: "通过" | "不通过" | "待审核"
  publishedAt?: string
  logo: string
  cover: string
  description: string
  address: string
  phone: string
  hours: string
  rating: number
  reviewCount: number
  creditScore: number
  openYear: number
  gallery: string[]
  certificates: Certificate[]
  lat?: number
  lng?: number
  // 新增（商户审核扩展）
  claimStatus: "unclaimed" | "pending" | "claimed"
  claimedBy?: string
  claimedAt?: string
  relatedUser?: string
}
```

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | MerchantListPage | `/c/merchants` | 商户列表（可选 `?nearby=1` 附近模式） |
| C | MerchantDetailPage | `/c/merchant/:id` | 商户详情 |
| C | MapPage | `/c/map` | 导览地图（POI 标记） |
| C | VRTourPage | `/c/vr-tour` | VR 全景游览 |
| Desktop | BannerManagePage | `/desktop/banner` | Banner 配置（首页用） |
| Desktop | GridSettingsPage | `/desktop/grid-settings` | 宫格图标配置 |

## 依赖关系

- merchant-review（claimStatus 展示）
- homepage（Banner + 宫格配置来源于此）
- booking（院落 POI 也在 content 管理）

## 约束

1. `MerchantListPage` 不做重构，只增量优化 claimStatus 标记
2. VR 全景用静态图片 + 360 度容器的模拟方案，无 WebXR
3. 地图用 leaflet + OpenStreetMap，无高德/百度 SDK

## 本 Demo 的范围

- ✅ **C 端**: MerchantListPage（分类/搜索/附近）、MerchantDetailPage（详情/评价/诚信分）、MapPage（Leaflet 地图标注）
- ✅ **桌面端**: BannerManagePage（轮播图管理）、GridSettingsPage（宫格配置）
- ✅ **Store**: merchant-store（商户 CRUD）、courtyard-store（院落 POI）、poi-store（兴趣点）、news-store（新闻）、guide-store（导游指南）— 6 个模块
- ⚠️ **VR 全景**: 用静态图片 + 360° 容器模拟，无 WebXR
- ⚠️ **地图**: 用 Leaflet + OSM，无高德/百度 SDK
- ❌ **非电子商城**: 本模块是信息展示平台，不做在线交易
