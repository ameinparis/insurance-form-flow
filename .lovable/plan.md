# Phase 3C update: Funeral Cover Premium units

## What changes for you
- The Funeral Cover Premium row will show units sold, e.g. -14 ÷ 3.1024 = **-4.51** units (shown to 2 decimals, kept at full precision).
- The Administration Fee row keeps a dash in Number of Units until you clarify.
- **Units held** go down by the funeral units each month, and the next month's market adjustment uses the reduced units.

## Monthly sequence (matches Excel)
```text
U0  = units held before this month (purchase units + all earlier funeral units)
MA  = round_cents( U0 × (new price − previous price) )      CB1 = CB0 + MA
FU  = −premium ÷ new price   (full precision, negative)      CB2 = CB1 − premium
FEE = round_cents( CB2... as today, CB1 × fee % )           CB3 = CB2 − FEE
U1  = U0 + FU   -> becomes U0 for next month's MA
```
- Market adjustment always uses units held **before** this month's deduction, so the premium is removed once in money (−14) and once in units (−4.51) as the same event — no double deduction. The money column is not recomputed from units.
- Example next month: MA = (442,642.38 − 4.51…) × price change.
- Note: because the admin fee is not yet turned into units, units held × price will drift above the closing balance by the cumulative fees. The closing balance stays the authoritative figure; this closes once fee units are clarified.
- The workbook's August row (positive 4.27 units) stays treated as an Excel inconsistency; we always deduct.

## Historical records
- Confirmed batches and adjustments are never edited. Batches saved before this change carry no funeral units and count as zero units deducted (their units held stayed unchanged when confirmed). Their statement rows keep a dash.
- Recommendation: test the new rule on a fresh staging policy/fund, or accept that the existing test batch stays legacy.

## Technical details
- `backend/monthlyProcessing.cjs`: units held = purchase units + sum of stored `funeralUnits` from prior batches for that policy/fund; compute `funeralUnits` with decimal.js at full precision; store on new batches (Decimal128) as `unitsHeld` (U0), `funeralUnits`, `unitsHeldAfter` (U1); include in the input hash so stale previews are rejected. Purchase record untouched.
- `frontend/src/lib/investmentStatement.ts`: funeral row `units` = stored `funeralUnits` (null on legacy batches); fee/market rows stay null. Fund Summary "Current units held" = last batch `unitsHeldAfter`, else purchase units.
- Monthly preview table shows funeral units and units held after.
- Tests: -14 ÷ 3.1024 at full precision with -4.51 display; next month MA uses reduced units; legacy batch counts as zero; stale hash rejected; fee units stay blank.
- Update AGENTS.md rule ("units held never change" → reduced only by stored funeral units). backup-main, local commit, no push/deploy.
