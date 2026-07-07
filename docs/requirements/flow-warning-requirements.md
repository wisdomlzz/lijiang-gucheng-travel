# 人流量预警模块 产品设计文档

> **文档版本**：v1.0
> **更新日期**：2026-07-07
> **产品定位**：Demo 阶段 · 实时人流量监控看板（桌面端管理后台）
> **配套文档**：`docs/superpowers/specs/017-flow-warning.md`（功能规格）
> **实际代码入口**：`src/features/flow-warning/store/flow-warning-store.ts`、`src/features/convenience/desktop/pages/FlowWarningPage.tsx`（生效页面）

---

## 一、产品定位与边界

### 1.1 我们在做什么

我们做的是 **古城人流量预警的 Demo 版本**——不是接入真实数据源的生产级系统，而是基于本地模拟数据的桌面端展示看板，用于演示人流监控、预警触达和阈值规则配置的产品概念。

**核心目标：**

- ✅ 展示古城 6 个核心区域的人流量实时状态（模拟）
- ✅ 按饱和度/阈值自动判定预警等级（绿/黄/橙/红）
- ✅ 支持手动刷新模拟人流数据，观察等级变化
- ✅ 预警事件生成与解除操作
- ✅ 各区域预警阈值规则配置

### 1.2 Demo 原则：数据模拟，概念验证

| 优先级 | 原则 | 说明 |
|--------|------|------|
| 🔴 必须 | **页面流转闭环** | 实时监测 -> 预警事件 -> 规则配置，三个 Tab 可切换 |
| 🔴 必须 | **视觉反馈清晰** | 四种预警颜色/标签/Badge，游客一秒看清状态 |
| 🟡 可以简化 | **数据纯模拟** | 人流量由客户端随机波动生成，非真实数据源 |
| 🟡 可以简化 | **无 C 端/B 端入口** | 仅桌面端后台展示，PC 后台管理员使用 |
| 🟢 以后做 | 接入真实数据源 | 景区闸机/票务/WiFi探针等数据 |
| 🟢 以后做 | 地图热力图 | 在 GIS 地图上叠加色块 |

### 1.3 明确不做的（当前边界）

以下功能 **v1.0 不做**，避免范围蔓延：

- ❌ 接入真实数据源（闸机/票务/摄像头客流统计）
- ❌ 实时推送/WebSocket（当前为手动刷新）
- ❌ C端/B端移动端入口（仅桌面端）
- ❌ 地图热力图/区域色块
- ❌ 历史趋势图表/数据分析
- ❌ 自动预警通知/短信/消息推送
- ❌ 分流建议的算法推荐
- ❌ 多维度统计分析（如按小时/天/周趋势）
- ❌ 后端数据持久化（前端当前未对接 `/api/v1/flow-warnings` 接口）

---

## 二、核心用户角色

### 2.1 唯一角色

| 角色 | 端 | 核心诉求 |
|------|-----|----------|
| **平台管理员（platform_admin）** | 桌面端后台 | 查看古城各区域人流密集度，及时发现拥堵风险 |

**约束：** 该页面受 `ProtectedRoute` 保护，仅 `platform_admin`（平台管理员）角色可访问，在 `DesktopLayout` 中通过 `isSuperAdmin` 判断授权。普通商户（supplier）角色无法进入。

### 2.2 功能入口

| 入口 | 端 | 路径 |
|------|-----|------|
| 桌面端导航 - 运营管理 > 人流量预警 | Desktop | `/desktop/flow-warning` |
| Server API - `/api/v1/flow-warnings` | 后端 | 通用 CRUD（当前前端未对接） |

---

## 三、核心业务流程

### 3.1 页面浏览流程

```
管理员登录桌面端
    ↓
从侧边导航进入「人流量预警」
    ↓
实时监测 Tab（默认展示）
    ├─ 顶部 4 个汇总指标卡：监测区域数 / 红色预警数 / 橙色拥挤数 / 活跃事件数
    └─ 区域列表：区域名、当前人流、承载量、负载率（进度条）、等级 Badge
    ↓
点击「刷新人流」按钮
    ↓
各区域 current 值随机波动（±15% capacity）
    ↓
自动检查超阈值区域 → 生成预警事件（已存在活跃事件的不重复创建）
    ↓
切换至「预警事件」Tab
    ├─ 事件列表：区域、等级、人流/承载、触发时间、疏导措施、状态
    └─ 操作：「解除」按钮 → 状态变更为"已解除"
    ↓
切换至「规则配置」Tab
    ├─ 各区域阈值展示：偏多(%)、拥挤(%)、预警(%)
    ├─ 编辑：点击按钮切换为 Input 编辑模式，修改阈值
    └─ 启用/禁用开关
```

### 3.2 预警等级判定逻辑

```
输入：当前人流(current) / 最大承载(capacity)
    ↓
计算饱和度 = current / capacity * 100%
    ↓
根据规则阈值判定：
    ├─ 有规则(且 enabled)：按 yellowThreshold / orangeThreshold / redThreshold 对比
    └─ 无规则(或 disabled)：按内置默认值 60% / 80% / 95% 对比
    ↓
输出：green / yellow / orange / red
```

**等级阈值默认值：**

| 等级 | 饱和度范围 | 标签 | 色值 |
|------|-----------|------|------|
| green | < 60% | 通畅 | emerald |
| yellow | 60% - 80% | 偏多 | amber |
| orange | 80% - 95% | 拥挤 | orange |
| red | >= 95% | 预警 | red |

### 3.3 预警事件生命周期

```
管理员点击「刷新人流」
    ↓
simulateFlow() → 各区域 current 随机波动
    ↓
triggerWarning() 遍历所有区域：
    ├─ 等级 = green → 跳过（不触发预警）
    ├─ 该区域已有 status=active 事件 → 跳过（避免重复）
    └─ 非 green 且无活跃事件 → 创建 WarningEvent（status=active）

初次生成 auto-action 策略：
    ├─ level = red   → "建议启动应急预案，单向通行"
    ├─ level = orange → "建议游客分流"
    └─ level = yellow → "持续监测"
    ↓
管理员在「预警事件」Tab 查看
    ↓
管理员点击「解除」→ resolveEvent(id) → status = resolved
    ↓
事件保留在列表中，状态变为"已解除"，可追溯
```

---

## 四、功能模块清单

### 4.1 P0 必须有（Demo 缺一不可）

| 模块 | 功能点 | 说明 | 实现状态 |
|------|--------|------|---------|
| 桌面端 - 实时监测面板 | 4 个汇总指标卡 | 监测区域数 / 红色预警数 / 橙色拥挤数 / 活跃事件数 | ✅ |
| 桌面端 - 实时监测面板 | 区域明细列表 | 6 个区域含名称、人流、承载、负载进度条、等级 Badge | ✅ |
| 桌面端 - 模拟刷新 | 随机波动人流量 | 点击按钮各区域 current 随机波动 ±15% capacity | ✅ |
| 桌面端 - 预警事件 | 事件列表 | 显示等级、人流/承载、触发时间、疏导措施、状态 | ✅ |
| 桌面端 - 预警事件 | 事件解除 | 点击解除按钮，事件状态变更为 resolved | ✅ |
| 桌面端 - 规则配置 | 阈值展示 | 各区域黄/橙/红阈值百分比展示 | ✅ |
| 桌面端 - 规则配置 | 阈值编辑 | 行内 Input 编辑模式，可修改任意阈值 | ✅ |
| 桌面端 - 规则配置 | 启用/禁用 | Switch 开关控制规则生效与否 | ✅ |
| 桌面端 - 权限 | ProtectedRoute 守卫 | 仅 platform_admin 可访问 | ✅ |
| 桌面端 - 导航 | 侧边栏入口 | "运营管理"分组下，permissionCode: "content" | ✅ |

### 4.2 P1 建议有（提升体验）

| 功能点 | 说明 | 实现状态 |
|--------|------|---------|
| 后端 API 数据对接 | 前端接入 `/api/v1/flow-warnings` 而非本地 store 模拟 | ❌ |
| 历史预警趋势图表 | ECharts 等趋势线图表展示 | ❌ |
| 批量解除预警 | 支持多选事件批量解除 | ❌ |
| 预警措施智能推荐 | 根据等级和区域自动推荐更精准的疏导方案 | ❌ |

### 4.3 P2 以后做（远期规划）

| 功能点 | 说明 | 实现状态 |
|--------|------|---------|
| 真实客流数据源 | 对接闸机/票务/摄像头/WiFi探针 | ❌ |
| GIS 地图热力图 | 在古城地图上叠加区域色块 | ❌ |
| 自动预警通知推送 | 短信/消息推送至工作人员 | ❌ |
| C 端入口 | 游客查看区域拥挤度 | ❌ |
| B 端入口 | 工作人员实时接收预警 | ❌ |
| 历史数据分析报表 | 按日/周/月的趋势分析 | ❌ |

---

## 五、核心数据模型

### 5.1 前端 Store 数据结构（Zustand）

#### WarningArea（监控区域）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 区域唯一标识 |
| name | string | 区域展示名称 |
| capacity | number | 最大承载量（人） |
| current | number | 当前人流数 |
| level | WarningLevel | 当前预警等级（由 current/capacity 自动计算） |
| lng | number | 经度（预留地图使用） |
| lat | number | 纬度（预留地图使用） |

**种子数据（6 个区域）：**

| 区域 | 承载量 | 初始人流 | 初始等级 |
|------|--------|---------|---------|
| 四方街 | 3,000 | 1,850 | yellow（偏多） |
| 玉河广场 | 2,000 | 1,650 | orange（拥挤） |
| 木府 | 1,500 | 420 | green（通畅） |
| 古城南门 | 2,500 | 2,380 | red（预警） |
| 古城北门 | 2,500 | 1,200 | yellow（偏多） |
| 狮子山 | 1,000 | 280 | green（通畅） |

#### WarningRule（预警规则）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 规则唯一标识 |
| areaId | string | 关联区域 ID |
| areaName | string | 区域名称（冗余） |
| yellowThreshold | number | 偏多阈值百分比（默认 60） |
| orangeThreshold | number | 拥挤阈值百分比（默认 80） |
| redThreshold | number | 预警阈值百分比（默认 95） |
| enabled | boolean | 是否启用（默认 true） |

#### WarningEvent（预警事件）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 事件唯一标识 |
| areaName | string | 区域名称 |
| level | WarningLevel | 触发时的预警等级 |
| current | number | 触发时的人流数 |
| capacity | number | 触发时的承载量 |
| triggeredAt | string | 触发时间 |
| status | "active" \| "resolved" | 事件状态 |
| action | string (optional) | 疏导措施描述 |

**种子数据（3 条）：**

| 事件 | 区域 | 等级 | 当前/承载 | 时间 | 状态 | 措施 |
|------|------|------|-----------|------|------|------|
| we1 | 古城南门 | red（预警） | 2380/2500 | 2026-06-29 14:20 | active | 已启动单向通行疏导，增派 3 名引导员 |
| we2 | 玉河广场 | orange（拥挤） | 1650/2000 | 2026-06-29 13:45 | active | 建议游客分流至木府方向 |
| we3 | 四方街 | yellow（偏多） | 1850/3000 | 2026-06-28 16:00 | resolved | 人流已回落 |

### 5.2 后端数据库表（Server SQLite）

位于 `server/db/schema.sql`，约 636 行定义。

#### flow_warnings

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (PK) | 记录 ID |
| area | TEXT NOT NULL | 区域名称 |
| level | TEXT DEFAULT 'normal' | 等级 |
| currentCount | INTEGER DEFAULT 0 | 当前人流 |
| threshold | INTEGER DEFAULT 1000 | 阈值 |
| createdAt | TEXT | 创建时间 |
| updatedAt | TEXT | 更新时间 |

**备注：** 后端 `flow_warnings` 表已创建，通过 `server/routes/flow-warnings.js` 路由挂载于 `/api/v1/flow-warnings`，暴露通用 CRUD（GET/POST/PATCH/DELETE）。前端 **当前没有消费该接口** —— 所有数据来自 Zustand store 的本地内存种子数据，刷新页面重置。

---

## 六、验收标准

### 6.1 功能验收项

| 编号 | 验收项 | 状态 |
|------|--------|------|
| FW-01 | 桌面端导航侧边栏显示「人流量预警」菜单项，点击可进入页面 | ✅ |
| FW-02 | 页面顶部展示 4 个汇总统计指标卡：监测区域数、红色预警数、橙色拥挤数、活跃事件数 | ✅ |
| FW-03 | "实时监测" Tab 展示 6 个区域的人流数据表格（名称、人流、承载、负载率进度条、等级 Badge） | ✅ |
| FW-04 | 四种预警等级颜色正确：绿(通畅) / 黄(偏多) / 橙(拥挤) / 红(预警) | ✅ |
| FW-05 | 点击「刷新人流」按钮，各区域人流随机波动（±15% capacity） | ✅ |
| FW-06 | 人流波动后饱和度超阈值的区域自动生成预警事件 | ✅ |
| FW-07 | 同一区域已存在 status=active 的事件不会重复生成 | ✅ |
| FW-08 | "预警事件" Tab 展示事件列表（区域、等级、人流/承载、触发时间、疏导措施、状态） | ✅ |
| FW-09 | 活跃事件可点击「解除」标记为已解除（resolved） | ✅ |
| FW-10 | "规则配置" Tab 展示各区域三级阈值百分比（偏多/拥挤/预警） | ✅ |
| FW-11 | 规则阈值可编辑（行内 Input 编辑模式） | ✅ |
| FW-12 | 规则启用/禁用 Switch 开关生效（disabled 时恢复默认阈值 60/80/95） | ✅ |
| FW-13 | 页面受 ProtectedRoute 保护，非 platform_admin 无法访问 | ✅ |
| FW-14 | 页面懒加载正常（React.lazy 加载） | ✅ |
| FW-15 | 页面标题/描述展示正确 | ✅ |

### 6.2 未实现功能（❌）

| 编号 | 功能项 | 说明 |
|------|--------|------|
| FW-20 | ❌ C 端地图色块联动 | 页面描述中提到"联动 C 端地图色块"，但 C 端无实际消费 |
| FW-21 | ❌ 后端数据持久化 | 前端未对接 `/api/v1/flow-warnings`，刷新即重置 |
| FW-22 | ❌ 真实数据源接入 | 当前为前端模拟数据 |
| FW-23 | ❌ 自动定时刷新 | 需手动点击按钮，无定时器轮询 |
| FW-24 | ❌ WebSocket 实时推送 | 无实时推送机制 |
| FW-25 | ❌ 历史趋势图表 | 无 ECharts 等图表展示 |
| FW-26 | ❌ GIS 地图热力图 | 无地图叠加展示 |
| FW-27 | ❌ 预警推送通知 | 无短信/消息推送 |
| FW-28 | ❌ B 端工作人员接收预警 | B 端无入口 |

### 6.3 已知代码问题

| 编号 | 问题 | 说明 |
|------|------|------|
| FW-30 | ⚠️ App.tsx import 路径可能指向错误版本 | `src/desktop/App.tsx` 第 54 行 import 路径为 `../features/convenience/desktop/pages/FlowWarningPage`，该文件功能较简（无规则配置、无阈值编辑、无事件解除操作）。另有一份完整实现位于 `src/desktop/pages/gates/FlowWarningPage.tsx` 未被引用。两版本功能差距较大，建议确认并统一。 |

---

## 七、文件清单与代码结构

```
src/features/flow-warning/            ← Feature 垂直切片
├── store/
│   ├── index.ts                      ← barrel 导出
│   └── flow-warning-store.ts         ← Zustand 状态管理（种子数据 + 业务逻辑）

src/features/convenience/desktop/pages/
├── FlowWarningPage.tsx               ← 功能较简的桌面端页面（当前生效版本）

src/desktop/pages/gates/
├── FlowWarningPage.tsx               ← 功能完整的桌面端页面（含规则配置、事件解除，未引用）

src/desktop/
├── App.tsx                           ← 路由注册（/desktop/flow-warning → lazy import）
├── nav.ts                            ← 侧边导航菜单配置

server/
├── routes/flow-warnings.js           ← CRUD 路由（/api/v1/flow-warnings）
├── db/schema.sql                     ← flow_warnings 表定义
├── index.js                          ← 路由挂载
```
