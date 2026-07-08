# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

**丽江古城游 V2.0** —— 面向丽江古城的旅游服务平台 Demo。一个 Vite + React 18 + TypeScript 单仓库应用承载了三个端，外加一个 Express + SQLite 后端：

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

### 前端

```bash
npm run dev                # 启动 Vite 开发服务器
npm run build              # 生产构建（dist/）
npm run preview            # 预览构建产物
npm run typecheck          # tsc --noEmit 类型检查
npm run lint               # eslint src
npm run lint:fix           # eslint src --fix
npm run format             # prettier --write "src/**/*.{ts,tsx,css,json}"
npm run format:check       # prettier --check ↑
npm run verify:all         # 运行全部 vitest 测试
npm run verify:flow        # 仅运行业务流测试（verification/tests/business-flow.spec.ts）
npm run verify:seeds       # 校验便民服务种子数据（npx tsx src/shared/mock/validate-seeds.ts）
npm run deploy             # 调用 ../scripts/deploy.sh 部署（本地可能不存在）
```

### 后端（Express + SQLite）

```bash
cd server
npm run dev                # node --watch index.js（端口 3001）
npm run seed               # 手动执行数据库种子
npm run start              # node index.js
```

### 项目配置

- 路径别名：`@/*` → `src/*`（`tsconfig.json` + `vite.config.ts` 同步）
- 无 `vitest.config.ts` —— vitest 直接读 `vite.config.ts`
- ESLint: `eslint.config.js` —— `typescript-eslint` + `react-hooks` + `react-refresh` + `prettier`。`no-explicit-any` / `no-unused-vars` 为 warn，`ts-ignore` 允许带描述
- 无独立 `.prettierrc` —— 格式化配置靠 `eslint-config-prettier` 关闭冲突规则
- Vite dev server 代理 `/uploads` → `http://localhost:3001`（图片上传/静态文件）

---

## 目录结构

```
src/
├── features/                ← ★ 业务功能垂直切片（21 个）
│   ├── address/             地址管理
│   ├── ai-knowledge/        AI 知识库
│   ├── announcement/        公告通知
│   ├── booking/             院落预约
│   ├── checkin/             签到打卡 + 纳西人打卡
│   ├── complaints/          投诉管理
│   ├── content/             内容管理（商户/院落/POI/资讯/公房/路线）
│   ├── convenience/         便民服务（完整垂直切片，含三端页面 + 11 个 store 模块）
│   ├── favorite/            收藏
│   ├── flow-warning/        人流量预警
│   ├── heritage/            文化遗产知识
│   ├── homepage/            首页配置（Banner/宫格）
│   ├── housing/             公房信息
│   ├── info/                古城资讯
│   ├── merchant-review/     商家审核
│   ├── notification/        通知
│   ├── points/              积分
│   ├── profile/             个人中心
│   ├── route/               精选路线
│   ├── supplier/            供应商
│   ├── trust-score/         诚信分
│   └── volunteer/           志愿服务
│
├── platform/               ← ★ 平台基础设施
│   ├── auth/                （useAuthStore）
│   ├── notification/        （useNotificationStore）
│   └── ui/                  （shadcn 组件入口）
│
├── shared/                 ← ★ 纯工具 + 全局类型
│   ├── types/               （全局类型 User / Platform / 状态码，种子用户数据）
│   ├── permissions/         （角色权限：role_admin / role_supplier）
│   ├── components/
│   │   ├── ui/              （shadcn/Radix UI 基础组件）
│   │   └── mobile/          （移动端通用组件：ContactSheet / EmptyState / PageHeader / Skeleton 等）
│   ├── hooks/               （useAsyncData / useLoadMore / usePagination / useSearch）
│   ├── styles/              （tailwind.css / theme.css / globals.css）
│   ├── constants/           （URL 常量等）
│   └── mock/                （validate-seeds.ts 等 mock 工具）
│
├── c-end/                  ← 路由入口（App.tsx + routes.tsx，无业务代码）
├── b-end/                  ← 路由入口（App.tsx + BLayout.tsx）
├── desktop/                ← 路由入口（App.tsx + DesktopLayout + nav.ts）
│   └── components/common/  （CrudRoutes / ProtectedRoute / PageLayout...）
├── LandingPage.tsx
└── DemoSwitcher.tsx
```

### Feature 内部约定

每个 feature 遵循一致结构（以 convenience 为例）：

```
features/convenience/
├── c-end/pages/      ← C端页面
├── b-end/pages/      ← B端页面（如有）
├── b-end/components/ ← B端共享组件（如有）
├── desktop/pages/    ← 桌面端页面（如有）
├── store/            ← zustand store + 子模块
│   ├── index.ts       （barrel 导出）
│   └── *.ts           （按职责拆分）
└── shared/           ← 跨端类型/常量
```

### 依赖纪律

- Feature 可 import **platform/** 和 **shared/** ✅
- Feature 之间不能互相 import ❌（真需要共享 → 抽到 platform/）
- platform/ 不能 import features/ ❌

---

## 关键架构概念

### 1. 三端共享 Auth（`src/platform/auth/store.ts` / `src/platform/auth/`）

- Zustand store 持久化到 `localStorage`（key: `lijiang-demo-auth`）
- `user.roles: UnifiedRole[]` —— **角色是叠加的**，同一用户可以是 `["tourist", "supplier"]`
- `user.platform: Platform[]` —— 决定一个账号能进哪几个端
- `currentPlatform: "c" | "b" | "desktop"` —— 当前展示的端
- `switchPlatform()` 切换端不重置登录态
- 三个 `App.tsx` 在 `useEffect` 里检查是否需要自动 `switchPlatform`
- `Platform` 层还有其他共享 store：`notification` 通知、`ui` 组件入口

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

### 5. 便民服务状态机（`features/convenience/store/`）

所有端通过同一个 store 共享状态。状态机、派单引擎、定时器分别独立为 `transitions.ts`、`dispatch.ts`、`timers.ts`。

- **状态码**：S/A/C 前缀，定义在 `src/shared/types/index.ts`
  - S = 终态：S10 / S40 / S50 / S55 / S90
  - A = 进行中：A10 / A20 / A30 / A35 / A40 / S48
  - C = 投诉：C10 / C40 / CR
- **取消申请**：`cancelRequested` 布尔标记（无独立状态码）
- **服务分类**：点对点（送货/行李搬运 — 按距离派单）vs 片区型（垃圾/送水/布草 — 按 zone 过滤）
- **派单引擎**：`dispatch.ts`，Haversine 距离 + zone 匹配
- **种子数据**：`seed.ts`，每状态 1 条

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

## 后端服务（Express + SQLite）

项目在 `server/` 下有一个独立的 Express 后端，与前端 Vite 开发服务器并列运行。

### 启动方式

```bash
cd server
npm run dev    # node --watch index.js，端口 3001
```

### 架构

```
server/
├── index.js              ← 入口，挂载所有路由 + 中间件
├── db/
│   ├── connection.js      better-sqlite3 连接
│   ├── schema.sql         30+ 张表的 DDL
│   └── seed.js            种子数据（自调用，首次启动自动填充）
├── routes/
│   ├── crud.js            通用 CRUD 路由生成器（自动生成 GET/POST/PATCH/DELETE，支持分页/排序/筛选）
│   ├── auth.js            JWT 登录（手机号匹配 seed-users，无密码）
│   ├── orders.js          便民订单（含 transition + dispatch）
│   ├── staff.js           服务人员管理
│   ├── reviews.js         评价
│   ├── complaints.js      投诉
│   ├── content.js         内容管理（6 个子资源）
│   ├── homepage.js        Banner + 宫格（含排序）
│   ├── bookings.js        院落预约
│   ├── trust-scores.js    诚信分
│   └── uploads.js         文件上传（multer）
├── logic/
│   ├── transitions.js     订单状态机：action → { from, to, validations }
│   ├── dispatch.js        派单引擎：Haversine 距离 + zone 匹配
│   ├── scheduler.js       定时器：自动派单/超时流转
│   └── pricing.js         定价逻辑
└── middleware/
    ├── auth.js            JWT 验证中间件
    ├── response.js        ok() / fail() 响应包装器
    └── upload.js          上传配置
```

### API 规范

- 统一前缀：`/api/v1/`
- 响应格式：`{ ok: true, data: {...} }` 或 `{ ok: false, msg: "..." }`
- 列表接口：`?page=1&pageSize=20&sort=-createdAt`（`-` 前缀表示倒序）
- 通用 CRUD 路由生成器处理 20+ 个资源，支持 filters / searchField / pkField 参数
- 完整 API 契约见 `docs/api-contract.md`

### 数据库

- SQLite（better-sqlite3），文件在 `server/db/data.db`
- 30+ 张表，约定所有表含 `id TEXT PK`、`createdAt`、`updatedAt`
- JSON 字段存为 TEXT，应用层序列化/反序列化
- `server/db/data.db` 在 `.gitignore` 中

### 数据库迁移（`server/db/migrations/`）

- 迁移由 `server/db/migrate.js` 管理，通过 `schema_migrations` 表追踪已执行的文件
- 迁移文件命名约定：`<序号>_<描述>.sql`，例如 `000_baseline.sql`
- migrate 与 schema.sql / seed.js 的关系：启动时先 apply 未执行迁移，再执行 seed（幂等插入）
- 新增表或改表结构应创建新的迁移文件，不要修改已执行过的迁移

### 文件上传

- 通过 multer 保存到 `server/uploads/`
- Vite dev server 的 `/uploads` 代理到 `http://localhost:3001`

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

- 验证测试文件位于 `verification/tests/business-flow.spec.ts`（已创建），新增 vitest 测试放在该路径下。
- `npm run deploy` 调用父级目录的 `../scripts/deploy.sh`，本地可能不存在。
- 便民服务定时流转（A10→A20 自动派单等）由服务端 `server/logic/scheduler.js` 处理。前端 `features/convenience/store/timers.ts` 中的定时器用于模拟/离线场景。
- `useAuthStore` 持久化到 localStorage（key: `lijiang-demo-auth`），调试时清除即可重置。
- 便民服务种子数据在 `features/convenience/store/seed.ts`（前端）和 `server/db/seed.js`（后端），每个状态码 1 条。修改后建议验证各状态展示正常。
- 新增桌面端菜单时同步更新 `desktop/nav.ts` 和 `desktop/App.tsx`。
- 新增功能遵循 feature-first 模式：在 `features/` 下新建目录，不要在 `c-end/pages/` 直接加页面。
- CI/CD：GitHub Actions（`.github/workflows/opencode.yml`）响应 `/oc` / `/opencode` 注释。

---

## 测试

- 测试框架：**vitest**（配置继承 `vite.config.ts`，无独立 `vitest.config.ts`）
- 测试文件位置：`verification/tests/business-flow.spec.ts`（业务流测试）；API 集成测试位于对应的 feature 目录下或 `verification/`
- 运行全部测试：`npm run verify:all`
- 仅运行业务流测试：`npm run verify:flow`
- API 集成测试（需要后端运行）：`npm run verify:api`（如存在）
- **测试模式**：store 测试直接测试 zustand store 的 action/state；API 测试通过 fetch 调用真实 Express 后端
- mock 工具：`makeMockOrder()` 等辅助函数定义在测试文件顶部

---

## 相关文档

- `DESIGN.md` —— 设计系统完整规范
- `docs/api-contract.md` —— 后端 API 契约
- `docs/notes/` —— 业务逻辑说明（便民服务流程等）
- `docs/requirements/` —— 需求文档
- `docs/specs/` —— 规格说明
- `docs/superpowers/specs/` —— 设计方案文档
- `docs/superpowers/plans/` —— 实施计划