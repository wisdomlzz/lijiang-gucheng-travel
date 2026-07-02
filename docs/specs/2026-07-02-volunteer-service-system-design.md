# 志愿服务模块系统设计

## 概述

丽江古城游 V2.0 的志愿服务模块，覆盖志愿者认证、活动管理、报名签到、异常处理全流程。支持单天/多天活动模式，每日独立签到签退。

## 数据模型

### Volunteer（认证信息）

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
| reviewNote | string? | 最近一次审核意见 |
| reviewHistory | VolunteerReviewRecord[]? | 完整审核记录 |
| reviewedAt | string? | 最近审核时间 |
| createdAt | string | |

### VolunteerActivity（活动）

```
draft → published → in_progress → ended
  ↓        ↓           ↓
cancelled cancelled  cancelled
```

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | |
| title | string | |
| description | string | |
| images | string[] | |
| location | string | 文本地址 |
| locationLat | number? | 纬度（待加入） |
| locationLng | number? | 经度（待加入） |
| startTime | string | 活动首日开始时刻（datetime） |
| endTime | string | 活动末日结束时刻（datetime） |
| timeMode | "multi" | 固定为多天模式，单天兼容 |
| dailyStartTime | string | 每日开始时间 "HH:mm" |
| dailyEndTime | string | 每日结束时间 "HH:mm" |
| enrollStartTime | string? | 报名开始时间（空=发布即报名） |
| signUpDeadline | string | 报名截止时间 |
| maxParticipants | number | |
| status | VolunteerActivityStatus | |
| createdAt | string | |

> 单天活动：startTime 和 endTime 在同一天，dailyStartTime/dailyEndTime 为当天时段
> 多天活动：startTime/endTime 跨越 N 天，每天使用 dailyStartTime/dailyEndTime

### VolunteerSignUp（纯报名登记）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | |
| volunteerId | string | |
| activityId | string | |
| signUpTime | string | |

> 签到/签退/时长数据全部在 VolunteerDailyRecord 中

### VolunteerDailyRecord（每日签到记录）

```
pending → checked_in → checked_out ✅ 终态
   ↓           ↓
 no_show   checkout_overdue ⚠️ 异常
```

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | |
| signUpId | string | 关联报名ID |
| volunteerId | string | |
| activityId | string | |
| date | string | YYYY-MM-DD |
| dayStartTime | string | 该天活动开始时刻（完整datetime） |
| dayEndTime | string | 该天活动结束时刻（完整datetime） |
| checkInTime | string? | |
| checkOutTime | string? | |
| serviceHours | number? | 精确到0.1h |
| status | VolunteerDailyStatus | 见上 |
| isLate | boolean? | 迟到标记 |
| lateMinutes | number? | 迟到分钟数 |
| isManual | boolean? | 管理员补录标记 |
| reviewNote | string? | 管理员补录备注 |
| resolvedAt | string? | 补录时间 |

## 用户旅程

### C端（游客端小程序 390x844）

**1. 注册认证**
```
首页宫格 → /c/volunteer
  ├─ 未注册 → 填写表单（姓名/电话/政治面貌/工作单位/资质图片）→ 提交 → 待审核
  ├─ 待审核 → 展示审核中状态 + 演示通过按钮
  ├─ 已驳回 → 展示驳回原因 + 重新上传
  └─ 已通过 → 重定向到 /c/volunteer/activities
```

**2. 活动浏览与报名**
```
/c/volunteer/activities
  ├─ 顶部统计条（累计小时/参与场次/积分）← 仅已认证志愿者显示
  ├─ 搜索栏
  ├─ 活动卡片列表（published + in_progress）
  │   └─ 已报名活动显示状态标签
  └─ 浮动按钮"我的活动" → 底部面板（按操作优先级排序）
      ├─ 待签退 > 待签到 > 进行中 > 已完成 > 异常 > 已取消
      └─ 每项显示摘要状态 + 进度
```

**3. 活动详情**
```
/c/volunteer/activities/:id
  ├─ 图片轮播
  ├─ 活动信息（标题/地点/时间/报名进度）
  ├─ 签到记录列表
  │   ├─ 每行：日期+时段 | 签到时间 | 签退时间 | 状态标签
  │   └─ 可操作行：蓝色左侧指示条 + 光环边框高亮
  └─ 底部操作区
      ├─ 未报名 → 检测时间冲突 → 弹窗二次确认 → 报名
      ├─ 已报名全pending → 取消报名按钮
      ├─ 签到窗口内 → 签到按钮
      ├─ 已签到 → 签退按钮
      ├─ 已结束 + 异常 → 联系管理员提示
      ├─ 全部完成 → 已完成展示+总时长
      └─ 活动已取消 → 灰色提示
```

### 桌面端（管理后台 240px侧边栏）

**1. 志愿者管理**
```
标签页 volunteers
├─ 搜索 + 政治面貌/状态筛选
├─ 列表（排序：待审核 > 已驳回 > 已通过）
└─ 详情 → 基础信息 / 资质图片 / 审核记录 / 审核操作
```

**2. 活动管理**
```
标签页 activities
├─ 搜索 + 状态筛选
├─ 列表（排序：进行中 > 已发布 > 草稿 > 已结束(异常优先) > 已取消）
│   └─ 操作：详情 / 编辑 / 发布 / 取消活动(确认弹窗) / 强制结束 / 删除
├─ 创建弹窗：标题/描述/地点/开始时间/结束时间/每日开始/每日结束/报名起止/人数上限
├─ 详情
│   ├─ 统计卡片（报名/签到/异常/时长）
│   ├─ 报名签到明细表（每条日记录一行，显示签到/签退/时长）
│   ├─ 补录弹窗（填写签到时间+签退时间，自动计算时长）
│   ├─ 补录备注行
│   └─ 导出 Excel 按钮
└─ 编辑弹窗
```

**3. ProfilePage（我的）**
```
仅已认证志愿者显示：
🏅 志愿服务 · 累计 Xh · 参与 X 场 · 志愿积分 +X
点击 → /c/volunteer/activities
```

## 业务规则

### 签到规则

| 场景 | 结果 |
|---|---|
| 签到在活动开始前 >30min | ❌ 拒绝 |
| 签到在开始前 ≤30min | ✅ 正常签到 |
| 签到在开始后 ≤30min | ✅ 正常签到 |
| 签到在开始后 >30min | ✅ 签到 + 标记迟到 minutes |
| 签到在活动结束后 | ❌ 拒绝 |

### 服务时长计算

```
服务时长 = min(签退时间 - 签到时间, 当天时段总时长)
         → 向下取整 0.1h 精度
         → 最低 0.5h
```

### 每日结算

- 每 `dayEndTime` 到达时触发 `settleActivity(activityId)`
- `pending` → `no_show`
- `checked_in` → `checkout_overdue`

### 管理员补录

管理员填写：
- 签到时间（datetime，默认 = dayStartTime）
- 签退时间（datetime，默认 = dayEndTime）
- 补录备注（必填）

系统自动：
- 裁剪时间到 [dayStartTime, dayEndTime] 区间内
- 计算服务时长 = min(签退-签到, 当天时长)
- 状态 → `checked_out`，标记 `isManual=true`
- 发放对应积分

### 取消报名

- 仅当所有日记录状态均为 `pending` 时可取消
- 已有 `checked_in`/`checked_out` 记录 → 拒绝取消
- 取消后：删除报名记录 + 对应日记录 + 释放名额

### 取消活动

- 任何状态（非草稿/已取消/已结束）均可取消
- 取消后保留所有报名记录
- 取消弹窗提示："已有 X 人报名，取消后报名记录将被保留"
- C端：已报名用户看到"活动已被管理员取消"

### 时间冲突检测

- 报名前检测与已报名未结束活动的 `startTime~endTime` 重叠
- 有重叠 → 弹窗提示冲突活动名称 + "确认报名后请自行协调时间安排"
- 不阻止报名，由用户自决

## 状态转换表

### 活动转换

| 从 | 动作 | 到 | 条件 |
|---|---|---|---|
| draft | publish | published | 必填字段完整 |
| draft | publish | published 后签名 | 自动创建并发布（桌面端"创建并发布"） |
| draft | cancel | cancelled | |
| published | cancel | cancelled | 保留报名记录 |
| in_progress | forceEnd | ended | |
| in_progress | (endTime到达) | ended | endTimer触发 + settleActivity |
| any | (dayEndTime到达) | — | 每日结算触发 settleActivity |

### 日记录转换

| 从 | 动作 | 到 | 条件 |
|---|---|---|---|
| pending | checkIn | checked_in | 签到窗口内 |
| checked_in | checkOut | checked_out | 时长自动计算 |
| checked_in | (dayEnd到达) | checkout_overdue | 每日结算 |
| pending | (dayEnd到达) | no_show | 每日结算 |
| no_show | resolve | checked_out | 管理员补录 |
| checkout_overdue | resolve | checked_out | 管理员补录 |

## 定时器系统

复用 `src/shared/mock/engine.ts` 的 `setTimer`/`clearTimer` 模式：

| Key | 触发时机 | 动作 |
|---|---|---|
| `vol:act:{id}:start` | act.startTime | published → in_progress |
| `vol:act:{id}:end` | act.endTime | in_progress → ended + settleActivity |
| `vol:act:{id}:day:{date}` | 每日 dayEndTime | settleActivity（多天活动） |

## 积分关联

- 签退时调用 `usePointsStore.transact(userId, "volunteer_service", ...)` 发放积分
- 规则：每个服务小时 2 积分，上限 100/天
- ProfilePage 和活动列表页展示志愿积分汇总

## 种子数据策略

13 位志愿者 + 11 个活动，覆盖以下状态组合：

**志愿者状态**
- 待审核：2 人（新注册、不同类型）
- 已驳回：1 人（有驳回原因、资质重提场景）
- 已通过：10 人（含不同政治面貌、工作单位）

**活动状态覆盖**
- 进行中（1 个）：正在服务的志愿者分布为 checked_out + checked_in + pending
- 已发布可报名（3 个）：名额未满/已满/多天
- 草稿（1 个）：未发布多天活动
- 已结束有异常（2 个）：no_show + checkout_overdue 混合；多天混合场景
- 已结束全部正常（2 个）：全部签退
- 已取消（1 个）：无人报名

**日记录覆盖**
- 签到/签退正常
- 迟到签到
- 已签到未签退
- 未签到（缺席）
- 多天活动：部分完成 + 部分异常 + 全部完成

## 文件结构

```
src/
├── c-end/pages/
│   ├── VolunteerPlaceholderPage.tsx    # 注册/审核态展示
│   ├── VolunteerActivitiesPage.tsx     # 活动列表+底部面板
│   └── VolunteerActivityDetailPage.tsx # 详情+签到列表+操作
├── desktop/pages/
│   └── VolunteerManagePage.tsx         # 桌面端管理（志愿者+活动）
└── shared/services/volunteer/
    ├── index.ts                        # 导出
    └── store.ts                        # 状态+种子数据+定时器
```