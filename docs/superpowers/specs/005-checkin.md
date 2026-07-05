# 签到打卡 — 功能需求规格

> **话题标签:** `005-checkin`
> **上次更新:** 2026-07-05

## 业务定位

签到打卡包含两个子系统：

1. **文化院落打卡** — 游客到达某个文化院落，扫码/手动签到，获得积分
2. **纳西人连续打卡** — 纳西文化主题的连续签到挑战（类似学习打卡），连续天数越多奖励越多

**本质：** 位置打卡 + 连续签到 Gamification。

## 数据模型

```typescript
interface CheckinRecord {
  id: string
  userId: string
  targetId: string           // 院落 ID
  targetName: string         // 院落名
  type: "courtyard" | "naxi"
  timestamp: string
  photoUrl?: string
  points: number
}

interface NaxiStreak {
  userId: string
  streak: number             // 连续天数
  lastCheckinDate: string
  totalCheckins: number
}
```

## 积分规则

| 规则 | 单次积分 | 日上限 |
|---|---|---|
| courtyard_checkin | 5 | 10 |
| naxi_streak | 50 | 1 |

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | NaxiCheckInPage | `/c/naxi-checkin` | 纳西打卡（日历视图 + 连续天数） |
| C | PhotoRecordsPage | `/c/photo-records` | 随手拍记录（拍照打卡） |
| C | PhotoReportPage | `/c/photo-report` | 随手拍提交 |
| C | PhotoRecordsDetailPage | `/c/photo-records/:id` | 随手拍详情 |
| C | MyCheckinsPage | `/c/my-checkins` | 我的打卡记录（尚未接入路由） |

## 依赖关系

- points（`checkin-store.ts:77` 已有 `transact(userId, "courtyard_checkin", id)` 实现了打卡→积分）
- booking（打卡目标是文化院落）

## 差距分析（需补）

1. `MyCheckinsPage` 存在但路由未在 `cRoutes` 注册
2. 纳西打卡无补签机制（连续断了就断了）
3. 随手拍与无障碍/投诉随手拍的关系不清晰（PhotoReportPage 是独立入口还是复用？）

## 本 Demo 的范围

- ✅ **C 端核心**: NaxiCheckInPage（纳西连续打卡）、PhotoRecordsPage（随手拍记录）、PhotoReportPage（随手拍提交）、PhotoRecordsDetailPage（照片详情）
- ✅ **Store**: checkin-store + naxi-store — 打卡记录、纳西连续签到、积分联动
- ✅ **积分联动**: checkin-store 已实现 courtyard_checkin → 5 分、naxi_streak → 50 分
- ⚠️ **MyCheckinsPage**: 代码存在但路由未在 cRoutes 注册
- ⚠️ **无补签机制**: 纳西打卡连续断了就断了
- ⚠️ **随手拍定位**: PhotoReportPage 功能独立，与投诉随手拍关系待明确
