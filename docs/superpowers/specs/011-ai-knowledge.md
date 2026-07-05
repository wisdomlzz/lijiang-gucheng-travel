# AI 知识库 — 功能需求规格

> **话题标签:** `011-ai-knowledge`
> **上次更新:** 2026-07-05

## 业务定位

AI 知识库提供古城相关的知识问答交互。用户可以在 C 端与 AI 助手对话，询问景点、路线、餐饮推荐等信息。桌面端可管理知识库条目。

**本质：** AI 客服/导览，Demo 中使用模拟回答。

## 数据模型

```typescript
interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface KnowledgeEntry {
  id: string
  question: string
  answer: string
  tags: string[]
  enabled: boolean
}
```

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | AIChatPage | `/c/ai` | AI 聊天对话框 |
| Desktop | AIKnowledgeBasePage | `/desktop/ai-knowledge` | 知识库管理（待确认是否在 nav 中注册） |

## 依赖关系

- 无（独立运行，模拟回答）

## 约束

1. 无真实 LLM 接入，用关键词匹配 + 预设回答模拟
2. 知识库条目在 seed 数据中预置，无上传功能
3. 无流式输出、无 Markdown 渲染（纯文本）
