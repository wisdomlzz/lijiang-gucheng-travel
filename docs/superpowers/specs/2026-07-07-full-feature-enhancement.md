# 丽江古城游 V2.0 全 Feature 提升方案

> **版本**：v2.0 · 2026-07-07
> **状态**：硬编码清理完成 · UI/UX 持续迭代

## 一、数据源总览

所有 22 个 feature 的数据来源：

| Feature | 数据源 | 状态 |
|---------|--------|------|
| convenience | API → DB (10 张表) | ✅ |
| complaints | API → DB (complaints 表) | ✅ |
| trust-score | API → DB (4 张表) | ✅ |
| bookings | API → DB (bookings 表) | ✅ |
| checkin | API → DB (2 张表) | ✅ |
| merchant-review | API → DB (2 张表) | ✅ |
| supplier | API → DB (2 张表) | ✅ |
| announcement | API → DB (announcements 表) | ✅ |
| points | API → DB (3 张表) | ✅ |
| address | API → DB (addresses 表) | ✅ |
| ai-knowledge | API → DB (ai_knowledge 表) | ✅ |
| content | API → DB (6 张表) | ✅ |
| homepage | API → DB (banners + grid_items) | ✅ |
| **route** | API → DB (content_routes.isFeatured) | ✅ **本次迁移** |
| **flow-warning** | API → DB (flow_areas 表) | ✅ **本次迁移** |
| heritage | 外部 API（硬编码过渡） | 🟢 spec 确认 |
| housing | 外部 API（硬编码过渡） | 🟢 spec 确认 |
| info | 跨 feature content/news-store | ✅ |
| notification | localStorage (平台级) | 🟢 纯前端 |
| profile | 多 store 聚合 | 🟢 纯展示 |
| favorite | API → DB (favorites 表) | ✅ |
| volunteer | API → DB (3 张表) | ✅ |

## 二、业务流程图（22 个 Feature）

### 1. 便民服务 convenience
```mermaid
flowchart TD
    C[C端用户] -->|createOrder| S10[已下单]
    S10 -->|autoDispatch| A20[已指派]
    A20 -->|accept| A30[已接单]
    A30 -->|arriveCheckin| A30
    A30 -->|quote| A35[已核价]
    A35 -->|lockPayment| A35
    A35 -->|payOnline/confirmCash| A40[已收款]
    A40 -->|startService| S48[服务中]
    S48 -->|complete| S55[待确认]
    S55 -->|confirm| S40[已完成]
    S40 -->|rate| S40[评价]
    
    A20 -->|reject/timeout| A10[待重派]
    A35 -->|rejectQuote| S90[人工处理]
    S90 -->|restoreQuote| A35
    S90 -->|reDispatch| A10
    S90 -->|forceCancel| S50[已取消]
    
    subgraph server["Server 定时任务"]
        autoDispatch
        acceptTimeout
        payTimeout
        autoConfirm
        settleT7
    end
    
    subgraph admin["桌面端管理"]
        D[ConveniencePage] -->|手动派单/强制取消| S90
        D -->|取消审批| S50
    end
```

### 2. 投诉管理 complaints
```mermaid
flowchart TD
    C[C端] -->|createComplaint| C10[已提交]
    D[桌面端] -->|resolve| C40[已处理]
    D -->|reject| CR[已驳回]
    C40 -->|updateStaffStats| Staff[staff.complaintCount+1]
```

### 3. 诚信评分 trust-score
```mermaid
flowchart TD
    Staff[staff操作] -->|addRatingBonus| Score[score++]
    Staff -->|addComplaintDeduction| Score
    Admin[桌面端] -->|configureRules| Rules[score_rules表]
    Admin -->|thresholdConfig| Threshold[trust_thresholds表]
    C[C端] -->|viewScore| Badge[TrustScoreBadge]
```

### 4. 院落预约 bookings
```mermaid
flowchart TD
    C[C端] -->|browse| Courtyards[院落列表]
    C -->|viewDetail| Detail[院落详情]
    Detail -->|book| Booking[预约表单]
    Booking -->|create| Pending[待核销]
    Admin[桌面端] -->|verify| Verified[已核销]
    C -->|myBookings| MyBookings[我的预约]
```

### 5. 签到打卡 checkin
```mermaid
flowchart TD
    subgraph courtyard["文化院落打卡"]
        C[C端] -->|scan| Photo[拍照]
        Photo -->|upload| Checkin[打卡记录]
        Checkin -->|triggerPoints| Points[积分+]
    end
    subgraph naxi["纳西人打卡"]
        C -->|dailyCheckin| Naxi[纳西连续打卡]
        Naxi -->|streak| Bonus[额外奖励]
    end
    subgraph report["随手拍"]
        C -->|photo| Report[上传随手拍]
    end
```

### 6. 商户审核 merchant-review
```mermaid
flowchart TD
    C[C端] -->|register| Pending[待审核]
    Admin[桌面端] -->|approve| Approved[已通过]
    Admin -->|reject| Rejected[已驳回]
    Approved -->|notify| C[通知商户]
```

### 7. 供应商管理 supplier
```mermaid
flowchart TD
    C[C端] -->|apply| Pending[待审核]
    Desktop[桌面端] -->|review| Approved[已通过]
    Desktop -->|reject| Rejected[已驳回]
```

### 8. 内容管理 content
```mermaid
flowchart TD
    subgraph Admin["桌面端 ContentManagePage"]
        News[资讯管理] --> CRUD[增删改查]
        Routes[路线管理] --> CRUD
        Courtyards[院落管理] --> CRUD
        Merchants[商户管理] --> CRUD
        POI[地图POI] --> CRUD
        Housing[公房管理] --> CRUD
    end
    subgraph C["C端展示"]
        NewsPage --> News
        RoutesPage --> Routes
        CourtyardsPage --> Courtyards
        MerchantPage --> Merchants
        MapPage --> POI
        HousingPage --> Housing
    end
```

### 9. 积分系统 points
```mermaid
flowchart TD
    Action[用户行为] -->|checkin| transact[积分交易]
    Action -->|volunteer| transact
    Action -->|convenience| transact
    transact --> ledger[积分流水]
    Rules[积分规则] -->|配置| transact
    C[C端] -->|view| PointsCenter[积分中心]
```

### 10. 志愿服务 volunteer
```mermaid
flowchart TD
    subgraph C["C端"]
        Register[注册认证] --> Pending[待审核]
        Browse[浏览活动] --> SignUp[报名]
        SignUp --> Checkin[签到]
        Checkin --> Checkout[签退]
        Checkout -->|triggerPoints| Points[积分+]
    end
    subgraph Admin["桌面端"]
        Pending -->|approve| Approved[已通过]
        Pending -->|reject| Rejected[已驳回]
        Activity[活动管理] --> CRUD
        SignUp --> Record[签到记录]
    end
```

### 11. 公告通知 announcement
```mermaid
flowchart TD
    Admin[桌面端] -->|CRUD| Announcement[公告表]
    C[C端] -->|list| AnnouncementPage[公告列表]
    C -->|detail| AnnouncementDetail[公告详情]
```

### 12. AI 知识库 ai-knowledge
```mermaid
flowchart TD
    Admin[桌面端] -->|CRUD + batchImport| Knowledge[知识条目]
    C[C端] -->|chat| AIChatPage[AI聊天]
    AIChatPage -->|query| Knowledge
    AIChatPage -->|mockResponse| C
```

### 13. 地址管理 address
```mermaid
flowchart TD
    C[C端] -->|list| AddressList[地址列表]
    C -->|add/edit| AddressForm[地址表单]
    C -->|setDefault| AddressList
    C -->|delete| AddressList
```

### 14. 收藏管理 favorite
```mermaid
flowchart TD
    C[C端] -->|add| Favorite[收藏]
    C -->|list| FavoritesPage[收藏列表]
    C -->|remove| FavoritesPage
    C -->|navigate| Target[目标页面]
```

### 15. 首页配置 homepage
```mermaid
flowchart TD
    subgraph Admin["桌面端"]
        Banner[Banner管理] -->|CRUD + reorder| Banners
        Grid[宫格管理] -->|CRUD + toggle| GridItems
    end
    subgraph C["C端首页"]
        Banners -->|轮播| HomePage
        GridItems -->|8宫格| HomePage
        FlowWarning -->|人流状态| HomePage
        FeaturedRoutes -->|推荐攻略| HomePage
        Announcements -->|资讯流| HomePage
    end
```

### 16. 消息通知 notification
```mermaid
flowchart TD
    Sources[6 个触发源] -->|convenience| NotificationStore
    Sources -->|merchantReview| NotificationStore
    Sources -->|complaints| NotificationStore
    Sources -->|supplier| NotificationStore
    Sources -->|volunteer| NotificationStore
    Sources -->|announcement| NotificationStore
    NotificationStore -->|localStorage| Persist
    C[C端] -->|list| NotificationsPage[通知列表]
```

### 17-22. 剩余功能（展示型）
- **profile**：聚合仪表盘，读多 store 纯展示
- **route**：路线浏览 + 详情 + 模拟导航预览
- **heritage**：8 类遗产百科，接外部 API
- **housing**：公房信息展示，接外部 API
- **info**：资讯 + 新闻列表
- **flow-warning**：人流量实时看板

## 三、API 端点对照表

| 资源 | 端点 | 方法 | 说明 |
|------|------|------|------|
| staff | `/api/v1/staff` | CRUD + PATCH disable | ✅ |
| orders | `/api/v1/orders` | CRUD + dispatch/transition/pay | ✅ |
| zones | `/api/v1/zones` | CRUD | ✅ |
| complaints | `/api/v1/complaints` | CRUD + resolve/reject | ✅ |
| reviews | `/api/v1/reviews` | CRUD | ✅ |
| points/rules | `/api/v1/points/rules` | CRUD | ✅ |
| trust-scores | `/api/v1/trust-scores` | CRUD + threshold | ✅ |
| content/news | `/api/v1/content/news` | CRUD | ✅ |
| content/routes | `/api/v1/content/routes` | CRUD | ✅ |
| content/courtyards | `/api/v1/content/courtyards` | CRUD | ✅ |
| content/merchants | `/api/v1/content/merchants` | CRUD | ✅ |
| content/pois | `/api/v1/content/pois` | CRUD | ✅ |
| content/housing | `/api/v1/content/housing` | CRUD | ✅ |
| banners | `/api/v1/banners` | CRUD + reorder | ✅ |
| grid-items | `/api/v1/grid-items` | CRUD | ✅ |
| volunteers | `/api/v1/volunteers` | CRUD | ✅ |
| volunteer-activities | `/api/v1/volunteer-activities` | CRUD | ✅ |
| ai-knowledge | `/api/v1/ai-knowledge` | CRUD | ✅ |
| favorites | `/api/v1/favorites` | CRUD | ✅ |
| addresses | `/api/v1/addresses` | CRUD | ✅ |
| bookings | `/api/v1/bookings` | CRUD + /check | ✅ |
| checkins | `/api/v1/checkins` | CRUD | ✅ |
| naxi-checkins | `/api/v1/naxi-checkins` | CRUD | ✅ |
| **flow-areas** | `/api/v1/flow-areas` | CRUD | ✅ **新增** |
| system-configs | `/api/v1/system-configs` | CRUD | ✅ |
| announcements | `/api/v1/announcements` | CRUD | ✅ |
| flow-warnings | `/api/v1/flow-warnings` | CRUD | ✅ |
| dispatch-configs | `/api/v1/dispatch-configs` | CRUD | ✅ |
| income-records | `/api/v1/incomes` | CRUD | ✅ |
| withdrawals | `/api/v1/withdrawals` | CRUD | ✅ |
| suppliers | `/api/v1/suppliers` | CRUD | ✅ |
| supplier-applications | `/api/v1/supplier-applications` | CRUD | ✅ |
| merchant-registrations | `/api/v1/merchant-registrations` | CRUD | ✅ |
| merchant-reviews | `/api/v1/merchant-reviews` | CRUD | ✅ |

## 四、已完成的清理工作

1. ✅ 删除 3 个死文件（AuditPage + 2 个 FlowWarningPage）
2. ✅ 删除 2 个死路由（B 端 quote + C 端 /c/info/create）
3. ✅ 内联 2 个瘦路由文件（announcements.js + flow-warnings.js）
4. ✅ 抽 crudApi() 工厂 + lazyImport() 辅助
5. ✅ 删除 9 个无价值 store barrel 文件
6. ✅ route 推荐路线硬编码 → API 驱动
7. ✅ flow-warning 硬编码种子数据 → DB + API 驱动
8. ✅ 22 个 feature 需求文档全部产出
9. ✅ 桌面端菜单全面注册（announcement / ai-knowledge / booking / staff-review）
10. ✅ 入驻审核流程 + B 端入驻表单 + 桌面端审核页
11. ✅ 结算 GMV 报表（线上/现金分开统计）
12. ✅ 取消扣费自动计算

## 五、后续迭代（持续）

- **UI/UX 打磨**：全页面三态覆盖（Loading/Empty/Error）
- **业务闭环**：逐 feature 审缺损流转路径补完
- **版本管理**：每次改动独立 commit，分支管理