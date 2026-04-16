

## Plan: Make Medical Underwriting Notes Editable & Saveable

### Problem
The Medical Underwriting textarea in IndividualLifeDisplay is a plain HTML element with no state — anything typed is lost on navigation/refresh and won't appear in PDF exports.

### Approach
Since there's no PATCH/PUT endpoint for quotes on the backend, we'll store the notes locally within the quote's existing data structure and add a backend endpoint to update it.

### Changes

**1. Backend — Add a PATCH endpoint for quote notes** (`backend/server.js`)
- Add `app.patch("/api/new-quotes/:id/notes", ...)` that updates a `medicalUnderwritingNotes` field on the quote document using `$set`.
- The Mixed schema already allows arbitrary fields, so no schema migration needed.

**2. IndividualLifeDisplay — Add state + save button**
- Accept an `onSaveNotes` callback prop and a `quoteId` prop.
- Add `useState` for the textarea value, initialized from `quote.medicalUnderwritingNotes` or empty string.
- Add a "Save Notes" button below the textarea that calls `onSaveNotes(notes)`.
- Show a subtle saved/unsaved indicator.

**3. QuoteDetail.tsx — Wire up the save handler**
- Pass `quoteId` and an `onSaveNotes` async function to `IndividualLifeDisplay`.
- The handler calls `PATCH /api/new-quotes/:id/notes` with `{ medicalUnderwritingNotes }`.
- Show a toast on success/failure.

**4. PDF Export — Include the notes** (`frontend/src/lib/pdfExport.ts`)
- When generating HTML for Individual Life Cover quotes, check for `medicalUnderwritingNotes` on the quote object and render it in the PDF output.

### Technical Details
- The quote MongoDB schema uses `mongoose.Schema.Types.Mixed` for flexible fields, so adding `medicalUnderwritingNotes` requires no schema change.
- The PATCH endpoint will be auth-protected using the existing `authenticateToken` middleware.
- The save button will use the accent color for consistency.

