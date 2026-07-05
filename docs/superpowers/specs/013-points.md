# 积分系统 — 功能需求规格

> **话题标签:** `013-points`
> **上次更新:** 2026-07-05

## 业务定位

积分是平台通用奖励系统。用户通过签到、志愿服务、商城消费等行为获取积分，可在积分商城兑换（Demo 中为模拟兑换）。

## 积分规则

| 代码 | 场景 | 积分 | 日上限 |
|---|---|---|---|
| `courtyard_checkin` | 院落打卡 | 5 | 10 |
| `naxi_streak` | 纳西连续打卡 | 50 | 1 |
| `volunteer_service` | 志愿服务 | 2 | 100 |
| `mall_purchase` | 订单完成 | 1 | 无 |
| `mall_redeem` | 积分兑换（消耗） | 1 | 无 |

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | PointsCenterPage | `/c/points` | 积分余额 + 历史流水 + 兑换 |
| Desktop | PointRulesPage | `/desktop/point-rules` | 积分规则配置 |

## 依赖关系

- checkin（院落打卡→积分）
- convenience（订单完成→积分）
- volunteer（志愿服务→积分）

## 约束

1. 兑换为模拟（无真实发货）
2. 积分规则改桌面端后 C 端次日生效（纯 Demo 场景）

## 本 Demo 的范围

- ✅ **C 端**: PointsCenterPage（积分余额 + 规则说明 + 兑换入口）
- ✅ **桌面端**: PointRulesPage（积分规则管理，受 ProtectedRoute 保护）
- ✅ **Store**: points-store（积分交易记录 + 规则配置）
- ⚠️ **兑换模拟**: 无真实发货，纯前端标记
- ⚠️ **规则延迟**: 桌面端规则更改后 C 端次日生效（模拟）
