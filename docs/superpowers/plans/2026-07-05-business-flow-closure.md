# 业务流程闭环 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 每完成一个 Task 必须 `npm run build` 通过后再 commit。**前置依赖：** 子项目 1（工程基线 + 死代码清扫）已完成。

**Goal:** 把"断头"的业务流程接上闭环：审核结果/投诉处理/公告发布/供应商审核都要推送到 C 端通知中心；志愿服务完成要触发积分获取。让 demo 形成"提交→处理→反馈"的完整链路。

**Architecture:** 在现有 store 的 action 中注入 `addNotification` 调用（不改 store 结构，只补副作用）。通知类型复用 `platform/notification` 的 `NotificationType`。积分获取复用 `usePointsStore.getState().transact`。

**Tech Stack:** TypeScript, React 18, Zustand, react-router, sonner (toast)

## Global Constraints

- **不改 store 的数据结构**，只在 action 内部追加 `addNotification` / `transact` 调用。
- **通知类型** 用 `platform/notification` 已定义的 `NotificationType`（若类型不够，扩展它，不要用 `any`）。
- **通知文案** 用中文，简洁，含可识别的业务实体名（店铺名/投诉编号/公告标题）。
- **不引入新依赖**。
- **每个 Task 结束**：`npm run build` + `npm run typecheck` 通过 + commit。
- **路径别名** `@/*` → `src/*`。

## 文件结构总览

| 类别 | 操作 | 文件 |
|---|---|---|
| 通知闭环 | 修改 store action | `features/merchant-review/store/registration-store.ts`（认领/入驻审核结果） |
| 通知闭环 | 修改 store action | `features/merchant-review/store/store.ts`（信息变更审核结果） |
| 通知闭环 | 修改 store action | `features/complaints/store/store.ts`（投诉处理/驳回） |
| 通知闭环 | 修改 store action | `features/announcement/store/*.ts`（公告发布） |
| 通知闭环 | 修改 store action | `features/supplier/store/supplier-store.ts`（供应商审核结果） |
| 积分闭环 | 修改 store action | `features/volunteer/store/*.ts`（志愿服务完成触发积分） |
| 通知类型扩展 | 修改 | `platform/notification/store.ts`（若需要新 NotificationType） |

---

## Task 1：认领/入驻审核结果推送通知

**背景：** 用户在 C 端提交店铺认领或新建入驻申请后，桌面端审核通过/驳回，但用户不会收到任何通知，只能自己反复进"我的店铺"页查看状态。要在 `approveRegistration` / `rejectRegistration` 中推通知。

**Files:**
- Modify: `src/features/merchant-review/store/registration-store.ts`

- [ ] **Step 1：查看 registration-store 当前 approve/reject 实现**

Run: `sed -n '100,180p' src/features/merchant-review/store/registration-store.ts`
Expected: 看到 `approveRegistration` 和 `rejectRegistration` 的 set 逻辑

- [ ] **Step 2：在文件顶部加 notification import**

文件：`src/features/merchant-review/store/registration-store.ts`

在现有 import 块后加：
```typescript
import { useNotificationStore } from "@/platform/notification"
```

- [ ] **Step 3：在 approveRegistration 的 set 之后加通知**

找到 `approveRegistration: (id, reviewer) => {` 方法，在 `set(...)` 调用**之后**（方法体内、return 之前或 set 的回调之后）加：

```typescript
    const approved = get().requests.find((r) => r.id === id)
    if (approved) {
      useNotificationStore.getState().addNotification({
        userId: approved.userId,
        type: "merchant",
        title: "店铺认领/入驻审核通过",
        body: `您的店铺「${approved.type === "claim" ? approved.claimedShopName : approved.newShopName}」已审核通过，您现在可以管理店铺信息了。`,
        link: "/c/my-shop",
      })
    }
```

**注意：** `addNotification` 的参数结构必须与 `platform/notification/store.ts` 的 `Notification` 类型一致。先查看：

Run: `sed -n '1,35p' src/platform/notification/store.ts`
Expected: 看到 `Notification` 接口和 `addNotification` 的参数类型

如果 `Notification` 没有 `userId` / `link` 字段，则不加这两个字段（用现有字段）；如果 `type` 不支持 `"merchant"`，先在 Step 4 扩展类型。**参数结构以实际类型为准**，调整上面代码的字段名。

- [ ] **Step 4：在 rejectRegistration 的 set 之后加通知**

找到 `rejectRegistration: (id, reviewer, reason) =>` 方法，在 `set(...)` 之后加：

```typescript
    const rejected = get().requests.find((r) => r.id === id)
    if (rejected) {
      useNotificationStore.getState().addNotification({
        userId: rejected.userId,
        type: "merchant",
        title: "店铺认领/入驻审核未通过",
        body: `您的申请未通过。原因：${reason}。如有疑问请联系平台。`,
        link: "/c/merchant-services",
      })
    }
```

（同样按 Step 3 的实际类型调整字段）

- [ ] **Step 5：typecheck 验证**

Run: `npm run typecheck`
Expected: 无错误。若报 `userId` / `link` / `type` 字段不存在，按实际 `Notification` 类型调整。

- [ ] **Step 6：构建验证**

Run: `npm run build`
Expected: 成功

- [ ] **Step 7：提交**

```bash
git add src/features/merchant-review/store/registration-store.ts
git commit -m "feat: push notification on merchant claim/registration review result"
```

---

## Task 2：信息变更审核结果推送通知

**背景：** 商户在"我的店铺"修改信息 → 提交审核 → 桌面端 `store.ts` 的 `approve`/`reject` 处理，但商户收不到结果通知。

**Files:**
- Modify: `src/features/merchant-review/store/store.ts`

- [ ] **Step 1：查看 store.ts 当前 approve/reject 实现**

Run: `sed -n '60,95p' src/features/merchant-review/store/store.ts`
Expected: 看到 `approve` 和 `reject` 方法

- [ ] **Step 2：加 notification import**

文件：`src/features/merchant-review/store/store.ts`

在 import 块后加：
```typescript
import { useNotificationStore } from "@/platform/notification"
```

- [ ] **Step 3：在 approve 的 set 之后加通知**

找到 `approve: (id, reviewer) => {` 方法，在 `set(...)` 之后加：

```typescript
    const req = get().requests.find((r) => r.id === id)
    if (req) {
      useNotificationStore.getState().addNotification({
        userId: req.supplierId,
        type: "merchant",
        title: "店铺信息变更已通过",
        body: `您提交的「${req.merchantName}」信息变更已审核通过。`,
        link: "/c/my-shop",
      })
    }
```

（`supplierId` 是变更申请的提交者；按实际 `MerchantChangeRequest` 字段调整。先 `grep -n "supplierId\|supplierName" src/features/merchant-review/store/store.ts` 确认字段名）

- [ ] **Step 4：在 reject 的 set 之后加通知**

找到 `reject: (id, reviewer, reason) =>` 方法，在 `set(...)` 之后加：

```typescript
    const req = get().requests.find((r) => r.id === id)
    if (req) {
      useNotificationStore.getState().addNotification({
        userId: req.supplierId,
        type: "merchant",
        title: "店铺信息变更未通过",
        body: `「${req.merchantName}」的信息变更未通过。原因：${reason}。`,
        link: "/c/my-shop",
      })
    }
```

- [ ] **Step 5：typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: 无错误

- [ ] **Step 6：提交**

```bash
git add src/features/merchant-review/store/store.ts
git commit -m "feat: push notification on merchant info-change review result"
```

---

## Task 3：投诉处理/驳回推送通知

**背景：** 游客提交投诉 → 桌面端 `ComplaintPage` 处理（`resolveWithResult`）或驳回 → 游客收不到结果，要自己进"投诉详情"看状态。

**Files:**
- Modify: `src/features/complaints/store/store.ts`

- [ ] **Step 1：查看 complaints store 的 resolve/reject 方法名**

Run: `grep -n "resolve\|reject\|C40\|CR\b" src/features/complaints/store/store.ts | head -20`
Expected: 看到 `resolveWithResult` 和驳回方法名（可能是 `reject` 或其他）

- [ ] **Step 2：加 notification import**

文件：`src/features/complaints/store/store.ts`

在 import 块后加：
```typescript
import { useNotificationStore } from "@/platform/notification"
```

- [ ] **Step 3：在 resolveWithResult 内加通知**

找到 `resolveWithResult` 方法（处理完成 → C40），在 `set(...)` 之后加：

```typescript
    const complaint = get().complaints.find((c) => c.id === id)
    if (complaint) {
      useNotificationStore.getState().addNotification({
        userId: complaint.userId,
        type: "complaint",
        title: "您的投诉已处理",
        body: `投诉「${complaint.title || complaint.id}」已处理完成。处理结果：${result || "已处理完毕，请知悉。"}`,
        link: `/c/complaints/${id}`,
      })
    }
```

（`complaint.userId` / `complaint.title` 字段名按实际 `Complaint` 类型调整。先 `grep -n "interface Complaint\|type Complaint" src/features/complaints/store/store.ts src/shared/types/ -r` 确认字段）

- [ ] **Step 4：在驳回方法内加通知**

找到驳回方法（→ CR），在 `set(...)` 之后加：

```typescript
    const complaint = get().complaints.find((c) => c.id === id)
    if (complaint) {
      useNotificationStore.getState().addNotification({
        userId: complaint.userId,
        type: "complaint",
        title: "您的投诉已被驳回",
        body: `投诉「${complaint.title || complaint.id}」已被驳回。原因：${reason}。`,
        link: `/c/complaints/${id}`,
      })
    }
```

（`reason` 参数名按实际方法签名调整）

- [ ] **Step 5：typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: 无错误

- [ ] **Step 6：提交**

```bash
git add src/features/complaints/store/store.ts
git commit -m "feat: push notification on complaint resolve/reject"
```

---

## Task 4：公告发布推送通知

**背景：** 桌面端发布/更新公告 → C 端"公告通知"页能看到，但用户不会收到推送通知，新公告触达不到用户。

**Files:**
- Modify: `src/features/announcement/store/*.ts`（找到 add/create/publish 公告的方法）

- [ ] **Step 1：定位公告创建/发布方法**

Run: `grep -rn "add\|create\|publish\|save" src/features/announcement/store/ | grep -i "announcement\|notice" | head -15`
Expected: 看到方法名和文件

- [ ] **Step 2：查看 announcement store 结构**

Run: `cat src/features/announcement/store/index.ts`
Expected: 看到 barrel 导出的 store 和方法

- [ ] **Step 3：在公告发布方法内加批量通知**

文件：`src/features/announcement/store/` 下含 add/create 方法的文件

在 import 块后加：
```typescript
import { useNotificationStore } from "@/platform/notification"
```

在公告创建/发布的 `set(...)` 之后加：

```typescript
    useNotificationStore.getState().addNotification({
      type: "announcement",
      title: "新公告：" + (announcement.title || "平台公告"),
      body: (announcement.content || "").slice(0, 50) + "...",
      link: "/c/announcement/" + announcement.id,
    })
```

**注意：** 公告是面向所有用户的广播，`Notification` 若无 `userId` 字段则代表全员通知（按 `platform/notification/store.ts` 实际语义处理；若有 `userId` 字段，则广播用空字符串或不传，由 NotificationsPage 展示所有无 userId 的为全员通知）。`announcement` 变量名和字段按实际方法参数调整。

- [ ] **Step 4：typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: 无错误

- [ ] **Step 5：提交**

```bash
git add src/features/announcement/store/
git commit -m "feat: push notification on announcement publish"
```

---

## Task 5：供应商审核结果推送通知

**背景：** 用户在 C 端 `SupplierEntryPage` 提交供应商入驻申请 → 桌面端 `supplier-applications` 审核 → 用户收不到结果。

**Files:**
- Modify: `src/features/supplier/store/supplier-store.ts`

- [ ] **Step 1：查看 supplier store 的审核方法**

Run: `grep -n "approve\|reject\|status" src/features/supplier/store/supplier-store.ts | head -20`
Expected: 看到审核方法名

- [ ] **Step 2：加 notification import**

文件：`src/features/supplier/store/supplier-store.ts`

在 import 块后加：
```typescript
import { useNotificationStore } from "@/platform/notification"
```

- [ ] **Step 3：在 approve 方法内加通知**

找到 approve 方法，在 `set(...)` 之后加：

```typescript
    const app = get().applications.find((a) => a.id === id)
    if (app) {
      useNotificationStore.getState().addNotification({
        userId: app.userId,
        type: "merchant",
        title: "供应商入驻审核通过",
        body: `您的供应商入驻申请已通过，您现在可以登录桌面端管理商品。`,
        link: "/desktop/supplier-entry",
      })
    }
```

（`app.userId` 字段名按实际 `SupplierApplication` 类型调整。先 `grep -n "interface SupplierApplication\|userId\|contactPhone" src/features/supplier/store/supplier-store.ts` 确认）

- [ ] **Step 4：在 reject 方法内加通知**

找到 reject 方法，在 `set(...)` 之后加：

```typescript
    const app = get().applications.find((a) => a.id === id)
    if (app) {
      useNotificationStore.getState().addNotification({
        userId: app.userId,
        type: "merchant",
        title: "供应商入驻审核未通过",
        body: `您的供应商入驻申请未通过。原因：${reason}。`,
        link: "/c/merchant-services",
      })
    }
```

- [ ] **Step 5：typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: 无错误

- [ ] **Step 6：提交**

```bash
git add src/features/supplier/store/supplier-store.ts
git commit -m "feat: push notification on supplier application review result"
```

---

## Task 6：志愿服务完成触发积分获取

**背景：** `points-store` 定义了 `volunteer_service` 积分规则（每服务 1 点，日上限 100），但 `features/volunteer/` 从未调用 `transact`，志愿服务完成不会加积分。`checkin-store` 已有正确的调用范式可参考。

**Files:**
- Modify: `src/features/volunteer/store/*.ts`（找到完成签到/服务的方法）

- [ ] **Step 1：定位 volunteer store 的"完成"方法**

Run: `grep -rn "complete\|finish\|signUp\|checkin\|hours" src/features/volunteer/store/ | head -20`
Expected: 看到方法名和文件

- [ ] **Step 2：查看 checkin-store 的范式**

Run: `sed -n '70,85p' src/features/checkin/store/checkin-store.ts`
Expected: 看到 `usePointsStore.getState().transact(c.userId, "courtyard_checkin", id)` 的调用方式

- [ ] **Step 3：在 volunteer store 加 points import**

文件：`src/features/volunteer/store/` 下含完成方法的文件

在 import 块后加：
```typescript
import { usePointsStore } from "@/features/points/store"
```

**注意：** 这是 `volunteer` → `points` 的 feature 间 import。`points` 是被消费方。这违反 feature-first 的"不互导"纪律。**正确做法**：`transact` 的调用应在页面层（volunteer/c-end/pages 的完成回调里）而非 store 层。但 checkin-store 已在 store 层调用 points-store，作为既有范式，本计划沿用。

如果项目严格禁止 feature 互导，则改为在 volunteer 的 C 端完成页面里调用 `usePointsStore.getState().transact(...)`，不在 store 里调。**选择 store 层调用**（与 checkin 一致），保持范式统一。

- [ ] **Step 4：在完成方法内加 transact 调用**

找到"服务完成"或"签到确认"方法（增加 serviceHours 或标记完成的地方），在 `set(...)` 之后加：

```typescript
    usePointsStore.getState().transact(userId, "volunteer_service", recordId)
```

（`userId` 是当前志愿者 userId；`recordId` 是服务记录 id。变量名按实际方法参数调整。`transact` 内部会查 `volunteer_service` 规则的 `points` 和 `dailyLimit`，自动处理日上限）

- [ ] **Step 5：typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: 无错误

- [ ] **Step 6：手动验证（可选）**

Run: `npm run dev`，登录志愿者账号，完成一次志愿服务，进"积分中心"确认有"志愿服务"+2 记录。验证后停止 dev。

- [ ] **Step 7：提交**

```bash
git add src/features/volunteer/store/
git commit -m "feat: trigger points earning on volunteer service completion"
```

---

## Task 7：扩展 NotificationType（若需要）

**背景：** Task 1-5 用了 `type: "merchant" | "complaint" | "announcement"` 等。若 `platform/notification/store.ts` 的 `NotificationType` 不含这些值，需要扩展。

**Files:**
- Modify: `src/platform/notification/store.ts`

- [ ] **Step 1：查看当前 NotificationType**

Run: `grep -n "NotificationType\|type:" src/platform/notification/store.ts | head -10`
Expected: 看到当前支持的类型（可能是 `"order" | "system" | ...`）

- [ ] **Step 2：扩展类型**

文件：`src/platform/notification/store.ts`

找到 `NotificationType` 定义，扩展为：

```typescript
export type NotificationType = "order" | "system" | "merchant" | "complaint" | "announcement"
```

（保留原有类型，追加新的。若原有已有部分，只补缺的）

- [ ] **Step 3：更新 NotificationsPage 的 Tab 配置（若有 type 过滤）**

文件：`src/features/notification/c-end/pages/NotificationsPage.tsx`

如果页面有按 type 过滤的 Tab，确认新 type 有对应 Tab 或归入"全部"。查看：

Run: `grep -n "activeTab\|NotificationType\|type ===" src/features/notification/c-end/pages/NotificationsPage.tsx | head -10`

如果 Tab 是写死的枚举，补上新 type 的 Tab；如果"全部"Tab 已覆盖，则无需改。

- [ ] **Step 4：typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: 无错误

- [ ] **Step 5：提交**

```bash
git add src/platform/notification/store.ts src/features/notification/c-end/pages/NotificationsPage.tsx
git commit -m "feat: extend NotificationType with merchant/complaint/announcement"
```

---

## Task 8：全量验证与收尾

**Files:** 无新增，仅验证

- [ ] **Step 1：全量构建 + lint + typecheck + test**

Run:
```bash
npm run lint && npm run typecheck && npm run build && npm run verify:all
```
Expected: 全部通过

- [ ] **Step 2：手动验证业务闭环（可选但推荐）**

Run: `npm run dev`，依次验证：

1. **认领审核闭环**：商户账号登录 C 端 → 提交认领申请 → 切到桌面端管理员 → 古城商户审核 → 通过 → 切回 C 端 → 通知中心有"店铺认领/入驻审核通过"通知。
2. **投诉处理闭环**：游客账号提交投诉 → 桌面端投诉管理 → 处理完成 → 游客通知中心有"您的投诉已处理"。
3. **积分闭环**：志愿者账号完成志愿服务 → 积分中心有"志愿服务"积分记录。

验证后停止 dev。

- [ ] **Step 3：确认 git 干净**

Run: `git status`
Expected: `nothing to commit, working tree clean`

---

## 附录：本计划不涵盖的内容

- **首页搜索栏功能**（C1）：属 UX 补全，子项目 3 处理。
- **skeleton 加载态**（C2）：属 UX 补全，子项目 3 处理。
- **空状态标准化**（C3）：属 UX 补全，子项目 3 处理。
- **trust-score 流程**（D2）：已在子项目 1 删除整个 feature。

---

## 执行顺序总结

```
Task 1 (认领/入驻通知) → Task 2 (信息变更通知) → Task 3 (投诉处理通知)
→ Task 4 (公告发布通知) → Task 5 (供应商审核通知) → Task 6 (志愿积分闭环)
→ Task 7 (扩展 NotificationType，若 Task 1-5 需要) → Task 8 (收尾验证)
```

**注意 Task 7 的时机：** 如果 Task 1-5 中遇到 `NotificationType` 不支持新 type 的 typecheck 错误，立即跳到 Task 7 扩展类型，再回到原 Task 继续。Task 7 可在任何时候执行。
