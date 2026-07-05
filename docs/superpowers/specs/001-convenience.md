# 便民服务 — 功能需求规格

> **话题标签:** `001-convenience`
> **上次更新:** 2026-07-05

## 业务定位

便民服务是丽江古城游的核心业务线。游客/商户可以下单呼叫古城内的服务人员（清运/送水/布草/搬运/送货），B 端服务人员接单处理，平台分配片区和管理派单策略。

**用户故事：** 客栈老板发现垃圾满了 → 小程序下单生活垃圾清运 → 派单给片区服务人员 → 人员接单→服务→完成 → 客栈老板确认→评价

## 数据模型

### ConvenienceOrder
```typescript
interface ConvenienceOrder {
  id: string
  userId: string
  serviceType: ConvenienceServiceType   // "送货服务" | "行李搬运" | "建筑垃圾清运" | "生活垃圾清运" | "送水服务" | "布草配送"
  address: string
  addressTo?: string          // 送达地址（送货/行李搬运用）
  images: string[]
  note: string
  preferredTime: string
  status: ConvenienceStatus    // 见状态机
  priceQuote?: number
  refPrice?: number
  payMethod?: "online" | "cash"
  createdAt: string
  staffId?: string
  staffName?: string
  staffPhone?: string
  complaintId?: string
  paymentProof?: string
  completionPhotos?: string[]
  rating?: number
}
```

### 状态机

```
S10 → A10 → A20 → A30 → A35 → A40 → S50
                  ↘ A30 → A35 → A40 → S48(待结算)
  ↘ A20 → A30(拒单) → A10(重新派单)
  
  S10   已下单（未派单）
  A10   待派单（系统中等待）
  A20   已指派（通知服务人员）
  A30   已接单（服务人员确认）
  A35   已核价（给出价格）
  A40   服务中
  S48   待结算（等待线上/线下支付）
  S50   已完成
  S55   已评价
  S90   已取消/已退款

Cancellation: 任意状态 → requestCancel → A35_CANCEL_REVIEW → approveCancel → S90
                                                    ↘ rejectCancel → 原状态
```

### 服务端 Store 子模块

| 模块 | 文件 | 职责 |
|---|---|---|
| `store.ts` | `convenience/store/` | 主 store，订单 CRUD + 生命周期 |
| `transitions.ts` | `convenience/store/` | 状态机 + 合法转移表 |
| `dispatch.ts` | `convenience/store/` | Haversine 距离派单 + zone 匹配 |
| `timers.ts` | `convenience/store/` | 超时自动流转定时器 |
| `staff-store.ts` | `convenience/store/` | 服务人员数据 |
| `zone-store.ts` | `convenience/store/` | 片区管理 |
| `settlement-store.ts` | `convenience/store/` | 结算管理 |
| `services-store.ts` | `convenience/store/` | 服务配置（价格、规则等） |
| `seed.ts` | `convenience/store/` | 种子数据（每状态 1 条） |

## 页面清单

| 端 | 页面 | 路由 | 功能 |
|---|---|---|---|
| C | ServicesPage | `/c/services` | 下单（选类型→填地址→提交） |
| C | ServiceTrackingPage | `/c/services/:id` | 实时跟踪进度 |
| C | OrderListPage | `/c/orders` | 历史订单列表 |
| C | OrderDetailPage | `/c/orders/:id` | 订单详情（状态、评价、投诉） |
| B | App (ServiceApp) | `/b/service/*` | B 端路由壳 + 5 tab 导航 |
| B | ServiceWorkbench | `/b/service/workbench` | 工作台（待接单列表） |
| B | ServiceTasks | `/b/service/tasks` | 我的任务（已接单） |
| B | BNotificationsPage | `/b/service/notifications` | 通知列表 |
| B | ServiceHistory | `/b/service/history` | 历史订单 |
| B | ServiceProfile | `/b/service/profile` | 个人中心 |
| B | ServiceOrderDetail | `/b/service/detail/:id` | 接单/报价/服务流程 |
| B | QuoteAndPhotoFlow | `/b/service/quote` | 报价 + 拍照流程 |
| Desktop | ConveniencePage | `/desktop/convenience` | 派单列表（管理端） |
| Desktop | ConvenienceOverviewPage | `/desktop/convenience-overview` | 服务概览 |
| Desktop | ZoneManagementPage | `/desktop/zones` | 片区管理 |
| Desktop | DispatchConfigPage | `/desktop/dispatch-config` | 派单配置 |
| Desktop | ConvenienceStaffPage | `/desktop/convenience-staff` | 服务人员管理 |
| Desktop | SettlementPage | `/desktop/settlement` | 结算管理 |
| Desktop | PriceArbitrationPage | `/desktop/price-arbitration` | 取消审批 |

## 依赖关系

- 投诉系统（complaints）— 订单详情可发起投诉
- 积分（points）— 订单完成可获取积分（**尚未实现**）
- 通知（notification）— 状态变更推送到 B 端和 C 端
- 诚信分（trust-score）— 服务人员诚信分显示

## 约束（明确不做）

1. 无真实支付对接（模拟线上/线下支付标记）
2. 无实时 WebSocket，轮询或手动刷新
3. 派单算法用 Haversine + zone 匹配，不做智能调度
4. 无物流跟踪（GPS 实时路径）
