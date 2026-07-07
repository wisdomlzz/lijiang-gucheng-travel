# 便民服务 MVP 1.0 设计规格

> **日期**: 2026-07-07
> **类型**: MVP 实施规格(权威文档)
> **上游文档**: `~/Downloads/便民服务平台 MVP 1.0 产品设计文档（正式版）.md`(产品需求)
> **取代**: `2026-07-07-convenience-refinement-design.md`(准生产视角评审,已被本文档取代)
> **配套图**: `2026-07-07-convenience-flow-diagrams.md`(业务逻辑图,部分内容已被本文档更新)
> **状态**: 待用户评审

---

## 0. 文档定位

本文档以**产品设计文档 MVP 1.0** 为权威需求来源,在此基础上:
1. 查漏补缺 14 条(见 §1.3),补全产品文档未明确的边界
2. 标注与当前代码实现的差距(见 §9),作为后续 writing-plans 的输入
3. 取优原则:**MVP 闭环优先,工程化但不冗余**

---

## 1. MVP 定位与边界

### 1.1 核心目标(继承产品文档 §1.1)

- ✅ 验证「用户下单 → 师傅接单 → 上门服务 → 收钱 → 评价」主线闭环
- ✅ 验证用户愿不愿意用、师傅愿不愿意接
- ✅ 攒第一批真实订单和评价数据
- ✅ 验证双支付方案(线上+现金)的可行性

### 1.2 MVP 原则(继承产品文档 §1.2)

| 优先级 | 原则 |
|--------|------|
| 🔴 必须 | 主流程必须闭环 |
| 🔴 必须 | 数据结构必须完整 |
| 🔴 必须 | Server 端驱动状态机(架构红线) |
| 🟡 简化 | 异常流程人工兜底 |
| 🟡 简化 | 算法做简单版 |
| 🟢 后做 | 体验优化、复杂体系化功能 |

### 1.3 查漏补缺 14 条决策

产品文档未明确的边界,经评审确认如下:

| # | 议题 | 决策 |
|---|------|------|
| 1 | 拒绝报价后恢复 | S90→A35 重置 quotedAt + 记 order_operation_logs |
| 2 | 师傅 A30 无法服务 | 走现有取消审批流程(requestCancel → 管理员审批),不新增流程 |
| 3 | 派单公平性 | 硬筛选 + 排序(见 §5.2),3 次失败转 S90 |
| 4 | 评价修改 | 不支持用户修改,管理员可软删违规 |
| 5 | 禁用 staff 的进行中订单 | 弹窗列出未完成订单,管理员逐个处理(forceCancel 或转派) |
| 6 | 到场打卡 action | 新增 `arriveCheckin` 元动作,不改状态,只写 `arrived_at` |
| 7 | 支付方式锁定 | A35 加 `paymentMethodLocked` 布尔字段,不拆新状态 |
| 8 | 现金实收≠报价 | MVP 不收实收金额,点"确认现金已收"按报价入账,`paid_amount = quote_amount` |
| 9 | T+7 内退款 | income_records 标 `settlement_status = refunded`;T+7 后转 S90 人工冲正 |
| 10 | 好评率口径 | `good_rate = (rating≥4 的评价数) / 总评价数`,无评价默认 1.0 |
| 11 | 操作日志范围 | 所有 server transition 自动写 order_operation_logs,system 触发的 operator_type=system |
| 12 | dispatch_logs 跳过 staff | 不记,只记派给谁+第几轮+结果 |
| 13 | reviews 软删 | 加 `is_deleted` 字段,统计好评率时过滤 |
| 14 | system_configs updated_by | 加 `updated_by` 字段记录管理员 ID |

### 1.4 明确不做(继承产品文档 §1.3 + 本次补充)

**产品文档已明确不做**(不重复列举,见产品文档 §1.3):平台抽成、保证金、智能派单、复杂诚信分、实时提现、用户自选师傅、抢单模式、到场 GPS、报价自动审核、电子发票、多级代理、实时位置追踪、改单/加项线上流程。

**本次补充不做**:
- ❌ 用户修改评价(只管理员删除违规)
- ❌ 实收金额录入(现金按报价入账)
- ❌ dispatch_logs 记录跳过 staff
- ❌ 配置变更历史归档表(只加 updated_by)

---

## 2. 核心角色与服务类型

### 2.1 三类角色(继承产品文档 §2.1)

| 角色 | 端 | 核心诉求 |
|------|----|---------| 
| C 端用户 | 小程序/H5 | 快速找到靠谱师傅,价格透明,服务有保障 |
| B 端服务人员(staff) | 小程序/APP | 接到更多订单,按时拿到钱 |
| 平台管理员 | 桌面端后台 | 管订单、管人员、管钱、处理异常 |

### 2.2 六类便民服务(继承产品文档 §2.2)

建筑垃圾清运 / 生活垃圾清运 / 送水服务 / 布草配送 / 行李搬运 / 送货服务

### 2.3 服务人员模式

所有 staff 默认 `staff_type = partner`(合作服务商),按单结算,MVP 无抽成。`employee` 字段保留兼容,不实现工资体系。

---

## 3. 核心业务流程

### 3.1 下单主流程(主线必须闭环)

```
用户打开服务页
    ↓
选择服务类型 + 填写地址备注(不选支付方式)
    ↓ 提交订单
【S10 已下单】
    ↓ Server 定时任务(每10秒)触发自动派单
【A20 已指派】
    ↓ 师傅接单 / 拒单回 A10 重派
【A30 已接单】
    ↓ 师傅到场打卡(arriveCheckin 元动作,不改状态,写 arrived_at)
【仍为 A30,已记录到场时间】
    ↓ 师傅报价(Server 校验 arrived_at 不为空)
【A35 已核价】
    ↓ 用户确认报价 + 选择支付方式(锁定 paymentMethod + paymentMethodLocked=1)
    ├─ 用户拒绝报价 → 转 S90 人工处理
    ↓
    ├─ 线上支付 → 用户线上付钱 → A40
    └─ 现金支付 → 师傅确认现金已收 → A40
【A40 已收款】
    ↓ 开始服务
【S48 服务中】
    ↓ 完工上传照片
【S55 完工待确认】
    ↓ 用户确认完成 / 24h 自动确认
【S40 已完成】
    ↓ 用户评价(生成 review 记录,更新 staff.good_rate)
流程结束
```

### 3.2 异常处理流程

**用户取消**(产品文档 §3.2 + §11.1,决策 #2 复用此流程):
- S10/A10/A20:用户直接取消 → S50(不扣费)
- A30+:用户申请 cancelRequested=1,管理员审批(师傅 A30 无法服务也走此流程,决策 #2)
  - 同意 → S50(按 §11.2 扣费规则计算)
  - 拒绝 → 清 cancelRequested,恢复服务
- S48 服务中:基本不能取消,特殊情况找客服(走 S90)

**派单异常**:
- 派单重试 3 次失败 → S90
- A20 超过 5 分钟未接 → 自动回 A10 重派
- 累计 3 次重派失败 → S90

**报价争议**(决策 #1):
- 用户拒绝报价 → S90(记录 before_manual_status = A35)
- 管理员协调成功 → S90 → A35(重置 quotedAt = now,支付超时重新 30 分钟计时)
- 协调失败 → S90 → S50(forceCancel,cancel_fee=0,管理员可调)

**投诉处理**:
- 用户提交投诉 + 证据 → C10
- 管理员审核 → C40(成立,记处罚)或 CR(不成立,驳回)
- 投诉成立时:`staffs.complaint_count += 1`,**不改 good_rate**(产品文档明确)
- 涉及退款:按 §9 决策 #9 处理

**改单/加项**:MVP 不做线上流程,转人工客服处理。

### 3.3 结算与评价流程

```
订单完成(S40)
    ├─→ 订单进入待评价状态(review_status = pending)
    │      ↓
    │   用户提交评价 → 写入 reviews 表 → 更新 staff.good_rate(定时任务)
    │
    └─→ 写入 income_records 表
           ↓
        按支付方式区分结算:
           ├─ 线上支付:全额计入待结算,T+7 后进入可提现余额
           │      ↓
           │   staff 申请提现 → 管理员审批 → 平台打款
           │
           └─ 现金支付:仅计入业绩/GMV,不进入可提现余额
                  ↓
               平台不打款,仅做对账记录
```

---

## 4. 双支付方案设计(强需求)

### 4.1 核心思路(产品文档 §4.2)

下单时不选支付方式;师傅上门报价后,用户与师傅确认最终价格和支付方式,确认后由系统锁定 `paymentMethod`。

### 4.2 锁定实现(决策 #7)

A35 状态加 `paymentMethodLocked` 布尔字段:
- 用户确认报价 + 选支付方式时:写 `paymentMethod = online/cash` + `paymentMethodLocked = 1`
- 锁定后:UI 隔离(§4.5 第二层)、Server 校验(第三层)、不可修改(§4.7)

### 4.3 线上支付流程(产品文档 §4.3)

1. 用户确认报价,选"线上支付",系统锁定 `paymentMethod = online`
2. C 端显示"确认报价并支付"按钮
3. 用户点击 → 模拟调起支付(MVP 不接真实支付)
4. 支付成功 → Server transition pay → A40 → 写 payment_records 流水
5. B 端师傅看不到现金收款按钮,只显示"用户已支付"

### 4.4 现金支付流程(产品文档 §4.4 + 决策 #8)

1. 用户确认报价,选"现金支付",系统锁定 `paymentMethod = cash`
2. C 端显示"请向服务人员支付现金 XX 元",不显示线上支付按钮
3. 师傅收到现金后,B 端点"确认现金已收"
4. Server transition pay → A40 → 写 payment_records 流水(`paid_amount = quote_amount`,不收实收)
5. C 端同步显示"已支付(现金)"

### 4.5 防打架机制(产品文档 §4.5 五层防护)

| 层级 | 机制 | 实现 |
|------|------|------|
| 第一层 | 阶段隔离 | A35 且 `paymentMethodLocked = 0` 时,不开放任何支付/收款按钮 |
| 第二层 | UI 隔离 | 锁定 online:B 端无收款按钮;锁定 cash:C 端无线上支付按钮 |
| 第三层 | Server 校验 | pay 端点校验 `paymentMethod` 与请求方匹配,不匹配拒绝 |
| 第四层 | 状态幂等 | A40 状态不能再支付/确认收款,重复请求返回成功 |
| 第五层 | 操作日志 | 所有支付操作写 order_operation_logs + payment_records |

### 4.6 支付方式不可改(产品文档 §4.7)

锁定后不允许用户、师傅、管理员修改。需要改则取消订单重下。

### 4.7 财务对账(产品文档 §4.6)

后台基于 `payment_records` 生成三类报表:
- 线上支付流水表
- 现金收款记录表
- 交易流水/GMV 统计表(按日/周/月,线上/现金分开)

---

## 5. 订单状态机与派单

### 5.1 状态列表(11 个,继承产品文档 §5.1)

| 状态码 | 状态名 | 阶段 |
|--------|--------|------|
| S10 | 已下单 | 派单阶段 |
| A10 | 待重新派单 | 派单阶段 |
| A20 | 已指派 | 派单阶段 |
| A30 | 已接单 | 服务准备 |
| A35 | 已核价 | 支付阶段 |
| A40 | 已收款 | 支付阶段 |
| S48 | 服务中 | 服务阶段 |
| S55 | 完工待确认 | 验收阶段 |
| S40 | 已完成 | 完成 |
| S50 | 已取消 | 终止 |
| S90 | 待人工处理 | 异常 |

### 5.2 派单算法(决策 #3)

**硬筛选**(不满足直接出局):
- `online_status = 在线`
- `service_types` 包含订单服务类型
- `zone_id` 匹配订单所在片区(点对点服务按距离,片区型服务按 zone)
- `today_orders < 每日上限`(默认 20,可配)
- `assignedOrders < 3`(防堆积,已派未接单数)

**排序**(合格池内):
1. `today_orders` 升序(今天单最少的优先)
2. 同单数 → 距离升序(Haversine)
3. 同距离 → `good_rate` 降序

**派单逻辑**:
- 取第一名,派给他
- 拒单/超时 → 取下一个
- 最多重试 3 次,失败转 S90

### 5.3 状态流转规则(产品文档 §5.2 + 决策 #6/#7)

> 🔴 架构红线:所有状态变更必须由 Server 端触发,前端只发请求。

| 源状态 | 目标状态 | 触发动作 | 触发方 |
|--------|----------|----------|--------|
| - | S10 | createOrder | C 端用户 |
| S10 | A20 | autoDispatchOrder | Server 定时任务(每10秒) |
| A20 | A30 | acceptOrder | B 端师傅 |
| A20 | A10 | rejectOrder / 接单超时 | B 端 / Server |
| A10 | A20 | autoDispatchOrder | Server 定时任务 |
| A10 | S90 | 重试 3 次失败 | Server |
| A30 | A30(元动作) | arriveCheckin(写 arrived_at) | B 端师傅 |
| A30 | A35 | submitQuote(前置:arrived_at 不为空) | B 端师傅 |
| A35 | A35(元动作) | lockPaymentMethod(写 paymentMethod + paymentMethodLocked=1) | C 端用户 |
| A35 | A40 | payOnline / confirmCash | C 端 / B 端 |
| A35 | S90 | 用户拒绝报价 | C 端用户 |
| A35 | S90 | 收款确认超时 30 分钟 | Server |
| A40 | S48 | startService | B 端师傅 |
| S48 | S55 | completeService + 传照片 | B 端师傅 |
| S55 | S40 | confirmComplete / 24h 自动确认 | C 端 / Server |
| S10/A10/A20 | S50 | 用户直接取消 | C 端用户 |
| A30+ | S50 | 用户申请 + 管理员审批(requestCancel → approveCancel) | C 端 + 管理员 |
| 未完成(除 S40/S50) | S50 | forceCancel | 管理员 |
| S90 | A10/A20 | 重新派单 | 管理员 |
| S90 | A35 | 报价争议协调成功(重置 quotedAt) | 管理员 |
| S90 | S50 | 人工取消 | 管理员 |

### 5.4 元动作(不改状态,只改字段)

| 元动作 | 改动字段 | 触发方 |
|--------|----------|--------|
| arriveCheckin | `arrived_at = now` | B 端师傅 |
| lockPaymentMethod | `paymentMethod = online/cash`, `paymentMethodLocked = 1` | C 端用户 |
| requestCancel | `cancelRequested = 1` | C 端用户 |
| rejectCancel | `cancelRequested = 0` | 管理员 |
| approveCancel | `cancelRequested = 0` + status → S50 | 管理员 |

### 5.5 端侧展示约束(产品文档 §5.3)

- **到场打卡**:A30 未打卡时,报价入口置灰,提示"请先完成到场打卡"
- **支付锁定**:A35 且 `paymentMethodLocked = 0`,不显示支付/收款按钮;锁定后按支付方式隔离 UI
- **S90 师傅端**:订单从师傅"进行中"列表移除,只读查看,不可操作
- **报价拒绝≠取消**:用户拒绝报价先进 S90 协调,协调失败才 forceCancel 到 S50

---

## 6. 功能模块清单

### 6.1 P0 必须有(产品文档 §6.1)

**C 端用户**:
- 服务浏览与下单(选类型、填地址;不选支付方式)
- 订单跟踪(状态、师傅信息、联系师傅)
- 确认报价 / 拒绝报价(拒绝转 S90)
- 线上支付
- 确认完成 + 评价
- 申请取消订单
- 投诉入口

**B 端服务人员**:
- 接单 + 拒单(拒单选原因)
- 到场打卡(仅记录 arrived_at)
- 报价(未打卡置灰)
- 确认现金收款
- 完工上传照片
- 提现申请
- 入驻申请

**管理员后台**:
- 订单管理(查看、筛选、手动派单、强制取消)
- 服务人员管理(入驻审核、增删改、分配区域、禁用 + 进行中订单处理弹窗,决策 #5)
- 取消审批(含扣费计算)
- 结算管理(收入明细、提现审批)
- 评价管理(查看、回复、删除违规)
- 人工处理池(S90 订单,展示进入前状态 + 异常原因)
- 系统配置(取消扣费规则、派单参数、超时时间等)

**系统能力**:
- 自动派单(Server 定时任务)
- 状态机(Server 端驱动)
- 订单操作日志(所有 transition 自动记)

### 6.2 P1 建议有 / P2 后做(继承产品文档 §6.2 §6.3,略)

---

## 7. 数据模型

> 字段命名用 camelCase(与现有代码一致),SQLite 存储。

### 7.1 orders 表(产品文档 §7.1 + 决策 #7)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 订单 ID |
| orderNo | TEXT | 业务订单号 |
| userId | TEXT | 用户 ID |
| staffId | TEXT | 服务人员 ID |
| serviceType | TEXT | 服务类型 |
| status | TEXT | 订单状态(S10/A20/...) |
| paymentMethod | TEXT | 支付方式(online/cash,锁定后填) |
| paymentMethodLocked | INTEGER | 支付方式已锁定(0/1,决策 #7) |
| quoteAmount | REAL | 报价金额 |
| paidAmount | REAL | 实付金额(默认 = quoteAmount,决策 #8) |
| arrivedAt | TEXT | 师傅到场打卡时间 |
| address | TEXT | 服务地址 |
| latitude / longitude | REAL | 经纬度(派单用) |
| remark | TEXT | 用户备注 |
| dispatchAttempts | INTEGER | 派单尝试次数 |
| cancelRequested | INTEGER | 是否申请取消 |
| cancelReason | TEXT | 取消原因 |
| cancelFee | REAL | 取消费用 |
| rejectQuoteReason | TEXT | 拒绝报价原因 |
| reviewStatus | TEXT | 评价状态(pending/done/expired) |
| beforeManualStatus | TEXT | 进入 S90 前的状态 |
| manualReason | TEXT | 进入人工原因(dispatch_failed/quote_rejected/pay_timeout/cancel_dispute/other) |
| quotedAt | TEXT | 报价时间(支付超时计时用) |
| createdAt | TEXT | 创建时间 |
| updatedAt | TEXT | 更新时间 |

### 7.2 reviews 表(产品文档 §7.2 + 决策 #13)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 评价 ID |
| orderId | TEXT | 关联订单 |
| userId | TEXT | 评价用户 |
| staffId | TEXT | 被评价师傅 |
| rating | INTEGER | 评分(1-5) |
| content | TEXT | 评价内容 |
| images | TEXT(JSON) | 评价图片数组 |
| replyContent | TEXT | 回复内容 |
| replyAt | TEXT | 回复时间 |
| isDeleted | INTEGER | 软删(0/1,决策 #13) |
| createdAt | TEXT | 评价时间 |

**评价规则**(决策 #4):
- 订单完成 S40 时,review_status = pending;用户主动提交评价才生成 review 记录(不生成空记录)
- 用户提交评价后不可修改(决策 #4)
- 管理员可软删违规评价(is_deleted=1,决策 #13)
- good_rate 由定时任务算(决策 #10)

### 7.3 income_records 表(产品文档 §7.3 + 决策 #9)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 记录 ID |
| orderId | TEXT | 关联订单 |
| staffId | TEXT | 服务人员 |
| staffType | TEXT | 人员类型(partner/employee) |
| amount | REAL | 订单金额 |
| paymentMethod | TEXT | 支付方式(online/cash) |
| fundHolder | TEXT | 资金持有人(platform/staff) |
| platformFee | REAL | 平台抽成(MVP 为 0) |
| staffIncome | REAL | 师傅收入(amount - platformFee) |
| withdrawableAmount | REAL | 可提现金额(线上=待结算,现金=0) |
| settlementStatus | TEXT | 结算状态(pending/settled/refunded,决策 #9) |
| settlementBatch | TEXT | 结算批次号 |
| createdAt | TEXT | 创建时间 |
| settledAt | TEXT | 结算时间(T+7 后) |

**规则**:
- 订单完成 S40 时自动 INSERT,paymentMethod=online → withdrawableAmount=amount(待结算),paymentMethod=cash → withdrawableAmount=0
- T+7 后定时任务将 settlementStatus: pending → settled,资金进入可提现余额
- 退款时(决策 #9):pending → refunded(删可提现);settled → 转 S90 人工冲正

### 7.4 staffs 表(产品文档 §7.4)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 师傅 ID |
| name | TEXT | 姓名 |
| phone | TEXT | 手机号 |
| staffType | TEXT | 类型(partner/employee,默认 partner) |
| idCard | TEXT | 身份证号 |
| idCardFront / idCardBack | TEXT | 身份证照片 URL |
| serviceTypes | TEXT(JSON) | 服务类型数组 |
| zoneId | TEXT | 所属服务区域 |
| latitude / longitude | REAL | 当前位置 |
| onlineStatus | TEXT | 在线状态(online/busy/offline) |
| goodRate | REAL | 好评率(冗余,定时任务算) |
| complaintCount | INTEGER | 成立投诉次数 |
| penaltyScore | REAL | 处罚分(MVP 人工维护) |
| totalOrders | INTEGER | 完成订单数 |
| todayOrders | INTEGER | 今日已接单数 |
| assignedOrders | INTEGER | 已派未接单数(派单防堆积用,决策 #3) |
| balance | REAL | 可提现余额 |
| applyStatus | TEXT | 入驻状态(pending/approved/rejected) |
| rejectReason | TEXT | 驳回原因 |
| status | TEXT | 账号状态(normal/disabled) |
| createdAt | TEXT | 注册时间 |

### 7.5 withdrawal_requests 表(产品文档 §7.5)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 申请 ID |
| staffId | TEXT | 申请人 |
| amount | REAL | 申请金额 |
| status | TEXT | 状态(pending/approved/rejected/paid) |
| rejectReason | TEXT | 驳回原因 |
| approveBy | TEXT | 审批人 |
| approveAt | TEXT | 审批时间 |
| paidAt | TEXT | 打款时间 |
| createdAt | TEXT | 申请时间 |

### 7.6 dispatch_logs 表(产品文档 §7.6 + 决策 #12)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK AUTOINCREMENT | 日志 ID |
| orderId | TEXT | 关联订单 |
| staffId | TEXT | 被派单师傅 |
| dispatchRound | INTEGER | 第几轮派单 |
| dispatchScore | REAL | 综合得分(MVP 可留空) |
| result | TEXT | 结果(pending/accepted/rejected/timeout) |
| rejectReason | TEXT | 拒单原因 |
| createdAt | TEXT | 派单时间 |
| respondedAt | TEXT | 接单/拒单/超时时间 |

**不记跳过的 staff**(决策 #12)。

### 7.7 payment_records 表(产品文档 §7.7)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 流水 ID |
| orderId | TEXT | 关联订单 |
| originPaymentId | TEXT | 原支付流水 ID(退款用) |
| paymentMethod | TEXT | 支付方式(online/cash) |
| amount | REAL | 金额(退款为负) |
| status | TEXT | 状态(pending/success/failed/refunded) |
| thirdTradeNo | TEXT | 第三方交易号(现金为空) |
| collectedByStaffId | TEXT | 现金收款师傅(线上为空) |
| paidAt | TEXT | 支付/确认时间 |
| createdAt | TEXT | 创建时间 |

### 7.8 order_operation_logs 表(产品文档 §7.8 + 决策 #11)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK AUTOINCREMENT | 日志 ID |
| orderId | TEXT | 关联订单 |
| operatorType | TEXT | 操作方(user/staff/admin/system) |
| operatorId | TEXT | 操作人 ID(system 可空) |
| action | TEXT | 动作(如 acceptOrder/payOnline/forceCancel) |
| fromStatus | TEXT | 操作前状态 |
| toStatus | TEXT | 操作后状态 |
| remark | TEXT | 说明/原因 |
| createdAt | TEXT | 操作时间 |

**所有 server transition 自动记录**(决策 #11),system 触发的 operatorType=system。

### 7.9 system_configs 表(产品文档 §7.9 + 决策 #14)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 配置 ID |
| configKey | TEXT | 配置键 |
| configValue | TEXT(JSON) | 配置值 |
| description | TEXT | 配置说明 |
| updatedBy | TEXT | 更新人 ID(决策 #14) |
| updatedAt | TEXT | 更新时间 |

**主要配置项**(产品文档 §7.9):
- cancelFeeRules:取消扣费规则
- dispatchRetryTimes:派单重试次数(默认 3)
- acceptTimeoutMinutes:接单超时(默认 5)
- payTimeoutMinutes:支付超时(默认 30)
- autoConfirmHours:自动确认完工(默认 24)
- settlementTDays:结算 T+N(默认 7)
- minWithdrawalAmount:最低提现(默认 100)
- dailyOrderLimit:每日接单上限(默认 20,决策 #3)

### 7.10 complaints 表(产品文档 §7.10)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 投诉 ID |
| orderId | TEXT | 关联订单 |
| userId | TEXT | 投诉人 |
| staffId | TEXT | 被投诉师傅 |
| content | TEXT | 投诉内容 |
| evidenceUrls | TEXT(JSON) | 证据 URL 数组 |
| status | TEXT | 状态(submitted/reviewing/valid/invalid/closed) |
| result | TEXT | 处理结论 |
| penaltyScoreDelta | REAL | 处罚分增量 |
| refundAmount | REAL | 退款金额 |
| reviewedBy | TEXT | 审核人 |
| reviewedAt | TEXT | 审核时间 |
| createdAt | TEXT | 提交时间 |

**冗余字段更新**:status → valid 时,staffs.complaintCount += 1,staffs.penaltyScore += penaltyScoreDelta。不改 good_rate(产品文档明确)。

---

## 8. 技术架构

### 8.1 架构红线(产品文档 §8.1)

🔴 **所有业务逻辑、状态流转、定时任务必须在 Server 端,前端只负责展示和发请求。**

### 8.2 定时任务清单(产品文档 §8.2,全部 Server 端)

| 任务 | 频率 | 说明 |
|------|------|------|
| 自动派单 | 每 10 秒 | 扫 S10/A10 订单,执行派单(§5.2) |
| 接单超时检测 | 每分钟 | A20 超 5 分钟未接,自动回 A10 |
| 支付超时检测 | 每分钟 | A35 超 30 分钟未完成收款(线上未支付/现金未确认),转 S90 |
| 自动确认完工 | 每小时 | S55 超 24 小时未确认,自动转 S40 |
| 好评率统计 | 每天凌晨 | 根据 reviews 重新计算所有 staff.good_rate(决策 #10) |
| 今日订单数清零 | 每天凌晨 | 重置 staffs.todayOrders |
| 结算 T+7 | 每天凌晨 | income_records pending 超 7 天 → settled,资金进入 balance |

### 8.3 派单算法(§5.2,产品文档 §8.3 简化版)

见 §5.2,硬筛选 + 排序,不搞权重公式。

### 8.4 并发一致性(产品文档 §8.5)

`acceptOrder` 时原子校验 `todayOrders < dailyOrderLimit`,用行锁或乐观锁(`todayOrders < limit` 作为更新条件)。

---

## 9. 与当前代码的差距分析

> 基于当前实现(commit `224b965` 之前)与 MVP 设计的差距。

### 9.1 已具备(可直接用)

| 能力 | 现状 |
|------|------|
| 11 个状态码 + 状态机 | server transitions.js 已对齐 |
| 下单/派单/接单/报价/支付/服务/完成 主线 | transition 端点已实现 |
| requestCancel/approveCancel/rejectCancel 元动作 | 已实现 |
| forceCancel | server 支持,但缺 UI(见 9.2) |
| 投诉创建/resolve/reject | 已实现 |
| 片区 + 站点 CRUD | 已实现 |
| staff CRUD | 已实现 |
| 桌面端提现审批 | 已实现 |
| payment_records 表 | schema 已有,但未使用 |

### 9.2 必须新建/改造(P0)

| 能力 | 差距 | 改造点 |
|------|------|--------|
| **server 端定时任务** | 完全缺失 | 新建 `server/logic/scheduler.js`,7 个 cron 任务(§8.2) |
| **arriveCheckin 元动作** | 缺失 | orders.js 加端点 + arrivedAt 字段 + 报价前置校验 |
| **支付方式锁定** | 缺失 | orders 加 paymentMethodLocked 字段 + lockPaymentMethod 元动作 + UI 隔离 |
| **线上/现金支付分线** | 当前混在一起 | 拆 payOnline / confirmCash 两个 action,五层防护 |
| **review 记录生成** | 当前 rateOrder 只写 order.rating | 改为 server 生成 reviews 表记录 + reviewStatus 流转 |
| **income_records 自动生成** | 当前前端 store 调 recordIncome | 改为 server transition 到 S40 时自动 INSERT |
| **good_rate 计算** | 缺失 | 每天凌晨定时任务,基于 reviews 算 |
| **order_operation_logs 自动记** | 缺失 | transition 端点统一写日志 |
| **dispatch_logs 完整化** | 当前前端有 dispatchLog 但不入库 | server 派单时写 dispatch_logs |
| **staffs.assignedOrders 字段** | 缺失 | 加字段,派单时 +1,接单/拒单/超时 -1 |
| **todayOrders 字段** | 当前有 assignedOrders 但无 todayOrders | 加字段,acceptOrder 时 +1,每天凌晨清零 |
| **S90 人工处理池 UI** | 桌面端"待派单"tab 混了 S10/A10/S90 | 拆独立的"人工处理"tab,展示 beforeManualStatus + manualReason |
| **强制取消 UI** | 缺失 | 桌面端订单行加"强制取消"按钮,弹窗输入理由,写 arbitrationRemark |
| **取消扣费规则** | 缺失 | system_configs 配置 + 审批时计算 cancelFee |
| **B 端拒单接通** | UI 有按钮没接 action | "暂不接单"真调 rejectOrder,选拒单原因 |
| **B 端提现入口** | 缺失 | ServiceProfile 加"申请提现" |
| **staff 禁用时处理进行中订单** | 缺失 | 禁用操作弹窗列出未完成订单,逐个 forceCancel 或转派 |
| **system_configs 配置页** | 缺失 | 桌面端新增"系统配置"页,改扣费规则/超时时间/派单参数等 |
| **结算 T+7** | 缺失 | 定时任务 + balance 计算 + 提现校验 |
| **财务报表(3 张)** | 缺失 | 桌面端新增报表页,基于 payment_records |

### 9.3 简化或延后(P1/P2)

| 能力 | 处理 |
|------|------|
| 派单综合得分 dispatchScore | MVP 留空,只用排序,不算分 |
| staffs.idCard/idCardFront/Back | 表字段保留,MVP 入驻可不强制上传 |
| 退款流程完整化 | MVP 只做 T+7 内标 refunded,T+7 后转 S90 人工 |
| 消息通知 | P1 后做 |
| 师傅位置展示 | P1 后做 |

---

## 10. 验收标准(产品文档 §12 + 本次补充)

### 10.1 主流程验收

- [ ] 用户能完整走完「下单→派单→接单→到场打卡→报价→确认报价+支付方式→支付→服务→完工→确认→评价」
- [ ] 用户可拒绝报价,拒绝后转 S90
- [ ] 线上支付:支付成功状态正确,财务有流水
- [ ] 现金支付:师傅确认收款后状态正确,现金有记录
- [ ] 订单完成后进待评价;用户提交评价生成 review 记录,good_rate 正确更新
- [ ] 所有状态变更 Server 端驱动,刷新页面不丢失
- [ ] staff 能正常接单、结算,金额计算正确

### 10.2 异常流程验收

- [ ] 师傅拒单后,订单自动重新派单
- [ ] 派单 3 次失败转 S90
- [ ] S10/A10/A20 用户可直接取消
- [ ] A30+ 取消需管理员审批,扣费按规则计算
- [ ] 管理员可强制取消未完成订单;S40 不回退,走售后/退款
- [ ] 支付超时转 S90,不自动取消
- [ ] 用户拒绝报价转 S90,管理员可协调恢复
- [ ] 取消扣费计算正确,后台可配置规则

### 10.3 后台管理验收

- [ ] 管理员可查看所有订单,按状态筛选
- [ ] 管理员可手动派单给指定师傅
- [ ] 管理员可审批取消申请,调整扣费金额
- [ ] 管理员可查看和回复评价,删除违规评价(软删)
- [ ] 管理员可查看收入明细,审批提现
- [ ] 财务报表区分线上收入和现金收入
- [ ] staff 入驻审核流程完整
- [ ] S90 人工处理池可见所有异常订单 + 进入前状态 + 异常原因
- [ ] 系统配置可在后台修改
- [ ] 禁用 staff 时提示处理进行中订单

### 10.4 非功能验收

- [ ] 关了前端页面,自动派单、超时检测等定时任务正常跑
- [ ] 订单状态变更都有操作日志,可追溯
- [ ] 支付接口幂等,重复支付不重复扣钱
- [ ] 派单算法兼顾距离和公平性,不集中在少数人

---

## 11. 风险与注意点

1. **定时任务多实例重复执行**:MVP 单机 setInterval,多实例部署需加分布式锁。Demo 单机不受影响。
2. **支付方式锁定字段迁移**:现有 orders 表无 paymentMethodLocked,需 ALTER TABLE 加字段(有默认值,不影响现有数据)。
3. **review 生成时机**:当前 rateOrder 只写 order.rating,改造时要兼容历史订单(已评过的订单不补 review 记录,只对新评价生效)。
4. **income_records 重复风险**:改造时必须删除前端 store 里的 recordIncome 调用,否则同一订单记两条。
5. **assignedOrders 维护**:派单 +1、接单/拒单/超时 -1,必须与状态流转严格同步,否则派单防堆积失效。
6. **good_rate 计算窗口**:每天凌晨算一次,白天新评价不实时更新。MVP 可接受(派单用昨晚的 good_rate)。

---

## 12. 实施顺序建议

**第一阶段:P0 核心(Server 端补齐)**
1. scheduler.js 定时任务框架 + 7 个 cron
2. orders 表加字段(paymentMethodLocked, arrivedAt, quotedAt, dispatchAttempts, beforeManualStatus, manualReason)
3. arriveCheckin / lockPaymentMethod 元动作
4. payOnline / confirmCash 拆分 + 五层防护
5. server transition 到 S40 自动 INSERT income_records + 生成 review 记录(评价时)
6. order_operation_logs 自动记录

**第二阶段:P0 核心(前端适配)**
1. C 端:支付方式选择 UI + 锁定后隔离
2. B 端:到场打卡 + 拒单接通 + 提现入口
3. 桌面端:强制取消 UI + S90 人工处理池 + 取消扣费计算
4. 桌面端:禁用 staff 时处理进行中订单弹窗

**第三阶段:P0 配置与报表**
1. system_configs 配置页
2. 财务报表 3 张
3. good_rate 定时计算
4. 结算 T+7 + 提现校验

**第四阶段:P1(可选)**
- 消息通知、师傅位置展示等
