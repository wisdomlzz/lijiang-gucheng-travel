# 人流量预警（Flow Warning）

## 产品定位与边界

人流量预警模块对丽江古城重点区域（四方街、玉河广场、木府等 6 个区域）进行人流密度监测与预警管理。C 端消费色块/数据（通过地图组件），桌面端提供规则配置、实时监测面板和预警事件管理。

边界：
- C 端通过地图组件消费数据（当前无独立 C 端页面）
- 桌面端有完整的管理页面（FlowWarningPage）
- 人流数据为前端随机模拟，无真实传感器/API

## 核心用户角色

| 角色 | 描述 |
|------|------|
| 平台管理员（platform_admin） | 桌面端管理预警规则、查看实时数据和事件 |
| 游客（tourist） | C 端消费展示（通过地图色块，非独立页面） |

## 核心业务流程

**桌面端管理流程**
1. 管理员进入人流量预警管理页
2. 概览栏展示监测区域数、红色/橙色/黄色预警数
3. "实时监测" Tab 查看各区域当前人流、承载量、预警等级
4. "预警规则" Tab 配置各区域的黄/橙/红阈值百分比
5. "预警事件" Tab 查看历史/活跃预警，支持标记已处理
6. "刷新数据"按钮触发随机人流模拟 + 自动触发预警

**C 端消费**
- 人流量数据通过 store 暴露给 C 端地图组件（未实现独立 C 端页面）

## 功能模块清单

| 优先级 | 模块 | 功能点 | 说明 |
|--------|------|--------|------|
| P0 | 桌面端实时监测 | 6 个区域人流数据表格，含容量/当前人数/等级 | 已实现 |
| P0 | 预警等级色标 | 绿/黄/橙/红四级，含阈值百分比 | 已实现 |
| P0 | 刷新模拟 | 随机波动模拟人流变化 | 已实现 |
| P1 | 预警规则配置 | 每个区域独立配置黄/橙/红阈值 | 已实现 |
| P1 | 预警事件管理 | 事件列表 + 标记已处理 | 已实现 |
| P1 | 概览统计 | 监测区域数/红色预警数/橙色预警数/正常数 | 已实现 |
| P2 | 自动预警触发 | 人流超阈值自动生成预警事件 | 已实现 |
| P2 | C 端地图联动 | 人流量数据供 C 端地图消费 | 数据层就绪，C 端页面未实现 ❌ |

## 核心数据模型

```typescript
type WarningLevel = "green" | "yellow" | "orange" | "red"

interface WarningArea {
  id: string
  name: string
  capacity: number      // 最大承载量
  current: number       // 当前人流
  level: WarningLevel   // 当前等级
  lng: number
  lat: number
}

interface WarningRule {
  id: string
  areaId: string
  areaName: string
  yellowThreshold: number  // 百分比
  orangeThreshold: number
  redThreshold: number
  enabled: boolean
}

interface WarningEvent {
  id: string
  areaName: string
  level: WarningLevel
  current: number
  capacity: number
  triggeredAt: string
  status: "active" | "resolved"
  action?: string  // 疏导措施
}
```

种子数据：6 个区域（四方街/玉河广场/木府/古城南门/古城北门/狮子山），对应规则 + 3 条预警事件。

## 验收标准

| 编号 | 验收项 | 状态 |
|------|--------|------|
| FW01 | 桌面端概览展示 4 项统计数据 | ✅ |
| FW02 | 实时监测 Tab 展示 6 个区域的人流数据表格 | ✅ |
| FW03 | 预警等级色标正确：绿/黄/橙/红 | ✅ |
| FW04 | 刷新按钮触发随机人流模拟 | ✅ |
| FW05 | 预警规则 Tab 展示各区域阈值配置 | ✅ |
| FW06 | 规则阈值可编辑保存 | ✅ |
| FW07 | 预警事件 Tab 展示历史/活跃事件 | ✅ |
| FW08 | 活跃事件可标记"已处理" | ✅ |
| FW09 | 自动触发：人流超阈值自动生成事件（防重复） | ✅ |
| FW10 | C 端独立页面展示人流量地图 | ❌ |
| FW11 | C 端地图色块联动 | ❌（数据层就绪，UI 未实现） |
| FW12 | 真实传感器/API 数据对接 | ❌ |
| FW13 | 自动刷新（非手动点击） | ❌ |