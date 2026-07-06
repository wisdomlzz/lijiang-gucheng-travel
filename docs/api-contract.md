# 丽江古城游 · API 契约 v1

> **基准字段约定**：所有资源统一含 `createdAt`、`updatedAt`，后端自动维护。
> 所有列表接口支持 `?page=1&pageSize=20&sort=-createdAt`（`-` 前缀表示倒序）。
> 所有 `POST`/`PATCH` 请求体为 JSON，`Content-Type: application/json`。
> 响应包裹：`{ ok: true, data: {...} }` 或 `{ ok: false, msg: "..." }`。

---

## 1. 便民服务（核心业务）

### 1.1 订单 `ConvenienceOrder`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 服务端生成，格式 `CO`+时间戳 |
| `userId` | string | ✓ | |
| `serviceType` | enum | ✓ | `送货服务/行李搬运/建筑垃圾清运/生活垃圾清运/送水服务/布草配送` |
| `address` | string | ✓ | |
| `addressTo` | string? | | 点对点服务的送达地址 |
| `images` | string[] | | 图片 URL 数组 |
| `note` | string | | 备注 |
| `preferredTime` | string | ✓ | `尽快` 或 `2026-07-07 14:00` |
| `status` | enum | ✓ | `S10/A10/A20/A30/A35/A40/S48/S55/S40/S50/S90` |
| `priceQuote` | number? | | 报价金额 |
| `refPrice` | number? | | 参考价 |
| `payMethod` | enum? | | `online/cash` |
| `staffId` | string? | | 已指派的服务人员 |
| `staffName` | string? | | |
| `staffPhone` | string? | | |
| `complaintId` | string? | | 关联投诉 ID |
| `paymentProof` | string? | | 付款凭证图片 URL |
| `completionPhotos` | string[]? | | 完工照片 |
| `rating` | number? | | 用户评分 1-5 |
| `ratedAt` | string? | | |
| `completedAt` | string? | | |
| `cancelRequested` | boolean | | 取消申请标记 |
| `lat`/`lng` | number? | | 派单坐标 |
| `arbitrationRemark` | string? | | 仲裁备注 |

**端点：**
```
GET    /api/v1/orders               列表（支持 ?status=&serviceType=&userId=&staffId=&search=）
POST   /api/v1/orders               创建订单（status=S10）
GET    /api/v1/orders/:id           订单详情
PATCH  /api/v1/orders/:id           更新订单状态/字段（含 transition 校验）
DELETE /api/v1/orders/:id           删除订单
```

### 1.2 订单状态流转（服务端）

```
POST /api/v1/orders/:id/transition  状态流转
Body: { action: "accept" | "quote" | "pay" | "startService" | "complete" | "confirm" | "cancel" | "approveQuote" | "rejectQuote" | "confirmPayment" | "rejectPayment" | "requestCancel" | "approveCancel" | "rejectCancel" }
Response: { ok: true, data: { order: ConvenienceOrder, transition: { from, to } } }
```

状态机逻辑从前端 `transitions.ts` 搬到服务端。

### 1.3 派单引擎（服务端）
```
POST /api/v1/orders/:id/dispatch
Body: { mode: "auto" | "manual", staffId?: string }
Response: { ok, data: { order, staff } }

POST /api/v1/orders/:id/re-dispatch  重新派单（S90→A10→A20）
```

Haversine 距离计算 + zone 匹配逻辑搬到服务端。

---

### 1.4 服务人员 `StaffItem`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | |
| `supplierId` | string | ✓ | |
| `name` | string | ✓ | |
| `phone` | string | ✓ | |
| `enabled` | boolean | | 默认 true |
| `status` | enum | | `online/busy/rest/offline` |
| `assignedOrders` | number | | |
| `joinedAt` | string | | |
| `serviceTypes` | string[] | | |
| `zoneIds` | string[]? | | |
| `lat`/`lng` | number? | | |

**端点：**
```
GET    /api/v1/staff                 列表（?status=&serviceType=&enabled=）
POST   /api/v1/staff                 新增
PATCH  /api/v1/staff/:id             更新（含状态变更）
DELETE /api/v1/staff/:id             删除
```

### 1.5 片区 `Zone`
```
GET    /api/v1/zones                 列表
POST   /api/v1/zones                 新增
DELETE /api/v1/zones/:id             删除
```

### 1.6 派单配置 `DispatchConfig`
```
GET    /api/v1/dispatch-config       获取配置
PUT    /api/v1/dispatch-config       更新配置
```

### 1.7 结算 `IncomeRecord` + `WithdrawalRequest`
```
GET    /api/v1/incomes               收入列表（?staffId=&dateFrom=&dateTo=）
GET    /api/v1/incomes/stats         汇总统计
POST   /api/v1/incomes               记录收入

GET    /api/v1/withdrawals           提现列表
POST   /api/v1/withdrawals           申请提现
PATCH  /api/v1/withdrawals/:id       审批（approve/reject）
```

### 1.8 评价 `ReviewData`
```
GET    /api/v1/reviews               列表（?rating=&staffId=&replyStatus=&serviceType=）
GET    /api/v1/reviews/stats         统计（total/positiveRate/pendingReply/negativeCount）
POST   /api/v1/reviews               创建评价
PATCH  /api/v1/reviews/:id/reply     回复评价
PATCH  /api/v1/reviews/:id/follow-up 标记跟进
```

### 1.9 服务配置 `ConvenienceService`
```
GET    /api/v1/service-config        获取服务配置列表
PUT    /api/v1/service-config        更新
```

---

## 2. 投诉管理

### `Complaint` 字段参见 `shared/types/index.ts`

```
GET    /api/v1/complaints             列表（?status=&userId=&type=&search=）
GET    /api/v1/complaints/stats       状态统计
POST   /api/v1/complaints             提交投诉
GET    /api/v1/complaints/:id         详情
PATCH  /api/v1/complaints/:id/resolve 处理完成 { result }
PATCH  /api/v1/complaints/:id/reject  驳回 { reason }
```

---

## 3. 内容管理

统一资源前缀 `/api/v1/content/`，4 个资源共享分页/排序/搜索模式。

```
GET    /api/v1/content/news           古城资讯 CRUD
POST   /api/v1/content/news
PATCH  /api/v1/content/news/:id
DELETE /api/v1/content/news/:id

GET    /api/v1/content/routes         精选路线 CRUD
POST   /api/v1/content/routes
PATCH  /api/v1/content/routes/:id
DELETE /api/v1/content/routes/:id

GET    /api/v1/content/courtyards     文化院落 CRUD
POST   /api/v1/content/courtyards
PATCH  /api/v1/content/courtyards/:id
DELETE /api/v1/content/courtyards/:id

GET    /api/v1/content/merchants      商户 CRUD
POST   /api/v1/content/merchants
PATCH  /api/v1/content/merchants/:id
DELETE /api/v1/content/merchants/:id

GET    /api/v1/content/pois           导览POI CRUD
POST   /api/v1/content/pois
PATCH  /api/v1/content/pois/:id
DELETE /api/v1/content/pois/:id

GET    /api/v1/content/housing        公房信息 CRUD
POST   /api/v1/content/housing
PATCH  /api/v1/content/housing/:id
DELETE /api/v1/content/housing/:id
```

---

## 4. 运营管理

### 4.1 Banner `BannerConfig`
```
GET    /api/v1/banners                列表
POST   /api/v1/banners                新增
PATCH  /api/v1/banners/:id            更新
DELETE /api/v1/banners/:id            删除
PUT    /api/v1/banners/reorder        排序 { ids: string[] }
```

### 4.2 宫格配置 `GridItemConfig`
```
GET    /api/v1/grid-items             获取所有宫格配置
PATCH  /api/v1/grid-items/:id         更新（显隐/排序）
```

### 4.3 打卡记录 `CheckinRecord`
```
GET    /api/v1/checkins               C端：用户自己的打卡记录
GET    /api/v1/checkins/all           桌面端：所有打卡记录 + 统计
POST   /api/v1/checkins               创建打卡记录
```

### 4.4 纳西人打卡 `NaxiCheckin`
```
GET    /api/v1/naxi-checkins          列表
POST   /api/v1/naxi-checkins          打卡
GET    /api/v1/naxi-checkins/stats    连续天数统计
```

---

## 5. 用户与权限

### 5.1 用户 `User`
```
POST   /api/v1/auth/login             { phone } → { token, user }
GET    /api/v1/auth/me                当前用户信息
```

无密码校验（纯 Demo），手机号匹配 `seed-users.ts` 即为合法用户。
Token 用 JWT 签发，前端存 `localStorage`。

### 5.2 地址 `Address`
```
GET    /api/v1/addresses              列表
POST   /api/v1/addresses              新增
PATCH  /api/v1/addresses/:id          更新
DELETE /api/v1/addresses/:id          删除
```

### 5.3 收藏 `Favorite`
```
GET    /api/v1/favorites              列表
POST   /api/v1/favorites              添加
DELETE /api/v1/favorites/:id          取消
```

---

## 6. 志愿服务

### 6.1 志愿者 `Volunteer`
```
GET    /api/v1/volunteers             列表（桌面端）
POST   /api/v1/volunteers/register    报名
PATCH  /api/v1/volunteers/:id/approve 审核通过
PATCH  /api/v1/volunteers/:id/reject  驳回
POST   /api/v1/volunteers/:id/resubmit 重新提交
```

### 6.2 志愿活动 `VolunteerActivity`
```
GET    /api/v1/volunteer-activities   列表
POST   /api/v1/volunteer-activities   创建活动（桌面端）
PATCH  /api/v1/volunteer-activities/:id 编辑
POST   /api/v1/volunteer-activities/:id/publish 发布
```

### 6.3 服务记录 `VolunteerDailyRecord`
```
GET    /api/v1/volunteer-records      服务记录（按志愿者）
POST   /api/v1/volunteer-records/check-in   签到
POST   /api/v1/volunteer-records/check-out  签退
```

---

## 7. 积分系统

### `PointAccount` / `PointLedger` / `PointRule`
```
GET    /api/v1/points/account/:userId 账户余额+流水
POST   /api/v1/points/transact        积分交易 { userId, sourceCode, refId?, customDelta? }
GET    /api/v1/points/rules           规则列表
POST   /api/v1/points/rules           新增规则
PATCH  /api/v1/points/rules/:code     编辑规则
DELETE /api/v1/points/rules/:code     删除规则
```

积分交易逻辑（每日上限防刷、方向校验）搬到服务端。

---

## 8. 诚信分

### `TrustScore` / `ScoreRule` / `TrustThreshold`
```
GET    /api/v1/trust-scores           评分列表
GET    /api/v1/trust-scores/:staffId  单个评分详情
POST   /api/v1/trust-scores/adjust    管理员调整 { staffId, change, reason }

GET    /api/v1/trust-scores/rules     评分规则 CRUD
POST   /api/v1/trust-scores/rules
PATCH  /api/v1/trust-scores/rules/:id
DELETE /api/v1/trust-scores/rules/:id

GET    /api/v1/trust-scores/threshold 阈值配置
PUT    /api/v1/trust-scores/threshold 更新阈值
```

---

## 9. 供应商与商户审核

### 9.1 供应商 `SupplierApplication`
```
GET    /api/v1/supplier-applications      列表
POST   /api/v1/supplier-applications      提交
GET    /api/v1/supplier-applications/:id  详情
PATCH  /api/v1/supplier-applications/:id  审核
```

### 9.2 商户审核 `MerchantRegistrationRequest` / `MerchantReviewRequest`
```
GET    /api/v1/merchant-registrations     商户注册申请列表
POST   /api/v1/merchant-registrations     提交注册申请
PATCH  /api/v1/merchant-registrations/:id 审核

GET    /api/v1/merchant-reviews           商户变更申请列表
PATCH  /api/v1/merchant-reviews/:id       审批变更
```

---

## 10. AI知识库

### `KnowledgeItem`
```
GET    /api/v1/ai-knowledge              知识库列表
POST   /api/v1/ai-knowledge              新增 Q&A
PATCH  /api/v1/ai-knowledge/:id          编辑
DELETE /api/v1/ai-knowledge/:id          删除
PUT    /api/v1/ai-knowledge/batch-import 批量导入
```

---

## 11. 院落预约

### `BookingRecord`
```
GET    /api/v1/bookings                  预约列表（?courtyardId=&userId=）
POST   /api/v1/bookings                  提交预约
PATCH  /api/v1/bookings/:id              核销/取消
```

---

## 12. 供应商

### `SupplierEntry`
```
GET    /api/v1/suppliers                 供应商列表
POST   /api/v1/suppliers                 注册
PATCH  /api/v1/suppliers/:id             更新
```

---

## 数据库 Schema（SQLite）

将建 20+ 张表，每张对应一个资源。约定：

- 每表含 `id TEXT PRIMARY KEY`, `created_at TEXT`, `updated_at TEXT`
- JSON 字段存为 TEXT，应用层序列化/反序列化（SQLite 无原生 JSON 列）
- 索引建在常用的筛选字段上（`user_id`, `staff_id`, `status`, `service_type`）

### 表列表

```
convenience_orders
staff
zones
dispatch_configs
income_records
withdrawal_requests
reviews
service_configs

complaints

content_news
content_routes (travel_guides)
content_courtyards
content_merchants
content_pois
content_housing

banners
grid_items
checkins
naxi_checkins

users
addresses
favorites

volunteers
volunteer_activities
volunteer_daily_records

points_accounts
points_ledgers
points_rules

trust_scores
score_rules
trust_thresholds

supplier_applications
merchant_registrations
merchant_reviews

ai_knowledge_items

bookings
suppliers
```