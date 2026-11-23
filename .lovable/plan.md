# Phase 3C Review — Excel discrepancies

## Findings (verified by recomputation)

**1. Market Price Adjustment amount (10,003.72 vs 9,992.17) — not a calculation bug.**
Both use Units held x (New price - Previous price), rounded to cents.
- Platform: 442,642.3793752841 x (3.102400 - 3.079800 = 0.0226) = 10,003.7178 -> 10,003.72. Correct for the price recorded on 24.11.2026.
- Excel: 9,992.17 / 442,642.379... = 0.022574, so Excel's hidden June price is about 3.1023739 (shown as 3.10), not 3.1024. Same pattern as the hidden 3.0798 behind "3.08".
- Different input price, same method. No change.

**2. Administration Fee (1,143.92 vs 1,143.91) — caused by the difference above, not by rounding.**
Excel's fee equals 0.0833% x its CB1 (1,373,242.17 x 0.000833 = 1,143.9107 -> 1,143.91). It does not match CB2 (that gives 1,143.90).
Platform: 0.0833% x its CB1 (1,373,253.72) = 1,143.9203 -> 1,143.92.
So the fee is taken from CB1 (before the funeral premium), with half-up rounding to cents, as approved. The 1 thebe difference comes only from the higher CB1. No change. To confirm: the fund's fee is set to 0.0833 on staging.

**3. Closing balances — already worked out one after another.**
CB1 = previous CB + MA; CB2 = CB1 - premium; CB3 = CB2 - fee. Each step uses the saved two-decimal value. Screenshot check: 1,363,250.00 + 10,003.72 = 1,373,253.72; minus 14.00 = 1,373,239.72; minus 1,143.92 = 1,372,095.80. All correct. No change.

**4. Unit Price on the Market Price Adjustment row — needs a change (display only).**
Today that row shows the new price (3.102400). Excel shows the price movement.
Change: show the movement, worked out from the two prices already saved on the batch (newUnitPrice - previousUnitPrice), shown to 6 decimals (e.g. 0.022600). Show a minus sign when the price falls.
Funeral Cover Premium and Administration Fee rows keep showing the new unit price, as Excel does.
Old standalone adjustment records (retired) do not store the previous price. They keep showing the new price, so no value is made up.

## Noted, not changed
Excel shows notional units on the deduction rows (-4.51, -506.29). These are amounts divided by price; they are not redemptions. As instructed, the platform keeps a dash and leaves units held unchanged until redemptions are approved.

## Scope
- Display only: `frontend/src/lib/investmentStatement.ts` (MA row unit price = stored new - stored previous, using decimal maths) and the monthly preview table so it matches.
- Add a test: MA row shows 0.022600 for prices 3.0798 -> 3.1024, and a negative value when the price falls; deduction rows still show the new price.
- No backend, calculation, stored record or unit holding changes. Confirmed batches are untouched. Only how they are displayed changes.
- Work on backup-main; local commit only; no push or deploy.
