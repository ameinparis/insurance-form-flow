# Continuous quotation preview

## Goal
Keep the existing Quote Detail viewer, toolbar, quote styling, editing, zoom, PDF download, and backend unchanged while making the on-screen quotation read as one seamless white document.

## Implementation
- Replace the annuity viewer's visible A4 page stack with one continuous white document surface inside the existing soft-grey workspace.
- Render the existing quote header, personal details, scenarios, fees/signature, and Terms & Conditions in their current order without page gaps or page-sized clipping.
- Keep the document at the existing A4 width so Zoom and Fit Width continue to behave consistently.
- Simplify the on-screen toolbar indicator because there are no visible screen pages; scrolling remains continuous.
- Leave PDF export code and its A4 pagination rules untouched, so downloaded quotes remain properly paginated.
- Preserve all inline Edit Quote fields and Save/Cancel behavior.

## Files expected to change
- `frontend/src/pages/QuoteDetail.tsx`
- `frontend/src/components/document-viewer/DocumentViewer.tsx`
- `frontend/src/components/quote-displays/AnnuityDisplay.tsx`
- Remove the now-unused on-screen pagination helper if nothing else references it.

## Verification
- Open an annuity quote and confirm it displays as one white, uninterrupted document on the grey workspace.
- Confirm there are no large page gaps, clipping, or duplicated content.
- Confirm Zoom, Fit Width, Edit Quote, and Download PDF still work.
- Confirm the downloaded PDF remains A4-paginated.
