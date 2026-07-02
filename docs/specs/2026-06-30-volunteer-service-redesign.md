# 志愿者服务闭环改造设计

## 背景

现有志愿者模块存在以下缺口：
- 志愿者认证无审核流程，注册即生效
- 活动仅3态（draft/published/ended），缺少细粒度流转
- 签到签退无GPS模拟、无超时自动签退、无迟到标记
- 异常状态（未签到、未签退）无管理员手动处理机制
- C端注册页硬编码 userId
- 桌面端缺少志愿者审核和活动管理功能

## 数据模型

### Volunteer（3态 + 审核记录）

```
pending → approved
   ↓
rejected → (重新提交) → pending
```

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | |
| userId | string | 关联 auth 用户 |
| name | string | |
| phone | string | |
| politicalStatus | string | 中共党员/共青团员/群众/其他 |
| workUnit | string | |
| credentialImages | string[] | 资质图片URL |
| status | "pending" \| "approved" \| "rejected" | |
| reviewNote | string? | 最近一次审核意见（驳回原因） |
| reviewHistory | VolunteerReviewRecord[]? | 完整审核记录（支持多次驳回→重提） |
| reviewedAt | string? | 最近审核时间 |
| createdAt | string | |

#### VolunteerReviewRecord

| 字段 | 类型 | 说明 |
|---|---|---|
| action | "approved" \| "rejected" | 审核动作 |
| note | string? | 审核意见（驳回原因） |
| reviewedAt | string | 审核时间 |

### VolunteerActivity（5态，无需审核）

```
draft → published → in_progress → ended
  ↓        ↓           ↓
cancelled cancelled  cancelled
```

> 活动无需审核，草稿可直接发布。

| 状态 | 含义 |
|---|---|
| draft | 草稿，可编辑 |
| published | 已发布（报名中/报名未开始） |
| in_progress | 进行中 |
| ended | 已结束 |
| cancelled | 已取消 |

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | |
| title | string | |
| description | string | |
| images | string[] | |
| location | string | |
| startTime | string | 活动开始时间 |
| endTime | string | 活动结束时间 |
| enrollStartTime | string? | 报名开始时间（空=发布即报名） |
| signUpDeadline | string | 报名截止时间 |
| maxParticipants | number | |
| status | 见上表 | |
| createdAt | string | |

报名状态判断（published 状态下）：
- `enrollStartTime` 为空或已过 → 报名开放中
- `enrollStartTime` 未到 → 报名未开启
- `signUpDeadline` 已过 → 报名已截止

### VolunteerSignUp（5态 + 字段标记）

```
signed_up → checked_in → checked_out  ✅ 终态
    ↓           ↓
  no_show   checkout_overdue  ⚠️ 异常
```

| 状态 | 类型 | 含义 |
|---|---|---|
| signed_up | 进行中 | 已报名 |
| checked_in | 进行中 | 已签到 |
| checked_out | ✅ 终态 | 已签退（正常或管理员补录） |
| no_show | ⚠️ 异常 | 活动结束未签到 |
| checkout_overdue | ⚠️ 异态 | 签到后活动结束未签退 |

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | |
| volunteerId | string | |
| activityId | string | |
| signUpTime | string | |
| checkInTime | string? | |
| checkOutTime | string? | |
| serviceHours | number? | 精确到0.5h |
| status | 见上表 | |
| isLate | boolean | 迟到标记（签到距活动开始>30min） |
| lateMinutes | number? | 迟到分钟数 |
| isManual | boolean | 管理员手动处理标记 |
| reviewNote | string? | 管理员处理备注 |
| resolvedAt | string? | 处理时间 |

## 签到时间规则

| 场景 | 规则 |
|---|---|
| 活动开始前>30分钟 | 拒绝："活动尚未开始，请在开始前30分钟内签到" |
| 活动开始前≤30分钟 | 正常签到 → `checked_in` |
| 活动开始后≤30分钟 | 正常签到 → `checked_in` |
| 活动开始后>30分钟 | 签到但标记迟到 → `checked_in` + `isLate=true` + `lateMinutes` |
| 活动结束后 | 拒绝："活动已结束" |

GPS模拟：签到时UI展示"已验证您在活动地点附近"，实际不做定位校验。

## 自动流转（Timer Map）

复用便民服务的 timer Map 模式：

| 定时器 key | 触发时间 | 动作 |
|---|---|---|
| `vol:act:{id}:start` | startTime | `published` → `in_progress` |
| `vol:act:{id}:end` | endTime | `in_progress` → `ended` |

活动发布时注册定时器，活动取消/删除时清除。活动结束时自动结算异常签到。

## 管理员处理异常

从 `no_show` / `checkout_overdue` → 管理员填写：
- 服务时长（0 = 缺席，>0 = 补录签退）
- 处理备注（必填）

结果：状态 → `checked_out`，`isManual=true`，`reviewNote`、`resolvedAt`、`serviceHours` 填入。

## 状态转换表

### 活动转换

| 从 | 动作 | 到 | 条件 |
|---|---|---|---|
| draft | publish | published | 必填字段完整 |
| draft | cancel | cancelled | |
| published | cancel | cancelled | 无人报名 |
| in_progress | forceEnd | ended | |
| in_progress | (自动) | ended | endTime 到达 |

### 报名转换

| 从 | 动作 | 到 | 条件 |
|---|---|---|---|
| signed_up | checkIn | checked_in | 签到窗口内 |
| checked_in | checkOut | checked_out | |
| checked_in | (自动) | checkout_overdue | 活动结束未签退 |
| signed_up | (自动) | no_show | 活动结束未签到 |
| no_show | resolve | checked_out | 管理员处理 |
| checkout_overdue | resolve | checked_out | 管理员处理 |

## 页面改动

### C端

| 页面 | 改动 |
|---|---|
| 注册页 | 增加 credentialImages 上传；提交后状态为 pending；已注册但 pending 显示"认证审核中"；rejected 显示驳回原因+重新提交入口 |
| 活动列表 | 报名状态判断（未开启/开放中/已截止/已满）；FAB按钮+底部弹窗展示我的活动 |
| 活动详情 | 签到 GPS 模拟 UI；迟到提示；异常状态展示 |

### 桌面端

| 页面 | 改动 |
|---|---|
| 志愿者管理 | 增加 status 筛选；待审核志愿者高亮；审核操作（通过/驳回+原因）；审核记录查看 |
| 活动管理 | 5态流转；创建并发布；异常报名记录列表；管理员处理弹窗 |
