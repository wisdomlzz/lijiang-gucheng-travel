# 首页配置（Homepage）

## 产品定位与边界

首页配置模块包含 C 端首页（HomePage）、搜索页（SearchResultsPage）、游客导航页（VisitorServicesPage）三个页面，以及桌面端首页配置管理（Banner 轮播 + 宫格图标排序/显隐）。

边界：
- C 端：首页、搜索、游客导航三个页面
- 桌面端：首页配置管理（Banner 管理 + 宫格管理）
- 首页宫格图标和 Banner 数据通过 `useHomepageConfigStore` 管理，支持 API 同步

## 核心用户角色

| 角色 | 描述 |
|------|------|
| 游客（tourist） | C 端首页浏览、搜索、进入各功能 |
| 平台管理员（platform_admin） | 桌面端配置首页 Banner 和宫格图标 |

## 核心业务流程

**C 端首页**
1. 用户打开首页
2. 顶部渐变蓝天背景 + App 标题
3. Banner 轮播（3.5 秒自动切换，支持悬停暂停 + 点击指示器跳转）
4. 浮动搜索栏，搜索提交跳转搜索结果页
5. 8 格宫格图标，支持左右滑动翻页（每页 8 个）
6. 推荐攻略区域（2 个精选路线卡片）
7. 景区资讯列表（懒加载 + IntersectionObserver 自动加载）

**搜索页**
1. 用户输入关键词
2. 搜索结果聚合展示：商家、路线、资讯三大分类
3. 点击结果跳转对应详情页

**游客导航页**
1. 展示"文旅探索"、"便捷服务"、"公众参与"三大分类
2. 每个分类下 4-8 个功能入口图标
3. 部分入口跳转 CRMEB 商城（外部链接）

## 功能模块清单

| 优先级 | 模块 | 功能点 | 说明 |
|--------|------|--------|------|
| P0 | Banner 轮播 | 自动播放 + 手动切换 + 指示器 | 已实现 |
| P0 | 宫格图标 | 8 格翻页 + 路由跳转 | 已实现 |
| P0 | 搜索 | 关键词搜索跳转聚合结果页 | 已实现 |
| P1 | 推荐攻略 | 首页展示 2 条精选路线 | 已实现 |
| P1 | 景区资讯 | 公告列表 + IntersectionObserver 懒加载 | 已实现 |
| P1 | 搜索聚合结果 | 商家/路线/资讯三类搜索结果 | 已实现 |
| P2 | 游客导航页 | 三大分类功能入口 | 已实现 |
| P2 | 桌面端 Banner 管理 | 新增/编辑/删除/排序/显隐 | 已实现（API 同步） |
| P2 | 桌面端宫格管理 | 排序/显隐/更新字段 | 已实现（API 同步） |
| P2 | 宫格翻页 | 左右滑动切换 | 已实现 |
| P2 | CRMEB 跳转 | 部分入口跳转外部商城 | 已实现 |
| P2 | 扫码按钮 | 搜索栏旁扫码图标（占位） | 按钮存在，无扫码功能 ❌ |

## 核心数据模型

```typescript
interface GridItemConfig {
  id: string
  label: string
  imageUrl: string
  route: string
  search?: string
  order: number
  page: number   // 1 或 2
  visible: boolean
}

interface BannerConfig {
  id: string
  scene: "home" | "shop"
  imageUrl: string
  title: string
  link?: string
  badge?: string  // "NEW" | "热门" | 其他
  order: number
  enabled: boolean
  visible?: boolean
}
```

## 验收标准

| 编号 | 验收项 | 状态 |
|------|--------|------|
| H01 | Banner 自动轮播（3.5 秒间隔） | ✅ |
| H02 | Banner 悬停暂停 + 指示器切换 | ✅ |
| H03 | Banner 点击跳转配置的链接 | ✅ |
| H04 | 宫格图标按 order 排序，每页 8 个 | ✅ |
| H05 | 宫格左右滑动翻页 | ✅ |
| H06 | 宫格图标点击跳转对应路由 | ✅ |
| H07 | 搜索栏输入关键词回车跳转搜索页 | ✅ |
| H08 | 搜索聚合结果含商家/路线/资讯三类 | ✅ |
| H09 | 推荐攻略展示 2 条精选路线 | ✅ |
| H10 | 景区资讯列表懒加载（IntersectionObserver） | ✅ |
| H11 | 游客导航页三大分类功能入口 | ✅ |
| H12 | CRMEB 外部商城跳转 | ✅ |
| H13 | 桌面端 Banner 管理 CRUD | ✅ |
| H14 | 桌面端宫格管理排序/显隐 | ✅ |
| H15 | 扫码功能 | ❌（仅 UI 按钮） |
| H16 | 首页数据实时同步 | ❌（Zustand persist 到内存） |