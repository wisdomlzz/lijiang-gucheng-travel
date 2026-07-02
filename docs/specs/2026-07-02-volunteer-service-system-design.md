# 志愿服务模块系统设计

**版本**：V2.0
**更新**：2026-07-02
**状态**：需求评审中

---

## 1. 数据模型

### 1.1 Volunteer（认证信息）

```
pending → approved
   ↓
rejected → (重新提交) → pending
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | string | 是 | 志愿者ID（注册时 = userId） |
| userId | string | 是 | 关联用户账号 |
| name | string | 是 | 姓名 |
| phone | string | 是 | 电话 |
| politicalStatus | string | 是 | 政治面貌：中共党员/共青团员/群众/其他 |
| workUnit | string | 是 | 工作单位 |
| credentialImages | string[] | 是 | 资质图片URL列表 |
| status | VolunteerStatus | 是 | pending / approved / rejected |
| reviewNote | string? | 否 | 最近审核意见 |
| reviewHistory | VolunteerReviewRecord[]? | 否 | 审核记录历史 |
| reviewedAt | string? | 否 | 最近审核时间 |
| createdAt | string | 是 | 创建时间 |

**VolunteerReviewRecord：**

| 字段 | 类型 | 说明 |
|---|---|---|
| action | "approved" \| "rejected" \| "resubmitted" | 审核动作 |
| note | string? | 审核意见 |
| reviewedAt | string | 审核时间 |

### 1.2 VolunteerActivity（活动）

```
draft → published → in_progress → ended
  ↓        ↓           ↓
cancelled cancelled  cancelled
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | string | 是 | |
| title | string | 是 | 活动名称 |
| description | string | 是 | 活动描述 |
| images | string[] | 否 | 活动图片 |
| location | string | 是 | 活动地点 |
| startTime | string | 是 | 首日日期(datetime) |
| endTime | string | 是 | 末日日期(datetime) |
| timeMode | "multi" | 是 | 固定多天模式，兼容单天 |
| dailyStartTime | string | 是 | 每日开始时间 "HH:mm" |
| dailyEndTime | string | 是 | 每日结束时间 "HH:mm" |
| enrollStartTime | string? | 否 | 报名开始日期 |
| signUpDeadline | string | 是 | 报名截止日期 |
| maxParticipants | number | 是 | 人数上限 |
| status | VolunteerActivityStatus | 是 | 见生命周期 |
| createdAt | string | 是 | |

> 单天活动：startTime 和 endTime 在同一天，dailyStartTime/dailyEndTime 为当天时段
> 多天活动：startTime/endTime 跨越 N 天，每天使用 dailyStartTime/dailyEndTime

### 1.3 VolunteerSignUp（报名记录）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | |
| volunteerId | string | 关联志愿者 |
| activityId | string | 关联活动 |
| signUpTime | string | 报名时间 |

### 1.4 VolunteerDailyRecord（每日签到记录）

```
pending → checked_in → checked_out ✅ 终态
   ↓           ↓
 no_show   checkout_overdue ⚠️ 异常
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | string | 是 | |
| signUpId | string | 是 | 关联报名 |
| volunteerId | string | 是 | 关联志愿者 |
| activityId | string | 是 | 关联活动 |
| date | string | 是 | 日期 YYYY-MM-DD |
| dayStartTime | string | 是 | 当天活动开始时刻 |
| dayEndTime | string | 是 | 当天活动结束时刻 |
| checkInTime | string? | 否 | 签到时间 |
| checkOutTime | string? | 否 | 签退时间 |
| serviceHours | number? | 否 | 服务时长(0.1h精度) |
| status | VolunteerDailyStatus | 是 | 见流转图 |
| isLate | boolean? | 否 | 迟到标记 |
| lateMinutes | number? | 否 | 迟到分钟数 |
| isManual | boolean? | 否 | 管理员补录标记 |
| reviewNote | string? | 否 | 补录备注 |
| resolvedAt | string? | 否 | 补录时间 |

---

## 2. 业务规则

### 2.1 签到规则

| 场景 | 结果 |
|---|---|
| 签到时间 < 活动开始前30分钟 | ❌ 拒绝 |
| 活动开始前30分钟 ≤ 签到时间 ≤ 活动开始后30分钟 | ✅ 正常签到 |
| 签到时间 > 活动开始后30分钟 | ✅ 签到 + 标记迟到minutes |
| 签到时间 > 活动结束时间 | ❌ 拒绝 |

### 2.2 服务时长计算

```
原始时长 = 签退时间 - 签到时间
服务时长 = min(原始时长, 当天时段总时长)
         → 四舍五入到 0.1h
         → 最低 0.5h
```

### 2.3 每日自动结算

每天 `dayEndTime` 到达时触发：
- `pending` → `no_show`
- `checked_in` → `checkout_overdue`

### 2.4 管理员补录

参数：
- 签到时间（datetime，默认 dayStartTime）
- 签退时间（datetime，默认 dayEndTime）
- 补录备注（必填）

处理：
- 签到/签退时间裁剪到 [dayStartTime, dayEndTime]
- 自动计算服务时长（同 2.2）
- 状态 → `checked_out`，标记 `isManual=true`

### 2.5 取消报名

- 条件：所有日记录状态均为 `pending`
- 操作：删除报名记录 + 所有日记录 + 释放名额

### 2.6 取消活动

- 任何状态均可取消
- 保留所有报名记录
- 弹窗确认：提示报名人数

### 2.7 时间冲突检测

- 报名前检测与已有报名活动的时间重叠
- 检测到重叠时弹窗提示
- 不阻止报名，由用户自决

---

## 3. 定时器系统

| 定时器 | 触发条件 | 执行动作 |
|---|---|---|
| 活动开始 | 到达 `startTime` | `published` → `in_progress` |
| 活动结束 | 到达 `endTime` | `in_progress` → `ended` + 结算 |
| 每日结算 | 每天到达 `dayEndTime` | 结算当天日记录 |

---

## 4. 状态汇总

### 4.1 志愿者状态

| 状态 | 说明 |
|---|---|
| pending | 待审核 |
| approved | 已通过 |
| rejected | 已驳回 |

### 4.2 活动状态

| 状态 | 说明 |
|---|---|
| draft | 草稿 |
| published | 已发布 |
| in_progress | 进行中 |
| ended | 已结束 |
| cancelled | 已取消 |

### 4.3 签到状态

| 状态 | 说明 | 终态 |
|---|---|---|
| pending | 待签到 | 否 |
| checked_in | 已签到 | 否 |
| checked_out | 已签退 | 是 ✅ |
| no_show | 未参与 | 是 ⚠️ |
| checkout_overdue | 待补签退 | 是 ⚠️ |

### 4.4 活动汇总状态

| 状态 | 说明 | 适用场景 |
|---|---|---|
| checked_in | 已签到 | 有任一天为已签到 |
| checked_out | 已签退 | 全部天次已签退 |
| pending | 待签到 | 全部天次待签到 / 多天部分完成 |
| no_show | 未参与 | 有异常记录 |
| cancelled | 已取消 | 活动被取消 |

---

## 5. 状态转换表

### 5.1 活动转换

| 当前状态 | 动作 | 目标状态 | 条件/说明 |
|---|---|---|---|
| draft | 发布 | published | 必填字段完整 |
| draft | 取消 | cancelled | |
| published | 取消 | cancelled | 保留报名记录 |
| in_progress | 结束 | ended | 触发结算 |
| in_progress | 取消 | cancelled | 保留报名记录 |
| published | 自动 | in_progress | startTime到达 |
| in_progress | 自动 | ended | endTime到达 |

### 5.2 日记录转换

| 当前状态 | 动作 | 目标状态 | 条件/说明 |
|---|---|---|---|
| pending | 签到 | checked_in | 签到窗口内 |
| checked_in | 签退 | checked_out | 自动计算时长 |
| checked_in | 自动 | checkout_overdue | dayEndTime到达 |
| pending | 自动 | no_show | dayEndTime到达 |
| no_show | 补录 | checked_out | 管理员操作 |
| checkout_overdue | 补录 | checked_out | 管理员操作 |