# Editorial quotation document redesign

## Goal
Redesign only the Exclusive Annuity quotation document and its PDF output as a calm, premium editorial document. Keep the existing viewer controls, inline editing, calculations, data, download behavior, backend, and continuous on-screen reading experience unchanged.

## Design direction
- Keep the document centered at A4 width on the existing soft-grey viewer canvas, with a subtle paper edge and restrained shadow.
- Use a refined editorial hierarchy: compact brand masthead, prominent “Quotation for [Client Name]” title, clear section labels, readable body copy, and generous but print-conscious spacing.
- Keep the current Exclusive Life logo and company details, reorganized into a clean two-part header with quote number and date treated as document metadata.
- Present client details in a balanced two-column definition layout with quiet dividers and stronger label/value contrast.
- Restyle annuity scenarios as structured option panels with a clear option heading, key figures, and restrained tables rather than dashboard-like cards.
- Give fees, terms, acceptance, and signature areas distinct section hierarchy with subtle rules and tidy spacing.
- Use the existing Urbanist and Wix Madefor Display fonts, brand navy and blue accents, and semantic document tokens.

## Implementation
- Add quotation-specific semantic tokens and reusable document classes in the global stylesheet, including screen and print-safe variants.
- Update `QuoteHeader` into the editorial masthead while preserving all existing information and fallback logo behavior.
- Restyle `AnnuityDisplay` markup and classes only; retain calculations, scenario grouping, asynchronous values, and inline edit fields.
- Update the Terms & Conditions wrapper in `QuoteDetail` to match the document system without changing edit/save behavior.
- Refine the paper and neutral workspace treatment in `DocumentViewer` without changing toolbar controls, zoom, Fit Width, scrolling, or layout behavior.
- Replace the PDF’s broad utility-size overrides with quotation-specific print rules so the export closely matches the preview while retaining A4, 12mm margins, keep-together scenario behavior, justified terms, and existing compact/two-page safeguards.

## Verification
- Open an Exclusive Annuity quote and check the complete document at desktop and narrower widths.
- Confirm Edit Quote fields, Save/Cancel, zoom, Fit Width, and sticky viewer actions still work.
- Export the quote and confirm the same visual hierarchy, readable borders, justified terms, intact scenario blocks, and A4 pagination.
- Run the project checks and verify no unrelated quote types or app pages changed.
