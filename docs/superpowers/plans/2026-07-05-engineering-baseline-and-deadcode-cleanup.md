# 工程基线 + 死代码清扫 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 每完成一个 Task 必须 `npm run build` 通过后再 commit。

**Goal:** 在 feature-first 架构已完成的基础上，清扫死代码、修复 feature 边界违规、建立 ESLint/Prettier/TypeScript/Vitest 工程门禁，使代码库干净、可 lint、可 typecheck、可测试。

**Architecture:** 纯重构 + 工具链补全。不改变任何业务行为。所有改动后 `npm run build` 必须通过，页面行为不变。

**Tech Stack:** TypeScript 5, React 18, Vite 6, Vitest 4, ESLint 9 (flat config), Prettier 3, Tailwind CSS v4

## Global Constraints

- **不修改业务逻辑** — 只移动文件、调整导入、补类型、加配置。
- **路径别名** `@/*` → `src/*`（tsconfig.json + vite.config.ts 已同步，不要动）。
- **依赖纪律**：feature 之间不能互相 import；需要共享时抽到 `platform/` 或 `shared/`。
- **每个 Task 结束必须满足**：`npm run build` 通过 + 该 Task 的 `git commit` 已执行。
- **提交信息前缀**：用 `chore:` / `refactor:` / `feat:` 等常规前缀，中文描述。
- **不要提交 `dist/`** — Task 1 会把它从 git 索引移除。
- **不要运行 `npm run deploy`** — 本地无部署脚本。

## 文件结构总览

本计划涉及的文件操作分类：

| 类别 | 操作 | 文件 |
|---|---|---|
| 死代码删除 | 删除 | `dist/`(从 git 索引)、`src/features/trust-score/`、`src/features/convenience/c-end/components/PageHeader.tsx` |
| 边界归位 | 移动 | `ContactSheet` → `shared/components/mobile/`；`SupplierEntryPage` → `features/supplier/c-end/pages/`；`auth-store` → `platform/auth/store.ts` |
| 工程配置 | 新建 | `eslint.config.js`、`.prettierrc.json`、`.github/workflows/ci.yml`、`verification/tests/business-flow.spec.ts` |
| 工程配置 | 修改 | `package.json`（scripts + devDeps）、`tsconfig.json`（include verification） |
| 类型修复 | 修改 | 19 处 `any`/`@ts-ignore`，逐处替换为正确类型 |

---

## Phase 1：死代码清扫

### Task 1：从 git 索引移除 `dist/`

**背景：** `.gitignore` 已包含 `dist/`，但 `dist/` 在添加 .gitignore 前就被提交了，仍被 git 跟踪。`git status` 中一堆 `D dist/...` 就是残留。

**Files:**
- Modify: git index（不删除磁盘文件）

- [ ] **Step 1：确认 dist 仍被跟踪**

Run: `git ls-files dist/ | wc -l`
Expected: 一个大于 0 的数字（说明仍被跟踪）

- [ ] **Step 2：从索引移除（保留磁盘文件）**

Run: `git rm -r --cached dist/`
Expected: 输出 `rm 'dist/...'` 多行

- [ ] **Step 3：确认 .gitignore 已有 dist/**

Run: `grep '^dist/' .gitignore`
Expected: 输出 `dist/`

- [ ] **Step 4：提交**

```bash
git add .gitignore
git commit -m "chore: untrack dist/ from git index (already in .gitignore)"
```

- [ ] **Step 5：验证**

Run: `git ls-files dist/ | wc -l`
Expected: `0`
Run: `ls dist/ | head -3`
Expected: 仍有文件（磁盘保留，只是不再跟踪）

---

### Task 2：删除死 feature `trust-score`

**背景：** `src/features/trust-score/` 只有 `store/store.ts`，全代码库无任何 import 引用，无页面、无桌面端、无展示。整个 feature 是死的。

**Files:**
- Delete: `src/features/trust-score/`（整个目录）

- [ ] **Step 1：确认无引用**

Run: `grep -rn "trust-score\|TrustScore\|useTrustScore\|trustScore" src/ --include='*.ts' --include='*.tsx' | grep -v "src/features/trust-score/"`
Expected: 无输出（说明除自身外无人引用）

- [ ] **Step 2：删除整个 feature 目录**

Run: `rm -rf src/features/trust-score`

- [ ] **Step 3：构建验证**

Run: `npm run build`
Expected: 构建成功，无报错

- [ ] **Step 4：提交**

```bash
git add -A src/features/trust-score
git commit -m "refactor: remove dead trust-score feature (no usages, no pages)"
```

---

### Task 3：删除孤儿副本 `convenience/c-end/components/PageHeader.tsx`

**背景：** `src/features/convenience/c-end/components/PageHeader.tsx` 是 `src/shared/components/mobile/PageHeader.tsx` 的 25 行副本，且无人 import 它（所有页面已用 `@/shared/components/mobile/PageHeader`）。

**Files:**
- Delete: `src/features/convenience/c-end/components/PageHeader.tsx`

- [ ] **Step 1：确认无人引用 convenience 副本**

Run: `grep -rn "convenience/c-end/components/PageHeader" src/`
Expected: 无输出

- [ ] **Step 2：删除文件**

Run: `rm src/features/convenience/c-end/components/PageHeader.tsx`

- [ ] **Step 3：构建验证**

Run: `npm run build`
Expected: 成功

- [ ] **Step 4：提交**

```bash
git add -A src/features/convenience/c-end/components/PageHeader.tsx
git commit -m "refactor: remove duplicate PageHeader in convenience (use shared/mobile/PageHeader)"
```

---

### Task 4：提交滞留的旧文档删除

**背景：** `git status` 显示一批 `docs/plans/*` 和 `docs/superpowers/{plans,specs}/*` 的删除尚未提交。这些是 feature-first 迁移期间清理的旧文档，删除是预期的。

**Files:**
- Delete (已在工作区删除，只需 stage): `docs/plans/2026-05-20-*.md`、`docs/plans/v3-*.md`、`docs/superpowers/plans/2026-07-03-feature-first-architecture.md`、`docs/superpowers/specs/2026-06-29-business-architecture-design.md`、`docs/superpowers/specs/2026-07-03-feature-first-architecture.md`

- [ ] **Step 1：查看待删除的文档**

Run: `git status --short | grep '^ D docs/'`
Expected: 列出约 8 个 `D docs/...` 行

- [ ] **Step 2：stage 这些删除**

Run: `git add -A docs/plans/ docs/superpowers/`
Expected: 无输出

- [ ] **Step 3：确认 staged**

Run: `git status --short | grep '^D  docs/'`
Expected: 列出同样的文档，但状态为 `D  `（已 stage）

- [ ] **Step 4：提交**

```bash
git commit -m "docs: remove stale plan/spec docs superseded by feature-first migration"
```

---

## Phase 2：Feature 边界归位

### Task 5：把 `ContactSheet` 移到 `shared/components/mobile/`

**背景：** `ContactSheet` 当前在 `features/content/c-end/components/`，但被 `features/convenience/c-end/pages/OrderDetailPage.tsx` 引用 — 这是 feature 间违规 import。`ContactSheet` 是通用的"联系底部弹层"组件，应归 shared。

**Files:**
- Move: `src/features/content/c-end/components/ContactSheet.tsx` → `src/shared/components/mobile/ContactSheet.tsx`
- Modify: `src/features/convenience/c-end/pages/OrderDetailPage.tsx`（更新 import 路径）

- [ ] **Step 1：移动文件**

Run: `mv src/features/content/c-end/components/ContactSheet.tsx src/shared/components/mobile/ContactSheet.tsx`

- [ ] **Step 2：更新 OrderDetailPage 的 import**

文件：`src/features/convenience/c-end/pages/OrderDetailPage.tsx`

找到第 8 行：
```typescript
import { ContactSheet } from "@/features/content/c-end/components/ContactSheet";
```

改为：
```typescript
import { ContactSheet } from "@/shared/components/mobile/ContactSheet";
```

- [ ] **Step 3：确认 content 内部无人再用 ContactSheet**

Run: `grep -rn "ContactSheet" src/features/content/`
Expected: 无输出

- [ ] **Step 4：若 content/c-end/components 目录已空则删除**

Run: `rmdir src/features/content/c-end/components 2>/dev/null || echo "目录非空或不存在，跳过"`
Expected: 要么静默成功，要么输出"跳过"

- [ ] **Step 5：构建验证**

Run: `npm run build`
Expected: 成功

- [ ] **Step 6：提交**

```bash
git add -A src/shared/components/mobile/ContactSheet.tsx src/features/content/c-end/components/ContactSheet.tsx src/features/convenience/c-end/pages/OrderDetailPage.tsx
git commit -m "refactor: move ContactSheet to shared/components/mobile (fix cross-feature import)"
```

---

### Task 6：把 `SupplierEntryPage` 移到 `features/supplier/c-end/pages/`

**背景：** `SupplierEntryPage` 是供应商入驻的 C 端页面，但放在了 `features/merchant-review/c-end/pages/`。`features/supplier/` 当前只有 `desktop/` 和 `store/`，缺 C 端。供应商页面应归 supplier feature。

**Files:**
- Move: `src/features/merchant-review/c-end/pages/SupplierEntryPage.tsx` → `src/features/supplier/c-end/pages/SupplierEntryPage.tsx`
- Modify: `src/c-end/routes.tsx`（更新 lazy import 路径）

- [ ] **Step 1：创建目标目录**

Run: `mkdir -p src/features/supplier/c-end/pages`

- [ ] **Step 2：移动文件**

Run: `mv src/features/merchant-review/c-end/pages/SupplierEntryPage.tsx src/features/supplier/c-end/pages/SupplierEntryPage.tsx`

- [ ] **Step 3：更新 routes.tsx 的 lazy import**

文件：`src/c-end/routes.tsx`

找到第 33 行：
```typescript
const SupplierEntryPage = lazy(() => import("../features/merchant-review/c-end/pages/SupplierEntryPage").then(m => ({ default: m.SupplierEntryPage })))
```

改为：
```typescript
const SupplierEntryPage = lazy(() => import("../features/supplier/c-end/pages/SupplierEntryPage").then(m => ({ default: m.SupplierEntryPage })))
```

- [ ] **Step 4：确认 merchant-review 不再引用 SupplierEntryPage**

Run: `grep -rn "SupplierEntryPage" src/features/merchant-review/`
Expected: 无输出

- [ ] **Step 5：构建验证**

Run: `npm run build`
Expected: 成功

- [ ] **Step 6：手动验证路由（可选）**

Run: `npm run dev`，浏览器访问 `http://localhost:5173/c/supplier-entry`，确认页面正常渲染后停止 dev server（Ctrl+C）。

- [ ] **Step 7：提交**

```bash
git add -A src/features/supplier/c-end/pages/SupplierEntryPage.tsx src/features/merchant-review/c-end/pages/SupplierEntryPage.tsx src/c-end/routes.tsx
git commit -m "refactor: move SupplierEntryPage to features/supplier (correct feature ownership)"
```

---

### Task 7：把 `auth-store` 移到 `platform/auth/store.ts`

**背景：** `src/shared/stores/auth-store.ts` 是 auth store 的真正位置，`src/platform/auth/index.ts` 只是从 `@/shared/stores/auth-store` 转发。CLAUDE.md 明确 auth 属于 `platform/auth/`。把 store 文件移到 platform/auth/ 下，让 index.ts 转发本地文件。`zoom-store` 留在 `shared/stores/`（它是 UI 缩放工具，由 MiniProgramFrame 和 main.tsx 使用，属于 shared）。

**Files:**
- Move: `src/shared/stores/auth-store.ts` → `src/platform/auth/store.ts`
- Modify: `src/platform/auth/index.ts`（更新转发路径）

- [ ] **Step 1：移动文件**

Run: `mv src/shared/stores/auth-store.ts src/platform/auth/store.ts`

- [ ] **Step 2：更新 platform/auth/index.ts**

文件：`src/platform/auth/index.ts`

当前内容：
```typescript
export { useAuthStore } from "@/shared/stores/auth-store"
```

改为：
```typescript
export { useAuthStore } from "./store"
```

- [ ] **Step 3：确认无残留 shared/stores/auth-store 引用**

Run: `grep -rn "shared/stores/auth-store" src/`
Expected: 无输出

- [ ] **Step 4：确认 shared/stores 仍有 zoom-store**

Run: `ls src/shared/stores/`
Expected: 输出 `zoom-store.ts`

- [ ] **Step 5：构建验证**

Run: `npm run build`
Expected: 成功

- [ ] **Step 6：提交**

```bash
git add -A src/platform/auth/store.ts src/platform/auth/index.ts src/shared/stores/auth-store.ts
git commit -m "refactor: move auth-store into platform/auth (align with layering rule)"
```

---

## Phase 3：工程基线

### Task 8：添加 TypeScript devDependency 与 typecheck 脚本

**背景：** `package.json` 的 devDependencies 没有 `typescript`（靠 vite 内置）。补上并加 `typecheck` 脚本。`tsconfig.json` 已有 `"noEmit": true` 和 `"strict": true`，无需改动。

**Files:**
- Modify: `package.json`（devDependencies + scripts）
- Modify: `tsconfig.json`（include 加上 `verification` 目录，为 Task 11 准备）

- [ ] **Step 1：安装 typescript**

Run: `npm install -D typescript`
Expected: package.json devDependencies 出现 `"typescript": "^5.x"`

- [ ] **Step 2：在 package.json 的 scripts 中加 typecheck**

文件：`package.json`

找到 `"scripts"` 块，在 `"verify:all"` 后加一行：

```json
    "typecheck": "tsc --noEmit",
```

完整 scripts 块应为：
```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "verify:seeds": "npx tsx src/shared/mock/validate-seeds.ts",
    "verify:flow": "vitest run verification/tests/business-flow.spec.ts",
    "verify:all": "vitest run",
    "deploy": "bash ../scripts/deploy.sh"
  },
```

- [ ] **Step 3：tsconfig.json include 加上 verification 目录**

文件：`tsconfig.json`

找到第 23 行：
```json
  "include": ["src"]
```

改为：
```json
  "include": ["src", "verification"]
```

- [ ] **Step 4：运行 typecheck（预期可能有错，Task 10 修复）**

Run: `npm run typecheck`
Expected: 可能有类型错误输出（记录下来，Task 10 处理）。若已无错则更好。

- [ ] **Step 5：构建验证**

Run: `npm run build`
Expected: 成功

- [ ] **Step 6：提交**

```bash
git add package.json package-lock.json tsconfig.json
git commit -m "chore: add typescript devDep and typecheck script"
```

---

### Task 9：添加 ESLint + Prettier 配置

**背景：** 项目无任何 lint/format 配置。用 ESLint 9 flat config + typescript-eslint + react-hooks 插件 + Prettier（与 ESLint 解耦）。

**Files:**
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Modify: `package.json`（devDependencies + scripts）

- [ ] **Step 1：安装依赖**

Run:
```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier globals
```
Expected: package.json devDependencies 出现这些包

- [ ] **Step 2：创建 eslint.config.js**

文件：`eslint.config.js`（项目根）

```javascript
import js from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import prettier from "eslint-config-prettier"
import globals from "globals"

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", ".vite/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  prettier
)
```

- [ ] **Step 3：创建 .prettierrc.json**

文件：`.prettierrc.json`（项目根）

```json
{
  "semi": false,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 120,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

- [ ] **Step 4：创建 .prettierignore**

文件：`.prettierignore`（项目根）

```
dist/
node_modules/
.vite/
pnpm-lock.yaml
package-lock.json
docs/
```

- [ ] **Step 5：在 package.json scripts 加 lint/format**

文件：`package.json`

在 `"typecheck"` 行后加：
```json
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\"",
```

- [ ] **Step 6：运行 lint（预期有 warn，Task 10 处理）**

Run: `npm run lint`
Expected: 输出若干 warning（主要是 `no-explicit-any`）。记录数量。若有 error 也记录。

- [ ] **Step 7：用 prettier 格式化全量代码**

Run: `npm run format`
Expected: 输出已格式化的文件列表

- [ ] **Step 8：构建验证**

Run: `npm run build`
Expected: 成功

- [ ] **Step 9：提交**

```bash
git add -A eslint.config.js .prettierrc.json .prettierignore package.json package-lock.json src/
git commit -m "chore: add ESLint + Prettier config and format entire codebase"
```

---

### Task 10：修复 19 处 `any` / `@ts-ignore`

**背景：** Task 2 删除 trust-score 后，剩余 19 处 `any`/`@ts-ignore`。逐一替换为正确类型。leaflet 的两处 `@ts-ignore` 是已知 workaround，转为 `@ts-expect-error` 并加注释。

**Files:**
- `src/features/complaints/desktop/pages/ComplaintPage.tsx`（2 处）
- `src/features/complaints/c-end/pages/MyComplaintsPage.tsx`（1 处）
- `src/features/complaints/c-end/pages/ComplaintDetailPage.tsx`（1 处）
- `src/features/heritage/c-end/pages/HeritagePage.tsx`（3 处）
- `src/features/content/c-end/pages/MapPage.tsx`（1 处）
- `src/features/volunteer/desktop/pages/VolunteerManagePage.tsx`（2 处）
- `src/features/volunteer/c-end/pages/VolunteerActivitiesPage.tsx`（4 处）
- `src/features/convenience/desktop/pages/DispatchConfigPage.tsx`（1 处）
- `src/desktop/nav.ts`（1 处）
- `src/desktop/components/common/LocationPickerDialog.tsx`（3 处）

**统一类型约定：**
- `lucide-react` 图标类型用 `import type { LucideIcon } from "lucide-react"`，写 `icon: LucideIcon`
- 未知排序回调用具体类型而非 `any`，类型不明时用 `unknown` 再断言
- leaflet 的 `delete (L.Icon.Default.prototype as any)._getIconUrl` 改为 `@ts-expect-error leaflet 内部 API 无类型` 注释上方加 `@ts-expect-error`（注意：`@ts-expect-error` 必须紧贴下一行报错代码）

- [ ] **Step 1：修复 complaints/desktop/ComplaintPage.tsx**

文件：`src/features/complaints/desktop/pages/ComplaintPage.tsx`

第 23 行：
```typescript
type ComplaintWithOrder = Complaint & { order?: any };
```
改为：
```typescript
type ComplaintWithOrder = Complaint & { order?: { id: string; serviceType: string; status: string; address: string } };
```

第 434 行：
```typescript
function InfoCard({ icon: Icon, title, lines }: { icon: any; title: string; lines: string[] }) {
```
改为：
```typescript
function InfoCard({ icon: Icon, title, lines }: { icon: LucideIcon; title: string; lines: string[] }) {
```
并在文件顶部 import 区加：`import type { LucideIcon } from "lucide-react"`

- [ ] **Step 2：修复 complaints/c-end/MyComplaintsPage.tsx**

文件：`src/features/complaints/c-end/pages/MyComplaintsPage.tsx`

第 10 行：
```typescript
const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
```
改为：
```typescript
const STATUS_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string; bg: string }> = {
```
并在文件顶部 import 区加：`import type { LucideIcon } from "lucide-react"`

- [ ] **Step 3：修复 complaints/c-end/ComplaintDetailPage.tsx**

文件：`src/features/complaints/c-end/pages/ComplaintDetailPage.tsx`

第 9 行：
```typescript
const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
```
改为：
```typescript
const STATUS_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string; bg: string }> = {
```
并在文件顶部 import 区加：`import type { LucideIcon } from "lucide-react"`

- [ ] **Step 4：修复 heritage/HeritagePage.tsx**

文件：`src/features/heritage/c-end/pages/HeritagePage.tsx`

第 116 行：
```typescript
        .sort((a: any, b: any) => a._distance - b._distance);
```
改为（假设数组元素类型为 `HeritageItem`，若实际类型名不同，用文件内已定义的元素类型）：
```typescript
        .sort((a, b) => a._distance - b._distance);
```
（若 TS 报错说类型不明，则在 sort 前 `.map` 已确定元素类型，TS 可推断；如仍报错，用 `(a: HeritageItem, b: HeritageItem)`，`HeritageItem` 从该文件 import 或本地定义的类型替换为实际名）

第 167 行：
```typescript
              onClick={() => handleTabChange(t.key as any)}
```
改为（`handleTabChange` 的参数类型应为 tab key 的联合类型；若 `t.key` 是 `string`，需要让 `tabs` 数组的 `key` 字段是字面量联合）：
```typescript
              onClick={() => handleTabChange(t.key)}
```
若 TS 报错，则把 `handleTabChange` 的参数类型从具体联合放宽为 `string`，并确保函数体内安全。

第 192 行：
```typescript
          visible.map((item: any) => {
```
改为：
```typescript
          visible.map((item) => {
```
（让 TS 从 `visible` 推断 `item` 类型）

- [ ] **Step 5：修复 content/MapPage.tsx**

文件：`src/features/content/c-end/pages/MapPage.tsx`

第 35 行：
```typescript
  icon: any;
```
改为：
```typescript
  icon: LucideIcon;
```
并在文件顶部 import 区加：`import type { LucideIcon } from "lucide-react"`

- [ ] **Step 6：修复 volunteer/desktop/VolunteerManagePage.tsx**

文件：`src/features/volunteer/desktop/pages/VolunteerManagePage.tsx`

第 67-68 行：
```typescript
    // @ts-ignore
    delete (L.Icon.Default.prototype as any)._getIconUrl
```
改为：
```typescript
    // @ts-expect-error leaflet 内部 API 无类型声明
    delete (L.Icon.Default.prototype as any)._getIconUrl
```
（保留 `as any`，因为 leaflet 的 `_getIconUrl` 确实无类型；用 `@ts-expect-error` 替代 `@ts-ignore` 让它在 leaflet 升级有类型后自动告警）

- [ ] **Step 7：修复 volunteer/c-end/VolunteerActivitiesPage.tsx**

文件：`src/features/volunteer/c-end/pages/VolunteerActivitiesPage.tsx`

第 65 行：
```typescript
  act: any; count: number; mySignUp: any; myDailyStatus?: string; myTotalHours?: number; onClick: () => void; index: number
```
改为（用 `VolunteerActivity` 类型；若该类型名不存在，从 `@/features/volunteer/store` 找实际导出的活动类型，或定义为 `unknown`）：
```typescript
  act: VolunteerActivity; count: number; mySignUp: boolean; myDailyStatus?: string; myTotalHours?: number; onClick: () => void; index: number
```
若 `VolunteerActivity` 未导出，先在 `src/features/volunteer/store/index.ts` 加 `export type { VolunteerActivity } from "./store"`（若 store 内有该类型），否则用最接近的类型名。`mySignUp` 的类型按实际使用判断（通常是 `boolean`）。

第 179 行：
```typescript
  items: any[]
```
改为：
```typescript
  items: VolunteerActivity[]
```

第 187 行：
```typescript
      const pri = (item: any) => {
```
改为：
```typescript
      const pri = (item: VolunteerActivity) => {
```

第 470 行：
```typescript
    (act: any, q: string) => act.title.includes(q) || act.description.includes(q) || act.location.includes(q),
```
改为：
```typescript
    (act: VolunteerActivity, q: string) => act.title.includes(q) || act.description.includes(q) || act.location.includes(q),
```

- [ ] **Step 8：修复 convenience/desktop/DispatchConfigPage.tsx**

文件：`src/features/convenience/desktop/pages/DispatchConfigPage.tsx`

第 29 行：
```typescript
      } as any,
```
改为（看上下文是某个 dispatch 配置对象，用实际类型；若类型未导出，先在 store 导出）：
```typescript
      },
```
若 TS 报错（字段不匹配），则把缺失的字段补上，或用 `satisfies DispatchConfig`（`DispatchConfig` 从 `@/features/convenience/store` import）。若 `DispatchConfig` 未导出，在 `features/convenience/store/index.ts` 加导出。

- [ ] **Step 9：修复 desktop/nav.ts**

文件：`src/desktop/nav.ts`

第 15 行：
```typescript
    icon: any
```
改为：
```typescript
    icon: LucideIcon
```
并在文件顶部 import 块加：`import type { LucideIcon } from "lucide-react"`

- [ ] **Step 10：修复 desktop/components/common/LocationPickerDialog.tsx**

文件：`src/desktop/components/common/LocationPickerDialog.tsx`

第 13-14 行：
```typescript
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl
```
改为：
```typescript
// @ts-expect-error leaflet 内部 API 无类型声明
delete (L.Icon.Default.prototype as any)._getIconUrl
```

第 141 行：
```typescript
          mapRef.current.fire("click", { latlng: L.latLng(latitude, longitude) } as any)
```
改为（`fire` 的参数类型是 `LeafletEvent`，这里传自定义 payload，用类型断言到 `unknown` 再断言目标，或直接保留 `as any` 并加 `@ts-expect-error`）：
```typescript
          // @ts-expect-error leaflet fire 方法对自定义 payload 类型不严格
          mapRef.current.fire("click", { latlng: L.latLng(latitude, longitude) })
```

- [ ] **Step 11：运行 typecheck 验证**

Run: `npm run typecheck`
Expected: 无错误（若有错误，根据报错信息调整对应类型）

- [ ] **Step 12：运行 lint 验证**

Run: `npm run lint`
Expected: 无 error；`no-explicit-any` 的 warning 应为 0（只剩 leaflet 两处保留的 `as any`，但已加 `@ts-expect-error`，lint 仍可能 warn。若 lint 仍 warn 这两处，在 eslint.config.js 的 rules 中加 `"@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: true }]` 或对这两行加 `// eslint-disable-next-line @typescript-eslint/no-explicit-any`）

如果 leaflet 两处 `as any` 仍触发 lint warning，在这两行上方加：
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

- [ ] **Step 13：构建验证**

Run: `npm run build`
Expected: 成功

- [ ] **Step 14：提交**

```bash
git add -A src/
git commit -m "refactor: replace any/@ts-ignore with proper types (19 sites)"
```

---

### Task 11：创建业务流冒烟测试

**背景：** `package.json` 的 `verify:flow` 引用 `verification/tests/business-flow.spec.ts`，但文件不存在。补一个 store 级冒烟测试（不做 DOM 渲染，避免引入复杂测试基建）。测试便民服务下单→派单→完成的核心状态流转。

**Files:**
- Create: `verification/tests/business-flow.spec.ts`
- Modify: `package.json`（devDependencies 加 vitest 已有，确认）

- [ ] **Step 1：创建测试目录**

Run: `mkdir -p verification/tests`

- [ ] **Step 2：写测试文件**

文件：`verification/tests/business-flow.spec.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { useConvenienceStore } from "@/features/convenience/store"

describe("便民服务业务流", () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useConvenienceStore.setState(useConvenienceStore.getInitialState(), false)
  })

  it("游客下单 → 派单 → 服务中 → 完成", () => {
    const store = useConvenienceStore.getState()

    // 1. 创建订单
    const orderId = store.createOrder({
      serviceType: "luggage",
      address: "五一街88号",
      lat: 26.8721,
      lng: 100.2358,
      contactName: "张小游",
      contactPhone: "13800001001",
      remark: "2件行李",
    })
    expect(orderId).toBeTruthy()

    // 2. 确认订单进入派单中状态
    let order = useConvenienceStore.getState().getOrderById(orderId)
    expect(order).toBeDefined()
    expect(order!.statusCode).toMatch(/^(S10|A10)$/)

    // 3. 模拟派单（定时器或手动派单）
    useConvenienceStore.getState().dispatchOrder(orderId, "staff-001")
    order = useConvenienceStore.getState().getOrderById(orderId)
    expect(order!.statusCode).toMatch(/^A[2-4]/)

    // 4. 完成
    useConvenienceStore.getState().completeOrder(orderId)
    order = useConvenienceStore.getState().getOrderById(orderId)
    expect(order!.statusCode).toBe("S50")
  })

  it("游客下单 → 取消", () => {
    const store = useConvenienceStore.getState()
    const orderId = store.createOrder({
      serviceType: "delivery",
      address: "七一街",
      lat: 26.8721,
      lng: 100.2358,
      contactName: "张小游",
      contactPhone: "13800001001",
      remark: "",
    })

    useConvenienceStore.getState().cancelOrder(orderId, "用户取消")
    const order = useConvenienceStore.getState().getOrderById(orderId)
    expect(order!.statusCode).toMatch(/^S(40|55|90)$/)
  })
})
```

**注意：** 上述测试调用的方法名（`createOrder`、`dispatchOrder`、`completeOrder`、`cancelOrder`、`getOrderById`、`getInitialState`）必须与 `src/features/convenience/store/` 中实际导出的方法名一致。实施前先：

Run: `grep -n "createOrder\|dispatchOrder\|completeOrder\|cancelOrder\|getOrderById" src/features/convenience/store/index.ts src/features/convenience/store/store.ts`

如果方法名不同，把测试中的方法名替换为实际名称。如果 `getInitialState` 不存在，用 `useConvenienceStore.setState({ orders: [], ... })` 手动重置，或导入 seed 数据重置。如果 `createOrder` 的参数结构不同，按实际 store 类型调整。

- [ ] **Step 3：运行测试**

Run: `npx vitest run verification/tests/business-flow.spec.ts`
Expected: 两个测试通过。若失败，根据报错调整方法名/参数（store 的实际 API 可能与上面假设不同）。

- [ ] **Step 4：运行 verify:all**

Run: `npm run verify:all`
Expected: 通过

- [ ] **Step 5：构建验证**

Run: `npm run build`
Expected: 成功

- [ ] **Step 6：提交**

```bash
git add -A verification/tests/business-flow.spec.ts
git commit -m "test: add convenience store business-flow smoke test"
```

---

### Task 12：添加 CI workflow

**背景：** 当前 `.github/workflows/` 只有 `opencode.yml`（响应 `/oc` 注释）。补一个 CI workflow 在 push/PR 时跑 lint + typecheck + build + test。

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1：确认 .github/workflows 目录存在**

Run: `ls .github/workflows/`
Expected: 至少列出 `opencode.yml`

- [ ] **Step 2：创建 ci.yml**

文件：`.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Build
        run: npm run build

      - name: Test
        run: npm run verify:all
```

- [ ] **Step 3：本地全量验证**

Run:
```bash
npm run lint && npm run typecheck && npm run build && npm run verify:all
```
Expected: 全部通过

- [ ] **Step 4：提交**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint+typecheck+build+test workflow on push/PR"
```

---

### Task 13：最终全量验证与收尾

**Files:** 无新增，仅验证

- [ ] **Step 1：全量构建**

Run: `npm run build`
Expected: 成功，无警告（或仅有已知 chunk size 警告）

- [ ] **Step 2：全量 lint**

Run: `npm run lint`
Expected: 无 error，warning 数量已知且可接受

- [ ] **Step 3：全量 typecheck**

Run: `npm run typecheck`
Expected: 无错误

- [ ] **Step 4：全量测试**

Run: `npm run verify:all`
Expected: 通过

- [ ] **Step 5：确认 git 状态干净**

Run: `git status`
Expected: `nothing to commit, working tree clean`（或仅剩 dist/ 未跟踪，已被 .gitignore 忽略）

- [ ] **Step 6：确认无残留死代码**

Run: `grep -rn "trust-score\|TrustScore" src/`
Expected: 无输出

Run: `grep -rn "shared/stores/auth-store" src/`
Expected: 无输出

Run: `grep -rn "convenience/c-end/components/PageHeader" src/`
Expected: 无输出

Run: `grep -rn "features/content/c-end/components/ContactSheet" src/`
Expected: 无输出

- [ ] **Step 7：确认 feature 间无违规 import**

Run: `grep -rn "from \"@/features/" src/features/ | grep -v "from \"@/features/[^/]\+/shared/"`
Expected: 无输出（feature 之间只能通过各自的 shared/ 互导，但理想情况是完全不互导）

若有个别输出，记录到后续子项目处理，本计划不展开。

---

## 附录：本计划不涵盖的内容

以下属于子项目 2（业务流程闭环）和子项目 3（UX 补全），单独出计划：

- **notification 双家**（B2）：经评估，store 在 `platform/notification`（基础设施，跨 feature 调用）+ 页面在 `features/notification`（UI）是 intentional 的分层，不改。
- **首页搜索栏无功能**（C1）：属 UX 补全，子项目 3 处理。
- **通知只被 convenience 触发**（D1）：属业务闭环，子项目 2 处理。
- **skeleton/空状态**（C2/C3）：属 UX 补全，子项目 3 处理。

---

## 执行顺序总结

```
Task 1 (untrack dist) → Task 2 (删 trust-score) → Task 3 (删重复 PageHeader)
→ Task 4 (提交旧文档删除) → Task 5 (移 ContactSheet) → Task 6 (移 SupplierEntryPage)
→ Task 7 (移 auth-store) → Task 8 (加 TS+typecheck) → Task 9 (加 ESLint+Prettier)
→ Task 10 (修 any) → Task 11 (加冒烟测试) → Task 12 (加 CI) → Task 13 (收尾验证)
```

每个 Task 独立可提交、可回滚。若某 Task 失败，修复后重试该 Task，不影响其他。
