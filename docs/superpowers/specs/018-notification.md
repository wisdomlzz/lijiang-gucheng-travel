# 通知中心 — 功能需求规格

> **话题标签:** `018-notification`
> **上次更新:** 2026-07-05

## 业务定位

系统级通知中心，接收各业务模块推送到用户的通知消息。所有 C 端用户共享同一个通知池。

**架构说明：** store 在 `platform/notification/`（基础设施层，跨 feature 调用），页面在 `features/notification/`（UI 层）。这是 intentional 分层。

## 数据模型

```typescript
type NotificationType = "order" | "system" | "merchant" | "complaint" | "announcement"

interface Notification {
  id: string
  type: NotificationType
  title: string
  summary: string
  time: string
  isRead: boolean
  targetUrl?: string
  createdAt: string
}
```

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | NotificationsPage | `/c/notifications` | 通知列表（全部/订单/系统 3 Tab） |

## 通知触发源（全部已实现）

| 场景 | 触发点 | 实现 |
|---|---|---|
| 订单状态变更 | `convenience/store/notification.ts` | ✅ |
| 商户认领审核结果 | `merchant-review/store/registration-store.ts` | ✅ |
| 信息变更审核结果 | `merchant-review/store/store.ts` | ✅ |
| 投诉处理/驳回 | `complaints/store/store.ts` | ✅ |
| 供应商审核结果 | `supplier/store/supplier-store.ts` | ✅ |
| 公告发布 | `announcement/store/announcement-store.ts` | ✅ |

**约束：** 通知仅 C 端可见，B 端/桌面端无通知中心。

## 本 Demo 的范围

- ✅ **C 端**: NotificationsPage（全部/订单/系统 3 Tab 分类展示）
- ✅ **platform store**: notification-store（通知状态管理，基础设施层）
- ✅ **6 种触发源全部实现**: 订单状态变更、商户认领审核、信息变更审核、投诉处理、供应商审核、公告发布
- ⚠️ **仅 C 端可见**: B 端/桌面端无通知中心界面
