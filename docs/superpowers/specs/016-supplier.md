# 供应商 — 功能需求规格

> **话题标签:** `016-supplier`
> **上次更新:** 2026-07-05

## 业务定位

线上商城供应商入驻体系。供应商在 C 端提交入驻申请，桌面端管理员审核，通过后获得商城管理权限（可到外部商城 CRMEB 管理商品）。

**与古城商户的关系：** 正交子系统。同一用户可同时是古城商户 + 线上供应商。

## 数据模型

```typescript
interface SupplierApplication {
  id: string
  companyName: string
  contactName: string
  phone: string
  businessType: string
  address: string
  licenseNo: string
  licenseImg: string
  description: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewer?: string
  rejectReason?: string
}
```

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | SupplierEntryPage | `/c/supplier-entry` | 供应商入驻表单 |
| Desktop | SupplierApplicationsList | `/desktop/supplier-applications` | 审核列表 |
| Desktop | SupplierApplicationsShow | `/desktop/supplier-applications/:id` | 审核详情 |
| Desktop | SupplierEntryDesktop | `/desktop/supplier-entry` | 桌面端入驻（供应商角色专用） |

## 通知闭环（已实现）

- 供应商审核通过/驳回 → 通知申请人

## 依赖关系

- merchant-review（共用同一个页面的供应商入口）

## 本 Demo 的范围

- ✅ **C 端**: SupplierEntryPage（供应商入驻申请表单）
- ✅ **桌面端**: SupplierApplicationsList（列表）、SupplierApplicationsShow（审核详情）
- ✅ **Store**: supplier-store（申请提交 + 审核状态管理）
- ✅ **通知闭环**: 审核通过/驳回 → 推送通知到申请人
- ❌ **无 B 端页面**: 供应商无独立 B 端入口
