## CRM Dashboard Restructure Plan

Keeps the current dark glassmorphism look. Moves quotation metrics out of Dashboard into Quote Management, and turns Dashboard into a CRM lifecycle overview.

---

### 1. Quote Management page (`frontend/src/pages/Quotes.tsx`)

Add a quotation summary block at the top, reusing the existing StatsCards visual language (glass tiles + donut chart).

**New `QuoteStatsCards` component** (`frontend/src/components/quotes/QuoteStatsCards.tsx`):
- Tiles: Total Quotations, Draft, Pending, Converted, Rejected, This Month, This Week
- Right-side donut: **Quotations by Type** (moved from Dashboard)
- Same glass styling, gradient icon blobs, info `i` tooltip per metric

**Status tabs** above the table: All / Draft / Pending / Converted / Rejected
(no "Approved" — Converted = approved/accepted)

**Table columns** (replace current):
Quote Number · Applicant Name · ID Number · Product Type · Investment Amount · Status · Created By · Date Created · Action

**Row actions**:
- All rows: View Quote
- Converted rows: extra actions → *Create / Link Client*, *Continue Policy Setup* (stubs that toast "Coming soon" for now — no policy module yet)

Status derivation: until backend has a `status` field, default everything existing to `Draft` and surface a TODO. Filters operate on this field.

---

### 2. Dashboard page (`frontend/src/pages/Dashboard.tsx`)

Strip quotation-centric content. Rebuild as CRM overview using the same glass cards.

**Top summary tiles** (`CrmSummaryCards` component):
Total Clients · Active Policies · Draft Policies · Pending Verification · Converted Quotes · Policies Activated This Month
Each with an info `i` tooltip using the copy provided.

**Policy Status Overview** (`PolicyStatusOverview` component):
Horizontal segmented bar or small donut showing: Draft, Pending Verification, Approved, Active, Suspended, Cancelled, Claimed, Closed. Empty-state friendly (zeros allowed).

**Recent Activity** (`RecentActivity` component):
Vertical timeline list — Quote converted, Client created, Draft policy created, Documents uploaded, Policy activated, Beneficiary updated, Portfolio allocation updated. Sourced from existing audit log hook (`useAuditLogs`) where possible, otherwise placeholder rows.

**Pending Verification** table:
Client Name · Policy Number · Missing/Pending Documents · Status · Assigned User · Action

**Recent Converted Quotes** table:
Quote Number · Applicant Name · Investment Amount · Converted Date · Action

Tooltips on each section heading using exact copy supplied.

Until the policy/client backend exists, these sections render with empty-state placeholders ("No active policies yet") so the layout is real and ready to wire up.

---

### 3. Shared bits

- `InfoTooltip` small component (`Info` icon from lucide + shadcn Tooltip) for reuse on Dashboard and Quote Management.
- StatsCards file kept but no longer rendered on Dashboard (used as visual reference for QuoteStatsCards).

---

### 4. Out of scope (deferred)
- Real policy/client data model & API — added when policy module is built.
- Create/Link Client and Continue Policy Setup flows — wired as stubs.
- Sidebar already matches spec; no changes.

### Files
- create: `frontend/src/components/quotes/QuoteStatsCards.tsx`
- create: `frontend/src/components/dashboard/CrmSummaryCards.tsx`
- create: `frontend/src/components/dashboard/PolicyStatusOverview.tsx`
- create: `frontend/src/components/dashboard/RecentActivity.tsx`
- create: `frontend/src/components/dashboard/PendingVerification.tsx`
- create: `frontend/src/components/dashboard/RecentConvertedQuotes.tsx`
- create: `frontend/src/components/ui/info-tooltip.tsx`
- edit:   `frontend/src/pages/Dashboard.tsx`
- edit:   `frontend/src/pages/Quotes.tsx`
