# 投诉管理模块 — 产品需求文档

> **文档版本**：v1.0
> **更新日期**：2026-07-07
> **产品定位**：面向丽江古城的独立投诉渠道，支持 C 端游客自助提交 + 桌面端管理员审核处理
> **关联模块**：便民服务订单（convenience_orders）
> **实现状态**：已有 MVP 实现，本文档同时记录当前实现中的已知缺陷

---

## 一、定位与边界

### 1.1 我们在做什么

投诉管理模块是丽江古城旅游服务平台的一个独立功能模块。它与便民服务订单系统解耦——用户不需要关联任何便民服务订单，即可对古城内的商户、公共环境、个人等对象提起投诉。

**核心目标：**

- ✅ 为游客、本地居民和工作人员提供一个便捷的投诉提交入口
- ✅ 管理员后台统一审核和处理投诉，结果向用户同步
- ✅ 投诉记录可追溯、可统计、可归档
- ✅ 与便民服务订单系统隔离，不互相依赖

### 1.2 MVP 原则

| 优先级 | 原则 | 说明 |
|--------|------|------|
| 必须 | 投诉提交流程闭环 | 填写 → 提交 → 审核 → 结果反馈，每一步不能断 |
| 必须 | 数据完整可追溯 | 投诉记录需保留完整的上报人信息、当事对象信息、处理日志 |
| 必须 | 管理员处理流程完整 | 查看、处理完成、驳回（含原因） |
| 可以简化 | 证据材料纯展示 | MVP 用占位图模拟上传，不接入真实图片上传 |
| 可以简化 | 处罚分手动填写 | 管理员在处理投诉时手动输入处罚分值，不自动计算 |
| 以后做 | 投诉与订单深度关联 | 当前投诉与便民服务订单弱关联（orderId 可选） |
| 以后做 | 自动化处罚 | 投诉成分自动递减 staff 派单优先级 |
| 以后做 | 用户补充材料 | 允许用户提交后上传补充证据 |

### 1.3 明确不做的（MVP 边界）

- 投诉与便民服务订单状态机相互影响（投诉处理不影响订单状态）
- 投诉自动转 S90 等订单异常状态
- 投诉成立后自动退款/赔偿
- 多次投诉自动累积处罚的逻辑
- 投诉分类与智能分派
- 投诉匿名/实名切换
- 用户对处理结果不满意再次申诉

---

## 二、用户角色

| 角色 | 端 | 核心诉求 |
|------|----|----------|
| **C 端用户（游客/本地居民/工作人员）** | C 端小程序 | 快速提交投诉，上传证据，查看处理进度和结果 |
| **平台管理员（platform_admin）** | 桌面端后台 | 统一查看所有投诉，处理完成或驳回，维护平台投诉电话 |

### 角色权限

| 操作 | 游客 | 工作人员 | 本地居民 | 管理员 |
|------|------|----------|----------|--------|
| 提交投诉 | ✅ | ✅ | ✅ | — |
| 查看自己的投诉列表 | ✅ | ✅ | ✅ | — |
| 查看投诉详情 | ✅（仅自己） | ✅（仅自己） | ✅（仅自己） | ✅（全部） |
| 撤回投诉 | ✅ | ✅ | ✅ | — |
| 搜索/筛选投诉 | — | — | — | ✅ |
| 处理完成（C10→C40） | — | — | — | ✅ |
| 驳回（C10→CR） | — | — | — | ✅ |
| 修改平台投诉电话 | — | — | — | ✅ |

---

## 三、投诉处理业务流程

### 3.1 主流程

```
用户打开投诉页面
    ↓
填写上报人信息（姓名/性别/电话/举报人类型）
    ↓
填写当事对象信息（对象类型/名称/片区/地点/门牌号）
    ↓
选择问题类型 + 填写反映内容 + 可选上传照片（最多 3 张）
    ↓
提交投诉
    ↓
【C10 已提交】← 用户可在列表页查看，可撤回
    ↓
管理员在后台查看投诉详情
    ├─ 处理完成 → 填写处理结果 → 【C40 已处理】
    └─ 驳回 → 填写驳回原因 → 【CR 已驳回】
    ↓
用户端同步看到处理结果
```

### 3.2 投诉状态机

| 状态码 | 状态名 | 说明 | 阶段 |
|--------|--------|------|------|
| C10 | 已提交 | 用户提交投诉，等待管理员审核 | 待处理 |
| C40 | 已处理 | 管理员处理完成，处理结果已反馈 | 终态 |
| CR | 已驳回 | 管理员驳回，并说明原因 | 终态 |

**状态流转规则：**

| 源状态 | 目标状态 | 触发动作 | 触发方 |
|--------|----------|----------|--------|
| — | C10 | submitComplaint | C 端用户 |
| C10 | C40 | resolve（处理完成） | 管理员 |
| C10 | CR | reject（驳回） | 管理员 |
| C10 | C10 | 撤回投诉（前端模拟，无后端对应） | C 端用户 |

> **架构红线**：所有状态变更由前端调用 Server API 触发，Server 端写入数据库后返回最新数据。前端不直接修改状态。

### 3.3 与便民服务订单的关系

- **弱关联**：投诉的 `orderId` 字段为可选填写项。当前 MVP 的前端表单未提供订单关联入口，`orderId` 始终传空字符串。
- **处罚隔离**：管理员处理完成后，后端会更新关联 staff 的 `complaintCount` 和 `penaltyScore`，但这不影响订单状态或派单算法（MVP 阶段派单算法不消费 `penaltyScore`）。

---

## 四、功能清单

### 4.1 P0 必须有（MVP 缺一不可）

#### C 端用户

- **提交投诉**（含完整表单：上报人信息、当事对象信息、问题类型、反映内容、照片）
- **我的投诉列表**（按状态标签筛选：全部/已提交/已处理/已驳回；支持搜索）
- **投诉详情**（展示状态时间线、投诉信息、处理结果、附件图片预览）
- **撤回投诉**（仅前端本地操作，无后端对应）
- **平台投诉电话展示**（从 store 读取，管理员可后台修改）

#### 管理员后台

- **投诉统计看板**（全部/已提交/已处理/已驳回四个统计卡片）
- **投诉列表**（支持按状态筛选、多字段搜索）
- **投诉详情弹窗**（完整展示上报人、当事对象、事发位置、反映内容、附件照片）
- **处理完成操作**（填写处理结果，状态变 C40）
- **驳回操作**（填写驳回原因，状态变 CR）
- **平台投诉电话编辑**（修改后同步到 C 端）

#### 系统能力

- 投诉 CRUD API（Server 端，基于通用 `crudRoutes`）
- 投诉处理（resolve）API — 更新状态 + 更新 staff 统计
- 投诉驳回（reject）API — 更新状态 + 写入驳回原因
- 投诉列表支持按 `status` / `userId` / `type` 筛选

### 4.2 P1 建议有（提升体验，有空就做）

- **用户补充材料**（C10 状态下允许用户补充文字和照片）
- **投诉处理结果通知**（处理完成或驳回后，通过系统通知触达用户）
- **投诉删除**（管理员可软删除恶意投诉或误提交的投诉）
- **投诉分类统计报表**（按时段/类型/片区统计投诉量）

### 4.3 P2 以后做（远期规划）

- **投诉与便民服务订单打通**：用户可直接从订单详情页跳转到投诉页并自动关联订单
- **处罚结果影响派单优先级**：投诉成比例较高的 staff 派单权重下降
- **用户申诉机制**：对处理结果不满意可申请复核
- **投诉模板与智能分类**：根据关键词自动分类投诉
- **批量处理**：管理员一次处理多条同类投诉
- **导出投诉报表**（Excel/CSV）

---

## 五、数据模型

### 5.1 投诉表（complaints）— DB 现有结构

| 字段 | 类型 | 说明 | MVP 必填 |
|------|------|------|----------|
| id | TEXT (PK) | 投诉单号，自动生成 | 系统 |
| orderId | TEXT | 关联便民服务订单 ID（可选，默认空字符串） | 否 |
| userId | TEXT | 提交人用户 ID | 是 |
| type | TEXT | 问题类型 | 是 |
| content | TEXT | 反映内容 | 是 |
| images | TEXT (JSON) | 附件图片 URL 数组 | 否 |
| status | TEXT | 状态：C10/C40/CR | 系统 |
| targetName | TEXT | 当事对象名称 | 是 |
| reporterType | TEXT | 举报人类型（工作人员/本地居民/游客） | 是 |
| reporterName | TEXT | 上报人姓名 | 是 |
| reporterGender | TEXT | 上报人性别（男/女） | 是 |
| reporterPhone | TEXT | 联系电话 | 是 |
| objectType | TEXT | 对象类型（酒吧/客栈/旅拍摄影/餐饮/商品零售/民居/公共环境/其他/个人） | 是 |
| incidentArea | TEXT | 事发片区 | 是 |
| incidentLocation | TEXT | 事发地点 | 是 |
| doorplate | TEXT | 门牌号 | 是 |
| channelNote | TEXT | 渠道说明文案 | 否 |
| result | TEXT | 处理结论/驳回原因 | 否 |
| handledAt | TEXT (datetime) | 处理时间 | 否 |
| createdAt | TEXT (datetime) | 创建时间 | 系统 |
| updatedAt | TEXT (datetime) | 更新时间 | 系统 |

### 5.2 投诉相关类型定义（TypeScript）

```typescript
type ComplaintStatus = "C10" | "C40" | "CR"

type Complaint = {
  id: string
  orderId: string
  userId: string
  type: string
  content: string
  images: string[]
  status: ComplaintStatus
  createdAt: string
  targetName?: string
  reporterType?: "工作人员" | "本地居民" | "游客"
  reporterName?: string
  reporterGender?: "男" | "女"
  reporterPhone?: string
  objectType?: "酒吧" | "客栈" | "旅拍摄影" | "餐饮" | "商品零售" | "民居" | "公共环境" | "其他" | "个人"
  incidentArea?: string
  incidentLocation?: string
  doorplate?: string
  channelNote?: string
  result?: string
  handledAt?: string
}
```

### 5.3 字段对照：参考文档 vs 当前实现

参考文档 `便民服务平台 MVP 1.0` 第 7.10 节定义了投诉表，当前实现与参考文档的差异：

| 参考文档字段 | 当前实现 | 说明 |
|-------------|----------|------|
| `evidence_urls`（JSON） | `images`（JSON） | 命名不同，用途一致 |
| `staff_id` | 无独立字段 | 通过 `orderId` → `convenience_orders.staffId` 间接关联 |
| `penalty_score_delta` | 未持久化到 complaints 表 | 仅作为 resolve API 的请求参数，直接更新 staff.penaltyScore |
| `refund_amount` | 未实现 | MVP 不做退款 |
| `reviewed_by` | 未实现 | 操作日志可追溯 |
| `reviewed_at` | `handledAt` | 命名不同 |

---

## 六、API 设计

### 6.1 CRUD 端点（由通用 crudRoutes 自动生成）

| 方法 | 路径 | 说明 | 支持筛选 |
|------|------|------|----------|
| GET | `/api/v1/complaints` | 列表分页查询 | status, userId, type, sort, page, pageSize |
| GET | `/api/v1/complaints/:id` | 单条详情 | — |
| POST | `/api/v1/complaints` | 新建投诉 | — |
| PATCH | `/api/v1/complaints/:id` | 更新投诉 | — |
| DELETE | `/api/v1/complaints/:id` | 删除投诉 | — |

### 6.2 业务端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/complaints/:id/resolve` | 投诉处理完成 → C40 |
| POST | `/api/v1/complaints/:id/reject` | 投诉驳回 → CR |

**resolve 请求体：**
```json
{
  "result": "已联系商户进行整改，用户表示谅解",
  "penaltyScoreDelta": 3
}
```

**reject 请求体：**
```json
{
  "reason": "经核实，该投诉不成立"
}
```

### 6.3 resolve 后端逻辑

1. 校验投诉存在（404 兜底）
2. 将 `status` 更新为 `C40`，写入 `result` 和 `handledAt`
3. 通过 `orderId` 查询 `convenience_orders` 获取 `staffId`
4. 若关联订单和 staff 存在，更新该 staff：
   - `complaintCount += 1`
   - `penaltyScore += penaltyScoreDelta`（默认 3 分）
5. 返回更新后的投诉记录

---

## 七、路由与导航

| 端 | 路径 | 页面组件 | 说明 |
|----|------|----------|------|
| C | `/c/complaint` | ComplaintFormPage | 投诉提交表单 |
| C | `/c/my-complaints` | MyComplaintsPage | 我的投诉列表 |
| C | `/c/complaint/:id` | ComplaintDetailPage | 投诉详情 |
| Desktop | `/desktop/complaints` | ComplaintPage | 投诉管理后台 |

### 已知路由问题

| 位置 | 问题 | 影响 |
|------|------|------|
| MyComplaintsPage.tsx:49 | 空状态按钮导航到 `/c/complaints/new`，但实际注册路由为 `/c/complaint` | 点击后跳转到 404 页面 |
| MyComplaintsPage.tsx:130 | FAB 按钮导航到 `/c/complaint`，与实际路由一致 | 正常情况下 OK，需保持新旧路由兼容 |

---

## 八、当前实现缺陷与修复建议

### 8.1 硬编码用户 ID（P0 — 必须修复）

**现象：**
- `MyComplaintsPage.tsx:31`：`complaints.filter((c) => c.userId === "u_c_001")`
- `ComplaintFormPage.tsx:78`：`createComplaint({ ... userId: "u_c_001" ... })`

**影响：** 所有用户看到的都是固定用户`u_c_001`的投诉列表；新建投诉的`userId`也写死，无法区分投诉归属。

**修复方案：** 从 `useAuthStore` 读取当前登录用户的 `user.id`，替换硬编码。

### 8.2 Store 缺少数据加载逻辑（P0 — 必须修复）

**现象：** `useComplaintStore` 没有 `fetchComplaints` 或 `loadComplaints` 方法，初始化时 `complaints` 数组为空。

**影响：** 页面刷新后，除非用户新建了一个投诉，否则列表页和桌面端全部显示空数据。

**修复方案：** 添加 `fetchComplaints` store action，在页面挂载时调用 `complaintsApi.list()` 拉取数据。

### 8.3 桌面端数据源依赖前端内存（P1 — 建议修复）

**现象：** `ComplaintPage.tsx:79-90` 的 `fullList` 计算依赖于前端 store 中的 `complaints` 和 `orders`，数据只在当前会话中存在。

**影响：** 刷新页面后数据丢失，管理员看到的是空的投诉列表。

**修复方案：** 桌面端页面挂载时调用 `fetchComplaints`，配合筛选参数（status、userId、type）直接从 Server 端获取数据。

### 8.4 撤回投诉没有后端对应（P1 — 建议修复）

**现象：** `ComplaintDetailPage.tsx:133` 的撤回操作只弹了一个 toast 并导航，没有调用任何 API。

**影响：** 用户撤回投诉后，数据仍然留在数据库中，状态仍是 C10。

**修复方案：** 添加撤回 API（DELETE 或 PATCH 置为撤回状态），前端调用后端后再更新本地 store。

### 8.5 补充材料功能占位（P2 — 可延缓）

**现象：** `ComplaintDetailPage.tsx:126` 的"补充材料"按钮仅展示 toast "功能开发中"，无实际功能。

**影响：** 用户可能认为功能可用。建议要么实现，要么隐藏按钮。

---

## 九、验收标准

### 9.1 用户端验收

- [ ] 游客/本地居民/工作人员均可正常提交投诉，表单完整必填校验通过
- [ ] 提交成功后状态为 C10，在我的投诉列表中可见
- [ ] 我的投诉列表支持按状态标签筛选（全部/C10/C40/CR）
- [ ] 我的投诉列表支持按编号/内容/当事对象名称搜索
- [ ] 投诉详情页正确展示状态时间线、投诉信息、处理结果、附件图片
- [ ] 已提交（C10）状态可看到撤回按钮
- [ ] 已处理（C40）状态可看到处理结果内容
- [ ] 已驳回（CR）状态可看到驳回原因
- [ ] 图片可点击预览大图
- [ ] 平台投诉电话正确显示并可拨打
- [ ] **硬编码 userId 已修复**：不同用户看到的投诉列表不同
- [ ] **路由导航正确**：空状态按钮和 FAB 按钮都跳转到 `/c/complaint`

### 9.2 管理员端验收

- [ ] 管理员可查看全部投诉，按状态筛选
- [ ] 管理员可通过单号/上报人/当事对象/门牌号搜索投诉
- [ ] 统计数据正确（全部/已提交/已处理/已驳回计数）
- [ ] 投诉详情弹窗展示所有信息
- [ ] 处理完成：填写处理结果，确认后状态变 C40，用户端可见
- [ ] 驳回操作：填写驳回原因，确认后状态变 CR，用户端可见
- [ ] 驳回操作必须填写原因，空值不被允许
- [ ] 平台投诉电话可编辑并保存

### 9.3 后端验收

- [ ] 投诉创建 API 正确写入所有字段
- [ ] resolve API 正确更新状态为 C40，写入 result 和 handledAt
- [ ] resolve API 正确更新关联 staff 的 complaintCount 和 penaltyScore
- [ ] reject API 正确更新状态为 CR，写入 result
- [ ] 投诉列表 API 支持的筛选参数（status/userId/type）正确工作
- [ ] **Store 数据加载逻辑已实现**：页面刷新后投诉数据正常显示

### 9.4 非功能验收

- [ ] 刷新页面后投诉数据不丢失（Server 端持久化 + Store 加载逻辑）
- [ ] 不同用户的投诉互相隔离（userId 筛选正确工作）
- [ ] 投诉状态变更可追溯（Server 端有操作日志，或至少写入 handledAt）
- [ ] 页面路由导航不报 404 错误

---

## 十、依赖关系

| 模块 | 依赖说明 | 耦合度 |
|------|----------|--------|
| convenience_orders 表 | resolve API 通过 orderId → staffId 更新处罚数据 | 弱（orderId 可空） |
| staff 表 | resolve API 更新 complaintCount/penaltyScore | 弱（无关联 order 时跳过） |
| useAuthStore | 前端需要当前用户 ID 替代硬编码 | 强 |
| useNotificationStore | 处理完成/驳回后发送系统通知（已实现） | 弱（可选） |

---

## 十一、相关文件

| 文件路径 | 说明 |
|----------|------|
| `server/routes/complaints.js` | 投诉 API 路由（CRUD + resolve + reject） |
| `server/db/schema.sql` | 投诉表 DDL |
| `src/features/complaints/store/store.ts` | zustand store |
| `src/features/complaints/c-end/pages/ComplaintFormPage.tsx` | C 端投诉提交页 |
| `src/features/complaints/c-end/pages/MyComplaintsPage.tsx` | C 端我的投诉列表页 |
| `src/features/complaints/c-end/pages/ComplaintDetailPage.tsx` | C 端投诉详情页 |
| `src/features/complaints/desktop/pages/ComplaintPage.tsx` | 桌面端投诉管理页 |
| `src/shared/types/index.ts` | Complaint / ComplaintStatus 类型定义 |
| `src/api/client.ts` | complaintsApi 定义 |
| `src/c-end/routes.tsx` | C 端路由配置 |
| `src/desktop/App.tsx` | 桌面端路由配置 |
| `src/desktop/nav.ts` | 桌面端侧边栏菜单 |