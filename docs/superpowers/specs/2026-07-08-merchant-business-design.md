# 购在古城 · 商户业务全流程设计

## 概述

覆盖"购在古城"商户完整生命周期：认领/新建入驻 → 桌面端审核 → 上线展示 → 信息变更。

涉及三个端：
- **C端**：商户列表页、商户详情页、认领或入驻店铺、我的商铺（编辑）
- **桌面端**：古城商户管理（已审核通过）、古城商户审核（待审核）
- **后端**：merchant 表扩展、registrations 表、reviews 表

## 业务流

```
用户认领/新建入驻
  → merchant_registrations (type: claim / new_shop)
  → 桌面端审核 Tab1/Tab2 (diff 比对)
  → 通过 → 追加 supplier 角色 + 数据上线
  → 驳回 → 可重新提交

商户编辑关键字段
  → merchant_reviews (fields: [{field, old, new}])
  → 桌面端审核 Tab3 (diff 对比)
  → 按字段通过/驳回

商户编辑非关键字段
  → PATCH merchant 直接生效
```

## 字段定义

### content_merchants 表（扩展）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | |
| name | TEXT | 商户名称 |
| category | TEXT | 餐饮/住宿/酒吧/购物 |
| address | TEXT | 地址 |
| phone | TEXT | 店铺电话（游客可拨打） |
| description | TEXT | 简介 |
| cover | TEXT | 封面图 URL |
| images | TEXT | 详情图数组 JSON |
| logo | TEXT | 头像 |
| lat/lng | REAL | 坐标 |
| tags | TEXT | 标签数组 |
| rating | REAL | 评分 |
| claimStatus | TEXT | unclaimed/claimed/pending |
| businessLicense | TEXT | 资质凭证图 URL |
| contactName | TEXT | 联系人（不对外展示） |
| contactPhone | TEXT | 联系电话（不对外展示） |

### merchant_registrations 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | |
| type | TEXT | "claim" / "new_shop" |
| userId | TEXT | 申请人 |
| userName | TEXT | 联系人 |
| userPhone | TEXT | 联系电话 |
| claimedShopId | TEXT? | 认领目标（claim 有） |
| newShopName / category / address / phone / description / lat / lng | TEXT? | 新建信息（new_shop 有） |
| credentialImages | TEXT | 资质凭证图数组 JSON（≥1 张） |
| status | TEXT | pending/approved/rejected |
| rejectReason | TEXT? | |

### merchant_reviews 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | |
| merchantId | TEXT | 变更目标店铺 |
| userId | TEXT | 申请人 |
| fields | TEXT JSON | `[{field, label, oldValue, newValue, status}]` |
| status | TEXT | pending/approved/rejected |
| remark | TEXT? | |

## 审核策略

```
🔴 审核（diff 对比 → 桌面端逐条操作）
  名称、地址、坐标(lat/lng)、店铺电话、经营类型、资质凭证图、联系人、联系电话

🟢 直接（编辑即时生效）
  封面图、简介、详情图
```

## 认领 vs 新建入驻表单

```
认领表单（从已有列表选店）        新建入驻表单（全字段填）
─────────────────────────        ─────────────────────────
商户名称 ─── merchant 只读       商户名称 ─── 输入框
封面图 ─── 预填可换              封面图 ─── 上传
简介 ─── 预填可改                简介 ─── 多行文本框
详情图 ─── 预填可改              详情图 ─── 上传
地址 ─── merchant 只读           地址 ─── 输入框
坐标 ─── merchant 只读           坐标 ─── 地图选点
店铺电话 ─── 预填可改            店铺电话 ─── 输入框
经营类型 ─── 预填可改            经营类型 ─── 选择器
资质凭证图 ─── 上传              资质凭证图 ─── 上传（≥1 张）
联系人 ─── 必填                  联系人 ─── 必填
联系电话 ─── 必填                联系电话 ─── 必填
```

## 三个审核 Tab 的 diff 展示

```
Tab1 认领审核 ─── 展示申请人信息 + 资质凭证图 + 字段对比表（当前值 vs 认领值）
Tab2 新建审核 ─── 展示申请人信息 + 资质凭证图 + 全字段展示（新建无旧值）
Tab3 信息变更 ─── 展示申请人 + 字段对比表（当前线上值 vs 申请改值），逐字段操作
```

## 商家详情页排版

```
┌──────────────────────────┐
│  ← 返回         分享 ↗   │
│    🖼️ 封面图 (16:9)      │
│                          │
│  商户名称                 │
│  类型标签                 │
│  简介                     │
│                          │
│  📍 地址              导航│
│  📞 店铺电话           拨打│
│                          │
│  ── 商家资质 ──           │
│  [资质凭证图 1]           │
│  [资质凭证图 2]           │
│  ...                     │
│                          │
│  ── 详情 ──              │
│  [详情图1] [详情图2] ...  │
├──────────────────────────┤
│ 固定底栏: [联系] [导航]   │
└──────────────────────────┘
```

## 商户卡片列表页排版

```
┌──────────────────────────┐
│ ┌──────┐                  │
│ │ 封面图 │  商户名称        │
│ │       │  地址            │
│ │       │  店铺电话         │
│ └──────┘                  │
└──────────────────────────┘
```

## 桌面端审核页排版

```
┌───────┬───────┬───────┐
│ 认领   │ 新建   │ 变更   │ ← Tab
├───────┴───────┴───────┤
│ 🔍 搜索               │
├───────────────────────┤
│ 申请列表 (表格)        │
│ 店铺名 │ 申请人 │ 状态  │
│ 点击行 → 审核弹窗      │
│ 弹窗内: diff 对比表     │
│ + [通过] [驳回] 按钮    │
└───────────────────────┘
```