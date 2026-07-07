# 个人中心（Profile）— 产品需求文档

## 产品定位与边界

个人中心是用户在平台内的"我的"聚合页面，涵盖 **C 端（游客版）** 和 **B 端（服务人员版）** 两个形态。

| 端 | 页面组件 | 路由 | 所属 Feature |
|---|---|---|---|
| C | ProfilePage | `/c/profile` | `features/profile/` |
| B | ServiceProfile | `/b/service/profile` | `features/convenience/` |

**产品定位：**
- C 端：用户身份展示 + 积分/订单/志愿服务等数据概览 + 各功能模块的路由聚合入口
- B 端：服务人员工作台数据面板，含诚信分、收入统计、结算提现、个人资料管理

**边界：**
- 个人中心**不包含**独立的 create/update/delete 操作（头像编辑、昵称修改、实名认证等**未实现**）
- C 端头像和昵称为固定 Mock 数据（昵称："纳西小旅人"，ID："LJ88392156"）
- C 端扫码按钮和头像编辑按钮均为仅 UI 占位，无实际功能
- B 端余额展示目前为硬编码 `staffBalance = 0`（MVP 简化，需 API 对接）
- 用户身份数据来自 `useAuthStore`（持久化 localStorage，key `lijiang-demo-auth`），非独立 store

---

## 核心用户角色

| 角色 | 可访问端 | 说明 |
|---|---|---|
| 游客（tourist） | C | 纯游客，查看个人身份、积分、收藏、订单等 |
| 叠加角色（tourist + supplier） | C / B / Desktop | 可进 C 端个人中心看到"我的店铺"菜单项 |
| 便民服务人员（service） | B | 可进 B 端服务人员个人中心，查看诚信分、收入、申请提现 |
| 平台管理员（platform_admin） | B / Desktop | 无需 B 端个人中心，直接在桌面端管理后台操作 |

---

## 核心业务流程

### C 端个人中心

```
用户进入"我的" Tab
 ├─> 顶部展示头像、昵称、ID（Mock 数据）
 ├─> 积分卡片：从 usePointsStore 读取余额，点击进入积分中心 (/c/points)
 ├─> 志愿统计：如用户已认证志愿者（useVolunteerStore.getByUserId() status === "approved"）
 │   则显示累计服务时长（totalHours）和参与活动场次（activityCount）
 ├─> 三快捷入口：我的收藏 (/c/favorites)、我的发布 (/c/my-posts)、随手拍 (/c/photo-records)
 ├─> 便民服务订单入口：从 useConvenienceStore.orders 过滤非终态订单，显示进行中数量
 ├─> 功能菜单列表（7 项）：
 │   ├─ 积分中心 → /c/points
 │   ├─ 我的预约 → /c/my-bookings
 │   ├─ 纳西人打卡 → /c/naxi-checkin
 │   ├─ 我的店铺 → /c/my-shop（仅当用户有 "supplier" 角色时显示）
 │   ├─ 收货地址 → /c/addresses
 │   ├─ 消息通知 → /c/notifications
 │   └─ 我的投诉 → /c/my-complaints
 ├─> 供应商入驻入口 → /c/supplier-entry
 └─> 退出登录 → 清空 auth store 并跳转 /c
```

### B 端服务人员个人中心

```
用户进入"我的" Tab（BLayout 底部导航）
 ├─> 顶部展示姓名首字母头像 + 姓名 + 服务类型 + 片区（数据来自 auth store + staff item）
 ├─> 诚信评分卡片（useTrustScoreStore.getScore(staffId)）：
 │   ├─ 数值 + 状态标签（正常/观察期/失信）
 │   ├─ 进度条 + 失信线 60 提示
 │   └─ 若 trustScore < 60：显示红色失信警告条
 ├─> 三统计卡片：本月收入（convOrders 计算）、平均评分、完单率
 ├─> 可提现余额卡片（当前 staffBalance = 0 占位）+ 申请提现按钮
 │   └─ 提现弹窗：输入金额 → 调用 settlement-store.requestWithdrawal()
 ├─> 菜单组 1：诚信评分详情、收入明细（→/b/service/history）、服务片区
 ├─> 菜单组 2：个人资料、资质证件、帮助中心、入驻申请（→/b/service/register）
 └─> 退出登录 → 确认弹窗 → 清空 auth store
```

---

## 功能模块清单

### C 端（`src/features/profile/c-end/pages/ProfilePage.tsx`）

| 优先级 | 模块 | 功能点 | 代码现状 |
|---|---|---|---|
| P0 | 用户身份展示 | 头像、昵称、ID 展示（Mock） | 已实现（固定资源 userAvatar.png） |
| P0 | 积分余额 | 从 points store 读取并展示 | 已实现 |
| P0 | 功能菜单列表 | 7 个菜单项图标 + 跳转 | 已实现，商户角色额外显示"我的店铺" |
| P1 | 积分入口卡片 | 渐变卡片，点击进入积分中心 | 已实现 |
| P1 | 便民订单入口 | 显示进行中订单数（非 S40/S50 订单数） | 已实现 |
| P1 | 退出登录 | 清除 auth store + 跳转首页 | 已实现 |
| P2 | 志愿统计 | 已认证志愿者显示累计时长和活动数 | 已实现，从 volunteer store 实时计算 |
| P2 | 三快捷入口 | 收藏/发布/随手拍 按钮 + 图标 | 已实现 |
| P2 | 供应商入驻 | 渐变卡片引导入口 | 已实现 |
| P2 | 扫码按钮 | 顶部扫码图标 | 按钮 UI 存在 ❌ 无扫码逻辑 |
| P2 | 头像编辑 | 头像右下角编辑按钮 | 按钮 UI 存在 ❌ 无编辑功能 |

### B 端（`src/features/convenience/b-end/pages/ServiceProfile.tsx`）

| 优先级 | 模块 | 功能点 | 代码现状 |
|---|---|---|---|
| P0 | 用户身份 | 姓名首字母头像 + 姓名 + 角色 + 片区 | 已实现，数据来自 auth store + staff store |
| P0 | 诚信评分 | 评分卡片（分值、进度条、状态、失信预警） | 已实现，从 trust-score store 实时读取 |
| P0 | 退出登录 | 确认弹窗后清除 auth store | 已实现（ConfirmModal） |
| P1 | 收入统计 | 本月收入 + 平均评分 + 完单率 | 已实现，从 convOrders 实时计算 |
| P1 | 提现入口 | 余额展示 + 申请提现弹窗 | 已实现（余额 0 占位） |
| P1 | 功能菜单 | 诚信详情/收入明细/服务片区/个人资料/资质/帮助/入驻 | 已实现，部分为占位路由 |
| P2 | 提现校验 | 余额不足校验 + 连载校验 | 已实现（settlement-store） |
| P2 | 资质证件 | 显示"健康证已上传" | 文字占位 ❌ 无实际资质数据 |
| P2 | 帮助中心 | 页面跳转 | ❌ 未绑定点按事件 |
| P2 | 个人资料编辑 | 页面跳转 | ❌ 未绑定点按事件 |

---

## 核心数据模型

### C 端依赖的 Store 数据流

ProfilePage 自身无独立数据模型。所有数据跨 store 读取：

```
ProfilePage
 ├─ useAuthStore        → user.id, user.roles, user.name, logout()
 ├─ usePointsStore      → accounts[userId].balance
 ├─ useConvenienceStore → orders[] → filter by userId + non-terminal status
 └─ useVolunteerStore   → getByUserId(userId), signUps[], dailyRecords[]
                          → compute totalHours + activityCount
```

**Mock 用户常量：**
- 昵称：`"纳西小旅人"`（硬编码）
- ID：`"LJ88392156"`（硬编码）
- 头像：`@/c-end/assets/ad6ed0a0-af1e-4e61-a615-ab7234c09411.png`（固定图片资源）

### B 端依赖的 Store 数据流

ServiceProfile 也从多个 store 聚合数据：

```
ServiceProfile
 ├─ useAuthStore         → user.id, staffId, user.name, logout()
 ├─ useTrustScoreStore   → getScore(staffId) → TrustScore { trustScore, status, ... }
 ├─ useConvenienceStore  → orders[] → filter by staffId → compute monthRevenue/avgRating/completionRate
 └─ useSettlementStore   → requestWithdrawal(staffId, name, amount)
```

### 后端数据表（server 端）

Profile 页面本身不直接调用后端 API，但依赖以下后端表为用户种子数据：

**users 表：**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | TEXT PK | 用户 ID |
| name | TEXT | 用户姓名 |
| phone | TEXT UNIQUE | 手机号（登录凭证） |
| avatar | TEXT | 头像 URL |
| roles | TEXT(JSON) | `["tourist"]` 等角色数组 |
| platform | TEXT(JSON) | `["c"]` 等平台数组 |
| staffType | TEXT | 服务类型（B 端服务人员专用） |
| staffId | TEXT | 关联 staff 表 ID |
| supplierId | TEXT | 关联商户 ID |
| roleTag | TEXT | 角色标签（"古城客栈"/"便民服务人员"） |

**种子用户（`seed-users.ts`）：**
| 姓名 | 手机号 | 角色 | 平台 | 用途 |
|---|---|---|---|---|
| 张小游 | 13800001001 | tourist | C | 纯游客访问 C 端个人中心 |
| 张老板 | 13800001002 | tourist+supplier | C/B/Desktop | C端可见"我的店铺"菜单 |
| 李师傅 | 13900002004 | service | B | B 端登录可见 ServiceProfile |
| 管理员 | 18800003001 | platform_admin | B/Desktop | 桌面端管理员 |

---

## 验收标准

### C 端（ProfilePage @ `/c/profile`）

| 编号 | 验收项 | 状态 |
|---|---|---|
| P-C01 | 用户头像、固定昵称（纳西小旅人）、固定 ID（LJ88392156）正常展示 | ✅ |
| P-C02 | 积分卡片展示当前用户积分余额（来自 points store） | ✅ |
| P-C03 | 积分卡片点击跳转 `/c/points` | ✅ |
| P-C04 | 已认证志愿者展示志愿服务统计：累计时长 + 参与场次 | ✅ |
| P-C05 | 三个快捷入口（收藏/发布/随手拍）点击正确跳转 | ✅ |
| P-C06 | 便民服务订单入口显示非终态订单数量（排除 S40/S50） | ✅ |
| P-C07 | 7 个菜单项可正确跳转，其中"我的店铺"仅对 `supplier` 角色可见 | ✅ |
| P-C08 | 供应商入驻入口展示并跳转 `/c/supplier-entry` | ✅ |
| P-C09 | 退出登录清除 auth store 并跳转 `/c` | ✅ |
| P-C10 | 头像编辑按钮 UI 存在 | ❌（仅按钮 UI，无编辑功能） |
| P-C11 | 扫码按钮 UI 存在 | ❌（仅按钮 UI，无扫码功能） |

### B 端（ServiceProfile @ `/b/service/profile`）

| 编号 | 验收项 | 状态 |
|---|---|---|
| P-B01 | 用户姓名首字母头像 + 姓名 + 服务类型 + 片区展示 | ✅ |
| P-B02 | 诚信评分卡片展示分值/进度条/状态标签 | ✅ |
| P-B03 | trustScore < 60 时显示红色失信警告条 | ✅ |
| P-B04 | 三个统计卡片数据正确（本月收入/平均评分/完单率） | ✅ |
| P-B05 | 可提现余额展示（当前 0 占位） | ✅（MVP 简化） |
| P-B06 | 提现弹窗输入金额后调用 settlement-store 校验并提交 | ✅ |
| P-B07 | 余额不足时弹窗提示"可提现余额不足" | ✅ |
| P-B08 | 菜单组各条目正确跳转（收入明细→/b/service/history, 入驻→/b/service/register） | ✅ |
| P-B09 | 退出登录弹确认弹窗，确认后清除 auth store | ✅ |
| P-B10 | 个人资料/资质证件/帮助中心页面功能 | ❌（菜单项存在，无实际页面） |
| P-B11 | 桌面端个人中心 | ❌（暂无 Desktop profile 页面） |