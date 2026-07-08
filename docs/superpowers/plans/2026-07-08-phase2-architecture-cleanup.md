# 阶段二：架构打磨 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 Desktop 页面归属归一化（content + supplier → 对应 feature/desktop/pages/）和 Top 大文件拆分

**Architecture:** 保持路由 path 不变，只移动物理文件和更新 import 路径。先做文件移动（低风险），再做文件拆分（参照已有 VolunteerManagePage 拆分范例）。

**Tech Stack:** React 18, TypeScript, Feature-First Architecture

---

## 文件结构总览

### 迁移：content → src/features/content/desktop/pages/

创建：
```
src/features/content/desktop/pages/
├── ContentManagePage.tsx       （从 src/desktop/pages/gates/ContentManagePage.tsx 迁入）
├── NewsManageContent.tsx       （从 src/desktop/pages/gates/content/NewsManageContent.tsx 迁入）
├── RouteManageContent.tsx      （从 src/desktop/pages/gates/content/RouteManageContent.tsx 迁入）
├── CourtyardManageContent.tsx  （从 src/desktop/pages/gates/content/CourtyardManageContent.tsx 迁入）
├── MerchantManageContent.tsx   （从 src/desktop/pages/gates/content/MerchantManageContent.tsx 迁入）
├── POIManageContent.tsx        （从 src/desktop/pages/gates/content/POIManageContent.tsx 迁入）
└── HousingManageContent.tsx    （从 src/desktop/pages/gates/content/HousingManageContent.tsx 迁入）
```

### 迁移：supplier → src/features/supplier/desktop/pages/

创建：
```
src/features/supplier/desktop/pages/
├── SupplierEntryDesktop.tsx    （从 src/desktop/pages/supplier-applications/SupplierEntryDesktop.tsx 迁入）
├── list.tsx                    （从 src/desktop/pages/supplier-applications/list.tsx 迁入）
└── show.tsx                    （从 src/desktop/pages/supplier-applications/show.tsx 迁入）
```

### 不迁移

以下文件保留在原位（非 feature 特有，或全局功能）：
- `src/desktop/pages/gates/BannerManagePage.tsx`
- `src/desktop/pages/gates/GridSettingsPage.tsx`
- `src/desktop/pages/gates/MerchantReviewPage.tsx`
- `src/desktop/pages/gates/PointRulesPage.tsx`
- `src/desktop/pages/gates/AnnouncementManagePage.tsx`
- `src/desktop/pages/RequirementPage.tsx`
- `src/desktop/pages/photo-records/`
- `src/desktop/pages/Workbench.tsx`
- `src/desktop/pages/SystemConfigPage.tsx`
- `src/desktop/pages/AIKnowledgeBasePage.tsx`

---

### Task 1: 迁移 content 桌面页到 feature 目录

**说明：** 将 ContentManagePage 及其 6 个子组件从 `src/desktop/pages/gates/` 搬入 `src/features/content/desktop/pages/`。

- [ ] **Step 1: 创建目标目录**

```bash
mkdir -p src/features/content/desktop/pages
```

- [ ] **Step 2: 复制文件到新位置**

```bash
# content 子组件
cp src/desktop/pages/gates/content/NewsManageContent.tsx src/features/content/desktop/pages/NewsManageContent.tsx
cp src/desktop/pages/gates/content/RouteManageContent.tsx src/features/content/desktop/pages/RouteManageContent.tsx
cp src/desktop/pages/gates/content/CourtyardManageContent.tsx src/features/content/desktop/pages/CourtyardManageContent.tsx
cp src/desktop/pages/gates/content/MerchantManageContent.tsx src/features/content/desktop/pages/MerchantManageContent.tsx
cp src/desktop/pages/gates/content/POIManageContent.tsx src/features/content/desktop/pages/POIManageContent.tsx
cp src/desktop/pages/gates/content/HousingManageContent.tsx src/features/content/desktop/pages/HousingManageContent.tsx

# ContentManagePage 容器
cp src/desktop/pages/gates/ContentManagePage.tsx src/features/content/desktop/pages/ContentManagePage.tsx
```

- [ ] **Step 3: 更新 ContentManagePage.tsx 中的 import 路径**

在新文件 `src/features/content/desktop/pages/ContentManagePage.tsx` 中，修改 import 路径：

```diff
  import { useState } from "react"
- import { PageLayout } from "../../components/common/PageLayout"
+ import { PageLayout } from "../../../desktop/components/common/PageLayout"
- import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../shared/components/ui/tabs"
+ import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../../shared/components/ui/tabs"
- import { NewsManageContent } from "./content/NewsManageContent"
+ import { NewsManageContent } from "./NewsManageContent"
- import { RouteManageContent } from "./content/RouteManageContent"
+ import { RouteManageContent } from "./RouteManageContent"
- import { CourtyardManageContent } from "./content/CourtyardManageContent"
+ import { CourtyardManageContent } from "./CourtyardManageContent"
- import { MerchantManageContent } from "./content/MerchantManageContent"
+ import { MerchantManageContent } from "./MerchantManageContent"
- import { POIManageContent } from "./content/POIManageContent"
+ import { POIManageContent } from "./POIManageContent"
- import { HousingManageContent } from "./content/HousingManageContent"
+ import { HousingManageContent } from "./HousingManageContent"
```

注意：PageLayout 等共享组件从 `desktop/components/common/` 引用，通过 `../../../desktop/` 向上回溯到 `src/desktop/`。Tabs 等 UI 组件通过 `../../../../shared/` 回溯。

- [ ] **Step 4: 更新 6 个子组件的 import 路径**

逐一检查并修改 6 个 content 子组件文件中的 import 路径。它们通常引用 `PageLayout`、通用组件或 UI 组件。每个文件的 import 路径需要向上回溯到 `src/`。

**通用规则**（文件在 `src/features/content/desktop/pages/` 下）：
- `src/desktop/components/common/` → `../../../../desktop/components/common/`
- `src/shared/components/ui/` → `../../../../shared/components/ui/`
- `@/desktop/components/` → 替换为相对路径 `../../../../desktop/components/`

实际 import 路径以各文件的真实引用为准。对每个文件执行：
```bash
grep -n "from.*\"\.\.\/" src/features/content/desktop/pages/NewsManageContent.tsx | head -5
```
对于任何 `../` 开头的 import，按上述回溯规则调整。

- [ ] **Step 5: 更新 src/desktop/App.tsx 中的 lazy import**

```diff
  const ContentManagePage = lazy(() =>
-   import("./pages/gates/ContentManagePage").then((m) => ({ default: m.ContentManagePage }))
+   import("../features/content/desktop/pages/ContentManagePage").then((m) => ({ default: m.ContentManagePage }))
  )
```

- [ ] **Step 6: 删除旧目录中的源文件**

```bash
rm src/desktop/pages/gates/content/NewsManageContent.tsx
rm src/desktop/pages/gates/content/RouteManageContent.tsx
rm src/desktop/pages/gates/content/CourtyardManageContent.tsx
rm src/desktop/pages/gates/content/MerchantManageContent.tsx
rm src/desktop/pages/gates/content/POIManageContent.tsx
rm src/desktop/pages/gates/content/HousingManageContent.tsx
# 注意：ContentManagePage.tsx 本身也在 gates/ 下，删除它
rm src/desktop/pages/gates/ContentManagePage.tsx
# 如果 content 目录空了
rmdir src/desktop/pages/gates/content 2>/dev/null || true
```

- [ ] **Step 7: 验证构建**

```bash
npm run build
npm run typecheck
```
Expected: Build 通过

- [ ] **Step 8: Commit**

```bash
git add src/features/content/desktop/pages/ src/desktop/App.tsx src/desktop/pages/gates/
git commit -m "refactor: migrate content desktop pages to features/content/desktop/pages/"
```

---

### Task 2: 迁移 supplier 桌面页到 feature 目录

**说明：** 将 3 个 supplier 相关页面从 `src/desktop/pages/supplier-applications/` 搬入 `src/features/supplier/desktop/pages/`。

- [ ] **Step 1: 创建目标目录**

```bash
mkdir -p src/features/supplier/desktop/pages
```

- [ ] **Step 2: 复制文件到新位置**

```bash
cp src/desktop/pages/supplier-applications/SupplierEntryDesktop.tsx src/features/supplier/desktop/pages/SupplierEntryDesktop.tsx
cp src/desktop/pages/supplier-applications/list.tsx src/features/supplier/desktop/pages/list.tsx
cp src/desktop/pages/supplier-applications/show.tsx src/features/supplier/desktop/pages/show.tsx
```

- [ ] **Step 3: 更新 import 路径**

对每个文件检查并更新 import 路径。`list.tsx` 和 `show.tsx` 中可能有相对路径引用 `../SupplierEntryDesktop` 或 `../../components/` 或 `../shared/`。

**通用规则**（文件在 `src/features/supplier/desktop/pages/` 下）：
- `src/desktop/components/common/` → `../../../../desktop/components/common/`
- `src/shared/components/ui/` → `../../../../shared/components/ui/`
- `src/features/.../` → `../../../../features/.../`
- `src/api/` → `../../../../api/`

执行检查和修改：
```bash
# 找出需要修改的 import 路径
for f in src/features/supplier/desktop/pages/*.tsx; do
  echo "=== $f ==="
  grep -n "from.*\"\.\." "$f" | head -10
done
```

手动更新每个 import 路径，使其从新的文件位置正确解析。

- [ ] **Step 4: 更新 src/desktop/App.tsx 中的 lazy import**

```diff
  const SupplierApplicationsList = lazy(() =>
-   import("./pages/supplier-applications/list")
+   import("../features/supplier/desktop/pages/list")
  )
  const SupplierApplicationsShow = lazy(() =>
-   import("./pages/supplier-applications/show")
+   import("../features/supplier/desktop/pages/show")
  )
  const SupplierEntryDesktop = lazy(() =>
-   import("./pages/supplier-applications/SupplierEntryDesktop").then((m) => ({ default: m.SupplierEntryDesktop }))
+   import("../features/supplier/desktop/pages/SupplierEntryDesktop").then((m) => ({ default: m.SupplierEntryDesktop }))
  )
```

- [ ] **Step 5: 删除旧目录中的源文件**

```bash
rm src/desktop/pages/supplier-applications/SupplierEntryDesktop.tsx
rm src/desktop/pages/supplier-applications/list.tsx
rm src/desktop/pages/supplier-applications/show.tsx
rmdir src/desktop/pages/supplier-applications 2>/dev/null || true
```

- [ ] **Step 6: 验证构建**

```bash
npm run build
npm run typecheck
```
Expected: Build 通过

- [ ] **Step 7: Commit**

```bash
git add src/features/supplier/desktop/pages/ src/desktop/App.tsx src/desktop/pages/supplier-applications/
git commit -m "refactor: migrate supplier desktop pages to features/supplier/desktop/pages/"
```

---

### Task 3: 拆分 ConvenienceStaffPage（804 行 → ~270 行 parent + 3 子组件）

**文件：**
- Modify: `src/features/convenience/desktop/pages/ConvenienceStaffPage.tsx`
- Create: `src/features/convenience/desktop/pages/staff/StaffList.tsx`
- Create: `src/features/convenience/desktop/pages/staff/StaffDetail.tsx`
- Create: `src/features/convenience/desktop/pages/staff/StaffForm.tsx`

**说明：** 参照 VolunteerManagePage 拆分模式（1686→460 行 parent + 15 子组件），按 Tab 拆分。先读文件确认当前结构。

- [ ] **Step 1: 读 ConvenienceStaffPage，确认 Tab 结构**

```bash
wc -l src/features/convenience/desktop/pages/ConvenienceStaffPage.tsx
grep -n "const.*=.*useState" src/features/convenience/desktop/pages/ConvenienceStaffPage.tsx | head -10
grep -n "return\|<div\|<Tab\|<button" src/features/convenience/desktop/pages/ConvenienceStaffPage.tsx | head -20
```

观察有哪些 Tab（通常有"人员列表"、"待审核"、"已禁用"等）和各 Tab 对应的渲染代码块。

- [ ] **Step 2: 创建子组件目录**

```bash
mkdir -p src/features/convenience/desktop/pages/staff
```

- [ ] **Step 3: 提取第一个 Tab 组件到 StaffList.tsx**

在 parent 文件中找到第一个 Tab 的渲染代码块，提取为独立组件。

**StaffList.tsx 模板：**
```tsx
import type { StaffMember } from "../../store" // 根据实际类型路径调整
// 其他 import 根据提取代码的实际依赖确定

interface StaffListProps {
  staff: StaffMember[]
  onViewDetail: (id: string) => void
  onToggleStatus: (id: string, active: boolean) => void
}

export function StaffList({ staff, onViewDetail, onToggleStatus }: StaffListProps) {
  // 粘贴从 parent 提取的 JSX 代码
  // 将原来的 state 和 handler 改为 props
}
```

具体内容取决于 ConvenienceStaffPage 的实际代码，提取后：
1. 将 `useState` / 局部变量移到 parent 或在当前组件内保持
2. 回调用 props 传回 parent
3. 删除提取部分在 parent 中的代码，替换为 `<StaffList ... />`

- [ ] **Step 4: 提取第二个 Tab 组件到 StaffDetail.tsx**

- [ ] **Step 5: 提取第三个 Tab 组件到 StaffForm.tsx**

- [ ] **Step 6: 精简 parent，更新 import**

parent 文件最终应包含：
1. 共同 state（activeTab、选中项等）
2. 3 个子组件的 import
3. Tab 切换逻辑
4. 简化的 JSX 骨架

预计 parent 降到 ~250-300 行。

- [ ] **Step 7: 验证构建**

```bash
npm run build
npm run typecheck
```
Expected: Build 通过

- [ ] **Step 8: Commit**

```bash
git add src/features/convenience/desktop/pages/ConvenienceStaffPage.tsx src/features/convenience/desktop/pages/staff/
git commit -m "refactor: split ConvenienceStaffPage (804→~270 lines parent + 3 sub-components)"
```

---

### Task 4: 拆分 ConveniencePage（801 行 → ~270 行 parent + 3 子组件）

**文件：**
- Modify: `src/features/convenience/desktop/pages/ConveniencePage.tsx`
- Create: `src/features/convenience/desktop/pages/orders/OrderPool.tsx`
- Create: `src/features/convenience/desktop/pages/orders/ManualDispatch.tsx`
- Create: `src/features/convenience/desktop/pages/orders/ReviewPanel.tsx`

**说明：** 按 Tab（订单池/手动派单/审核面板）拆分，步骤同 Task 3。

- [ ] **Step 1: 读 ConveniencePage，确认 Tab 和区域结构**

```bash
wc -l src/features/convenience/desktop/pages/ConveniencePage.tsx
grep -n "const.*=.*useState\|const.*Tab\|\/\/.*Tab\|<Tab" src/features/convenience/desktop/pages/ConveniencePage.tsx | head -15
```

- [ ] **Step 2: 创建子组件目录**

```bash
mkdir -p src/features/convenience/desktop/pages/orders
```

- [ ] **Step 3-5: 按 Tab 提取三个子组件**

**提取步骤（每个 Tab 相同）：**
1. 从 parent 找到该 Tab 对应的 JSX 代码块
2. 创建子组件文件，把代码粘贴进去
3. 通过 props 接收回调和数据
4. parent 中用子组件替换提取的代码

```tsx
// OrderPool.tsx 模板
interface OrderPoolProps {
  orders: ConvenienceOrder[]
  onSelectOrder: (id: string) => void
  onDispatch: (orderId: string, staffId: string) => void
}

export function OrderPool({ orders, onSelectOrder, onDispatch }: OrderPoolProps) {
  // 粘贴提取的代码
}
```

```tsx
// ManualDispatch.tsx 模板
interface ManualDispatchProps {
  pendingOrders: ConvenienceOrder[]
  availableStaff: StaffMember[]
  onAssign: (orderId: string, staffId: string) => void
}

export function ManualDispatch({ pendingOrders, availableStaff, onAssign }: ManualDispatchProps) {
  // 粘贴提取的代码
}
```

```tsx
// ReviewPanel.tsx 模板
interface ReviewPanelProps {
  // 根据实际代码确定 props
}

export function ReviewPanel({ }: ReviewPanelProps) {
  // 粘贴提取的代码
}
```

- [ ] **Step 6: 精简 parent**

最终 parent 应包含 state 管理 + 三个子组件的组合。

- [ ] **Step 7: 验证构建**

```bash
npm run build
npm run typecheck
```
Expected: Build 通过

- [ ] **Step 8: Commit**

```bash
git add src/features/convenience/desktop/pages/ConveniencePage.tsx src/features/convenience/desktop/pages/orders/
git commit -m "refactor: split ConveniencePage (801→~270 lines parent + 3 sub-components)"
```

---

### 完成标准

- [ ] `src/features/content/desktop/pages/` 下有 7 个文件（ContentManagePage + 6 子组件）
- [ ] `src/features/supplier/desktop/pages/` 下有 3 个文件
- [ ] `src/desktop/pages/gates/content/` 已删除
- [ ] `src/desktop/pages/supplier-applications/` 已删除
- [ ] `src/desktop/App.tsx` 中 import 路径指向新位置
- [ ] `npm run build` 通过
- [ ] ConvenienceStaffPage parent < 350 行，有 3 个子组件
- [ ] ConveniencePage parent < 350 行，有 3 个子组件
- [ ] 每个拆分都独立 commit