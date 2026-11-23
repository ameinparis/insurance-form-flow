# Phase 2: Confirm Initial Unit Purchase and Initial Closing Balance

## What you will see
- Under a successful Purchase Preview, Root Admins and Super Admins get a **Confirm Unit Purchase** button.
- A confirmation dialog shows the fund, purchase date, approved amount, unit price (6 decimals), units (2 decimals shown) and initial closing balance. You must tick a checkbox before you can confirm.
- After confirming, the fund panel shows: Purchase Status: Purchased, the purchase date, investment amount, initial unit price, units purchased, unit holdings, initial closing balance, who authorised it and when. These values replace the "Not yet available" text.
- The purchase is saved. It is still there after a refresh or a new login, and the preview and confirm controls are hidden for that fund.
- Each fund is purchased on its own. Confirming one fund does not change the others or the policy status.
- Advisors and External Admins see the recorded purchase as read-only.

## Rules
- Units purchased = approved fund amount ÷ unit price, stored at full precision.
- Initial closing balance = full-precision units × unit price, rounded to 2 decimals (BWP) for storage and display. It should equal the approved amount.
- No returns, fees, salary deductions or monthly valuations.
- Approved allocations, unit prices, funding records and the policy record are never written to.

## Backend checks on confirmation
1. The user is a Root Admin or Super Admin and has access to the policy (the same checks as the preview).
2. The policy is Approved or Active, and funding is confirmed.
3. The fund belongs to the saved policy allocation, and the amount comes only from the saved snapshot.
4. The price must be recorded for exactly the chosen date.
5. Units are recalculated on the server. The request is rejected (409, "preview out of date") if the amount, price, valuation ID/revision or snapshot hash differs from what was previewed.
6. An immutable purchase record and an audit entry are saved. A unique index on policy + fund + type "INITIAL" stops duplicate purchases, including two requests sent at the same time.

## Technical details
- New `backend/unitPurchase.cjs` module, registered in `server.js` next to the preview. It reuses `investmentPreview.cjs`, `fundingAccess.cjs`, `investmentAccess.cjs` and the audit-log pattern from `fundingConfirmation.cjs`.
- New `PolicyUnitPurchase` collection with fields: policyId, fundId, fundName, assetManagerName, type "INITIAL", purchaseDate, investmentAmount, unitPrice, units (all Decimal128), closingBalance, valuationId, valuationRevision, inputHash, authorisedBy {id, name}, confirmedAt and an empty `history` array for future audited corrections. It has a unique index on {policyId, fundId, type}. There are no update or delete routes.
- Routes:
  - `POST /api/policies/:policyId/funds/:fundId/initial-purchase`, with body {purchaseDate, approvedAmount, unitPrice, valuationId, valuationRevision, inputHash}.
  - `GET /api/policies/:policyId/purchases`, readable by anyone with policy view access.
- Fund deletion stays protected for funds with purchases (the deletion guard also checks purchases).
- Frontend: a `useUnitPurchases` hook, a confirm dialog inside `PurchasePreviewSection`, and a purchased-details block in the fund panel in `PolicyRecordView`.
- Tests: role and access rejections, status and funding gates, a fund that is not in the policy, a missing price for the date, rejection of a changed amount, price or revision, duplicate and concurrent confirmations, correct units and closing balance with dynamic data, other funds unaffected, and no writes to policy, funding or valuation records.
- Update `AGENTS.md` and the roadmap. Commit locally on backup-main only, with no push or deploy. Then stop for your review.

## To verify together on staging
The unique index is created in the development MongoDB, Decimal128 values persist, and a real confirmation works on your Active test policy.
