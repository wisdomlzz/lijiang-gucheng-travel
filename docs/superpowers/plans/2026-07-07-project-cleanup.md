# 项目清理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清除项目中的死路由、死页面、死代码，内联瘦路由文件

**Architecture:** 分三阶段：先清死文件（无风险）→ 修瘦路由（低风险）→ 提公共代码（中风险）。每步都验证 build。

**Tech Stack:** React 18, TypeScript, Express + better-sqlite3

## Global Constraints

- 删除文件前确认该文件在项目中 0 引用（grep 验证）
- 每次删除/修改后验证 `npm run build` 通过
- 不改业务逻辑，只做清理
- 不修改三端路由定义的行为（只删确认为死的路由注册）

---

## File Structure

### 删除文件

| 文件 | 原因 |
|------|------|
| `src/desktop/pages/gates/AuditPage.tsx` | 纯 mock 审计页，0 引用 |
| `src/desktop/pages/gates/FlowWarningPage.tsx` | 旧版人流量预警页，0 引用 |
| `src/features/convenience/desktop/pages/FlowWarningPage.tsx` | 新版人流量预警，route 已移除，0 引用 |
| `server/routes/announcements.js` | 5 行瘦文件，可内联 |
| `server/routes/flow-warnings.js` | 5 行瘦文件，可内联 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/features/convenience/b-end/pages/App.tsx` | 删除 `path="quote"` 死路由 |
| `src/features/info/c-end/pages/MyPostsPage.tsx` | 修复 FAB 导航死链接 |
| `server/index.js` | 内联 announcements + flow-warnings 路由 |
| `src/api/client.ts` | 抽 `crudApi()` 工厂函数，减少重复 |
| `src/c-end/routes.tsx` | 抽 `lazyImport()` 辅助函数，减少重复 |
| `src/features/*/store/index.ts` | 删除无价值的 barrel 文件 |

---

## Task 1: 删除死文件（AuditPage + 两个 FlowWarningPage）

**Files:**
- Delete: `src/desktop/pages/gates/AuditPage.tsx`
- Delete: `src/desktop/pages/gates/FlowWarningPage.tsx`
- Delete: `src/features/convenience/desktop/pages/FlowWarningPage.tsx`

**Interfaces:**
- Produces: 3 个文件从项目中消失，build 不受影响

- [ ] **Step 1: 验证 AuditPage 0 引用**

```bash
grep -rn "AuditPage" src/ --include="*.tsx" --include="*.ts"
```
Expected: 只有 `AuditPage.tsx` 自身的定义（`export default function AuditPage`），无其他引用

- [ ] **Step 2: 验证旧版 FlowWarningPage 0 引用**

```bash
grep -rn "gates/FlowWarningPage\|FlowWarningPage" src/ --include="*.tsx" --include="*.ts" | grep -v "convenience/desktop"
```
Expected: 只有自身定义

- [ ] **Step 3: 验证新版 FlowWarningPage 0 引用**

```bash
grep -rn "convenience/desktop/pages/FlowWarningPage" src/ --include="*.tsx" --include="*.ts"
```
Expected: 无输出

- [ ] **Step 4: 删除 3 个文件**

```bash
rm src/desktop/pages/gates/AuditPage.tsx
rm src/desktop/pages/gates/FlowWarningPage.tsx
rm src/features/convenience/desktop/pages/FlowWarningPage.tsx
```

- [ ] **Step 5: 验证 build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built in X.XXs`，无错误

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove 3 dead files (AuditPage, old/new FlowWarningPage)"
```

---

## Task 2: 删除死路由（B 端 quote 路由 + C 端 /c/info/create 导航）

**Files:**
- Modify: `src/features/convenience/b-end/pages/App.tsx`
- Modify: `src/features/info/c-end/pages/MyPostsPage.tsx`

**Interfaces:**
- Produces: B 端 quote 路由被删；C 端不再导航到不存在的路由

- [ ] **Step 1: 删除 B 端 quote 路由**

在 `src/features/convenience/b-end/pages/App.tsx` 找到并删除：
```tsx
<Route path="quote" element={<QuoteAndPhotoFlow {...({} as any)} />} />
```

同时删除 `QuoteAndPhotoFlow` import（如果不再被其他 route 使用，但因为它在 `ServiceOrderDetail.tsx` 中被直接 import 作为 modal 组件，route 的 import 行可以删，但顶层 import 要保留）。

- [ ] **Step 2: 修复 C 端 MyPostsPage 的 FAB 导航**

在 `src/features/info/c-end/pages/MyPostsPage.tsx` 找到类似：
```tsx
navigate("/c/info/create")
```
替换为：
```tsx
toast.info("发布功能即将上线")
```
（需要 `import { toast } from "sonner"`，如果尚未导入）

- [ ] **Step 3: 验证 build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built in X.XXs`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove dead routes (B-end quote route, C-end /c/info/create nav)"
```

---

## Task 3: 内联 5 行瘦路由文件

**Files:**
- Delete: `server/routes/announcements.js`
- Delete: `server/routes/flow-warnings.js`
- Modify: `server/index.js`

**Interfaces:**
- Produces: 2 个文件消失，功能等价位内联 crudRoutes 调用

- [ ] **Step 1: 读取 announcements.js 确认只有 crudRoutes**

```bash
cat server/routes/announcements.js
```
Expected: 只有 `crudRoutes("announcements", { filters: ["status"] })` 之类的调用

- [ ] **Step 2: 读取 flow-warnings.js 确认只有 crudRoutes**

```bash
cat server/routes/flow-warnings.js
```

- [ ] **Step 3: 在 server/index.js 找到这两个 import 和 app.use 行**

```bash
grep -n "announcements\|flow-warnings" server/index.js
```

- [ ] **Step 4: 删除两个 import 行和 app.use 行**

将：
```js
import announcementsRoutes from "./routes/announcements.js"
import flowWarningsRoutes from "./routes/flow-warnings.js"
```
和：
```js
app.use("/api/v1/announcements", announcementsRoutes)
app.use("/api/v1/flow-warnings", flowWarningsRoutes)
```
替换为：
```js
app.use("/api/v1/announcements", crudRoutes("announcements", { filters: ["status"] }))
app.use("/api/v1/flow-warnings", crudRoutes("flow_warnings"))
```
注意：`flow_warnings` vs `flow-warnings`——确认 DB 表名和 API 路径名

- [ ] **Step 5: 删除两个路由文件**

```bash
rm server/routes/announcements.js server/routes/flow-warnings.js
```

- [ ] **Step 6: 启动 server 验证**

```bash
node server/index.js &
sleep 2
curl -s http://localhost:3001/api/v1/announcements | head -c 200
curl -s http://localhost:3001/api/v1/flow-warnings | head -c 200
kill %1
```
Expected: 返回 JSON 数组（可能是空数组 `[]`）

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: inline 5-line routes/announcements.js and routes/flow-warnings.js into index.js"
```

---

## Task 4: 抽 crudApi() 工厂函数减少重复

**Files:**
- Modify: `src/api/client.ts`

**Interfaces:**
- Consumes: `api.list/get/create/update/remove/post` — 已有 API 客户端
- Produces: `crudApi(resource, overrides?)` 工厂函数 + 重构后的 16 个 API 对象

- [ ] **Step 1: 添加 crudApi 工厂函数**

在 `src/api/client.ts` 的 `api` 对象定义之后，现有各个 `xxxApi` 之前，加入：

```ts
// 通用 CRUD API 工厂
function crudApi<T = any>(resource: string, overrides?: Record<string, (...args: any[]) => Promise<T>>) {
  return {
    list: (params?: ListParams) => api.list<T[]>(resource, params),
    get: (id: string | number) => api.get<T>(resource, id),
    create: (data: unknown) => api.create<T>(resource, data),
    update: (id: string | number, data: unknown) => api.update<T>(resource, id, data),
    remove: (id: string | number) => api.remove(resource, id),
    ...overrides,
  }
}
```

- [ ] **Step 2: 重构简单 API 对象**

将只有标准 CRUD 的对象替换为 `crudApi()` 调用。例如：
```ts
export const staffApi = crudApi("staff")
export const pointsApi = {
  ...crudApi("points/rules"),
  account: (uid: string) => api.get("points/account", uid),
  transact: (d: any) => api.post("points", "/transact", d),
}
```

需要重构的纯 CRUD 对象：`staffApi`, `reviewsApi`, `volunteerApi`, `favoritesApi`, `addressesApi`, `bookingsApi`, `supplierApi`, `merchantRegApi`, `gridApi`, `bannersApi`, `aiKnowledgeApi`, `contentApi`（含子对象）

保留自定义方法较多的对象：`ordersApi`, `complaintsApi`, `trustApi`, `pointsApi`

- [ ] **Step 3: 验证类型**

```bash
npx tsc --noEmit 2>&1 | grep "client.ts" | head -5
```
Expected: 无或只有 pre-existing 错误

- [ ] **Step 4: Commit**

```bash
git add src/api/client.ts
git commit -m "refactor: introduce crudApi() factory, reduce API boilerplate by ~60%"
```

---

## Task 5: 抽 lazyImport() 辅助函数

**Files:**
- Modify: `src/c-end/routes.tsx`

**Interfaces:**
- Produces: `lazyImport()` 函数，减少重复的 `.then(m => ({ default: m.X }))` 模式

- [ ] **Step 1: 在文件顶部添加 helper**

```tsx
function lazyImport<T extends { [key: string]: any }>(importFn: () => Promise<T>, name: keyof T) {
  return lazy(() => importFn().then((m) => ({ default: m[name] })))
}
```

- [ ] **Step 2: 替换所有静态 lazy 声明**

将：
```tsx
const ComplaintFormPage = lazy(() =>
  import("../features/complaints/c-end/pages/ComplaintFormPage").then((m) => ({ default: m.ComplaintFormPage }))
)
```
替换为：
```tsx
const ComplaintFormPage = lazyImport(() => import("../features/complaints/c-end/pages/ComplaintFormPage"), "ComplaintFormPage")
```

批量替换文件中所有 50+ 个类似的 lazy import。注意有些声明比较长（多行），要逐个替换。

需要特殊处理的（已用 `.default` 或有 `.then((m) => ({ default: m.Workbench }))` 变体的）：
- `Workbench` — 来自 `./pages/Workbench`，用 `.then((m) => ({ default: m.Workbench }))`
- 所有其他约 46 个声明

- [ ] **Step 3: 验证 build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built in X.XXs`

- [ ] **Step 4: Commit**

```bash
git add src/c-end/routes.tsx
git commit -m "refactor: add lazyImport() helper, reduce route boilerplate by ~200 lines"
```

---

## Task 6: 删无价值 store barrel 文件

**Files:**
- Modify: 各 feature 中直接引用 store 的 import 路径
- Delete: 所有无价值的 `store/index.ts`

**Interfaces:**
- Consumes: 当前代码引用 `@/features/X/store`（经 index.ts barrel）
- Produces: 改为直接引用 `@/features/X/store/store` 或 `@/features/X/store/Y-store`
- 注意：有些 barrel 导出多个 store 或类型，需要确认再操作

**需要检查的 barrel：**

| Feature | barrel 路径 | 导出内容 | 是否可删 |
|---------|------------|----------|---------|
| `address` | `store/index.ts` | 重导出 store hook | 可删 |
| `ai-knowledge` | `store/index.ts` | 重导出 store + actions | 可删 |
| `announcement` | `store/index.ts` | 重导出 store | 可删 |
| `booking` | `store/index.ts` | 重导出 store | 可删 |
| `checkin` | `store/index.ts` | 重导出 2 个 store | 可删 |
| `complaints` | `store/index.ts` | 重导出 store + 类型 | ⚠️ 还导出类型 |
| `convenience` | `store/index.ts` | 重导出 11 个模块 | ❌ 有价值的聚合 |
| `favorite` | `store/index.ts` | 重导出 store | 可删 |
| `flow-warning` | `store/index.ts` | 重导出 store + 类型 | ⚠️ 还导出类型 |
| `homepage` | `store/index.ts` | 重导出 store | 可删 |
| `housing` | `store/index.ts` | 重导出 store | 可删 |
| `merchant-review` | `store/index.ts` | 重导出多个 store | ⚠️ 聚合多个 |
| `points` | `store/index.ts` | 重导出 store + 类型 | ⚠️ 还导出类型 |
| `supplier` | `store/index.ts` | 重导出 store | 可删 |
| `trust-score` | `store/index.ts` | 重导出 2 个 store | ⚠️ 聚合多个 |
| `volunteer` | `store/index.ts` | 重导出 store + 类型 | ⚠️ 还导出类型 |

- [ ] **Step 1: 选择可删的 barrel（纯重导无额外导出）**

首选清理的：`address`, `ai-knowledge`, `announcement`, `booking`, `favorite`, `homepage`, `housing`, `supplier`

- [ ] **Step 2: 替换所有 import 路径**

grep 找出所有 `from "@/features/xxx/store"` 或 `from "../../store"`（不用 index 路径）并改为具体文件名。
同时删除 barrel 文件。

- [ ] **Step 3: 验证 build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove shallow store barrel files, use direct import paths"
```

---

## 完成标准

- [ ] `AuditPage.tsx`, 2 个 `FlowWarningPage.tsx` 从代码库消失
- [ ] B 端 quote 死路由删除
- [ ] C 端 `/c/info/create` 死导航修复
- [ ] `announcements.js`, `flow-warnings.js` 内联到 `index.js`
- [ ] `client.ts` 用 `crudApi()` 工厂减少重复
- [ ] `c-end/routes.tsx` 用 `lazyImport()` 减少重复
- [ ] 无价值 barrel 文件删除，import 路径更新
- [ ] Build 通过