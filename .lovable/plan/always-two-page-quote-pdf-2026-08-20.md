# Always-two-page quote PDF

## Problem

Today the PDF is generated at a fixed font size, and every table carries `break-inside: avoid`. When a table does not fit in the remaining space on page 1, it jumps whole to page 2 — leaving a large blank gap — and long quotes still spill onto a third page. Page count is therefore unpredictable (1, 2 or 3+) and page 1 often looks half empty.

## Approach: auto-fit to exactly two pages

Keep the "never split a table" rule, but let the renderer shrink the whole document until everything fits inside two A4 pages, and pad it out when it is too short.

### 1. Backend — measure and scale (`backend/server.js`, `/api/quotes/html-to-pdf`)

- Accept optional `{ targetPages: 2 }` in the request body (defaults to 2 when supplied by the quote export).
- Render once with Puppeteer, then loop: generate the PDF, read its page count, and if it exceeds the target, re-render with a smaller `scale` (Puppeteer's `page.pdf({ scale })`), binary-searching between `1.0` and `0.6` for the largest scale that still yields 2 pages (max ~6 iterations, all in the same browser session so it stays fast).
- Page count is read from the produced buffer (`pdf-lib`/`pypdf`-equivalent in Node: count `/Type /Page` objects, or use the already-present PDF tooling).
- If even `0.6` needs 3 pages, return the 0.6 version rather than failing — the quote stays readable and we log a warning.
- Trim the page margins from `20mm` top/bottom to `12mm` to match the `@page` rule already in the export CSS (they currently fight each other and waste vertical space).

### 2. Frontend CSS — remove the blank-gap causes (`frontend/src/lib/pdfExport.ts`)

- Pass `targetPages: 2` in the POST body.
- Keep `break-inside: avoid` on tables and `.scenario-block`, but drop it from the generic `.grid` rule so the client-info block can flow if needed.
- Add a forced `break-before: page` on the Customer Acceptance / Terms & Conditions block so page 2 always starts with a predictable section instead of whatever falls over — this removes the "one table then empty space" look by making the break intentional.
- Let the signature + terms block stretch (`margin-top: auto` on a flex column body) so page 2 fills naturally rather than ending halfway.

### 3. Verification

Export a short quote (single scenario) and a long one (3+ scenarios) and confirm both come back as exactly two pages with no split tables and no large mid-page gaps.

## Out of scope

- No change to the quote content, calculations or on-screen display.
- No change to which sections appear — only their pagination and scale.
