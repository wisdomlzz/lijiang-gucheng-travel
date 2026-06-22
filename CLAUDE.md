# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

**丽江古城游 V2.0** —— 面向丽江古城的旅游服务平台 Demo。一个 Vite + React 18 + TypeScript 单仓库应用承载了三个端：

| 路由前缀 | 端 | 形态 | 入口 |
| --- | --- | --- | --- |
| `/c/*` | C端 · 游客 | 移动端小程序（390×844 手机模拟框） | `src/c-end/App.tsx` |
| `/b/*` | B端 · 便民服务人员 | 移动端小程序 | `src/b-end/App.tsx` |
| `/desktop/*` | 桌面端 · 平台管理后台 | Web 后台（侧边栏 + 内容区） | `src/desktop/App.tsx` |
| `/` | LandingPage 入口选择器 | —— | `src/LandingPage.tsx` |
| `/requirement` | 需求文档展示页 | —— | `src/desktop/pages/RequirementPage` |

根入口在 `src/main.tsx`，所有端都用 `react.lazy` 拆包，按 `vendor-*` 手动分包（见 `vite.config.ts` 中的 `manualChunks`）。

## 常用命令

```bash
npm run dev          # 启动 Vite 开发服务器
npm run build        # 生产构建（dist/）
npm run preview      # 预览构建产物
npm run verify:seeds # 校验便民服务种子数据状态码覆盖（src/shared/mock/validate-seeds.ts）
npm run verify:flow  # 运行业务流测试（vitest，当前为占位，verification/tests/ 尚不存在）
npm run verify:all   # 运行全部 vitest 测试（读取 vite.config.ts）
npm run deploy       # 调用 ../scripts/deploy.sh 部署
```

路径别名：`@/*` → `src/*`（在 `tsconfig.json` 和 `vite.config.ts` 中同步配置）。

无 `vitest.config.ts` —— vitest 直接从 `vite.config.ts` 读取配置。

## 目录结构

```
src/
├── main.tsx                # 根路由 + DemoSwitcher + 缩放控件
├── LandingPage.tsx         # 三个端的入口卡片
├── DemoSwitcher.tsx        # 悬浮可拖拽的三端切换按钮（位置写 localStorage）
├── c-end/                  # C端：游客端
│   ├── App.tsx             # 登录态守卫 + MiniProgramFrame + 路由
│   ├── routes.tsx          # 路由表 + lazy 加载的页面（50+ 页面）
│   ├── pages/              # 按业务域分子目录（convenience / guide / heritage / info / routes / shop / heritate/detail 等）
│   └── data/ types/ imports/
├── b-end/                  # B端：服务人员端（当前只有 service 一种角色）
│   ├── App.tsx
│   ├── BLayout.tsx         # 5-Tab 底部导航（工作台 / 任务 / 通知 / 历史 / 我的）
│   └── roles/service/      # 子应用：workbench / tasks / notifications / history / profile
├── desktop/                # 桌面端管理后台
│   ├── App.tsx             # ProtectedRoute 权限守卫
│   ├── DesktopLayout.tsx   # 240px 侧边栏 + 顶栏 + 内容区
│   ├── nav.ts              # 侧边栏分组定义（含 permissionCode）
│   ├── pages/              # gates / heritage / photo-records / supplier-applications / common / workbench 等
│   └── components/common/  # CrudRoutes / ProtectedRoute / DataTable / PageLayout / ConfirmDialog 等
└── shared/                 # 三端共用的基础设施
    ├── stores/             # Zustand 状态库（auth / zoom / convenience-services / checkin / heritage-manage / supplier / volunteer / content-manage / homepage-config）
    ├── components/         # LoginPageC/B/Desktop + MiniProgramFrame + VideoPlayer + TrustScoreBadge
    │   └── ui/             # 基于 Radix UI 的基础组件（button / dialog / form / table / sheet / sidebar / carousel ...）
    ├── mock/               # 模拟后端：每个域一个 store + 通用 engine
    ├── types/              # 全局类型 + 状态码常量 + 用户/角色定义
    ├── permissions/        # 角色权限系统（仅两个角色：role_admin 通配符 `*`，role_supplier 有限权限）
    ├── orders/             # 便民服务状态元数据（CONVENIENCE_STATUS_META + Filter/Action helpers）
    ├── styles/             # tailwind.css / theme.css / globals.css / fonts.css
    ├── hooks/              # useLoadMore / usePagination / useSearch
    ├── constants/          # 占位图 URL 常量
    └── utils/              # geo.ts
```

## 关键架构概念

### 1. 三端共享 Auth（`src/shared/stores/auth-store.ts`）

- Zustand store 持久化到 `localStorage`（key: `lijiang-demo-auth`）
- `user.platform: Platform[]` 决定一个账号能进哪几个端
- `currentPlatform: "c" | "b" | "desktop"` 决定当前展示的端
- `switchPlatform()` 切换端但不重置登录态
- 三个 `App.tsx` 都在 `useEffect` 里检查是否需要自动 `switchPlatform`

### 2. 手机壳 `MiniProgramFrame`（`src/shared/components/MiniProgramFrame.tsx`）

- 固定 390×844 视口，居中显示，外层可缩放（`useZoomStore`）
- 顶部状态栏带"切换端"小按钮（`SwitchCamera` 图标）
- C/B 端的所有页面都被它包住，桌面端不用

### 3. DemoSwitcher（`src/DemoSwitcher.tsx`）

- 全局悬浮按钮，可拖拽，位置写 `localStorage: demo-switcher-pos`
- 点击展开三端切换菜单 + 需求文档入口
- 根路由已全局挂载；LandingPage 上自动隐藏

### 4. 模拟后端与状态机（`src/shared/mock/`）

每个域独立一个文件，导出 `useXxxStore()`：
`addresses / announcement / complaint / convenience / favorites / notifications / reviews / staff / supplier-rating / trust-score / zones / seed / seed-factory`

- 通用机制在 `engine.ts`：
  - `createMachine(config)` —— 状态机：`states[]` + `transitions[{from, to, on?}]` + `timeouts[{from, afterMs, to, on?}]`
  - 返回 `{ canTransition(from, to, action?), next(from, action?), timeoutMap, config }`
  - `subscribeDomain(key)` / `notifyDomain(key)` —— 跨域事件总线
  - `startTimeout()` / `stopTimeout()` / `clearAllTimeouts()` —— 模拟后端的定时流转（常用于 A10→A20 自动派单等）
- 状态码采用 S/A/R/C 前缀（`src/shared/types/index.ts`）：
  - **S** = 终态（S10 已下单、S40 已完成、S50 已取消、S55 完工待确认、S90 待人工处理）
  - **A** = 进行中（A10 待派单、A20 已指派、A30 已接单、A35 已核价、A38 协商中、A40 已收款、S48 服务中）
  - **R** = 异常审批（R80 取消审批中）
  - **C** = 投诉（C10 已提交、C40 已处理、CR 已驳回）
- 便民服务分两类：**点对点**（送货、行李搬运）vs **片区型**（垃圾清运、送水、布草配送），在 `types/index.ts` 中通过 `POINT_TO_POINT_TYPES` / `ZONE_BASED_TYPES` 区分
- 种子数据：`seed.ts` 中的 `seedConvenienceOrders` 必须覆盖所有状态码，由 `validate-seeds.ts` 在 `npm run verify:seeds` 时强制检查

### 5. 权限系统（`src/shared/permissions/index.ts`）

- 仅两个角色：`role_admin`（`"*"` 通配符表示超管）和 `role_supplier`（有限权限：`mall.admin.open` / `mall.supplier.view` / `dashboard.view`）
- `usePermissionStore` 提供 `hasPermission(roleId, actionCode)`
- 桌面端 `nav.ts` 每个菜单项可声明 `permissionCode`；`DesktopLayout` 过滤 `roleId === "role_admin"` 时全部可见，否则按 `code.startsWith(moduleCode + ".")` 匹配
- 路由级守卫用 `desktop/components/common/ProtectedRoute`，传 `isAllowed={isSuperAdmin}`

### 6. 路由约定

- 桌面端用嵌套路由（`<Route element={<DesktopLayout />}>` 包所有子页），新增 CRUD 页面推荐使用 `CrudRoutes` 组件：`<CrudRoutes list={<ListPage />} create={<CreatePage />} show={<DetailPage />} edit={<EditPage />} />`
- C 端 `c-end/routes.tsx` 把 50+ 路由 + `lazy()` 集中维护；`cRoutes` 数组中带 `children` 的项表示使用 `AppLayout`（底部 Tab 栏），其余独立页面
- B 端在 `roles/service/` 下还有子应用，URL 形式 `/b/service/<sub-route>`

### 7. 桌面端通用组件模式（`src/desktop/components/common/`）

- **`CrudRoutes`** —— 快速生成 index / new / :id / :id/edit 嵌套路由
- **`ProtectedRoute`** —— `isAllowed` 控制路由级访问
- **`PageLayout`** —— 带标题 + 描述的标准页面布局
- **`PageHeader`** —— 操作栏（搜索 + 新增按钮等）
- **`DataTable`** —— 基于 `@tanstack/react-table` 的通用表格
- **`ConfirmDialog`** —— 确认弹窗，内置 loading 状态
- **`FormPage`** —— 标准表单页布局

### 8. 便民服务订单状态元数据（`src/shared/orders/`）

所有端共用同一套状态定义和工具函数：

- `CONVENIENCE_STATUS_META` —— 每个状态的 label / color / bg / stepIndex / actions
- `getConvenienceActions(status)` —— 当前状态可用操作（cancel / contact / confirm_complete）
- `matchConvenienceFilter(status, filter)` —— 按 all / pending / completed / cancelled 过滤

C 端详情页用 `OrderTrackingStepper` 展示进度条，B 端用 `OrderStatusBadge` 展示标签。

## 设计系统

完整规范在 **`DESIGN.md`**（根目录），必读。重点：

- **单一品牌色**：丽江蓝 `#2563EB`（`primary`），所有主 CTA / 链接 / 选中态都用它
- **字体**：PingFang SC（中文）+ Inter（数字/英文，`-0.01em` 微调）
- **圆角语言**：卡片 16px / 按钮 12px / 输入框 12px / pill `9999px`（**全 UI 无直角**）
- **触摸目标**：主按钮 48×48（WCAG AAA），移动端可点击元素 ≥ 44px
- **阴影三层**：Level 1 卡片 `0 2px 12px rgba(0,0,0,0.04)` / Level 2 主按钮蓝色投影 / Level 3 微信绿专用
- **文字颜色**：ink `#1E293B` / body `#334155` / muted `#64748B` / muted-soft `#94A3B8`（**禁止纯黑 `#000`**）
- **移动端优先视口**：390×844
- 三个端用同一套 Tailwind CSS 变量（`src/shared/styles/theme.css`），可在任何端复用同一组件

**Tailwind CSS v4 注意**：本项目使用 Tailwind CSS v4，通过 `@tailwindcss/vite` 插件集成。**不存在 `tailwind.config.js`** —— 主题变量通过 `theme.css` 中的 `@theme` 指令或 CSS 自定义属性定义。

## 数据与图片

- 占位图大量使用 `images.unsplash.com`，搜索时按 `lijiang` / 古城 / 风景筛选
- AI 头像等本地静态资源在 `src/c-end/imports/`
- 头像等通过 `import img from "./xxx.png"` 直接打包，无需单独 public 引用

## 重要注意事项

- `package.json` 中的 `verify:flow` 引用 `verification/tests/business-flow.spec.ts`——**该目录尚未创建**。新增 vitest 业务测试时应放在该路径下。
- `npm run deploy` 调用的是**父级目录**的 `../scripts/deploy.sh`（仓库根之上），本地可能不存在。
- 修改任何 `seed.ts` 状态码覆盖后必须跑 `npm run verify:seeds`。
- 新增桌面端菜单项时，记得在 `nav.ts` 加 `permissionCode`，并确认角色权限已声明（`shared/permissions/index.ts`）。
- `useAuthStore` 持久化到 localStorage，跨端登录态会被保留；调试时清除 `lijiang-demo-auth` 即可重置。
- 模拟后端的定时流转（A10→A20 自动派单等）通过 `startTimeout()` 管理，内存中运行；刷新页面会重置所有定时器。
- CI/CD：GitHub Actions 通过 `opencode` 工作流（`.github/workflows/opencode.yml`）响应 `/oc` 或 `/opencode` 注释，使用讯飞星火 Astron Code 模型。

## 相关文档

- `DESIGN.md` —— 完整设计系统（颜色 / 字体 / 圆角 / 阴影 / 组件 token / 反模式）
- `docs/丽江古城游V2.0完整需求说明书.md` —— V2.0 完整需求
- `docs/丽江古城游新版完整需求说明书.md` —— 新版需求补充
- `docs/商城派单功能独立需求文档.md` —— 商城 + 派单独立需求
- `docs/暂缓与删除功能复现说明.md` —— 暂缓 / 删除功能说明
- `docs/superpowers/plans/` —— 阶段性计划（功能完整度、Miniprogram 差距分析）
