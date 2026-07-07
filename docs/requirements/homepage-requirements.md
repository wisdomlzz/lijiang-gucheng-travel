# 首页配置模块 产品需求文档

**版本**：v1.0
**日期**：2026-07-07
**状态**：MVP 已实现

---

## 1. 产品定位与边界

### 1.1 产品定位

首页配置模块是「丽江古城游」C 端游客小程序的首屏展示与功能导航中枢。它承载三大职责：

1. **品牌展示与内容触达**：通过 Banner 轮播、景区资讯两条路径将平台运营内容（活动、公告、服务）高效触达游客。
2. **功能入口导航**：通过宫格菜单矩阵（4列×自适应分页）提供古城各子功能的快捷入口，包括文旅探索、便捷服务、公众参与三大类。
3. **全局搜索入口**：支持游客按关键词搜索商家、路线、资讯三类内容。

### 1.2 边界

| 包含 | 不包含 |
|------|--------|
| Banner 轮播图管理（C 端展示 + 桌面端后台 CRUD） | 个人化推荐算法 |
| 宫格菜单管理（C 端展示 + 桌面端后台 CRUD + 排序/显隐） | AB 测试能力 |
| 推荐攻略区块展示（静态数据） | 用户行为埋点分析（框架代码不含） |
| 景区资讯列表（集成 announce 模块） | 运营后台数据分析 |
| 全局搜索（商家/路线/资讯） | 搜索历史与热搜词 |
| 游客导航页（全功能列表聚合） | |

---

## 2. 核心用户角色

| 角色 | 端 | 典型行为 |
|------|----|----------|
| 游客（tourist） | C 端 | 浏览 Banner、使用宫格菜单进入各功能、搜索内容、查看景区资讯 |
| 平台管理员（platform_admin） | 桌面端 | 管理 Banner 与宫格菜单、调整排序、控制显隐 |

（便民服务人员、供应商等角色无首页配置管理权限）

---

## 3. 核心业务流程

### 3.1 数据加载流程

```
应用启动 → useApiHydrate() 并行请求全量数据
          → GET /api/banners?pageSize=200
          → GET /api/grid-items?pageSize=200
          → banners 进入 useHomepageConfigStore.state.banners
          → gridItems 进入 useHomepageConfigStore.state.gridItems
          → HomePage 渲染读取 store
```

所有数据采用全量加载（应用启动时一次性拉取），后续操作通过 syncAction 模式（服务端权威）进行单条更新。

### 3.2 Banner 管理流程

```
桌面端：
  新增：点击「新增 Banner」→ 填写标题/图片/副标题/徽章/跳转链接 → 保存 → POST /api/banners → store 更新
  编辑：点击编辑 → 修改字段 → 保存 → PATCH /api/banners/:id → store 更新
  排序：点击上移/下移 → POST /api/banners/reorder → store 更新
  显隐：点击显隐按钮 → PATCH /api/banners/:id { visible: 0/1 } → store 更新
  删除：点击删除 → 确认弹窗 → DELETE /api/banners/:id → store 更新

C 端展示：
  - 按 order 升序排列，仅展示 visible=true 的 Banner
  - 自动轮播（每 3.5s 切换）
  - 点击跳转 link 路由
  - 徽章标签颜色：NEW → 绿色(#10B981)、热门→ 红色(#EF4444)、其他 → 蓝色(#3B82F6)
```

### 3.3 宫格菜单管理流程

```
桌面端：
  编辑：点击编辑（笔图标）→ 修改名称/图片 → 保存 → PATCH /api/grid-items/:id → store 更新
  排序：点击上移/下移 → POST /api/grid-items/reorder → store 更新
  显隐：点击显隐按钮 → PATCH /api/grid-items/:id { visible: 0/1 } → store 更新

C 端展示：
  - 按 order 升序排列，仅展示 visible=true 的宫格
  - 自动分页：每页 8 个，支持触屏左右滑动切换（阈值 40px）
  - 路由特殊处理：route="crmeb" → 打开外部 CRMEB 商城；route 以 ".html" 结尾 → window.open 打开
```

### 3.4 搜索流程

```
C 端首页输入关键词 → 回车 → GET /c/search?q=xxx（前端路由跳转）
                              → 在当前内存数据中 filter：
                                - 商家：匹配 name 或 description
                                - 路线：匹配 name 或 subtitle
                                - 资讯：匹配 title 或 content
                              → 按分类展示搜索结果（无结果时显示 EmptyState）

（注：搜索完全在客户端内存中进行，未调后端 API）
```

---

## 4. 功能模块清单

### P0 —— MVP 必备

| 模块 | 功能 | 端 | 状态 |
|------|------|----|------|
| Banner 轮播 | C 端首页 Banner 自动轮播展示（含徽章标签、标题叠加、指示器分页） | C | ✅ |
| Banner 管理 | 桌面端 Banner CRUD（新增/编辑/删除/排序/显隐） | Desktop | ✅ |
| 宫格菜单导航 | C 端首页 4 列宫格矩阵（自动分页 8 个/页、左右滑动翻页） | C | ✅ |
| 宫格菜单管理 | 桌面端宫格编辑（名称/图片/排序/显隐） | Desktop | ✅ |
| 全局搜索 | C 端首页搜索框 + 搜索结果页（商家/路线/资讯三类） | C | ✅ |
| 景区资讯列表 | C 端首页资讯区块，集成 Announcement 模块已发布内容（无限滚动加载） | C | ✅ |
| 数据初始化 | 应用启动时全量加载 Banner + Grid Items 到 Zustand Store | App 启动 | ✅ |
| 推荐攻略 | C 端首页展示 2 条推荐游览路线 | C | ✅ |
| 游客导航页 | C 端全功能聚合导航页（文旅探索/便捷服务/公众参与三类） | C | ✅ |

### P1 —— 迭代优化

| 模块 | 功能 | 端 | 状态 |
|------|------|----|----------|
| Banner 外部链接 | 支持 Banner 跳转到外部 URL | C | ✅（link 字段支持路由和外部链接） |
| Shop Scene Banner | 为商家端 banner 场景预留字段 scene="shop" | Desktop | ✅（已定义，C 端未使用） |
| 宫格搜索参数 | 宫格路由支持附带 search 参数（如 /c/map?from=home） | C | ✅ |
| 宫格创建 | 通过 API 创建新宫格项目 | - | ❌（前端无新增宫格按钮，仅可编辑/排序已有项目） |

### P2 —— 增强

| 模块 | 功能 | 端 | 状态 |
|------|------|----|------|
| Banner shop 场景管理 | 商家端独立 Banner 管理 | Desktop | ❌（字段和路由已支持，桌面端管理页只显示 home scene） |
| 宫格内容重置 | 一键恢复宫格为默认配置 | Desktop | ✅（resetGridToDefault 已定义，但仅清空，未集成 UI 触发） |
| 搜索热词 | 搜索框下方展示热门搜索词 | C | ❌ |
| Banner 数量限制 | 限制最多 5 个 Banner | Desktop | ✅ |
| 扫码功能 | 搜索栏旁扫码按钮实际可用 | C | ❌（仅 UI 占位，无扫码逻辑） |

---

## 5. 核心数据模型

### 5.1 BannerConfig

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | string | 是 | 自动生成 | 主键 |
| scene | "home" \| "shop" | 是 | "home" | 使用场景，home=游客端首页，shop=商户端 |
| imageUrl | string | 是 | "" | 图片 URL（支持 base64 上传） |
| title | string | 否 | "" | 标题 |
| subtitle | string | 否 | "" | 副标题 |
| badge | string | 否 | "" | 徽章标签文字（如"热门"、"NEW"） |
| link | string | 否 | "" | 点击跳转路由或 URL |
| order | number | 否 | 0 | 排序序号，升序排列 |
| visible | boolean | 否 | true | 是否显示 |

**数据库表**：`banners`

```sql
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  imageUrl TEXT NOT NULL,
  title TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  link TEXT DEFAULT '',
  scene TEXT DEFAULT 'home',
  enabled INTEGER DEFAULT 1,
  visible INTEGER DEFAULT 1,
  "order" INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**种子数据**：2 条（id: bh1, bh2）

### 5.2 GridItemConfig

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | string | 是 | 自动生成 | 主键 |
| imageUrl | string | 否 | "" | 宫格图标 URL |
| label | string | 是 | - | 宫格名称（最长 8 字） |
| route | string | 否 | "" | 点击跳转路由 |
| search | string | 否 | "" | 附加 URL 查询参数 |
| page | 1 \| 2 | 否 | 0 | 所在页（前端自动分页后不再依赖此字段） |
| visible | boolean | 否 | true | 是否显示 |
| order | number | 否 | 0 | 排序序号，升序排列 |

**数据库表**：`grid_items`

```sql
CREATE TABLE IF NOT EXISTS grid_items (
  id TEXT PRIMARY KEY,
  imageUrl TEXT DEFAULT '',
  label TEXT NOT NULL,
  route TEXT DEFAULT '',
  search TEXT DEFAULT '',
  page INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  "order" INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**种子数据**：17 条，分布在 page 1（8 条）和 page 2（9 条）

### 5.3 关联数据模型

首页引用了以下模块的数据模型：

- **Announcement**（景区资讯）：详见 announcement 模块，类型包括 id / title / content / images / type / publishTime / status
- **RecommendRoute**（推荐攻略）：静态数据 `src/features/route/shared/routes-data.ts`，类型包含 id / routeId / name / subtitle / tag / tagColor / img
- **Merchant**（商家搜索）：详见 content 模块的 merchant-store

---

## 6. API 接口清单

### 6.1 Banners

| 方法 | 路径 | 说明 | 过滤参数 |
|------|------|------|----------|
| GET | /api/banners | 列表查询 | scene, sort, page, pageSize |
| GET | /api/banners/:id | 详情 | - |
| POST | /api/banners | 新增 | - |
| PATCH | /api/banners/:id | 更新 | - |
| DELETE | /api/banners/:id | 删除 | - |
| POST | /api/banners/reorder | 排序（传入 ids 数组） | - |

### 6.2 Grid Items

| 方法 | 路径 | 说明 | 过滤参数 |
|------|------|------|----------|
| GET | /api/grid-items | 列表查询 | visible, sort, page, pageSize |
| GET | /api/grid-items/:id | 详情 | - |
| POST | /api/grid-items | 新增 | - |
| PATCH | /api/grid-items/:id | 更新 | - |
| DELETE | /api/grid-items/:id | 删除 | - |
| POST | /api/grid-items/reorder | 排序（传入 ids 数组） | - |

### 6.3 C 端前端路由

| 路径 | 页面 | 说明 |
|------|------|------|
| /c/home | HomePage | 首页主页面 |
| /c/search | SearchResultsPage | 搜索结果页（query: q） |
| /c/services | VisitorServicesPage | 游客导航页 |

---

## 7. 页面与组件清单

### 7.1 C 端页面

| 路径文件 | 功能 | 关键 UI |
|----------|------|---------|
| `src/features/homepage/c-end/pages/HomePage.tsx` | 首页 | 渐变 Hero + Banner 轮播 + 浮动搜索 + 分页宫格 + 推荐攻略 + 景区资讯 |
| `src/features/homepage/c-end/pages/SearchResultsPage.tsx` | 搜索结果 | 搜索框 + 商家/路线/资讯三类结果分组 + 空状态 |
| `src/features/homepage/c-end/pages/VisitorServicesPage.tsx` | 游客导航 | Tab导航 + 三个分类白卡宫格（文旅/服务/参与） |

### 7.2 桌面端页面

| 路径文件 | 功能 | 关键 UI |
|----------|------|---------|
| `src/desktop/pages/gates/BannerManagePage.tsx` | Banner 管理 | 表格列表 + 编辑弹窗（最多 5 个） |
| `src/desktop/pages/gates/GridSettingsPage.tsx` | 宫格管理 | 分页表格 + 编辑弹窗 + 排序/显隐 |

### 7.3 共享组件

| 组件 | 功能 |
|------|------|
| `SectionHeader` | 区块标题（图标+标题+查看更多链接） |
| `InfoListItem` | 资讯列表条目（图片+标题+内容摘要+日期） |
| `GridIcon` | 宫格图标（圆角+渐变色背景容器） |
| `ImageWithFallback` | 图片组件（含 fallback） |
| `PageHeader` | 页面头部（含返回按钮） |
| `TabPageHeader` | 标签页头部 |
| `EmptyState` | 空状态展示 |

---

## 8. 验收标准

### 8.1 C 端首页展示

| # | 验收条件 | 状态 |
|---|----------|------|
| 1.1 | 首页顶部显示渐变蓝色背景 + "丽江古城游" 标题 | ✅ |
| 1.2 | Banner 可见时自动轮播，每 3.5s 切换，鼠标悬浮暂停 | ✅ |
| 1.3 | Banner 底部有点指示器，点击可跳转到指定页 | ✅ |
| 1.4 | Banner 有徽章标签时按规则着色（NEW=绿/热门=红/其他=蓝） | ✅ |
| 1.5 | 点击 Banner 跳转到其 link 配置的路由 | ✅ |
| 1.6 | 搜索框可输入关键词，回车跳转搜索结果页 | ✅ |
| 1.7 | 宫格菜单按 4 列 × 8 个/页 自动分页 | ✅ |
| 1.8 | 宫格页面支持触屏左右滑动切换（阈值 40px） | ✅ |
| 1.9 | 宫格支持通过 `crmeb` 路由跳转外部商城 | ✅ |
| 1.10 | 推荐攻略展示 2 条静态路线（含图片/标签/名称/简介） | ✅ |
| 1.11 | 景区资讯区块展示已发布公告，无限滚动加载（每次 5 条） | ✅ |
| 1.12 | 已加载全部时显示 "— 已加载全部 —" 提示 | ✅ |
| 1.13 | 无 Banner 时仍正常显示（跳过轮播区域） | ✅ |
| 1.14 | 无公告时显示空状态 | ✅ |

### 8.2 搜索结果

| # | 验收条件 | 状态 |
|---|----------|------|
| 2.1 | 搜索结果按商家/路线/资讯三类分组展示 | ✅ |
| 2.2 | 搜索范围覆盖：商家 name/description、路线 name/subtitle、资讯 title/content | ✅ |
| 2.3 | 无结果时显示 "未找到「xxx」相关结果" 空状态 | ✅ |
| 2.4 | 点击商家项跳转商家详情页 | ✅ |

### 8.3 桌面端 Banner 管理

| # | 验收条件 | 状态 |
|---|----------|------|
| 3.1 | 表格展示所有 home scene Banner（预览图/标题/副标题/徽章/链接/状态/排序/操作） | ✅ |
| 3.2 | 支持新增 Banner（最多 5 个），超出时 toast 提示 | ✅ |
| 3.3 | 支持编辑 Banner 标题/副标题/徽章/链接/图片/显示状态 | ✅ |
| 3.4 | 支持图片上传（JPG/PNG/WebP，最大 2MB，建议 16:7 比例） | ✅ |
| 3.5 | 支持单个 Banner 显隐切换 | ✅ |
| 3.6 | 支持排序（上移/下移） | ✅ |
| 3.7 | 支持删除（确认弹窗二次确认） | ✅ |
| 3.8 | 显示当前 Banner 数量（如 "3/5 个 Banner"） | ✅ |

### 8.4 桌面端宫格管理

| # | 验收条件 | 状态 |
|---|----------|------|
| 4.1 | 表格按 order 排序展示所有宫格，自动分页显示（第 1 页 / 第 2 页） | ✅ |
| 4.2 | 支持宫格名称编辑（最长 8 字符） | ✅ |
| 4.3 | 支持宫格图片上传（PNG/WebP，最大 500KB，建议 120×120px） | ✅ |
| 4.4 | 路由不可修改（显示为只读） | ✅ |
| 4.5 | 支持上下移调整全局排序 | ✅ |
| 4.6 | 支持显隐切换 | ✅ |
| 4.7 | 显示统计信息：总数 / 显示数 / 隐藏数 / 各页显示数 | ✅ |

### 8.5 游客导航页

| # | 验收条件 | 状态 |
|---|----------|------|
| 5.1 | 展示三个分类区域：文旅探索（8 个）/ 便捷服务（4 个）/ 公众参与（5 个） | ✅ |
| 5.2 | 每个宫格点击可跳转到对应功能 | ✅ |
| 5.3 | "门票预订/讲解服务/官方商城" 跳转外部 CRMEB 商城 | ✅ |

### 8.6 未实现

| # | 功能 | 状态 |
|---|------|------|
| 6.1 | 桌面端宫格新增（目前仅可编辑已有宫格，无 UI 新增按钮） | ❌ |
| 6.2 | 桌面端 shop scene Banner 管理（字段已预留，管理页只展示 home scene） | ❌ |
| 6.3 | 搜索热词/搜索历史 | ❌ |
| 6.4 | 宫格图标在线管理（通过 API 新增/删除，而非仅编辑） | ❌ |
| 6.5 | 扫码功能（仅 UI 占位按钮） | ❌ |
| 6.6 | 首页数据实时同步（启动时一次性全量加载，非 WebSocket 实时推送） | ❌ |

---

## 9. 目录结构

```
src/features/homepage/
├── c-end/pages/
│   ├── HomePage.tsx              # 首页
│   ├── SearchResultsPage.tsx     # 搜索结果页
│   └── VisitorServicesPage.tsx   # 游客导航页
└── store/
    ├── index.ts                  # barrel 导出（含类型重导出）
    └── homepage-store.ts         # Zustand store（gridItems + banners 操作）

src/desktop/pages/gates/
├── BannerManagePage.tsx          # Banner 管理（桌面端）
└── GridSettingsPage.tsx          # 宫格管理（桌面端）

server/routes/homepage.js         # 服务端路由（Banner + GridItems CRUD + reorder）

server/db/schema.sql              # 数据库建表（banners + grid_items）
server/db/seed.js                 # 种子数据（2 banners + 17 grid items）

src/api/
├── client.ts                     # bannersApi / gridApi 定义
├── hydrate.ts                    # 全量数据加载（line 88 初始化 store）
└── sync.ts                       # syncAction 服务端权威更新模式

src/shared/
├── types/index.ts                # BannerConfig / GridItemConfig 类型定义
├── components/mobile/GridIcon.tsx # 宫格图标组件
├── components/mobile/SectionHeader.tsx  # 区块标题组件
├── components/mobile/InfoListItem.tsx   # 资讯条目组件
└── constants/index.ts            # CRMEB 外部链接常量
```