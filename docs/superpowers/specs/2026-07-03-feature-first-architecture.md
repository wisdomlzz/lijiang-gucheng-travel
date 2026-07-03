# 项目结构重构：Feature-First Architecture

**日期**：2026-07-03
**状态**：设计完成 / 待实施

---

## 1. 动机

当前代码按技术层平铺（`c-end/pages/`, `b-end/roles/`, `desktop/pages/`, `shared/services/`），一个功能（如便民服务）的代码散落在 5 个目录、15+ 个文件中。改一个功能需要 mental map 整个拓扑，严重降低维护效率。

**目标**：改一个功能 = 进一个目录，所有相关文件都在里面。

---

## 2. 目录结构

```
src/
├── features/              ← 业务功能（常改，自包含）
│   ├── convenience/       ← 便民服务（样板房）
│   ├── volunteer/         ← 志愿服务
│   ├── complaints/        ← 投诉系统
│   ├── checkin/           ← 签到打卡（纳西/文化院落）
│   ├── heritage/          ← 文化遗产（古树/古桥/古建筑等）
│   ├── ai-chat/           ← AI 智能问答
│   ├── housing/           ← 公房服务
│   └── content/           ← 内容管理（商户/院落/POI）
│
├── platform/              ← 平台能力（稳定，被业务依赖）
│   ├── auth/              ← useAuthStore
│   ├── notification/      ← useNotificationStore
│   └── ui/                ← shadcn/Radix UI 组件
│
├── shared/                ← 纯工具（不改，无业务含义）
│   ├── types/             ← 全局类型（User, Platform...）
│   ├── hooks/             ← 通用 hook（usePagination, useSearch）
│   ├── utils/             ← 纯函数（geo.ts 等）
│   ├── constants/         ← 配置常量
│   └── styles/            ← CSS 变量 + Tailwind
│
├── c-end/                 ← 路由入口（App.tsx + routes.tsx）
├── b-end/                 ← 路由入口
├── desktop/               ← 路由入口 + DesktopLayout + nav
├── LandingPage.tsx
└── main.tsx
```

---

## 3. 每个 Feature 的内部结构

```
features/convenience/
├── c-end/pages/           ← C端页面（ServicesPage, ServiceTrackingPage）
├── b-end/pages/           ← B端页面（ServiceTasks, ServiceWorkbench, ServiceOrderDetail...）
├── desktop/pages/         ← 桌面端页面（ConveniencePage, PriceArbitrationPage...）
├── store/                 ← 状态管理（store.ts, transitions, dispatch, seed, timers）
│   ├── index.ts
│   ├── store.ts
│   ├── transitions.ts
│   ├── dispatch.ts
│   ├── timers.ts
│   ├── seed.ts
│   ├── notification.ts
│   └── staff.ts           ← staff store（仅便民用）
│   └── settlement.ts      ← settlement store（仅便民用）
│   └── zone.ts            ← zone store（仅便民用）
└── index.ts               ← 唯一对外暴露入口（路由配置）
```

---

## 4. 依赖纪律（严格执行）

```
features/  →  import from platform/  ✅
features/  →  import from shared/    ✅
features/  →  import from other features/  ❌（绝不！）

platform/  →  import from shared/    ✅
platform/  →  import from features/  ❌（绝不！）

shared/    →  import nothing from features/ or platform/  ✅（最底层）
```

**跨 feature 共享**：如果两个 feature 都需要同一段代码 → 抽到 `platform/` 或 `shared/`。

---

## 5. 搬迁顺序

| 顺序 | Feature | 文件数 | 理由 |
|------|---------|--------|------|
| ① | **convenience** | ~20 | 最熟悉，已模块化，做样板房 |
| ② | **volunteer** | ~4 | 最大单一模块（1156 行桌面页） |
| ③ | **complaints** | ~3 | store + 页面，独立性强 |
| ④ | **checkin** | ~2 | 简单 |
| ⑤ | **heritage** | ~10 | 散落较多子页面 |
| ⑥ | **ai-chat** | ~2 | 一个大文件 + store |
| ⑦ | **housing / content** | ~5 | 最后搬 |

**核心策略**：逐功能搬迁，每搬完一个 build 通过，再搬下一个。

---

## 6. 搬迁方法

1. 新建 `features/<name>/` 目录结构
2. 复制（不是剪切）文件过去
3. 更新所有 import 路径为新位置
4. 删除原文件
5. `npm run build` 通过 → 确认
6. 进入下一个 feature

**不变的内容**：路由配置、组件逻辑、API 签名——只动路径，不改功能。

---

## 7. 风险

| 风险 | 缓解 |
|------|------|
| 搬迁期间 build 中断 | 逐文件搬，每步 build 验证 |
| import 漏改 | `grep` 旧路径检查 + build 会报错 |
| git 历史丢失 | `git mv` 保留历史（搬迁用 mv，不写新文件） |