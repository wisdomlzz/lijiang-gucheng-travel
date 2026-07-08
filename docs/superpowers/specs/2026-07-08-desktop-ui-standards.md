# 桌面端 UI 规范

> **版本**：v1.0 · 2026-07-08

## 桌面端页面统一模式

每个桌面端管理页面都必须实现以下三要素：

### 1. 搜索栏
```tsx
<div className="relative w-64">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
  <Input placeholder="搜索关键词..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 h-9 text-sm" />
</div>
```

### 2. 筛选按钮组
```tsx
<div className="flex gap-1">
  {([/* ... */] as const).map((tab) => (
    <button key={tab} onClick={() => setFilter(tab)}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === tab ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"}`}>
      {label}
    </button>
  ))}
</div>
```

### 3. 分页
```tsx
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
// 在组件中:
const pagination = usePagination(filteredList, 10)
// 在表格下方:
<PaginationBar page={pagination.currentPage} totalPages={pagination.totalPages}
  onPageChange={pagination.setCurrentPage} pageSize={10} ... />
```

### 当前覆盖进度

| 页面 | 搜索 | 筛选 | 分页 | CRUD |
|------|------|------|------|------|
| ConvenienceStaffPage | ✅ | ✅ | ✅ | ✅ |
| VolunteerManagePage | ✅ | ✅ | ✅ | ✅ |
| ConveniencePage | ✅ | ✅ | ✅ | ✅ |
| BookingManagePage | ✅ | ✅ | ✅ | ✅ |
| SettlementPage | ✅ | ✅ | ✅ | ✅ |
| ComplaintPage | ✅ | ✅ | ✅ | - |
| ReviewManagementPage | ✅ | ✅ | ✅ | - |
| AIKnowledgeBasePage | ✅ | - | ✅ | ✅ |
| StaffReviewPage | ✅ | - | ✅ | ✅ |
| AnnouncementManagePage | ✅ | ✅ | - | ✅ |
| MerchantReviewPage | - | ✅ | - | - |
| PointRulesPage | - | - | - | ✅ |
| ZoneManagementPage | - | - | - | ✅ |
| TrustScoreConfigPage | - | - | - | ✅ |
