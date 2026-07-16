## Goal

Restructure the multi-scenario annuity quote output so each Living Annuity calculation is shown as its own block, with a Life Annuity table for the standard 5 / 10 / 15 / 20-year guarantee periods underneath it — matching the client's description and the first/last uploaded sketches.

## Current behaviour

- **Single scenario**: already shows Living Annuity details, then a "Life Annuity — Guarantee Period Options" table with 5/10/15/20-year rows. This is the shape the client wants.
- **Multi-scenario ("Annuity Income Options")**: renders a wide side-by-side table where each column is one scenario and the Life Annuity is one row with a single guarantee period. This is the format to replace.

## New layout (multi-scenario mode)

For each saved scenario, render a self-contained vertical block:

```text
─────────────────────────────────────────────
Option 1 — 6% Drawdown · 30-Year Guarantee · Monthly

  Living Annuity
    Drawdown                6%
    Frequency               Monthly
    Living Guarantee        30 years
    Living Annuity/month    BWP 4,000.00
    Funds Remaining         BWP 5,811,118.20

  Life Annuity — Guarantee Period Options
    5 years    BWP …
    10 years   BWP …
    15 years   BWP …   (selected)
    20 years   BWP …
─────────────────────────────────────────────
Option 2 — …
```

Blocks stack vertically, no horizontal scrolling, natural page flow in the PDF.

## Changes

### `frontend/src/components/quote-displays/AnnuityDisplay.tsx`
- Extract the existing single-scenario Life table into an internal `LifePeriodsTable` component so it can be reused per scenario.
- Replace the chunked wide table in the `hasScenarios` branch with `scenarios.map(...)` rendering one block per scenario:
  1. Small heading: `Option N — {scenario.label}`.
  2. Compact 2-column "Living Annuity" summary (Drawdown, Frequency, Living Guarantee Period, Living Annuity per period, Funds Remaining) reusing the current detail-row styling.
  3. `LifePeriodsTable` for 5/10/15/20 years — marking the scenario's own `outputs.life.guarantee_period` as `(selected)` with bold value.
- Fetch life periods per scenario via `fetchLifeAnnuityPeriods(scenario.inputs.guaranteedStartAge, scenario.inputs.lifePurchaseAmount ?? scenario.inputs.purchaseAmount, { guarantee_period, monthly_annuity })`, seeded with the scenario's known value so only the missing 3 periods hit the API. Prefer `scenario.outputs.life.periods` when pre-injected.
- Remove the chunking logic (`SCENARIOS_PER_CHUNK`, `scenario-chunk` wrappers).

### `frontend/src/lib/pdfExport.ts`
- Drop the now-unused `.scenario-chunk` CSS rules. Keep `thead { display: table-header-group }` and `tr { break-inside: avoid }` so per-scenario tables paginate cleanly without forced breaks.
- If existing code pre-fetches `outputs.life.periods` for PDF export in the single-scenario case, extend it to populate the same field on each scenario before rendering; otherwise the runtime fetch in `AnnuityDisplay` covers the on-screen view and the PDF renderer will pick up whatever is populated at render time.

## Out of scope

- No backend/calculation changes — reuses `fetchLifeAnnuityPeriods` and the existing `/api/quotes/calculate-annuity` endpoint.
- No changes to the input form or scenario-saving flow.
- Single-scenario view unchanged.
