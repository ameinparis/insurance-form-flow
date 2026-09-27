# Reference-led quotation preview redesign

## Goal
Restyle only the quotation preview shell and Exclusive Annuity document header to closely follow the two supplied references, while preserving quotation data, editing, calculations, scrolling, and the existing A4 PDF export behavior.

## Preview shell
- Replace the compact utility bar with a shallow, spacious preview header inside a large rounded light-grey shell.
- Show “Preview” with an information icon on the left; present Back, Edit/Save/Cancel, and PDF download as simple icon-and-text actions on the right.
- Keep the header and controls visible while the quotation scrolls, separated by a subtle divider.
- Centre the white A4-width document below with generous grey space, a restrained border, and a soft shadow.

## Quotation document
- Recompose the top into a genuinely page-centred logo, left-aligned company details, and right-aligned product/quote/date metadata.
- Increase the logo’s prominence and use airy light blue-grey uppercase labels and a thin full-width divider.
- Place “QUOTATION FOR”, the client name, and “CLIENT DETAILS” directly beneath the divider with the reference’s generous editorial spacing.
- Keep all subsequent quote sections and values unchanged, adjusting only the first client-section heading to avoid duplication.

## Export and responsiveness
- Carry the refined header hierarchy into the PDF-specific styles without changing A4 size, margins, page-break safeguards, or page count logic.
- Collapse the preview toolbar and document header cleanly on narrow screens while keeping actions accessible.

## Verification
- Check the quotation at desktop and mobile widths.
- Confirm the toolbar stays visible while scrolling and all controls still work.
- Confirm the app builds and the PDF stylesheet retains A4 pagination rules.
