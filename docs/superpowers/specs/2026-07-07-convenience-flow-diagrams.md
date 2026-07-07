# 便民服务业务逻辑图

> **配套文档**: `docs/superpowers/specs/2026-07-07-convenience-refinement-design.md`
> **形式**: Mermaid 流程图,3 张子图
> **图例**: ✅=闭环 / ⚠️=半闭环 / ❌=断裂 / 💭=架构建议

---

## 图 1:下单主线(C 端下单 → 完成)

覆盖环节 #1-10(下单 / 派单 / 接单 / 报价 / 审核 / 支付 / 服务 / 完成 / 评价 / 回复)

```mermaid
flowchart TD
    Start([游客/商户打开服务页]) --> Order[ServicesPage 下单<br/>选类型+地址+备注]

    subgraph C端[C 端 用户]
        Order
        Pay[ServiceTrackingPage 支付]
        Confirm[确认完成]
        Rate[评价弹窗]
    end

    subgraph 系统[系统/派单引擎]
        Order -->|createOrder| S10[(S10 已下单)]
        S10 -->|前端 setTimeout 500ms<br/>⚠️ 无 server 触发| AutoDispatch[autoDispatchOrder]
        AutoDispatch -->|pickStaff Haversine+zone| A20[(A20 已指派)]
        S10 -.->|⚠️ 前端没触发则卡死| S10
    end

    subgraph B端[B 端 staff]
        A20 -->|acceptOrder| A30[(A30 已接单)]
        A20 -.->|暂不接单按钮<br/>❌ 没真调 reject| RejectUI[UI 文字 仅]
        RejectUI -.->|应该回 A10| A10[(A10 重新派单)]

        A30 -->|submitQuote| A35[(A35 已核价)]
        A30 -.->|拒单应回 A10| A10

        A40 -->|startService| S48[(S48 服务中)]
        S48 -->|completeService<br/>+上传照片| S55[(S55 完工待确认)]
    end

    subgraph 桌面端[桌面端 管理员]
        A35 -->|所有 A35 都进队列<br/>⚠️ 触发条件不清| PriceReview[报价审核 tab]
        PriceReview -->|approveQuote| A40[(A40 已收款)]
        PriceReview -->|rejectQuote| A30
        PriceReview -.->|应该只审异常报价<br/>超参考价 20%| A40

        ForceCancel[强制取消按钮<br/>❌ 缺 UI]
    end

    A35 --> Pay
    Pay -->|⚠️ 现金/线上不分线<br/>staff 收款路径打架| A40
    Pay -.->|markPaid| A40

    S55 -->|confirm| S40[(S40 已完成)]
    S55 -.->|30s 自动 autoConfirm<br/>⚠️ 前端定时器| S40

    S40 --> Rate
    Rate -->|rateOrder<br/>⚠️ 只写 order.rating<br/>❌ 不生成 review 记录| RateEnd[评价完成]
    RateEnd -.->|应该 INSERT reviews 表<br/>带 content/images| ReviewTable[(reviews 表)]

    ReviewTable --> ReviewMgmt[桌面端评价管理]
    ReviewMgmt -->|replyReview<br/>⚠️ staff 自己无回复入口| ReviewReply[回复评价]

    ForceCancel -.->|A20-A40 状态可用<br/>server 支持但没 UI| S50[(S50 已取消)]

    style S10 fill:#dbeafe
    style A20 fill:#dbeafe
    style A30 fill:#dbeafe
    style A35 fill:#fef3c7
    style A40 fill:#dbeafe
    style S48 fill:#dbeafe
    style S55 fill:#fef3c7
    style S40 fill:#d1fae5
    style S50 fill:#fee2e2
    style A10 fill:#fef3c7
```

**图 1 关键问题(对照 spec §4):**

| 状态/动作 | 问题 | spec 章节 |
|-----------|------|-----------|
| S10 → A20 | ⚠️ 仅前端 setTimeout 触发,server 无定时任务 | P1.5 |
| A20 → A10(拒单) | ❌ B 端 UI 没真接 reject | P1.1 |
| A35 审核 | ⚠️ 所有报价都进审核,触发条件不清 | P1.3 |
| A35 → A40(支付) | ⚠️ 现金/线上路径打架 | P2.2 |
| S55 → S40 | ⚠️ autoConfirm 靠前端定时器 | P2.4 |
| S40 + rate | ❌ 不生成 review 记录 | P0.1 |
| 回复评价 | ⚠️ staff 自己无入口 | (P1 范围外,补充) |

---

## 图 2:异常处理(取消 + 超时 + 派单失败)

覆盖环节 #13-17(用户取消 / 平台审批 / 强制取消 / 派单失败 / 支付超时)

```mermaid
flowchart TD
    subgraph C端[C 端 用户]
        CancelBtn[订单详情/跟踪页<br/>申请取消按钮]
    end

    subgraph 状态机
        AnyState[任意状态 A20+]
        S10State[(S10 / A10)]
        A20Plus[(A20 及以后)]
    end

    CancelBtn -->|requestCancel| Check{当前状态}

    Check -->|S10 / A10| DirectCancel[直接取消]
    DirectCancel -->|transition cancel| S50[(S50 已取消)]

    Check -->|A20+| SetFlag[设 cancelRequested=1<br/>状态不变]
    SetFlag --> WaitApprove[等待管理员审批]

    subgraph 桌面端[桌面端]
        WaitApprove --> CancelTab[取消审批 tab]
        CancelTab -->|approveCancel| S50
        CancelTab -->|rejectCancel<br/>清 cancelRequested| Resume[恢复服务]
    end

    subgraph 异常[异常兜底]
        ForceCancelBtn[强制取消<br/>❌ 缺 UI]
        ForceCancelBtn -.->|A20-A40 任意| S50
        ForceCancelBtn -.->|应写入 arbitrationRemark| S50

        PayTimeout[支付超时]
        PayTimeout -->|前端定时器 15s<br/>⚠️ 刷新即丢<br/>应改 server cron| S90[(S90 待人工)]

        DispatchFail[派单失败]
        DispatchFail -->|⚠️ 触发条件未定义<br/>应:attempts>=3| S90

        S90 -->|reDispatch 人工重派| A10[(A10)]
        S90 -->|forceCancel| S50
    end

    subgraph B端[B 端 staff]
        StaffReject[staff 拒单<br/>❌ UI 没接 action]
        StaffReject -.->|应回 A10| A10
    end

    style S50 fill:#fee2e2
    style S90 fill:#fef3c7
    style A10 fill:#dbeafe
```

**图 2 关键问题:**

| 环节 | 问题 | spec 章节 |
|------|------|-----------|
| 强制取消 | ❌ server 支持但桌面端无 UI | P1.2 |
| 支付超时 | ⚠️ 前端定时器,不可靠 | P1.6 |
| 派单失败 | ⚠️ 触发条件未定义(attempts 字段缺失) | P1.5 |
| staff 拒单 | ❌ UI 没接 reject action | P1.1 |
| requestCancel 元动作 | ✅ 已实现 | — |

---

## 图 3:结算 + 诚信分 + 联动(完成后的副作用链)

覆盖环节 #18-22(收入记录 / 提现审批 / 差评扣分 / 好评加分 / 观察期)

```mermaid
flowchart LR
    S40[(S40 订单完成)]

    subgraph 当前[当前实现 联动放前端]
        S40 -->|前端 confirmComplete 回调| FE_recordIncome[recordIncome<br/>⚠️ 在前端 store]
        FE_recordIncome -->|POST /incomes| IncomeTable[(income_records 表)]

        S40 -->|前端回调| FE_points[transact mall_purchase<br/>⚠️ 在前端 store]
        FE_points -->|POST /points/transact| PointsTable[(points_accounts 表)]

        S40 -->|前端 rateOrder| FE_rate[只写 order.rating<br/>❌ 不触发诚信分]
        FE_rate -.->|应该调 applyReviewImpact| TrustScore[(trust_scores 表)]
    end

    subgraph 目标[取优后 联动放 server]
        S40_target[(S40 订单完成)] -->|server transition 端点自动| SRV_income[INSERT income_records<br/>✅ 服务端记账]
        S40_target -->|server transition 端点自动| SRV_review[INSERT reviews<br/>✅ 同步生成评价]
        S40_target -->|server transition 端点自动| SRV_points[POST points/transact<br/>✅ 服务端加积分]

        SRV_review -->|差评 rating<=2| SRV_deduct[trust_scores -5<br/>✅ 自动扣分]
        SRV_review -->|好评 rating=5| SRV_add[trust_scores +1<br/>✅ 自动加分]
        SRV_review -->|好评 rating=4| SRV_add05[trust_scores +0.5]

        ComplaintResolve[投诉 resolve] -->|server 自动| SRV_complaintDeduct[trust_scores -3]
        SRV_deduct --> CheckThreshold{分数 < 阈值?}
        SRV_complaintDeduct --> CheckThreshold
        CheckThreshold -->|是| Observation[status=观察期<br/>✅ 已实现]
        CheckThreshold -->|否| Normal[status=正常]
    end

    subgraph 结算[结算链路]
        IncomeTable --> StaffIncome[staff 累计收入]
        StaffIncome --> WithdrawUI[申请提现<br/>❌ B 端缺入口]
        WithdrawUI -->|requestWithdrawal| WithdrawTable[(withdrawal_requests 表)]
        WithdrawTable --> SettlementPage[桌面端结算管理]
        SettlementPage -->|approveWithdrawal| Approved[提现通过]
        SettlementPage -->|rejectWithdrawal| Rejected[提现驳回]
    end

    subgraph 配置[配置层]
        ScoreRules[(score_rules 表)] -.->|读取规则分值| SRV_deduct
        ScoreRules -.->|读取规则分值| SRV_add
        ScoreRules -.->|读取规则分值| SRV_complaintDeduct
        TrustThreshold[(trust_thresholds 表)] -.->|读取阈值| CheckThreshold
    end

    style S40 fill:#d1fae5
    style S40_target fill:#d1fae5
    style IncomeTable fill:#dbeafe
    style PointsTable fill:#dbeafe
    style TrustScore fill:#fef3c7
    style WithdrawTable fill:#dbeafe
    style Observation fill:#fee2e2
```

**图 3 关键问题:**

| 环节 | 问题 | spec 章节 |
|------|------|-----------|
| 收入记录 | ⚠️ 在前端 store,server 不调则不记 | P0.3 |
| 评价 → 诚信分 | ❌ 完全不触发 | P0.2 |
| 投诉 → 诚信分 | ❌ 完全不触发 | P0.2 |
| 提现申请 | ❌ B 端 staff 无入口 | P1.4 |
| 观察期 | ✅ 前端已自动算 | — |
| 配置源 | ✅ score_rules/trust_thresholds 已有 | — |

---

## 三张图汇总

**核心断层点(图上标 ❌ 的):**
1. 评价不生成 review 记录(图 1)
2. B 端拒单 UI 没接 action(图 1、图 2)
3. 桌面端无强制取消 UI(图 2)
4. 联动逻辑全在前端,server 不触发则不执行(图 3)
5. 诚信分完全不自动触发(图 3)
6. B 端 staff 无提现入口(图 3)

**半闭环(图上标 ⚠️ 的):**
- 自动派单靠前端 setTimeout
- 支付超时靠前端定时器
- 报价审核触发条件不清
- 支付路径现金/线上打架
- autoConfirm 靠前端定时器

**已经闭环的(图上标 ✅ 的):**
- 下单、接单、报价、服务、完成的主线
- requestCancel 元动作
- 投诉创建+处理
- 观察期自动判定
- 桌面端提现审批
- 片区/站点 CRUD

---

## 配套阅读

读完图后,可以对照 spec 的:
- §2 25 项闭环评审表(详细每项评级)
- §4 P0/P1/P2 优化清单(对应图中问题)
- §6 验收标准(每个修复后怎么测)
