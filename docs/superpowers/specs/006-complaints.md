# 投诉管理 — 功能需求规格

> **话题标签:** `006-complaints`
> **上次更新:** 2026-07-05

## 业务定位

游客或商户可以对便民服务订单发起投诉。桌面端管理员处理投诉→回复结果→C 端用户收到通知。

**本质：** 服务质保 + 纠纷处理闭环。

## 数据模型

```typescript
type ComplaintStatus = "C10"  // 已提交
                      | "C40" // 已处理
                      | "CR"  // 已驳回

interface Complaint {
  id: string
  orderId: string
  userId: string
  type: string              // "服务态度" | "价格争议" | "服务结果" | "服务时效"
  content: string
  images: string[]
  status: ComplaintStatus
  createdAt: string
  targetName: string
  reporterType: string
  reporterName: string
  reporterGender: string
  reporterPhone: string
  objectType: string
  incidentArea: string
  incidentLocation: string
  doorplate: string
  channelNote: string
  result?: string
  handledAt?: string
}
```

## 业务流程

```
C 端提交 → status C10 → 桌面端投诉列表 → 管理员处理/驳回
→ 处理: resolveWithResult → C40 → 通知发起人"投诉已处理"
→ 驳回: reject → CR → 通知发起人"投诉被驳回"
```

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | ComplaintFormPage | `/c/complaint` | 投诉提交（关联订单） |
| C | MyComplaintsPage | `/c/my-complaints` | 我的投诉列表（Tab 筛选） |
| C | ComplaintDetailPage | `/c/complaint/:id` | 投诉详情 + 处理结果 |
| Desktop | ComplaintPage | `/desktop/complaints` | 投诉管理（处理/驳回） |

## 通知闭环（已实现）

- 投诉处理完成 → 通知发起人
- 投诉被驳回 → 通知发起人

## 依赖关系

- convenience（投诉关联 orderId）
- notification（处理/驳回通知）

## 约束

1. 投诉只能由订单发起人提交，不支持匿名
2. 无申诉机制（驳回即终局）
3. 桌面端统计只有数量概况，无图表分析
