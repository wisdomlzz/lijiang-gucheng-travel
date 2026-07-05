# 桌面端导航重构 + 新增管理面板 实施计划

> **执行方式：** 本计划将按 Phase → Task 顺序执行，每个任务完成即 commit。

**目标：** 重构桌面端导航结构 + 补齐 4 个缺失管理面板 + 便民服务页面 Tab 化

**架构：** 新建 2 store + 2 页面，改造 3 页面，重写 nav+router

**技术栈：** React 18 + TypeScript + shadcn/ui + zustand

---

## Phase 1: 数据层（新 Store）

### Task 1: 创建 review-store.ts

**文件：** `src/features/convenience/store/review-store.ts`

**说明：** 评价管理数据层，含种子评价数据、CRUD、统计方法。

### Task 2: 创建 rules-store.ts

**文件：** `src/features/trust-score/store/rules-store.ts`

**说明：** 诚信评分规则配置数据层，含种子规则、阈值配置。

---

## Phase 2: 导航结构

### Task 3: 重写 nav.ts（4 组 17 项）

**文件：** `src/desktop/nav.ts`

**改动：** 移除公告下发管理/人流量预警/原财务与预警整组；新增诚信管理组；运营管理并入投诉+志愿；商户与供应商合并。

### Task 4: 更新 App.tsx（路由注册）

**文件：** `src/desktop/App.tsx`

**改动：** 注册新页面路由（评价管理、诚信评分配置）；移除 price-arbitration 独立路由（已合并入订单管理 Tab）

---

## Phase 3: 新页面

### Task 5: 创建 ReviewManagementPage.tsx

**文件：** `src/features/convenience/desktop/pages/ReviewManagementPage.tsx`

**说明：** 评价管理独立页面，含统计卡片 + 评价列表 + 回复弹窗。

### Task 6: 创建 TrustScoreConfigPage.tsx

**文件：** `src/features/trust-score/desktop/pages/TrustScoreConfigPage.tsx`

**说明：** 诚信评分配置页面，含评分规则管理 + 失信阈值配置。

---

## Phase 4: 现有页面改造

### Task 7: 改造 ConvenienceStaffPage → 人员管理

**文件：** `src/features/convenience/desktop/pages/ConvenienceStaffPage.tsx`

**改动：** 加 Tab 切换（人员列表 + 在线状态），增强人员和状态视图。

### Task 8: 重构 ConveniencePage → 订单管理 Tab 壳

**文件：** `src/features/convenience/desktop/pages/ConveniencePage.tsx`

**改动：** 改为 5-Tab 页面：全部订单 / 待审核 / 取消审批 / 报价审核 / 付款凭证。