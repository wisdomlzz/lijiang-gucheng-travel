# 全局业务架构设计 — 丽江古城游 V3

> 基于功能清单0628v0.1，从原始需求角度梳理业务关联，补全跨域业务逻辑。
> 数据层已完成 `shared/mock/` → `shared/services/` 重构（铲了重做），本设计在其上构建业务联动。

## 一、架构底座：「账户 + 流水 + 规则」三件套

借鉴有赞/微盟会员积分 + 支付宝/银行流水记账的成熟模式。所有跨域流转的共享实体统一采用此范式：

```
规则 Rule[]     ← PC 端可配置，「场景编码 → 策略」映射，核心不认具体来源
账户 Account    ← 当前状态（余额/累计），O(1) 读取
流水 Ledger[]   ← append-only 不可变审计日志，记每笔变动来龙去脉
```

**唯一入口函数**：所有来源都走 `transact()`，核心逻辑封闭，扩展只加调用方。

### 范式统一表

| 实体 | 账户(状态) | 流水(日志) | 规则(配置) |
|------|-----------|-----------|-----------|
| 积分 🆕 | PointAccount | PointLedger | PointRule |
| 诚信分 ✅ | TrustScore | ScoreHistory | TRUST_SCORE_CONFIG → 提升为规则表 |
| 通知 ✅ | — | Notifications | — |

### 扩展性原则（封闭修改、开放扩展）

- 新增积分来源（如商城接入）= 加一条规则 + 一处调用，核心零改动
- 来源用**字符串编码**（`"mall_purchase"`）而非枚举，前向兼容
- 不用事件总线（已铲除）——显式调用看得见摸得着，不引入隐式耦合
- 预留口子但 Demo 不实现：积分冻结/过期/等级（YAGNI）

---

## 二、角色旅程（4 端）

| 角色 | 核心旅程 |
|------|---------|
| 游客 | 游览(地图/VR/院落) → 院落打卡攒积分 → 便民服务下单 → 投诉/随手拍 → 积分兑换 |
| 商户 | 入驻审核 → 我的店铺 → 信息变更审核 → 一键服务(垃圾清运/布草/送水) → 纳西人打卡攒积分 → 公房租贷 |
| 服务人员 | 接单 → 报价 → 服务 → 完工 → 评价(影响诚信分) → 收入/提现 |
| 平台管理员 | 派单管理 → 价格仲裁 → 结算管理 → 内容管理 → 点位管理 → 人流量预警 → 积分规则配置 |

---

## 三、五条待补全业务链

### ① 便民服务结算闭环（缺结算管理）

```
C端下单 → PC派单 → B端接单 → 报价 → 支付 → 服务 → 完工 → 评价
                                                          ↓
                              结算管理 🆕: 收入统计 / 提现 / 评价管理
                                          ↑
                          评价 → 诚信分(+流水) → 影响派单优先级
```

**新建**：`settlement` service（收入按服务人员维度统计，现金/线上分开；提现申请+审核；评价列表+差评处理）

### ② 积分串联链（缺积分中心，3 来源未串联）

```
院落打卡 ──┐
纳西人打卡 ─┼→ transact() → 积分账户 🆕 → 积分中心 🆕 → 兑换(外链CRMEB)
志愿服务 ──┘                   ↑
商城消费(未来) ────────────────┘  ← 接入时零改动核心
```

**新建**：`points` service（Account+Ledger+Rule 三件套）；`naxi-checkin` service
**串联**：checkin 成功后调 `transact(uid, "courtyard_checkin")`；volunteer 签退后调 `transact(uid, "volunteer_service")`；naxi 连续打卡调 `transact(uid, "naxi_streak")`
**C端页面**：PointsCenterPage、NaxiCheckInPage
**PC页面**：PointRulesPage（规则增删改）

### ③ 商家入驻闭环（缺我的店铺 + 信息审核）

```
入驻申请 → PC审核 → 商家账号 → 我的店铺 🆕 → 信息变更 → PC商家审核 🆕 → 生效
```

**新建**：`merchant-review` service（商户提交的店铺变更+审核状态）
**C端页面**：MyShopPage（店铺信息编辑+审核状态+营业状态切换）
**PC页面**：MerchantReviewPage

### ④ 院落预约闭环（缺全链）

```
院落详情 → 选时段 → 预约(生成预约码) → 到店核销 → 我的预约 🆕
```

**新建**：`booking` service（预约时段/预约码/核销状态）
**C端页面**：CourtyardBookingPage、MyBookingsPage

### ⑤ 人流量预警链（缺全链）

```
PC预警规则配置 🆕 → 实时监测 → 触发预警(绿/黄/橙/红) → C端地图色块 → 疏导
```

**新建**：`flow-warning` service（预警事件/规则/区域色块数据）
**PC页面**：FlowWarningPage（事件列表+规则配置）
**C端**：MapPage 叠加预警色块

---

## 四、系统管理移除

- 删除 `系统管理` 整个 nav 分组（账号管理 + 角色管理）
- 删除 AccountPage.tsx(264行) + RolePage.tsx(345行)
- 删除 App.tsx 中 users / role-management 路由
- 权限逻辑硬编码在 `shared/permissions/index.ts`，不受影响（2 角色：role_admin 通配 / role_supplier 有限权限）

---

## 五、联动规则总表（事件驱动跨域更新）

| 触发事件 | 联动动作 |
|---------|---------|
| 院落打卡成功 | `points.transact(uid, "courtyard_checkin", +5)` |
| 纳西人连续7天 | `points.transact(uid, "naxi_streak", +50)` |
| 志愿签退 | `points.transact(uid, "volunteer_service", +hours×2)` |
| 订单评价 | `trustScore.addRatingBonus(staffId, rating)` + `trustScore.addSupplierRating(supId, rating)` |
| 投诉成立 | `trustScore.addComplaintDeduction(staffId, level)` |
| 订单完成 | 生成结算记录（settlement 自动汇总） |
| 预约核销 | 通知推送 |
| 人流超阈值 | 触发预警 + C端地图色块更新 |

所有联动均为**显式调用**（在动作成功后明确调用对应 service 的入口函数），非事件总线。

---

## 六、实施范围

**数据层（services）**：points / settlement / booking / flow-warning / merchant-review / naxi-checkin
**C端页面**：PointsCenterPage / NaxiCheckInPage / CourtyardBookingPage / MyBookingsPage / MyShopPage
**PC页面**：PointRulesPage / SettlementPage / MerchantReviewPage / FlowWarningPage
**删除**：系统管理模块整体
**串联**：5 条业务链的跨域联动按上表实现

Demo 原则：够演示就行，规则可配但不做冻结/过期/等级。
