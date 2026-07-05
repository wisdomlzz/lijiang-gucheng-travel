# 古城商户业务体系重构 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将古城商户业务拆分为两个独立子系统（古城店铺系统 + 线上商城供应商系统），实现认领/入驻统一入口、三种审核分流、角色权限区分、购在古城双端展示。

**Architecture:** 在现有 feature-first 架构基础上扩展 Merchant 数据模型（claimStatus），重构 registration-store 为统一店铺认领/入驻 store，修改 MerchantReviewPage 为三 Tab 审核面板，增量优化 MerchantListPage 展示认领状态。

**Tech Stack:** TypeScript, Zustand, React 18, Vite

**约束：** "购在古城"（MerchantListPage）代码不重构，只做增量优化（条件渲染认领状态标签）。供应商 → 线上商城供应商。

---

## 文件变更清单

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/shared/types/content-types.ts` | 修改 | Merchant 增加 claimStatus/claimedBy/claimedAt |
| `src/features/merchant-review/store/registration-store.ts` | 重构 | 支持认领+入驻两种场景；新增 claim 提交 action |
| `src/features/merchant-review/store/index.ts` | 修改 | 导出新类型 |
| `src/features/merchant-review/c-end/pages/MerchantRegistrationPage.tsx` | 修改 | 改为统一入口页（搜索→认领/新建分流） |
| `src/features/content/store/merchant-store.ts` | 修改 | 种子数据增加 claimStatus 字段 |
| `src/desktop/pages/gates/MerchantReviewPage.tsx` | 修改 | 三个 Tab：认领审核/入驻审核/信息变更审核 |
| `src/c-end/pages/MerchantListPage.tsx` | 增量修改 | 商户端显示认领状态标签 |
| `src/c-end/pages/MerchantDetailPage.tsx` | 增量修改 | 商户端详情页底部显示认领/已认领状态 |
| `src/c-end/pages/MerchantServicesPage.tsx` | 修改 | 增加"线上商城供应商"入口 |
| `src/c-end/pages/MyShopPage.tsx` | 验证 | 角色门控已实现，确认无问题 |
| `src/desktop/nav.ts` | 修改 | 标签更新：商家信息审核→古城商户审核，供应商入驻审核→线上商城供应商审核 |
| `src/features/merchant-review/c-end/pages/SupplierEntryPage.tsx` | 新建 | C端线上商城供应商入驻表单 |
| `src/c-end/routes.tsx` | 修改 | 新增供应商入驻路由 |

---

## 子系统一：古城店铺系统

### Task 1: 数据模型 — Merchant 增加 claimStatus

**Files:**
- Modify: `src/shared/types/content-types.ts` (Merchant 接口)
- Modify: `src/features/content/store/merchant-store.ts` (种子数据)

**Interfaces:**
- Consumes: 现有 Merchant 类型
- Produces: 扩展后的 Merchant 类型（+ claimStatus/claimedBy/claimedAt）

- [ ] **Step 1: 扩展 Merchant 类型**

在 `src/shared/types/content-types.ts` 的 Merchant 接口中增加三个字段。在 `certificates` 字段之后：

```typescript
export interface Merchant {
  // ... 现有字段保持不变
  certificates: Certificate[]

  // === 新增：店铺认领状态 ===
  claimStatus?: "unclaimed" | "pending" | "claimed"
  claimedBy?: string   // 认领者的 userId
  claimedAt?: string   // 认领时间
}
```

- [ ] **Step 2: 更新种子数据**

在 `src/features/content/store/merchant-store.ts` 中，为每个种子 Merchant 添加 claimStatus 字段：

```typescript
const DEFAULT: Merchant[] = [
  { id: "1", name: "纳西人家餐厅", ..., claimStatus: "unclaimed" },
  { id: "2", name: "古城客栈", ..., claimStatus: "unclaimed" },
  { id: "3", name: "东巴纸坊", ..., claimStatus: "unclaimed" },
  { id: "4", name: "雪山清吧", ..., claimStatus: "unclaimed" },
  { id: "5", name: "木府茶室", ..., claimStatus: "unclaimed" },
  { id: "6", name: "古城文创集合店", ..., claimStatus: "unclaimed", relatedUser: "古城文创·王老板" },
]
```

编号 6（古城文创集合店）是张老板的店，但初始仍为 unclaimed——张老板需要通过认领流程来绑定。

- [ ] **Step 3: 验证构建**

```bash
npx vite build
```

预期：构建通过，无类型错误。

---

### Task 2: 重构 registration-store → 支持认领+入驻

**Files:**
- Modify: `src/features/merchant-review/store/registration-store.ts`
- Modify: `src/features/merchant-review/store/index.ts`

**Interfaces:**
- Consumes: Merchant 类型（含 claimStatus），AuthStore.updateUser，ContentMerchantStore
- Produces: ShopClaimRequest（统一认领/入驻申请类型），useMerchantRegistrationStore 增加 submitClaim action

- [ ] **Step 1: 重构统一申请类型**

将 `MerchantRegistration` 重命名为 `ShopClaimRequest`，增加 `type: "claim" | "new_shop"` 字段区分两种场景：

```typescript
// src/features/merchant-review/store/registration-store.ts

export interface ShopClaimRequest {
  id: string
  type: "claim" | "new_shop"      // 认领已有店铺 OR 新建店铺
  userId: string
  userName: string
  userPhone: string

  // claim 场景：用户声称的店铺
  claimedShopId?: string           // 用户声称的店铺 ID
  claimedShopName?: string          // 用户声称的店铺名

  // new_shop 场景：用户提交的新店铺信息
  newShopName?: string
  newCategory?: string
  newAddress?: string
  newPhone?: string
  newDescription?: string
  newHours?: string

  // 审核信息
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewer?: string
  rejectReason?: string
}
```

- [ ] **Step 2: 新增 submitClaim action**

在 store 中新增 `submitClaim` 方法，与现有 `submitRegistration` 并列：

```typescript
type RegistrationState = {
  requests: ShopClaimRequest[]
  getPending: () => ShopClaimRequest[]
  getByUserId: (userId: string) => ShopClaimRequest[]
  /** 提交认领申请（店铺已存在，用户认领） */
  submitClaim: (input: {
    userId: string; userName: string; userPhone: string;
    claimedShopId: string; claimedShopName: string
  }) => void
  /** 提交入驻申请（店铺不存在，新建） */
  submitRegistration: (input: {
    userId: string; userName: string; userPhone: string;
    newShopName: string; newCategory: string; newAddress: string;
    newPhone: string; newDescription: string; newHours: string
  }) => void
  approveRegistration: (id: string, reviewer: string) => void
  rejectRegistration: (id: string, reviewer: string, reason: string) => void
}
```

- [ ] **Step 3: 修改 approveRegistration 逻辑**

审核通过时，根据 `type` 执行不同操作：

```typescript
// 认领场景（type === "claim"）
if (req.type === "claim" && req.claimedShopId) {
  const merchant = merchantStore.merchants.find(m => m.id === req.claimedShopId)
  if (merchant) {
    merchantStore.updateMerchant(merchant.id, {
      claimStatus: "claimed",
      claimedBy: req.userId,
      claimedAt: new Date().toLocaleString("zh-CN"),
      relatedUser: req.userName,
    })
  }
}

// 入驻场景（type === "new_shop"）— 同上，创建商家 + 状态设为 claimed
if (req.type === "new_shop") { ... }

// 两种场景都追加 supplier 角色
if (user && user.id === req.userId && !user.roles.includes("supplier")) {
  useAuthStore.getState().updateUser({
    roles: [...user.roles, "supplier"],
    supplierId: `sup_${req.id}`,
  })
}
```

- [ ] **Step 4: 更新 barrel export**

```typescript
// src/features/merchant-review/store/index.ts
export { useMerchantReviewStore } from "./store"
export { useMerchantRegistrationStore } from "./registration-store"
export type { ShopClaimRequest } from "./registration-store"
```

- [ ] **Step 5: 验证构建**

```bash
npx vite build
```

---

### Task 3: 统一认领/入驻入口页面（搜索匹配）

**Files:**
- Create: `src/features/merchant-review/c-end/pages/MerchantRegistrationPage.tsx` (替换现有文件)
- Modify: `src/c-end/routes.tsx` (路由已存在，确认)

**Interfaces:**
- Consumes: useContentMerchantStore (搜索已有店铺), useMerchantRegistrationStore (提交认领/入驻)
- Produces: 完整的搜索→认领/新建分流页面

- [ ] **Step 1: 重写 MerchantRegistrationPage**

替换现有文件，实现搜索匹配逻辑：

```typescript
// 核心页面结构：
// 1. 搜索框：输入店铺名称/地址关键字
// 2. 搜索结果列表：匹配到的店铺（名称+地址+"这就是我的店"按钮）
// 3. 新建入口：没找到时的"点此新建店铺"链接
// 4. 认领表单：确认匹配后，填写姓名、电话、关系描述
// 5. 新建表单：未匹配时，填写完整店铺信息
// 6. 提交成功页

// 搜索逻辑（纯前端模糊匹配）：
const [query, setQuery] = useState("")
const matches = useMemo(() => {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return storeMerchants.filter(m =>
    m.name.toLowerCase().includes(q) ||
    (m.address && m.address.toLowerCase().includes(q))
  )
}, [query, storeMerchants])
```

- [ ] **Step 2: 实现搜索 UI**

```
┌─────────────────────────────────┐
│  认领或入驻店铺                   │
├─────────────────────────────────┤
│  🔍 输入您的店铺名称或地址        │
│                                 │
│  ── 搜索结果（匹配到 N 家） ──    │
│                                 │
│  🏪 纳西人家餐厅               │
│     五一街文明巷88号             │
│     [这就是我的店]              │
│                                 │
│  🏪 纳西印象餐厅               │
│     七一街                       │
│     [这就是我的店]              │
│                                 │
│  ─────────────────────────     │
│  没找到您的店？[点此提交新店铺信息] │
└─────────────────────────────────┘
```

- [ ] **Step 3: 实现认领流程**

点击"这就是我的店" → 进入认领表单：
- 展示店铺名称（只读）
- 填写：联系人姓名、联系电话
- 提交按钮 → `submitClaim({ userId, userName, userPhone, claimedShopId, claimedShopName })`
- 跳转提交成功页

- [ ] **Step 4: 实现新建流程**

点击"点此提交新店铺信息" → 进入新建表单：
- 店铺名称、经营类型（餐饮/住宿/酒吧/购物 四选一）、店铺地址、店铺电话、营业时间、店铺简介
- 联系人姓名、联系电话
- 提交按钮 → `submitRegistration({ ... })`
- 跳转提交成功页

- [ ] **Step 5: 验证构建**

```bash
npx vite build
```

---

### Task 4: MerchantReviewPage — 三 Tab 审核面板

**Files:**
- Modify: `src/desktop/pages/gates/MerchantReviewPage.tsx`

**Interfaces:**
- Consumes: useMerchantRegistrationStore (认领/入驻审核), useMerchantReviewStore (信息变更审核)
- Produces: 三 Tab 审核面板（认领审核 / 新建入驻审核 / 信息变更审核）

- [ ] **Step 1: 修改 Tab 类型和标题**

当前 Tab 定义：
```typescript
type Tab = "info-change" | "registration"
```

改为：
```typescript
type Tab = "claim" | "new-shop" | "info-change"
```

页面标题改为：
```typescript
<PageLayout title="古城商户审核" description="古城商户认领/入驻/信息变更审核">
```

- [ ] **Step 2: 拆分入驻审核 Tab 为认领审核 + 新建入驻审核**

将当前 `RegistrationReview` 组件拆分为两个独立组件：

1. **ClaimReview** — 只显示 `type === "claim"` 的申请，审核通过后设置 claimStatus
2. **NewShopReview** — 只显示 `type === "new_shop"` 的申请，审核通过后创建 Merchant

通过 `requests.filter(r => r.type === "claim")` 和 `requests.filter(r => r.type === "new_shop")` 区分。

- [ ] **Step 3: 更新信息变更审核 Tab 标题**

`InfoChangeReview` 的 Tab 标题改为"信息变更审核"，内容不变。

- [ ] **Step 4: 更新侧边栏审核计数**

当前 MerchantReviewPage 的 badge 显示从 `useMerchantReviewStore.getPending().length` 获取。需要改为三个 Tab 的待审核总数：

```typescript
const claimPending = useMerchantRegistrationStore((s) => s.requests.filter(r => r.type === "claim" && r.status === "pending").length)
const newShopPending = useMerchantRegistrationStore((s) => s.requests.filter(r => r.type === "new_shop" && r.status === "pending").length)
const infoChangePending = useMerchantReviewStore((s) => s.getPending().length)
const totalPending = claimPending + newShopPending + infoChangePending
```

- [ ] **Step 5: 验证构建**

```bash
npx vite build
```

---

### Task 5: 购在古城 — 商户端认领状态标签

**Files:**
- Modify: `src/c-end/pages/MerchantListPage.tsx` (增量优化)
- Modify: `src/c-end/pages/MerchantDetailPage.tsx` (增量优化)

**Interfaces:**
- Consumes: useAuthStore (检查 supplier 角色)
- Produces: 商户端条件渲染认领状态标签

- [ ] **Step 1: MerchantListPage 增加认领状态标签**

在 `MerchantListPage` 中，获取当前用户角色：

```typescript
const user = useAuthStore((s) => s.user)
const isSupplier = user?.roles?.includes("supplier") ?? false
```

在商品卡片渲染处（`visible.map` 内部），为商户端用户增加认领状态标签。在分类标签旁边：

```typescript
// 在卡片图片顶部的分类标签区域，商户端增加认领状态
{isSupplier && m.claimStatus && (
  <span className={`px-2 h-5 flex items-center rounded-full backdrop-blur text-[10px] ${
    m.claimStatus === "claimed" ? "bg-emerald-50/85 text-emerald-600" :
    m.claimStatus === "pending" ? "bg-amber-50/85 text-amber-600" :
    "bg-white/85 text-text-tertiary"
  }`}>
    {m.claimStatus === "claimed" ? "已认领" :
     m.claimStatus === "pending" ? "审核中" : "待认领"}
  </span>
)}
```

- [ ] **Step 2: MerchantDetailPage 增加认领入口**

在详情页底部信息区，商户端用户看到未认领店铺时显示"认领此店"按钮：

```typescript
// 在商户详情页信息区域，底部增加
const user = useAuthStore((s) => s.user)
const isSupplier = user?.roles?.includes("supplier") ?? false
```

在地址信息块下方或底部固定栏，增加条件渲染：

```typescript
{isSupplier && merchant.claimStatus === "unclaimed" && (
  <button
    onClick={() => navigate(`/c/merchant-register?claim=${merchant.id}`)}
    className="w-full h-10 rounded-xl bg-primary/10 text-primary text-[13px] font-medium"
  >
    认领此店铺
  </button>
)}
```

- [ ] **Step 3: 验证构建**

```bash
npx vite build
```

---

### Task 6: MerchantServicesPage — 重组为子系统分离

**Files:**
- Modify: `src/c-end/pages/MerchantServicesPage.tsx`

**Interfaces:**
- Consumes: useAuthStore (检查角色)
- Produces: 重组后的商户服务页（店铺管理 / 线上商城供应商 / 经营保障）

- [ ] **Step 1: 验证当前页面结构**

当前 MerchantServicesPage 已有三个 section：
- 商户经营（认领/入驻店铺、我的店铺、便民服务、公房服务）
- 经营保障（投诉、随手拍、资讯、通知、信息）
- 供应商合作（供应商入驻）

需要验证：
- 标题从"商户经营"改为"🏪 古城店铺管理"
- 标题从"供应商合作"改为"🛒 线上商城供应商"
- 明确标注子系统归属

- [ ] **Step 2: 更新 section 标题和文案**

```typescript
const SECTIONS = [
  {
    title: "🏪 古城店铺管理",
    entries: [
      { icon: "", label: "认领/入驻店铺", route: "/c/merchant-register", lucideIcon: BadgeCheck, iconBg: "#DBEAFE" },
      { icon: "", label: "我的店铺", route: "/c/my-shop", lucideIcon: Store, iconBg: "#FEF3C7" },
      { icon: "/icons/一键服务@2x.png", label: "便民服务", route: "/c/services" },
      { icon: "/icons/公房服务@2x.png", label: "公房服务", route: "/c/housing" },
    ],
  },
  {
    title: "🛒 线上商城供应商",
    entries: [
      { icon: "", label: "供应商入驻", route: "/c/supplier-entry", lucideIcon: Plus, iconBg: "#D1FAE5" },
    ],
  },
  // ... 经营保障不变
]
```

- [ ] **Step 3: 验证构建**

```bash
npx vite build
```

---

### Task 7: 更新 nav.ts 标签和审核计数

**Files:**
- Modify: `src/desktop/nav.ts`

- [ ] **Step 1: 更新标签**

```typescript
{
  title: "商家与供应商",
  items: [
    { key: "supplier-applications", label: "线上商城供应商审核", icon: Store, permissionCode: "mall" },
    { key: "merchant-review", label: "古城商户审核", icon: ShieldCheck, badge: totalPending, permissionCode: "mall" },
    { key: "crmeb-admin", label: "商城管理后台", icon: ExternalLink, external: CRMEB_ADMIN_URL, permissionCode: "mall" },
  ],
}
```

注意：badge 值需要在 DesktopLayout 中动态计算，因为需要跨 store 获取待审核总数。

- [ ] **Step 2: 验证构建**

```bash
npx vite build
```

---

## 子系统二：线上商城供应商系统

### Task 8: C端线上商城供应商入驻页面

**Files:**
- Create: `src/features/merchant-review/c-end/pages/SupplierEntryPage.tsx`
- Modify: `src/c-end/routes.tsx` (新增路由)
- Modify: `src/c-end/pages/MerchantServicesPage.tsx` (入口已存在，确认路由)

- [ ] **Step 1: 创建 C端供应商入驻表单**

复用现有 `SupplierApplication` 数据模型（`src/shared/types/index.ts` 中已有定义），创建 C 端表单：

```typescript
// 表单字段：公司/店铺名称、联系人、电话、经营类型、地址、营业执照号、营业执照照片、经营范围简介
// 复用 useSupplierStore.addApplication
// 提交后跳转成功页，告知"等待平台审核，审核通过后可在桌面端管理商品"
```

- [ ] **Step 2: 添加路由**

```typescript
// src/c-end/routes.tsx
const SupplierEntryPage = lazy(() => import("../features/merchant-review/c-end/pages/SupplierEntryPage").then(m => ({ default: m.SupplierEntryPage })))
// 添加路由
{ path: "supplier-entry", element: <SupplierEntryPage /> },
```

- [ ] **Step 3: 验证构建**

```bash
npx vite build
```

---

## 验证与收尾

### Task 9: 全流程验证

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```

- [ ] **Step 2: 验证游客端**

以张小游（13800001001）登录 C 端，验证：
- 购在古城列表无认领标签
- 商户服务页无"我的店铺"管理功能（显示引导入驻）
- 可进入认领/入驻页面，看到搜索匹配

- [ ] **Step 3: 验证商户端**

以张老板（13800001002）登录 C 端，验证：
- 购在古城列表显示认领标签（未认领店铺显示"待认领"）
- 商户服务页显示"已认证商户"标识
- 我的店铺可管理信息

- [ ] **Step 4: 验证认领流程**

以张小游登录，在认领/入驻页面搜索"纳西人家"，确认匹配到，提交认领。切换到桌面端管理员，在古城商户审核→认领审核 Tab 中看到申请，通过。验证：
- 张小游获得 supplier 角色
- 纳西人家餐厅 claimStatus 变为 claimed

- [ ] **Step 5: 验证新建入驻流程**

同上，搜索不存在的店铺名，提交新建。桌面端审核通过后，验证：
- 新店铺出现在 merchant-store
- 用户获得 supplier 角色

- [ ] **Step 6: 验证信息变更审核**

以张老板登录，在我的店铺中修改营业时间，提交审核。桌面端信息变更审核 Tab 中看到，通过后验证 merchant-store 数据已更新。

- [ ] **Step 7: 验证线上商城供应商入驻**

以张小游登录，在商户服务页→线上商城供应商→供应商入驻，填写表单提交。桌面端供应商入驻审核页面看到申请。

- [ ] **Step 8: 验证构建**

```bash
npm run build
```

- [ ] **Step 9: 提交**

```bash
git add .
git commit -m "feat: restructure merchant business into two subsystems"
```