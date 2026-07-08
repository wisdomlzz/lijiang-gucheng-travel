# Business Flow Validation Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 3 highest-impact validation gaps across convenience service, volunteer service, and merchant review flows.

**Architecture:** Server-side validation additions (staff-order ownership check, quote bounds via system_config, volunteer geolocation guard), with minimal frontend changes for UX feedback.

**Tech Stack:** Express + better-sqlite3 backend, React frontend, Geolocation API

## Global Constraints

- All server-side changes must use parameterized queries (no string interpolation)
- Frontend geolocation must handle permission denied gracefully (fallback with toast warning)
- Config values for price bounds stored in `system_configs` table
- All changes go through existing `syncAction` pattern on frontend

---

## File Structure

### Files to modify:
- `server/routes/orders.js` — add staff ownership check to `/transition`, price bounds to quote action
- `server/logic/transitions.js` — add ORDER_OWNERSHIP_TRANSITIONS set for actions requiring ownership
- `server/db/schema.sql` — add lat/lng/geoRadius to volunteer_activities, lat/lng to volunteer_daily_records
- `server/db/seed.js` — add lat/lng to existing volunteer activities
- `src/features/volunteer/store/daily-record-store.ts` — add geolocation check before checkIn/checkOut
- `src/features/volunteer/c-end/pages/VolunteerActivityDetailPage.tsx` — handle geolocation permission UI
- `src/shared/types/index.ts` — add location fields to VolunteerActivity type
- `server/routes/crud.js` — add lat/lng to JSON_FIELDS (if needed)

### Files to read (no changes):
- `docs/fixes/volunteer-geolocation-fix.md` — reference design

---

### Task 1: Staff-Order Ownership Check

**Files:**
- Modify: `server/routes/orders.js` (transition handler)
- Modify: `server/logic/transitions.js`

- [ ] **Step 1: Define which transitions need ownership check**

In `transitions.js`, add a set of actions that require the requesting user to be the assigned staff:
```javascript
// Actions in the transition endpoint that require the requester to be the order's assigned staff
export const STAFF_OWNERSHIP_ACTIONS = new Set([
  "accept", "reject", "quote", "startService", "complete",
  "arriveCheckin", // handled separately but conceptually same
])
```

- [ ] **Step 2: Add ownership guard in the transition handler**

In `orders.js`, inside the `POST /:id/transition` handler, after loading the order (line 309), add:
```javascript
// 人员归属校验：要求操作人是指派的服务人员
const { action, operatorId, operatorType, ...extraFields } = req.body
if (STAFF_OWNERSHIP_ACTIONS.has(action) && order.staffId) {
  // If operatorType is "staff", verify their staffId matches
  if (operatorType === "staff" && req.body.operatorId && req.body.operatorId !== order.staffId) {
    return res.json(fail("您不是该订单的指派服务人员，无权操作"))
  }
}
```

- [ ] **Step 3: Update transition action extraction**

Change line 311 from:
```javascript
const { action, ...extraFields } = req.body
```
to:
```javascript
const { action, operatorId, operatorType, ...extraFields } = req.body
```

- [ ] **Step 4: Verify build**

```bash
npx vite build && node --check server/routes/orders.js
```

---

### Task 2: Quote Price Bounds

**Files:**
- Modify: `server/routes/orders.js`

- [ ] **Step 1: Add price validation in quote action**

In the `POST /:id/transition` handler, inside the `if (action === "quote")` pre-validation block (line 301-304), add:
```javascript
// 报价金额校验：从 system_configs 读取上下限
const minPrice = Number(db.prepare("SELECT configValue FROM system_configs WHERE configKey='quoteMinPrice'").get()?.configValue || 1)
const maxPrice = Number(db.prepare("SELECT configValue FROM system_configs WHERE configKey='quoteMaxPrice'").get()?.configValue || 9999)
const quoteAmount = Number(extraFields.priceQuote)
if (!quoteAmount || quoteAmount < minPrice || quoteAmount > maxPrice) {
  return res.json(fail(`报价金额需在 ¥${minPrice}~¥${maxPrice} 之间`))
}
```

- [ ] **Step 2: Add default config values to seed.js**

In the system_configs section of `server/db/seed.js`, add:
```javascript
{ id: "cfg_quote_min", configKey: "quoteMinPrice", configValue: "1", description: "报价最低金额(元)", updatedBy: "system" },
{ id: "cfg_quote_max", configKey: "quoteMaxPrice", configValue: "9999", description: "报价最高金额(元)", updatedBy: "system" },
```

- [ ] **Step 3: Verify with test**

```bash
curl -X POST http://localhost:3001/api/v1/orders/CO20260511001/transition \
  -H "Content-Type: application/json" \
  -d '{"action":"quote","priceQuote":0}'
# Expected: {"ok":false,"msg":"报价金额需在 ¥1~¥9999 之间"}
```

---

### Task 3: Volunteer Geolocation Check-In (schema + server)

**Files:**
- Modify: `server/db/schema.sql`
- Modify: `server/db/seed.js`
- Modify: `src/shared/types/index.ts`

- [ ] **Step 1: Add location columns to volunteer tables**

In `schema.sql`, alter the `volunteer_activities` table:
```sql
-- Already in CREATE TABLE IF NOT EXISTS, add after `location TEXT DEFAULT ''`:
  lat REAL,
  lng REAL,
  geoRadius INTEGER DEFAULT 500,
```

And `volunteer_daily_records`:
```sql
-- After `durationMinutes`:
  checkInLat REAL,
  checkInLng REAL,
  checkOutLat REAL,
  checkOutLng REAL,
```

Also update the CREATE TABLE statements in schema.sql for both tables.

- [ ] **Step 2: Add lat/lng to volunteer_activities seed data**

In `seed.js`, for each of the 11 volunteer activities (starting around line 314), add coordinates within Lijiang Old Town (approximately lat 26.87, lng 100.23):
```javascript
// For "端午文化节" (玉河广场):
{ ...existing, lat: 26.871, lng: 100.233, geoRadius: 500 },
// For "古城文化快闪" (四方街):
{ ...existing, lat: 26.870, lng: 100.230, geoRadius: 500 },
// etc. — use realistic古城 coordinates
```

- [ ] **Step 3: Update VolunteerActivity type**

In `src/shared/types/index.ts`, find the VolunteerActivity interface and add:
```typescript
lat?: number
lng?: number
geoRadius?: number
```

And VolunteerDailyRecord:
```typescript
checkInLat?: number
checkInLng?: number
checkOutLat?: number
checkOutLng?: number
```

- [ ] **Step 4: Add lat/lng to JSON_FIELDS in crud.js**

```javascript
// Already has: "lat" is REAL not JSON, same for lng — no change needed
```

- [ ] **Step 5: Delete DB and restart**

```bash
rm -f server/db/data.db
# Restart server to reseed
```

---

### Task 4: Volunteer Geolocation Check-In (frontend store + UI)

**Files:**
- Modify: `src/features/volunteer/store/daily-record-store.ts`
- Modify: `src/features/volunteer/c-end/pages/VolunteerActivityDetailPage.tsx`

- [ ] **Step 1: Add Haversine distance helper to store**

In `daily-record-store.ts`, add:
```typescript
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
```

- [ ] **Step 2: Add geolocation check to checkIn action**

In `daily-record-store.ts`, modify the `checkIn` function. Before the existing time validation, add:
```typescript
// 位置校验：检查志愿者是否在活动地点附近
const activity = getActivity(activityId) // or however the store gets the activity
if (activity?.lat != null && activity?.lng != null) {
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      })
    })
    const distance = haversineDistance(
      pos.coords.latitude, pos.coords.longitude,
      activity.lat, activity.lng
    )
    const radius = activity.geoRadius || 500
    if (distance > radius) {
      throw new Error(`您不在活动地点范围内（距活动地点约 ${Math.round(distance)} 米）`)
    }
    // Store check-in location
    checkInLat = pos.coords.latitude
    checkInLng = pos.coords.longitude
  } catch (err) {
    if (err instanceof GeolocationPositionError) {
      // Permission denied or unavailable — allow with warning
      console.warn("Geolocation unavailable, check-in allowed without location verification")
    } else {
      throw err // re-throw distance error
    }
  }
}
```

- [ ] **Step 3: Add same check to checkOut**

Apply the same geolocation validation to the `checkOut` function, storing coordinates in `checkOutLat`/`checkOutLng`.

- [ ] **Step 4: Update VolunteerActivityDetailPage for permissions**

In the page, before calling `doCheckIn`, show a toast explaining why location is needed:
```typescript
const handleCheckIn = async () => {
  // Show location permission prompt on first attempt
  toast.info("签到需要获取您的位置信息以验证在活动范围内")
  // Then proceed with existing logic
  await doCheckIn(activeDaily.id)
}
```

Also handle the rejection error:
```typescript
try {
  await doCheckIn(activeDaily.id)
  toast.success("签到成功")
} catch (err) {
  toast.error((err as Error).message || "签到失败")
}
```

- [ ] **Step 5: Verify build**

```bash
npx vite build
```

---

## Dependencies

```
Task 1 (ownership check) — independent, no deps
Task 2 (quote bounds) — independent, no deps  
Task 3 (volunteer schema + seed) → Task 4 (volunteer frontend)
```

Tasks 1 and 2 can be done in parallel after Task 3's schema is ready. Task 4 must wait for Task 3 (data model changes).