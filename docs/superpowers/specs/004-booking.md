# 院落预约 — 功能需求规格

> **话题标签:** `004-booking`
> **上次更新:** 2026-07-05

## 业务定位

文化院落是丽江古城内开放的传统文化体验空间（如方国瑜故居、纳西人家等）。游客可以浏览院落详情、VR 全景参观、预约参观时间段。

**本质：** 文化活动场所的免费/收费预约系统。

## 数据模型

```typescript
interface Courtyard {
  id: string
  name: string
  description: string
  images: string[]
  address: string
  lat: number
  lng: number
  openingHours: string
  status: "open" | "closed"
  tags: string[]      // e.g. ["历史文化", "非遗体验", "纳西民居"]
  vrSceneUrl?: string
}

interface Booking {
  id: string
  courtyardId: string
  userId: string
  courtYardName: string
  date: string
  timeSlot: string
  visitors: number
  contactName: string
  contactPhone: string
  status: "pending" | "checked" | "cancelled" | "expired"
  createdAt: string
}
```

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | CulturalCourtyardsPage | `/c/courtyards` | 院落列表（按标签筛选） |
| C | CulturalCourtyardDetailPage | `/c/courtyard/:id` | 院落详情（介绍+图片+VR入口） |
| C | CulturalCourtyardVRPage | `/c/courtyard/:id/vr` | VR 全景参观 |
| C | CourtyardBookingPage | `/c/courtyard/:id/booking` | 预约表单（日期+时段+人数） |
| C | MyBookingsPage | `/c/my-bookings` | 我的预约列表 |
| Desktop | —— | —— | 无管理端页面（demo 暂缺） |

## 业务流程

```
浏览院落 → 详情 → 预约 → 选择日期/时段/人数 → 提交
→ 状态 pending → 现场核销（未来功能：扫码核销）
→ 超时预约自动过期（需定时器，暂缺）
```

## 依赖关系

- content（院落 POI 数据）
- checkin（部分院落有打卡功能）
- points（booking 不一定触发积分，但院落打卡触发 courtyard_checkin 积分）

## 约束

1. 无桌面端管理页面（后台应该能查看/核销预约，但当前 demo 未实现）
2. 无核销码生成（纯文本状态管理）
3. VR 非真实全景，用图片阵列模拟
4. 预约有时间冲突检测（同院落同时间不可重复预约），但未做容量限制

## 本 Demo 的范围

- ✅ **C 端完整**: CulturalCourtyardsPage（院落列表）、CulturalCourtyardDetailPage（详情）、CulturalCourtyardVRPage（VR 参观）、CourtyardBookingPage（预约提交）、MyBookingsPage（我的预约）— 5 个页面全实现
- ✅ **Store**: booking-store 管理预约状态
- ⚠️ **无桌面端管理**: 后台应能查看/核销预约，demo 未实现
- ⚠️ **无核销码**: 纯文本状态管理
- ⚠️ **VR 模拟**: 非真实全景，用图片阵列模拟
- ⚠️ **容量限制**: 有时间冲突检测但无院落容量限制
