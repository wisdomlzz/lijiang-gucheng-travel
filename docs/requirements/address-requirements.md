# 地址管理模块 — 产品需求文档

> **文档版本**：v1.1
> **更新日期**：2026-07-07
> **产品定位**：C 端游客管理收货地址（客栈/店铺），用于便民服务下单时快速填写地址
> **配套文档**：[015-address.md](../superpowers/specs/015-address.md)、[便民服务平台 MVP 产品设计文档](/Users/zz/Downloads/便民服务平台%20MVP%201.0%20产品设计文档（正式版）.md)

---

## 一、产品定位与边界

### 1.1 我们在做什么

地址管理模块允许 C 端游客保存、编辑、删除古城内的收货地址（客栈、民宿、商铺地址），并支持设置默认地址。地址数据通过通用 CRUD 路由与 SQLite 服务端同步，同时通过 zustand persist 在 localStorage 做本地缓存。该模块主要服务于便民服务订单的地址选择场景，便民服务下单页（`ServicesPage.tsx`）内置地址选择器弹窗，可直接选取已保存地址或跳转新增地址。

**核心目标：**

- 支持 C 端用户新增/编辑/删除收货地址
- 支持设置默认地址（同一用户仅一个默认地址）
- 手机号脱敏展示（中间 4 位 `****`）
- 区域信息默认为「云南省 丽江市 古城区」，用户可手动修改
- 地址通过服务端持久化 + localStorage 本地缓存双写
- 与便民服务下单流程打通，支持地址选择器弹窗

### 1.2 MVP 边界（明确不做）

- ❌ 地址标签（如「家」「公司」）— 仅展示联系人名
- ❌ 桌面端后台地址管理 — 无桌面端页面
- ❌ 地址自动补全/地图选点 — 纯文本输入
- ❌ 地址搜索功能
- ❌ 地址批量操作（批量删除/导出）
- ❌ 地址使用历史统计
- ❌ 删除二次确认弹窗 — 当前点击即删，无确认环节

### 1.3 已知问题（待修复）

- ❗ 后端 `addresses` 表缺少 `name` 和 `phone` 字段，CRUD 处理器在 INSERT/UPDATE 时会自动过滤掉表中不存在的字段。因此 `name` 和 `phone` 仅存储在 localStorage 中，刷新页面后从后端重新加载时会丢失。建议在 `schema.sql` 中补充这两个字段。

---

## 二、核心用户角色

| 角色 | 端 | 核心诉求 |
|------|----|---------|
| **C 端游客** | C 端小程序 | 新增/编辑收货地址、设置默认地址、删除不再使用的地址 |

---

## 三、核心业务流程

### 3.1 新增地址流程

```
用户在 AddressListPage 点击「添加新地址」
       │
       ▼
跳转 AddressEditPage（路由 /c/addresses/edit/new）
       │
       ▼
填写表单：
  1. 联系人（必填）
  2. 手机号（必填，正则 /^1\d{10}$/ 校验）
  3. 所在区域（预填云南省/丽江市/古城区，三个独立 input 可修改）
  4. 详细地址（必填，多行文本域）
  5. 默认地址开关（toggle 组件，若用户尚无地址则自动设为默认）
       │
       ▼
点击「保存地址」→ 前端表单校验
       │
       ▼
调 upsert(addr) → POST /api/v1/addresses
    → syncAction 同步服务端结果到本地 state
    → localStorage 持久化缓存
       │
       ▼
toast 提示「地址已新增」→ navigate 回 /c/addresses
```

### 3.2 编辑地址流程

```
用户在 AddressListPage 点击「编辑」
       │
       ▼
跳转 AddressEditPage（路由 /c/addresses/edit/:id）
       │
       ▼
表单回填当前地址数据（useEffect 从 store 读取 editing 地址）
       │
       ▼
修改后点击「保存地址」
       │
       ▼
调 upsert(addr) → PATCH /api/v1/addresses/:id
    → syncAction 同步
       │
       ▼
toast 提示「地址已更新」→ navigate 回 /c/addresses
```

### 3.3 设置默认地址流程

```
用户在 AddressListPage 点击地址卡片的「设为默认」按钮
       │
       ▼
仅当该地址尚未设为默认时允许操作（按钮 disable 状态）
       │
       ▼
调 setDefault(id) → 遍历用户所有地址
    → 对原默认地址 PATCH isDefault=false
    → 对目标地址 PATCH isDefault=true
       │
       ▼
syncAction 同步后本地 state 更新（只保留目标地址 isDefault=true）
       │
       ▼
toast 提示「已设为默认地址」
```

### 3.4 删除地址流程（无确认弹窗）

```
用户在 AddressListPage 点击地址卡片的「删除」按钮
       │
       ▼
直接调 remove(id) → DELETE /api/v1/addresses/:id
    → syncAction 同步
       │
       ▼
toast 提示「已删除」→ 列表实时移除

⚠️ 无二次确认弹窗，点击即删
```

### 3.5 便民服务地址选择流程

```
用户在便民服务下单页（ServicesPage）填写地址
       │
       ▼
弹窗展示地址列表（半屏 picker，含 start/end 地址选择模式）
       │
       ├── 选择已有地址 → 闭弹窗，回填联系人/电话/地址
       └── 点击「新增地址」→ navigate("/c/addresses/edit/new") 跳转新增页
       │
       ▼
地址选择器支持两种模式：
  - "start" 模式：选择服务起点地址
  - "end" 模式：选择服务终点地址（行李搬运等点对点服务）
```

---

## 四、功能模块清单

### P0 — 核心闭环（必须）

| 模块 | 端 | 功能 | 状态 | 说明 |
|------|----|------|------|------|
| 地址 CRUD | Server | POST/PATCH/DELETE /api/v1/addresses | ✅ | 通用 CRUD 路由，`filters: ["userId"]` |
| 地址列表页 | C 端 | 展示用户所有地址，含脱敏手机号/完整地址/默认标识 | ✅ | 路由 `/c/addresses` |
| 新增地址页 | C 端 | 表单填写联系人/手机号/区域/详细地址/默认开关 | ✅ | 路由 `/c/addresses/edit/new` |
| 编辑地址页 | C 端 | 表单回填已有地址数据，修改后保存 | ✅ | 路由 `/c/addresses/edit/:id` |
| 删除地址 | C 端 | 点击删除按钮直接删除 + toast 反馈 | ✅ | **无二次确认弹窗** |
| 设置默认 | C 端 | 点击「设为默认」按钮，遍历更新两个地址 | ✅ | 仅非默认地址可操作（已默认状态按钮 disable） |

### P1 — 前端增强

| 模块 | 端 | 功能 | 状态 | 说明 |
|------|----|------|------|------|
| 手机号脱敏 | C 端 | 展示格式 `138****0001` | ✅ | 正则 `(\d{3})\d{4}(\d{4})` 脱敏 |
| 默认地址标识 | C 端 | 地址卡片显示蓝色「默认」标签 | ✅ | 蓝色 bg-primary pill |
| 空状态展示 | C 端 | 无地址时显示「暂无收货地址」 | ✅ | 纯文本提示 |
| 表单必填校验 | C 端 | 联系人/手机号/详细地址为空时 toast 报错 | ✅ | 前端校验 |
| 手机号格式校验 | C 端 | 非 11 位手机号报错「请填写正确的手机号」 | ✅ | 正则校验 |
| 默认地址自动设定 | C 端 | 用户首个地址自动设为默认 | ✅ | 通过 `userAddresses.length === 0` 判断 |
| 固定底部保存按钮 | C 端 | 编辑页底部固定「保存地址」按钮，带安全区域适配 | ✅ | `pb-[calc(env(safe-area-inset-bottom)+12px)]` |
| 固定底部添加按钮 | C 端 | 列表页底部固定「添加新地址」按钮 | ✅ | 带渐变背景过渡 |
| 分页加载 | C 端 | 每次展示 6 条，点击加载更多 | ✅ | useLoadMore hook（前端切片，非服务端分页） |
| localStorage 持久化 | C 端 | 地址数据同步缓存到 localStorage | ✅ | zustand persist 中间件，key: `lijiang-addresses` |
| 便民服务地址选择器 | C 端 | 半屏弹窗选择地址，支持起点/终点模式 | ✅ | ServicesPage 内嵌 picker |
| 新地址跳转 | C 端 | 地址选择器内「新增地址」跳转到编辑页 | ✅ | navigate("/c/addresses/edit/new") |

### P2 — 增强体验（可等待）

| 模块 | 端 | 功能 | 状态 | 说明 |
|------|----|------|------|------|
| 桌面端地址管理 | Desktop | 后台查看/删除用户地址 | ❌ | 无桌面端实现 |
| 删除确认弹窗 | C 端 | 删除前二次确认 | ❌ | 当前直接删除 |
| 地址标签 | C 端 | 家/公司/客栈等标签 | ❌ | 未实现 |
| 地址排序 | C 端 | 拖拽排序或按常用度排序 | ❌ | 未实现 |
| 地址搜索 | C 端 | 按地址关键字搜索 | ❌ | 未实现 |

---

## 五、核心数据模型

### 5.1 Address（地址）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | TEXT PK | 是 | 唯一标识，格式 `addresses_{timestamp}_{random}` |
| `userId` | TEXT | 是 | 用户 ID |
| `name` | TEXT | 是 | 联系人姓名 |
| `phone` | TEXT | 是 | 联系电话（11 位手机号） |
| `province` | TEXT | 是 | 省份，默认「云南省」 |
| `city` | TEXT | 是 | 城市，默认「丽江市」 |
| `district` | TEXT | 是 | 区县，默认「古城区」 |
| `detail` | TEXT | 是 | 详细地址（街道/门牌号/院落名称等） |
| `isDefault` | INTEGER | 是 | 是否默认地址（0/1） |

### 5.2 实体关系

```
addresses (id 主键)
    ↓ userId
users（用户账号）
```

同一用户可有多个地址，但只有一个 isDefault=1（由前端 setDefault 逻辑保证，服务端无 UNIQUE 约束）。

### 5.3 数据库表结构（SQLite）

```sql
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  province TEXT DEFAULT '',
  city TEXT DEFAULT '',
  district TEXT DEFAULT '',
  detail TEXT NOT NULL,
  isDefault INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(userId);
```

### 5.4 前后端字段差异（已知问题）

前端 `Address` 类型包含 `name` 和 `phone` 字段，但后端 SQLite 表缺少这两列。CRUD 处理器（`routes/crud.js`）在写入时通过 `PRAGMA table_info` 探测实际表字段，自动过滤掉表中不存在的字段。因此：

- 新增/编辑地址时，前端发送的 `name` 和 `phone` 被后端**静默丢弃**
- `name` 和 `phone` 仅存储在 zustand localStorage 中
- 刷新页面后 `useApiHydrate` 从后端重新加载数据，`name` 和 `phone` 丢失

**建议修复**：在 `schema.sql` 的 `addresses` 表增加：

```sql
name TEXT NOT NULL DEFAULT '',
phone TEXT NOT NULL DEFAULT '',
```

### 5.5 API 接口

| 方法 | 路径 | 说明 | 备注 |
|------|------|------|------|
| GET | `/api/v1/addresses?userId=xxx` | 按用户查询地址列表 | 支持 `pageSize`/`page` 分页，默认 `sort=-createdAt` |
| GET | `/api/v1/addresses/:id` | 查询单个地址 | |
| POST | `/api/v1/addresses` | 新增地址 | 自动生成 id 和 createdAt |
| PATCH | `/api/v1/addresses/:id` | 更新地址 | 只保留表中存在的字段 |
| DELETE | `/api/v1/addresses/:id` | 删除地址 | 物理删除 |

### 5.6 种子数据

服务端 `seed.js` 预置 3 条地址数据覆盖 2 个用户：

```javascript
{ id: "addr_1", userId: "u_c_001", province: "云南省", city: "丽江市", district: "古城区", detail: "五一街文治巷88号", isDefault: 1 },
{ id: "addr_2", userId: "u_c_001", province: "云南省", city: "丽江市", district: "古城区", detail: "四方街12号", isDefault: 0 },
{ id: "addr_3", userId: "u_c_s_001", province: "云南省", city: "丽江市", district: "古城区", detail: "七一街兴文巷", isDefault: 1 },
```

> 注意：种子数据不包含 `name` 和 `phone`（表字段缺失），应用启动后需用户自行编辑补充。

### 5.7 数据流

```
前端操作（upsert/remove/setDefault）
  │
  ├── 悲观更新模式（syncAction）:
  │     1. 调用后端 API
  │     2. 成功 → 用返回值更新 zustand store → localStorage 持久化
  │     3. 失败 → toast 报错，本地 state 不变
  │
  └── 应用启动（useApiHydrate）:
        1. 并行拉取所有资源数据
        2. useAddressStore.setState({ addresses: r[20] })
        3. 后端不可用 → setState({ addresses: [] })，toast 提示
```

---

## 六、验收标准

### 6.1 功能验收

| # | 用例 | 预期结果 | 状态 |
|---|------|---------|------|
| 1 | C 端游客进入 `/c/addresses` | 展示用户所有地址列表，含脱敏手机号和完整地址 | ✅ |
| 2 | 无地址时进入列表页 | 展示「暂无收货地址」空状态 | ✅ |
| 3 | 点击「添加新地址」 | 跳转至 `/c/addresses/edit/new`，区域预填云南省/丽江市/古城区（三个独立 input 可编辑） | ✅ |
| 4 | 新增地址时联系人为空点击保存 | toast 提示「请填写联系人」，不跳转 | ✅ |
| 5 | 新增地址时手机号非 11 位点击保存 | toast 提示「请填写正确的手机号」，不跳转 | ✅ |
| 6 | 新增地址时详细地址为空点击保存 | toast 提示「请填写详细地址」，不跳转 | ✅ |
| 7 | 新增地址表单完整点击保存 | 调 POST 创建，toast「地址已新增」，跳回列表页显示新地址 | ✅ |
| 8 | 点击地址的「编辑」按钮 | 跳转至 `/c/addresses/edit/:id`，表单回填当前数据 | ✅ |
| 9 | 编辑地址后保存 | 调 PATCH 更新，toast「地址已更新」，列表展示新内容 | ✅ |
| 10 | 点击地址的「删除」按钮 | 调 DELETE 删除，toast「已删除」，列表移除 | ✅ |
| 11 | 点击非默认地址的「设为默认」 | 调 PATCH 更新两个地址，toast「已设为默认地址」，UI 更新 | ✅ |
| 12 | 点击已经是默认的地址的「设为默认」 | 无操作（按钮无响应，代码中通过 `if (!a.isDefault)` 守卫） | ✅ |
| 13 | 地址超过 6 条 | 显示「加载更多」按钮，点击追加 | ✅ |
| 14 | 地址不足 6 条 | 不显示「加载更多」 | ✅ |
| 15 | 用户首个地址自动为默认 | 保存后地址卡片显示「默认」标签（toggle 自动为 true） | ✅ |
| 16 | 手机号展示脱敏 | 如 `13800001002` 展示为 `138****0002` | ✅ |
| 17 | 默认地址展示蓝色标签 | 地址卡片右上角显示 `bg-primary` 的「默认」pill | ✅ |
| 18 | 便民服务下单选择地址 | 弹窗展示所有地址，可点击选择，支持起点/终点模式 | ✅ |
| 19 | 便民服务地址选择器「新增地址」 | 跳转到 `/c/addresses/edit/new`，保存后回到下单页 | ✅ |
| 20 | 区域字段可编辑 | 省/市/区为 input 输入框，非只读展示 | ✅ |
| 21 | 桌面端地址管理 | 无桌面端页面可管理地址 | ❌ |
| 22 | 删除前二次确认 | 无确认弹窗，点击即删除 | ❌ |

### 6.2 数据验收

| # | 检查项 | 状态 |
|---|-------|------|
| 1 | addresses 表支持 userId 过滤查询 | ✅ |
| 2 | 地址种子数据 3 条，覆盖 2 个用户 | ✅ |
| 3 | localStorage 缓存在 zustand persist 中持久化（key: `lijiang-addresses`） | ✅ |
| 4 | 服务端 addresses 表含 isDefault 列 | ✅ |
| 5 | 服务端 addresses 表缺少 name/phone 列（待修复） | ❌ |
| 6 | 启动时 useApiHydrate 从后端加载地址数据 | ✅ |

### 6.3 非功能验收

| # | 检查项 | 状态 |
|---|-------|------|
| 1 | 所有写操作使用 syncAction 模式（悲观更新）：先发请求，成功后更新本地 state，失败 toast 报错不回滚本地 state | ✅ |
| 2 | 地址列表通过 `useMemo` 按 userId 过滤，避免不必要渲染 | ✅ |
| 3 | 分页为前端 useLoadMore 切片（每次 6 条），非服务端分页 | ✅ |
| 4 | 编辑页表单通过 useEffect 回填编辑数据 | ✅ |
| 5 | 区域三级输入框使用纯文本 input（非级联选择器），可编辑 | ✅ |
| 6 | setDefault 遍历更新所有地址（循环内逐个 PATCH），非批量接口 | ✅ |
| 7 | 共 18 个并行 API 调用参与 hydration，地址在第 20 位（索引 20） | ✅ |

---

## 七、依赖关系

### 7.1 内部依赖

| 依赖 Feature | 说明 |
|-------------|------|
| 权限认证（auth）| 地址操作需要当前 userId，列表通过 `useAuthStore((s) => s.user)` 获取当前用户 ID |
| 便民服务（convenience）| 地址数据供便民服务下单时选择（`ServicesPage.tsx` 通过 `useAddressStore` 消费，支持地址选择器弹窗）|

### 7.2 外部依赖

| 依赖 | 说明 |
|------|------|
| 通用 CRUD 路由 | 依赖 `server/routes/crud.js` 的标准 CRUD 实现（含自动字段过滤、布尔序列化）|
| API 客户端 | 依赖 `addressesApi` 封装（list / create / update / remove）|
| syncAction 模式 | 依赖 `src/api/sync.ts` 同步包装（悲观更新策略）|
| zustand persist | 依赖 `zustand/middleware` 的 persist 做 localStorage 持久化（key: `lijiang-addresses`）|
| useApiHydrate | 应用启动时从 `/api/v1/addresses?pageSize=200` 加载全量地址数据 |
| SQLite 数据库 | 地址持久化依赖 `addresses` 表（`schema.sql` 第 370-381 行）|

---

## 八、项目文件索引

### 核心实现

- `src/features/address/store/address-store.ts` — Zustand store（CRUD + setDefault，含 persist 中间件，key: `lijiang-addresses`）
- `src/features/address/store/index.ts` — barrel export
- `src/features/address/c-end/pages/AddressListPage.tsx` — C 端地址列表页（路由 `/c/addresses`）
- `src/features/address/c-end/pages/AddressEditPage.tsx` — C 端地址编辑/新增页（路由 `/c/addresses/edit/:id`）

### 服务端

- `server/index.js` — `addresses` 挂载到通用 CRUD 路由（`/api/v1/addresses`，`filters: ["userId"]`，第 78 行）
- `server/routes/crud.js` — 通用 CRUD 实现（GET/POST/PATCH/DELETE，含自动布尔序列化、字段过滤）
- `server/db/schema.sql` — `addresses` 表 DDL（第 370-381 行，**缺少 name/phone 字段**）
- `server/db/seed.js` — 3 条种子地址数据（第 284-288 行）

### API 客户端

- `src/api/client.ts` — `addressesApi` 封装（list / create / update / remove，第 219-223 行）
- `src/api/hydrate.ts` — 全量 hydration：加载地址数据（第 57、92、127 行）
- `src/api/sync.ts` — 悲观更新同步包装

### 共享类型

- `src/shared/types/index.ts` — `Address` 类型定义（id / userId / name / phone / province / city / district / detail / isDefault，第 307-317 行）

### 共享 Hooks

- `src/shared/hooks/useLoadMore.ts` — 前端分页加载 hook（每次 6 条）

### 路由配置

- `src/c-end/routes.tsx` — 懒加载 `AddressListPage`（`/c/addresses`，第 246 行）和 `AddressEditPage`（`/c/addresses/edit/:id`，第 247 行）

### 消费方

- `src/features/convenience/c-end/pages/ServicesPage.tsx` — 便民服务下单页，内嵌地址选择器弹窗，通过 `useAddressStore` 读取地址列表