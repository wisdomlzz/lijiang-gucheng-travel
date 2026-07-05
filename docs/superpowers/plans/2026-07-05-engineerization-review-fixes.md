# 审查问题修复与工程化收尾 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复代码审查中发现的所有问题——共享组件未集成、硬编码颜色残留、ErrorBoundary 遗漏 B 端、组件 props 与计划不一致——达到可提交的工程质量。

**Architecture:** Feature-first architecture，三端只保留路由壳。本计划只做修复和集成，不重新引入新功能。

**Tech Stack:** TypeScript, React 18, Tailwind CSS v4, Vite

## Global Constraints

- 所有页面迁移已经在上一阶段完成，本计划不改动文件位置。
- 修复优先采用已有的 design token（`text-text-body`、`text-text-tertiary`、`bg-surface-page` 等），不引入新值。
- 每完成一个 Task 运行 `npm run build` 验证。
- 不修改业务逻辑。

---

## 文件变更清单

| 文件 | 操作 | 职责 |
|---|---|---|
| `src/shared/components/mobile/SectionHeader.tsx` | 修改 | icon 类型改为 React.ElementType |
| `src/shared/components/mobile/GridIcon.tsx` | 修改 | 增加 size prop（sm/md） |
| `src/c-end/pages/HomePage.tsx` | 修改 | 用 SectionHeader / GridIcon / InfoListItem 替换内联渲染 |
| `src/b-end/App.tsx` | 修改 | 增加 ErrorBoundary 包裹 |
| `src/features/homepage/c-end/pages/VisitorServicesPage.tsx` | 修改 | 硬编码 `#334155` → `text-text-body`，`#94A3B8` → `text-text-tertiary` |
| `src/features/volunteer/c-end/pages/VolunteerActivitiesPage.tsx` | 修改 | `bg-[#F8F6F3]` → `bg-surface-page` |
| `src/features/volunteer/c-end/pages/VolunteerActivityDetailPage.tsx` | 修改 | 同上 |
| `src/features/volunteer/c-end/pages/VolunteerPlaceholderPage.tsx` | 修改 | 同上 |
| `src/features/homepage/c-end/pages/HomePage.tsx` | 修改 | 集成 SectionHeader / GridIcon / InfoListItem（见 Task 2） |

---

## 依赖关系

```
Task 1 (修复 SectionHeader)
  └── Task 2 (集成到 HomePage)
Task 3 (修复 GridIcon size prop)
  └── Task 2 (集成到 HomePage) — 两组件同时准备好后集成
Task 4 (修复 VisitorServicesPage 硬编码颜色)
Task 5 (修复 Volunteer 页面硬编码背景色)
Task 6 (添加 ErrorBoundary 到 B 端)
Task 7 (最终构建 + 验证)
```

Task 2 依赖 Task 1 和 Task 3 完成。Task 4/5/6 与 Task 1–3 无依赖，可并行。

---

### Task 1：修复 SectionHeader icon 类型

**Files:**
- Modify: `src/shared/components/mobile/SectionHeader.tsx`

**Interfaces:**
- Consumes: 当前 SectionHeaderProps（`icon?: LucideIcon`）
- Produces: 修复后（`icon?: React.ElementType`）

- [ ] **Step 1: 修改 icon 类型**

将 `type LucideIcon` 导入改为 `type React.ElementType`：

```typescript
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import type { ReactElement } from "react";

interface SectionHeaderProps {
  icon?: React.ElementType;
  title: string;
  action?: { label: string; to: string };
}

export function SectionHeader({ icon: Icon, title, action }: SectionHeaderProps) {
  // ... 实现不变
}
```

注意删除 `type LucideIcon` 导入（不再需要）。

- [ ] **Step 2: 验证构建**

```bash
npm run build
# 预期：✓ built in X.XXs
```

- [ ] **Step 3: 提交**

```bash
git add src/shared/components/mobile/SectionHeader.tsx
git commit -m "fix: relax SectionHeader icon type to React.ElementType"
```

---

### Task 2：修复 GridIcon — 增加 size prop

**Files:**
- Modify: `src/shared/components/mobile/GridIcon.tsx`

**Interfaces:**
- Consumes: 当前 GridIconProps
- Produces: GridIconProps 增加 `size?: "sm" | "md"`

- [ ] **Step 1: 增加 size prop**

```typescript
interface GridIconProps {
  imageUrl?: string;
  label: string;
  gradientIndex?: number;
  size?: "sm" | "md";
}

export function GridIcon({ imageUrl, label, gradientIndex = 0, size = "md" }: GridIconProps) {
  const gradient = GRADIENTS[gradientIndex % GRADIENTS.length];
  const containerSize = size === "sm" ? "w-[48px] h-[48px]" : "w-[52px] h-[52px]";
  return (
    <div className={`${containerSize} rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} shadow-card flex items-center justify-center`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label}
          className="w-full h-full object-contain p-1.5 drop-shadow-sm"
          loading="lazy"
        />
      ) : (
        <span className="text-[20px] font-semibold text-white/90">
          {label.charAt(0)}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
# 预期：✓ built in X.XXs
```

- [ ] **Step 3: 提交**

```bash
git add src/shared/components/mobile/GridIcon.tsx
git commit -m "fix: add size prop to GridIcon (sm=48px, md=52px)"
```

---

### Task 3：集成 SectionHeader / GridIcon / InfoListItem / TypeBadge 到 HomePage

**Files:**
- Modify: `src/features/homepage/c-end/pages/HomePage.tsx`
- 间接使用：`src/shared/components/mobile/SectionHeader.tsx`、`GridIcon.tsx`、`InfoListItem.tsx`、`TypeBadge.tsx`（已存在）

**Interfaces:**
- Consumes: `SectionHeader({ icon?, title, action? })`、`GridIcon({ imageUrl?, label, gradientIndex?, size? })`、`InfoListItem({ announcement })`、`TypeBadge({ type, title })`
- Produces: HomePage 使用新组件替换内联代码

- [ ] **Step 1: 更新导入**

在 `HomePage.tsx` 头部，新增：

```typescript
import { SectionHeader } from "@/shared/components/mobile/SectionHeader";
import { GridIcon } from "@/shared/components/mobile/GridIcon";
import { InfoListItem } from "@/shared/components/mobile/InfoListItem";
```

删除不再需要的：`Sparkles`、`Newspaper` 等内联实现用的导入（保留 `Search`, `ScanLine`, `ChevronRight` 等 HomePage 特有的图标）。

- [ ] **Step 2: 替换「推荐攻略」标题区**

找到当前内联的推荐攻略标题渲染（包含 `Sparkles` 图标 + 文本的行），替换为：

```tsx
<SectionHeader
  icon={Sparkles}
  title="推荐攻略"
  action={{ label: "查看更多", to: "/c/routes" }}
/>
```

- [ ] **Step 3: 替换「景区资讯」标题区**

替换当前内联的资讯标题渲染为：

```tsx
<SectionHeader
  icon={Newspaper}
  title="景区资讯"
  action={{ label: "查看更多", to: "/c/news" }}
/>
```

注意：需要在顶部重新导入 `Newspaper`（上一步可能删掉了）。

- [ ] **Step 4: 替换宫格图标内联渲染**

在 `gridPages[gridPage]?.map((item, idx) => {` 内联的现有宫格渲染代码中，将现有的 `w-[52px] h-[52px] rounded-2xl ... bg-gradient-to-br ...` 容器替换为：

```tsx
<GridIcon imageUrl={item.imageUrl} label={item.label} gradientIndex={idx} />
```

同时移除 `GRADIENTS` 常量数组（如果有内联定义的话，HomePage 中 `const GRADIENTS = [...]` 全局定义在上方，现在应删除）。

- [ ] **Step 5: 替换资讯列表内联渲染**

在 `infoVisible.map((ann) => {` 的内联渲染中，将现有的 `<button>` 内容替换为：

```tsx
<InfoListItem announcement={ann} />
```

同时删除 `getBadge` 函数定义（如果 HomePage 中有内联的 getBadge，现在它已被 InfoListItem 内部使用 `TypeBadge` 替代）。

- [ ] **Step 6: 清理不再使用的内联常量和导入**

检查并移除：
- `const GRADIENTS = [...]`（被 `GridIcon` 内部管理）
- `badgeMeta` 对象（被 `getBadge` 函数替代，应保留 `getBadge` 仅用于资讯预过滤？实际上 `InfoListItem` 内部使用 `TypeBadge` + `getBadge`，所以 `badgeMeta` 也不再需要）
- 任何不再引用的 lucide 图标

- [ ] **Step 7: 验证构建**

```bash
npm run build
# 预期：✓ built in X.XXs
```

- [ ] **Step 8: 提交**

```bash
git add src/features/homepage/c-end/pages/HomePage.tsx
git commit -m "refactor: integrate SectionHeader/GridIcon/InfoListItem into HomePage"
```

---

### Task 4：修复 VisitorServicesPage 硬编码颜色

**Files:**
- Modify: `src/features/homepage/c-end/pages/VisitorServicesPage.tsx`

- [ ] **Step 1: 替换硬编码颜色值**

找到第 70 行附近的颜色值并替换：

| 行 | 当前值 | 替换为 |
|---|---|---|
| 70 | `text-[#94A3B8]` | `text-text-tertiary` |
| 82 | `text-[#334155]` | `text-text-body` |

具体定位：
- `className="text-[12px] text-[#94A3B8] font-medium ..."` → `className="text-[12px] text-text-tertiary font-medium ..."`
- `className="text-[12px] text-[#334155] leading-tight"` → `className="text-[12px] text-text-body leading-tight"`

- [ ] **Step 2: 验证构建**

```bash
npm run build
# 预期：✓ built in X.XXs
```

- [ ] **Step 3: 提交**

```bash
git add src/features/homepage/c-end/pages/VisitorServicesPage.tsx
git commit -m "fix: replace hardcoded colors with design tokens in VisitorServicesPage"
```

---

### Task 5：修复 Volunteer 页面硬编码背景色

**Files:**
- Modify: `src/features/volunteer/c-end/pages/VolunteerActivitiesPage.tsx`
- Modify: `src/features/volunteer/c-end/pages/VolunteerActivityDetailPage.tsx`
- Modify: `src/features/volunteer/c-end/pages/VolunteerPlaceholderPage.tsx`

- [ ] **Step 1: 批量替换 `bg-[#F8F6F3]` → `bg-surface-page`**

在三个文件中，将所有 `bg-[#F8F6F3]` 替换为 `bg-surface-page`。

**VolunteerActivitiesPage.tsx** — 两处：
- 第 485 行：`className="min-h-screen bg-[#F8F6F3]"` → `className="min-h-screen bg-surface-page"`
- 第 511 行：同上

**VolunteerActivityDetailPage.tsx** — 两处：
- 第 153 行、第 322 行

**VolunteerPlaceholderPage.tsx** — 两处：
- 第 169 行、第 265 行

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

- [ ] **Step 3: 提交**

```bash
git add src/features/volunteer/c-end/pages/
git commit -m "fix: replace hardcoded #F8F6F3 with bg-surface-page in volunteer pages"
```

---

### Task 6：添加 ErrorBoundary 到 B 端

**Files:**
- Modify: `src/b-end/App.tsx`

- [ ] **Step 1: 增加 ErrorBoundary 导入和包裹**

当前 `src/b-end/App.tsx` 在 `Suspense` 外没有错误边界。修改：

```typescript
import { Suspense, useEffect } from "react"
import { Routes, Route } from "react-router"
import { useAuthStore } from "@/platform/auth"
import { LoginPageB } from "../shared/components/LoginPageB"
import { ServiceApp } from "../features/convenience/b-end/pages/App"
import { RedirectTo } from "../shared/components/RedirectTo"
import { ErrorBoundary } from "../shared/components/ErrorBoundary"

// ... 函数体 return 部分改为：
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex items-center justify-center h-full min-h-[400px] text-sm text-text-tertiary">加载中...</div>}>
      <Routes>
        <Route index element={<RedirectTo to="/b/service/workbench" />} />
        <Route path="service/*" element={<ServiceApp />} />
        <Route path="*" element={<RedirectTo to="/b/service/workbench" />} />
      </Routes>
      </Suspense>
    </ErrorBoundary>
  )
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

- [ ] **Step 3: 提交**

```bash
git add src/b-end/App.tsx
git commit -m "fix: add ErrorBoundary to B-end Suspense wrapper"
```

---

### Task 7：最终构建验证与提交

- [ ] **Step 1: 完整构建**

```bash
npm run build
```

预期：无错误输出。

- [ ] **Step 2: 检查未跟踪文件**

```bash
git status
```

确认 `src/c-end/pages/` 只包含 `AppLayout.tsx`，无意外残留。

- [ ] **Step 3: 范围扫描——检查是否还有遗漏的硬编码色值**

```bash
grep -rn "text-\[#334155\]\|bg-\[#F8F6F3\]\|text-\[#94A3B8\]" src/ --include='*.tsx' --include='*.ts' | grep -v node_modules
```

应返回 0 条。

- [ ] **Step 4: 提交全部**

```bash
git add .
git commit -m "chore: finalize review fixes and build verification"
```

---

## 验证清单

| 验证项 | 预期 |
|---|---|
| `npm run build` | 通过 |
| HomePage 使用 SectionHeader/GridIcon/InfoListItem | 推荐攻略、景区资讯标题用 SectionHeader，宫格用 GridIcon，资讯列表用 InfoListItem |
| `grep -rn "#334155\|#F8F6F3\|#94A3B8" src/` | 0 条硬编码值（除 `LoginPageC.tsx` 等不影响页面的混合固定 icon 色） |
| B 端 App 有 ErrorBoundary | `b-end/App.tsx` 中 `Suspense` 外层包裹 `ErrorBoundary` |
| SectionHeader icon 类型 | `React.ElementType` 而非 `LucideIcon` |
| GridIcon size prop | 支持 `size="sm"`（48px）和 `size="md"`（52px） |

---

## 范围外（本计划不处理但后续可做）

- Feature 交叉导入问题（`merchant-review → content/supplier`）：需要设计共享 store 方案，涉及面广，需单独评估。
- Vitest 测试 / Accessibility 检查：属于质量门禁，建议作为独立 sprint 实施。