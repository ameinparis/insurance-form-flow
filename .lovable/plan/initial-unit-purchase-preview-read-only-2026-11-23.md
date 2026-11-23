# Initial Unit Purchase Preview (read-only)

Works for every fund and approved policy. Managed Prudential Fund is only the first test case. No values hardcoded; everything comes from the saved policy, the recorded unit prices and the date the admin picks.

## What users will see
In Client Policy Record → Investment Portfolio → click a fund, the fund panel gets a new section, **"Purchase Preview — Not Yet Activated"**:
- Root Organisation Admin / Super Admin: a purchase-date picker and a "Preview units" button.
- Result: Approved Fund Investment Amount, Purchase Date, Applicable Unit Price (6 decimals) with its valuation date, Estimated Units (2 decimals), Purchase Status "Not yet purchased".
- If no price is recorded **for exactly that date**: "No unit price recorded for this fund on [date] — record it in Investment Managers first." No fallback to another date.
- If funding isn't confirmed or the saved policy figures don't reconcile: a clear message, no numbers.
- Advisors and External Admins: no picker or button; Purchase Status stays "Not yet available".

## Rules
- Only approved policies with confirmed funding (PolicyFunding status "confirmed").
- Investment amount is the fund's saved approved amount from the submitted policy (never net × % recalculated, never gross).
- Units = Approved Fund Investment Amount ÷ Unit Price recorded for that fund on the selected date, decimal-safe, full precision kept internally, shown to 2 decimals.
- Read-only: nothing saved, no units purchased, no activation, policy/allocations/funding/valuations untouched. Nothing written to the audit log (it's a preview); can add a "preview viewed" entry if you prefer.

## Technical details
- Backend: new `backend/purchasePreview.cjs`, registered in server.js:
  `GET /api/policies/:policyId/funds/:fundId/purchase-preview?date=yyyy-MM-dd`
  - Guards: authenticateToken → requireFundingManager (fundingAccess.cjs, DB-resolved role/org) → requireInvestmentPolicyAccess (approved/active policy) → funding confirmed check (409 otherwise).
  - Reuse `readApprovedActivationInput` (trusted fund-ID lookup from the Fund collection) and `previewInitialUnits`; `validateDate` for the date.
  - Price lookup: exact `{fundId, valuationDate: date}` in the valuation collection; 404 `PRICE_NOT_FOUND` if absent. Response includes valuationId and revision so later real purchases can pin them.
  - Contradictory snapshots → 422 with the reason; fund not in policy → 404.
- Frontend: `usePurchasePreview` hook; new `PurchasePreviewSection` inside the fund panel of `PolicyRecordView.tsx`, shown only when `canManageFunding` and funding confirmed (UI hint; backend re-checks).
- Tests (`backend/purchasePreview.test.cjs`): Super Admin and Root Admin allowed; Advisor, External Admin, no-access 403; unapproved policy rejected; unconfirmed funding 409; missing price for date 404 even when other dates exist (no silent fallback); fund not in policy 404; multiple funds/allocations/prices produce the right units; Excel reference (BWP 3.0798 → 442,642.3793752841…) still matches; policy, funding and valuation documents unchanged after the call. Run full suite + build, plus a browser check with sample data.
- Stop after implementation and report; commit locally on backup-main only, no push/deploy.
