# 通知中心模块 — 产品需求文档

> **文档版本**：v1.0
> **更新日期**：2026-07-07
> **产品定位**：C 端系统级通知中心，聚合各业务模块推送到用户的消息通知
> **实现状态**：已有 MVP 实现
> **架构说明**：store 位于 `platform/notification/`（基础设施层，跨 feature 调用），页面位于 `features/notification/`（UI 层）

---

## 一、定位与边界

### 1.1 我们在做什么

通知中心是丽江古城旅游服务平台 C 端的一个集中消息展示模块。所有业务模块（便民服务、投诉、商家审核、供应商、公告、志愿服务）在关键操作完成后，通过统一的 `addNotification` API 向通知中心推送消息，用户在 C 端查看。

**核心目标：**

- ✅ 为 C 端用户提供一个集中查看各类通知消息的入口
- ✅ 按类型分类展示（订单 / 活动 / 系统），方便筛选
- ✅ 支持已读/未读状态管理
- ✅ 支持删除与标记全部已读
- ✅ 模拟实时消息推送体验（Demo 中每 30 秒推送一条模拟通知）

### 1.2 MVP 原则

| 优先级 | 原则 | 说明 |
|--------|------|------|
| 必须 | 通知聚合展示 | 所有业务模块能通过 store API 推送通知到通知中心 |
| 必须 | 已读/未读管理 | 用户点击即标记已读，支持标记全部已读 |
| 必须 | 类型筛选 | 按全部/订单/活动/系统 4 类 tab 筛选 |
| 必须 | store 持久化 | zustand localStorage 持久化，刷新不丢数据 |
| 可以简化 | 无服务端推送 | 所有通知均来源于前端业务操作触发，无 WebSocket/REST 后端推送 |
| 可以简化 | 通知触发为同步调用 | 业务操作完成后同步调用 `addNotification`，非异步消息队列 |
| 以后做 | 服务端通知管理 | 通知存储到数据库、服务端推送、设备推送（PUSH） |
| 以后做 | B 端/桌面端通知中心 | 当前仅 C 端可见，B 端和桌面端无通知页面 |

### 1.3 明确不做的（MVP 边界）

- ❌ 服务端推送（WebSocket / SSE / MQ 等）
- ❌ 通知数据服务端持久化（当前仅 localStorage）
- ❌ 设备级推送（iOS/Android PUSH）
- ❌ B 端和桌面端的通知页面
- ❌ 通知设置的偏好管理（不接收某类通知等）
- ❌ 通知音效或振动

---

## 二、核心用户角色

| 角色 | 端 | 核心诉求 |
|------|----|----------|
| **C 端用户（游客/本地居民/商户）** | C 端小程序 | 集中查看订单进度、审核结果、活动消息等各类系统通知 |

### 通知类型与可见性

| 通知类型 | C 端 | B 端 | 桌面端 |
|----------|------|------|--------|
| 全部通知 | ✅ 通知中心页面 | ❌ | ❌ |
| 订单通知 | ✅ 订单 Tab | ❌ | ❌ |
| 活动通知 | ✅ 活动 Tab | ❌ | ❌ |
| 系统通知 | ✅ 系统 Tab | ❌ | ❌ |

> 通知仅 C 端可见。B 端和桌面端没有独立的通知中心页面。各业务模块通知仅向 C 端用户触达。

---

## 三、核心业务流程

### 3.1 通知生命周期

```
业务操作完成（下单/审核/发布...）
    ↓
调用 useNotificationStore.getState().addNotification({...})
    ↓
自动生成 id + time + isRead=false
    ↓
插入到 notifications 数组头部（最新在前）
    ↓
同步持久化到 localStorage（键: notifications-store）
    ↓
用户打开 /c/notifications 页面
    ↓
按类型 Tab 筛选展示
    ├─ 点击通知卡片 → 标记已读 + 可选跳转目标页面
    ├─ 向左滑动 → 显示删除按钮 → 点击删除
    └─ 顶部"全部已读" → 全部标记为已读
```

### 3.2 模拟实时推送

Demo 中 NotificationsPage 挂载后启动一个 `setInterval`，每 30 秒从 5 个模板中随机选取一条，调用 `addNotification` 推送到通知中心，同时显示 Toast 弹窗提示。实际场景本应由服务端长连接推送。

| 模板类型 | 标题 | 摘要 | 目标路由 |
|----------|------|------|----------|
| order | 便民服务进度更新 | 您的便民服务订单已更新，请查看服务进度 | /c/orders |
| order | 服务人员已接单 | 服务人员已接单，稍后会按约定时间上门服务 | /c/orders |
| system | 积分变动提醒 | 您有200积分即将在30天内过期，请及时使用 | 无 |
| activity | 古城资讯更新 | 古城资讯与便民信息已有新公告 | 无 |
| order | 评价提醒 | 您有未评价的便民服务订单 | 无 |

### 3.3 通知触发清单（15 个触发点，覆盖 6 个业务模块）

| 触发场景 | 触发模块 | 文件（行号） | type | 目标 URL |
|----------|----------|--------------|------|----------|
| 订单已提交 | convenience | `store/store.ts:91` | order | /c/orders |
| 订单已指派 | convenience | `store/store.ts`（notifyConvenience 封装） | order | /c/orders |
| 订单已接单 | convenience | `store/store.ts`（notifyConvenience 封装） | order | /c/orders |
| 订单已核价 | convenience | `store/store.ts:168` | order | /c/orders/:id |
| 支付成功 | convenience | `store/store.ts:204` | order | /c/orders/:id |
| 支付超时 | convenience | `store/store.ts:180` | order | /desktop/convenience |
| 服务完成 | convenience | `store/store.ts`（notifyConvenience 封装） | order | /c/orders/:id |
| 投诉处理完成 | complaints | `store/store.ts:33` | system | /c/complaints/:id |
| 投诉被驳回 | complaints | `store/store.ts:48` | system | /c/complaints/:id |
| 店铺认领审核通过 | merchant-review | `store/registration-store.ts:177` | system | 无 |
| 店铺认领审核未通过 | merchant-review | `store/registration-store.ts:198` | system | 无 |
| 店铺信息变更审核通过 | merchant-review | `store/store.ts:79` | system | 无 |
| 店铺信息变更审核未通过 | merchant-review | `store/store.ts:100` | system | 无 |
| 供应商入驻审核通过 | supplier | `store/supplier-store.ts:41` | system | 无 |
| 供应商入驻审核未通过 | supplier | `store/supplier-store.ts:41` | system | 无 |
| 新公告发布 | announcement | `store/announcement-store.ts:69` | system | 无 |
| 志愿者审核通过 | volunteer | `store/store.ts:557` | system | /c/volunteer |
| 志愿者审核未通过 | volunteer | `store/store.ts:586` | system | /c/volunteer |
| 志愿活动发布 | volunteer | `store/store.ts:698` | system | /c/volunteer/activities |
| 志愿活动取消 | volunteer | `store/store.ts:718` | system | /c/volunteer/activities |

> 除便民服务订单通知使用 `type: "order"` 外，其他所有业务模块的通知均使用 `type: "system"`。`type: "activity"` 目前仅由模拟推送模板使用，无真实业务触发源。

---

## 四、功能模块清单

### 4.1 P0 — 必须有（MVP 缺一不可）

#### C 端用户

- **通知列表页**：展示所有通知，按时间倒序排列，分页加载（每页 10 条）
- **Tab 筛选**：全部 / 订单 / 活动 / 系统 四个 Tab，切换后即时过滤
- **未读角标**：每个 Tab 展示对应分类的未读计数
- **点击标记已读**：点击通知卡片即标记为已读
- **全部标记已读**：列表顶部提供"全部已读"操作按钮
- **滑动删除**：向左滑动显示红色删除按钮，点击删除通知
- **空状态**：无通知时展示"暂无消息"空态插图和文案
- **已读/未读视觉区分**：未读通知左侧显示蓝色竖线，字体加粗
- **3 条种子通知**：store 初始化时包含 3 条预设通知

#### 通知类型与图标

| 类型 | 图标 | 颜色 |
|------|------|------|
| order | Package（包裹图标） | #3B82F6（蓝色） |
| activity | Gift（礼物图标） | #8B5CF6（紫色） |
| system | Volume2（喇叭图标） | #6366F1（靛蓝） |

#### 系统能力

- **store 持久化**：zustand persist middleware，存储到 localStorage（key: `notifications-store`）
- **addNotification API**：供所有业务模块调用，自动生成 id/time
- **markAsRead / markAllAsRead / deleteNotification**：CRUD 接口
- **getUnreadCount**：未读数查询接口
- **模拟实时推送**：页面挂载后每 30 秒随机推送一条模板通知

### 4.2 P1 — 建议有（提升体验，有空就做）

- **通知入口未读角标**：ProfilePage 的消息通知入口右侧显示未读数红点
- **通知时间分组**：按"今天/昨天/更早"分组展示
- **activity 类型通知真实触发源**：为活动类通知增加真实业务触发场景

### 4.3 P2 — 以后做（远期规划）

- **服务端通知推送**：WebSocket / SSE 长连接，通知不依赖前端操作触发
- **通知存储到数据库**：服务端通知记录表，支持跨设备同步
- **通知阅读状态跨设备同步**：一个设备已读，其他设备同步标记
- **B 端/桌面端通知中心**：服务人员可接收订单通知，管理员可接收审核通知
- **通知偏好设置**：用户可选择性关闭某类通知
- **设备 PUSH**：集成微信/支付宝订阅消息或手机推送
- **通知批量操作**：批量删除、全部删除
- **通知历史归档**：自动清理超过 30 天的通知

---

## 五、核心数据模型

### 5.1 Notification 类型（`src/shared/types/index.ts`，L423-434）

```typescript
export type NotificationType = "order" | "activity" | "system"

export type Notification = {
  id: string          // 通知 ID，自动生成（格式: notif_{timestamp}）
  type: NotificationType  // 通知类型
  title: string       // 通知标题
  summary: string     // 通知摘要（列表页展示）
  time: string        // 时间显示文本（如 "10分钟前"、"今天 14:30"）
  isRead: boolean     // 已读/未读状态
  targetUrl?: string  // 可选目标路由，点击后跳转
  createdAt: string   // ISO 时间戳，用于排序
}
```

### 5.2 NotificationStore 状态与方法（`src/platform/notification/store.ts`）

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `notifications` | `Notification[]` | 通知列表（最新在前），初始含 3 条种子数据 |
| `addNotification(n)` | `(Omit<Notification, "id" \| "time" \| "isRead" \| "createdAt">) => void` | 添加通知，自动生成 id/time/isRead/createdAt |
| `markAsRead(id)` | `(id: string) => void` | 标记单条已读 |
| `markAllAsRead()` | `() => void` | 标记全部已读 |
| `deleteNotification(id)` | `(id: string) => void` | 删除单条通知 |
| `getUnreadCount()` | `() => number` | 获取未读总数 |

### 5.3 种子数据（store 初始化时，L17-45）

| ID | type | title | summary | isRead |
|----|------|-------|---------|--------|
| 1 | order | 便民服务进度更新 | 您的便民服务订单已指派服务人员，请留意电话联系 | false |
| 2 | activity | 春日文化节开幕 | 丽江古城春日文化节将于4月25日开幕，精彩活动等您参与 | false |
| 3 | system | 系统升级公告 | 系统将于今晚22:00-23:00进行维护升级 | true |

---

## 六、路由与导航

| 端 | 路径 | 页面组件 | 说明 |
|----|------|----------|------|
| C | `/c/notifications` | NotificationsPage | 通知列表页（C 端 + 顶部 PageHeader 返回 /c/home） |

**入口导航**：ProfilePage（`/c/profile`）中"消息通知"菜单项 → 跳转 `/c/notifications`

**路由定义**：`src/c-end/routes.tsx:248` — `{ path: "notifications", element: <NotificationsPage /> }`

---

## 七、当前实现缺陷与改进建议

### 7.1 通知入口缺少未读角标（P1 — 建议修复）

**现象**：ProfilePage 的"消息通知"菜单项仅展示图标和文字，未显示未读通知数量。

**影响**：用户无法直观感知有未读通知，降低了通知功能的有效触达率。

**修复方案**：在 ProfilePage 的"消息通知"行右侧添加红点或数字角标，从 `useNotificationStore.getUnreadCount()` 读取。

### 7.2 缺少 activity 类型触发源（P1 — 可考虑增加）

**现象**：`type: "activity"` 在 TypeScript 类型定义中存在，但没有任何业务模块推送 activity 类型的通知。目前仅模拟推送模板随机使用。

**影响**：用户在通知列表切到"活动"Tab 时，永远只有模拟推送的数据，没有真实的业务通知。

**修复方案**：在合适业务节点（如文化活动预约成功、集市活动提醒等）推送 activity 类型通知。

### 7.3 通知数据不跨设备同步（P2 — 远期规划）

**现象**：通知存储依赖于前端 zustand + localStorage，更换设备或清除浏览器数据后通知丢失。

**影响**：用户无法在不同设备上看到通知历史，通知功能仅适用于单设备 Demo 场景。

**修复方案**：服务端通知表 + REST API + WebSocket 推送。

---

## 八、验收标准

### 8.1 用户端验收

- [ ] C 端用户可在 `/c/notifications` 查看完整通知列表
- [ ] 列表按时间倒序排列，最新通知在顶部
- [ ] 支持全部/订单/活动/系统 4 个 Tab 分类筛选
- [ ] 每个 Tab 显示对应分类的未读计数角标
- [ ] 未读通知左侧有蓝色竖线标识，标题加粗
- [ ] 点击通知卡片 → 标记为已读（蓝色竖线消失、字重变轻）
- [ ] 点击带 targetUrl 的通知 → 跳转到对应业务页面
- [ ] 向左滑动通知卡片 → 显示红色删除按钮 → 点击删除成功
- [ ] 点击"全部已读" → 全部通知标记为已读
- [ ] 无通知时展示"暂无消息"空状态
- [ ] 通知数量超过 10 条时显示"加载更多"按钮
- [ ] 关闭页面重新打开，已标记的已读/删除状态保持（localStorage 持久化）
- [ ] 模拟推送每 30 秒新增一条通知并弹出 Toast

### 8.2 通知触发验收

- [ ] 提交便民服务订单后新增一条 order 类型通知
- [ ] 订单状态变更（接单/报价/支付等）新增 order 通知
- [ ] 投诉处理完成/驳回后新增 system 类型通知
- [ ] 店铺认领/信息变更审核通过/驳回后新增 system 通知
- [ ] 供应商入驻审核通过/驳回后新增 system 通知
- [ ] 志愿者审核通过/未通过后新增 system 通知
- [ ] 志愿活动发布/取消后新增 system 通知
- [ ] 新公告发布后新增 system 通知

### 8.3 后端验收

- [x] 无后端依赖：通知系统全部在客户端完成，无 Server 路由

### 8.4 非功能验收

- [ ] 通知列表在 100+ 条数据时滚动性能正常
- [ ] 分页加载每 10 条渐进展示，不一次性渲染全部
- [ ] 关闭页面后重新打开，通知数据通过 localStorage 恢复
- [ ] `addNotification` 调用不影响宿主操作的执行时间
- [ ] 模拟推送的 setInterval 在页面卸载时清除，不造成内存泄漏

### 8.5 未实现功能（❌）

| 验收项 | 状态 |
|--------|------|
| 服务端通知存储与推送（WebSocket / SSE） | ❌ |
| B 端/桌面端通知中心 | ❌ |
| 通知入口未读角标 | ❌ |
| 通知时间分组（今天/昨天/更早） | ❌ |
| 通知偏好设置 | ❌ |
| 设备 PUSH 集成 | ❌ |
| 通知批量操作（批量删除） | ❌ |
| activity 类型通知的真实业务触发源（当前仅有模拟数据） | ❌ |
| 后台管理系统发送/管理通知 | ❌ |

---

## 九、依赖关系

| 模块 | 依赖说明 | 耦合度 |
|------|----------|--------|
| `platform/notification/store.ts` | API 提供方，被各 feature store 同步调用 | 强（直接 import 调用） |
| 各业务 store（complaints/merchant-review/supplier/announcement/volunteer） | 在关键操作完成后调用 `addNotification` | 强 |
| `features/convenience/store/notification.ts` | 封装 `notifyConvenience` 工具函数，专用于 convenience 模块 | 中 |
| `shared/hooks/useLoadMore` | 通知列表分页加载 | 弱 |
| `shared/components/mobile/PageHeader` | 页面头部组件 | 弱 |
| `shared/components/mobile/EmptyState` | 空状态占位 | 弱 |

---

## 十、相关文件

| 文件路径 | 说明 |
|----------|------|
| `src/platform/notification/store.ts` | 通知 store（持久化到 localStorage） |
| `src/platform/notification/index.ts` | platform 层 barrel 导出 |
| `src/features/notification/c-end/pages/NotificationsPage.tsx` | C 端通知列表页 |
| `src/shared/types/index.ts` | Notification / NotificationType 类型定义（L423-434） |
| `src/c-end/routes.tsx` | C 端路由配置（/c/notifications, L248） |
| `src/features/convenience/store/notification.ts` | 便利服务模块封装的 notifyConvenience 工具函数 |
| `src/features/convenience/store/store.ts` | 便利服务 store，多处触发 order 通知 |
| `src/features/complaints/store/store.ts` | 投诉 store，L33-54 触发投诉处理/驳回通知 |
| `src/features/merchant-review/store/registration-store.ts` | 商户认领 store，L177-206 触发审核结果通知 |
| `src/features/merchant-review/store/store.ts` | 商户信息变更 store，L79-108 触发审核结果通知 |
| `src/features/supplier/store/supplier-store.ts` | 供应商 store，L41 触发入驻审核通知 |
| `src/features/announcement/store/announcement-store.ts` | 公告 store，L69 触发新公告通知 |
| `src/features/volunteer/store/store.ts` | 志愿活动 store，L557-724 触发志愿者审核和活动通知 |
| `src/features/profile/c-end/pages/ProfilePage.tsx` | 个人中心页，L58 提供通知入口导航 |