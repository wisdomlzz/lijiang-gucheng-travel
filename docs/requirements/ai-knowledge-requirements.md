# AI 知识库（AI 旅游助手）— 产品设计文档

> **文档版本**：v1.0
> **更新日期**：2026-07-07
> **产品定位**：为丽江古城游客提供智能问答交互的 AI 旅游助手 + 平台管理员知识库管理后台
> **配套文档**：功能规格说明书 `docs/superpowers/specs/011-ai-knowledge.md`

---

## 一、产品定位与边界

### 1.1 我们在做什么

我们做的是 **AI 知识库（AI 旅游助手）** —— 面向丽江古城游客的智能问答服务模块。游客可在 C 端小程序中与 AI 助手对话，获取古城景点、路线、美食、票务、活动、讲解等旅游信息，支持富媒体卡片交互。平台管理员可在桌面端后台管理知识条目（新增/编辑/删除/启用禁用/批量导入），保证问答内容持续更新。

**核心目标：**

- ✅ 为 C 端游客提供便捷的智能问答入口，降低信息获取成本
- ✅ 通过模拟问答交互验证 AI 助手在旅游场景中的用户接受度
- ✅ 为平台管理员提供知识库内容管理能力，实现问答内容的可持续维护

### 1.2 MVP 原则：什么必须做，什么可以等

|优先级|原则|说明|
|---|---|---|
|🔴 必须|**主流程必须闭环**|游客提问 → AI 回答（含富媒体卡片），每一步完整|
|🔴 必须|**数据模型必须完整**|知识条目表结构（question/answer/status）设计正确|
|🔴 必须|**管理后台可用**|桌面端支持知识条目增删改查、启用/禁用、批量导入|
|🟡 可以简化|AI 回答使用关键词+预设匹配|无真实 LLM，等 Demo 验证后再接入|
|🟡 可以简化|C 端回答不依赖知识库数据|当前为硬编码 Mock 数据，与桌面端管理的知识库数据独立|
|🟢 以后做|体验优化类功能|如流式输出、Markdown 渲染、语音输入|
|🟢 以后做|智能分析与推荐|如热门问题统计、个性化推荐|

### 1.3 明确不做的（MVP 边界）

- ❌ 真实 LLM / AI 大模型接入（使用关键词匹配 + 预设回答模拟）
- ❌ 流式输出（SSE / WebSocket 流式回答）
- ❌ Markdown 富文本渲染（纯文本，仅支持 `**加粗**` 简单解析）
- ❌ 语音输入 / 语音播报
- ❌ 多语言支持（仅中文）
- ❌ 对话历史持久化（刷新页面重置，仅前端内存）
- ❌ 用户反馈 / 点赞点踩机制
- ❌ 知识条目版本管理 / 变更历史
- ❌ 知识库自动分类 / 标签管理（category/tags 字段预留但无管理 UI）
- ❌ 知识库导出功能
- ❌ 知识库与外部系统同步

---

## 二、核心用户角色

### 2.1 两类角色

|角色|端|核心诉求|
|---|---|---|
|**C 端游客**|移动端小程序（C 端）|快速获取古城旅游信息，包括线路推荐、美食推荐、票务咨询、活动资讯、讲解预约等|
|**平台管理员**|桌面端管理后台|管理知识库条目，保障问答内容的准确性和时效性|

### 2.2 角色权限说明

|角色|身份|可访问功能|
|---|---|---|
|游客（`tourist`）|任何登录 C 端的用户|C 端 AI 聊天页面 `/c/ai`|
|游客 + 供应商（`tourist+supplier`）|张老板等叠加角色|C 端 AI 聊天页面 `/c/ai`|
|平台管理员（`platform_admin`）|管理员账号|桌面端 AI 知识库管理页面 `/desktop/ai-knowledge`，受 `ProtectedRoute` 保护（`isSuperAdmin`）|

> **注意：** 桌面端知识库管理页面仅 `platform_admin` 超管角色可访问，普通 `supplier` 角色无法访问。

### 2.3 访问入口

|角色|端|路由|组件|页面名称|
|---|---|---|---|---|
|C 端游客|C 端小程序|`/c/ai`|`AIChatPage`|AI 旅游助手|
|平台管理员|桌面端后台|`/desktop/ai-knowledge`|`AIKnowledgeBasePage`|知识库管理（`nav.ts` 中 `permissionCode: "content"`）|

---

## 三、核心业务流程

### 3.1 C 端 AI 问答流程

```
游客进入 AI 聊天页面
    ↓
显示欢迎语 + AI 头像 + 5 个快捷操作按钮（2×2 网格）
    ↓
游客点击快捷按钮 或 输入文字按 Enter / 发送按钮
    ↓
发送用户消息（蓝色渐变气泡），显示 AI 思考动画（1.2s-1.8s）
    ↓
关键词匹配（前端 getMockResponse 函数）
    ├─ "线路" / "路线" / "行程" → 3 条路线推荐卡片 (RouteCard)
    │                                点击 → 跳转 /c/routes/{id}
    ├─ "美食" / "吃" / "餐"     → 3 张美食商家卡片 (MerchantCard)
    │                                点击 → 跳转 /c/merchant/{id}
    ├─ "活动" / "演出" / "节庆"  → 活动资讯文本
    ├─ "票" / "门票" / "价格"   → 3 个票务产品卡片 (ProductCard)
    │                                点击 → 跳转外部商城 CRMEB
    ├─ "讲解" / "导游" / "预约"  → 2 个讲解服务卡片 (ProductCard)
    │                                点击 → 跳转外部商城 CRMEB
    ├─ "住" / "民宿" / "酒店"   → 住宿指南文本
    └─ 其他                      → 通用引导语（列出可咨询类型）
    ↓
AI 回答逐字显示（打字机效果，28ms/步，每次 2 字符）
    ↓
文本显示完毕后展示富媒体卡片（如有）
    ↓
对话继续，可多次提问
    ↓
点击右上角垃圾桶 → 确认弹窗 → 清空所有消息 → 回到欢迎态
```

### 3.2 桌面端知识库管理流程

```
管理员登录桌面端
    ↓
左侧导航「运营管理 → AI知识库管理」
    ↓
加载知识库列表（分页展示，每页 10 条）
    ↓
列表含：问题 | 答案(截断) | 状态(Switch) | 更新时间 | 操作(编辑/删除)
    ↓
管理员可执行以下操作：
    ├─ 搜索：输入关键词，前端实时过滤（匹配 question 和 answer）
    ├─ 新增：点击「新增」→ Dialog 表单（问题 + 答案 + 状态）→ 保存
    ├─ 编辑：点击 ✏️ → Dialog 预填现行值 → 修改 → 保存
    ├─ 启用/禁用：切换 Switch → ConfirmDialog 确认 → 更新
    ├─ 删除：点击 🗑 → ConfirmDialog 确认 → 删除（不可恢复）
    └─ 批量导入：
           ├─ 下载 JSON 模板文件
           ├─ 选择 .json 文件 或 粘贴 JSON 内容
           ├─ 解析校验（question/answer 非空）
           ├─ 逐条调用 API 创建
           └─ 显示导入结果（成功 X 条，失败 Y 条）
    ↓
所有操作通过 Server API 持久化（syncAction 模式）
```

### 3.3 数据流架构

```
C 端 AIChatPage                   桌面端 AIKnowledgeBasePage
        │                                    │
        │  (纯前端 Mock，不调 API)            │  CRUD 操作
        │                                    │
        ▼                                    ▼
  getMockResponse() ──────── 纯前端 ────── useAIKnowledgeStore
  (关键词匹配 + 硬编码数据)                   (Zustand)
                                                   │
                                              syncAction(name, apiCall, localUpdate)
                                                   │
                                                   ▼
                                          aiKnowledgeApi
                                          (REST CRUD client)
                                                   │
                                                   ▼
                                    Server: /api/v1/ai-knowledge
                                    crudRoutes("ai_knowledge", { searchField: "question" })
                                    GET / POST / PATCH / DELETE
                                                   │
                                                   ▼
                                     SQLite ai_knowledge 表
                                         8 条种子数据
```

**关键架构约束：** C 端 AIChatPage 的问答逻辑完全运行在浏览器内存中，使用 `getMockResponse` 函数进行关键词匹配，不请求 `/api/v1/ai-knowledge` 接口。知识库种子数据当前仅用于桌面端管理页展示，与 C 端问答内容无关。

---

## 四、功能模块清单

### 4.1 P0 必须有（MVP 缺一不可）

#### C 端 AI 旅游助手

|功能|说明|状态|
|---|---|---|
|AI 聊天界面|对话气泡样式：白色 AI 气泡 + 蓝色渐变用户气泡|✅ 已实现|
|欢迎页 + 快捷操作|AI 头像 + 问候语 + 5 个快捷按钮（2×2 网格）|✅ 已实现|
|文字输入 + 发送|输入框自适应高度(36-96px)，Enter 发送，Shift+Enter 换行|✅ 已实现|
|关键词模拟问答|匹配 6 大类关键词：线路/美食/活动/票务/讲解/住宿 + 通用引导|✅ 已实现|
|路线推荐卡片|3 条路线卡片（景点数、时长），点击跳转路线详情|✅ 已实现|
|美食商家卡片|3 家商家卡片（评分、距离），点击跳转商户详情|✅ 已实现|
|票务产品卡片|3 个票务卡片（价格、标签），点击跳转外部商城(CRMEB)|✅ 已实现|
|讲解服务卡片|2 个讲解卡片，点击跳转外部商城(CRMEB)|✅ 已实现|
|活动资讯文本|含日期信息的活动列表文本|✅ 已实现|
|住宿指南文本|古城住宿分布与建议文本|✅ 已实现|
|通用引导回复|未匹配关键词时列出可咨询范围|✅ 已实现|
|AI 思考动画|3 个圆点脉冲动画，1.2-1.8s 延迟后返回回答|✅ 已实现|
|打字机效果|28ms/步逐字显示，闪烁光标|✅ 已实现|
|清空会话|右上角垃圾桶 → ConfirmDialog 确认 → 清空|✅ 已实现|
|自动滚动|新消息自动滚动到聊天区域底部|✅ 已实现|

#### 桌面端知识库管理

|功能|说明|状态|
|---|---|---|
|知识条目列表|表格展示：问题、答案(截断)、状态(Switch)、更新时间、操作列|✅ 已实现|
|统计信息|显示总条目数和已启用条目数|✅ 已实现|
|搜索|按关键词实时过滤（服务端 LIKE 查询）|✅ 已实现|
|新增条目|Dialog 表单（问题+答案+状态）→ 保存后列表刷新|✅ 已实现|
|编辑条目|Dialog 预填现行值，支持修改所有字段|✅ 已实现|
|删除条目|ConfirmDialog 确认 → 删除（不可恢复）|✅ 已实现|
|启用/禁用|Switch 开关 → ConfirmDialog 确认 → 更新状态|✅ 已实现|
|分页|PaginationBar 组件，每页 10 条|✅ 已实现|

#### 系统能力

|功能|说明|状态|
|---|---|---|
|Server CRUD API|`/api/v1/ai-knowledge`，支持 GET/POST/PATCH/DELETE，`searchField: "question"`|✅ 已实现|
|数据库表|`ai_knowledge`（id, question, answer, category, tags, enabled, createdAt, updatedAt）|✅ 已实现|
|种子数据|8 条常见旅游问答应答（开放时间、维护费、路线、美食、交通、活动、投诉、文化院落）|✅ 已实现|
|通用 CRUD 框架|复用 `crudRoutes()` 实现，自动处理 JSON 序列化、时间戳、分页|✅ 已实现|
|数据一致性|`syncAction` 模式：先调 API，成功再更新本地 state；失败 toast 报错，不做脏更新|✅ 已实现|
|路由保护|桌面端路由受 `ProtectedRoute` 保护（仅 `isSuperAdmin`）|✅ 已实现|
|导航菜单|`nav.ts` 中已注册，`permissionCode: "content"`|✅ 已实现|

### 4.2 P1 建议有（已实现）

|功能|说明|状态|
|---|---|---|
|批量导入|JSON 文件上传或粘贴内容，解析后逐条创建，含导入模板下载|✅ 已实现|
|导入结果反馈|显示成功条数和失败条数|✅ 已实现|
|答案 hover 预览|超过 80 字符截断，hover 显示完整内容|✅ 已实现|
|输入框自适应|高度 36px-96px 自动扩展|✅ 已实现|
|非欢迎态快捷建议|对话过程中的横向滚动快捷建议栏|✅ 已实现|

### 4.3 P2 以后做（远期规划）

- 真实 LLM 大模型接入（如通义千问、文心一言），知识库作为 RAG 语料
- 流式输出（Server-Sent Events 逐字返回）
- Markdown 富文本渲染（表格、列表、代码块等）
- 多轮对话上下文记忆
- 对话历史持久化（存储到服务端）
- 用户反馈机制（点赞/点踩/有用/无用，驱动回答优化）
- 语音输入 / 语音播报
- 知识库自动分类 / 标签体系（利用已有 category/tags 字段）
- 知识库版本管理 / 变更历史
- 知识库导出（Excel / CSV / JSON）
- 知识库多语言支持（中 / 英 / 日 / 韩）
- 热门问题统计与展示
- 知识库涉及第三方知识源同步

---

## 五、核心数据模型

### 5.1 知识条目表（ai_knowledge）

|字段|类型|说明|默认值|
|---|---|---|---|
|`id`|TEXT (PK)|条目唯一 ID，格式示例 `k1`、`ai_knowledge_时间戳_随机`|自动生成|
|`question`|TEXT NOT NULL|问题内容|—|
|`answer`|TEXT NOT NULL|答案内容，支持 `\n` 换行|—|
|`category`|TEXT|分类标签（预留，当前无管理 UI）|`''`|
|`tags`|TEXT (JSON)|标签数组（预留，当前无管理 UI）|`'[]'`|
|`enabled`|INTEGER|是否启用（1=启用 / 0=禁用）|`1`|
|`createdAt`|TEXT (ISO8601)|创建时间|`datetime('now')`|
|`updatedAt`|TEXT (ISO8601)|更新时间|`datetime('now')`|

**建表语句**（`server/db/schema.sql` 第 569-578 行）：

```sql
CREATE TABLE IF NOT EXISTS ai_knowledge (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  enabled INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 5.2 前端 TypeScript 类型

```typescript
interface KnowledgeItem {
  id: string
  question: string
  answer: string
  status: "enabled" | "disabled"     // 前端映射：enabled=1 => "enabled"
  createdAt: string
  updatedAt: string
}
```

### 5.3 种子数据（8 条）

|id|问题|答案概要|
|---|---|---|
|k1|丽江古城开放时间是什么？|全天 24 小时开放，收费景点 8:00-18:00|
|k2|古城维护费多少钱？怎么缴纳？|80 元/人次，72 小时有效，入口/酒店代收|
|k3|有哪些推荐的游览路线？|3 条路线：非遗之旅/深度探索/美食地图|
|k4|古城有哪些特色美食推荐？|纳西人家/阿妈意/老四方街，腊排骨/鸡豆凉粉等|
|k5|怎么去丽江古城？交通方式？|飞机/火车/自驾，古城内禁机动车|
|k6|古城有哪些文化活动？|三多节/东巴文化体验营/纳西古乐/篝火晚会|
|k7|遇到问题怎么投诉？|在线投诉/电话 0888-5123437/现场投诉|
|k8|古城有哪些文化院落可以参观？|木府(¥60)/方国瑜故居/王家庄教堂/雪山书院|

### 5.4 C 端模拟回答数据结构

C 端 `getMockResponse` 中硬编码的卡片数据（非从数据库读取）：

**Message（消息）**：
```typescript
interface Message {
  id: string
  role: "user" | "ai"
  text: string                // 完整回答文本
  displayText: string         // 已显示文本（打字机用）
  cardType?: "route" | "merchant" | "product"
  cards?: (RouteCard | MerchantCard | ProductCard)[]
  isThinking: boolean
}
```

**RouteCard（路线卡片，3 条硬编码）**：
|字段|类型|示例|
|---|---|---|
|id|string|r1, r2, r3|
|name|string|古城漫步·非遗之旅|
|image|string|images.unsplash.com 图片 URL|
|spots|number|6|
|duration|string|4小时|
|tags|string[]|["6个景点", "4小时"]|

**MerchantCard（商家卡片，3 家硬编码）**：
|字段|类型|示例|
|---|---|---|
|id|string|m1, m2, m3|
|name|string|纳西人家餐厅|
|image|string|images.unsplash.com 图片 URL|
|tag|string|地道纳西菜|
|rating|number|4.8|
|distance|string|240m|

**ProductCard（产品卡片，5 个硬编码）**：
|字段|类型|示例|
|---|---|---|
|id|string|p1-p3(票务), g1-g2(讲解)|
|name|string|木府预约信息|
|image|string|images.unsplash.com 图片 URL|
|price|string|¥60|
|tag|string|含导览|

### 5.5 API 接口规范

**资源路径：** `/api/v1/ai-knowledge`
**实现：** `server/routes/crud.js` 中的 `crudRoutes("ai_knowledge", { searchField: "question" })`

|方法|路径|说明|请求参数|
|---|---|---|---|
|GET|/|列表查询|`?search=关键词`（LIKE question）、`?sort=字段`（默认 `-createdAt`）、`?page=&pageSize=`|
|GET|/:id|单条详情|—|
|POST|/|新增条目|Body: `{ question, answer }`（自动生成 id 和时间戳）|
|PATCH|/:id|更新条目|Body: `{ question?, answer?, enabled? }`（自动更新时间戳）|
|DELETE|/:id|删除条目|—|

> 前端 `aiKnowledgeApi` 定义位于 `src/api/client.ts` 第 205-209 行。

---

## 六、交互规范与视觉说明

### 6.1 C 端页面布局

```
┌──────────────────────────────────────┐
│ Top Bar: 深蓝渐变                    │
│   "AI 旅游助手"  · 在线状态指示       │
│                         [🗑 清空]     │
├──────────────────────────────────────┤
│                                      │
│  欢迎态：                              │
│  ┌──┐                                │
│  │AI│  "您好！我是您的..."            │
│  └──┘                                │
│  ┌────────────┐ ┌────────────┐       │
│  │ 🗺 线路推荐  │ │ 🍜 美食推荐 │       │
│  ├────────────┤ ├────────────┤       │
│  │ 📅 活动咨询  │ │ 🎫 票务咨询 │       │
│  └────────────┘ └────────────┘       │
│  ┌────────────┐                      │
│  │ 🎙 讲解预约  │                      │
│  └────────────┘                      │
│                                      │
│  对话态：                              │
│  用户: 蓝色渐变圆角气泡                │
│  AI: 白底圆角气泡 + 头像              │
│      ┌──────────────────┐            │
│      │ 路线卡片 (可点击)   │            │
│      └──────────────────┘            │
│                                      │
│  ── [横向滚动快捷栏: 🗺 🍜 📅 ...] ── │
│  ┌────────────────────┐ ┌──┐        │
│  │ 向 AI 助手提问...    │ │▶│         │
│  └────────────────────┘ └──┘        │
│  (safe-area-inset-bottom)            │
└──────────────────────────────────────┘
```

### 6.2 桌面端页面布局

```
┌────────────────────────────────────────────────────────┐
│ 🔵 AI 知识库                                              │
│ 管理 AI 智能咨询的知识内容，共 N 条，已启用 M 条             │
├────────────────────────────────────────────────────────┤
│ [🔍 搜索问题...              ] [批量导入] [＋ 新增]       │
├────────────────────────────────────────────────────────┤
│  问题                   答案              状态  更新  操作  │
├────────────────────────────────────────────────────────┤
│  丽江古城开放时间是什么？   丽江古城...    [🔛]  04-10  ✏🗑│
│  古城维护费多少钱？        古城维护费...  [🔛]  04-10  ✏🗑│
│  ...                    ...            ...  ...  ...   │
├────────────────────────────────────────────────────────┤
│  ◀ 1 / 1 ▶  共 8 条                                      │
└────────────────────────────────────────────────────────┘
```

### 6.3 交互细节

|场景|交互|说明|
|---|---|---|
|发送消息|Enter 发送 / Shift+Enter 换行|输入框空时发送按钮灰色禁用|
|打字效果|28ms 追加 2 字符，闪烁光标|`setInterval` 实现，消息切换时自动清理定时器|
|卡片点击|路线 → `/c/routes/{id}` 详情页|使用 `react-router` `useNavigate`|
|卡片点击|商家 → `/c/merchant/{id}` 详情页|使用 `react-router` `useNavigate`|
|卡片点击|票务/讲解 → 外部链接 CRMEB|`window.open(CRMEB_C_URL, "_blank")`|
|清空确认|弹窗"确认清空当前会话记录？清空后无法恢复"|不可撤销|
|桌面端编辑|Dialog 弹窗表单|预填现行值，支持修改问题和答案|
|桌面端状态切换|Switch + ConfirmDialog 二次确认|防止误操作|
|桌面端删除|ConfirmDialog "确认删除"|提示"删除后不可恢复"|
|桌面端批量导入|Dialog 含 JSON 文本区 + 文件上传|支持模板下载、文件选择和粘贴|

---

## 七、技术架构要点

### 7.1 前端架构

|模块|技术|说明|
|---|---|---|
|状态管理|Zustand（`useAIKnowledgeStore`）|持久化 store，含 items + addItem / updateItem / removeItem / batchImport / search|
|数据同步|`syncAction` 模式|先调 API，成功再更新本地，失败 toast 报错|
|API 客户端|`aiKnowledgeApi`|封装 `api.list/create/update/remove`，资源名 `"ai-knowledge"`|
|C 端模拟回答|`getMockResponse()` 函数|纯前端关键词匹配 + 硬编码预设数据，不调 Server API|
|打字效果|`setInterval` 28ms|每次追加 2 字符，消息切换自动清理|
|路由懒加载|`React.lazy()`|C 端 `/c/ai` 和桌面端 `/desktop/ai-knowledge` 均懒加载|
|桌面端 UI 组件|shadcn/ui（Dialog/Table/Switch/Button/Input/Label）|Dialog + ConfirmDialog 组合|
|分页|`usePagination` hook + `PaginationBar`|每页 10 条|

### 7.2 Server 端架构

|模块|技术|说明|
|---|---|---|
|Web 框架|Express (Node.js)|—|
|数据库|SQLite（Better-SQLite3）|轻量文件数据库|
|CRUD 路由|`server/routes/crud.js` 通用 `crudRoutes`|支持所有表的通用增删改查，含 JSON 字段序列化、布尔值处理、时间戳自动更新|
|搜索|`LIKE %keyword%` 按 `question` 字段|通过 `searchField` 参数配置|
|路由注册|`server/index.js:87`|`app.use("/api/v1/ai-knowledge", crudRoutes("ai_knowledge", { searchField: "question" }))`|

### 7.3 架构红线与约束

1. **Server-Driven 数据管理**：桌面端所有 CRUD 操作必须通过 Server API，`syncAction` 确保前后端数据一致
2. **禁止乐观更新**：先调 API，成功后更新本地 state，失败 toast 提示，不做脏数据更新
3. **C 端问答纯前端**：C 端 AI 问答完全运行在浏览器内存，与服务端无交互，刷新后对话丢失
4. **知识库数据与 C 端问答解耦**：种子数据仅桌面端使用，C 端 Mock 数据各自独立

### 7.4 外部依赖

|依赖|用途|来源|
|---|---|---|
|CRMEB 商城|产品/票务卡片点击跳转|`CRMEB_C_URL` 常量|
|Unsplash 图片|占位图（路线/商家/产品卡片）|`images.unsplash.com`|
|AI 头像|AI 助手头像|本地 `src/c-end/assets/ai-avatar-new.png`|

---

## 八、验收标准

### 8.1 C 端问答验收

- [✅] 进入 `/c/ai` 页面，看到 AI 头像 + 问候语 + 5 个快捷操作按钮
- [✅] 点击快捷按钮自动发送对应的关键词消息，返回正确匹配的回答
- [✅] 手动输入文字，Enter 发送，显示用户消息气泡
- [✅] 发送后先显示 AI 思考动画（三个脉冲圆点），1.2-1.8 秒后返回回答
- [✅] AI 回答逐字显示（28ms/步），伴随闪烁光标
- [✅] 输入"线路"相关关键词 → 3 条路线卡片，点击跳转 `/c/routes/{id}`
- [✅] 输入"美食"相关关键词 → 3 张商家卡片，点击跳转 `/c/merchant/{id}`
- [✅] 输入"活动"相关关键词 → 返回活动资讯文本
- [✅] 输入"票务"相关关键词 → 返回 3 个票务卡片，点击跳转外部商城 CRMEB
- [✅] 输入"讲解"相关关键词 → 返回 2 个讲解服务卡片，点击跳转外部商城
- [✅] 输入"住宿"相关关键词 → 返回住宿指南文本
- [✅] 输入未匹配关键词 → 返回通用引导语
- [✅] 清空垃圾桶 → ConfirmDialog 确认 → 清空所有消息 → 回到欢迎态
- [✅] 输入框空时发送按钮灰色禁用
- [✅] 新消息自动滚动到底部

### 8.2 桌面端知识库管理验收

- [✅] 管理员登录后，左侧导航可见"AI知识库管理"菜单项
- [✅] 非超管角色（`supplier`）访问 `/desktop/ai-knowledge` 被 `ProtectedRoute` 拦截
- [✅] 页面加载后展示 8 条种子数据
- [✅] 搜索框输入关键词，列表实时过滤
- [✅] 点击"新增"→ Dialog 填写问题+答案 → 保存成功 → 列表更新
- [✅] 点击"编辑"→ Dialog 预填现行值 → 修改后保存成功
- [✅] 点击"删除"→ ConfirmDialog 确认 → 删除成功（不可恢复）
- [✅] Switch 启用/禁用 → ConfirmDialog 确认 → 状态正确更新
- [✅] 分页器正常展示，每页 10 条
- [✅] 统计信息正确（总条数、已启用条数）

### 8.3 批量导入验收

- [✅] 点击"批量导入"→ 弹出 Dialog
- [✅] 可下载 JSON 导入模板
- [✅] 支持选择 JSON 文件或粘贴 JSON 内容
- [✅] 导入格式：`[{ "question": "...", "answer": "..." }]`
- [✅] question/answer 为空时跳过该条
- [✅] 导入完成显示"成功 X 条，失败 Y 条"
- [✅] 格式错误的 JSON 给出提示"JSON 解析失败"

### 8.4 数据与 API 验收

- [✅] `GET /api/v1/ai-knowledge` 返回 8 条种子数据
- [✅] `GET /api/v1/ai-knowledge?search=路线` 按 question 模糊匹配
- [✅] `POST /api/v1/ai-knowledge` 创建条目，自动生成 id 和时间戳
- [✅] `PATCH /api/v1/ai-knowledge/:id` 更新字段，自动更新 updatedAt
- [✅] `DELETE /api/v1/ai-knowledge/:id` 删除条目
- [✅] 桌面端操作通过 API 持久化，刷新后数据不丢失

### 8.5 已知未实现（已明确排除在 MVP 外）

- [❌] C 端问答对接真实知识库数据（当前 `getMockResponse` 为硬编码 Mock）
- [❌] 真实 LLM 接入（无 AI 大模型调用）
- [❌] 流式输出（打字机效果为前端定时器模拟，非 Server-Sent Events）
- [❌] 多轮对话上下文记忆（每次询问独立匹配）
- [❌] 对话历史持久化（刷新页面丢失）
- [❌] B 端页面（便民服务人员端无 AI 功能）
- [❌] 知识条目分类/标签管理（`category` 和 `tags` 字段预留但无管理 UI）
- [❌] 知识库导出功能
- [❌] 知识库使用统计（无问答命中率、高频问题统计）
- [❌] 用户反馈机制（无点赞/点踩）

---

## 九、相关文件索引

|类型|文件路径|说明|
|---|---|---|
|C 端页面|`src/features/ai-knowledge/c-end/pages/AIChatPage.tsx`|AI 聊天页面（755 行）|
|桌面端页面|`src/desktop/pages/AIKnowledgeBasePage.tsx`|知识库管理页面（339 行）|
|Store|`src/features/ai-knowledge/store/store.ts`|Zustand store（CRUD + 搜索）|
|Store 导出|`src/features/ai-knowledge/store/index.ts`|Barrel 导出|
|API 客户端|`src/api/client.ts#L205-L209`|`aiKnowledgeApi` 定义|
|Server 路由注册|`server/index.js#L87`|`/api/v1/ai-knowledge` 注册|
|通用 CRUD 框架|`server/routes/crud.js`|`crudRoutes()` 函数|
|数据库 Schema|`server/db/schema.sql#L569-L578`|`ai_knowledge` 建表语句|
|种子数据|`server/db/seed.js#L297-L306`|8 条预置条目|
|C 端路由|`src/c-end/routes.tsx#L13-L15`|路由 `/c/ai`，懒加载 `AIChatPage`|
|桌面端路由|`src/desktop/App.tsx#L53,L108`|路由 `/desktop/ai-knowledge`，懒加载 + ProtectedRoute|
|桌面端导航|`src/desktop/nav.ts#L49`|导航菜单「AI知识库管理」|
|Spec 文档|`docs/superpowers/specs/011-ai-knowledge.md`|功能需求规格说明书|