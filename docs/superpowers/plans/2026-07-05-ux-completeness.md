# UX 补全 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 每完成一个 Task 必须 `npm run build` 通过后再 commit。**前置依赖：** 子项目 1（工程基线 + 死代码清扫）已完成。子项目 2（业务闭环）非前置依赖，可独立执行。

**Goal:** 补全三个 UX 断点：①首页搜索栏接通实际搜索功能 ②懒加载页用 skeleton 替代"加载中..."文本 ③列表空状态标准化为统一组件。

**Architecture：** 新建两个 shared/mobile 组件（`Skeleton`、`EmptyState`），接入 HomePage 搜索、Suspense fallback、各列表页空状态。不改业务逻辑。

**Tech Stack：** TypeScript, React 18, Tailwind CSS v4, react-router, lucide-react

## Global Constraints

- **复用现有 token**：颜色用 `text-text-tertiary`/`bg-surface-page`/`bg-surface-strong`，圆角用 `rounded-2xl`，不引入裸色值。
- **新组件放 `src/shared/components/mobile/`**，与 `PageHeader`/`SectionHeader`/`GridIcon` 同目录。
- **不引入新依赖**（skeleton 用纯 CSS/Tailwind，不用 react-loading-skeleton 等）。
- **每个 Task 结束**：`npm run build` + `npm run typecheck` 通过 + commit。
- **路径别名** `@/*` → `src/*`。

## 文件结构总览

| 类别 | 操作 | 文件 |
|---|---|---|
| 搜索闭环 | 新建 | `src/features/homepage/c-end/pages/SearchResultsPage.tsx`（全局搜索结果页） |
| 搜索闭环 | 修改 | `src/features/homepage/c-end/pages/HomePage.tsx`（接通搜索 input） |
| 搜索闭环 | 修改 | `src/c-end/routes.tsx`（加 /c/search 路由） |
| Skeleton | 新建 | `src/shared/components/mobile/Skeleton.tsx` |
| Skeleton | 修改 | `src/c-end/App.tsx`、`src/b-end/App.tsx`、`src/desktop/App.tsx`（Suspense fallback） |
| EmptyState | 新建 | `src/shared/components/mobile/EmptyState.tsx` |
| EmptyState | 修改 | 各列表页（替换内联"暂无XXX"为 `<EmptyState>`） |

---

## Task 1：创建 `Skeleton` 通用骨架屏组件

**背景：** 所有 Suspense fallback 都是"加载中..."文本，体验差。建一个可组合的 Skeleton 组件（行/卡片/列表三种预设）。

**Files:**
- Create: `src/shared/components/mobile/Skeleton.tsx`

- [ ] **Step 1：创建 Skeleton.tsx**

文件：`src/shared/components/mobile/Skeleton.tsx`

```tsx
interface SkeletonProps {
  className?: string
}

/** 单个灰色块，带 pulse 动画 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-surface-strong ${className}`} />
}

/** 列表项骨架：左图 + 右文 */
export function SkeletonListItem() {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-2xl">
      <Skeleton className="w-[96px] h-[96px] flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/** 宫格骨架：2 行 4 列 */
export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-4 gap-3 px-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  )
}

/** 卡片骨架：带封面 + 标题 + 摘要 */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card">
      <Skeleton className="w-full h-[120px] rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}

/** 列表骨架页：N 个 SkeletonListItem */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2：确认 bg-surface-strong token 存在**

Run: `grep "surface-strong" src/shared/styles/theme.css src/shared/styles/tailwind.css`
Expected: 看到该 token 定义。若不存在，改用 `bg-black/5` 或 `bg-gray-100`（但优先用 token；若 token 缺失，在 theme.css 的 `@theme` 中加 `--color-surface-strong: #F1F5F9;` 并在 tailwind.css 映射 `--color-surface-strong: var(--color-surface-strong);`）

- [ ] **Step 3：typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: 无错误

- [ ] **Step 4：提交**

```bash
git add src/shared/components/mobile/Skeleton.tsx
git commit -m "feat: add Skeleton skeleton-screen components"
```

---

## Task 2：用 Skeleton 替换 Suspense fallback

**背景：** `src/c-end/App.tsx`、`src/b-end/App.tsx`、`src/desktop/App.tsx` 的 Suspense fallback 是"加载中..."文本。换成骨架屏。

**Files:**
- Modify: `src/c-end/App.tsx`
- Modify: `src/b-end/App.tsx`
- Modify: `src/desktop/App.tsx`

- [ ] **Step 1：替换 C 端 App fallback**

文件：`src/c-end/App.tsx`

找到第 29 行附近：
```tsx
      <Suspense fallback={<div className="flex items-center justify-center h-full min-h-[400px] text-sm text-text-tertiary">加载中...</div>}>
```

改为：
```tsx
      <Suspense fallback={<PageSkeleton />}>
```

在文件顶部 import 区加：
```tsx
import { PageSkeleton } from "@/shared/components/mobile/Skeleton"
```

然后在 `src/shared/components/mobile/Skeleton.tsx` 末尾追加一个 `PageSkeleton` 导出（移动端整页骨架）：

文件：`src/shared/components/mobile/Skeleton.tsx`，在文件末尾追加：

```tsx
/** 移动端整页骨架：顶部 header + 列表 */
export function PageSkeleton() {
  return (
    <div className="min-h-[400px] bg-surface-page">
      <div className="h-12 bg-white border-b border-border-light" />
      <SkeletonList count={5} />
    </div>
  )
}
```

- [ ] **Step 2：替换 B 端 App fallback**

文件：`src/b-end/App.tsx`

找到第 27 行附近同样的"加载中..."fallback，改为：
```tsx
      <Suspense fallback={<PageSkeleton />}>
```

在 import 区加：
```tsx
import { PageSkeleton } from "@/shared/components/mobile/Skeleton"
```

- [ ] **Step 3：替换桌面端 App fallback**

文件：`src/desktop/App.tsx`

找到第 33-34 行：
```tsx
function Loading() {
  return <div className="flex items-center justify-center h-screen">加载中...</div>
}
```

改为：
```tsx
function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse rounded-lg bg-surface-strong w-32 h-3" />
    </div>
  )
}
```

（桌面端不用移动端骨架，用一个简单的 pulse 条即可）

- [ ] **Step 4：typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: 无错误

- [ ] **Step 5：手动验证**

Run: `npm run dev`，刷新页面，观察懒加载页面切换时显示骨架屏而非"加载中..."文本。验证后停止 dev。

- [ ] **Step 6：提交**

```bash
git add src/c-end/App.tsx src/b-end/App.tsx src/desktop/App.tsx src/shared/components/mobile/Skeleton.tsx
git commit -m "feat: replace loading text with skeleton screens"
```

---

## Task 3：创建 `EmptyState` 通用空状态组件

**背景：** 全代码库有 15+ 处内联"暂无XXX"div，样式不统一（有的 `text-text-tertiary`、有的 `text-text-secondary`，字号 13/14 混用）。建一个统一组件。

**Files:**
- Create: `src/shared/components/mobile/EmptyState.tsx`

- [ ] **Step 1：创建 EmptyState.tsx**

文件：`src/shared/components/mobile/EmptyState.tsx`

```tsx
import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  /** 图标，默认 Inbox */
  icon?: LucideIcon
  /** 主文案，如"暂无收藏" */
  title: string
  /** 副文案（可选），如"去首页看看吧" */
  description?: string
  /** 操作按钮（可选） */
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-surface-strong flex items-center justify-center mb-3">
        <Icon size={28} className="text-text-tertiary" />
      </div>
      <p className="text-[14px] text-text-tertiary">{title}</p>
      {description && <p className="text-[13px] text-text-caption mt-1">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 h-9 rounded-full bg-primary text-white text-[13px] font-medium active:scale-95 transition-transform"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2：确认 token**

Run: `grep "text-caption\|surface-strong\|primary\b" src/shared/styles/theme.css src/shared/styles/tailwind.css | head -10`
Expected: 看到这些 token。`text-caption` 若不存在，改用 `text-text-tertiary`；`bg-surface-strong` 同 Task 1 Step 2 处理；`bg-primary` 应已存在（shadcn primary）。

- [ ] **Step 3：typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: 无错误

- [ ] **Step 4：提交**

```bash
git add src/shared/components/mobile/EmptyState.tsx
git commit -m "feat: add EmptyState shared component"
```

---

## Task 4：把主要列表页的空状态迁移到 `EmptyState`

**背景：** 把高频列表页的内联"暂无XXX"替换为 `<EmptyState>`，统一视觉。选 6 个最常访问的列表页。

**Files:**
- Modify: `src/features/favorite/c-end/pages/FavoritesPage.tsx`
- Modify: `src/features/complaints/c-end/pages/MyComplaintsPage.tsx`
- Modify: `src/features/booking/c-end/pages/MyBookingsPage.tsx`
- Modify: `src/features/convenience/c-end/pages/OrderListPage.tsx`
- Modify: `src/features/notification/c-end/pages/NotificationsPage.tsx`
- Modify: `src/features/info/c-end/pages/MyPostsPage.tsx`

- [ ] **Step 1：迁移 FavoritesPage**

文件：`src/features/favorite/c-end/pages/FavoritesPage.tsx`

找到第 65 行附近：
```tsx
            <p className="text-[13px] text-text-tertiary">暂无收藏</p>
```

替换整个空状态容器为：
```tsx
            <EmptyState title="暂无收藏" description="去首页发现感兴趣的内容吧" />
```

在文件顶部 import 区加：
```tsx
import { EmptyState } from "@/shared/components/mobile/EmptyState"
```

（替换时保留外层容器的条件渲染 `xxx.length === 0 ? <EmptyState .../> : (...)` 结构，只把内联 `<p>` 换成 `<EmptyState>`）

- [ ] **Step 2：迁移 MyComplaintsPage**

文件：`src/features/complaints/c-end/pages/MyComplaintsPage.tsx`

找到第 52 行附近 `<p className="text-[14px]">暂无投诉记录</p>`，替换为：
```tsx
            <EmptyState title="暂无投诉记录" description="有问题随时反馈" />
```

找到第 90 行附近 `该分类下暂无投诉`，替换为：
```tsx
                <EmptyState title="该分类下暂无投诉" />
```

import 加：
```tsx
import { EmptyState } from "@/shared/components/mobile/EmptyState"
```

- [ ] **Step 3：迁移 MyBookingsPage**

文件：`src/features/booking/c-end/pages/MyBookingsPage.tsx`

找到第 31 行附近 `<p className="text-[14px]">暂无预约记录</p>`，替换为：
```tsx
            <EmptyState title="暂无预约记录" description="去文化院落看看吧" />
```

import 加：
```tsx
import { EmptyState } from "@/shared/components/mobile/EmptyState"
```

- [ ] **Step 4：迁移 OrderListPage**

文件：`src/features/convenience/c-end/pages/OrderListPage.tsx`

找到第 89 行附近 `<p className="text-text-tertiary text-[13px]">暂无相关便民服务订单</p>`，替换为：
```tsx
            <EmptyState title="暂无便民服务订单" description="下单一次便民服务试试" />
```

import 加：
```tsx
import { EmptyState } from "@/shared/components/mobile/EmptyState"
```

- [ ] **Step 5：迁移 NotificationsPage**

文件：`src/features/notification/c-end/pages/NotificationsPage.tsx`

找到第 149 行附近 `<p className="text-[14px] text-text-tertiary">暂无消息</p>`，替换为：
```tsx
              <EmptyState title="暂无消息" />
```

import 加：
```tsx
import { EmptyState } from "@/shared/components/mobile/EmptyState"
```

- [ ] **Step 6：迁移 MyPostsPage**

文件：`src/features/info/c-end/pages/MyPostsPage.tsx`

找到第 85 行附近 `<p className="text-[13px] text-text-tertiary">暂无发布内容</p>`，替换为：
```tsx
            <EmptyState title="暂无发布内容" />
```

import 加：
```tsx
import { EmptyState } from "@/shared/components/mobile/EmptyState"
```

- [ ] **Step 7：typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: 无错误

- [ ] **Step 8：提交**

```bash
git add src/features/favorite/c-end/pages/FavoritesPage.tsx src/features/complaints/c-end/pages/MyComplaintsPage.tsx src/features/booking/c-end/pages/MyBookingsPage.tsx src/features/convenience/c-end/pages/OrderListPage.tsx src/features/notification/c-end/pages/NotificationsPage.tsx src/features/info/c-end/pages/MyPostsPage.tsx
git commit -m "refactor: migrate inline empty states to shared EmptyState component"
```

---

## Task 5：接通首页搜索栏

**背景：** `HomePage` 顶部搜索栏的 `<input>` 无 `onChange`/`onSubmit`，是纯装饰。接通：输入关键词 + 回车 → 跳转到 `/c/search?q=xxx` 全局搜索结果页。结果页搜索 商家 + 路线 + 资讯 三类。

**Files:**
- Modify: `src/features/homepage/c-end/pages/HomePage.tsx`
- Create: `src/features/homepage/c-end/pages/SearchResultsPage.tsx`
- Modify: `src/c-end/routes.tsx`

- [ ] **Step 1：HomePage 搜索 input 加 state + 提交**

文件：`src/features/homepage/c-end/pages/HomePage.tsx`

在组件函数体顶部（约第 58 行 `useState` 区）加：
```tsx
  const [searchKeyword, setSearchKeyword] = useState("")
```

找到"Floating search bar"块（约第 167 行），把 `<input>` 改为受控 + 加 form 提交：

原代码：
```tsx
            <input
              className="flex-1 text-[13px] text-text-heading bg-transparent outline-none placeholder:text-text-caption"
              placeholder="请输入"
            />
```

改为：
```tsx
            <form
              className="flex-1"
              onSubmit={(e) => {
                e.preventDefault()
                const q = searchKeyword.trim()
                if (q) navigate(`/c/search?q=${encodeURIComponent(q)}`)
              }}
            >
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full text-[13px] text-text-heading bg-transparent outline-none placeholder:text-text-caption"
                placeholder="搜索商家、路线、资讯"
              />
            </form>
```

ScanLine 按钮保留原样（暂不实现扫码，属未来功能）。

- [ ] **Step 2：创建 SearchResultsPage**

文件：`src/features/homepage/c-end/pages/SearchResultsPage.tsx`

```tsx
import { useSearchParams, useNavigate } from "react-router"
import { Search, ChevronLeft } from "lucide-react"
import { useState } from "react"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { InfoListItem } from "@/shared/components/mobile/InfoListItem"
import { EmptyState } from "@/shared/components/mobile/EmptyState"
import { useContentStore } from "@/features/content/store"
import { useAnnouncementStore } from "@/features/announcement/store"
import { recommendRoutes } from "./HomePage"

export function SearchResultsPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const initialQ = params.get("q") || ""
  const [q, setQ] = useState(initialQ)

  const merchants = useContentStore((s) => s.merchants)
  const announcements = useAnnouncementStore((s) => s.announcements)

  const keyword = q.trim().toLowerCase()
  const matchedMerchants = keyword
    ? merchants.filter((m) => m.name.toLowerCase().includes(keyword) || (m.description || "").toLowerCase().includes(keyword))
    : []
  const matchedAnnouncements = keyword
    ? announcements.filter((a) => a.title.toLowerCase().includes(keyword) || (a.content || "").toLowerCase().includes(keyword))
    : []
  const matchedRoutes = keyword
    ? recommendRoutes.filter((r) => r.name.toLowerCase().includes(keyword) || r.subtitle.toLowerCase().includes(keyword))
    : []

  const total = matchedMerchants.length + matchedAnnouncements.length + matchedRoutes.length

  return (
    <div className="min-h-screen bg-surface-page">
      <PageHeader title="搜索" onBack={() => navigate(-1)} />
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-white rounded-full h-10 pl-4 pr-2 shadow-card">
          <Search size={16} className="text-text-caption" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 text-[13px] text-text-heading bg-transparent outline-none placeholder:text-text-caption"
            placeholder="搜索商家、路线、资讯"
          />
        </div>
      </div>

      <div className="px-3 mt-2 pb-24">
        {keyword && total === 0 && <EmptyState title={`未找到「${q}」相关结果`} description="试试其他关键词" />}

        {matchedMerchants.length > 0 && (
          <section className="mt-3">
            <h3 className="text-[13px] font-semibold text-text-body px-1 mb-2">商家（{matchedMerchants.length}）</h3>
            <div className="space-y-2">
              {matchedMerchants.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/c/merchant/${m.id}`)}
                  className="w-full bg-white rounded-2xl p-3 shadow-card text-left active:scale-[0.99] transition-transform"
                >
                  <p className="text-[14px] font-medium text-text-heading">{m.name}</p>
                  <p className="text-[12px] text-text-tertiary mt-1 line-clamp-1">{m.description}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {matchedRoutes.length > 0 && (
          <section className="mt-4">
            <h3 className="text-[13px] font-semibold text-text-body px-1 mb-2">路线（{matchedRoutes.length}）</h3>
            <div className="space-y-2">
              {matchedRoutes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/c/routes/${r.routeId}`)}
                  className="w-full bg-white rounded-2xl p-3 shadow-card text-left active:scale-[0.99] transition-transform"
                >
                  <p className="text-[14px] font-medium text-text-heading">{r.name}</p>
                  <p className="text-[12px] text-text-tertiary mt-1">{r.subtitle}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {matchedAnnouncements.length > 0 && (
          <section className="mt-4">
            <h3 className="text-[13px] font-semibold text-text-body px-1 mb-2">资讯（{matchedAnnouncements.length}）</h3>
            <div className="space-y-2">
              {matchedAnnouncements.map((a) => (
                <InfoListItem
                  key={a.id}
                  image={a.images[0]}
                  title={a.title}
                  summary={a.content.slice(0, 60)}
                  onClick={() => navigate(`/c/announcement/${a.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
```

**注意：** 
1. `useContentStore` 的 `merchants` 字段名按实际 store 确认：`grep -n "merchants" src/features/content/store/index.ts`。若导出名不同，调整。
2. `recommendRoutes` 从 `./HomePage` import — 需要 HomePage 把 `recommendRoutes` 导出（当前是模块内 const）。Step 3 处理。
3. `InfoListItem` 的 props 按实际组件签名调整：`grep -n "interface\|export function InfoListItem" src/shared/components/mobile/InfoListItem.tsx`。

- [ ] **Step 3：从 HomePage 导出 recommendRoutes**

文件：`src/features/homepage/c-end/pages/HomePage.tsx`

找到第 14 行 `const recommendRoutes = [`，改为：
```tsx
export const recommendRoutes = [
```

- [ ] **Step 4：在 routes.tsx 加 /c/search 路由**

文件：`src/c-end/routes.tsx`

在 lazy import 区（约第 33 行附近）加：
```tsx
const SearchResultsPage = lazy(() => import("../features/homepage/c-end/pages/SearchResultsPage").then(m => ({ default: m.SearchResultsPage })))
```

在路由数组中（与其他非 Tab 根路由一起）加：
```tsx
  { path: "search", element: <SearchResultsPage /> },
```

- [ ] **Step 5：typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: 无错误。若 `recommendRoutes` import 报循环依赖警告，可改为把 `recommendRoutes` 抽到 `src/features/homepage/shared/routes-data.ts`，HomePage 和 SearchResultsPage 都从那里 import。

- [ ] **Step 6：手动验证**

Run: `npm run dev`，首页搜索框输入"纳西"回车 → 跳到搜索结果页 → 看到匹配的商家/路线/资讯。验证后停止 dev。

- [ ] **Step 7：提交**

```bash
git add src/features/homepage/c-end/pages/HomePage.tsx src/features/homepage/c-end/pages/SearchResultsPage.tsx src/c-end/routes.tsx
git commit -m "feat: wire homepage search to global search results page"
```

---

## Task 6：全量验证与收尾

**Files:** 无新增，仅验证

- [ ] **Step 1：全量构建 + lint + typecheck + test**

Run:
```bash
npm run lint && npm run typecheck && npm run build && npm run verify:all
```
Expected: 全部通过

- [ ] **Step 2：手动验证 UX 改进**

Run: `npm run dev`，依次验证：

1. **搜索**：首页输入关键词回车 → 搜索结果页正常展示三类匹配。
2. **Skeleton**：切换 Tab/进入子页面 → 短暂显示骨架屏而非"加载中..."。
3. **EmptyState**：收藏/投诉/预约/订单/通知/我的发布 — 在无数据时显示统一空状态（图标 + 文案）。

验证后停止 dev。

- [ ] **Step 3：确认 git 干净**

Run: `git status`
Expected: `nothing to commit, working tree clean`

---

## 附录：本计划不涵盖的内容

- **ScanLine 扫码按钮**：首页搜索栏右侧的扫码按钮暂不实现（无真机摄像头 API），保留为视觉占位。
- **B 端 skeleton**：B 端 App 已用 PageSkeleton，但 B 端页面内部未单独加 skeleton（B 端非本 demo 重点）。
- **桌面端空状态**：桌面端 DataTable 有自己的空状态，不迁移到移动端 EmptyState。
- **搜索结果分页**：SearchResultsPage 一次性展示全部匹配，不做分页（数据量小）。

---

## 执行顺序总结

```
Task 1 (Skeleton 组件) → Task 2 (替换 Suspense fallback) → Task 3 (EmptyState 组件)
→ Task 4 (迁移列表空状态) → Task 5 (接通首页搜索) → Task 6 (收尾验证)
```

Task 1-4 可独立完成。Task 5 较重，放最后。
