# Softer continuous quotation viewer

## Goal
Refine only the Exclusive Life quotation viewer and document styling into a softer, modern continuous reading experience while keeping PDF export independently paginated as A4.

## Screen viewer
- Keep the existing sticky toolbar, Back, Edit, Save/Cancel, Zoom, Fit Width, and Download actions.
- Reduce the grey gutter to roughly 16–24px and let the white document occupy about 92–96% of the viewer width.
- Present one uninterrupted white document with 16–20px outer corner radius, a fine border, and a restrained shadow.
- Keep natural vertical scrolling with no visible page seams or page-sized clipping.

## Document header
- Recompose the header as a three-zone layout: company address/contact on the left, logo anchored to the true horizontal page centre, and product/quote/date metadata on the right.
- Add a thin divider below the complete header.
- Keep the client quotation title below the header at a controlled editorial scale.
- Collapse the layout cleanly on narrow screens without losing essential metadata.

## Document styling
- Lighten heading weights and reduce oversized type.
- Use uppercase small labels, restrained tracking, dark navy/charcoal text, muted blue-grey labels, subtle brand-blue accents, and thin rules.
- Remove the boxed/card-heavy feeling from scenarios and tables; use alignment and separators as the primary structure.
- Tighten excess whitespace while preserving readable section rhythm.

## PDF preservation
- Keep the existing server PDF pipeline, A4 size, 12mm margins, calculated page count, break rules, and keep-together behavior.
- Add print-specific header and document rules matching the refined typography without using the continuous viewer dimensions or rounded screen paper as page geometry.
- Preserve scenario, fees/signature, and justified terms pagination protections.

## Verification
- Check desktop and narrow viewport presentation.
- Confirm continuous scrolling, sticky toolbar actions, zoom, and Fit Width.
- Confirm the project builds and the PDF styles retain A4 pagination rules without inheriting screen-only sizing.
