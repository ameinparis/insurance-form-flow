
Looking at the two images:

**Image 1 (target/reference docx):** Two-column grid layout. Left column: Name, Gender, Education, Marriage Status. Right column: Date of Birth, Age, Smoker Status, Income. Each field has a label on top with a value below, separated by an underline. Product Information section also styled cleanly.

**Image 2 (current PDF export):** Single-column stacked list. Each field is a row with `Label:Value` (no space after colon, e.g., "Name:Test", "Date of Birth:3 January 1990"). All squeezed on the left side. Product Information is two-column (label left, value right) which is fine.

**No, they don't match.** Differences:
1. Personal info layout: current is single-column stacked; target is 2-column grid (label above, value below).
2. Missing space after colon ("Name:Test" instead of "Name: Test").
3. "Marriage Status" — both look fine label-wise, but layout differs.

## Plan

Fix the Individual Life PDF export so the personal info section matches the reference docx layout.

### Changes to `IndividualLifeDisplay.tsx` (Personal Information section)

Restructure into a **2-column grid** where each cell shows:
- Label on top (muted color, small)
- Value below (regular weight)
- Bottom border separator under each cell

Layout (left col / right col):
```
Name              | Date of Birth
Gender            | Age
Education         | Smoker Status
Marriage Status   | Income
```

Use `grid grid-cols-2 gap-x-12 gap-y-6` with each cell containing stacked label/value and a `border-b border-border pb-2`.

### Why this works
- Matches reference docx exactly.
- Adds breathing room and proper spacing (no more "Name:Test" cramming).
- PDF export already renders the component HTML directly via `pdfExport.ts`, so updating the display component automatically fixes the PDF.

### Files to edit
- `frontend/src/components/quote-displays/IndividualLifeDisplay.tsx` — Personal Information block only. Product Information section stays as-is (already matches).

### Out of scope
- No changes to `pdfExport.ts` (already handles Medical Underwriting correctly).
- No changes to other display components.
