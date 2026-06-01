# 功能完备闭环计划（修订版）

> **Goal:** 前后台功能闭环梳理与实现

---

## 一、闭环全景

| 功能 | Demo | Admin | 结论 |
|------|------|-------|------|
| 遗产知识 | ✅ | ❌ | 外部系统对接 |
| 公房服务 | ✅ | ❌ | 外部系统对接 |
| 志愿服务 | ⏸ | ⏸ | 暂缓，当前 demo 保留宫格占位页，需求待澄明 |
| 停车服务 | ✅ | ✅ | 完整 |
| 随手拍 | ✅ 基础 | ❌ | **需新增后台** |
| 文化院落 | ✅ 基础 | ✅ | **缺打卡** |
| 购在古城 | ✅ | ✅ | 完整 |
| 商家入驻 | ✅ | ✅ | C端提交/查询，Desktop 审核，通过后为商城后台 SSO 做准备 |
| 商家发布 | ✅ | ✅ | `/c/my-merchant-posts` 展示已发布/审核中/已驳回入驻记录 |
| 我的收藏 | ✅ | - | 完整 |

---

## 二、待实现任务

### Task 1: 文化院落打卡功能

**Demo 新增页面：**
- `CourtyardCheckinPage` (`/c/courtyard/:id/checkin`) - 打卡页（位置验证+照片+提交）
- `MyCheckinsPage` (`/c/my-checkins`) - 我的打卡

**数据模型：**
```typescript
interface Checkin {
  id: string;
  courtyardId: string;
  courtyardName: string;
  userId: string;
  userName: string;
  photo: string;
  location: { lat: number; lng: number };
  address: string;
  createdAt: string;
  status: 'pending' | 'approved';
}
```

**Store:** `useCheckinStore` - 临时存本地，模拟打卡流程

**Routes:**
```tsx
{ path: "courtyard/:id/checkin", element: <CourtyardCheckinPage /> },
{ path: "my-checkins", element: <MyCheckinsPage /> },
```

**CulturalCourtyardsPage 改造：** 卡片增加"打卡"按钮

---

### Task 2: 随手拍管理（后台）

**Admin 新增页面：**
- `desktop/pages/photo-records/list.tsx` - 打卡记录列表
- `desktop/pages/photo-records/show.tsx` - 打卡详情

**功能：**
- 列表展示所有打卡记录（用户/院落/时间/地点）
- 状态筛选（待审核/已通过/已驳回）
- 详情查看照片+位置
- 通过/驳回操作

**desktop/nav.ts 更新：**
```typescript
{ key: "photo-records", label: "打卡记录", icon: Camera, permissionCode: "content" },
```

---

## 三、验证清单

- [ ] 文化院落 - 打卡入口可见 → 打卡页 → 提交成功 → 我的打卡可见
- [ ] 打卡记录管理 - 后台可查看所有打卡记录 → 通过/驳回
