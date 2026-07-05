# C 端小程序架构完善与视觉一致性清理 — 实施计划

> **For agentic workers:** RECOMMENDED SUB-SKILL: `superpowers:subagent-driven-development` 或 `superpowers:executing-plans`。按任务逐步执行，每完成一个 Task 运行一次 `npm run build` 验证。

**Goal:** 在已完成 Feature-First 重构的基础上，把 `src/c-end/pages/` 中剩余的业务页面全部迁回对应 `features/`，补齐 C 端共享组件，统一设计 token 与视觉细节，修复 Tab 根级页面的返回按钮等交互问题，并建立基础的质量门禁。

**Architecture:** Feature-First Architecture（业务功能在 `features/` 垂直切片，三端目录只保留路由壳）。本计划不引入新架构范式，只做「归位」和「收口」。

**Tech Stack:** TypeScript, React 18, Zustand, Tailwind CSS v4, Vite, Vitest

**约束：**
- 不修改业务逻辑，只移动文件、调整导入、统一视觉。
- `AppLayout.tsx` 属于三端路由壳，保留在 `src/c-end/pages/`。
- Feature 之间不能互相 import；需要共享时抽到 `platform/` 或 `shared/`。
- 每改完一个 Task 必须能 `npm run build` 通过。

**Non-Goals:**
- 不重构便民服务状态机、商户审核业务、桌面端后台。
- 不替换图片资源（宫格图标、AI 头像等）——只在计划里给出建议，实施可选。

---

## 文件变更清单

| 文件/目录 | 操作 | 职责 |
|---|---|---|
| `src/c-end/pages/HomePage.tsx` | 迁移 → `features/homepage/c-end/pages/` | 首页 |
| `src/c-end/pages/AIChatPage.tsx` | 迁移 → `features/ai-knowledge/c-end/pages/` | AI 咨询 |
| `src/c-end/pages/ProfilePage.tsx` | 迁移 → `features/profile/c-end/pages/` | 我的 |
| `src/c-end/pages/AddressListPage.tsx` / `AddressEditPage.tsx` | 迁移 → `features/address/c-end/pages/` | 地址管理 |
| `src/c-end/pages/OrderListPage.tsx` / `OrderDetailPage.tsx` | 迁移 → `features/convenience/c-end/pages/` | 便民服务订单 |
| `src/c-end/pages/MerchantListPage.tsx` / `MerchantDetailPage.tsx` | 迁移 → `features/content/c-end/pages/` | 购在古城 |
| `src/c-end/pages/MyShopPage.tsx` | 迁移 → `features/merchant-review/c-end/pages/` | 我的店铺 |
| `src/c-end/pages/MerchantServicesPage.tsx` | 迁移 → `features/merchant-review/c-end/pages/` | 商户导航 |
| `src/c-end/pages/VisitorServicesPage.tsx` | 迁移 → `features/homepage/c-end/pages/` | 游客导航 |
| `src/c-end/pages/CulturalCourtyardsPage.tsx` / `CulturalCourtyardDetailPage.tsx` / `CulturalCourtyardVRPage.tsx` / `CourtyardBookingPage.tsx` / `MyBookingsPage.tsx` | 迁移 → `features/booking/c-end/pages/` | 文化院落 + 预约 |
| `src/c-end/pages/RoutesPage.tsx` / `RouteDetailPage.tsx` / `RoutePreviewPage.tsx` | 迁移 → 新建 `features/route/c-end/pages/` | 精选路线 |
| `src/c-end/pages/HeritagePage.tsx` / `heritage/detail/*` | 迁移 → 新建 `features/heritage/c-end/pages/` | 遗产知识 |
| `src/c-end/pages/MapPage.tsx` | 迁移 → `features/content/c-end/pages/` | 导览地图 |
| `src/c-end/pages/InfoPage.tsx` / `InfoDetailPage.tsx` / `NewsPage.tsx` / `MyPostsPage.tsx` | 迁移 → 新建 `features/info/c-end/pages/` | 古城资讯 + 便民信息 |
| `src/c-end/pages/AnnouncementPage.tsx` / `AnnouncementDetailPage.tsx` | 迁移 → `features/announcement/c-end/pages/` | 公告通知 |
| `src/c-end/pages/NotificationsPage.tsx` | 迁移 → 新建 `features/notification/c-end/pages/` | 消息通知 |
| `src/c-end/pages/PointsCenterPage.tsx` | 迁移 → `features/points/c-end/pages/` | 积分中心 |
| `src/c-end/pages/FavoritesPage.tsx` | 迁移 → `features/favorite/c-end/pages/` | 我的收藏 |
| `src/c-end/pages/HousingPage.tsx` | 迁移 → 新建 `features/housing/c-end/pages/` | 公房信息 |
| `src/c-end/pages/VRTourPage.tsx` | 迁移 → `features/content/c-end/pages/` | VR 游览 |
| `src/c-end/components/PageHeader.tsx` | 迁移 → `src/shared/components/mobile/PageHeader.tsx` | 通用移动端页头 |
| `src/c-end/components/HeritageMap.tsx` | 迁移 → `features/heritage/c-end/components/` | 遗产地图组件 |
| `src/c-end/components/StatusProgress.tsx` | 迁移 → `features/convenience/c-end/components/` | 服务进度条 |
| `src/c-end/components/ContactSheet.tsx` | 迁移 → `features/content/c-end/components/` | 联系弹窗 |
| `src/shared/components/mobile/SectionHeader.tsx` | 新建 | 模块标题组件 |
| `src/shared/components/mobile/GridIcon.tsx` | 新建 | 宫格图标组件 |
| `src/shared/components/mobile/InfoListItem.tsx` | 新建 | 左图右文资讯项 |
| `src/shared/components/mobile/TypeBadge.tsx` | 新建 | 类型徽章 |
| `src/shared/components/ErrorBoundary.tsx` | 新建 | Suspense 错误边界 |
| `src/c-end/routes.tsx` | 修改 | 更新所有懒加载路径 |
| `DESIGN.md` / `src/shared/styles/*` | 可选补全 | token 收口 |

---

## Phase 1：共享组件与视觉 token 收口

### Task 1：创建 `SectionHeader` 通用模块标题

**Files:**
- Create: `src/shared/components/mobile/SectionHeader.tsx`
- Modify: `src/c-end/pages/HomePage.tsx`, `src/c-end/pages/NewsPage.tsx` 等使用模块标题的页面

**Props 设计：**

```typescript
interface SectionHeaderProps {
  icon?: React.ElementType
  title: string
  action?: { label: string; to: string }
}
```

**实现要点：**
- 左侧小图标容器：`w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center`
- 标题：`text-[15px] font-semibold text-text-heading`
- 右侧操作：文字 `text-[12px] text-sky-deep font-medium` + `ChevronRight`

**验收：**
- [ ] `SectionHeader` 渲染与首页「推荐攻略」「景区资讯」标题一致。
- [ ] `NewsPage` 等页面替换后无视觉回退。
- [ ] `npm run build` 通过。

---

### Task 2：创建 `GridIcon` 宫格图标组件

**Files:**
- Create: `src/shared/components/mobile/GridIcon.tsx`
- Modify: `src/c-end/pages/HomePage.tsx`, `src/c-end/pages/VisitorServicesPage.tsx`, `src/c-end/pages/MerchantServicesPage.tsx`

**Props 设计：**

```typescript
interface GridIconProps {
  imageUrl?: string
  label: string
  gradientIndex?: number
  size?: "sm" | "md"   // sm=48px, md=52px
}
```

**实现要点：**
- 容器使用彩色渐变背景（复用 `HomePage` 里的 `GRADIENTS` 数组，抽到组件内部或 `shared/constants`）。
- 有 `imageUrl` 时图片 `object-contain p-1.5`；无图时显示首字。
- 支持按压缩放 `active:scale-90`。

**验收：**
- [ ] 首页宫格、游客导航、商户导航使用同一组件后视觉一致。
- [ ] 无图 fallback 显示正常。
- [ ] `npm run build` 通过。

---

### Task 3：创建 `TypeBadge` 与 `InfoListItem`

**Files:**
- Create: `src/shared/components/mobile/TypeBadge.tsx`
- Create: `src/shared/components/mobile/InfoListItem.tsx`
- Modify: `src/c-end/pages/HomePage.tsx`

**TypeBadge 实现要点：**
- 复用 `HomePage` 的 `badgeMeta` 映射，抽到 `shared/constants` 或组件内部。
- 支持 `type` 和 `title` 双参数，title 关键词做兜底。

**InfoListItem 实现要点：**
- 左图（w-24 h-24）+ 左上 `TypeBadge`。
- 右文：标题、摘要、日期、查看详情链接。
- 整体为白底卡片 + `shadow-card`。

**验收：**
- [ ] 首页景区资讯列表使用 `InfoListItem`。
- [ ] `NewsPage` 可复用该组件。
- [ ] `npm run build` 通过。

---

### Task 4：新增 `TabPageHeader`（无返回按钮）

**Files:**
- Create: `src/shared/components/mobile/TabPageHeader.tsx`
- Modify: `src/c-end/pages/VisitorServicesPage.tsx`, `src/c-end/pages/MerchantServicesPage.tsx`

**实现要点：**
- 与 `PageHeader` 同高（h-[44px]），但**不显示返回按钮**。
- 标题居中：`text-[16px] font-semibold text-text-body`。
- 底部 1px 边框：`border-b border-border-light`。

**验收：**
- [ ] 游客导航、商户导航页面顶部无返回按钮。
- [ ] 其他使用 `PageHeader` 的页面不受影响。
- [ ] `npm run build` 通过。

---

### Task 5：硬编码颜色/字号审计

**Files:**
- `src/c-end/pages/VisitorServicesPage.tsx`
- `src/c-end/pages/MerchantServicesPage.tsx`
- `src/features/convenience/c-end/pages/ServicesPage.tsx`
- `src/c-end/pages/ProfilePage.tsx`
- 其他被迁移的页面

**替换示例：**

| 旧值 | 新 token |
|---|---|
| `#F8F6F3` | `bg-surface-page` |
| `#94A3B8` | `text-text-tertiary` |
| `#334155` | `text-text-body` |
| `#CCC` | `text-text-tertiary` 或 `border-border-light` |
| `#f54900` | `text-danger` / `text-destructive` |
| `#cbd5e1` | `text-text-tertiary` |
| `#e2e8f0` | `border-border-light` |
| `text-slate-400` | `text-text-tertiary` |
| `bg-gray-100` / `bg-gray-200` | `bg-surface-strong` / `bg-surface-page` |

**验收：**
- [ ] 上述页面无直接裸色值（除渐变/徽章等已在 token 中定义的场景）。
- [ ] 视觉无回退。
- [ ] `npm run build` 通过。

---

## Phase 2：Feature-First 页面迁移

**通用迁移步骤模板（每个 Task 都按此执行）：**

1. 在目标 feature 下新建 `c-end/pages/`（若不存在）。
2. 移动页面文件，保持组件名和默认导出不变。
3. 调整相对导入路径（`../../shared/...` → `../../../../shared/...` 或 `@/shared/...`）。
4. 如果页面使用了 `c-end/components/PageHeader.tsx`，改为 `@/shared/components/mobile/PageHeader.tsx`。
5. 在 `src/c-end/routes.tsx` 中更新 `lazy(() => import(...))` 路径。
6. 删除 `src/c-end/pages/` 中的旧文件。
7. `npm run build`。

---

### Task 6：迁移首页相关

**Files:**
- Move: `src/c-end/pages/HomePage.tsx` → `src/features/homepage/c-end/pages/HomePage.tsx`
- Move: `src/c-end/pages/VisitorServicesPage.tsx` → `src/features/homepage/c-end/pages/VisitorServicesPage.tsx`
- Modify: `src/c-end/routes.tsx`

**说明：**
- 首页配置 store 已经在 `features/homepage/store/`，首页页面放在这里最自然。
- 游客导航是首页的服务入口目录，也放在 `features/homepage`。

**验收：**
- [ ] `/c/home` 和 `/c/visitor-services` 正常渲染。
- [ ] 底部 Tab「首页」「游客导航」active 状态正确。
- [ ] `npm run build` 通过。

---

### Task 7：迁移 AI 咨询

**Files:**
- Move: `src/c-end/pages/AIChatPage.tsx` → `src/features/ai-knowledge/c-end/pages/AIChatPage.tsx`
- Create: `src/features/ai-knowledge/c-end/pages/`（当前只有 desktop）
- Modify: `src/c-end/routes.tsx`

**验收：**
- [ ] `/c/ai` 正常渲染，AI 头像 Tab active 正确。
- [ ] `npm run build` 通过。

---

### Task 8：迁移「我的」与个人中心

**Files:**
- Create: `src/features/profile/` 目录结构
- Move: `src/c-end/pages/ProfilePage.tsx` → `src/features/profile/c-end/pages/ProfilePage.tsx`
- Modify: `src/c-end/routes.tsx`

**目录结构：**
```
src/features/profile/
├── c-end/pages/ProfilePage.tsx
└── store/        // 若后续有个人资料状态再扩展
```

**验收：**
- [ ] `/c/profile` 正常渲染，积分、志愿服务统计等数据正常。
- [ ] `npm run build` 通过。

---

### Task 9：迁移地址管理

**Files:**
- Move: `src/c-end/pages/AddressListPage.tsx` / `AddressEditPage.tsx` → `src/features/address/c-end/pages/`
- Modify: `src/c-end/routes.tsx`

**说明：**
- `features/address/store/` 已存在，地址页面应归到这里。

**验收：**
- [ ] `/c/addresses` 和 `/c/addresses/edit/:id` 正常。
- [ ] `npm run build` 通过。

---

### Task 10：迁移便民服务订单

**Files:**
- Move: `src/c-end/pages/OrderListPage.tsx` / `OrderDetailPage.tsx` → `src/features/convenience/c-end/pages/`
- Modify: `src/c-end/routes.tsx`

**说明：**
- 订单即便民服务订单，与 `features/convenience` 强相关。

**验收：**
- [ ] `/c/orders` 和 `/c/orders/:id` 正常。
- [ ] `npm run build` 通过。

---

### Task 11：迁移「购在古城」商户相关

**Files:**
- Move: `src/c-end/pages/MerchantListPage.tsx` / `MerchantDetailPage.tsx` → `src/features/content/c-end/pages/`
- Move: `src/c-end/components/ContactSheet.tsx` → `src/features/content/c-end/components/`
- Modify: `src/c-end/routes.tsx`

**说明：**
- 商户数据在 `features/content/store/merchant-store.ts`。
- `/c/merchants` 和 `/c/nearby` 都渲染 `MerchantListPage`；本计划后续 Task 14 会统一它们。

**验收：**
- [ ] `/c/merchants`、 `/c/nearby`、 `/c/merchant/:id` 正常。
- [ ] `npm run build` 通过。

---

### Task 12：迁移商户服务与我的店铺

**Files:**
- Move: `src/c-end/pages/MerchantServicesPage.tsx` → `src/features/merchant-review/c-end/pages/`
- Move: `src/c-end/pages/MyShopPage.tsx` → `src/features/merchant-review/c-end/pages/`
- Modify: `src/c-end/routes.tsx`

**说明：**
- 这两个页面都面向 supplier/merchant 角色，与 `features/merchant-review` 的认领/入驻/审核体系属于同一业务域。

**验收：**
- [ ] `/c/merchant-services`、 `/c/my-shop` 正常。
- [ ] `npm run build` 通过。

---

### Task 13：迁移文化院落与预约

**Files:**
- Move: `src/c-end/pages/CulturalCourtyardsPage.tsx` / `CulturalCourtyardDetailPage.tsx` / `CulturalCourtyardVRPage.tsx` / `CourtyardBookingPage.tsx` / `MyBookingsPage.tsx` → `src/features/booking/c-end/pages/`
- Modify: `src/c-end/routes.tsx`

**说明：**
- 院落浏览、VR、预约、我的预约都与「院落预约」业务相关，统一放到 `features/booking`。
- 如果未来院落内容极度膨胀，再拆分 `features/courtyard`。

**验收：**
- [ ] `/c/courtyards`、 `/c/courtyard/:id`、 `/c/courtyard/:id/vr`、 `/c/courtyard/:id/booking`、 `/c/my-bookings` 正常。
- [ ] `npm run build` 通过。

---

### Task 14：新建 `features/route` 并迁移路线

**Files:**
- Create: `src/features/route/c-end/pages/`
- Move: `src/c-end/pages/RoutesPage.tsx` / `RouteDetailPage.tsx` / `RoutePreviewPage.tsx` → `src/features/route/c-end/pages/`
- Modify: `src/c-end/routes.tsx`

**目录结构：**
```
src/features/route/
├── c-end/pages/
│   ├── RoutesPage.tsx
│   ├── RouteDetailPage.tsx
│   └── RoutePreviewPage.tsx
└── store/        // 若后续把路线配置数据从 homepage-store 移过来
```

**验收：**
- [ ] `/c/routes`、 `/c/routes/:id`、 `/c/routes/:id/preview` 正常。
- [ ] `npm run build` 通过。

---

### Task 15：新建 `features/heritage` 并迁移遗产知识

**Files:**
- Create: `src/features/heritage/c-end/pages/` 和 `c-end/components/`
- Move: `src/c-end/pages/HeritagePage.tsx` 和 `src/c-end/pages/heritage/detail/*` → `src/features/heritage/c-end/pages/`
- Move: `src/c-end/components/HeritageMap.tsx` → `src/features/heritage/c-end/components/`
- Modify: `src/c-end/routes.tsx`

**目录结构：**
```
src/features/heritage/
├── c-end/
│   ├── pages/
│   │   ├── HeritagePage.tsx
│   │   └── detail/
│   │       ├── RoadDetail.tsx
│   │       ├── WaterDetail.tsx
│   │       └── ...
│   └── components/
│       └── HeritageMap.tsx
└── store/        // 若后续把遗产数据从 content 移过来
```

**验收：**
- [ ] `/c/heritage` 和各 `/c/heritage/:type/:id` 正常。
- [ ] `npm run build` 通过。

---

### Task 16：迁移地图与 VR

**Files:**
- Move: `src/c-end/pages/MapPage.tsx` → `src/features/content/c-end/pages/MapPage.tsx`
- Move: `src/c-end/pages/VRTourPage.tsx` → `src/features/content/c-end/pages/VRTourPage.tsx`
- Modify: `src/c-end/routes.tsx`

**说明：**
- 地图和 VR 都依赖 `features/content` 的商户/POI 数据，暂时放在 content。
- 如果未来 VR 业务独立，再拆分为 `features/vr`。

**验收：**
- [ ] `/c/map`、 `/c/vr-tour` 正常。
- [ ] `npm run build` 通过。

---

### Task 17：新建 `features/info` 并迁移资讯与便民信息

**Files:**
- Create: `src/features/info/c-end/pages/`
- Move: `src/c-end/pages/InfoPage.tsx` / `InfoDetailPage.tsx` / `NewsPage.tsx` / `MyPostsPage.tsx` → `src/features/info/c-end/pages/`
- Modify: `src/c-end/routes.tsx`

**说明：**
- 古城资讯、News、便民信息我的发布属于同一内容域。
- 若数据仍在 `features/announcement/store/` 或 `features/news/store/`，info 页面可继续消费它们，但页面本身要归到 `features/info`。

**验收：**
- [ ] `/c/info`、 `/c/info/:id`、 `/c/news`、 `/c/my-posts` 正常。
- [ ] `npm run build` 通过。

---

### Task 18：迁移公告通知

**Files:**
- Move: `src/c-end/pages/AnnouncementPage.tsx` / `AnnouncementDetailPage.tsx` → `src/features/announcement/c-end/pages/`
- Modify: `src/c-end/routes.tsx`

**验收：**
- [ ] `/c/notice`、 `/c/announcement/:id` 正常。
- [ ] `npm run build` 通过。

---

### Task 19：新建 `features/notification` 并迁移消息通知

**Files:**
- Create: `src/features/notification/c-end/pages/`
- Move: `src/c-end/pages/NotificationsPage.tsx` → `src/features/notification/c-end/pages/NotificationsPage.tsx`
- Modify: `src/c-end/routes.tsx`

**说明：**
- `platform/notification` 是 store 层，不应放页面。页面放到 `features/notification`。

**验收：**
- [ ] `/c/notifications` 正常。
- [ ] `npm run build` 通过。

---

### Task 20：迁移积分与收藏

**Files:**
- Move: `src/c-end/pages/PointsCenterPage.tsx` → `src/features/points/c-end/pages/PointsCenterPage.tsx`
- Move: `src/c-end/pages/FavoritesPage.tsx` → `src/features/favorite/c-end/pages/FavoritesPage.tsx`
- Modify: `src/c-end/routes.tsx`

**验收：**
- [ ] `/c/points`、 `/c/favorites` 正常。
- [ ] `npm run build` 通过。

---

### Task 21：新建 `features/housing` 并迁移公房信息

**Files:**
- Create: `src/features/housing/c-end/pages/`
- Move: `src/c-end/pages/HousingPage.tsx` → `src/features/housing/c-end/pages/HousingPage.tsx`
- Modify: `src/c-end/routes.tsx`

**验收：**
- [ ] `/c/housing` 正常。
- [ ] `npm run build` 通过。

---

### Task 22：迁移 `StatusProgress`

**Files:**
- Move: `src/c-end/components/StatusProgress.tsx` → `src/features/convenience/c-end/components/StatusProgress.tsx`
- Update imports in `features/convenience/c-end/pages/ServicesPage.tsx` 和 `OrderDetailPage.tsx`（迁移后路径）。

**验收：**
- [ ] 服务进度条正常显示。
- [ ] `npm run build` 通过。

---

### Task 23：清理 `src/c-end/pages/` 与 `src/c-end/components/`

**Files:**
- `src/c-end/pages/` 应只保留 `AppLayout.tsx` 和 `App.tsx`（如果存在）。
- `src/c-end/components/` 应被清空或删除。

**验收：**
- [ ] `src/c-end/pages/` 仅剩 `AppLayout.tsx`。
- [ ] `src/c-end/components/` 为空或被删除。
- [ ] `npm run build` 通过。

---

## Phase 3：导航与交互修复

### Task 24：修复 Tab 根页面的返回按钮

**Files:**
- `src/c-end/pages/VisitorServicesPage.tsx`（迁移后路径： `src/features/homepage/c-end/pages/VisitorServicesPage.tsx`）
- `src/c-end/pages/MerchantServicesPage.tsx`（迁移后路径： `src/features/merchant-review/c-end/pages/MerchantServicesPage.tsx`）
- `src/shared/components/mobile/TabPageHeader.tsx`（Task 4 已创建）

**实现要点：**
- 将这两个页面的 `PageHeader` 替换为 `TabPageHeader`。
- 标题分别为「游客导航」「商户导航」。

**验收：**
- [ ] 游客导航、商户导航页面顶部无返回箭头。
- [ ] 其他子页面（如便民服务、我的店铺）仍保留返回按钮。
- [ ] `npm run build` 通过。

---

### Task 25：统一 `/c/merchants` 与 `/c/nearby`

**Files:**
- `src/c-end/routes.tsx`
- `src/features/content/c-end/pages/MerchantListPage.tsx`

**实现要点：**
- 删除 `/c/nearby` 独立路由。
- 保留 `/c/merchants`，并支持 `?nearby=1` 参数来显示「附近」模式。
- 在 `MerchantListPage` 中用 `searchParams.get("nearby")` 替代 `location.pathname.includes("/nearby")`。
- 所有跳转到 `/c/nearby` 的地方改为 `/c/merchants?nearby=1`。

**验收：**
- [ ] `/c/merchants?nearby=1` 标题显示「附近」，默认显示「购在古城」。
- [ ] 无 `/c/nearby` 路由。
- [ ] `npm run build` 通过。

---

### Task 26：为 C/B 端 Suspense 添加 ErrorBoundary

**Files:**
- Create: `src/shared/components/ErrorBoundary.tsx`
- Modify: `src/c-end/App.tsx`, `src/b-end/App.tsx`

**实现要点：**
- ErrorBoundary 捕获懒加载失败或页面渲染错误，显示「页面加载失败，点击重试」按钮。
- 在 `MiniProgramFrame` 内部、`Suspense` 外层包裹 `ErrorBoundary`。

**验收：**
- [ ] 模拟一个页面抛错，能看到友好提示而非白屏。
- [ ] `npm run build` 通过。

---

## Phase 4：类型与代码质量

### Task 27：为 `cRoutes` 添加类型

**Files:**
- `src/c-end/routes.tsx`

**实现要点：**
- 移除 `children: any`。
- 定义类型：

```typescript
type CRoute =
  | { path: string; element: React.ReactNode }
  | { element: React.ReactNode; children: Array<{ path?: string; index?: boolean; element: React.ReactNode }> }

const cRoutes: CRoute[] = [ ... ]
```

**验收：**
- [ ] `tsc --noEmit` 或 `npm run build` 无类型错误。
- [ ] 路由行为不变。

---

### Task 28：统一 `useAuthStore` 导入路径

**Files:**
- 全局搜索 `from "../shared/stores/auth-store"` 和 `from "../../shared/stores/auth-store"` 等。
- 统一改为 `from "@/platform/auth"`（如果 `platform/auth/index.ts` 导出 `useAuthStore`）。

**说明：**
- `CLAUDE.md` 定义 auth 属于 `platform/auth/`。优先从 platform 导入。

**验收：**
- [ ] 无 `shared/stores/auth-store` 的直接引用（除平台内部转发文件）。
- [ ] `npm run build` 通过。

---

### Task 29：补充 Vitest 业务流测试（可选但推荐）

**Files:**
- Create: `verification/tests/business-flow.spec.ts`

**测试范围建议：**
- 游客登录 → 首页渲染 → 点击宫格进入便民服务 → 下单 → 订单列表出现订单。
- 管理员登录桌面端 → 审核通过 → 状态变化。

**验收：**
- [ ] `npm run verify:all` 通过。

---

### Task 30：Accessibility 基础检查

**Files:**
- `src/shared/components/MiniProgramFrame.tsx`
- `src/shared/components/mobile/PageHeader.tsx`
- `src/c-end/pages/AppLayout.tsx`

**检查项：**
- 所有 `<button>` 有明确的 `aria-label` 或可见文本。
- 图片有 `alt`。
- 状态栏的「切换端」按钮添加 `aria-label="切换端"`。
- 支持 `prefers-reduced-motion`：将 `motion/react` 的动画在 reduced motion 时关闭。

**验收：**
- [ ] Lighthouse Accessibility 分数无明显下跌。
- [ ] `npm run build` 通过。

---

## Phase 5：验证与收尾

### Task 31：端到端冒烟验证

- [ ] 启动 `npm run dev`。
- [ ] 以游客账号登录 C 端，依次点击底部 5 个 Tab，确认页面正常。
- [ ] 点击首页宫格、推荐攻略、资讯列表，确认路由跳转正常。
- [ ] 以商户账号登录，确认「商户导航」「我的店铺」正常。

### Task 32：最终构建与提交

```bash
npm run build
npm run verify:all   # 如果实施了测试
```

- [ ] 构建通过。
- [ ] 测试通过。
- [ ] 提交信息示例：

```bash
git add .
git commit -m "refactor: complete C-end feature-first migration and UI consistency cleanup"
```

---

## 附录：未来可选优化（不在本计划内）

1. **宫格图标插画化**：把 `public/icons/*.png` 替换为统一风格的 SVG/插画。
2. **AI 头像品牌化**：用丽江纳西族风格的 AI 助手头像替换现有通用头像。
3. **B 端视觉统一**：将新的蓝天渐变、白卡、徽章体系同步到 `features/*/b-end/pages/`。
4. **Skeleton 加载态**：为首页 Banner、资讯列表添加骨架屏。
5. **PWA/真机适配**：处理 safe-area-inset、刘海屏等。
