# Prudential investment activation and valuation

## Scope and inspection result

Inspected `backup-main`; the working tree was clean. No application code has been changed, and nothing has been pushed or deployed. Existing funding, valuation, investment-access and submitted-policy tests were run: **58 passed, 0 failed**. These tests use test doubles, not the development MongoDB database.

Start with **Managed Prudential Fund only**. Preserve the approved policy, funding confirmation, net investment, allocation percentages and approved fund amounts. Other funds remain unpurchased; purchasing Prudential must not mark the whole portfolio or policy active.

### Existing foundations

- Funds have stable IDs and belong to an Asset Manager (`backend/server.js:189–262`). Fund valuations already store positive BWP prices with up to six decimal places using Decimal128, separate valuation/entry dates, unique fund/date records and append-only corrections (`backend/fundValuations.cjs`).
- Approved portfolio display comes from submitted review snapshots. `form.selectedFunds` preserves fund IDs, `form.portfolioAllocations` preserves percentages and `form.netInvestment` preserves a two-decimal amount. **Approved per-fund amounts are formatted snapshot strings, not a structured transaction ledger.** Snapshot rows and the fund panel do not carry fund IDs; saved manager identity is a name. The wizard's top-level `fundAllocations` payload is not accepted by existing create/update handlers. Do not alter those approval handlers to introduce activation.
- Funding confirmation is a separate `PolicyFunding` record with status, revision, confirmer and history. It confirms receipt once; it does not record a cash amount or independently establish reconciliation (`backend/fundingConfirmation.cjs`). Its current behaviour stays unchanged.
- Existing server guards resolve roles/organisations from the database and apply the current approved/active client-policy access boundary (`backend/investmentAccess.cjs`). Root Admins and Super Admins may execute; Advisors cannot. External organisations are currently denied client-policy access; this plan does not widen it.
- `PolicyRecordView.tsx` already has a fund-specific panel with approved allocation and funding status. Holdings, price, valuation, performance and chart are currently placeholders. Extend this panel, not the wider page design.

## Excel discrepancy: what is established

| Calculation | Result |
|---|---:|
| BWP 1,363,250.00 ÷ 3.08 | 442,613.636363… units |
| BWP 1,363,250.00 ÷ 442,642.38 | Implied price 3.079799995653… |
| BWP 1,363,250.00 ÷ 3.079800 | 442,642.379375… units |
| Previous result displayed to two decimals | **442,642.38 units** |

Thus **BWP 3.079800, displayed in Excel as BWP 3.08, reproduces the example**. Hidden price precision is a strong explanation, but these figures alone cannot prove the formula or rule: different inputs or adjustments could also explain it. Do not back-solve a production price from the example or record 3.079800 as a verified valuation.

The repository contains annuity quotation workbooks, including `backend/sheets/Exclusive-Annuity.xlsm`, but the inspected files do not contain the Prudential example or identifiable fund-unit purchase table. The exact investment workbook is needed. Its quotation projections include annual-to-monthly effective rates, fees and survival adjustments; those must **not** be assumed to be live Prudential performance methodology.

## Phase 1 — Validate Excel and initial purchase inputs

**No live purchase writes in this phase.**

1. Inspect the supplied investment workbook: raw cell values, display formats, purchase/unit formulas, linked cells, rounding and any relevant macros or external links. Identify exactly where 3.08 and 442,642.38 originate.
2. Document the confirmed purchase formula, stored unit precision, displayed precision, cash rounding and residual treatment. Rounded example units at 3.079800 value to BWP 1,363,250.001924; do not silently add units or alter the approved amount to eliminate this sub-cent difference.
3. Validate the policy's saved allocation representations and establish an ID-linked activation input outside the approved policy: fund/manager IDs, submitted names, approved percentage/amount, approved net and source provenance. Normalise the **submitted amount**, not a recalculation using current fees, gross investment or a new percentage multiplication.
4. Require unique verified fund identity, complete allocations and reconciled totals. Missing/skipped portfolios, ambiguous duplicate names, contradictory snapshots or monetary discrepancies are blocked for review, never silently repaired. Resolve manager ownership through the saved fund ID; never identify Prudential by name alone.
5. Add decimal-safe calculation tests using the verified workbook example and additional cases. Keep the example as a test fixture, not application defaults.

**Exit gate:** workbook formula and precision confirmed; dry-run purchase equals Excel under its documented display/rounding rules; approved input identity/amounts validated. Report and obtain approval before enabling purchase writes.

## Phase 2 — Explicit initial Prudential unit purchase

1. Add a small isolated purchase module and append-only purchase collection linked to the existing policy, fund and manager; reuse existing models rather than duplicating valuation/funding schemas.
2. A Root Admin or Super Admin explicitly selects a purchase date and reviews the approved amount, recorded valuation/date, full-precision price and resulting units before confirming. No automatic purchase on funding confirmation or valuation entry.
3. Proposed date rule for approval: select the most recent recorded valuation on or before the purchase date; show its date explicitly and never use a future valuation. Missing prices block purchase. Re-check the reviewed valuation revision at execution; a correction requires a fresh preview rather than silently changing the price. Any price-age limit requires a separately agreed rule.
4. Enforce server-side approved/active policy access, transaction-execution permission, confirmed funding, verified approved Prudential allocation and valid active fund/manager relationships. Re-read all authoritative data; ignore amounts, prices, units and permission claims sent by the browser.
5. Save approved amount/percentage, policy and manager/fund IDs, funding ID/revision, valuation ID/date/revision, copied applied price, calculated units, rounding evidence, calculation version and administrator/time. Use Decimal128 for financial storage and a decimal arithmetic library; transmit decimal strings. Valuation corrections must never alter executed purchases.
6. Enforce one initial purchase per policy/fund with a real unique index, plus replay-safe request handling. Identical retries return the original purchase; competing or changed requests cannot purchase twice. Keep other approved allocations untouched and available for their own later implementation.
7. Record purchase audit evidence reliably with the purchase; verify MongoDB transaction support or agree an atomic/outbox alternative before using multi-document writes. Retention checks must include purchase relationships.
8. Replace only the panel's purchase/holdings placeholders with the saved Prudential purchase result and eligible administrator action. Advisors see authorised read-only results. Do not change the policy's approval/active status.

**Exit gate:** confirmed-funding purchase and readback work end-to-end on development; duplicate/concurrent requests, permissions, revision changes and unchanged approved values are tested. Stop and report before Phase 3.

## Phase 3 — Policy-specific valuation history

- Derive initial holdings from immutable purchases, not an editable balance field.
- Add policy/fund valuation observations linked to holdings and the applied valuation ID/revision/date/price. Preserve recorded history; later price corrections do not silently rewrite old observations.
- For the initial no-cash-flow case, validate holdings × applicable price against Excel before presenting it as portfolio value. Label valuation date separately from recording time and flag unavailable prices rather than extrapolating.
- Add a valuation history table and growth chart inside the existing fund panel, using existing table/chart components. The baseline is the saved purchase, not a quotation projection.
- Do not create monthly automation, withdrawals, fees, distributions, switches or additional purchases in this phase.

**Exit gate:** price-based valuations reproduce verified cases; historical readback remains stable after corrections; authorised desktop/mobile views are checked.

## Phase 4 — Excel monthly methodology and performance

- Trace the investment workbook's actual monthly methodology: dates, opening/closing holdings, price movement, income/distributions, fees, withdrawals, compounding, cash-flow timing and return definition. Distinguish investment return from a balance change or annuity forecast.
- Implement only confirmed rules with dated source inputs and versioned calculations. Reuse already-approved policy values; never recalculate policy premiums, net investment or allocations.
- Persist reproducible monthly observations referencing their inputs and price revisions; missing inputs show unavailable results, not assumed zero fees or invented growth.
- Extend the panel's performance table and growth chart with the verified measures. Validate several complete Excel months, not only the initial-unit example.
- Scheduling and additional financial transactions require their own approval and are not implicit in monthly reporting.

## Technical implementation boundaries

Likely new files: isolated backend purchase/valuation module(s) and tests, a decimal calculation helper and tests, a policy-fund investment read hook and focused panel content. Small registration/dependency and audit-enum additions in `backend/server.js`; targeted panel changes in `PolicyRecordView.tsx`; purchase-reference retention checks in `fundValuations.cjs`.

Do not modify conversion calculations, approval routes, funding confirmation behaviour, allocation data or shared Root Organisation permissions. Policy display snapshots remain authoritative and unchanged; activation inputs live separately with their provenance. No new roles, evidence uploads, reversals, Money Market purchases or automatic policy activation.

## Verification and blockers

- **Needed now:** exact investment Excel workbook, including any linked price data needed to evaluate its formulas. Until supplied, hidden precision and monthly methodology remain unverified.
- Before purchase implementation: read-only development-data inspection of Prudential fund IDs/manager, approved allocation snapshots and funding confirmation; investigate incomplete or contradictory records without editing them. Existing gross-payable ambiguity for combined living/life quotes remains unresolved; do not imply that the current funding checkbox proves cash reconciliation.
- Development MongoDB: Decimal128 roundtrips, unique-index creation, transaction capability, concurrent initial purchases, stale valuation revisions, audit persistence and relationship retention.
- Automated checks: concrete Excel fixtures, decimal precision/residual cases, funding prerequisite, all roles/organisations, unrelated policy denial under the existing boundary, wrong fund/manager, malformed snapshots, future/missing prices, duplicate execution and historical immutability. Assert policy form/status/net/allocations and funding records are unchanged.
- Signed-in end-to-end checks: eligible administrator preview → purchase → saved holdings readback; Advisor read-only view; unauthorised attempts denied. Existing mocked tests are not live-database verification.

All implementation remains on `backup-main`; no production changes, pushes or deployments. Approval of the plan should begin **Phase 1 only**, with a report at each exit gate.