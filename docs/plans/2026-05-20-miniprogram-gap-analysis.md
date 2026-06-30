# 小程序功能对照与优化计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对照小程序操作手册，梳理 demo 中哪些是复用（已实现）、新增、优化、未闭环的功能

**Architecture:** 基于丽江古城游小程序操作手册，对现有 demo 进行功能分类：复用小程序、新增功能、优化现有功能、缺失未闭环

**Tech Stack:** React 18.3 + Vite 6.3 + TypeScript + TailwindCSS 4 + React Router 7

---

## 一、小程序功能对照表

| 小程序功能 | Demo状态 | 路由 | 说明 |
|-----------|---------|------|------|
| **已实现（复用小程序）** |
| 导览地图 | ✅ 正常 | `/c/map` | MapPage |
| 文化院落 | ✅ 正常 | `/c/courtyards` | CulturalCourtyardsPage |
| 遗产知识 | ✅ 正常 | `/c/heritage` | HeritagePage |
| 公房服务 | ✅ 正常 | `/c/housing` | HousingPage |
| 一键投诉 | ✅ 正常 | `/c/complaint` | ComplaintPage |
| 志愿服务 | ⏸ 暂缓 | `/c/volunteer` | 功能口径未敲定，当前 demo 仅保留宫格占位页 |
| 停车服务 | ✅ 正常 | `/c/parking` | ParkingPage |
| 随手拍 | ✅ 正常 | `/c/photo-report` | PhotoReportPage |
| 我的发布 | ✅ 正常 | `/c/my-posts` | MyPostsPage |
| 商家发布 | ✅ 正常 | `/c/my-merchant-posts` | 我的-商家发布列表，展示已发布/审核中/已驳回入驻记录 |
| 我的收藏 | ✅ 正常 | `/c/favorites` | FavoritesPage |
| **已解锁复用** |
| 购在古城 | ✅ 正常 | `/c/merchants` | MerchantListPage，名称保持“购在古城” |
| 古城资讯 | ✅ 正常 | `/c/news` | NewsPage，同时首页底部聚合到“古城资讯与便民信息” |
| 精选路线 | ✅ 正常 | `/c/routes` | RoutesPage，支持搜索和详情预览 |
| VR游览 | ✅ 正常 | `/c/vr-tour` | VRTourPage |
| 便民信息 | ✅ 正常 | `/c/info` | InfoPage，分类对齐公房公告、房屋信息、举贤纳仕、其它 |
| **已补齐（小程序老版复用）** |
| 附近 | ✅ 正常 | `/c/nearby` | 按位置展示附近商家/POI，名称不再使用“附近好店” |
| 商家入驻 | ✅ 正常 | `/c/supplier-entry`、`/c/supplier-status` | 商家信息提交、状态查询、后台审核流程 |
| 酒吧 | ✅ 正常 | `/c/merchants?category=bar` | 商家类型之一，和酒吧附属信息维护对齐 |
| 餐饮 | ✅ 正常 | `/c/merchants?category=food` | 商家类型之一 |
| 住宿 | ✅ 正常 | `/c/merchants?category=hotel` | 商家类型之一 |
| **小程序指向外部（Demo不需实现）** |
| 周边游/租车/狮子山/千古情 | ↗ 外部 | `crmeb` | 跳转有赞商城 |
| 门票预定 | ↗ 外部 | `crmeb` | 跳转有赞商城 |
| 官方商城 | ↗ 外部 | `crmeb` | 跳转有赞商城 |
| 联票套餐 | ↗ 外部 | `crmeb` | 跳转有赞商城 |
| 一键服务(讲解服务) | ↗ 外部 | `crmeb` | 跳转CRM |

---

## 二、功能优先级

### P0 - 立即解锁（已有完整实现）
- [ ] 解锁 购在古城 - 路由 `#` → `/c/merchants`
- [ ] 解锁 古城资讯 - 路由 `#` → `/c/news`
- [ ] 解锁 精选路线 - 路由 `#` → `/c/routes`
- [ ] 解锁 VR游览 - 路由 `#` → `/c/vr-tour`
- [ ] 解锁 便民信息 - 路由 `#` → `/c/info`

### P1 - 新增核心功能
- [ ] 新增 附近 页面 - 按距离展示POI，支持分类筛选

### P2 - 补充商家生态
- [x] 新增 商家入驻 页面 - 商家提交信息+审核流程
- [x] 新增 商家发布 列表页

---

## 三、任务详情

### Task 1: 解锁购在古城

**Files:**
- Modify: `src/shared/stores/homepage-config-store.ts:35`
- Modify: `src/c-end/pages/HomePage.tsx:256`

```typescript
// homepage-config-store.ts
// 将 g9 的 route 从 "#" 改回 "/c/merchants"
{ id: "g9", iconName: "ShoppingBag", label: "购在古城", route: "/c/merchants", page: 2, visible: true, order: 0 },
```

### Task 2: 解锁古城资讯

**Files:**
- Modify: `src/shared/stores/homepage-config-store.ts`
- 将 g11 的 route 从 `#` 改回 `/c/news`

### Task 3: 解锁精选路线

**Files:**
- Modify: `src/shared/stores/homepage-config-store.ts`
- 将 g12 的 route 从 `#` 改回 `/c/routes`

### Task 4: 解锁VR游览

**Files:**
- Modify: `src/shared/stores/homepage-config-store.ts`
- 将 g6 的 route 从 `#` 改回 `/c/vr-tour`

### Task 5: 解锁便民信息

**Files:**
- Modify: `src/shared/stores/homepage-config-store.ts`
- 将 g14 的 route 从 `#` 改回 `/c/info`

### Task 6: 新增「附近」页面

**Files:**
- Create: `src/c-end/pages/NearbyPage.tsx`
- Create: `src/c-end/data/pois.ts` (附近POI数据)
- Create: `src/c-end/types/poi.ts`
- Modify: `src/c-end/routes.tsx` - 添加路由 `/c/nearby`
- Modify: `src/c-end/pages/HomePage.tsx` - 添加首页入口
- Modify: `src/shared/stores/homepage-config-store.ts` - 添加 g-N 附近 入口

**功能:**
- 按用户位置距离排序展示 POI（酒吧/客栈/景点/餐饮/服务）
- 支持分类 Tab 筛选
- 点击跳转详情/导航/VR预览

### Task 7: 新增「商家入驻」页面

**Files:**
- Create: `src/c-end/pages/MerchantEntryPage.tsx`
- Modify: `src/c-end/routes.tsx` - 添加路由 `/c/merchant-entry`
- Modify: `src/c-end/pages/HomePage.tsx` 或 grid 配置

**功能:**
- 选择商家类型（酒吧/餐饮/住宿）
- 填写商家信息（名称/地址/电话/简介/照片）
- 提交后等待审核

### Task 8: 新增「商家发布」列表

**Files:**
- Created: `src/c-end/pages/MyMerchantPostsPage.tsx`
- Modified: `src/c-end/routes.tsx` - 添加路由 `/c/my-merchant-posts`

**功能:**
- 展示商家发布列表（已发布/审核中）
- 状态筛选

---

## 四、验证方式

1. `npm run dev` 启动
2. 访问 `/c/home`
3. 验证所有复用入口可正常跳转
4. 验证新增页面功能正常
5. Build 验证

---

## 执行顺序

1. Task 1-5: 解锁5个复用入口（已完成）
2. Task 6: 新增附近页面（核心新功能）
3. Task 7-8: 新增商家入驻+商家发布（已完成）
