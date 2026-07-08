# 阶段一：分支治理与快速修复 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成分支治理（main → feat/standalone-frontend 存档 + backend-express-sqlite → main 合并），同时修复两个小问题（加载中残留 + Points 路由迁移）

**Architecture:** 纯 git 操作 + 两个低风险单文件修改。不用 feature 分支，直接在 backend-express-sqlite 上操作后合并到 main。

**Tech Stack:** git, Express, React

---

## 任务说明

此阶段分为 4 个独立 Task，顺序执行：

| Task | 内容 | 风险 |
|------|------|------|
| 1 | 创建 feat/standalone-frontend 保护分支 | 低 |
| 2 | 合并 backend-express-sqlite → main | 中（可能冲突） |
| 3 | 修复 BNotificationsPage "加载中..." | 低 |
| 4 | Points 路由从 index.js 迁移到 routes/points.js | 低 |

---

### Task 1: 创建纯前端存档分支

**说明：** 从 `main` 切出保护分支 `feat/standalone-frontend`，推送 remote。`main` 当前只包含纯前端代码（无 Express 后端），将这个状态永久保留。

- [ ] **Step 1: 切到 main 并拉最新**

```bash
cd /Users/lzz/Desktop/Projects/丽江古城游
git checkout main
git pull origin main
```

- [ ] **Step 2: 创建保护分支并推送**

```bash
git checkout -b feat/standalone-frontend
git push origin feat/standalone-frontend
```

- [ ] **Step 3: 验证 remote 已有**

```bash
git branch -r | grep standalone-frontend
```
Expected: `origin/feat/standalone-frontend`

---

### Task 2: 合并 backend-express-sqlite → main

**说明：** 将当前工作分支内容合并回 main。确保当前 branch 已是最新，然后 fast-forward 或 merge 到 main。

- [ ] **Step 1: 切回 backend-express-sqlite，确认分支干净**

```bash
git checkout backend-express-sqlite
git status
```
Expected: nothing to commit, working tree clean

- [ ] **Step 2: 切到 main，拉最新**

```bash
git checkout main
git pull origin main
```

- [ ] **Step 3: 合并 backend-express-sqlite**

```bash
git merge backend-express-sqlite
```

若冲突，处理方式：
- 优先保留 backend-express-sqlite 的版本（最新工作）
- 确认 server/ 目录完整到达
- 确认 src/ 无遗漏

- [ ] **Step 4: 验证构建**

```bash
npm run build
npm run typecheck
```
Expected: Build 通过，typecheck 通过

- [ ] **Step 5: 推送 main 到 remote**

```bash
git push origin main
```

- [ ] **Step 6: 清理旧分支和 worktree**

```bash
git branch -D backend-express-sqlite
git worktree prune
# 手动检查 ~/Desktop/Projects/丽江古城游/ 下有无残留 worktree 目录
ls -la ~/Desktop/Projects/丽江古城游/ | grep worktree
```
如果看到 worktree-agent-* 目录，手动删除：
```bash
rm -rf ~/Desktop/Projects/丽江古城游/worktree-agent-*
```

---

### Task 3: 修复 BNotificationsPage "加载中..." → Skeleton

**文件：** `src/features/convenience/b-end/pages/BNotificationsPage.tsx`

**说明：** 替换第 158 行的文字"加载中..."为 Skeleton 组件，与其他页面的骨架屏模式保持一致。

- [ ] **Step 1: 确认已有 Skeleton 的 import**

```bash
grep "Skeleton" src/features/convenience/b-end/pages/BNotificationsPage.tsx | head -3
```

如果已有 import，跳过 Step 2。

- [ ] **Step 2: 添加 Skeleton import**

```diff
+ import { Skeleton } from "@/shared/components/ui/skeleton"
```
在文件顶部现有 import 块内添加。

- [ ] **Step 3: 替换加载状态**

```diff
  {loading && notifications.length === 0 ? (
-   <div className="text-center py-16 text-[13px] text-text-tertiary">加载中...</div>
+   <div className="space-y-3 p-4">
+     <Skeleton className="h-16 w-full rounded-xl" />
+     <Skeleton className="h-16 w-full rounded-xl" />
+     <Skeleton className="h-16 w-3/4 rounded-xl" />
+   </div>
  ) : visible.length === 0 ? (
```

- [ ] **Step 4: 验证构建**

```bash
npm run build
```
Expected: Build 通过

- [ ] **Step 5: Commit**

```bash
git add src/features/convenience/b-end/pages/BNotificationsPage.tsx
git commit -m "fix: replace remaining loading text with Skeleton in BNotificationsPage"
```

---

### Task 4: Points 路由从 index.js 迁移到 routes/points.js

**文件：**
- Modify: `server/index.js`
- Create: `server/routes/points.js`

**说明：** 将 index.js 中直接内联的 Points 路由（95-140 行）抽取到独立路由文件。

- [ ] **Step 1: 创建 `server/routes/points.js`**

```javascript
import { Router } from "express"
import db from "../db/connection.js"
import { ok, fail } from "../middleware/response.js"

const router = Router()

// GET /api/v1/points/account/:userId
router.get("/account/:userId", (req, res) => {
  try {
    const account = db.prepare("SELECT * FROM points_accounts WHERE userId = ?").get(req.params.userId)
      || { userId: req.params.userId, balance: 0, totalEarned: 0, totalUsed: 0 }
    const ledgers = db.prepare("SELECT * FROM points_ledgers WHERE userId = ? ORDER BY createdAt DESC").all(req.params.userId)
    res.json(ok({ ...account, ledgers }))
  } catch (e) {
    res.json(fail(e.message))
  }
})

// POST /api/v1/points/transact
router.post("/transact", (req, res) => {
  try {
    const { userId, sourceCode, refId, customDelta } = req.body
    const rule = db.prepare("SELECT * FROM points_rules WHERE code = ? AND enabled = 1").get(sourceCode)
    if (!rule) return res.json(fail(`积分规则 ${sourceCode} 不存在或已停用`))
    let delta = customDelta ?? rule.points
    if (rule.direction === "OUT") delta = -Math.abs(delta)
    else delta = Math.abs(delta)
    let account = db.prepare("SELECT * FROM points_accounts WHERE userId = ?").get(userId)
    if (!account) {
      db.prepare("INSERT INTO points_accounts (userId, balance, totalEarned, totalUsed) VALUES (?, 0, 0, 0)").run(userId)
      account = { userId, balance: 0, totalEarned: 0, totalUsed: 0 }
    }
    const newBalance = account.balance + delta
    if (newBalance < 0) return res.json(fail("积分余额不足"))
    const now = new Date().toISOString()
    db.prepare("UPDATE points_accounts SET balance=?, totalEarned=?, totalUsed=?, updatedAt=? WHERE userId=?")
      .run(
        newBalance,
        account.totalEarned + (delta > 0 ? delta : 0),
        account.totalUsed + (delta < 0 ? -delta : 0),
        now,
        userId,
      )
    const ledgerId = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    db.prepare(
      "INSERT INTO points_ledgers (id, userId, direction, delta, sourceCode, sourceLabel, refId, balanceAfter, createdAt) VALUES (?,?,?,?,?,?,?,?,?)",
    ).run(ledgerId, userId, rule.direction, Math.abs(delta), sourceCode, rule.label, refId || null, newBalance, now)
    const updated = db.prepare("SELECT * FROM points_accounts WHERE userId = ?").get(userId)
    res.json(ok(updated, `积分${delta > 0 ? "+" : ""}${delta}`))
  } catch (e) {
    res.json(fail(e.message))
  }
})

export default router
```

- [ ] **Step 2: 在 index.js 中替换 Points 部分**

```diff
  // 在现有 import 块中添加:
+ import pointsRoutes from "./routes/points.js"

  // 在 Points 特殊端点区域，替换 inline 代码为:
+ // ====== Points 特殊端点 ======
+ app.use("/api/v1/points", pointsRoutes)

  // 删除原有 95-140 行
```

具体操作：在 import 块（第 20 行附近）添加 `import pointsRoutes from "./routes/points.js"`，然后删除 index.js 第 93-140 行（"Points 特殊端点"到第二个 catch 块结尾），替换为 `app.use("/api/v1/points", pointsRoutes)`。

- [ ] **Step 3: 验证后端启动**

```bash
cd /Users/lzz/Desktop/Projects/丽江古城游/server
node --check index.js
node --check routes/points.js
```
Expected: 无语法错误

- [ ] **Step 4: Commit**

```bash
git add server/index.js server/routes/points.js
git commit -m "refactor: extract points routes from index.js to routes/points.js"
```

---

### 完成标准

- [ ] `feat/standalone-frontend` 分支在 remote 存在，保存纯前端版本
- [ ] `main` 分支包含完整前后端代码
- [ ] `npm run build` 通过
- [ ] BNotificationsPage 无 "加载中..." 文字
- [ ] Points 路由在 `server/routes/points.js` 中