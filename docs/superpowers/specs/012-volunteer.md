# 志愿服务 — 功能需求规格

> **话题标签:** `012-volunteer`
> **上次更新:** 2026-07-05

## 业务定位

古城志愿服务管理体系：志愿者注册→管理员审核→参与活动→每日签到/签退→服务时长记录→积分奖励。

**本质：** 志愿者活动全生命周期管理系统（单端功能，C 端面向志愿者，桌面端面向管理员）。

## 数据模型

```typescript
// 志愿者
interface Volunteer {
  id: string
  userId: string
  name: string
  phone: string
  politicalStatus: string
  workUnit: string
  credentialImages: string[]
  status: "pending" | "approved" | "rejected"
  rejectReason?: string
  submittedAt: string
}

// 志愿活动
interface VolunteerActivity {
  id: string
  title: string
  description: string
  location: string
  lat?: number
  lng?: number
  startTime: string
  endTime: string
  signUpDeadline: string
  maxParticipants: number
  currentParticipants: number
  status: "draft" | "published" | "in_progress" | "ended" | "cancelled"
  organizer: string
  organizerPhone: string
  images: string[]
  createdAt: string
}

// 签到记录
interface VolunteerDailyRecord {
  id: string
  signUpId: string
  volunteerId: string
  activityId: string
  dayDate: string
  dayStartTime: string
  dayEndTime: string
  checkInTime?: string
  checkOutTime?: string
  serviceHours?: number
  status: "pending" | "checked_in" | "checked_out" | "no_show" | "checkout_overdue"
}
```

## 状态机

```
志愿者注册 → pending → approved(审核通过) → 可报名活动
                     ↘ rejected(驳回) → 可重新提交

活动发布 → draft(草稿) → published(招募中) → in_progress(进行中) → ended(已结束)
                                                  ↘ cancelled(取消)

每日签到流程：pending → checked_in → checked_out
                                    ↘ checkout_overdue(超时未签退)
```

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | VolunteerPlaceholderPage | `/c/volunteer` | 志愿服务中心入口 |
| C | VolunteerActivitiesPage | `/c/volunteer/activities` | 活动列表 + 报名 |
| C | VolunteerActivityDetailPage | `/c/volunteer/activities/:id` | 活动详情 + 签到/签退 |
| Desktop | VolunteerManagePage | `/desktop/volunteer` | 志愿者审核 + 活动管理+签到管理 |

## 积分触发（已实现）

- `checkOut` 完成 → 自动触发 `volunteer_service` 积分（2 分/次）

## 依赖关系

- points（签退触发积分）
- notification（无，志愿者审核/活动状态变更未推送通知）

## 差距分析

1. 桌面端 `VolunteerManagePage` 有 ~1500 行，含志愿者审核列表 + 活动管理 CRUD + 地图选点 + 签到管理 + Excel 导出，建议拆为小组件
2. 活动状态变更（发布/结束/取消）未推送到通知中心（与审核流程联动）
3. 志愿者注册审核通过/驳回 → 未通知申请人
