# 诚信分（Trust Score）— 功能需求规格

> **话题标签:** `021-trust-score`
> **上次更新:** 2026-07-05

## 业务定位

便民服务人员的诚信评级系统。每个服务人员有 0-100 分的诚信分，基于用户评价（1-5 星）、服务质量、投诉记录等动态调整。低于 60 分进入失信名单限制经营。

**本质：** 服务人员信用评级机制。

## 数据模型

```typescript
interface TrustScore {
  staffId: string
  staffName: string
  trustScore: number           // 0-100
  status: "正常" | "失信"
  roleTag: string
  totalRatings: number
  rating5Count: number         // 5 星次数
  rating4Count: number
  rating3Count: number
  rating2Count: number
  rating1Count: number
  scoreHistory: ScoreHistory[]
}
```

## 使用场景

- C 端 `OrderDetailPage` — 服务人员头顶显示诚信分徽章
- B 端 `ServiceProfile` — 个人中心显示诚信分进度条 + 状态
- B 端 `staff.ts` — 构建 Staff 类型时注入信任分

## 页面清单

| 端 | 展示方式 |
|---|---|
| C | `TrustScoreBadge` 组件（在 OrderDetailPage 中） |
| B | 内联在 ServiceProfile 页面中 |

**约束：** 诚信分为人造演示数据，非真实计算；无独立页面展示（嵌入在其他页面中）。

## 本 Demo 的范围

- ✅ **C 端嵌入**: TrustScoreBadge 组件展示在 OrderDetailPage 中（服务人员诚信分徽章）
- ✅ **B 端嵌入**: 诚信分进度条展示在 ServiceProfile 页面中
- ✅ **Store**: trust-score-store（评分历史 + 分数计算 + 失信名单管理）
- ⚠️ **演示数据**: 诚信分为人工构造的演示数据，非真实算法计算
- ❌ **无独立页面**: 诚信分嵌入在其他业务页面中，无独立展示页
