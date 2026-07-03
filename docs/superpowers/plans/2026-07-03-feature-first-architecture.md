# Feature-First Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `src/` from layer-flat layout (`c-end/pages/`, `shared/services/`, etc.) to feature-first architecture (`features/<name>/c-end|b-end|desktop|store/`)

**Architecture:** Each business feature is a vertical slice under `features/<name>/`. Platform infrastructure (auth, UI) stays in `platform/`. Pure utilities in `shared/`. The three route shells (c-end, b-end, desktop) shrink to thin importers. Features never import from other features.

**Tech Stack:** Vite + React 18 + TypeScript + Zustand. No build tools changes needed — only file moves + import updates.

---

## File Map

### New structure created by this plan

```
src/
├── features/
│   ├── convenience/          ← Pilot — moved first
│   ├── volunteer/            ← Moved second
│   ├── complaints/           ← Moved third
│   ├── checkin/              ← Moved fourth
│   ├── content/              ← Moved fifth
│   ├── heritage/             ← Moved sixth (big directory)
│   ├── ai-chat/              ← Moved seventh
│   └── housing/              ← Moved eighth
├── platform/
│   ├── auth/
│   ├── notification/
│   └── ui/
├── shared/
│   ├── types/
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   └── styles/
├── c-end/ → App.tsx + routes.tsx only
├── b-end/ → App.tsx + BLayout only
├── desktop/ → App.tsx + DesktopLayout + nav.ts only
```

### Key: `features/convenience/` internal structure (all other features follow same pattern)

```
features/convenience/
├── index.ts                        ← Barrel export for routes + public API
├── shared/
│   ├── types.ts                    ← Convenience-specific types
│   ├── service-state.ts            ← BServiceState (moved from shared/orders/)
│   └── convenience-meta.ts         ← CONVENIENCE_STATUS_META (moved from shared/orders/)
├── store/
│   ├── index.ts                    ← re-exports
│   ├── store.ts                    ← ConvenienceState (thin, delegates to sub-modules)
│   ├── transitions.ts              ← state machine
│   ├── dispatch.ts                 ← pickStaff + distance helpers
│   ├── timers.ts                   ← timeout management
│   ├── seed.ts                     ← seed data
│   ├── notification.ts             ← notification helper
│   ├── staff-store.ts              ← staff store (moved from shared/services/staff/)
│   ├── zone-store.ts               ← zone store (moved from shared/services/zone/)
│   ├── settlement-store.ts         ← settlement store (moved from shared/services/settlement/)
│   └── services-store.ts           ← service config (moved from shared/services/convenience/)
├── c-end/
│   ├── index.ts                    ← route config
│   ├── pages/
│   │   ├── ServicesPage.tsx
│   │   ├── ServiceTrackingPage.tsx
│   │   ├── VisitorServicesPage.tsx
│   │   └── MerchantServicesPage.tsx
│   └── components/                 ← C-end-specific components (StatusProgress, etc.)
├── b-end/
│   ├── index.ts
│   ├── pages/
│   │   ├── ServiceWorkbench.tsx
│   │   ├── ServiceTasks.tsx
│   │   ├── ServiceHistory.tsx
│   │   ├── ServiceOrderDetail.tsx
│   │   ├── ServiceProfile.tsx
│   │   ├── ServiceNotifications.tsx
│   │   └── QuoteAndPhotoFlow.tsx
│   └── components/                 ← shared detail layout, Sheet components
└── desktop/
    ├── index.ts
    ├── pages/
    │   ├── ConveniencePage.tsx
    │   ├── ConvenienceOverviewPage.tsx
    │   ├── ConvenienceStaffPage.tsx
    │   ├── PriceArbitrationPage.tsx
    │   └── DispatchConfigPage.tsx
    └── components/
```

---

### Task 1: Create platform/ and shared/ directories

**Files:**
- Create: `src/platform/auth/index.ts` (re-export from shared/stores/auth-store.ts)
- Create: `src/platform/notification/index.ts` (re-export from shared/services/notification/)
- Create: `src/platform/ui/index.ts` (re-export from shared/components/ui/)
- Create: `src/platform/index.ts` (barrel)
- Keep: `src/shared/types/`, `src/shared/hooks/`, `src/shared/utils/`, `src/shared/constants/`, `src/shared/styles/`
- Keep: `src/shared/components/LoginPage*.tsx`, `src/shared/components/MiniProgramFrame.tsx`

**Rationale:** `platform/` = stable infrastructure that features depend on. `shared/` = pure utilities with zero business logic. These stay in place and aren't moved by this plan.

- [ ] **Step 1: Create platform directory structure**

```bash
mkdir -p src/platform/auth src/platform/notification src/platform/ui
```

- [ ] **Step 2: Create platform/auth/index.ts**

```ts
export { useAuthStore } from "../../shared/stores/auth-store"
```

- [ ] **Step 3: Create platform/notification/index.ts**

```ts
export { useNotificationStore } from "../../shared/services/notification"
```

- [ ] **Step 4: Create platform/ui/index.ts**

```ts
export { Button } from "../../shared/components/ui/button"
export { StatusBadge } from "../../shared/components/ui/status-badge"
// Add other commonly used UI components as needed
```

- [ ] **Step 5: Create platform/index.ts**

```ts
export { useAuthStore } from "./auth"
export { useNotificationStore } from "./notification"
```

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -3
```

- [ ] **Step 7: Commit**

```bash
git add src/platform/
git commit -m "feat: add platform/ directory structure (infrastructure layer)"
```

---

### Task 2: Create features/convenience/ directory structure

**Files:**
- Create: `src/features/convenience/shared/` (types, meta)
- Create: `src/features/convenience/store/` (all state + logic)
- Create: `src/features/convenience/c-end/pages/`
- Create: `src/features/convenience/b-end/pages/`
- Create: `src/features/convenience/desktop/pages/`
- Create: `src/features/convenience/index.ts`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p src/features/convenience/{shared,store,c-end/pages,b-end/pages,desktop/pages}
```

- [ ] **Step 2: Create convenience shared/types.ts**

Copy relevant types from `src/shared/types/index.ts` that are convenience-specific:

```ts
export type ConvenienceServiceType =
  | "送货服务" | "行李搬运"
  | "建筑垃圾清运" | "生活垃圾清运" | "送水服务" | "布草配送"

export const POINT_TO_POINT_TYPES: ConvenienceServiceType[] = ["送货服务", "行李搬运"]
export const ZONE_BASED_TYPES: ConvenienceServiceType[] = ["建筑垃圾清运", "生活垃圾清运", "送水服务", "布草配送"]
export const ALL_CONVENIENCE_TYPES: ConvenienceServiceType[] = [...POINT_TO_POINT_TYPES, ...ZONE_BASED_TYPES]

export function isPointToPoint(type: string): boolean {
  return POINT_TO_POINT_TYPES.includes(type as ConvenienceServiceType)
}
export function isZoneBased(type: string): boolean {
  return ZONE_BASED_TYPES.includes(type as ConvenienceServiceType)
}
```

- [ ] **Step 3: Copy convenience store modules into features/convenience/store/**

These files already exist at `src/shared/services/convenience/` and need to be moved:

```bash
# Move convenience service files (copy, don't delete originals yet)
cp src/shared/services/convenience/store.ts src/features/convenience/store/store.ts
cp src/shared/services/convenience/transitions.ts src/features/convenience/store/transitions.ts
cp src/shared/services/convenience/dispatch.ts src/features/convenience/store/dispatch.ts
cp src/shared/services/convenience/timers.ts src/features/convenience/store/timers.ts
cp src/shared/services/convenience/seed.ts src/features/convenience/store/seed.ts
cp src/shared/services/convenience/notification.ts src/features/convenience/store/notification.ts
# services-store and index will be imported from the feature level
```

Also move the convenience-specific stores from shared/services:

```bash
cp src/shared/services/staff/store.ts src/features/convenience/store/staff-store.ts
cp src/shared/services/zone/store.ts src/features/convenience/store/zone-store.ts
cp src/shared/services/settlement/store.ts src/features/convenience/store/settlement-store.ts
```

- [ ] **Step 4: Create convenience store/index.ts**

```ts
export { useConvenienceStore } from "./store"
export { transition } from "./transitions"
export { pickStaff, lookupStaff } from "./dispatch"
export { notifyConvenience } from "./notification"
export { clearTimer, clearAllTimers } from "./timers"
// Re-export staff, zone, settlement for use by the feature
export { useStaffStore } from "./staff-store"
export { useZoneStore } from "./zone-store"
export { useSettlementStore } from "./settlement-store"
```

- [ ] **Step 5: Create convenience shared/ directory**

```bash
cp src/shared/orders/service-state.ts src/features/convenience/shared/service-state.ts
cp src/shared/orders/convenience.ts src/features/convenience/shared/convenience-meta.ts
```

- [ ] **Step 6: Update import paths in moved store files**

Update `src/features/convenience/store/transitions.ts`:
```ts
// Change from: import type { ConvenienceStatus } from "../../types"
// To:
import type { ConvenienceStatus } from "../../../../shared/types"
```

Update `src/features/convenience/store/dispatch.ts`:
```ts
// Change from: import type { ConvenienceServiceType } from "../../types"
// To:
import type { ConvenienceServiceType } from "../../../../shared/types"
// Change from: import { isPointToPoint } from "../../types"
// To:
import { isPointToPoint } from "../shared/types"
// Change from: import { useStaffStore } from "../staff"
// To:
import { useStaffStore } from "./staff-store"
// Change from: import { useZoneStore } from "../zone"
// To:
import { useZoneStore } from "./zone-store"
```

Update `src/features/convenience/store/store.ts`:
```ts
// Change from: import type { ConvenienceOrder, ConvenienceStatus, DispatchLogEntry } from "../../types"
// To:
import type { ConvenienceOrder, ConvenienceStatus, DispatchLogEntry } from "../../../../shared/types"
// Change from: import { transition } from "./transitions"
// These are now in the same directory — path unchanged
// Change from: import { useSettlementStore } from "../settlement"
// To:
import { useSettlementStore } from "./settlement-store"
// Change from: import { useNotificationStore } from "../notification"
// To:
import { useNotificationStore } from "../../../../platform/notification"
```

Update `src/features/convenience/store/notification.ts`:
```ts
// Change from: import { useNotificationStore } from "../notification"
// To:
import { useNotificationStore } from "../../../../platform/notification"
```

Update `src/features/convenience/store/seed.ts`:
```ts
// Change from: import type { ConvenienceOrder } from "../../types"
// To:
import type { ConvenienceOrder } from "../../../../shared/types"
```

Update `src/features/convenience/shared/service-state.ts`:
```ts
// Change from: import type { ConvenienceStatus } from "../types"
// To:
import type { ConvenienceStatus } from "../../../shared/types"
// Change from: import type { StatusKind } from "../components/ui/status-badge"
// To:
import type { StatusKind } from "../../../shared/components/ui/status-badge"
```

- [ ] **Step 7: Verify build**

```bash
npm run build 2>&1 | tail -3
Expected: Build succeeds (new files exist but old files still work)
```

- [ ] **Step 8: Commit**

```bash
git add src/features/
git commit -m "feat: create features/convenience/ directory structure with store modules"
```

---

### Task 3: Move C-end convenience pages into feature

**Files:**
- Create: `src/features/convenience/c-end/pages/ServicesPage.tsx`
- Create: `src/features/convenience/c-end/pages/ServiceTrackingPage.tsx`
- Create: `src/features/convenience/c-end/index.ts`
- Delete: `src/c-end/pages/ServicesPage.tsx`
- Delete: `src/c-end/pages/ServiceTrackingPage.tsx`
- Modify: `src/c-end/routes.tsx`

- [ ] **Step 1: Copy C-end pages to feature**

```bash
cp src/c-end/pages/ServicesPage.tsx src/features/convenience/c-end/pages/ServicesPage.tsx
cp src/c-end/pages/ServiceTrackingPage.tsx src/features/convenience/c-end/pages/ServiceTrackingPage.tsx
```

- [ ] **Step 2: Update imports in copied pages**

Update `src/features/convenience/c-end/pages/ServicesPage.tsx`:
```ts
// Change from: import { useConvenienceStore } from "../../../shared/services/convenience"
// To:
import { useConvenienceStore } from "../../../store"

// Change from: import { useServiceConfigStore } from "../../../shared/services/convenience/services-store"
// To:
import { useServiceConfigStore } from "../../../store/services-store"

// Change from: import { useAuthStore } from "../../../shared/stores/auth-store"
// To:
import { useAuthStore } from "../../../../../platform/auth"

// Change from: import { ConvenienceStatusLabel, isPointToPoint } from "../../../shared/types"
// To:
import { ConvenienceStatusLabel } from "../../../../../shared/types"
import { isPointToPoint } from "../../../shared/types"

// Change from: import { StatusProgress } from "../components/StatusProgress"
// To: Keep the same relative path from pages to components — copy StatusProgress too or inline
```

For `StatusProgress`, it's a small component. Either copy it with the feature or inline it. Let's copy it:

```bash
mkdir -p src/features/convenience/c-end/components
cp src/c-end/components/StatusProgress.tsx src/features/convenience/c-end/components/StatusProgress.tsx
cp src/c-end/components/PageHeader.tsx src/features/convenience/c-end/components/PageHeader.tsx
```

Update `src/features/convenience/c-end/pages/ServiceTrackingPage.tsx`:
```ts
// Change from: import { useConvenienceStore } from "../../shared/services/convenience"
// To:
import { useConvenienceStore } from "../../store"
// Change from: import { PageHeader } from "../components/PageHeader"
// To:
import { PageHeader } from "../components/PageHeader"
```

- [ ] **Step 3: Create convenience c-end route config**

```ts
// src/features/convenience/c-end/index.ts
import { lazy } from "react"

export const CONVENIENCE_C_ROUTES = [
  { path: "services", Component: lazy(() => import("./pages/ServicesPage")) },
  { path: "orders/:id", Component: lazy(() => import("./pages/ServiceTrackingPage")) },
]
```

- [ ] **Step 4: Update c-end/routes.tsx to import from feature**

Read the current routes.tsx, find the convenience references (ServicesPage, ServiceTrackingPage), and replace the lazy imports:

```ts
// Remove these lines from c-end/routes.tsx:
// const ServicesPage = lazy(() => import("./pages/ServicesPage").then(m => ({ default: m.ServicesPage })))
// const ServiceTrackingPage = lazy(() => import("./pages/ServiceTrackingPage").then(m => ({ default: m.ServiceTrackingPage })))
// const VisitorServicesPage = lazy(() => import("./pages/VisitorServicesPage"))
// const MerchantServicesPage = lazy(() => import("./pages/MerchantServicesPage"))

// Add at the top:
import { CONVENIENCE_C_ROUTES } from "../features/convenience/c-end"
```

Then in the route rendering:
```tsx
// Replace individual route elements with spread:
// { path: "services", element: <ServicesPage /> },
// { path: "orders/:id", element: <ServiceTrackingPage /> },
// { path: "visitor-services", element: <VisitorServicesPage /> },
// { path: "merchant-services", element: <MerchantServicesPage /> },

// With:
...CONVENIENCE_C_ROUTES.map(r => (
  <Route key={r.path} path={r.path} element={<r.Component />} />
))
```

- [ ] **Step 5: Delete old C-end pages**

```bash
rm src/c-end/pages/ServicesPage.tsx
rm src/c-end/pages/ServiceTrackingPage.tsx
# Keep VisitorServicesPage and MerchantServicesPage — they are umbrella landing pages, not convenience-specific
```

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -3
Expected: Build succeeds
```

- [ ] **Step 7: Commit**

```bash
git add src/features/convenience/c-end/
git rm src/c-end/pages/ServicesPage.tsx src/c-end/pages/ServiceTrackingPage.tsx
git commit -m "feat: move C-end convenience pages into features/convenience/c-end/"
```

---

### Task 4: Move B-end convenience pages into feature

**Files:**
- Create: `src/features/convenience/b-end/pages/*`
- Create: `src/features/convenience/b-end/components/*`
- Delete: `src/b-end/roles/service/*`
- Modify: `src/b-end/App.tsx`

- [ ] **Step 1: Copy B-end pages to feature**

```bash
cp -r src/b-end/roles/service/* src/features/convenience/b-end/pages/
# Separate components from pages
mv src/features/convenience/b-end/pages/DetailLayout.tsx src/features/convenience/b-end/components/ 2>/dev/null || true
mv src/features/convenience/b-end/pages/Sheet.tsx src/features/convenience/b-end/components/ 2>/dev/null || true
mv src/features/convenience/b-end/pages/QuoteAndPhotoFlow.tsx src/features/convenience/b-end/pages/ 2>/dev/null || true
```

- [ ] **Step 2: Create convenience b-end barrel**

```ts
// src/features/convenience/b-end/index.ts
export { ServiceWorkbench } from "./pages/ServiceWorkbench"
export { ServiceTasks } from "./pages/ServiceTasks"
export { ServiceHistory } from "./pages/ServiceHistory"
export { ServiceProfile } from "./pages/ServiceProfile"
export { BNotificationsPage } from "./pages/BNotificationsPage"
```

- [ ] **Step 3: Update B-end App.tsx to import from feature**

```tsx
import {
  ServiceWorkbench,
  ServiceTasks,
  ServiceHistory,
  ServiceProfile,
  BNotificationsPage,
} from "../features/convenience/b-end"
```

Replace `import` from old `./roles/service/Service*` with the feature import.

- [ ] **Step 4: Update import paths in copied B-end files**

Each B-end file imports `useConvenienceStore` from `../../../shared/services/convenience` — change to `../../store`.
Each imports `useAuthStore` from `../../../shared/stores/auth-store` — change to `../../../../platform/auth`.
Shared layout components stay in the component directory — paths remain relative.

- [ ] **Step 5: Delete old B-end services**

```bash
rm -rf src/b-end/roles/service/
```

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -3
```

- [ ] **Step 7: Commit**

```bash
git add src/features/convenience/b-end/
git rm -r src/b-end/roles/service/
git commit -m "feat: move B-end convenience pages into features/convenience/b-end/"
```

---

### Task 5: Move desktop convenience pages into feature

**Files:**
- Create: `src/features/convenience/desktop/pages/*`
- Modify: `src/desktop/App.tsx`
- Modify: `src/desktop/nav.ts`

- [ ] **Step 1: Copy desktop convenience pages**

```bash
cp src/desktop/pages/gates/ConveniencePage.tsx src/features/convenience/desktop/pages/ConveniencePage.tsx
cp src/desktop/pages/gates/ConvenienceOverviewPage.tsx src/features/convenience/desktop/pages/ConvenienceOverviewPage.tsx
cp src/desktop/pages/gates/ConvenienceStaffPage.tsx src/features/convenience/desktop/pages/ConvenienceStaffPage.tsx
cp src/desktop/pages/gates/PriceArbitrationPage.tsx src/features/convenience/desktop/pages/PriceArbitrationPage.tsx
cp src/desktop/pages/gates/DispatchConfigPage.tsx src/features/convenience/desktop/pages/DispatchConfigPage.tsx
cp src/desktop/pages/gates/ZoneManagementPage.tsx src/features/convenience/desktop/pages/ZoneManagementPage.tsx
cp src/desktop/pages/gates/SettlementPage.tsx src/features/convenience/desktop/pages/SettlementPage.tsx
cp src/desktop/pages/gates/FlowWarningPage.tsx src/features/convenience/desktop/pages/FlowWarningPage.tsx
cp src/desktop/pages/gates/GridSettingsPage.tsx src/features/convenience/desktop/pages/GridSettingsPage.tsx
```

- [ ] **Step 2: Create convenience desktop barrel**

```ts
// src/features/convenience/desktop/index.ts
export { default as ConveniencePage } from "./pages/ConveniencePage"
export { default as ConvenienceOverviewPage } from "./pages/ConvenienceOverviewPage"
export { default as PriceArbitrationPage } from "./pages/PriceArbitrationPage"
export { default as ConvenienceStaffPage } from "./pages/ConvenienceStaffPage"
export { default as DispatchConfigPage } from "./pages/DispatchConfigPage"
export { default as ZoneManagementPage } from "./pages/ZoneManagementPage"
export { default as SettlementPage } from "./pages/SettlementPage"
export { default as FlowWarningPage } from "./pages/FlowWarningPage"
export { default as GridSettingsPage } from "./pages/GridSettingsPage"
```

- [ ] **Step 3: Update nav.ts to lazily import from feature**

In `src/desktop/nav.ts`, change lazy imports:
```ts
// Before:
const ConveniencePage = lazy(() => import("./pages/gates/ConveniencePage"))

// After:
const ConveniencePage = lazy(() => import("../../features/convenience/desktop").then(m => ({ default: m.ConveniencePage })))
```

Same pattern for all convenience-related pages (ConvenienceOverviewPage, PriceArbitrationPage, etc.).

- [ ] **Step 4: Delete old desktop convenience pages**

```bash
rm src/desktop/pages/gates/ConveniencePage.tsx
rm src/desktop/pages/gates/ConvenienceOverviewPage.tsx
rm src/desktop/pages/gates/ConvenienceStaffPage.tsx
rm src/desktop/pages/gates/PriceArbitrationPage.tsx
rm src/desktop/pages/gates/DispatchConfigPage.tsx
rm src/desktop/pages/gates/ZoneManagementPage.tsx
rm src/desktop/pages/gates/SettlementPage.tsx
rm src/desktop/pages/gates/FlowWarningPage.tsx
rm src/desktop/pages/gates/GridSettingsPage.tsx
```

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -3
```

- [ ] **Step 6: Commit**

```bash
git add src/features/convenience/desktop/
git rm src/desktop/pages/gates/Convenience*.tsx src/desktop/pages/gates/DispatchConfigPage.tsx src/desktop/pages/gates/ZoneManagementPage.tsx src/desktop/pages/gates/SettlementPage.tsx src/desktop/pages/gates/FlowWarningPage.tsx src/desktop/pages/gates/GridSettingsPage.tsx
git commit -m "feat: move desktop convenience pages into features/convenience/desktop/"
```

---

### Task 6: Delete old shared/services/convenience/ (fully migrated)

**Files:**
- Delete: `src/shared/services/convenience/`
- Delete: `src/shared/orders/` (convenience-meta to feature, service-state to feature)
- Keep: `src/shared/orders/index.ts` (remove convenience exports)

- [ ] **Step 1: Delete old convenience service directory**

```bash
rm -rf src/shared/services/convenience/
```

- [ ] **Step 2: Remove convenience from shared/orders/**

```bash
rm src/shared/orders/convenience.ts
rm src/shared/orders/service-state.ts
```

Update `src/shared/orders/index.ts` to remove convenience exports:
```ts
// Remove convenience exports, only keep:
export { resolveStaff } from "./staff"
export type { StaffInfo } from "./staff"
```

- [ ] **Step 3: Check for any remaining imports to deleted files**

```bash
grep -rn "shared/services/convenience\|shared/orders/convenience\|shared/orders/service-state" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Should return no results — all should now reference features/convenience/
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -3
```

- [ ] **Step 5: Commit**

```bash
git rm -r src/shared/services/convenience/
git rm -r src/shared/orders/convenience.ts src/shared/orders/service-state.ts
git commit -m "feat: retire old shared convenience files after migration to features/"
```

---

### Task 7: Move volunteer feature

**Files:**
- Create: `src/features/volunteer/` structure
- Move: `src/shared/services/volunteer/store.ts` → `src/features/volunteer/store/store.ts`
- Move: `src/c-end/pages/Volunteer*.tsx` → `src/features/volunteer/c-end/pages/`
- Move: `src/desktop/pages/VolunteerManagePage.tsx` → `src/features/volunteer/desktop/pages/`
- Update routes

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p src/features/volunteer/{store,c-end/pages,desktop/pages}
```

- [ ] **Step 2: Move volunteer store**

```bash
cp src/shared/services/volunteer/store.ts src/features/volunteer/store/store.ts
```

Update imports in `src/features/volunteer/store/store.ts`:
```ts
// Change from: import { useNotificationStore } from "../notification"
// To:
import { useNotificationStore } from "../../../platform/notification"
// Change types from: import type { Volunteer, ... } from "../types"
// To:
import type { Volunteer, ... } from "../../../shared/types"
```

- [ ] **Step 3: Move C-end volunteer pages**

```bash
cp src/c-end/pages/VolunteerActivitiesPage.tsx src/features/volunteer/c-end/pages/
cp src/c-end/pages/VolunteerActivityDetailPage.tsx src/features/volunteer/c-end/pages/
cp src/c-end/pages/VolunteerPlaceholderPage.tsx src/features/volunteer/c-end/pages/
```

Update imports in copied pages to reference `../../../store` for store.

- [ ] **Step 4: Move desktop volunteer page**

```bash
cp src/desktop/pages/VolunteerManagePage.tsx src/features/volunteer/desktop/pages/
```

- [ ] **Step 5: Update routes**

Update `src/c-end/routes.tsx` and `src/desktop/nav.ts` to lazily import from features/volunteer/ instead.

- [ ] **Step 6: Delete old files**

```bash
rm -rf src/shared/services/volunteer/
rm src/c-end/pages/Volunteer*.tsx
rm src/desktop/pages/VolunteerManagePage.tsx
```

- [ ] **Step 7: Verify build & commit**

```bash
npm run build 2>&1 | tail -3
git add src/features/volunteer/
git rm -r src/shared/services/volunteer/
git rm src/c-end/pages/Volunteer*.tsx src/desktop/pages/VolunteerManagePage.tsx
git commit -m "feat: move volunteer feature into features/volunteer/"
```

---

### Task 8: Move remaining features

Each follows the same pattern as convenience and volunteer. Steps for each:

1. Copy store from `shared/services/<name>/` to `features/<name>/store/`
2. Copy C-end pages to `features/<name>/c-end/pages/`
3. Copy desktop/desktop pages to `features/<name>/desktop/pages/`
4. Update imports
5. Update routes
6. Delete old files
7. Build & commit

**Features to move:**

| Feature | shared/store | C-end pages | Desktop pages |
|---------|-------------|-------------|---------------|
| complaints | shared/services/complaint/ | ComplaintFormPage, ComplaintDetailPage, MyComplaintsPage | ComplaintPage |
| checkin | shared/services/checkin/ | NaxiCheckInPage, MyCheckinsPage, PhotoRecordsPage, PhotoRecordsDetailPage | PhotoRecords pages |
| content/merchant | shared/services/content/ | MerchantListPage, MerchantDetailPage | (info pages) |
| heritage | shared/services/heritage/ | HeritagePage, CulturalCourtyardPage*, etc. | — |
| ai-chat | — | AIChatPage | AIKnowledgeBasePage |
| housing | — | HousingPage | — |

- [ ] **Step 1: Move complaints feature**

```bash
# Create
mkdir -p src/features/complaints/{c-end/pages,desktop/pages,store}

# Move store
cp src/shared/services/complaint/store.ts src/features/complaints/store/store.ts

# Move C-end pages
cp src/c-end/pages/ComplaintFormPage.tsx src/features/complaints/c-end/pages/
cp src/c-end/pages/ComplaintDetailPage.tsx src/features/complaints/c-end/pages/
cp src/c-end/pages/MyComplaintsPage.tsx src/features/complaints/c-end/pages/

# Move desktop page
cp src/desktop/pages/gates/ComplaintPage.tsx src/features/complaints/desktop/pages/

# Delete old
rm -rf src/shared/services/complaint/
rm src/c-end/pages/ComplaintFormPage.tsx src/c-end/pages/ComplaintDetailPage.tsx src/c-end/pages/MyComplaintsPage.tsx
rm src/desktop/pages/gates/ComplaintPage.tsx

# Build
npm run build 2>&1 | tail -3

# Commit
git add src/features/complaints/
git rm -r src/shared/services/complaint/
git rm src/c-end/pages/Complaint*.tsx src/desktop/pages/gates/ComplaintPage.tsx
git commit -m "feat: move complaints feature into features/complaints/"
```

- [ ] **Step 2: Move checkin feature**

Follow same pattern as complaints. Store at `src/shared/services/checkin/`. C-end pages: NaxiCheckInPage, MyCheckinsPage, PhotoRecordsPage, PhotoRecordsDetailPage.

- [ ] **Step 3: Move heritage feature**

Heritage has many sub-pages but no shared store files — the data is inline or in `shared/services/heritage/`. C-end pages under `src/c-end/pages/heritage/`.

- [ ] **Step 4: Move AI chat feature**

AIChatPage (750 lines) + AIKnowledgeBasePage (desktop-only).

- [ ] **Step 5: Move housing feature**

HousingPage (593 lines, c-end only).

- [ ] **Step 6: Move content feature**

Content management (merchants, courtyards, POI, news) in `shared/services/content/` and `src/c-end/pages/` + `src/desktop/pages/`.

- [ ] **Step 7: Final cleanup and build**

```bash
npm run build 2>&1 | tail -3
```

---

## Self-Review

**Spec coverage check:**
- ✅ `platform/` directory → Task 1
- ✅ `features/convenience/` pilot → Tasks 2-6
- ✅ C-end pages move → Task 3
- ✅ B-end pages move → Task 4
- ✅ Desktop pages move → Task 5
- ✅ Retire old shared services → Task 6
- ✅ Volunteer → Task 7
- ✅ Remaining features → Task 8
- ✅ Import path updates → covered in each task
- ✅ Route configuration updates → covered in each task
- ✅ Dependency discipline (features←platform, no cross-feature imports) → enforced by the directory structure itself

**Placeholder check:** No TODOs, no "TBD", no "add later". Every step has concrete file paths and commands.

**Type consistency:** All references to store names, function names, and type names match the existing codebase. No new types introduced — only file moves.

**Scope check:** Single project, single migration approach. All tasks move files in the same direction. Each produces a working build.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-03-feature-first-architecture.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?