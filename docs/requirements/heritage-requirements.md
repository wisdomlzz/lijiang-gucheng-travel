# 遗产知识 — 产品设计文档

> **文档版本**：v2.0
> **更新日期**：2026-07-07
> **产品定位**：面向丽江古城游客的文化遗产百科式展示模块
> **配套文档**：功能规格说明书 `docs/superpowers/specs/010-heritage.md`

---

## 一、产品定位与边界

### 1.1 我们在做什么

我们做的是 **遗产知识模块** —— 面向丽江古城游客的文化遗产百科式展示功能。游客可在 C 端小程序中按分类浏览丽江古城的文化遗产条目（道路、水系、古桥、井/泉、古树名木、保护民居、历史建筑、人文环境），查看图文详情、位置地图、导航跳转和图纸资料。

**核心目标：**

- ✅ 为 C 端游客提供按分类浏览古城文化遗产的入口
- ✅ 展示丰富详实的图文介绍和位置信息，提升游览体验
- ✅ 通过"离我最近"功能帮助游客发现周边遗产点
- ✅ 作为一个纯前端硬编码的 Demo 验证信息展示型模块的可行性

### 1.2 范围原则

| 优先级 | 原则 | 说明 |
|--------|------|------|
| 🔴 必须 | **分类浏览必须完整** | 8 类遗产（道路/水系/古桥/井泉/古树/保护民居/历史建筑/人文环境）全覆盖 |
| 🔴 必须 | **详情页必须可用** | 图文详情、位置地图、导航跳转、图纸资料展示 |
| 🔴 必须 | **数据模型必须稳定** | HeritageItem 类型设计正确，统一接口兼容各类遗产 |
| 🟡 可以简化 | 全部数据硬编码 | 无后端数据库，数据在 `shared/data/` 静态定义 |
| 🟡 可以简化 | 地图用静态嵌入 | 使用高德地图静态图 + iframe 嵌入，无交互式地图 |
| 🟢 以后做 | 桌面端遗产数据管理 | 当前无管理后台，遗产数据增删改查不可编辑 |

### 1.3 明确不做的（当前范围边界）

- ❌ 桌面端遗产数据管理（遗产信息编辑/新增/删除无后台入口）
- ❌ 后端数据库存储（所有数据硬编码在 `shared/data/`）
- ❌ 交互式地图（仅嵌入静态图 + 图片占位遮罩，无可拖拽/缩放交互）
- ❌ 实景 AR 或增强现实叠加
- ❌ 语音讲解 / 多语言导览
- ❌ 用户评价 / 打卡签到 / 收藏（收藏功能由 `favorite` feature 独立提供）
- ❌ 遗产游览路线规划
- ❌ 多媒体视频展示
- ❌ 遗产数据统计（如浏览量、热度排序）
- ❌ 遗产保护动态 / 修缮记录

---

## 二、核心用户角色

### 2.1 单一角色

| 角色 | 端 | 核心诉求 |
|------|----|----------|
| **C 端游客** | 移动端小程序（C 端） | 快速了解古城文化遗产的种类、位置、历史背景，发现附近遗产点 |

### 2.2 角色权限说明

| 角色 | 身份 | 可访问功能 |
|------|------|-----------|
| 游客（`tourist`） | 任何登录 C 端的用户 | C 端遗产列表页 `/c/heritage` + 8 类详情页 |
| 游客 + 供应商（`tourist+supplier`） | 张老板等叠加角色 | C 端遗产列表页 `/c/heritage` + 8 类详情页 |

> **注意：** 遗产知识仅 C 端游客可见，B 端便民服务人员端和桌面端管理后台均无遗产模块入口。

### 2.3 访问入口

| 角色 | 端 | 路由 | 组件 | 页面名称 |
|------|----|------|------|----------|
| C 端游客 | C 端小程序 | `/c/heritage` | `HeritagePage` | 遗产知识列表 |
| C 端游客 | C 端小程序 | `/c/heritage/road/:id` | `RoadDetail` | 道路详情 |
| C 端游客 | C 端小程序 | `/c/heritage/water/:id` | `WaterDetail` | 水系详情 |
| C 端游客 | C 端小程序 | `/c/heritage/well/:id` | `WellDetail` | 井/泉详情 |
| C 端游客 | C 端小程序 | `/c/heritage/bridge/:id` | `BridgeDetail` | 古桥详情 |
| C 端游客 | C 端小程序 | `/c/heritage/ancient-tree/:id` | `AncientTreeDetail` | 古树详情 |
| C 端游客 | C 端小程序 | `/c/heritage/protected-house/:id` | `ProtectedHouseDetail` | 保护民居详情 |
| C 端游客 | C 端小程序 | `/c/heritage/historic-building/:id` | `HistoricBuildingDetail` | 历史建筑详情 |
| C 端游客 | C 端小程序 | `/c/heritage/human-environment/:id` | `HumanEnvironmentDetail` | 人文环境详情 |

---

## 三、核心业务流程

### 3.1 遗产浏览主流程

```
游客打开 C 端小程序
    ↓
进入"遗产知识"入口（导航 / 首页推荐）
    ↓
加载 HeritagePage 列表页
    ├── 默认 Tab"全部" — 所有类型遗产混合展示
    ├── 切换到类型 Tab（道路 / 水系 / 井泉 / 古桥 / 古树 / 保护民居 / 历史建筑 / 人文环境）
    │   └── 按类型筛选列表
    ├── 切换到"离我最近" — 请求浏览器定位，按距离排序
    │   └── 定位失败 → 显示黄色提示条"请开启定位权限"
    │   └── 定位成功 → 每个卡片显示距离标签 + 列表按距离升序
    └── 搜索框输入关键词 → 实时过滤（匹配 name 和 description）
    ↓
列表每页 10 条（useLoadMore 分页加载）
    ↓
点击任意卡片 → 跳转相应详情页 `/c/heritage/:type/:id`
    ↓
详情页展示：
    ├── 沉浸式图片轮播（支持触控滑动切换）
    ├── 标题 + 标签（区域/类型/子类型/保护状态）
    ├── 基本信息摘要
    ├── 类型专属字段（如古树：科名/属名/拉丁名/树龄/树高/胸围）
    ├── 位置地图 + 导航跳转（高德地图 URI Scheme）
    ├── 图纸资料列表（文件路径显示）
    └── 文字介绍（完整描述文本，支持换行）
    ↓
点击图片 → 全屏查看器（支持触控 + 按钮切换）
点击导航 → 跳转高德地图 App 导航
```

### 3.2 "离我最近"定位流程

```
游客切换到"离我最近"Tab
    ↓
触发 navigator.geolocation.getCurrentPosition()
    ├── 成功 → 记录用户位置 (lat, lng)
    │   ├── 对所有遗产点计算 Haversine 距离（米）
    │   ├── 按距离升序排列
    │   └── 卡片右上角显示距离标签
    │
    └── 失败 → 设置 locationError = true
        └── 顶部显示黄色提示条"无法获取您的位置，请开启定位权限"
            └── 点击 × 关闭提示条
```

### 3.3 搜索流程

```
游客在搜索框输入文字
    ↓
onChange 实时更新 keyword 状态
    ↓
getData() 函数对当前筛选数据做二次过滤
    ├── name.toLowerCase().includes(keyword)
    └── description.toLowerCase().includes(keyword)
    ↓
列表实时更新，无搜索按钮 / 无防抖
    ↓
清空搜索框 → 恢复完整列表
```

---

## 四、功能模块清单

### 4.1 P0 必须有（缺一不可）

#### C 端遗产列表页

| 功能 | 说明 | 状态 |
|------|------|------|
| 全部 Tab | 所有 8 类遗产混合展示 | ✅ 已实现 |
| 类型 Tab | 道路/水系/井泉/古桥/古树/保护民居/历史建筑/人文环境，各 Tab 独立筛选 | ✅ 已实现 |
| 离我最近 Tab | 请求浏览器定位，计算 Haversine 距离，按远近距离排序，显示距离标签 | ✅ 已实现 |
| 位置授权失败提示 | 顶部黄色提示条，可关闭 | ✅ 已实现 |
| 关键词搜索 | 实时匹配遗产名称和描述，过滤列表 | ✅ 已实现 |
| 列表卡片展示 | 封面图（16:9 带渐变遮罩）、名称、区域·类型标签、描述摘要、保护状态 | ✅ 已实现 |
| 分页加载 | useLoadMore 每页 10 条，底部"加载更多"按钮 | ✅ 已实现 |
| 点击卡片跳转 | 点击卡片 → 路由跳转 `/c/heritage/:type/:id` | ✅ 已实现 |
| 空状态 | 无匹配结果时显示空状态提示 | ✅ 已实现 |

#### C 端遗产详情页

| 功能 | 说明 | 状态 |
|------|------|------|
| 沉浸式图片轮播 | 4:3 全宽封面图，支持触控滑动切换，带渐变叠加 | ✅ 已实现 |
| 全屏图片查看器 | 全屏黑色背景，触控/按钮切换页码，底部页码指示器 | ✅ 已实现 |
| 分享按钮（UI） | 轮播右上角分享图标（仅 UI，无实际分享功能） | ✅ 已实现 |
| 浮动返回按钮 | 图片区域左上角半透明返回按钮 | ✅ 已实现 |
| 标题 + 标签 | 名称、区域/类型/子类型/保护状态标签（各色圆角 pill） | ✅ 已实现 |
| 基本信息摘要 | basicInfo 字段展示 | ✅ 已实现 |
| 类型专属字段 | 按类型动态渲染 8 类特殊字段（见数据模型章节） | ✅ 已实现 |
| 位置地图 | HeritageMap 组件嵌入高德地图静态图 + iframe | ✅ 已实现 |
| 导航跳转 | "导航"链接，打开高德地图 URI `uri.amap.com/marker` | ✅ 已实现 |
| 地址展示 | 卡片中显示地址 + 地图下方地址文本 | ✅ 已实现 |
| 坐标展示 | 地图下方显示 `lat, lng` 精确坐标 | ✅ 已实现 |
| 图纸资料 | 文件列表（文件路径截取文件名），蓝色文件标签样式 | ✅ 已实现 |
| 文字介绍 | 完整描述文本，`whitespace-pre-wrap` 保留换行格式 | ✅ 已实现 |
| 8 类独立详情页 | RoadDetail / WaterDetail / WellDetail / BridgeDetail / AncientTreeDetail / ProtectedHouseDetail / HistoricBuildingDetail / HumanEnvironmentDetail | ✅ 已实现 |
| 详情页空状态 | 遗产记录不存在时显示"遗产记录不存在"+ 返回按钮 | ✅ 已实现 |

#### 系统能力

| 功能 | 说明 | 状态 |
|------|------|------|
| Haversine 距离计算 | 前端 `getDistance()` 函数，计算结果精确到米 | ✅ 已实现 |
| 距离格式化 | < 1km 显示"X米"，>= 1km 显示"X.X公里" | ✅ 已实现 |
| 搜索统一接口 | `searchHeritage()` 按关键词和类型过滤 | ✅ 已实现 |
| 路由懒加载 | 9 个页面（1 列表 + 8 详情）全部通过 `React.lazy()` 懒加载 | ✅ 已实现 |
| 路由注册 | `src/c-end/routes.tsx` 配置完整 | ✅ 已实现 |

### 4.2 P1 建议有（提升体验）

| 功能 | 说明 | 状态 |
|------|------|------|
| 类型元数据统一管理 | `heritageTypeMeta` 对象集中管理类型标签和图标 | ✅ 已实现 |
| 灵活字段定义 | `heritageExtraFields` 集中定义每种类型的专属字段标签 | ✅ 已实现 |
| 统一详情布局 | `HeritageDetailLayout` 组件复用布局，类型细节通过 `fields` 插槽定制 | ✅ 已实现 |
| 定位精度优化 | `enableHighAccuracy: true, timeout: 10000` | ✅ 已实现 |
| 图片懒加载 | `ImageWithFallback` 组件承载图片加载 | ✅ 已实现 |

### 4.3 P2 以后做（远期规划）

- 桌面端遗产数据管理后台（新增/编辑/删除/维护遗产条目）
- 后端数据库（从硬编码迁移到 Server API + SQLite）
- 交互式地图（可拖拽缩放的完整 GIS 地图）
- 遗产游览路线推荐
- 遗产打卡 / 签到功能
- 语音讲解导览
- 多语言支持（英文/日文/韩文）
- 遗产保护动态 / 修缮记录查阅
- 多媒体视频展示
- 用户评论 / 互动
- 遗产数据统计（热门浏览、访问量）

---

## 五、核心数据模型

### 5.1 遗产条目统一模型（HeritageItem）

所有 8 类遗产共用同一接口 `HeritageItem`，通过 `type` 字段区分：

```typescript
interface HeritageItem {
  // ── 固定字段（全部类型通用）──
  id: string
  type: HeritageType            // "road" | "water" | "well" | "bridge" | "ancient-tree" | "protected-house" | "historic-building" | "human-environment"
  name: string                  // 遗产名称
  area: Area                    // 所属片区：大研 | 白沙 | 束河 | 大研古城 | 大研古城（含黑龙潭）
  location: { lat: number; lng: number }  // GPS 坐标
  description: string           // 完整文字介绍（支持换行）
  photos: string[]              // 图片 URL 数组（unsplash 占位图）
  address?: string              // 详细地址
  preservationStatus?: string   // 保护状况（优/良/三级/二级/后备资源）
  basicInfo?: string            // 简短基本信息摘要
  drawings?: string[]           // 图纸文件路径列表
  heritageSubType?: string      // 子类型（如"文保单位"/"代表性民居"/"宗教建筑"）

  // ── 灵活字段（类型特有）──
  extra?: Record<string, string | string[] | boolean>
}
```

### 5.2 遗产类型元数据

| 类型 | 中文标签 | 图标 | 种子数据量 |
|------|----------|------|-----------|
| road | 道路 | road | 4 条 |
| water | 水系 | droplets | 6 条 |
| well | 井/泉 | well | 5 条 |
| bridge | 古桥 | bridge | 5 条 |
| ancient-tree | 古树 | tree | 6 条 |
| protected-house | 保护民居 | home | 5 条 |
| historic-building | 历史建筑 | building | 3 条 |
| human-environment | 人文环境 | landmark | 3 条 |

**总计：37 条遗产数据**

### 5.3 类型专属字段

#### 道路（road）

| 灵活字段 key | 标签 |
|-------------|------|
| orientation | 朝向 |

#### 水系（water）

| 灵活字段 key | 标签 |
|-------------|------|
| flowDirection | 流向 |

#### 井/泉（well）

| 灵活字段 key | 标签 |
|-------------|------|
| eyeCount | 眼数 |

#### 古桥（bridge）

| 灵活字段 key | 标签 |
|-------------|------|
| material | 材质 |
| loadCapacity | 荷载 |
| bridgeHeight | 高度 |
| pointWidth | 宽度 |

#### 古树名木（ancient-tree）

| 灵活字段 key | 标签 |
|-------------|------|
| familyName | 科名 |
| genusName | 属名 |
| speciesName | 树种名 |
| latinName | 拉丁名 |
| protectionLevel | 保护等级 |
| treeAge | 树龄 |
| treeHeight | 树高 |
| chestCircumference | 胸围 |

#### 保护民居（protected-house）

| 灵活字段 key | 标签 |
|-------------|------|
| buildingPattern | 建筑格局 |
| heritageElements | 遗产要素 |
| propertyOwner | 产权 |
| managementUnit | 经营管理 |
| remark | 备注 |

#### 历史建筑（historic-building）

| 灵活字段 key | 标签 |
|-------------|------|
| buildingPattern | 建筑格局 |
| heritageElements | 遗产要素 |
| propertyOwner | 产权 |
| managementUnit | 经营管理 |

#### 人文环境（human-environment）

| 灵活字段 key | 标签 |
|-------------|------|
| buildingPattern | 建筑格局 |
| heritageElements | 遗产要素 |

### 5.4 数据来源

所有数据硬编码在 `features/heritage/shared/data/` 下按类型分文件：

| 文件 | 路径 |
|------|------|
| 道路 | `shared/data/roads.ts` — 4 条 |
| 水系 | `shared/data/waters.ts` — 6 条 |
| 井/泉 | `shared/data/wells.ts` — 5 条 |
| 古桥 | `shared/data/bridges.ts` — 5 条 |
| 古树名木 | `shared/data/ancientTrees.ts` — 6 条 |
| 保护民居 | `shared/data/protectedHouses.ts` — 5 条 |
| 历史建筑 | `shared/data/historicBuildings.ts` — 3 条 |
| 人文环境 | `shared/data/humanEnvironments.ts` — 3 条 |
| 统一索引 | `shared/data/index.ts` — 注册所有类型，导出 `heritageData` / `getHeritageByType()` / `getHeritageById()` / `searchHeritage()` |

### 5.5 数据流架构

```
HeritagePage (列表页)
    │
    ▼
heritageData (shared/data/index.ts)
    │ 统一对象引用：{ road: [...], water: [...], ... }
    │
    ├── Tab 筛选 → getData() 内置过滤
    ├── 关键词搜索 → searchHeritage(keyword, type?)
    ├── 距离排序 → getDistance() Haversine 计算
    └── 分页 → useLoadMore(filtered, 10)
    │
    ▼
详情页 (RoadDetail / WaterDetail / ...)
    │
    ├── 按 id 查找 → 对应 *Data.find(h => h.id === id)
    ├── 布局 → HeritageDetailLayout 统一组装
    ├── 字段 → FieldRow 每行渲染
    ├── 地图 → HeritageMap 组件（高德静态图 iframe）
    └── 图片 → PhotoCarousel + PhotoViewer
```

**关键架构约束：** 全部数据 **无后端、无数据库**，数据在编译时直接打包入前端 bundle。修改遗产数据需直接编辑 `shared/data/*.ts` 文件后重新构建。

---

## 六、交互规范与视觉说明

### 6.1 C 端列表页布局

```
┌──────────────────────────────────────┐
│  ← 遗产知识                           │
├──────────────────────────────────────┤
│  [位置失败提示条（可选）]              │
├──────────────────────────────────────┤
│  🔍 搜索遗产名称                       │
├──────────────────────────────────────┤
│  全部 | 道路 | 水系 | 井泉 | 古桥 |    │
│  古树 | 保护民居 | 历史建筑 | 人文环境 │
│  离我最近                            │
├──────────────────────────────────────┤
│  ┌──────────────────────────────┐    │
│  │  [封面图 16:9]     距离标签  │    │
│  │  渐变遮罩                    │    │
│  │  遗产名称                    │    │
│  │  区域 · 类型                 │    │
│  ├──────────────────────────────┤    │
│  │  描述摘要（最多2行）          │    │
│  │  保护状况          距离      │    │
│  └──────────────────────────────┘    │
│  ┌─── 下一个卡片 ───┐                │
│  ...                                 │
│  [加载更多]                           │
│  ...                                 │
└──────────────────────────────────────┘
```

### 6.2 C 端详情页布局

```
┌──────────────────────────────────────┐
│  ←（浮动返回按钮）                    │
│  ┌──────────────────────────────┐    │
│  │  沉浸式图片轮播 (4:3)        │    │
│  │  触控可滑动 · 页码指示器     │    │
│  │  [全屏] [分享]               │    │
│  └──────────────────────────────┘    │
│                                      │
│  (圆角上推遮罩 -mt-6)                │
│  ┌── 标题卡片 ──── 圆角 2xl ────┐    │
│  │  遗产名称（20pt，加粗）       │    │
│  │  区域pill  类型pill  子类型   │    │
│  │  保护状态pill                 │    │
│  │  基本信息摘要                 │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌── 详细信息 ── 圆角 2xl ──────┐    │
│  │  ▎ 详细信息                   │    │
│  │  ┌────────────────────────┐  │    │
│  │  │ 标签1             值   │  │    │
│  │  │ 标签2             值   │  │    │
│  │  │ ...                    │  │    │
│  │  └────────────────────────┘  │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌── 位置与地图 ── 圆角 2xl ────┐    │
│  │  📍 地址                      │    │
│  │  ┌──────────────────────┐    │    │
│  │  │ 高德地图静态图嵌入    │    │    │
│  │  └──────────────────────┘    │    │
│  │  lat, lng            地址     │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌── 图纸资料 ── 圆角 2xl ──────┐    │
│  │  ▎ 图纸资料                   │    │
│  │  📄 文件名1                   │    │
│  │  📄 文件名2                   │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌── 文字介绍 ── 圆角 2xl ──────┐    │
│  │  ▎ 文字介绍                   │    │
│  │  完整描述文本                  │    │
│  │  (whitespace-pre-wrap)        │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

### 6.3 交互细节

| 场景 | 交互 | 说明 |
|------|------|------|
| Tabs 切换 | 水平滚动 Tab 栏，当前 Tab 蓝色高亮（primary bg），其他灰色 | 默认"全部" |
| 搜索 | 输入即过滤，无防抖、无搜索按钮 | 实时性能由硬编码数据量（37 条）保证 |
| 列表卡片 | 点击触发 `active:scale-[0.99]` 缩放动效 | 反馈轻量 |
| 列表分页 | 初始 10 条，点击"加载更多"追加 10 条 | useLoadMore hook |
| 图片轮播 | 触控滑动 / 左右半区点击切换 / 底部圆点指示器 | 手势切换 |
| 全屏查看器 | 点击放大图标打开，黑色背景，触控左右切换 | 含页码数字指示 |
| 导航跳转 | 新标签页打开 `uri.amap.com/marker` | 调用高德地图 App 导航 |
| 地图加载 | iframe 嵌入高德地图静态图，遮罩层显示"地图加载中..." | 静态图不保证实时可用（需要 AMap key） |
| 详情页返回 | 左上角浮动返回按钮，`navigate(-1)` 返回 | |

### 6.4 视觉规范

| 规范 | 值 | 说明 |
|------|----|------|
| 列表卡片 | 白色背景，`rounded-xl`，`shadow-sm` | 阴影卡片样式 |
| 详情卡片 | 白色背景，`rounded-2xl`，`shadow-[0_2px_12px_rgba(0,0,0,0.04)]` | 柔和阴影 |
| 区域标签 | `bg-primary-50 text-primary` | 蓝色系 |
| 类型标签 | `bg-blue-50 text-blue-600` | 蓝色系 |
| 子类型标签 | `bg-purple-50 text-purple-600` | 紫色系 |
| 保护状态标签 | `bg-emerald-50 text-emerald-600` | 绿色系 |
| 图片过度区域 | 圆角上推 -mt-6 | 内容区叠加在图片底部之上 |
| 全屏查看器 | 全屏黑色，白色工具图标，半透明遮罩导航 | |

---

## 七、技术架构要点

### 7.1 前端架构

| 模块 | 技术 | 说明 |
|------|------|------|
| 数据存储 | 硬编码 TypeScript 常量 | `shared/data/*.ts` 37 条记录，编译时打包 |
| 数据索引 | `shared/data/index.ts` | `heritageData` 统一对象，按类型索引 |
| 工具函数 | `getHeritageByType()` / `getHeritageById()` / `searchHeritage()` | 数据查找与过滤 |
| 距离计算 | `getDistance()` Haversine 公式 | 前端计算，无服务端依赖 |
| 列表分页 | `useLoadMore` hook | 每页 10 条增量加载 |
| 路由 | `React.lazy()` 懒加载 | 9 个路由全部代码分割 |
| 图片 | `ImageWithFallback` | fallback 处理占位图 |
| 地图 | 高德地图静态图 REST API + iframe | `restapi.amap.com/v3/staticmap` |
| 导航 | `uri.amap.com/marker` URI Scheme | 打开高德地图 App |

### 7.2 架构约束

1. **纯前端应用**：遗产知识模块无后端依赖，所有数据在编译时打包入前端 bundle。无 Server API、无数据库、无运行时数据持久化。
2. **数据变更需重新构建**：修改遗产条目文字、图片、坐标等数据需直接编辑 `shared/data/*.ts` 并重新 `npm run build`。
3. **地图服务依赖外部 API**：高德地图静态图需要有效 `key`，当前代码中嵌入的 key 可能过期失效。失效时地图区域仅显示遮罩层"地图加载中..."，不影响其他功能。

### 7.3 外部依赖

| 依赖 | 用途 | 来源 |
|------|------|------|
| Unsplash 图片 | 遗产条目配图 | `images.unsplash.com` |
| 高德地图静态图 API | 位置地图展示 | `restapi.amap.com/v3/staticmap` |
| 高德地图 URI Scheme | 导航跳转 | `uri.amap.com/marker` |

### 7.4 React Router 路由配置

所有路由定义在 `src/c-end/routes.tsx`，以 `children` 形式挂载于 C 端路由树中（无 AppLayout 底部 Tab 栏包裹，说明遗产知识入口在 Tab 栏之外）：

```typescript
// 列表页
{ path: "heritage", element: <HeritagePage /> },

// 详情页（8 个独立路由）
{ path: "heritage/road/:id", element: <RoadDetail /> },
{ path: "heritage/water/:id", element: <WaterDetail /> },
{ path: "heritage/well/:id", element: <WellDetail /> },
{ path: "heritage/bridge/:id", element: <BridgeDetail /> },
{ path: "heritage/ancient-tree/:id", element: <AncientTreeDetail /> },
{ path: "heritage/protected-house/:id", element: <ProtectedHouseDetail /> },
{ path: "heritage/historic-building/:id", element: <HistoricBuildingDetail /> },
{ path: "heritage/human-environment/:id", element: <HumanEnvironmentDetail /> },
```

---

## 八、种子数据清单

### 8.1 道路（4 条）

| id | 名称 | 区域 | 基本信息 |
|----|------|------|----------|
| road-1 | 四方街 | 大研 | 五花石路面，街道冲洗习俗 |
| road-2 | 新华街 | 大研 | 古城西侧商业街，传统商铺 |
| road-3 | 五一街 | 大研 | 古城东部居住区，文化名人故居 |
| road-4 | 木府门前路 | 大研 | 木氏土司出行要道，景观走廊 |

### 8.2 水系（6 条）

| id | 名称 | 区域 | 基本信息 |
|----|------|------|----------|
| water-1 | 黑龙潭 | 大研 | 玉河水主要源头，2005年扩容至112亩 |
| water-2 | 玉河 | 大研 | 主干河，引自黑龙潭水源 |
| water-3 | 中河 | 大研 | 古城核心水道，商业繁荣 |
| water-4 | 西河 | 大研 | 四方街清洗水源，传统民居密集区 |
| water-5 | 东河 | 大研 | 古城东部水系，古柳众多 |
| water-6 | 白马龙潭 | 大研 | 玉泉双璧之一，古木参天 |

### 8.3 井/泉（5 条）

| id | 名称 | 区域 | 基本信息 |
|----|------|------|----------|
| well-1 | 石榴井 | 大研 | 三眼井形制，分饮用、洗菜、洗衣功能 |
| well-2 | 溢彩井 | 大研 | 三眼井，早晚呈彩色 |
| well-3 | 甘泽井 | 大研 | 双眼井，水质极佳 |
| well-4 | 洗涤井 | 大研 | 三眼井，洗涤专用 |
| well-5 | 玉泉井 | 白沙 | 四眼井，玉龙雪山融水 |

### 8.4 古桥（5 条）

| id | 名称 | 区域 | 基本信息 |
|----|------|------|----------|
| bridge-1 | 双石桥(玉龙桥) | 大研 | 双孔石拱桥，玉河水入城分流处 |
| bridge-2 | 大石桥 | 大研 | 单孔石拱，古城繁华地段 |
| bridge-3 | 万子桥 | 大研 | 单孔石拱，寓意吉祥 |
| bridge-4 | 南门桥 | 大研 | 石平桥，古城南门入口 |
| bridge-5 | 玉龙桥 | 大研 | 混凝土结构，1959年建 |

### 8.5 古树名木（6 条）

| id | 名称 | 区域 | 保护等级 |
|----|------|------|----------|
| tree-1 | 云南柳 | 大研 | 后备资源 |
| tree-2 | 古槐 | 大研 | 三级 |
| tree-3 | 五角枫 | 白沙 | 后备资源 |
| tree-4 | 古松 | 束河 | 二级 |
| tree-5 | 古柏 | 大研 | 二级 |
| tree-6 | 紫藤 | 大研 | 后备资源 |

### 8.6 保护民居（5 条）

| id | 名称 | 区域 | 子类型 |
|----|------|------|--------|
| res-1 | 方国瑜故居 | 大研古城（含黑龙潭） | 代表性民居 |
| res-2 | 顾彼得旧居 | 大研古城 | 代表性民居 |
| res-3 | 周霖故居 | 大研古城 | 代表性民居 |
| res-4 | 普济寺 | 束河 | 宗教建筑 |
| res-5 | 白沙壁画宅 | 白沙 | 代表性民居 |

### 8.7 历史建筑（3 条）

| id | 名称 | 区域 | 子类型 |
|----|------|------|--------|
| public-1 | 文明坊(石狮子) | 大研古城（含黑龙潭） | 公共建(构)筑物 |
| public-2 | 万古楼 | 大研古城 | 公共建(构)筑物 |
| public-3 | 木府 | 大研古城 | 公共建(构)筑物 |

### 8.8 人文环境（3 条）

| id | 名称 | 区域 | 子类型 |
|----|------|------|--------|
| culture-1 | 流官府旧址 | 大研 | 人文环境 |
| culture-2 | 束河古镇四方街 | 束河 | 人文环境 |
| culture-3 | 白沙古镇 | 白沙 | 人文环境 |

---

## 九、验收标准

### 9.1 列表页验收

- [✅] 进入 `/c/heritage` 显示 "全部" 分类，展示所有 37 条遗产列表
- [✅] 切换各类型 Tab，列表按类型正确筛选
- [✅] 切换到"离我最近"并允许定位 → 列表按距离升序排列，卡片显示距离标签
- [✅] 定位被浏览器拒绝 → 显示黄色提示条"无法获取您的位置，请开启定位权限"
- [✅] 搜索框输入关键词 → 列表实时过滤匹配项
- [✅] 搜索框清空 → 列表恢复完整
- [✅] 列表初始显示 10 条，点击"加载更多"追加 10 条
- [✅] 无搜索结果时显示空状态"暂无相关遗产记录"
- [✅] 点击卡片跳转到对应类型详情页
- [✅] 9 个 Tab 全部可用（8 类型 + 全部 + 离我最近）

### 9.2 详情页验收

- [✅] 8 类遗产详情页均可正常访问，URL 路由匹配正确
- [✅] 沉浸式图片轮播展示首图，可触控左右滑动切换图片
- [✅] 点击放大图标打开全屏查看器，支持左右切换和关闭
- [✅] 标题区展示名称 + 区域/类型/子类型/保护状态标签
- [✅] 基本信息摘要展示
- [✅] 类型专属字段区域按类型展示不同字段（古树 8 个字段、古桥 4 个字段等）
- [✅] 位置地图区域展示高德地图静态图和导航链接
- [✅] 图纸资料区域展示文件列表（有数据时显示，无数据时隐藏）
- [✅] 文字介绍区域展示完整描述文本
- [✅] 地址信息在地图卡片中展示
- [✅] 查询不存在的 ID 时显示"遗产记录不存在"+ 返回按钮

### 9.3 地图与导航验收

- [✅] HeritageMap 组件展示高德地图静态图 iframe
- [✅] "导航"链接跳转到 `uri.amap.com/marker` 高德导航
- [✅] 地图底部展示坐标信息和地址
- [✅] 地图加载期间显示遮罩层提示

### 9.4 数据完整性验收

- [✅] 道路 4 条，水系 6 条，井泉 5 条，古桥 5 条，古树 6 条，保护民居 5 条，历史建筑 3 条，人文环境 3 条
- [✅] 每条包含 name / type / area / location / description / photos 必填字段
- [✅] 每条 location 坐标有效（lat > 0, lng > 0）
- [✅] `heritageData` 统一索引正确注册所有 8 个类型
- [✅] `getHeritageById()` 跨类型搜索返回正确结果
- [✅] `searchHeritage()` 按关键词和类型过滤正确

### 9.5 已知未实现（明确不在当前范围内）

- [❌] 桌面端遗产数据管理后台（遗产条目新增/编辑/删除/维护）
- [❌] 后端数据库存储（所有数据硬编码在 `shared/data/`）
- [❌] 交互式地图（仅静态图 iframe，不可拖拽缩放）
- [❌] 实景 AR 或增强现实叠加
- [❌] 语音讲解 / 多语言导览
- [❌] 用户评价 / 收藏 / 打卡功能
- [❌] 遗产游览路线规划
- [❌] 多媒体视频展示
- [❌] 遗产数据统计（浏览量、热度等）
- [❌] 遗产保护动态 / 修缮记录
- [❌] 多端支持（仅 C 端游客，B 端/桌面端无入口）
- [❌] 图片实际分享功能（右上角分享按钮仅 UI）

---

## 十、相关文件索引

| 类型 | 文件路径 | 说明 |
|------|----------|------|
| 类型定义 | `src/features/heritage/shared/types.ts` | HeritageItem 接口 + HeritageType 联合类型 + heritageTypeMeta + heritageExtraFields |
| 数据索引 | `src/features/heritage/shared/data/index.ts` | heritageData 统一索引 + 工具函数 |
| 种子数据 | `src/features/heritage/shared/data/roads.ts` | 道路数据（4 条） |
| 种子数据 | `src/features/heritage/shared/data/waters.ts` | 水系数据（6 条） |
| 种子数据 | `src/features/heritage/shared/data/wells.ts` | 井泉数据（5 条） |
| 种子数据 | `src/features/heritage/shared/data/bridges.ts` | 古桥数据（5 条） |
| 种子数据 | `src/features/heritage/shared/data/ancientTrees.ts` | 古树数据（6 条） |
| 种子数据 | `src/features/heritage/shared/data/protectedHouses.ts` | 保护民居数据（5 条） |
| 种子数据 | `src/features/heritage/shared/data/historicBuildings.ts` | 历史建筑数据（3 条） |
| 种子数据 | `src/features/heritage/shared/data/humanEnvironments.ts` | 人文环境数据（3 条） |
| C 端列表页 | `src/features/heritage/c-end/pages/HeritagePage.tsx` | 遗产列表页（232 行） |
| 详情布局 | `src/features/heritage/c-end/pages/detail/HeritageDetailLayout.tsx` | 统一详情布局组件（300 行） |
| 详情页 | `src/features/heritage/c-end/pages/detail/RoadDetail.tsx` | 道路详情 |
| 详情页 | `src/features/heritage/c-end/pages/detail/WaterDetail.tsx` | 水系详情 |
| 详情页 | `src/features/heritage/c-end/pages/detail/WellDetail.tsx` | 井泉详情 |
| 详情页 | `src/features/heritage/c-end/pages/detail/BridgeDetail.tsx` | 古桥详情 |
| 详情页 | `src/features/heritage/c-end/pages/detail/AncientTreeDetail.tsx` | 古树详情 |
| 详情页 | `src/features/heritage/c-end/pages/detail/ProtectedHouseDetail.tsx` | 保护民居详情 |
| 详情页 | `src/features/heritage/c-end/pages/detail/HistoricBuildingDetail.tsx` | 历史建筑详情 |
| 详情页 | `src/features/heritage/c-end/pages/detail/HumanEnvironmentDetail.tsx` | 人文环境详情 |
| 详情页索引 | `src/features/heritage/c-end/pages/detail/index.ts` | 8 个详情页 barrel 导出 |
| 地图组件 | `src/features/heritage/c-end/components/HeritageMap.tsx` | 高德地图静态图组件（67 行） |
| C 端路由 | `src/c-end/routes.tsx` | 9 个路由注册（列表 + 8 详情） |
| Spec 文档 | `docs/superpowers/specs/010-heritage.md` | 功能需求规格说明书 |