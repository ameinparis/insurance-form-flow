# Phase 3A: Investment Statement (display only)

## What you will see
In Client Policy Record → Investment Portfolio → a fund, a new **Investment Statement** section below the purchase details, with six columns matching the workbook's "Dummy Data" sheet:

Date | Description | Number of Units | Unit Price | Market Value | Closing Balance

- If the fund has a recorded initial purchase: one row — purchase date, "Net Investment Amount", purchased units (2 dp), recorded purchase price (6 dp), investment amount (BWP, 2 dp), initial closing balance (BWP, 2 dp).
- Otherwise: "No investment transactions recorded yet."
- Visible to everyone who can already view the policy's investments (Advisors, authorised Admins, Super Admin). No new buttons or write actions.

## Approach
- Build the rows from the existing purchase record only, which the panel already loads via the existing authorised purchase list. No new data is stored, and no balances or entries are invented.
- A small shared "statement" builder turns stored records into rows, sorted by date. It knows the future transaction types (Market Price Adjustment, Funeral Cover Premium, Administration Fee, Investment Return, Salary Payment, Monthly Interest, Other), each with date, description, signed unit movement, price, signed money movement and resulting closing balance. Only the initial purchase type is produced now.
- Market Value means the row's money movement (as in Excel), not the total portfolio value. Closing Balance is taken from the stored record, not recalculated.

## Not included
No monthly adjustments, fees, funeral deductions, redemptions, returns, salary payments or balance calculations. No changes to policies, funding, allocations, valuations or purchases. No backend writes, no new collections or routes.

## Technical details
- New `frontend/src/lib/investmentStatement.ts`: `StatementEntryType` union, `StatementEntry` type (decimal strings, signed), `buildStatement(purchases)` mapping `PolicyUnitPurchase` view → entry, stable date sort; display formatting via existing decimal-string helpers (no float math on stored values).
- New `frontend/src/components/client/InvestmentStatementSection.tsx` using `ui/table`, rendered in the fund details panel in `PolicyRecordView.tsx` from the existing `useUnitPurchases` data filtered by fund ID.
- Signed money columns display negatives in brackets (ready for future debits).
- Tests: `investmentStatement.test.ts` — empty → no rows; purchase → exact row values from fixture with full-precision units preserved and 2/6 dp display; other fund's purchase excluded; chronological order. Run all backend + frontend tests and build.
- `AGENTS.md`: rule that statement rows derive only from stored transaction records and never recompute balances in the UI. Local commit on backup-main only; no push/deploy. Stop for review.
