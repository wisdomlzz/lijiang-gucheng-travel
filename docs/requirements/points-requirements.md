# 积分系统 — 产品需求文档

> **文档版本**：v1.0
> **更新日期**：2026-07-07
> **产品定位**：平台通用奖励系统，用户通过签到、志愿服务、商城消费等行为获取积分，可在积分商城兑换（Demo 中为模拟兑换）
> **配套文档**：[013-points.md](../superpowers/specs/013-points.md)、API 设计文档（待补充）

---

## 一、产品定位与边界

### 1.1 我们在做什么

积分系统是丽江古城游平台的通用奖励体系，本质是一套**账户 + 流水 + 规则**三件套架构。借鉴有赞/微盟会员积分 + 支付宝/银行流水记账模式。

**核心目标：**

- 为平台提供统一的积分激励手段
- 支撑「院落打卡签到→积分」「志愿服务→积分」「消费→积分」等跨 feature 的积分流转
- 支持积分规则的灵活配置（新增来源只加规则代码 + 调用方，不改核心 `transact()` 方法）
- 在 C 端展示积分余额、来源汇总和历史流水

### 1.2 积分来源与消耗

| 场景编码 | 场景名称 | 基础积分 | 日上限 | 方向 | 触发条件 |
|---------|---------|---------|-------|------|---------|
| `courtyard_checkin` | 院落打卡 | 5 | 10 次 | IN | 用户完成院落文化打卡 |
| `naxi_streak` | 纳西人连续打卡 | 50 | 1 次 | IN | 连续每日打卡达 7 天倍数 |
| `volunteer_service` | 志愿服务 | 2 | 100 次 | IN | 志愿者签退时按次发放 |
| `mall_purchase` | 商城消费 | 1 | 无 | IN | 便民服务订单完成后发放 |
| `mall_redeem` | 积分兑换 | 1 | 无 | OUT | 用户在积分商城兑换商品（模拟） |

### 1.3 MVP 边界（明确不做）

- ❌ 积分过期策略（当前账户流水永久保留）
- ❌ 积分抵扣现金（兑换为外部跳转 CRMEB，无真实发货）
- ❌ 积分排行榜或 PK 机制
- ❌ 每日上限防刷校验（服务端未实现，`dailyLimit` 仅存储，未强制拦截）
- ❌ 积分规则修改后 C 端缓存延迟生效（纯 Demo 场景，刷新即生效）
- ❌ 积分消息通知（完成积分操作时无独立推送）
- ❌ 积分兑换的物流/订单系统

---

## 二、核心用户角色

| 角色 | 端 | 核心诉求 |
|------|----|---------|
| **C 端游客** | C 端小程序 | 查看积分余额、了解积分来源、跳转兑换商城 |
| **平台管理员** | 桌面端后台 | 配置积分规则（新增 / 编辑 / 删除 / 启停用）、查看规则列表 |

---

## 三、核心业务流程

### 3.1 积分赚取流程

```
用户触发行为（打卡/服务/消费）
       │
       ▼
各 Feature Store 调 usePointsStore.transact(userId, sourceCode, refId)
       │
       ▼
store 调 POST /api/v1/points/transact
       │
       ▼
服务端校验：
  1. 规则是否存在且启用
  2. 余额是否充足（OUT 方向）
  3. 更新 points_accounts（balance / totalEarned / totalUsed）
  4. 写入 points_ledgers 不可变流水
       │
       ▼
store 同步回本地 state
    → 重新请求 account 端点拉取最新账户含流水
       │
       ▼
C 端 PointsCenterPage 实时展示更新
```

### 3.2 积分兑换流程

```
用户在 PointsCenterPage 点击「积分兑换」
       │
       ▼
浏览器打开 CRMEB_ADMIN_URL 新标签页
（纯外链跳转，当前版本无真实发货闭环）
```

### 3.3 积分规则管理流程（桌面端）

```
平台管理员进入 /desktop/point-rules
       │
       ▼
查看规则列表（表格：编码 / 名称 / 方向 / 分值 / 上限 / 启用状态）
       │
       ▼
新增 / 编辑 / 删除规则
    → 调后端 CRUD API
    → store 同步（syncAction 模式）
       │
       ▼
C 端下次请求规则时同步更新
```

---

## 四、功能模块清单

### P0 — 核心闭环（必须）

| 模块 | 端 | 功能 | 状态 | 说明 |
|------|----|------|------|------|
| 积分交易引擎 | Server | `POST /points/transact` 接受任意 `sourceCode` 按规则增扣分 | ✅ | 单一入口，规则不存在或余额不足返回失败 |
| 积分账户 | Server | 自动创建/更新 `points_accounts` | ✅ | userId 维度，记录 balance / totalEarned / totalUsed |
| 积分流水 | Server | 每笔交易写入 `points_ledgers` 不可变日志 | ✅ | 含 delta / sourceLabel 快照 / balanceAfter |
| 积分规则 CRUD | Server + Desktop | 桌面端规则新增/编辑/删除/启停用 | ✅ | `ProtectedRoute` 仅 superadmin |

### P1 — C 端查看 + 跨功能集成

| 模块 | 端 | 功能 | 状态 | 说明 |
|------|----|------|------|------|
| 积分中心页 | C 端 | 余额卡片（余额 + 累计获取 + 已使用） | ✅ | 路由 `/c/points`，渐变蓝色背景顶部卡片 |
| 积分来源汇总 | C 端 | 按来源 label 分组统计赚取积分 | ✅ | 网格卡片布局 |
| 积分明细流水 | C 端 | 逆序展示每笔 transaction | ✅ | 标识方向（IN/OUT），显示来源名称 + 时间 + 关联单号 |
| 模拟商城消费 | C 端 | 调 `mall_purchase` 来源 +10 积分 | ✅ | Demo 专用按钮，无真实订单 |
| 积分兑换入口 | C 端 | 跳转 CRMEB 商城链接 | ✅ | 新标签页打开 |
| 院落打卡联动 | C 端 | 打卡成功自动调 `courtyard_checkin` | ✅ | checkin-store 中 inline 调用 |
| 纳西连续打卡联动 | C 端 | 连续 7 天达标自动调 `naxi_streak` | ✅ | naxi-store 中 7 天倍数判断后调用 |
| 志愿服务联动 | C 端 | 签退时自动调 `volunteer_service` | ✅ | volunteer-store checkout 中调用 |
| 订单完成联动 | C 端 | 商城订单完成后自动调 `mall_purchase` | ✅ | convenience-store confirm 中调用 |

### P2 — 增强体验（可等待）

| 模块 | 端 | 功能 | 状态 | 说明 |
|------|----|------|------|------|
| 每日上限校验 | Server | 检查 `dailyLimit` 防刷 | ❌ | `dailyLimit` 字段已存在 DB 和规则模型，但服务端 transact 未实现校验逻辑 |
| 积分操作 Toast | C 端 | 操作成功/失败提示 | ✅ | 使用 sonner toast |
| 积分规则编码唯一性 | Server | code 作为主键，写入冲突报错 | ✅ | points_rules 表 code 为 PRIMARY KEY |

---

## 五、核心数据模型

### 5.1 PointRule（积分规则）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | TEXT PK | 是 | 场景编码，字母数字下划线，如 `mall_purchase` |
| `label` | TEXT | 是 | 展示名称，如「商城消费」 |
| `points` | REAL | 是 | 基础分值 |
| `dailyLimit` | INTEGER | 否 | 每日上限，null 表示不限制 |
| `direction` | TEXT | 是 | `IN` 赚取 / `OUT` 消耗 |
| `enabled` | INTEGER | 是 | 1 启用 / 0 停用 |
| `createdAt` | TEXT | 自动 | 创建时间 |
| `updatedAt` | TEXT | 自动 | 更新时间 |

### 5.2 PointAccount（积分账户）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | TEXT PK | 是 | 用户 ID |
| `balance` | REAL | 是 | 当前余额 |
| `totalEarned` | REAL | 是 | 累计获取积分 |
| `totalUsed` | REAL | 是 | 累计消耗积分 |
| `updatedAt` | TEXT | 自动 | 最后更新时间 |

### 5.3 PointLedger（积分流水）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | TEXT PK | 是 | 流水号，格式 `pl_{timestamp}_{random}` |
| `userId` | TEXT | 是 | 用户 ID |
| `direction` | TEXT | 是 | `IN` 赚取 / `OUT` 消耗 |
| `delta` | REAL | 是 | 变动绝对值（正数） |
| `sourceCode` | TEXT | 是 | 对应 PointRule.code |
| `sourceLabel` | TEXT | 是 | 展示名快照（规则改名不影响历史） |
| `refId` | TEXT | 否 | 关联单据 ID（打卡记录 / 订单号等） |
| `balanceAfter` | REAL | 是 | 变动后余额快照 |
| `createdAt` | TEXT | 自动 | 变动时间 |

### 5.4 实体关系

```
points_rules (code 主键)
    ↓ 由 sourceCode 引用
points_ledgers (id 主键)
    ↓ 按 userId 关联
points_accounts (userId 主键)
```

---

## 六、验收标准

### 6.1 功能验收

| # | 用例 | 预期结果 | 状态 |
|---|------|---------|------|
| 1 | C 端游客进入 `/c/points` | 看到积分余额卡片（含余额 / 累计获取 / 已使用）、积分来源汇总、积分明细流水 | ✅ |
| 2 | 点击「模拟商城消费」按钮 | 调 transact(`mall_purchase`) +10 积分，余额增加，流水新增一条 IN 记录 | ✅ |
| 3 | 点击「积分兑换」按钮 | 浏览器新标签页打开 CRMEB 商城管理后台 | ✅ |
| 4 | 积分余额为 0 时执行消耗交易 | 服务端返回「积分余额不足」，余额不变 | ✅ |
| 5 | 使用不存在的 `sourceCode` 调 transact | 服务端返回「积分规则 ${code} 不存在或已停用」 | ✅ |
| 6 | 管理员在桌面端 `/desktop/point-rules` | 查看规则列表表格，含 5 条种子规则 | ✅ |
| 7 | 管理员新增积分规则 | 表单验证（编码和名称必填），保存后列表刷新 | ✅ |
| 8 | 管理员编辑积分规则 | 编码不可修改，编码唯一性由主键保证 | ✅ |
| 9 | 管理员删除积分规则 | 规则从列表中移除 | ✅ |
| 10 | 管理员切换规则启用开关 | 立即生效，下次 transact 校验时使用新状态 | ✅ |
| 11 | 非 superadmin 角色访问 `/desktop/point-rules` | ProtectedRoute 拦截，不显示该页面 | ✅ |
| 12 | 院落打卡成功后积分入账 | 自动出现一条 `courtyard_checkin` IN 记录，+5 积分 | ✅ |
| 13 | 纳西连续打卡达 7 天倍数 | 自动出现一条 `naxi_streak` IN 记录，+50 积分 | ✅ |
| 14 | 志愿者签退 | 自动出现一条 `volunteer_service` IN 记录，+2 积分 | ✅ |
| 15 | 便民服务订单确认完成 | 自动出现一条 `mall_purchase` IN 记录，+1 积分 | ✅ |
| 16 | 每日上限校验 | 种子数据含 `dailyLimit` 字段，但服务端未强制拦截 | ❌ |
| 17 | 积分兑换消耗积分 | 种子含 `mall_redeem` OUT 规则，但无前端调用方 | ❌ |

### 6.2 数据验收

| # | 检查项 | 状态 |
|---|-------|------|
| 1 | 种子数据含 5 条积分规则（`courtyard_checkin` / `naxi_streak` / `volunteer_service` / `mall_purchase` / `mall_redeem`） | ✅ |
| 2 | 种子数据含 2 个积分账户（`u_c_001` 余额 320 / `u_b_001` 余额 150） | ✅ |
| 3 | `points_rules` 表含 `dailyLimit` 列 | ✅ |
| 4 | `points_ledgers` 含 `balanceAfter` 历史快照 | ✅ |
| 5 | `points_ledgers` 含 `sourceLabel` 展示名快照（规则改名不影响历史） | ✅ |

### 6.3 非功能验收

| # | 检查项 | 状态 |
|---|-------|------|
| 1 | 积分交易使用 `syncAction` 模式：先发请求，失败后自动重试 | ✅ |
| 2 | store.transact 为唯一入口，新增来源无需修改核心逻辑 | ✅ |
| 3 | 流水为不可变日志（仅 INSERT，无 UPDATE / DELETE） | ✅ |
| 4 | 桌面端规则 CRUD 使用 `syncAction` 乐观同步 | ✅ |

---

## 七、依赖关系

### 7.1 内部依赖

| 依赖 Feature | 说明 |
|-------------|------|
| checkin（院落打卡）| `courtyard_checkin` 来源触发 |
| checkin（纳西打卡）| `naxi_streak` 来源触发（连续 7 天） |
| convenience（便民服务）| `mall_purchase` 来源在订单确认完成时触发 |
| volunteer（志愿服务）| `volunteer_service` 来源在志愿者签退时触发 |

### 7.2 外部依赖

| 依赖 | 说明 |
|------|------|
| CRMEB 商城 | 积分兑换跳转至 CRMEB 管理员后台 `https://admin.java.crmeb.net` |
| API 基础设施 | 依赖 `api.get` / `api.post` / `api.list` / `api.create` / `api.update` / `api.remove` 通用封装 |

---

## 八、项目文件索引

### 核心实现

- `src/features/points/store/points-store.ts` — Zustand store（账户 + 流水 + 规则三件套，`transact` 核心入口）
- `src/features/points/store/index.ts` — barrel export
- `src/features/points/c-end/pages/PointsCenterPage.tsx` — C 端积分中心页面（路由 `/c/points`）
- `src/desktop/pages/gates/PointRulesPage.tsx` — 桌面端积分规则 CRUD 页面（路由 `/desktop/point-rules`）

### 服务端

- `server/index.js` — `GET /api/v1/points/account/:userId`、`POST /api/v1/points/transact`、`/api/v1/points/rules` CRUD 挂载
- `server/db/schema.sql` — `points_accounts` / `points_ledgers` / `points_rules` 表定义
- `server/db/seed.js` — 5 条积分规则种子 + 2 个账户种子

### API 客户端

- `src/api/client.ts` — `pointsApi` 封装（account / transact / rules CRUD）
- `src/api/hydrate.ts` — 初始化时拉取 `points/rules` 灌入 store

### 跨 Feature 联动

- `src/features/checkin/store/checkin-store.ts` — 打卡成功 → `transact(userId, "courtyard_checkin", result.id)`
- `src/features/checkin/store/naxi-store.ts` — 连续 7 天达标 → `transact(userId, "naxi_streak", result.id)`
- `src/features/volunteer/store/store.ts` — 签退 → `transact(dr.volunteerId, "volunteer_service", dr.id)`
- `src/features/convenience/store/store.ts` — 订单确认 → `transact(o.userId, "mall_purchase", orderId)`

### 配置与路由

- `src/c-end/routes.tsx` — 懒加载 `PointsCenterPage`，路由 `/c/points`
- `src/desktop/App.tsx` — 懒加载 `PointRulesPage`，路由 `point-rules`（ProtectedRoute）
- `src/desktop/nav.ts` — 左侧导航「积分规则配置」条目（`permissionCode: "content"`）