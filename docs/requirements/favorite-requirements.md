# 收藏功能 — 产品需求文档

> **文档版本**：v1.0
> **更新日期**：2026-07-07
> **产品定位**：C 端轻量收藏夹，用户可收藏商户、线路、资讯等内容并在统一列表中集中查看
> **配套文档**：无

---

## 一、产品定位与边界

### 1.1 我们在做什么

我们做的是 **收藏功能**——允许 C 端游客用户在浏览古城信息时，将感兴趣的商户、游览线路、资讯文章等标记为"收藏"，并在独立的收藏页面内集中查看和管理。

**核心目标：**

- ✅ 为用户提供"先收藏，稍后看"的轻量能力
- ✅ 让用户在一个页面集中浏览已收藏的所有内容
- ✅ 通过类型 Tab 切换快速筛选（全部/商家/线路/文章）

### 1.2 MVP 原则：什么必须做，什么可以等

| 优先级 | 原则 | 说明 |
|--------|------|------|
| 🔴 必须 | 收藏列表查看 | 用户能打开收藏页看到所有已收藏内容 |
| 🔴 必须 | 添加收藏 | 用户能通过 API 添加收藏（Store 层已实现 add） |
| 🔴 必须 | 取消收藏 | 用户能在收藏页删除收藏项 |
| 🔴 必须 | 按类型筛选 | 全部/商家/线路/文章四类 Tab 切换 |
| 🟡 可以简化 | 批量操作 | 无需多选/批量删除 |
| 🟡 可以简化 | 排序 | 默认按收藏时间倒序即可，无需自定义排序 |
| 🟢 以后做 | 收藏夹分组 | 平铺展示，无文件夹/标签分组 |
| 🟢 以后做 | 桌面端管理 | 无后台收藏管理页面 |

### 1.3 明确不做的（MVP 边界）

以下功能 **1.0 不做**，避免范围蔓延：

- ❌ 收藏夹/文件夹分组
- ❌ 标签系统
- ❌ 桌面端收藏管理页面
- ❌ 批量操作（多选删除、排序）
- ❌ 收藏导出/分享
- ❌ 收藏智能推荐
- ❌ 收藏数量上限限制
- ❌ 收藏内容变更通知（如收藏的商户信息更新时推送）
- ❌ 收藏内容的过期/失效判定

---

## 二、核心用户角色

### 2.1 用户角色

| 角色 | 端 | 核心诉求 |
|------|----|----------|
| **C 端游客** | C 端（手机模拟框 390×844） | 浏览商户/线路/文章时随手收藏；在"我的"页进入收藏列表集中查看；从收藏项直接跳转到详情页 |
| B 端服务人员 | — | 无收藏需求，不接入 |
| 平台管理员 | — | 无后台管理页面 |

### 2.2 补充说明

- 收藏功能仅限 **C 端游客** 使用，B 端和桌面端无任何收藏相关页面或管理入口。
- 收藏基于用户维度隔离（userId），不同用户之间不可见。
- 收藏操作全部通过后端 API 执行，Store 侧统一使用 syncAction 包装（后端成功后更新本地状态，禁止乐观更新）。

---

## 三、核心业务流程

### 3.1 添加收藏（后端已支持，前端未接入）

```
用户浏览商户详情页/线路详情页/资讯文章页
    ↓
用户点击收藏按钮
    ↓
请求 POST /api/v1/favorites
    ↓
后端创建收藏记录
    ↓
Store 将新记录追加到前端列表
    ↓
收藏图标切换为已收藏状态（由 isFavorited 方法判定）
```

> **当前实现状态**：useFavoriteStore.add() 和 toggle() 方法已实现，isFavorited() 方法也已实现，但**没有任何前端页面（商户详情、线路详情、资讯详情页）注册了收藏按钮或调用这些方法**。当前仅 API 层与 Store 层链路完整，UI 层缺入口。

### 3.2 查看收藏

```
用户在"个人中心"（ProfilePage）点击"我的收藏"
    ↓
跳转 /c/favorites
    ↓
应用初始化时 hydrate 已加载全量收藏数据到 Store
    ↓
按类型 Tab（全部/商家/线路/文章）筛选展示
    ↓
每个收藏项展示：
  - 缩略图（ImageWithFallback）
  - 名称（line-clamp-1）
  - 类型标签（商家/线路/文章）
  - 价格（如有）
    ↓
点击收藏项 → 跳转至对应详情页
  - merchant → /c/merchant/:itemId
  - route → /c/routes/:itemId
  - article → /c/info/:itemId
```

### 3.3 取消收藏

```
用户在我的收藏页点击 Trash2 删除按钮
    ↓
调 useFavoriteStore.remove(id)
    ↓
DELETE /api/v1/favorites/:id
    ↓
本地移除该项
    ↓
Toast 提示"已取消收藏"
```

### 3.4 加载更多

```
收藏列表默认展示 6 条
    ↓
用户点击"加载更多"按钮
    ↓
每次增加 6 条（useLoadMore hook，步长 6）
    ↓
无更多数据时隐藏按钮
```

---

## 四、功能模块清单

### 4.1 P0 必须有（当前已实现）

#### C 端 - 收藏列表页（/c/favorites）

| 功能 | 状态 | 说明 |
|------|------|------|
| 收藏列表展示 | ✅ 已实现 | 展示缩略图、名称、类型标签、价格；数据来源于 hydrate 全量加载 |
| 类型 Tab 切换 | ✅ 已实现 | 全部 / 商家 / 线路 / 文章 四个 Tab 筛选 |
| 点击跳转详情 | ✅ 已实现 | 按类型分别跳转商户/线路/资讯详情页 |
| 取消收藏 | ✅ 已实现 | 点击 Trash2 图标删除，Toast 确认 |
| 加载更多 | ✅ 已实现 | useLoadMore 每页 6 条，点击"加载更多" |
| 空状态展示 | ✅ 已实现 | 无收藏时显示 EmptyState 组件，文案"暂无收藏" |

#### Store 层

| 功能 | 状态 | 说明 |
|------|------|------|
| add | ✅ 已实现 | 调用 favoritesApi.create，syncAction 包装 |
| remove | ✅ 已实现 | 调用 favoritesApi.remove，syncAction 包装 |
| isFavorited | ✅ 已实现 | 根据 userId + type + itemId 判定是否已收藏 |
| toggle | ✅ 已实现 | 已收藏则 remove，未收藏则 add |
| getByUser | ✅ 已实现 | 按 userId 过滤收藏列表 |

#### 后端 API

| 端点 | 状态 | 说明 |
|------|------|------|
| GET /api/v1/favorites | ✅ 已实现 | 通用 CRUD 列表，支持 userId 和 targetType 两个过滤维度 |
| POST /api/v1/favorites | ✅ 已实现 | 通用 CRUD 创建 |
| DELETE /api/v1/favorites/:id | ✅ 已实现 | 通用 CRUD 删除 |

#### 入口导航

| 位置 | 状态 | 说明 |
|------|------|------|
| 个人中心"我的收藏" | ✅ 已实现 | ProfilePage 功能卡片区，Heart 图标 + 文案"我的收藏"，跳转 /c/favorites |

### 4.2 P1 建议有（提升体验）

| 功能 | 状态 | 说明 |
|------|------|------|
| 商户/线路/文章详情页收藏按钮 | ❌ 未实现 | isFavorited 和 toggle 方法已就绪但无任何 UI 入口调用 |
| 收藏状态同步 | ❌ 未实现 | 从详情页收藏后返回列表，收藏状态应实时刷新，当前需通过 hydrate 全量刷新 |
| 收藏总数角标 | ❌ 未实现 | 个人中心"我的收藏"入口处未显示当前收藏数量 |
| 收藏列表自定义排序 | ❌ 未实现 | 仅默认按收藏时间倒序 |
| 收藏成功/取消动画反馈 | ❌ 未实现 | 当前仅 Toast 文字提示 |

### 4.3 P2 以后做（远期规划）

- 收藏夹/文件夹分层管理
- 标签/备注自定义
- 桌面端后台收藏管理页面
- 收藏内容智能推荐
- 收藏到期提醒/内容变更推送
- 批量操作（多选、排序、导出）
- 收藏分享给好友

---

## 五、核心数据模型

### 5.1 前端类型定义（FavoriteItem）

文件：`src/shared/types/index.ts`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 收藏记录 ID（后端生成） |
| userId | string | 所属用户 ID |
| type | "merchant" \| "route" \| "article" | 收藏内容类型 |
| itemId | number | 被收藏内容的业务 ID |
| name | string | 被收藏内容的名称 |
| img | string | 缩略图 URL |
| price? | number | 参考价格（可选，如商户客单价） |
| shop? | string | 关联商户名（可选） |
| savedAt | string | 收藏时间（ISO 字符串） |

### 5.2 后端数据库表结构

文件：`server/db/schema.sql`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | 收藏记录 ID |
| userId | TEXT NOT NULL | 所属用户 ID |
| targetType | TEXT NOT NULL | 收藏内容类型（如 merchant/courtyard） |
| targetId | TEXT NOT NULL | 被收藏内容的业务 ID |
| title | TEXT | 被收藏内容标题 |
| imageUrl | TEXT | 缩略图 URL |
| createdAt | TEXT DEFAULT (datetime('now')) | 收藏时间 |

索引：`CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(userId)`

### 5.3 字段映射说明

前端 FavoriteItem 类型与后端 favorites 表存在**字段名差异**，当前代码未做显式映射：

| 前端字段 | 后端字段 | 映射状态 |
|----------|----------|----------|
| id | id | ✅ 一致 |
| userId | userId | ✅ 一致 |
| type | targetType | ⚠️ 名称不同，需映射 |
| itemId | targetId | ⚠️ 名称与类型不同（number vs TEXT） |
| name | title | ⚠️ 名称不同 |
| img | imageUrl | ⚠️ 名称不同 |
| savedAt | createdAt | ⚠️ 名称不同 |
| price | — | ❌ 表无此字段 |
| shop | — | ❌ 表无此字段 |

### 5.4 种子数据

```
{ id: "fav_1", userId: "u_c_001", targetType: "merchant", targetId: "1", title: "纳西人家餐厅" }
{ id: "fav_2", userId: "u_c_001", targetType: "courtyard", targetId: "1", title: "木府" }
```

> 注意：种子数据中存在 targetType: "courtyard" 类型，而前端 FavoriteItem.type 仅定义 "merchant" | "route" | "article"，两者不完全兼容。

---

## 六、技术实现要点

### 6.1 数据流架构

```
后端 SQLite (favorites 表)
    ↕ REST API (通用 CRUD 路由)
前端 favoritesApi (api/client.ts)
    ↕ syncAction (写操作必须后端成功后再更新本地状态)
useFavoriteStore (zustand)
    ↕ hydrate (应用启动时 api.list 全量填充)
FavoritesPage (UI 消费)
```

### 6.2 同步策略

- **写操作**：syncAction 模式，先调 API，成功后用返回值更新本地 state，禁止乐观更新。
- **读操作**：应用启动时通过 useApiHydrate 全量加载到 Store（api.list("favorites", { pageSize: 200 })），后续不再增量拉取。
- **删除**：支持通过 DELETE /api/v1/favorites/:id 单条删除。

### 6.3 路由

- /c/favorites → FavoritesPage（C 端，嵌套在 AppLayout 外，惰性加载）
- 入口：src/c-end/routes.tsx 第 278 行
- 导航入口：ProfilePage → Heart 图标 → navigate("/c/favorites")

### 6.4 筛选机制

- 前端按 FavoriteItem.type 字段做本地筛选（非服务端分页过滤）
- 后端列表 API 支持 targetType 过滤（CRUD 路由通用过滤），未在前端使用

### 6.5 加载更多

- 使用 useLoadMore hook，步长 6 条
- 每次点击"加载更多"增加 6 条的显示上限
- 全部展示后按钮隐藏

---

## 七、验收标准

### 7.1 功能验收

- [x] C 端用户能从个人中心进入"我的收藏"页面
- [x] 收藏列表展示缩略图、名称、类型标签、价格
- [x] Tab 切换（全部/商家/线路/文章）正确筛选列表项
- [x] 点击收藏项跳转至正确的详情页
- [x] 点击删除按钮移除收藏，Toast 提示"已取消收藏"
- [x] 无收藏时显示空状态页面（"暂无收藏"，"去首页发现感兴趣的内容吧"）
- [x] 收藏列表支持"加载更多"（每页 6 条）
- [x] Store 层支持 add / remove / isFavorited / toggle / getByUser 完整方法
- [ ] **商户/线路/文章详情页收藏按钮不存在** ❌ 前端页面未注册收藏入口，仅 Store 层完成
- [ ] **前端 FavoriteItem 类型与后端字段名（type vs targetType、itemId vs targetId 等）未做兼容映射** ❌ 数据绑定有差异
- [ ] **种子数据含 targetType: "courtyard" 但前端类型定义无此值** ❌ 类型兼容不全

### 7.2 端覆盖验收

| 端 | 页面 | 状态 |
|----|------|------|
| C 端游客 | FavoritesPage (收藏列表) | ✅ 完整实现 |
| C 端游客 | 商户/线路/资讯详情页收藏按钮 | ❌ 未实现 |
| B 端 | 无 | ✅ 不涉及 |
| 桌面端后台 | 无 | ✅ 不涉及 |

### 7.3 异常场景验收

- [x] 网络请求失败时 syncAction 捕获错误并 Toast 提示"操作失败"，本地状态不更新
- [x] 后端不可用时 hydrate 清空收藏列表（useFavoriteStore.setState({ favorites: [] })）
- [ ] 同一内容被重复收藏的处理：后端未做唯一约束，toggle 方法仅前端防重 ❌
- [ ] 收藏不存在的 itemId：后端无校验，会创建记录但跳转后页面可能 404 ❌

### 7.4 非功能验收

- [x] 收藏数据通过 hydrate 全量加载，刷新页面不丢失（前提是后端服务正常）
- [ ] 收藏操作写入操作日志（后端通用 CRUD 未单独记录收藏操作日志） ❌
- [ ] 分页/无限滚动支持：已实现"加载更多" ✅

---

## 八、文件索引

| 文件 | 说明 |
|------|------|
| src/features/favorite/c-end/pages/FavoritesPage.tsx | C 端收藏列表页面（117 行），含 Tab 筛选、列表渲染、删除、跳转 |
| src/features/favorite/store/favorite-store.ts | Zustand Store，含 add / remove / isFavorited / toggle / getByUser |
| src/features/favorite/store/index.ts | barrel export |
| src/shared/types/index.ts (line 333) | FavoriteItem 类型定义 |
| src/api/client.ts (line 226) | favoritesApi (list / create / remove) |
| src/api/hydrate.ts (lines 56, 91, 126) | 启动时全量加载/清空收藏数据 |
| src/api/sync.ts | syncAction 同步包装器 |
| src/c-end/routes.tsx (lines 148, 278) | 惰性路由注册 { path: "favorites" } |
| src/features/profile/c-end/pages/ProfilePage.tsx (line 146) | 个人中心"我的收藏"入口 |
| server/db/schema.sql (line 384) | favorites 表 DDL |
| server/db/seed.js (line 291) | 收藏种子数据（2 条） |
| server/index.js (line 79) | 收藏 CRUD 路由挂载 /api/v1/favorites |
| server/routes/crud.js | 通用 CRUD 路由实现 |
| docs/superpowers/specs/014-favorite.md | 原始需求规格说明 |
