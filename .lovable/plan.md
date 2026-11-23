# Phase 3C — Monthly Portfolio Processing

## What I found
- **Funeral premium:** each submitted policy already saves a `funeralPremium` in its policy form, which is shown in the Premiums card. The monthly process will read it from that saved policy record. If a policy has no saved premium (or it isn't a valid number), confirmation is blocked with "Funeral premium not configured for this policy".
- **Administration fee:** the existing Fee Configuration screen only saves settings in each person's browser, so the server can't trust it. No fund currently has its own fee rate. I'll add an optional **Monthly Administration Fee %** to each fund in Administration → Investment Managers (up to 6 decimals, Admin-only, every change logged in the audit trail). If a fund has no rate, confirmation is blocked with "Administration fee not configured for this fund". No rate is pre-filled.
- The standalone Market Price Adjustment flow (Phase 3B) is still in the code. Staging has no adjustment records left.

## What you'll see
On the Portfolio Tracking page, Root Admins and Super Admins pick a valuation date and click **Preview Monthly Processing**. Three rows appear, in this order:

```text
Market Price Adjustment  | -  | new price | ± units × (new − previous price) | CB1
Funeral Cover Premium    | -  | new price | −(premium × allocation %)         | CB2
Administration Fee       | -  | new price | −(CB1 × fee %)                    | CB3
```
- The preview also shows the inputs: previous price, units held, previous closing balance, allocation %, premium and fee %.
- **Confirm Monthly Processing** (checkbox required) replaces Confirm Market Adjustment.
- The statement then shows the three rows one after another, with "-" in the units column and deductions in brackets. The Fund Summary shows CB3 as the latest closing balance.
- Advisors and External Admins see the statement only.

## Server rules on confirmation
- Re-check permissions, policy access, Approved/Active status, confirmed funding and that an initial purchase exists.
- Use only the price recorded for exactly that date, plus the saved policy premium, the saved allocation % and the fund's fee %.
- Recalculate everything with full decimal precision and reject the preview if any input changed since it was shown (price, valuation revision, fee %, premium, allocation, prior closing balance or last transaction).
- Save one permanent **monthly batch** record that contains all three rows and their inputs, the date, the authorising user and the time, plus an audit entry. Because it is a single record, a partial batch can't be saved.
- Block a second batch for the same fund and date, any date on or before the fund's last transaction, and two confirmations sent at the same moment (unique indexes plus a sequence check).
- Never change units, purchases, valuations, funding, allocations or policies. Nothing runs automatically when a price is entered.
- Funds with monthly batches can't be deleted.

## Compatibility
- Any older standalone adjustment records stay readable in the statement and count as prior transactions. The standalone confirm route is turned off (it returns "use monthly processing").
- Only stored records are shown. Amounts display to 2 decimals, prices to 6.

## Technical details
- New `backend/monthlyProcessing.cjs` (+ tests). Collection `PolicyMonthlyBatch`: unique (policyId, fundId, valuationDate) and (policyId, fundId, sequence). Decimal128 inputs/outputs: premiumSource, feePctSource, valuationId/revision, a hash of the inputs.
- Rounding (decimal-safe, half-up, to thebe/cents): MA = round2(units × (Pn − Pp)); CB1 = round2(CBprev + MA); FP = round2(premium × alloc%/100); CB2 = CB1 − FP; AF = round2(stored CB1 × fee%/100); CB3 = CB2 − AF. Every stored movement and balance is in BWP with 2 decimals. Units and prices stay at full precision.
- Sign: in the statement, Funeral Cover and Administration Fee rows have negative Market Value (stored as negative movements and shown in brackets).
- Prior state = the latest of purchase, legacy adjustment or batch.
- Fund schema gets `monthlyAdminFeePct` (Decimal128, optional); the fund form gets a new field; audit log.
- `fundValuations.cjs` deletion guard includes batches; `marketAdjustment.cjs` confirm route is disabled, but its reader is kept.
- Frontend: `useMonthlyProcessing.ts`, `MonthlyProcessingSection.tsx` replaces `MarketAdjustmentSection` on `PortfolioTracking`; `investmentStatement.ts` expands each batch into 3 rows (tests added).
- Run the backend and statement tests and the build, then stop for review before the first batch is confirmed on staging. Local commit on backup-main only; no push or deploy.
