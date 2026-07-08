# 购在古城 · 商户业务全流程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete merchant lifecycle (claim/register → review → display → edit) across C端, Desktop, and backend.

**Architecture:** Extend existing `content_merchants` table with 4 new columns, add credential screenshot support to `merchant_registrations`, wire up `merchant_reviews` for info-change flow with diff-based approval.

**Tech Stack:** Express + better-sqlite3 backend, Zustand stores, React frontend

## Global Constraints

- All 11 fields defined in spec: name, cover, description, detailImages, address, lat/lng, shopPhone, category, credentialImages (≥1), contactName, contactPhone
- 8 critical fields go through approval with diff display
- 3 non-critical fields (cover, description, detailImages) PATCH directly
- credentialImages = combined business license + regulatory mark, single upload area, ≥1 image required

---

## File Structure

### Files to create:
- (none — all changes are modifications to existing files)

### Files to modify:
- `server/db/schema.sql` — add 4 columns to content_merchants
- `server/db/seed.js` — update merchant seeds with new fields
- `src/shared/types/content-types.ts` — add businessLicense, contactName, contactPhone, detailImages to Merchant
- `src/features/merchant-review/c-end/pages/MerchantRegistrationPage.tsx` — full rewrite of claim + new-shop forms
- `src/features/content/c-end/pages/MerchantDetailPage.tsx` — add credential image display, detail images gallery
- `src/features/merchant-review/c-end/pages/MyShopPage.tsx` — add edit flows (direct PATCH + change request)
- `src/desktop/pages/gates/MerchantReviewPage.tsx` — update all 3 tabs with diff display
- `src/desktop/pages/gates/content/MerchantManageContent.tsx` — add contact fields + coordinate editing
- `server/routes/crud.js` — ensure `credentialImages` is in JSON_FIELDS set
- `src/platform/content/merchant-store.ts` — ensure updateMerchant handles all new fields
- `src/features/merchant-review/store/registration-store.ts` — add credentialImages support

---

### Task 1: Backend Schema + Type Update

**Files:**
- Modify: `server/db/schema.sql` — content_merchants, merchant_registrations tables
- Modify: `src/shared/types/content-types.ts` — Merchant interface
- Modify: `server/routes/crud.js` — JSON_FIELDS

- [ ] **Step 1: Add columns to content_merchants and merchant_registrations**

Add to `content_merchants` (after `claimStatus`):
```sql
  businessLicense TEXT DEFAULT '',
  contactName TEXT DEFAULT '',
  contactPhone TEXT DEFAULT '',
  detailImages TEXT DEFAULT '[]',
```

Add to `merchant_registrations` (after `contactPhone`):
```sql
  lat REAL,
  lng REAL,
  credentialImages TEXT DEFAULT '[]',
```

Add to `crud.js` JSON_FIELDS:
```javascript
"credentialImages", "detailImages",
```

- [ ] **Step 2: Update Merchant type in content-types.ts**

```typescript
// After claimStatus/claimedBy/claimedAt, add:
  businessLicense?: string
  contactName?: string
  contactPhone?: string
  detailImages?: string[]
```

- [ ] **Step 3: Update seed data**

In `seed.js`, the Content: Merchants section (lines 172-184), add new fields to each merchant:
```javascript
// Add to each merchant object:
  businessLicense: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
  contactName: "和老板",
  contactPhone: "13988885600",
  detailImages: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
```

Also update the existing 5 claimed merchants to set `claimStatus: "claimed"` and add `credentialImages` to registration seed data if any.

- [ ] **Step 4: Delete old DB and restart**

```bash
rm -f server/db/data.db
# server auto-creates on next start
```

---
### Task 2: C端 MerchantRegistrationPage — Claim + New Shop Forms

**Files:**
- Modify: `src/features/merchant-review/c-end/pages/MerchantRegistrationPage.tsx`
- Modify: `src/features/merchant-review/store/registration-store.ts`

- [ ] **Step 1: Update registration-store.ts ShopClaimRequest type**

Add to the interface:
```typescript
credentialImages?: string[]
newLat?: number
newLng?: number
```

- [ ] **Step 2: Update claim form (phase === "claim")**

Replace form body to show:
- Cover image preview (from merchant.cover, editable file upload)
- Shop name (read-only from merchant.name)
- Category (pre-filled from merchant.category, editable 4-button group)
- Address (read-only from merchant.address)
- Coordinates (read-only text from merchant.lat/lng)
- Shop phone (pre-filled from merchant.phone, editable)
- Description (pre-filled from merchant.description, editable textarea)
- Credential images upload area (≥1, grid uploader)
- Contact name (required, pre-filled from user.name)
- Contact phone (required phone validation)

Validation: contactName required, contactPhone required + regex /^1[3-9]\d{9}$/, credentialImages.length ≥ 1.

- [ ] **Step 3: Update new-shop form (phase === "new-shop")**

Replace form body to show:
- Cover image upload (required)
- Shop name input (required)
- Category selector (4-button, required)
- Address input (required)
- Coordinates (two text inputs for lat and lng)
- Shop phone input (required)
- Description textarea (required)
- Credential images upload (≥1 required)
- Contact name (required, pre-filled from user.name)
- Contact phone (required phone validation, pre-filled from user.phone)

---

### Task 3: C端 MerchantDetailPage — Credential + Detail Images

**Files:**
- Modify: `src/features/content/c-end/pages/MerchantDetailPage.tsx`

- [ ] **Step 1: Replace fake qualification badges with real credential image**

Delete lines 133-153 (qualificationBadges array + 商家资质 section). Replace with:
```tsx
{merchant.businessLicense && (
  <div className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
    <h3 className="text-[14px] text-text-body flex items-center gap-1.5 mb-3">
      <span className="w-1 h-3.5 bg-[#27AE60] rounded-full" />
      商家资质
    </h3>
    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
      <img src={merchant.businessLicense} alt="资质凭证" className="w-full h-full object-cover" />
    </div>
  </div>
)}
```
Remove unused imports: `Shield`, `BadgeCheck`, `Award` from line 2.

- [ ] **Step 2: Add detail images gallery**

```tsx
{merchant.detailImages?.length > 0 && (
  <div className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(60,120,200,0.08)]">
    <h3 className="text-[14px] text-text-body flex items-center gap-1.5 mb-3">
      <span className="w-1 h-3.5 bg-primary rounded-full" />
      详情
    </h3>
    <div className="grid grid-cols-2 gap-2">
      {merchant.detailImages.map((img, i) => (
        <div key={i} className="aspect-video rounded-xl overflow-hidden bg-gray-100">
          <img src={img} alt={`详情 ${i + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  </div>
)}
```

---

### Task 4: C端 MyShopPage — Edit Flows

**Files:**
- Modify: `src/features/merchant-review/c-end/pages/MyShopPage.tsx`

- [ ] **Step 1: Non-critical field direct edit (cover, description, detailImages)**

Add "编辑" button next to each field. Opens bottom sheet pre-filled. On save: `updateMerchant(id, { cover: newUrl })`.

- [ ] **Step 2: Critical field change request (name, address, phone, category, lat/lng)**

Add "申请修改" button. Opens form with current + new value. On submit: POST to `merchant_reviews` with `fields: [{field, label, oldValue, newValue}]`.

- [ ] **Step 3: Pending changes banner**

Show amber banner at top if merchant has pending `merchant_reviews`.

---

### Task 5: Desktop MerchantReviewPage — Diff Display

**Files:**
- Modify: `src/desktop/pages/gates/MerchantReviewPage.tsx`

- [ ] **Step 1: Tab 1 (认领) detail dialog**

Show applicant info + credential images + field diff table + approve/reject.

- [ ] **Step 2: Tab 2 (新建) detail dialog**

Show applicant info + credential images + all fields + approve/reject.

- [ ] **Step 3: Tab 3 (信息变更) per-field actions**

Diff table with per-row approve/reject buttons. Pending rows show ✓/✗. Approved/rejected rows show status text.

---

### Task 6: Desktop Merchant Management — Contact + Coords

**Files:**
- Modify: `src/desktop/pages/gates/content/MerchantManageContent.tsx`

- [ ] **Step 1: Add contactName/contactPhone columns to table**

- [ ] **Step 2: Add lat/lng inputs to edit dialog**

---

## Dependencies

```
Task 1 (schema) → Tasks 2–6 (all consume schema, run in parallel)
```
