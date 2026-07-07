# 精选路线 — 产品需求文档

> **文档版本**：v1.0
> **更新日期**：2026-07-07
> **产品定位**：古城游览推荐攻略展示模块，内容型卡片式路线推荐
> **配套文档**：`docs/superpowers/specs/009-route.md`
> **实现状态**：根据实际代码盘点

---

## 一、产品定位与边界

### 1.1 我们在做什么

精选路线（Route）是面向 C 端游客的**古城游览推荐攻略**模块。每条路线按主题组织（如非遗之旅、美食地图等），包含多个景点/打卡点，以富媒体内容块（图文视频混排）呈现游览建议。

**核心目标：**

- ✅ 让游客快速发现、浏览古城主题游览路线
- ✅ 提供路线详情 + 交互式地图预览，辅助游客规划行程
- ✅ 首页推荐 + 全局搜索可触达，形成内容消费闭环

### 1.2 本质定位

**本质是内容消费产品，不是导航工具。** 路线不提供实时 GPS 导航、路径规划或地图步行指引。路线的"地图预览"是 H5 互动式示意，展示虚拟地标点位的先后顺序，非真实地图。

### 1.3 MVP 边界：明确不做的

- ❌ 实时 GPS 导航 / 步行路径规划
- ❌ 路线创建编辑（C端用户自主创作路线）
- ❌ 路线收藏 / 点赞 / 评论
- ❌ 路线评分体系
- ❌ 路线分享到社交平台（仅本地 Toast 复制链接模拟）
- ❌ 桌面端后台管理（路线 CRUD 无管理入口）
- ❌ B 端页面（服务人员无路线相关功能）
- ❌ 路线推荐算法（当前为静态推荐）
- ❌ 路线多人协作 / 官方发布审核流程
- ❌ 路线周期性更新 / 季节性推荐切换

---

## 二、核心用户角色

| 角色 | 端 | 核心诉求 |
|---|---|---|
| **C 端游客（tourist）** | C 端移动端 | 发现古城主题路线，了解详情，互动式预览景点顺序，规划游览行程 |
| **平台管理员（platform_admin）** | 桌面端 | 暂无管理入口，路线数据通过 API 或数据库直接操作 |

---

## 三、核心业务流程

### 3.1 路线浏览流程

```
首页推荐攻略卡片
       │
       ▼
精选路线列表页（RoutesPage）
       │
       ├── 搜索过滤（按路线名称/景点名称）
       │
       ▼
路线详情页（RouteDetailPage）
       │
       ├── 攻略视频（可选）
       ├── 基本信息（时长/距离/景点数）
       ├── 错峰建议
       ├── 路线示意图
       └── 攻略详情（富文本/图片/视频混排）
       │
       ▼
路线预览页（RoutePreviewPage）
       │
       ├── 虚拟地图 + 地标标记
       ├── 逐站浏览（上/下一站）
       ├── 进度条
       └── 导航按钮（模拟拉起第三方地图）
```

### 3.2 数据流

```
后端 SQLite (content_routes 表)
       │
       ▼
API (content/routes) via crudRoutes
       │
       ▼
前端 hydration (useApiHydrate → useContentGuideStore)
       │
       ▼
各页面消费 (RoutesPage / RouteDetailPage / RoutePreviewPage)
       │
       ▼
首页推荐 (recommendRoutes 静态数据 → HomePage)
       │
       ▼
全局搜索 (SearchResultsPage)
```

### 3.3 数据依赖关系

- Route 数据存储在 `content` feature 的 `useContentGuideStore` 中（非独立 store）
- 首页推荐攻略卡片使用 `features/route/shared/routes-data.ts` 中的静态 `recommendRoutes` 数组（与 `TravelGuide` 数据存在 routeId 关联）
- 搜索页同时搜索路线名称和副标题

---

## 四、功能模块清单

### P0 — 核心浏览（已实现）

| 功能 | 状态 | 说明 |
|---|---|---|
| 路线列表展示 | ✅ | `RoutesPage`，卡片式列表，展示封面/名称/时长/景点数/难度/途经点 |
| 路线搜索过滤 | ✅ | 按路线名称或景点名称关键词过滤，实时本地搜索 |
| 路线详情展示 | ✅ | `RouteDetailPage`，完整信息展示 |
| 路线地图预览 | ✅ | `RoutePreviewPage`，虚拟地图 + SVG 路线 + 可点击地标标记 |
| 逐站浏览 | ✅ | 上/下一站切换，进度条显示，完成游览提示 |
| 模拟导航 | ✅ | Toast 模拟拉起第三方地图导航至当前景点 |
| 延迟加载（分页） | ✅ | `useLoadMore` 每次加载 6 条，"加载更多"按钮 |
| 首页推荐入口 | ✅ | HomePage 展示 2 条推荐攻略卡片，点击跳转详情 |
| 全局搜索可达 | ✅ | SearchResultsPage 同步搜索路线数据 |

### P1 — 体验增强（已实现）

| 功能 | 状态 | 说明 |
|---|---|---|
| 攻略视频播放 | ✅ | 路线头图区域嵌入 `VideoPlayer`，支持封面/时长显示 |
| 图文视频混排内容块 | ✅ | `contentBlocks` 支持 text / image / video 三种类型混排渲染 |
| 错峰建议 | ✅ | 4 个时段拥堵等级可视化（固定静态数据） |
| 路线示意图 | ✅ | 静态示意图展示（使用固定图片资源） |
| 分享功能 | ✅ | Toast 模拟"分享链接已复制"，无真实分享逻辑 |
| 空状态处理 | ✅ | 路线不存在时显示"路线不存在"提示 |

### P2 — 管理工具（未实现）

| 功能 | 状态 | 说明 |
|---|---|---|
| 桌面端路线管理 | ❌ | 无桌面端路由、无 nav 菜单项、无 CRUD 页面 |
| B 端路线相关功能 | ❌ | 服务人员不需要路线功能 |
| 路线数据后台编辑 | ❌ | 无 UI 编辑入口，只能通过 API 或数据库直接操作 |
| 推荐路线管理 | ❌ | `recommendRoutes` 为静态硬编码，无后台管理界面 |

---

## 五、核心数据模型

### 5.1 TravelGuide（路线完整数据模型）

```typescript
interface TravelGuide {
  id: string
  name: string          // 路线名称，如"古城漫步·非遗之旅"
  tags: string[]        // 标签数组，如 ["深度游", "文化"]
  duration: string      // 游览时长，如"2-3小时"
  difficulty: string    // 难度等级，如"中等"、"轻松"
  stops: number         // 景点数量
  distance: string      // 路线长度，如"1.5km"
  spotNames: string[]   // 途经景点名称列表
  description: string   // 路线描述
  cover: string         // 封面图 URL
  spots: RouteSpot[]    // 地标点位列表（用于地图预览）
  hasVideo?: boolean    // 是否有攻略视频
  videoUrl?: string     // 视频 URL
  videoCoverUrl?: string // 视频封面
  videoDuration?: string // 视频时长
  contentBlocks?: ContentBlock[]  // 富媒体内容块（图文视频混排）
}

interface RouteSpot {
  id: string
  name: string          // 景点名称
  desc: string          // 景点描述
  top: string           // 在地图上的 Y 坐标百分比
  left: string          // 在地图上的 X 坐标百分比
}

interface ContentBlock {
  id: string
  type: "text" | "image" | "video"
  text?: string
  imageUrl?: string
  imageCaption?: string
  videoUrl?: string
  videoCoverUrl?: string
  videoDuration?: string
  videoCaption?: string
}
```

### 5.2 RecommendRoute（首页推荐卡片数据模型）

```typescript
interface RecommendRoute {
  id: number
  routeId: string        // 关联 TravelGuide.id
  name: string           // 卡片显示名称
  subtitle: string       // 副标题/途经要点
  tag: string            // 标签文字
  tagColor: string       // 标签颜色
  img: string            // 卡片封面图
}
```

### 5.3 数据库表结构（content_routes）

```sql
CREATE TABLE IF NOT EXISTS content_routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  duration TEXT,
  difficulty TEXT DEFAULT '中等',
  stops INTEGER DEFAULT 0,
  distance TEXT,
  spotNames TEXT DEFAULT '[]',
  description TEXT DEFAULT '',
  cover TEXT DEFAULT '',
  spots TEXT DEFAULT '[]',
  hasVideo INTEGER DEFAULT 0,
  videoUrl TEXT,
  videoCoverUrl TEXT,
  videoDuration TEXT,
  contentBlocks TEXT DEFAULT '[]',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 5.4 后端 API

| 方法 | 端点 | 说明 |
|---|---|---|
| GET | `/api/content/routes` | 列表查询，支持 `search`（按 name 模糊搜索）、`page`、`pageSize`、`sort` |
| GET | `/api/content/routes/:id` | 单条详情 |
| POST | `/api/content/routes` | 创建路线 |
| PATCH | `/api/content/routes/:id` | 更新路线 |
| DELETE | `/api/content/routes/:id` | 删除路线 |

### 5.5 前端 Store

- **Store**: `useContentGuideStore`（位于 `features/content/store/guide-store.ts`）
- **数据来源**: `useApiHydrate` 启动时从 API 全量加载
- **操作方法**: `addGuide`、`updateGuide`、`deleteGuide`（均通过 `syncAction` 同步到服务器）
- **注意**: 路线无独立 store，栖息在 content feature 的 guide-store 中

---

## 六、页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | RoutesPage | `/c/routes` | 路线列表页，含搜索和分页加载 |
| C | RouteDetailPage | `/c/routes/:id` | 路线详情页，含视频/信息/错峰建议/示意图/内容块 |
| C | RoutePreviewPage | `/c/routes/:id/preview` | 路线地图预览页，含虚拟地图/地标/逐站切换/导航 |
| C | HomePage | `/c/home` | 首页推荐攻略入口（2 条推荐卡片） |
| C | SearchResultsPage | `/c/search?q=xxx` | 全局搜索结果中显示匹配路线 |

---

## 七、文件清单

| 文件路径 | 说明 |
|---|---|
| `src/features/route/c-end/pages/RoutesPage.tsx` | 路线列表页 |
| `src/features/route/c-end/pages/RouteDetailPage.tsx` | 路线详情页 |
| `src/features/route/c-end/pages/RoutePreviewPage.tsx` | 路线预览页 |
| `src/features/route/shared/routes-data.ts` | 首页推荐路线静态数据（2 条） |
| `src/features/content/store/guide-store.ts` | 路线数据 store（归属于 content feature） |
| `src/shared/types/content-types.ts` | TravelGuide / RouteSpot / ContentBlock 类型定义 |
| `server/routes/content.js` | 后端 route CRUD API（第 7 行挂载） |
| `server/routes/crud.js` | 通用 CRUD 引擎 |
| `server/db/schema.sql` | content_routes 表结构（第 218 行） |
| `src/api/hydrate.ts` | 全量 hydration 加载路线数据 |
| `src/api/client.ts` | API 客户端（第 152-156 行 routes 端点） |
| `src/c-end/routes.tsx` | 路由注册（第 255-257 行） |
| `src/features/homepage/c-end/pages/HomePage.tsx` | 首页推荐攻略消费方 |
| `src/features/homepage/c-end/pages/SearchResultsPage.tsx` | 搜索页路线消费方 |
| `docs/superpowers/specs/009-route.md` | 功能规格文档 |

---

## 八、验收标准

### 8.1 C 端功能验收

| 验收项 | 状态 | 验证方式 |
|---|---|---|
| 路线列表页正常展示所有路线卡片 | ✅ | 访 `/c/routes`，确认卡片渲染完整 |
| 路线列表支持关键词搜索 | ✅ | 输入关键词，列表实时过滤 |
| 路线列表支持分页加载（每次 6 条） | ✅ | 超过 6 条路线时出现"加载更多"按钮 |
| 路线详情页跳转正常 | ✅ | 点击路线卡片跳转 `/c/routes/:id` |
| 路线详情页展示完整信息（封面、名称、时长、距离、景点数等） | ✅ | 进入详情页逐一核对 |
| 攻略视频播放（如有） | ✅ | route.hasVideo 为 true 时显示视频区域 |
| 错峰建议展示 | ✅ | 固定 4 个时段拥堵条形图 |
| 路线示意图展示 | ✅ | 固定图片 `image-9.png` |
| 图文视频混排内容块渲染 | ✅ | route.contentBlocks 非空时展示 |
| 点击"开始游览"进入预览页 | ✅ | 跳转 `/c/routes/:id/preview` |
| 预览页虚拟地图渲染 | ✅ | 背景图 + SVG 路线 + 地标标记 |
| 逐站浏览（上/下一站切换） | ✅ | 点击上下按钮切换当前景点 |
| 进度条与进度同步 | ✅ | 进度条随当前站点更新 |
| 完成游览提示 | ✅ | 最后一站点击"下一站"显示 Toast 提示 |
| 模拟导航功能 | ✅ | 点击导航按钮 Toast 提示拉起第三方地图 |
| 首页推荐路线卡片展示 | ✅ | 访 `/c/home`，确认 2 条推荐卡片渲染 |
| 首页推荐卡片点击跳转正确 | ✅ | 点击卡片跳转 `/c/routes/:routeId` |
| 全局搜索可搜索到路线 | ✅ | 访 `/c/search?q=xxx`，确认结果包含路线 |
| 路线不存在时显示空状态 | ✅ | 访问无效 ID 显示"路线不存在" |
| 分享功能 | ✅ | 点击分享按钮 Toast 提示"分享链接已复制" |

### 8.2 后端 API 验收

| 验收项 | 状态 | 验证方式 |
|---|---|---|
| GET /api/content/routes 返回列表 | ✅ | 直接请求验证 |
| POST /api/content/routes 创建路线 | ✅ | 直接请求验证 |
| PATCH /api/content/routes/:id 更新路线 | ✅ | 直接请求验证 |
| DELETE /api/content/routes/:id 删除路线 | ✅ | 直接请求验证 |
| 搜索参数 search 按 name 模糊匹配 | ✅ | 请求带 `?search=xxx` 验证 |
| 分页参数 page/pageSize 正常工作 | ✅ | 请求带分页参数验证 |

### 8.3 未实现功能（❌）

| 验收项 | 状态 | 说明 |
|---|---|---|
| 桌面端路线管理 CRUD 页面 | ❌ | 无桌面端入口、无 nav 菜单、无 UI |
| 路线推荐算法 / 个性化推荐 | ❌ | 当前为静态 `recommendRoutes` 固定 2 条 |
| 推荐路线后台编辑 | ❌ | `recommendRoutes` 为硬编码，无可视化编辑 |
| B 端路线相关功能 | ❌ | 服务人员角色无路线浏览需求 |
| 路线收藏 / 点赞 / 评论 | ❌ | 功能未实现 |
| 路线评分体系 | ❌ | 功能未实现 |
| 真实社交分享 | ❌ | 当前为 Toast 模拟 |
| 实时 GPS 导航 | ❌ | 超出路线定位范围 |
| 路线独立 store | ❌ | 数据托管在 content feature 的 guide-store 中 |
| 路线数据重复治理 | ❌ | `recommendRoutes` 在 HomePage 和 SearchResultsPage 分别引用，存在数据冗余 |

---

## 九、已知问题 / 技术债务

1. **数据冗余**：`recommendRoutes` 静态数据在 `routes-data.ts` 定义，但 `TravelGuide` 完整数据在 `useContentGuideStore` 中。两者通过 `routeId` 关联，没有统一的视图模型。
2. **无独立 store**：路线数据归属在 content feature 的 guide-store 中，命名上"guide"和"route"混用，语义不够清晰。
3. **错峰建议数据固定**：RouteDetailPage 中的拥堵时段数据为硬编码的静态数据，未接入真实人流量数据。
4. **路线示意图固定**：使用固定图片资源 `image-9.png`，未与具体路线关联。
5. **桌面端缺失**：路线数据只能通过 API 或 SQLite 直接管理，无后台管理界面，不利于运营人员维护。
