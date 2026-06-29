# Living Annuity — Multi-Scenario Quoting

Yes, this is very doable, and the side-drawer pattern from your reference is a great fit. Here's the proposed flow and structure.

## UX Flow

1. User opens **New Quote → Living Annuity**. Form looks the same as today, but the page now has a **"Scenarios" tab/button** floating at the top-right (with a count badge, e.g. `Scenarios · 3`).
2. User fills inputs → clicks **Calculate**. Instead of jumping straight to a saved quote, results render inline AND a new entry is pushed into a **Scenarios drawer** on the right.
3. User can:
   - Tweak inputs (e.g. change drawdown %, guarantee period, frequency) and click **Calculate** again → adds Scenario B, C, D…
   - Open the drawer anytime to review, rename ("Conservative 5%", "Aggressive 12%"), duplicate, or delete scenarios.
4. In the drawer, each scenario card shows the key outputs (monthly income, guaranteed period, funds remaining) plus a **checkbox**.
5. User selects 1–N scenarios → clicks **Generate Quote**.
6. Client details modal opens (name, DOB, ID, contact, email) → on save, a **single quotation** is produced containing all selected scenarios side-by-side.

## Scenario Drawer (right pane)

```text
┌─ Scenarios (3) ───────── × ┐
│ [ Select all ]             │
│ ┌────────────────────────┐ │
│ │ ☑ Scenario A   ⋮       │ │
│ │   Drawdown 5% · 5y gtd │ │
│ │   BWP 4,820 / month    │ │
│ │   Fund left: 1,240,000 │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ ☑ Scenario B   ⋮       │ │
│ │   Drawdown 8% · 10y    │ │
│ │   BWP 7,710 / month    │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ ☐ Scenario C   ⋮       │ │
│ └────────────────────────┘ │
│                            │
│ [ Generate Quote (2) ]     │
└────────────────────────────┘
```

Drawer slides in from the right, glass styling consistent with the dashboard. Closed state is a thin pinned tab on the right edge with the scenario count.

## Quotation Output (selected scenarios → one PDF)

- **Cover / header**: client, quote ID, date, single premium amount, prepared by.
- **Scenario comparison table** (the headline new section):

```text
                  Scenario A     Scenario B     Scenario C
Drawdown %        5%             8%             12%
Frequency         Monthly        Monthly        Monthly
Guarantee period  5 years        10 years       0 years
Monthly income    4,820          7,710         11,560
Annual income    57,840         92,520        138,720
Funds remaining 1,240,000      1,015,000        710,000
```

- Per-scenario detail blocks below the table (one short panel each) with the existing annuity output fields.
- Disclaimer & T&Cs once at the bottom.

In the on-screen quote view, the same table renders with a tab/segment switcher so users can also drill into each scenario.

## Technical Notes

- Scenarios live in a client-side store (React context or `useReducer`) keyed by a session ID; persisted to `sessionStorage` so a refresh doesn't lose work. No backend changes needed to start.
- New types: `AnnuityScenario { id, label, inputs, outputs, createdAt }` and `ScenarioDraft { scenarios: AnnuityScenario[], clientDraft? }`.
- New components:
  - `ScenarioDrawer.tsx` — right-side Sheet with list, select, rename, delete, generate.
  - `ScenarioCard.tsx` — single scenario summary.
  - `GenerateQuoteDialog.tsx` — client details capture + submit.
  - `MultiScenarioAnnuityDisplay.tsx` — comparison table + per-scenario detail panels.
- `LivingAnnuitiesQuotationForm.tsx` updated so **Calculate** pushes a scenario into the store instead of (or in addition to) showing a single result inline.
- `pdfExport.ts` gets a new `renderMultiScenarioAnnuity` path that consumes an array of scenarios.
- Backend: extend the annuity quote schema with `scenarios: [...]` (optional, falls back to single-scenario for legacy). A second small task once UI is approved.

## Build Order

1. Scenario store + drawer UI + add-from-form (no PDF changes yet) — you can play with the flow.
2. Generate Quote dialog + on-screen multi-scenario display.
3. PDF multi-scenario layout.
4. Backend schema extension + persistence.

I'll start with step 1 once you approve, and show you the on-screen multi-scenario output (step 2) before touching the PDF so you can shape it.
