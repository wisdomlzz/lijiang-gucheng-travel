# 商户审核 — 功能需求规格

> **话题标签:** `002-merchant-review`
> **上次更新:** 2026-07-05

## 业务定位

商户审核由两个独立子系统组成：**古城商户**（实体店铺认证体系）和**线上商城供应商**（供货资质认证）。用户可同时拥有两种身份。

古城商户体系解决：店铺谁认领→谁管理→平台背书的闭环。

## 数据模型

### ShopClaimRequest
```typescript
interface ShopClaimRequest {
  id: string
  type: "claim" | "new_shop"          // 认领已有店铺 OR 新建店铺
  userId: string
  userName: string
  userPhone: string
  claimedShopId?: string              // 认领场景：用户声称的店铺
  claimedShopName?: string
  newShopName?: string                // 新建场景：用户提交的信息
  newCategory?: string
  newAddress?: string
  newPhone?: string
  newDescription?: string
  newHours?: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewer?: string
  rejectReason?: string
}
```

### MerchantChangeRequest
```typescript
interface MerchantChangeRequest {
  id: string
  supplierId: string
  supplierName: string
  merchantName: string
  fields: { field: string; label: string; oldValue: string; newValue: string }[]
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewer?: string
  rejectReason?: string
}
```

## 店铺状态机

```
unclaimed → pending(认领审核中) → claimed(已认领)
                                    ↘ claimed 后每次修改→提交审核→通过/驳回
```

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | MerchantServicesPage | `/c/merchant-services` | 商户导航页（子系统入口） |
| C | MerchantRegistrationPage | `/c/merchant-registration` | 统一认领/入驻页面（搜索 → 认领 or 新建） |
| C | MyShopPage | `/c/my-shop` | 我的店铺（信息维护） |
| C | SupplierEntryPage | `/c/supplier-entry` | 线上商城供应商入驻 |
| Desktop | MerchantReviewPage | `/desktop/merchant-review` | 审核面板（3 Tab：认领/新建/信息变更） |
| Desktop | SupplierApplicationsList | `/desktop/supplier-applications` | 供应商审核列表 |

## 通知闭环（已实现）

- 认领审核通过/驳回 → 通知申请人
- 信息变更通过/驳回 → 通知商户
- 供应商审核通过/驳回 → 通知申请人

## 依赖关系

- content/merchant-store（商家数据读写）
- auth（角色权限——审核通过后追加 supplier 角色）
- notification（推送通知）
- supplier（供应商入驻独立子系统）

## 约束

1. `Merchant` 的 `claimStatus` 扩展了 `MerchantListPage` 的展示（增量优化，不重构）
2. 新建入驻的店铺需经审核后才对外展示
3. 信息变更每次都要走审核，不设自动通过
