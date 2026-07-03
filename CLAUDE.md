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

根入口 `src/main.tsx`，所有端用 `react.lazy` 拆包 + `vite.config.ts` 中 `manualChunks` 手动分包。

**架构模式**：Feature-First Architecture。业务功能按垂直切片收拢在 `features/` 目录下。平台基础设施（auth、UI 组件）在 `platform/`。纯工具在 `shared/`。三个端目录（`c-end/` / `b-end/` / `desktop/`）只保留路由外壳。

---

## 常用命令

```bash
npm run dev                # 启动 Vite 开发服务器
npm run build              # 生产构建（dist/）
npm run preview            # 预览构建产物
npm run verify:seeds       # 校验便民服务种子数据状态码覆盖（无实际 seed 文件时会跳过）
npm run verify:all         # 运行全部 vitest 测试
npm run deploy             # 调用 ../scripts/deploy.sh 部署（本地可能不存在）
```

路径别名：`@/*` → `src/*`（`tsconfig.json` + `vite.config.ts` 同步）。
无 `vitest.config.ts` —— vitest 直接读 `vite.config.ts`。

---

## 目录结构

```
src/
├── features/                ← ★ 业务功能垂直切片
│   └── convenience/         ← 便民服务（样板房，已完整搬迁）
│       ├── c-end/pages/      ← C端页面
│       ├── b-end/pages/      ← B端页面
│       ├── b-end/components/ ← B端共享组件
│       ├── desktop/pages/    ← 桌面端页面
│       ├── store/            ← 状态管理（store + 过渡表 + 派单 + 定时器 + 种子）
│       │   ├── store.ts       （瘦 zustand store，委托给子模块）
│       │   ├── transitions.ts （状态机过渡表）
│       │   ├── dispatch.ts    （派单引擎 + 距离计算）
│       │   ├── timers.ts      （定时器管理）
│       │   ├── seed.ts        （种子数据）
│       │   ├── notification.ts（通知推送封装）
│       │   ├── staff-store.ts （服务人员数据）
│       │   ├── zone-store.ts  （片区配置）
│       │   ├── settlement-store.ts（结算管理）
│       │   └── services-store.ts（服务配置）
│       └── shared/           （跨端共享的类型、元数据、状态映射）
│
├── platform/               ← ★ 平台基础设施
│   ├── auth/                （re-export useAuthStore）
│   ├── notification/        （re-export useNotificationStore）
│   └── ui/                  （re-export shadcn 组件）
│
├── shared/                 ← ★ 纯工具 + 未搬迁的 service
│   ├── components/
│   │   └── ui/              （shadcn/Radix UI 基础组件）
│   ├── services/            （21 个 store，待逐功能搬迁到 features/）
│   ├── types/               （全局类型 User / Platform / 状态码）
│   ├── permissions/         （角色权限：role_admin / role_supplier）
│   ├── hooks/               （useLoadMore / usePagination / useSearch）
│   ├── styles/              （tailwind.css / theme.css / globals.css）
│   └── constants/           （URL 常量等）
│
├── c-end/                  ← 路由入口（App.tsx + routes.tsx，无业务代码）
├── b-end/                  ← 路由入口（App.tsx + BLayout.tsx）
├── desktop/                ← 路由入口（App.tsx + DesktopLayout + nav.ts）
│   └── components/common/  （CrudRoutes / ProtectedRoute / DataTable / PageLayout...）
├── LandingPage.tsx
└── DemoSwitcher.tsx
```

### 搬迁状态

目前已搬迁便民服务（`features/convenience/`）。其余 21 个服务 store 仍在 `shared/services/` 中（volunteer / complaint / checkin / heritage / ai-chat / housing / content 等），可按同样模式逐步逐功能搬迁到 `features/<name>/`。规则：

- **Feature** 可 import **platform/** 和 **shared/** ✅
- **Feature 之间不能互相 import** ❌（真需要共享 → 抽到 platform/）
- **platform/ 不能 import features/** ❌

---

## 关键架构概念

### 1. 三端共享 Auth（`src/shared/stores/auth-store.ts` / `src/platform/auth/`）

- Zustand store 持久化到 `localStorage`（key: `lijiang-demo-auth`）
- `user.roles: UnifiedRole[]` —— **角色是叠加的**，同一用户可以是 `["tourist", "supplier"]`
- `user.platform: Platform[]` —— 决定一个账号能进哪几个端
- `currentPlatform: "c" | "b" | "desktop"` —— 当前展示的端
- `switchPlatform()` 切换端不重置登录态
- 三个 `App.tsx` 在 `useEffect` 里检查是否需要自动 `switchPlatform`

### 2. 用户账号（`src/shared/types/seed-users.ts`）

| 姓名 | 手机号 | 角色 | 可进端 | 说明 |
|------|--------|------|--------|------|
| 张小游 | 13800001001 | `tourist` | C | 纯游客 |
| 张老板 | 13800001002 | `tourist+supplier` | C/B/Desktop | **叠加角色**，客栈老板 |
| 李师傅 | 13900002004 | `service` | B | 便民服务人员 |
| 管理员 | 18800003001 | `platform_admin` | B/Desktop | 平台管理 |

登录页输入手机号即可（无密码校验，纯 Demo）。

### 3. 手机壳 `MiniProgramFrame`（`src/shared/components/MiniProgramFrame.tsx`）

- 固定 390×844 视口，居中显示，外层可缩放（`useZoomStore`）
- 顶部状态栏带"切换端"小按钮
- C/B 端所有页面被它包住，桌面端不用

### 4. DemoSwitcher（`src/DemoSwitcher.tsx`）

- 全局悬浮可拖拽按钮，位置写 `localStorage: demo-switcher-pos`
- 点击展开三端切换菜单 + 需求文档入口
- 根路由已全局挂载；LandingPage 上自动隐藏

### 5. 便民服务状态机

所有端通过 `features/convenience/store/store.ts` 共享同一份状态。

状态码采用 S/A/C 前缀（`src/shared/types/index.ts`）：
- **S** = 终态：S10（已下单）、S40（已完成）、S50（已取消）、S55（完工待确认）、S90（待人工处理）
- **A** = 进行中：A10（待派单）、A20（已指派）、A30（已接单）、A35（已核价）、A40（已收款）、S48（服务中）
- **C** = 投诉：C10（已提交）、C40（已处理）、CR（已驳回）

取消申请采用 `cancelRequested` 布尔标记（原 R80 独立状态码已移除）。价格协商走线下电话沟通（原 A38 独立状态码已移除）。

服务分两类：
- **点对点**: 送货服务、行李搬运（按距离派单）
- **片区型**: 垃圾清运、送水、布草配送（按 zoneIds 严格匹配派单）

派单引擎在 `features/convenience/store/dispatch.ts`，使用 Haversine 距离排序 + zone 过滤。

### 6. 权限系统（`src/shared/permissions/index.ts`）

- 仅两个角色：`role_admin`（`"*"` 通配符超管）和 `role_supplier`
- 桌面端 `nav.ts` 菜单项可声明 `permissionCode`；`DesktopLayout` 过滤
- 路由级守卫用 `desktop/components/common/ProtectedRoute`

### 7. 路由约定

- 桌面端用嵌套路由（`<Route element={<DesktopLayout />}>`），CRUD 推荐用 `CrudRoutes` 组件
- C 端 `c-end/routes.tsx` 集中维护 50+ 路由；`cRoutes` 中带 `children` 表示用 `AppLayout`（底部 Tab 栏）
- B 端通过 BLayout 底部 5-Tab 导航（工作台 / 任务 / 通知 / 历史 / 我的）

### 8. 桌面端通用组件（`src/desktop/components/common/`）

- **`CrudRoutes`** —— 快速生成 index / new / :id / :id/edit 嵌套路由
- **`ProtectedRoute`** —— `isAllowed` 控制路由级访问
- **`PageLayout`** —— 带标题 + 描述的标准页面布局
- **`DataTable`** —— 基于 `@tanstack/react-table`
- **`ConfirmDialog`** —— 确认弹窗，内置 loading

---

## 设计系统

完整规范在 **`DESIGN.md`**。要点：

- **品牌色**：丽江蓝 `#2563EB`（`primary`），全部主 CTA 用它
- **字体**：PingFang SC（中文）+ Inter（数字）
- **圆角语言**：全 UI 无直角（卡片 16px / 按钮 12px / pill 9999px）
- **文字颜色**：ink `#1E293B` / body `#334155` / muted `#64748B` / muted-soft `#94A3B8`（禁止纯黑）
- **移动端优先视口**：390×844
- **Tailwind CSS v4**：无 `tailwind.config.js`，变量在 `src/shared/styles/theme.css` 的 `@theme` 指令或 CSS 自定义属性定义

`theme.css` 中存在两套颜色体系不冲突但数值不同：
1. shadcn/ui 系统变量（`--background` / `--primary`）—— 灰蓝系
2. App 语义变量（`--text-heading` / `--text-body` 等）—— 中性灰，业务页面优先使用

---

## 数据与图片

- 占位图大量使用 `images.unsplash.com`，搜索时按 `lijiang` / 古城 / 风景筛选
- 静态资源在 `src/c-end/assets/`
- 头像等通过 `import img from "./xxx.png"` 直接打包

---

## 重要注意事项

- `package.json` 中 `verify:flow` 引用的 `verification/tests/business-flow.spec.ts` **尚未创建**。新增 vitest 测试应放在该路径下。
- `npm run deploy` 调用父级目录的 `../scripts/deploy.sh`，本地可能不存在。
- 模拟后端定时流转（A10→A20 自动派单等）在内存中运行；刷新页面会重置所有定时器。定时器管理在 `features/convenience/store/timers.ts`。
- `useAuthStore` 持久化到 localStorage（key: `lijiang-demo-auth`），调试时清除即可重置。
- 便民服务种子数据在 `features/convenience/store/seed.ts`，每个状态码 1 条。修改后建议验证各状态展示正常。
- 新增桌面端菜单时同步更新 `desktop/nav.ts` 和 `desktop/App.tsx`。
- 新增功能遵循 feature-first 模式：在 `features/` 下新建目录，不要在 `c-end/pages/` 直接加页面。
- CI/CD：GitHub Actions（`.github/workflows/opencode.yml`）响应 `/oc` / `/opencode` 注释。

---

## 相关文档

- `DESIGN.md` —— 设计系统
- `docs/notes/` —— 业务逻辑说明（便民服务流程等）
- `docs/superpowers/specs/` —— 设计方案文档
- `docs/superpowers/plans/` —— 实施计划
