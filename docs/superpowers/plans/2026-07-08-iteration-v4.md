# 迭代 v4: 桌面端规范补齐 + 人流量指标扩展 + C 端体验

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐桌面端最后 3 页的搜索/筛选/分页，人流量指标扩展到更多 feature 页面，C 端体验打磨

**Architecture:** 复用已有模式（BookingManagePage 分页模板、CulturalCourtyardDetailPage 人流指标模板），每页独立 commit

**Tech Stack:** React 18, TypeScript, shadcn/ui, Tailwind CSS v4, zustand

## Global Constraints

- 桌面端搜索/筛选/分页模式统一，参考 `ConvenienceStaffPage` 或 `BookingManagePage` 的实现
- 人流指标使用 `useFlowWarningStore` + `useMemo` 街道名称匹配，参考 `CulturalCourtyardDetailPage`
- 所有修改验证 `npm run build` 通过
- 每项独立 commit，方便版本管理

---

## File Structure

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/desktop/pages/gates/MerchantReviewPage.tsx` | 加搜索栏 + 分页 |
| `src/desktop/pages/gates/AnnouncementManagePage.tsx` | 加分页 |
| `src/desktop/pages/gates/PointRulesPage.tsx` | 加搜索、筛选、分页 |
| `src/features/content/c-end/pages/MerchantDetailPage.tsx` | 加人流小指标 |
| `src/features/heritage/c-end/pages/detail/HeritageDetailLayout.tsx` | 加人流小指标 |
| `src/features/housing/c-end/pages/HousingPage.tsx` | 加人流小指标 |
| `src/features/content/c-end/pages/MapPage.tsx` | 加人流小指标 |

---

## Task 1: MerchantReviewPage 加搜索 + 分页

**Files:**
- Modify: `src/desktop/pages/gates/MerchantReviewPage.tsx`

**Interfaces:**
- Consumes: `usePagination` from `@/shared/hooks/usePagination`, `PaginationBar` from `@/shared/components/ui/data-toolbar`
- Produces: 3 个 Tab（全部/待审核/已审核）各有搜索和分页

- [ ] **Step 1: 读 MerchantReviewPage.tsx 找渲染区域**

找到 3 个 Tab 的内容区，确认数据列表变量名

- [ ] **Step 2: 加搜索和分页 imports**

```tsx
import { Input } from "../../../../shared/components/ui/input"
import { Search } from "lucide-react"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
```

- [ ] **Step 3: 加搜索 state + 分页**

在组件顶部加：
```tsx
const [searchQuery, setSearchQuery] = useState("")
```

在获取数据后，渲染前加过滤和分页：
```tsx
const filteredList = useMemo(() => {
  let list = activeTab === "pending" ? pendingRequests : activeTab === "approved" ? approvedRequests : allRequests
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    list = list.filter((r) => 
      r.shopName?.toLowerCase().includes(q) || r.applicantName?.toLowerCase().includes(q) || r.phone?.includes(q)
    )
  }
  return list
}, [allRequests, pendingRequests, approvedRequests, activeTab, searchQuery])

const pagination = usePagination(filteredList, 10)
```

- [ ] **Step 4: 在 Tab 上方加搜索栏**

```tsx
<div className="flex items-center gap-3 mb-4">
  <div className="relative w-64">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
    <Input placeholder="搜索商户名、申请人..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
  </div>
</div>
```

- [ ] **Step 5: 把列表渲染从 `xxx.map` 改为 `pagination.paginatedItems.map`**

替换对应 Tab 中的 `.map` 调用。

- [ ] **Step 6: 在表格下方加分页条**

```tsx
<div className="mt-3 border-t pt-3">
  <PaginationBar page={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} pageSize={10} onPageSizeChange={() => {}} total={pagination.total} />
</div>
```

- [ ] **Step 7: 验证 build**

```bash
npm run build 2>&1 | tail -3
```
Expected: `✓ built`

- [ ] **Step 8: Commit**

```bash
git add src/desktop/pages/gates/MerchantReviewPage.tsx
git commit -m "feat: add search + pagination to MerchantReviewPage"
```

---

## Task 2: AnnouncementManagePage 加分页

**Files:**
- Modify: `src/desktop/pages/gates/AnnouncementManagePage.tsx`

**Interfaces:**
- Consumes: `usePagination` + `PaginationBar`

- [ ] **Step 1: 加分页 imports**

```tsx
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
```

- [ ] **Step 2: 加分页变量**

```tsx
const pagination = usePagination(filteredAnnouncements, 10)
```

- [ ] **Step 3: 替换列表渲染**

将 `filteredAnnouncements.map` 改为 `pagination.paginatedItems.map`

- [ ] **Step 4: 加分页条**

```tsx
<PaginationBar page={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} pageSize={10} onPageSizeChange={() => {}} total={pagination.total} />
```

- [ ] **Step 5: 验证 build + commit**

---

## Task 3: PointRulesPage 加搜索 + 筛选 + 分页

**Files:**
- Modify: `src/desktop/pages/gates/PointRulesPage.tsx`

**Interfaces:**
- Consumes: `usePagination` + `PaginationBar` + `Search` icon + `Input`

- [ ] **Step 1: 读 PointRulesPage.tsx 找规则列表渲染**

确认规则列表变量名（rules 或 filteredRules）

- [ ] **Step 2: 加 imports + state**

```tsx
import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Input } from "../../../../shared/components/ui/input"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"

// 在组件内:
const [searchQuery, setSearchQuery] = useState("")
const [directionFilter, setDirectionFilter] = useState<"all" | "IN" | "OUT">("all")
```

- [ ] **Step 3: 加过滤 + 分页**

```tsx
const filteredList = useMemo(() => {
  let list = rules
  if (directionFilter === "IN") list = list.filter((r) => r.direction === "IN")
  else if (directionFilter === "OUT") list = list.filter((r) => r.direction === "OUT")
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    list = list.filter((r) => r.code?.toLowerCase().includes(q) || r.label?.toLowerCase().includes(q))
  }
  return list
}, [rules, directionFilter, searchQuery])

const pagination = usePagination(filteredList, 10)
```

- [ ] **Step 4: 加搜索栏 + 筛选按钮组**

```tsx
<div className="flex items-center gap-3 mb-4">
  <div className="relative w-64">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
    <Input placeholder="搜索规则..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
  </div>
  <div className="flex gap-1">
    {(["all", "IN", "OUT"] as const).map((d) => (
      <button key={d} onClick={() => setDirectionFilter(d)}
        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${directionFilter === d ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"}`}>
        {d === "all" ? "全部" : d === "IN" ? "增加" : "扣减"}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 5: 替换列表渲染 + 加分页条**

- [ ] **Step 6: 验证 build + commit**

---

## Task 4: 人流量指标 → 商户详情页

**Files:**
- Modify: `src/features/content/c-end/pages/MerchantDetailPage.tsx`

**Interfaces:**
- Consumes: `useFlowWarningStore` + `LEVEL_META` from `@/features/flow-warning/store/flow-warning-store`
- Produces: 商户地址匹配街道后显示人流小 badge

- [ ] **Step 1: 加 imports**

```tsx
import { useFlowWarningStore, LEVEL_META } from "@/features/flow-warning/store/flow-warning-store"
import { useMemo, useEffect } from "react"
```

- [ ] **Step 2: 加 flowAreas + nearbyFlow 逻辑**

```tsx
const flowAreas = useFlowWarningStore((s) => s.areas)
const loadAreas = useFlowWarningStore((s) => s.loadAreas)

const nearbyFlow = useMemo(() => {
  if (!merchant?.address) return null
  const matched = flowAreas.find((a) => merchant.address.includes(a.name.replace("街", "")))
  if (matched) {
    const pct = Math.round((matched.current / matched.capacity) * 100)
    return { name: matched.name, pct, level: matched.level }
  }
  return null
}, [merchant, flowAreas])

useEffect(() => { loadAreas() }, [loadAreas])
```

- [ ] **Step 3: 在地址行附近加人流 badge**

```tsx
{nearbyFlow && (
  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-page text-[10px] mt-1">
    <span className={`size-2 rounded-full ${nearbyFlow.level === "green" ? "bg-emerald-500" : nearbyFlow.level === "yellow" ? "bg-amber-500" : nearbyFlow.level === "orange" ? "bg-orange-500" : "bg-red-500"}`} />
    <span className="text-text-tertiary">{nearbyFlow.name} · 人流{nearbyFlow.pct}%</span>
  </div>
)}
```

- [ ] **Step 4: 验证 build + commit**

---

## Task 5: 人流量指标 → 遗产知识详情页

**Files:**
- Modify: `src/features/heritage/c-end/pages/detail/HeritageDetailLayout.tsx`

**Interfaces:**
- 同 Task 4 模式，在遗产详情 layout 的地址信息附近加人流 badge

- [ ] **Step 1: 加 imports + flowArea 逻辑**

找到 `HeritageDetailLayout` 组件，在 item 的 location 附近加人流匹配

- [ ] **Step 2: 加人流 badge**

- [ ] **Step 3: 验证 build + commit**

---

## Task 6: 人流量指标 → 地图页

**Files:**
- Modify: `src/features/content/c-end/pages/MapPage.tsx`

**Interfaces:**
- 地图页已有 `useFlowWarningStore` 的 import，只需加展示

- [ ] **Step 1: 在地图显眼位置加人流总览**

```tsx
{areas.length > 0 && (
  <div className="absolute top-4 left-4 right-4 z-10 bg-white/90 backdrop-blur rounded-2xl p-3 shadow-elevated">
    <div className="flex items-center justify-between text-[12px]">
      <span className="font-medium">古城人流</span>
      <span className="text-text-tertiary">
        {areas.filter(a => a.level === "red" || a.level === "orange").length > 0 ? "部分区域拥挤" : "各区域通畅"}
      </span>
    </div>
    <div className="flex gap-2 mt-2">
      {areas.slice(0, 7).map((a) => (
        <div key={a.id} className="flex items-center gap-1 text-[10px]">
          <span className={`size-2 rounded-full ${a.level === "green" ? "bg-emerald-500" : a.level === "yellow" ? "bg-amber-500" : a.level === "orange" ? "bg-orange-500" : "bg-red-500"}`} />
          <span className="text-text-tertiary">{a.name}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 2: 验证 build + commit**

---

## Task 7: C 端骨架屏覆盖

**Files:**
- Modify: 各页面（按需）

**Interfaces:**
- Consumes: `Skeleton` from `@/shared/components/ui/skeleton`
- 替换文字 "加载中..." 为骨架屏

- [ ] **Step 1: 找所有用 "加载中..." 的页面**

```bash
grep -rn "加载中" src/features/ --include="*.tsx" | grep -v "lazy\|Suspense" | head -20
```

- [ ] **Step 2: 替换为骨架屏**

```tsx
import { Skeleton } from "@/shared/components/ui/skeleton"
// 替换:
// <div className="text-center py-8">加载中...</div>
// 为:
// <div className="space-y-3 p-4"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
```

- [ ] **Step 3: 验证 build + commit**

---

## 完成标准

- [ ] MerchantReviewPage 有搜索栏 + 分页
- [ ] AnnouncementManagePage 有分页
- [ ] PointRulesPage 有搜索、筛选、分页
- [ ] 商户详情页有街道人流指标
- [ ] 遗产知识详情页有街道人流指标
- [ ] 地图页有人流总览
- [ ] 骨架屏替代 "加载中..."
- [ ] Build 通过