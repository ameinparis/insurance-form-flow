# Edit Quote — Annuity Only (Client Fields + Terms)

Add an "Edit" mode to the Annuity quote detail page that lets an advisor correct the client's personal details and the terms text, without touching any calculation inputs or outputs.

## Current state (verified)

- Detail page: `frontend/src/pages/QuoteDetail.tsx` — renders `AnnuityDisplay` for annuity quotes, fetches via `fetchQuoteDetails()` in `frontend/src/lib/quoteUtils.ts`.
- Annuity client data lives in `quote.client` (`fullName`, `dateOfBirth`, `gender`, `idNumber`, `contactNumber`, `email`) — the schema stores `client` as a flexible Mixed object (`backend/server.js`, newQuoteSchema).
- Terms text: `quote.termsAndConditions` (top-level string field on the schema).
- Existing edit precedent: `PATCH /api/new-quotes/:id/notes` only updates `medicalUnderwritingNotes`. There is **no general update endpoint** — one will be added.
- Retrieve endpoint: `GET /api/new-quotes/:id`.

## What will be editable

`client.fullName`, `client.dateOfBirth`, `client.gender`, `client.idNumber`, `client.contactNumber`, `client.email`, and `termsAndConditions`.

Everything else stays read-only: quote number, created by/date, age, purchase amount, frequency, drawdown, guarantee fields, commissions, and all `inputs`/`outputs`.

## Implementation

### 1. Backend — new endpoint (`backend/server.js`)

Add `PATCH /api/new-quotes/:id/client` (authenticated) that:

- Accepts only `{ client: {...}, termsAndConditions }`.
- Whitelists the seven fields server-side (`fullName`, `dateOfBirth`, `gender`, `idNumber`, `contactNumber`, `email`) and ignores anything else in the payload, so `inputs`/`outputs`/quoteId can never be modified through this route.
- Validates the same required fields the create endpoint does (fullName, idNumber, email present for annuity).
- Logs an audit entry `QUOTE_UPDATED` with the changed fields.
- Returns the updated quote.

### 2. Frontend — edit UI on `QuoteDetail.tsx`

- Add an "Edit Quote" button (pencil icon) in the sticky action bar, next to Download PDF — visible only for annuity quotes (`productType` is "Exclusive Annuity" or legacy annuity).
- Clicking it opens a dialog (reusing shadcn `Dialog`) titled "Edit Client Details" with inputs prefilled from `quote.client`:
  - Full Name (text), Date of Birth (existing `DatePicker` component, `dd.MM.yyyy`), Gender (select: Male/Female), ID Number (text), Contact Number (tel), Email (email).
  - Terms & Conditions (textarea), prefilled from `quote.termsAndConditions`.
- Required-field validation (name, ID, email) with inline messages; Save disabled with a spinner while submitting.
- New helper `updateQuoteClient(id, payload)` in `frontend/src/lib/quoteUtils.ts` that calls the PATCH endpoint with the auth token.
- On success: update local `quote` state (so the displayed document, header, and any later PDF export reflect the change immediately), close the dialog, show a "Quote updated" toast. On failure: destructive toast, dialog stays open.
- The PDF export already renders from live quote state, so the downloaded PDF automatically reflects edits — no PDF changes needed.

## Out of scope

- Funeral, Life Assurance, and Individual Life quotes (edit button hidden for those).
- Recalculation or editing of any financial/calculation field.
- Editing legacy annuity quotes loaded via `legacy=true` (old `Quotations` model) — the edit button will only appear for new-schema annuity quotes.

## Technical details

| Item | Location |
|---|---|
| New endpoint | `PATCH /api/new-quotes/:id/client` in `backend/server.js` |
| API helper | `updateQuoteClient()` in `frontend/src/lib/quoteUtils.ts` |
| Edit dialog + button | `frontend/src/pages/QuoteDetail.tsx` |
| Reused components | shadcn `Dialog`, `Input`, `Textarea`, existing `DatePicker` |
