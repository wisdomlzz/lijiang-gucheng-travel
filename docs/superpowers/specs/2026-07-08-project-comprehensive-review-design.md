# 丽江古城游 V2.0 综合审查与工程基建方案

> **版本**：v1.0 · 2026-07-08
> **状态**：待实施
> **前置**：分支合并（backend-express-sqlite → main）

---

## 一、项目健康度总览

### 1.1 基本情况

| 维度 | 值 |
|------|-----|
| 前端代码 | ~43K 行（TypeScript + TSX + CSS） |
| 后端代码 | ~65K 行（Express + SQLite，含 seed 数据） |
| 数据库 | 45 张 SQLite 表 |
| Features | 22 个垂直切片 |
| 测试覆盖 | 1 个 spec 文件（store 冒烟测试） |

### 1.2 已确认的优势

- **Feature-First 架构** 贯彻良好，22 个 feature 垂直切片清晰，依赖纪律明确（feature → platform/shared，feature 间不互引）
- **后端骨架扎实**：45 张表、12 路由模块、通用 CRUD 生成器、完整便民服务状态机（含 7 个 cron 定时任务）
- **全 API 对接完成**：所有 22 个 feature 数据来源已从硬编码迁移到 API → DB
- **桌面端标准化**：已产出 UI 规范文档，搜索/筛选/分页三要素已落地主要页面
- **重构持续进行**：近期拆分 volunteer 大文件（1686→460 行）、迁移 shared stores 到 platform/（修 17 处 import 违规）
- **构建通过**：npm run build 3.95s 无报错

### 1.3 待修复项汇总

| # | 问题 | 严重度 | 分类 |
|---|------|--------|------|
| 1 | Desktop 页面归属不一致（content、supplier 在 gates/） | 🟡 中 | 架构 |
| 2 | 大文件 7 个 > 650 行（最多 804 行） | 🟡 中 | 代码质量 |
| 3 | BNotificationsPage 遗留 "加载中..." | 🟢 低 | 体验 |
| 4 | Points 路由写在 server/index.js | 🟢 低 | 架构 |
| 5 | 无数据库迁移机制（schema.sql 单文件） | 🟡 中 | 工程 |
| 6 | 后端无统一错误处理中间件 | 🟡 中 | 工程 |
| 7 | 测试覆盖极低（仅 1 spec） | 🟡 中 | 工程 |
| 8 | backend-express-sqlite 分支未推送 | 🟡 中 | 流程 |
| 9 | 无数据库迁移机制 | 🟡 中 | 工程 |
| 10 | 多个 feature 无桌面页（部分合理，部分可加） | 🟢 低 | 功能 |

---

## 二、分支治理

### 2.1 现状

```
main ── 纯前端（Vite + React，无 Express 后端）
       ↕ 落后 backend-express-sqlite
backend-express-sqlite ── 完整前后端（当前工作分支，未推送到 remote）
       ↕ 本地有 2 个 stale worktree
```

### 2.2 目标状态

```
feat/standalone-frontend ── 从 main 切出，永久保留纯前端存档
main ── 合并 backend-express-sqlite，成为完整前后端开发主线
       ↕ 之后所有 feature 分支从 main 切出
```

### 2.3 执行步骤

1. **切保护分支**
   ```bash
   git checkout main
   git checkout -b feat/standalone-frontend
   git push origin feat/standalone-frontend
   ```

2. **合并后端到 main**
   ```bash
   git checkout main
   git merge backend-express-sqlite
   npm run build    # 验证构建
   git push origin main
   ```

3. **清理**
   - `git branch -D backend-express-sqlite`
   - `git worktree prune` + 手动删除残留 worktree 目录
   - 本地 `git pull` 同步

---

## 三、架构打磨（路线 A）

### 3.1 Desktop 页面归属归一化

**背景：** 按照 Feature-First Architecture，每个 feature 的桌面端代码应归入 `features/<name>/desktop/`。但 `content` 和 `supplier` 两个 feature 的桌面页仍在 `src/desktop/pages/gates/`。

**迁移路线图：**

| 源路径 | 目标路径 | 影响文件 |
|--------|----------|---------|
| `src/desktop/pages/gates/content/` | `src/features/content/desktop/pages/` | 6 个内容管理页 |
| `src/desktop/pages/supplier-applications/` | `src/features/supplier/desktop/pages/` | 3 个供应商页 |

**联动修改：**
- `src/desktop/App.tsx` —— 更新 lazy import 路径
- `src/desktop/nav.ts` —— 无需改路径（路由 path 不变，只 import 路径变）
- 检查是否有其他文件 import 了这些组件

**不迁移的文件：**
- `src/desktop/pages/RequirementPage.tsx` —— 非 feature，全局需求文档页，保留
- `src/desktop/pages/photo-records/` —— 非 feature，全局功能，保留
- `src/desktop/pages/Workbench.tsx` —— 桌面端壳子，保留
- `src/desktop/pages/SystemConfigPage.tsx` —— 可能为后端配置页，按需保留或迁入 platform/

### 3.2 大文件拆分

参照已完成范例（VolunteerManagePage：1686→460 行 parent + 15 子组件），按以下优先级拆分：

#### P0（800+ 行，优先拆分）

| 文件 | 行 | 拆分策略 |
|------|-----|---------|
| `ConvenienceStaffPage.tsx` | 804 | 按 Tab 切 3 组件：StaffList / StaffDetail / StaffForm |
| `ConveniencePage.tsx` | 801 | 按 Tab 切 3 组件：OrderPool / ManualDispatch / ReviewPanel |

#### P1（700-799 行）

| 文件 | 行 | 拆分策略 |
|------|-----|---------|
| `AIChatPage.tsx` | 758 | MessageList / InputPanel / HistorySidebar |
| `MerchantReviewPage.tsx` | 757 | ReviewTab / MerchantList / ReviewForm |
| `HousingPage.tsx` | 726 | HousingMap / HousingList / HousingDetail |

合并到 `src/desktop/pages/gates/content/` → 迁移时会自然解决一部分

#### P2（600-699 行）

| 文件 | 行 | 拆分策略 |
|------|-----|---------|
| `VolunteerActivitiesPage.tsx` | 698 | ActivityList / ActivityDetail / SignupForm |
| `VolunteerActivityDetailPage.tsx` | 632 | 信息区 / 报名区 / 评价区 |
| `ComplaintPage.tsx` | 644 | ComplaintList / ComplaintDetail / ResolveForm |

### 3.3 遗留小问题修复

| # | 项目 | 文件 | 改动 |
|---|------|------|------|
| 1 | "加载中..." → Skeleton | `src/features/convenience/b-end/pages/BNotificationsPage.tsx:158` | 替换 `<div>加载中...</div>` 为 `<Skeleton>` |
| 2 | Points 路由移入 routes/ | `server/index.js:95-107` | 抽出到 `server/routes/points.js` |


### 3.4 箭头类型统一检查

**改进：** 全项目使用 `function` 而非 `=>`。许多已有文件混合使用两种箭头风格，不在此轮统一。

---

## 四、工程基建（路线 B）

### 4.1 后端统一错误处理

**新增文件：**
- `server/middleware/errorHandler.js`

```javascript
// 异步包装器 — 包裹所有 async route handler
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

// 全局错误处理中间件 — app.use 注册到最后
export function errorHandler(err, req, res, next) {
  console.error("[ERROR]", err)
  res.status(err.status || 500).json({
    ok: false,
    msg: err.message || "Internal Server Error",
  })
}
```

**注册方式（server/index.js）：**
```javascript
import { errorHandler } from "./middleware/errorHandler.js"
// ... 所有路由之后
app.use(errorHandler)
```

**引入策略：** 渐进式——新路由 / 修改的路由用 `asyncHandler` 包装，旧路由逐步迁移。一次性全量改 12 个路由文件风险高，不推荐。

### 4.2 数据库迁移机制

**新增文件：**
- `server/db/migrate.js`

**机制：**
```sql
-- schema_migrations 表（migrate.js 自动创建）
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  appliedAt TEXT DEFAULT (datetime('now'))
);
```

**工作流：**

1. `migrate.js` 启动 → 创建 `schema_migrations` 表
2. 检查 `server/db/migrations/` 下的 `.sql` 文件
3. 按文件名前缀排序（`001_xxx.sql`, `002_xxx.sql`...）
4. 只执行 `schema_migrations` 表中没有记录的文件
5. 执行成功后写入记录

**首次执行：**
- 记录 `000_baseline` 为已执行（schema.sql 已经存在）
- `001_xxx.sql` 开始为真实增量迁移

**调用时机：** 在 `server/index.js` 中 `import "./db/migrate.js"` 自动执行。Seed 数据保持不变（仍由 seed.js 处理）。

### 4.3 测试覆盖

#### Phase 1：核心 Store 单元测试（立即执行）

在 `verification/tests/` 下扩展：

| 测试 | 内容 | 文件 |
|------|------|------|
| Convenience 状态机 | 每个 transition 的 from→to 正确 + 非法 transition 拒绝 | `convenience-store.spec.ts` |
| Volunteer store | CRUD + 状态变更 | `volunteer-store.spec.ts` |
| Booking store | 预约流程状态 | `booking-store.spec.ts` |
| Auth store | 登录/切换平台 | `auth-store.spec.ts` |

#### Phase 2：后端 API 集成测试

- 使用 `vitest` + `supertest`
- 导入 Express app 实例，模拟 HTTP 请求
- 按资源组覆盖：

| 测试组 | 覆盖 |
|--------|------|
| auth API | 登录流程、JWT 校验 |
| crud API | GET/POST/PATCH/DELETE 通用操作 |
| orders API | 便民服务完整状态机流转 |
| complaints API | 提交流程 |

#### Phase 3：业务端到端流程

- Convenience 完整流程：下单 → 派单 → 接单 → 核价 → 收款 → 服务 → 确认 → 评价
- 每个状态节点验证 DB 状态正确

### 4.4 CI/CD 加构建验证

在 `.github/workflows/` 下现有 workflow 中补充：

```yaml
# 在 opencode.yml 中补充（如果已有）
- name: Build Check
  run: npm run build
- name: Type Check
  run: npm run typecheck
- name: Tests
  run: npm run verify:all
```

---

## 五、执行路径与时间线

### 阶段 1：分支治理 + 快速修复（~1 天）

```
[Day 1]
├── feat/standalone-frontend 保护分支
├── backend-express-sqlite → main 合并
├── 清理 worktree / 旧分支
├── BNotificationsPage 加载中修复
├── Points 路由迁移
```

### 阶段 2：架构打磨（~2 天）

```
[Day 2-3]
├── content/supplier 桌面页迁移（含 import 路径更新）
├── ConvenienceStaffPage 拆分（804 → 3 子组件）
├── ConveniencePage 拆分（801 → 3 子组件）
├── 可选：P1/P2 大文件拆分（如时间允许）
```

### 阶段 3：工程基建（~3 天）

```
[Day 4-6]
├── 后端错误处理中间件
├── 数据库迁移机制
├── Test Phase 1：store 单元测试
├── Test Phase 2：API 集成测试
├── CI 构建验证配置
```

### 阶段 4：新功能迭代（后续）

```
[Day 7+]
├── 补齐缺失的桌面端 feature（按需）
├── C 端体验再打磨
├── 性能优化 / 国际化
```

---

## 六、风险与备注

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| desktop 页迁移可能遗漏 import | 编译报错 | 改完后 `npm run build` 验证，编译会捕获所有错误 |
| 大文件拆分中可能引入逻辑错误 | 功能异常 | 每次拆分后手动验证该功能核心流程 |
| 后端错误处理中间件与现有 try/catch 冲突 | 错误被吞 | 渐进式引入，不改已有 try/catch |
| 数据库 migration 与现有 seed 数据冲突 | seed 失败 | migration 只改 schema，seed 数据在 seed.js 中独立管理 |
| 合并 backend-express-sqlite 到 main 时有冲突 | 合并失败 | `git merge` 时逐一解决冲突，build 验证 |

---

## 七、不在此范围

以下内容已考虑但不在当前设计中：

1. **Tailwind CSS v4 配置迁移**（无 tailwind.config.js 是当前选择，不打算加）
2. **i18n 国际化**（后续 Feature 迭代阶段考虑）
3. **设计系统全面 overhaul**（现有 DESIGN.md 规范足够使用）
4. **纯前端版本独立维护**（只存档，不额外同步修改）
5. **部署脚本补全**（deploy.sh 在父目录，与本项目架构无关）