# 便民服务业务流转优化设计

> ⚠️ **本文档已被 `2026-07-07-convenience-mvp-design.md` 取代**(2026-07-07)
> 保留作为历史评审记录,不作为实施依据。
> 实施请参考 MVP 设计文档。

> **日期**: 2026-07-07
> **类型**: 现状评审 + 优化设计
> **视角**: 准生产原型(严谨性优先,而非演示效果优先)
> **前置文档**: `docs/superpowers/specs/001-convenience.md`(原始需求)
> **状态**: 已被取代

---

## 1. 评审背景

原始需求 `001-convenience.md` 描述了便民服务的业务定位、状态机、页面清单和依赖关系。经过端到端流程完整性评审(涵盖下单/派单/接单/报价/支付/服务/评价/投诉/取消/结算/诚信分/管理动作 25 项闭环环节),发现现有实现在"演示 Demo"层面基本可用,但在"准生产原型"标准下,有多处**联动逻辑错位、关键场景缺失、异常兜底不可靠**。

**取优原则**:代码或文档中不合理的地方,以本文档结论为准。

---

## 2. 25 项闭环环节评审结果

四档评级:
- ✅ **闭环** — 该做的都做了,业务合理
- ⚠️ **半闭环** — 主干做了但缺关键场景/UX 不清晰
- ❌ **断裂** — 关键动作缺失,阻断业务
- 💭 **架构建议** — 可选优化

### 2.1 下单 → 派单(1-3)

| # | 环节 | 评级 | 现状 |
|---|------|:---:|------|
| 1 | 下单(C 端选服务类型 + 填地址 + 备注) | ✅ | ServicesPage 完整,含图片/地址/备注,支持所有 6 种服务类型 |
| 2 | 派单(自动 + 手动) | ⚠️ | 自动派单**没有 server 端触发**,仅前端 `createOrder` 后 setTimeout 触发一次。S10 订单若前端未触发,永远躺在库里 |
| 3 | staff 接单/拒单 | ⚠️ | 接单 ✅;拒单 UI 只写了"暂不接单"文字,**没有真调 `reject` action** 走回 A10 |

### 2.2 报价 → 支付 → 服务(4-8)

| # | 环节 | 评级 | 现状 |
|---|------|:---:|------|
| 4 | staff 报价 | ✅ | QuoteAndPhotoFlow 完整,金额校验、超参考价上限提示齐全 |
| 5 | 平台审核报价 | ⚠️ | 有 approveQuote/rejectQuote action,桌面端有"报价审核" tab,**但触发条件不清晰** —— 所有 A35 都进审核?还是超参考价才审? |
| 6 | 用户支付 | ⚠️ | C 端 ServiceTrackingPage 有"我已支付"按钮触发 markPaid,**但缺乏支付流程模拟**。且**线下现金支付缺 "staff 收款确认"环节**,与 `confirmPaymentProof` 路径打架 |
| 7 | staff 开始服务 → 完成 → 上传凭证 | ✅ | startService/completeService 完整,拍照上传闭环 |
| 8 | 用户确认完成(或自动) | ✅ | confirm 或前端定时器 30s 后 autoConfirm |

### 2.3 评价 + 投诉(9-12)

| # | 环节 | 评级 | 现状 |
|---|------|:---:|------|
| 9 | 用户评价 | ⚠️ | `rateOrder` 只写 `order.rating` 数字,**没有创建 review 记录**。桌面端"评价管理"读 reviews 表,C 端评价完全看不到。评价内容/照片也没 UI |
| 10 | staff 回复评价 | ⚠️ | 桌面端 ReviewManagementPage 有 replyReview,**但 B 端 staff 自己没回复入口**。回复只能由平台管理员做 |
| 11 | 用户投诉 | ✅ | C 端 ComplaintPage,B 端订单可发起,完整 |
| 12 | 桌面端处理投诉 | ✅ | resolve/reject 都有,状态机对齐 |

### 2.4 取消 + 异常兜底(13-17)

| # | 环节 | 评级 | 现状 |
|---|------|:---:|------|
| 13 | 用户申请取消 | ✅ | requestCancel 元动作已实现,前端有按钮 |
| 14 | 桌面端审批取消 | ✅ | 桌面端"取消审批" tab |
| 15 | 平台强制取消 | ⚠️ | server 端支持 forceCancel(状态机覆盖 A20-A40),**但桌面端没 UI 按钮触发** |
| 16 | 派单失败 → S90 → 人工重派 | ⚠️ | reDispatch 有,**但"派单失败"事件没定义触发条件**。缺少"派单 N 次都没 staff 接单 → S90"逻辑 |
| 17 | 支付超时 → S90 | ⚠️ | 前端定时器 15s(demo 用),**没有 server 端定时任务**。刷新页面定时器丢,超时逻辑不可靠 |

### 2.5 结算 + 提现(18-19)

| # | 环节 | 评级 | 现状 |
|---|------|:---:|------|
| 18 | 完成 → 生成收入记录 | ⚠️ | 前端 store `confirmComplete` 里调 `recordIncome`,**这个逻辑放在前端不可靠**。前端不调用,server 不会自动记账 |
| 19 | staff 提现审批 | ⚠️ | 桌面端 SettlementPage 完整,**但 B 端 staff 无 UI 发起提现**。ServiceProfile 没有"提现"按钮 |

### 2.6 诚信分(20-22)

| # | 环节 | 评级 | 现状 |
|---|------|:---:|------|
| 20 | 差评/投诉 → 扣诚信分 | ⚠️ | 前端 trust-score store 有 `applyReviewImpact`/`applyComplaintImpact` 方法,**但没有触发点**。评价后/投诉解决后,没有代码调这些方法 |
| 21 | 好评 → 加分 | ⚠️ | 同上 |
| 22 | 诚信分低于阈值 → 观察期 | ✅ | 前端逻辑自动算(newScore < 60 → status="观察期"),阈值可配 |

### 2.7 管理动作(23-25)

| # | 环节 | 评级 | 现状 |
|---|------|:---:|------|
| 23 | 桌面端调整服务费定价规则 | ❌ | services-store 里价格**全是硬编码字符串**("¥30/方 起"等)。桌面端**没有定价配置页**。管理员改不了价 |
| 24 | staff/供应商入驻审核 | ⚠️ | C 端有申请页,后台有列表,**但没有审核/驳回 UI 动作**。Suppliers 表只被 read,没被 update |
| 25 | 片区 + 站点管理 | ✅ | 已补完 CRUD(commit `04426fc`) |

### 2.8 评审汇总

| 评级 | 数量 |
|------|:---:|
| ✅ 完全闭环 | 7 |
| ⚠️ 半闭环 | 14 |
| ❌ 断裂 | 2 |
| 已修复(本轮改造前) | 2 |

---

## 3. 核心问题诊断

### 3.1 联动逻辑放错端(最严重)

现状:很多状态流转的副作用(记账、扣分、加积分)都放在**前端 store 的 syncAction 回调**里:

```
前端 confirmComplete → syncAction 回调里 → recordIncome + 积分
```

**问题**:
- 前端 fail(网络断/refresh)则副作用全丢
- 服务端 API 直接被调用(比如管理员从桌面端 transition)则前端联动不触发
- 数据一致性无保障

**取优方向**:所有"状态流转到 X 时必然发生"的副作用,搬到 **server 端 transition 端点**里,前端 store 只负责刷新视图。

### 3.2 管理员核心动作缺 UI

现状:server 支持 forceCancel、报价审核筛选、定价配置等,**但桌面端没入口**。

**取优方向**:
- 桌面端"全部订单"tab 每行加"强制取消"按钮(异常订单兜底)
- 报价审核 tab 只显示"金额异常"订单(超参考价 20% 或人工标记)
- 新增"服务费配置"页,允许配置起步价+每单位价+超距加价

### 3.3 B 端 staff 缺关键动作

现状:staff 只能"接单 → 报价 → 服务 → 完成",**其他动作都缺 UI**。

**取优方向**:
- 拒单按钮真接 rejectOrder action(order 回 A10)
- ServiceProfile 加"申请提现"按钮
- 加"回复评价"入口(在 ServiceTasks 或 ServiceHistory)

### 3.4 异常/超时兜底不可靠

现状:所有超时都用前端定时器,页面刷新即丢。

**取优方向**:server 端加简易 cron(setInterval 每分钟扫一次):
- 扫 A35 状态且 quotedAt < now - 15min → payTimeout → S90
- 扫 S48 状态且 startedAt < now - 24h → alert(需人工介入)
- 扫 A10 状态且 dispatchAttempts >= 3 → autoFail → S90

---

## 4. 优化清单(按优先级)

### 4.1 P0 — 阻断主流程,必修

**P0.1 评价 rating 同步生成 review 记录**
- **位置**: `server/routes/orders.js` PATCH 端点(或新增专用 `POST /orders/:id/rate`)
- **改动**: 当 PATCH 携带 rating 且此前 review 不存在时,除了 UPDATE order.rating/ratedAt,同步 INSERT reviews 表记录(带 rating/content/images/staffId/userId)
- **前端配合**: C 端评价弹窗支持文字/照片(现在只有星级);store 的 `rateOrder(id, rating, content?, images?)` 签名扩展

**P0.2 诚信分自动触发**
- **位置**: `server/routes/orders.js`(评价触发) + `server/routes/complaints.js`(投诉触发)
- **改动**:
  - 评价 rating <=2 → trust_scores 该 staff 扣 -5 分;rating=5 → +1;rating=4 → +0.5
  - 投诉 resolve → 该 staff 扣 -3 分
  - 分数变更后自动判定观察期状态(< delinquentThreshold 则 "观察期")
- **配置源**: 从 `score_rules` 表读取当前规则(不硬编码分值)

**P0.3 收入记录服务端自动生成**
- **位置**: `server/routes/orders.js` transition 端点
- **改动**: 当 next=S40 且 priceQuote 存在且 staffId 存在时,自动 INSERT income_records
- **前端配合**: 删掉 `confirmComplete` 里的 recordIncome 调用(避免重复)

### 4.2 P1 — 关键场景缺失,应修

**P1.1 B 端拒单接通**
- **位置**: `src/features/convenience/b-end/pages/ServiceOrderDetail.tsx` + `ServiceTasks.tsx`
- **改动**: "暂不接单"按钮真调 `useConvenienceStore.getState().rejectOrder(id)`,该方法调 transition action=reject → A10;并在 dispatch_logs 记录理由

**P1.2 平台强制取消 UI**
- **位置**: `src/features/convenience/desktop/pages/ConveniencePage.tsx`
- **改动**: "全部订单" tab 每行加"更多"下拉,包含"强制取消"选项(A20-A40 状态可用),弹窗输入理由,写入 `arbitrationRemark` 字段

**P1.3 报价审核触发条件**
- **位置**: `server/logic/pricing.js`(新增) + `ConveniencePage.tsx` 报价审核 tab 过滤
- **改动**:
  - 定义"报价异常"规则:priceQuote > refPrice \* 1.2 或 refPrice=null(未配参考价)
  - 报价审核 tab 只显示"异常报价",正常报价直接转 A40 无需审
  - server transition quote 时判定,写入 `priceReviewRequired` 布尔字段

**P1.4 staff 提现 B 端入口**
- **位置**: `src/features/convenience/b-end/pages/ServiceProfile.tsx`
- **改动**: 加"申请提现"卡片,显示可提现余额(income - pending withdraw),点击弹窗输入金额,调 `requestWithdrawal`

**P1.5 派单失败 → S90 逻辑**
- **位置**: server 派单端点 + timers
- **改动**:
  - order 加 `dispatchAttempts` 字段(默认 0)
  - 每次 dispatch/reDispatch attempts++
  - 若 attempts >= 3 且 status=A10,自动 autoFail → S90
  - 或:server 端 cron 扫 A20 且指派后 5 分钟未 accept → 自动 reject → A10

**P1.6 支付超时 server 化**
- **位置**: `server/logic/timers.js`(新增)
- **改动**: setInterval 每分钟扫 A35 且 quoteAt < now - 15min → payTimeout → S90;A35 时给 order 加 `quotedAt` 时间戳

**P1.7 供应商入驻审核 UI**
- **位置**: `src/desktop/pages/supplier-applications/list.tsx`(或新增审核动作)
- **改动**: 列表每行加"通过"/"驳回"按钮,更新 supplier_applications.status,通过后可选择自动创建 supplier 记录

### 4.3 P2 — 用户体验/长期优化

**P2.1 定价规则可配置**
- **位置**: 新增 `src/features/convenience/desktop/pages/PricingConfigPage.tsx`
- **改动**:
  - service_configs 表加字段:`startPrice`(起步价)、`unitPrice`(每单位价)、`unit`(方/桶/件)、`extraKmPrice`(超距加价)、`extraKmThreshold`
  - 新增"服务费配置"页,允许管理员编辑
  - services-store 从 API 读价格,替代硬编码字符串

**P2.2 支付流程分线**
- **位置**: C 端 ServiceTrackingPage + B 端 ServiceOrderDetail
- **改动**:
  - **线上支付路径**:C 端点"确认支付" → 弹窗模拟输密码 → server transition pay → A40。跳过 paymentProof
  - **现金支付路径**:C 端只标记"我已付现金" → server 设 `payMethod=cash + status 仍 A35`,不流转;B 端 staff 端"确认收款" → server transition pay → A40
  - 完全废弃 confirmPaymentProof 老路径(混淆)

**P2.3 状态机文档-代码统一**
- **位置**: `docs/superpowers/specs/001-convenience.md`
- **改动**: 更新为当前 server 实际用的 11 个状态码,删除 spec 里 S48=待结算、S50=已完成 这类跟代码矛盾的描述

**P2.4 定时器/事件 全部 server 端**
- **位置**: `server/logic/timers.js` 统一
- **改动**: 除了 P1.6 支付超时,还包括:
  - 完工 30 分钟未确认 → autoConfirm → S40
  - 派单后 5 分钟未接单 → 自动 reject 回 A10(P1.5 覆盖)
- 前端 timers.ts 保留仅做 UI 提示(倒计时显示),不做状态流转

### 4.4 P3 — 架构建议(可选)

- **P3.1** staff/users 表合并:staff 是 users 的 subtype,通过 `roles: ["service"]` + `staffId` 关联(现状:staff 独立表,users 有 staffId 冗余字段)
- **P3.2** 冗余字段清理:`convenience_orders.staffPhone/staffName` 只保存 staffId,通过 JOIN 查(现状:改 staff 电话不同步历史订单)
- **P3.3** score_history 落库:trust_scores.scoreHistory 现在是 JSON 数组,建议拆表 `trust_score_history`(id, staffId, change, reason, orderId, createdAt)

---

## 5. 实施顺序建议

**第一阶段**(P0,预计 1-2 天):
1. server transition 端点加"完成后自动记账 + 触发诚信分调整 + 生成 review 记录"
2. C 端评价弹窗补 content/images 字段
3. 删除前端 store 里对应的重复逻辑

**第二阶段**(P1,预计 2-3 天):
1. B 端 rejectOrder / 提现入口
2. 桌面端 forceCancel 按钮 / 报价审核筛选
3. server 端 timers 兜底(支付超时 / 派单失败)
4. 供应商入驻审核

**第三阶段**(P2,预计 2 天):
1. PricingConfigPage 新页
2. 支付路径分线
3. 状态机文档统一
4. 前端 timers 降级为 UI 提示

**P3 可选,视需求推进。**

---

## 6. 验收标准

每个 P0/P1 项目独立可测:

**P0.1 评价 → review**
- C 端评 5 星并输入内容/照片 → 桌面端评价管理立即看到该条 review

**P0.2 诚信分自动触发**
- 差评订单 → staff 诚信分 -5;5 星好评 → +1;投诉 resolve → -3
- 分数跌破阈值时 status 自动变"观察期"

**P0.3 收入自动记录**
- 只用 API 直接触发 transition 到 S40(不经过前端) → income_records 有对应记录

**P1.1 B 端拒单**
- staff 点"拒单" → 订单回 A10 状态,桌面端可再次派单

**P1.2 强制取消**
- 桌面端任意 A20-A40 订单点强制取消 → 输入理由 → 状态转 S50,arbitrationRemark 有记录

**P1.5 派单失败**
- 一个订单被自动派单 3 次都失败 → 自动转 S90 → 桌面端在"待派单" tab 看到

**P1.6 支付超时**
- 一个 A35 订单放置 15 分钟 → 自动转 S90(即使前端没打开)

**P2.1 定价配置**
- 桌面端改"生活垃圾清运"的起步价 → C 端 ServicesPage 立即显示新价格

---

## 7. 明确不做

沿用原 spec 的边界:
1. 无真实支付对接(所有 pay 只是标记)
2. 无 WebSocket / GPS 实时路径
3. 派单算法保持 Haversine + zone 匹配,不做智能调度
4. 无短信/微信通知,仅前端 toast

**本次优化补充不做**:
5. 不改用户/角色模型(P3 建议但不在本次范围)
6. 不重构 orders 表冗余字段(P3 建议但不做)
7. 不做数据分析大盘/报表页

---

## 8. 依赖变更

需要新增/修改的 server 表字段:

| 表 | 字段变更 |
|---|---|
| `convenience_orders` | 加 `dispatchAttempts INTEGER DEFAULT 0`, `quotedAt TEXT`, `priceReviewRequired INTEGER DEFAULT 0`, `startedAt TEXT` |
| `service_configs` | 加 `startPrice REAL`, `unitPrice REAL`, `extraKmPrice REAL`, `extraKmThreshold REAL` |
| `dispatch_logs` | 加 `outcome TEXT`(success/fail/reject/timeout)、`reason TEXT` |
| 新增 `trust_score_history` (P3) | id, staffId, change, reason, orderId, createdAt |

新增 server 端逻辑:
- `server/logic/pricing.js` — 报价异常判定
- `server/logic/timers.js` — cron 兜底(支付超时/派单失败)
- `server/logic/scoring.js` — 诚信分自动调整

---

## 9. 风险与注意点

1. **P0.3(收入自动记账)会与前端 `recordIncome` 重复触发** —— 必须同步删掉前端调用,否则同一订单记两条 income
2. **P1.5/P1.6 引入定时器** —— server 单进程 setInterval 简单可靠,但多实例部署会重复扫描。Demo 单机不受影响。
3. **P2.1 定价配置改数据库读** —— 前端 ServicesPage 硬编码文案(如"起步价 ¥50/方,2 公里内不加价")需要改成从 API 读的动态模板
4. **状态字段变更需要迁移种子数据** —— 新增字段有 DEFAULT 值,现有种子数据无需重灌
