## Goal

Make the exported quote PDF reliably fill exactly two pages — no half-empty first page, no third page.

## Why the gap appears today

`frontend/src/lib/pdfExport.ts` currently forces:

```css
table, .scenario-block { break-inside: avoid !important; page-break-inside: avoid !important; }
```

So if a scenario block or a table can't fit in the space left on page 1, the whole element is pushed to page 2 — leaving the rest of page 1 blank. Combined with fixed font sizes, the content either under-fills or overflows unpredictably.

## Approach

Two levers, both in the PDF export layer only (on-screen view untouched).

### 1. Smarter pagination rules (`frontend/src/lib/pdfExport.ts`)

- Drop the blanket `break-inside: avoid` on `table` and `.scenario-block`. Keep it only on rows (`tr`) and on the small customer-detail grid, so tables may split across the page boundary instead of jumping wholesale.
- Add `orphans: 3; widows: 3` so a split never leaves a lone row stranded.
- Keep `thead { display: table-header-group }` so a split table repeats its header on page 2.
- Add `.pdf-page-break { break-before: page }` before the Customer Acceptance / Terms block so signature + terms deliberately anchor page 2 rather than floating.

### 2. Auto-fit scaling pass

Wrap the rendered content in a `#pdf-root` div and drive density through CSS variables (base font size + vertical rhythm multiplier). Ask the PDF service for the render, measure the returned page count, and if it is not 2, re-render once or twice with an adjusted scale:

- 3+ pages → step density down (10.5px → 9.75px → 9px, tighter spacing).
- 1 page → step density up (11.5px → 12.5px) so the content spreads into a full two pages instead of stopping mid-page-one.

Page count is read from the returned PDF blob (count `/Type /Page` occurrences in the byte stream — no extra dependency). Cap at 3 attempts and keep the closest result, so a download never hangs.

## Behaviour at the edges

- Very long quotes (many scenario options) that still exceed two pages at the smallest density: export at the smallest density and let it flow to 3 pages rather than making text unreadable.
- Very short quotes stretch to fill two pages, but content is never artificially padded — the signature/terms block simply anchors page 2.

## Out of scope

- No changes to `AnnuityDisplay.tsx` or any on-screen layout.
- No backend/calculation changes; the existing `/api/quotes/html-to-pdf` endpoint is reused as-is.
