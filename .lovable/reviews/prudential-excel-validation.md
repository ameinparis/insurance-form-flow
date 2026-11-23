# Prudential Excel validation — Phase 1 findings

## The initial units discrepancy is resolved

Inspected `Annuity_Investemnts-_Oratile_1.xlsb`, worksheet **Dummy Data**, using its original binary cell values/formulas and an independent temporary Excel conversion. The uploaded workbook has not been altered or imported into the application.

| Cell | Actual value/formula | Displayed value |
|---|---|---|
| B10 | `B6-B9` = 1,947,500 | BWP 1,947,500.00 |
| E17 | `B10*70%` = 1,363,250 | BWP 1,363,250.00 |
| D17 | **3.0798**, a supplied price | BWP **3.08** |
| C17 | `E17/D17` = **442,642.3793752841** (stored Excel value) | **442,642.38** units |

**The difference is caused by hidden display precision, not an extra charge or alternative initial-unit formula.** Excel divides by 3.0798, not 3.08, and does not round its underlying units to two decimals.

Decimal arithmetic reproduces 442,642.379375284109… units. Dividing by 3.08 instead yields 442,613.636363… units. Rounding units for display creates a BWP 0.001924 value difference; this is not a reason to change the approved amount or issue the displayed, rounded units.

The initial purchase row is dated **19 June 2025**. The workbook's commencement date is **12 June 2025**; these are distinct. D17 is an entered value, not a link to a verified price source, so a future purchase must still use the applicable recorded valuation.

## Monthly performance cannot yet be treated as a verified rule

The workbook contains market-price adjustments, administration deductions, funeral premiums and occasional investment-return credits. It is not simply unchanged initial units multiplied by a monthly price.

Specific matters requiring verification:

- **June administration units:** C20 is entered as **−506.292073498798** units. E20 is **−BWP 1,143.9107305983548**, with D20 = **3.1024**. Amount ÷ price gives **−368.718002384720…** units, not C20. The recorded units and cash deduction disagree.
- **August funeral deduction:** E25 is **−BWP 14**, but C25 uses `-E25/D25`, producing **positive 4.271678… units**. Earlier and later funeral deductions generally reduce units instead.
- **Market adjustment timing:** E18 uses `SUM(C16:C20)*(D19-D17)`, including June fee-unit deductions in the same month's price movement. Later months use similar ranges. This must be confirmed as intentional, not replaced with opening-unit growth without approval.
- **Additional credits:** E27 (BWP 13,704.52) and E46 (BWP 3,373.66) are entered investment returns and create units. Their source and distribution/reinvestment treatment are not defined by formulas.
- **Fee rate:** administration amounts use **0.0833% per month**. That is not exactly 1% ÷ 12. Do not substitute another rate or apply it to live policy calculations.
- The Prudential closing cash balance and units × price do not reconcile in June, and the two fund ledgers end on different dates. Do not treat the workbook's overall closing total as a same-date portfolio valuation.

A temporary conversion resolved the shared closing-balance formulas, checked all **254 formulas** and found **no formula-error cells**, with no numeric formula-cache differences greater than BWP 0.01. This confirms extraction/recalculation consistency, **not correctness of the financial methodology**; entered inconsistent units can still produce valid Excel formulas.

## What has been added on backup-main

- `backend/investmentPreview.cjs`: isolated, read-only decimal preview and submitted-allocation validation; **no registered endpoint, purchase, valuation entry or activation**.
- `backend/prudentialExcelReference.test.cjs`: **16 new tests** covering the workbook example, full price precision, display rounding, exact submitted amounts, snapshot conflicts, totals and independent fund identities.
- `backend/package.json` / `backend/package-lock.json`: decimal arithmetic dependency only; existing locked packages remain unchanged.
- `AGENTS.md` / `roadmap.md`: validation boundaries and remaining checks.

**Verification:** all **74 existing/new tests pass**; reading the uploaded workbook directly through the preview reproduces Excel's displayed units; preview application checks report build OK. No approval, funding, allocation or existing calculation code was changed. Nothing has been pushed or deployed.

## Before Phase 2

The Excel initial purchase formula is verified, but Phase 1 is **not fully complete**: the real approved policy's saved fund IDs, exact snapshot amounts, manager relationship, funding record and recorded price still require read-only development MongoDB verification. The user confirmed that actual holdings must retain high precision for storage and calculations, with two-decimal rounding used only for display; displayed units must never replace actual holdings or drive valuations.

Do not begin live purchases or monthly performance automatically. Monthly methodology remains held for reconciliation against a verified Prudential statement or administrator-approved reference.