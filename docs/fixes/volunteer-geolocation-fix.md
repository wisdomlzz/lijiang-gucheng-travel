# 志愿服务：签到签退位置校验缺口

## 发现时间

2026-07-08

## 问题描述

志愿服务的签到（checkIn）和签退（checkOut）功能**完全没有位置限制**。志愿者无论在不在活动地点，都可以远程签到/签退，导致：

1. 志愿者可以"假装"参加活动，实际并未到场
2. 无法校验志愿者是否在活动规定范围内服务
3. 签退时也无法确认是否在服务地点

## 当前实现

### 数据库

```sql
-- volunteer_activities 仅有 text 类型 location 字段
location TEXT DEFAULT ''
-- 无 lat/lng 列

-- volunteer_daily_records 无任何位置相关字段
```

### 前端校验

`daily-record-store.ts` 的 `checkIn()` 和 `checkOut()` 函数仅校验：
- 状态是否合法（`pending` → 签到、`checked_in` → 签退）
- 时间是否在窗口内（开始前 30 分钟到活动结束）

**没有任何 `navigator.geolocation` 调用**。

### 需求文档

`docs/notes/志愿服务流程与校验规则.md` 第 68 行明确列出了**定位校验**规则，但没有实现。

### 桌面端 LocationMapField

管理员创建活动时使用的 `LocationMapField` 组件可以选地图位置并获取 lat/lng，但**这些坐标没有保存到数据库**——仅保存了文本地址。

## 修复方案

### 1. 数据库迁移

```sql
ALTER TABLE volunteer_activities ADD COLUMN lat REAL;
ALTER TABLE volunteer_activities ADD COLUMN lng REAL;
ALTER TABLE volunteer_activities ADD COLUMN geoRadius INTEGER DEFAULT 500; -- 半径(米)
ALTER TABLE volunteer_daily_records ADD COLUMN checkInLat REAL;
ALTER TABLE volunteer_daily_records ADD COLUMN checkInLng REAL;
ALTER TABLE volunteer_daily_records ADD COLUMN checkOutLat REAL;
ALTER TABLE volunteer_daily_records ADD COLUMN checkOutLng REAL;
```

同时更新 `schema.sql` 的 CREATE TABLE 语句。

### 2. 类型更新

在 `src/shared/types/index.ts` 中 `VolunteerActivity` 和 `VolunteerDailyRecord` 类型增加位置字段。

### 3. 桌面端活动创建

修改 `CreateActivityDialog.tsx` 中的 `LocationMapField` 使用方式，将选择的 lat/lng 提交到 API。

### 4. 前端签到位置校验

在 `daily-record-store.ts` 的 `checkIn()` / `checkOut()` 中增加：

```typescript
// 签到前获取当前位置
const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, {
    enableHighAccuracy: true,
    timeout: 10000,
  })
})

// 计算距活动地点的距离
const distance = haversine(
  pos.coords.latitude, pos.coords.lng,
  activity.lat, activity.lng
)

// 超出半径则拒绝
if (distance > (activity.geoRadius || 500)) {
  throw new Error(`您不在活动地点范围内（当前距活动地点约 ${Math.round(distance)} 米）`)
}
```

### 5. 位置权限处理

- 首次签到前请求权限时，如果用户拒绝，显示引导弹窗
- 如果浏览器不支持 Geolocation API，允许签到但记录日志

### 6. 种子数据更新

需要为现有的 11 个志愿活动设置 `lat` / `lng` 坐标（古城范围内）。

## 工作量估算

| 改动 | 文件 | 估算 |
|------|------|------|
| schema + seed | `schema.sql`, `seed.js` | ~20 行 |
| 类型 | `shared/types/index.ts` | ~10 行 |
| store checkIn/checkOut | `daily-record-store.ts` | ~40 行 |
| 桌面端坐标持久化 | `CreateActivityDialog.tsx`, `LocationMapField.tsx` | ~15 行 |
| 前端权限弹窗 | `VolunteerActivityDetailPage.tsx` | ~20 行 |
| Haversine 工具函数 | `shared/utils/geo.ts`（已有） | 复用 |
| **总计** | | **~105 行** |