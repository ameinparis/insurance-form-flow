# Phase 3B: Portfolio Tracking Page and Market Price Adjustment

## What you'll see
- In a client policy's Investment Portfolio, clicking a fund opens a full-width **Portfolio Tracking** page instead of the side panel. It has a **Back to Client Policy** link.
- **Fund Summary** shows the client and policy, the fund and its Asset Manager, the approved % and amount, funding status, purchase status, the initial purchase date, price and units, the current units held and the latest closing balance.
- The existing purchase preview and confirmation move onto this page unchanged.
- The **Investment Statement** fills the full width with all six columns and shows every saved row in date order.
- **Market Price Adjustment** (Root Admin and Super Admin only):
  - Pick a valuation date. The page uses the price already recorded for that exact date in Administration. There is no field to type a price.
  - The preview shows the valuation date, previous price, new price, units held, adjustment (with + or − sign), previous closing balance and new closing balance.
  - **Confirm Market Adjustment** needs a ticked checkbox and a final confirm. It adds a statement row: date, "Market Price Adjustment", Number of Units left blank (as in Excel), new price, signed adjustment and new closing balance.
- Advisors and External Admins can see the page and statement but get no actions.

## Rules
- Adjustment = Units Held × (New Price − Previous Price). New Closing Balance = Previous Closing Balance + Adjustment.
- The previous price and closing balance come from the latest saved transaction for that fund (the purchase or the last adjustment). Units held come from the purchase.
- Blocked when:
  - no initial purchase exists
  - no price is recorded for the exact date
  - the date is on or before the latest transaction (no going back in time yet)
  - an adjustment already exists for that date
- Nothing is created automatically when a price is recorded.
- No changes to purchases, units, allocations, unit prices, funding, approvals or policy records. No fees, salary, returns or interest yet.

## Technical details
- New route `/clients/:id/policies/:policyId/funds/:fundId` → `PortfolioTrackingPage.tsx`. It reuses `PurchasePreviewSection`, `InvestmentStatementSection` and the policy and fund data hooks. In `PolicyRecordView`, fund rows link to this route, and the old fund side panel is removed.
- New `backend/marketAdjustment.cjs`, registered in the server:
  - `GET /api/policies/:policyId/funds/:fundId/market-adjustment-preview?date=` is read-only.
  - `POST .../market-adjustments` recomputes on the server and rejects a stale preview, then writes an immutable `PolicyMarketAdjustment` record with Decimal128 values at full precision: units, previous and new price, adjustment, previous and new closing balance, valuation ID and revision, user and timestamp. It also writes an audit log entry.
  - There is a unique index on policy, fund and valuation date. An ordering check rejects dates on or before the latest transaction, and the write uses a race-safe insert.
  - Permissions reuse the funding and investment access checks and the approved/active policy lookup. A confirmed purchase is required.
  - `GET /api/policies/:policyId/market-adjustments` lists adjustments for anyone with view access.
- `frontend/src/lib/investmentStatement.ts` adds adjustment rows from the stored records only. Latest closing balance = the closing balance on the last row. Nothing is recalculated in the UI.
- The fund deletion check also counts market adjustments.
- Tests:
  - the formula with positive, negative and zero moves
  - six-decimal prices
  - exact-date-only price lookup
  - duplicate and out-of-order rejection
  - stale-preview rejection
  - role and organisation permissions
  - the adjustment stores no units change
  - statement ordering and closing balance
- No hardcoded workbook values. Work on backup-main only, with a local commit. No push or deploy. I'll stop for your review afterwards.

## Decision
- Market Price Adjustment rows leave Number of Units blank. The underlying units held stay unchanged and are still used in the calculation.
