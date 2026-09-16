# True A4 quote preview pagination

## Goal
Keep the current Quote Detail viewer, toolbar, quote styling, editing, PDF download, and backend unchanged while rendering the on-screen quotation as real, separate A4 sheets.

## Implementation

### 1. Add a small A4 pagination layer
- Add a focused pagination component beside `DocumentViewer` that owns the page measurements and page list.
- Use the PDF export dimensions: A4 `210mm × 297mm` with `12mm` content margins.
- Measure the rendered quote blocks in an off-screen layout at the same A4 content width, then assign each block to the first page where it fits.
- Render each assigned group once inside its own white A4 sheet; do not duplicate the full quote or clip a continuous document.
- Recalculate after quote data, edit state, fonts, asynchronous annuity values, or viewer width changes.

### 2. Define safe quote pagination blocks
- Split the existing Quote Detail content into logical React blocks without changing their visual classes or text.
- Expose the annuity sections as pagination-safe blocks: customer details, each complete scenario card/group, life-annuity table, fees/signature, and terms.
- Keep each `.scenario-block` atomic whenever it fits on one page. If any single block is taller than an A4 content area, allow that exceptional block to flow rather than losing content.
- Preserve the current live inputs and handlers in the rendered blocks so Edit Quote remains fully interactive.

### 3. Extend the existing viewer behavior only
- Keep the current grey canvas, toolbar, buttons, zoom levels, and styling.
- Render the paginated sheets in a vertical stack with a visible gap and existing paper shadow.
- Make zoom and Fit Width apply to the complete page stack without changing page dimensions or introducing horizontal drift.
- Derive the toolbar total from the generated pages.
- Observe page positions inside the existing scroll canvas and update the current page to the sheet nearest the viewport reading position.

## Files expected to change
- `frontend/src/components/document-viewer/DocumentViewer.tsx`
- `frontend/src/pages/QuoteDetail.tsx`
- `frontend/src/components/quote-displays/AnnuityDisplay.tsx`
- One small new pagination component under `frontend/src/components/document-viewer/`

## Explicitly unchanged
- PDF export code and output
- Backend and API endpoints
- Quote calculations and data
- Existing toolbar design and actions
- Existing inline editing behavior and save flow

## Verification
- Build the frontend.
- Open short and multi-scenario annuity quotes and verify real A4 sheets, accurate page totals, current-page updates while scrolling, intact scenario cards, and no missing content.
- Verify Edit Quote fields still accept changes and Save/Cancel still work.
- Verify zoom and Fit Width affect all sheets together.
