# 古城资讯 — 功能需求规格

> **话题标签:** `008-info`
> **上次更新:** 2026-07-05

## 业务定位

古城资讯是内容发布模块，包含两个子功能：
1. **古城新闻**（News）— 景区相关的新闻/活动资讯
2. **便民信息**（Info）— 公告信息发布/浏览（用户可发布）

**本质：** 景区内容发布平台。

## 数据模型

```typescript
interface InfoItem {
  id: string
  title: string
  body: string
  images: string[]
  type: "公告" | "新闻" | "通知" | string
  publishTime: string
  author: string
  status: "published" | "draft"
}

interface NewsItem {
  id: string
  title: string
  content: string
  cover: string
  publishTime: string
  source: string
  viewCount: number
}
```

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | InfoPage | `/c/info` | 便民信息列表 |
| C | InfoDetailPage | `/c/info/:id` | 信息详情 |
| C | NewsPage | `/c/news` | 古城新闻列表 |
| C | MyPostsPage | `/c/my-posts` | 我的发布（用户自行发布的便民信息） |

## 依赖关系

- no direct dependencies（独立的静态内容 store）

## 约束

1. 当前数据写在代码内（硬编码），无后端 API
2. 无富文本编辑器（纯文本 + 图片）
3. News 和 Info 的数据源分离
