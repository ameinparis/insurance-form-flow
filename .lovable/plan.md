## Goal

Adopt the layout and components from the screenshots — new menu structure, new dashboard stats, Recent Activity feed, Clients/Claims/Administration shells — while keeping the existing visual language (current dark navy/blue theme, Urbanist/Wix Madefor type, rounded cards, pill buttons, sticky page headers).

No backend changes. New sections are UI shells; numbers come from existing quote data where possible, otherwise show 0 with an honest empty state.

## 1. Sidebar (`components/AppSidebar.tsx`)

Restructure the MENU section to:

```text
Dashboard
Quotations            (collapsible group, chevron)
   New Quote          -> /calculator
   Quote Management   -> /quotes
Clients               -> /clients
Claims                -> /claims
Administration        -> /administration
--- SETTINGS ---
Settings
Logout
```

- Quotations expands/collapses on click, auto-expanded when the route is `/calculator*` or `/quotes*`.
- Reuse existing active-state styling (blue pill background + left accent bar); sub-items get a smaller indented variant.
- Team moves under Administration (see below) rather than being a top-level item.

## 2. Dashboard (`pages/Dashboard.tsx`)

Header row keeps the sticky title, adds a secondary **Convert Quote to Policy** button (outline pill with a swap icon) next to **New Quote**.

New stat row — 5 cards, same card shell as today (rounded-2xl, border, soft-tinted circular icon badge, arrow chip top-right):

| Card | Source |
| --- | --- |
| Total Quotations | count of all quotes |
| Converted Quotations | 0 (no status field yet) |
| Active Clients | 0 |
| Active Policies | 0 |
| Pending Verification | 0 |

Each card gets the subtitle copy from the screenshots. Cards with no data source render 0 plus their descriptive subtitle — no fake numbers.

**Recent Activity** card below: derived from the existing quotes list — one entry per recent quote ("Draft Quote Created for {client}", relative time, type badge), icon in a circular tinted badge, rows separated by hairline dividers, "View All" link to `/quotes`.

**Recently Created** quotes table stays below Recent Activity, unchanged.

**Convert Quote to Policy** dialog: search-by-name input over the existing quotes list, result rows selectable; confirming shows a "coming soon / not yet wired" toast since there's no policy backend.

## 3. Quotation Management (`pages/Quotes.tsx`)

Move the current dashboard analytics here, above the quotes table:
- The 4 stat cards (Total Quotes, Total Clients, This Month, This Week)
- The "Quotes by Type" pie chart with click-to-filter

The pie filter drives the existing table filter on this page. `StatsCards.tsx` is reused as-is.

## 4. New shell pages

- `pages/Clients.tsx` — title + subtitle "Annuity policyholders converted from approved quotes.", search field, centered empty state with users icon and the copy from the screenshot.
- `pages/Claims.tsx` — same shell pattern, claims-appropriate copy.
- `pages/Administration.tsx` — shell hosting the existing Team management as its first section, so nothing is lost.

Routes registered in `App.tsx` inside `Layout`; `/team` kept as a redirect to `/administration`.

## Technical notes

- All work is frontend-only under `frontend/src`; no backend, no API changes.
- New dashboard stat cards and activity rows extract into `components/dashboard/` (e.g. `OverviewStats.tsx`, `RecentActivity.tsx`) to keep `Dashboard.tsx` small.
- Styling uses the existing slate/blue token classes already in the codebase; no new palette, no new fonts.
