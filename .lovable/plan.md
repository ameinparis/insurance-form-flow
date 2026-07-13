# Fit many annuity scenarios on-screen and in the PDF

## Problem

The annuity quote output renders one column per scenario. With 12 scenarios:
- On screen, the table overflows horizontally and requires scrolling right.
- In the exported PDF, columns are cut off at the page edge because there's only one wide table with no break.

## Approach

Keep the current column-per-scenario layout (users are used to it), but **chunk scenarios into groups of N per table** (default **6**). Render one table per chunk, stacked vertically. In the PDF, add a page break between chunks so each table fits within one A4/Letter page.

## Changes

### 1. `frontend/src/components/quote-displays/AnnuityDisplay.tsx`
- Compute `chunks = chunk(scenarios, 6)`.
- Replace the single scenarios table with a `chunks.map(...)` that renders one `<table>` per chunk (same headers/rows as today, but only the scenarios in that chunk).
- Wrap each chunk in a container with `style={{ pageBreakInside: "avoid", breakInside: "avoid" }}` and add `style={{ pageBreakBefore: "always", breakBefore: "page" }}` on every chunk after the first — this only affects PDF/print, not screen.
- Add a small heading above each chunk when there is more than one: "Annuity Income Options (Scenarios 1–6 of 12)", etc.
- Remove the horizontal-scroll wrapper (or keep it as a safety net for very narrow screens) since each chunk of 6 fits standard widths.

### 2. `frontend/src/lib/pdfExport.ts`
- Add print CSS to `PDF_STYLES` so the page-break hints above are honored by the html-to-pdf renderer:
  ```css
  @media print {
    .scenario-chunk { page-break-inside: avoid; break-inside: avoid; }
    .scenario-chunk + .scenario-chunk { page-break-before: always; break-before: page; }
    table { page-break-inside: avoid; }
  }
  ```
- No changes to the backend PDF endpoint; the existing HTML-to-PDF pipeline respects CSS page breaks.

### 3. Chunk size
- Default 6 per table (fits portrait A4 comfortably with the current column widths).
- Expose as a single constant `SCENARIOS_PER_CHUNK = 6` at the top of `AnnuityDisplay.tsx` for easy tuning.

## Out of scope
- No changes to the calculator forms, backend, or scenario data model.
- No transpose/redesign — this is a layout-only fix so client-facing output stays visually consistent with quotes they've already seen.

## Result
- Screen: 12 scenarios render as two stacked tables of 6, no horizontal scroll.
- PDF: table 1 on page N, table 2 on page N+1, nothing clipped, works for any scenario count.
