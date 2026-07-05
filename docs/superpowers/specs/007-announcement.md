# 公告通知 — 功能需求规格

> **话题标签:** `007-announcement`
> **上次更新:** 2026-07-05

## 业务定位

平台管理员在桌面端发布公告（古城游览安全提醒、水系清淤通知、节假日攻略等），C 端用户在"公告通知"页面查看。公告发布时推送到通知中心。

**本质：** 运营→用户的广播消息系统。

## 数据模型

```typescript
interface Announcement {
  id: string
  title: string
  content: string
  images: string[]
  type: "公告"
  publishTime: string
  status: "draft" | "published" | "unpublished"
  createdAt: string
  updatedAt: string
}
```

## 业务流程

```
桌面端 → 草稿 → 发布 → published → C 端可见
                        → 通知中心推送广播
桌面端 → 下架 → unpublished → C 端不可见
```

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | AnnouncementPage | `/c/notice` | 公告列表（搜索 + 分页） |
| C | AnnouncementDetailPage | `/c/announcement/:id` | 公告详情 |
| Desktop | AnnouncementManagePage | `/desktop/announcements` | 公告创建/发布/下架/删除 |

## 通知闭环（已实现）

- 公告发布 → 推送 `system` 类型通知到所有用户通知中心

## 依赖关系

- notification（发布时推送通知）
- info（古城资讯和公告在概念上不同，但共享通知渠道）

## 约束

1. 公告只区分 "发布 / 草稿 / 下架" 三态，无定时发布
2. 公告的权限：所有 C 端游客可见，无需登录

## 差距分析

- 计算公告内容字数（C 端用 slice）做预览截断，规范应限制标题和正文字数
- 无"公告分类"（全部是 type: "公告"），未来可扩展应急通知/活动通知等

## 本 Demo 的范围

- ✅ **C 端**: AnnouncementPage（公告列表）、AnnouncementDetailPage（公告详情）
- ✅ **桌面端**: AnnouncementManagePage（发布/草稿/下架管理）
- ✅ **Store**: announcement-store（公告 CRUD + 状态管理）
- ✅ **通知闭环**: 公告发布 → 推送 system 类型通知到全部用户
- ⚠️ **无定时发布**: 仅 "草稿/发布/下架" 三态
- ⚠️ **无分类**: 全部 type 为 "公告"，无子类型
- ⚠️ **无字数规范**: C 端用 slice 截断预览，无后端限制
