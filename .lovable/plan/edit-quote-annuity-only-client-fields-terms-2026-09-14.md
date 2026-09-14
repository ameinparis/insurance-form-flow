# Edit Quote — Annuity Only (Client Fields + Terms)

Add an "Edit" mode to the Annuity quote detail page that lets an advisor correct the client's personal details and the terms text, without touching any calculation inputs or outputs.

## Current state (verified)

- Detail page: `frontend/src/pages/QuoteDetail.tsx` — renders `AnnuityDisplay` for annuity quotes, fetches via `fetchQuoteDetails()` in `frontend/src/lib/quoteUtils.ts`.
- Annuity client data lives in `quote.client` (`fullName`, `dateOfBirth`, `gender`, `idNumber`, `contactNumber`, `email`) — the schema stores `client` as a flexible Mixed object (`backend/server.js`, newQuoteSchema).
- Terms text: `quote.termsAndConditions` (top-level string field on the schema).
- Existing edit precedent: `PATCH /api/new-quotes/:id/notes` only updates `medicalUnderwritingNotes`. There is **no general update endpoint** — one will be added.
- Retrieve endpoint: `GET /api/new-quotes/:id`.

## What will be editable

Six fields inside `client`: `fullName`, `dateOfBirth`, `gender`, `idNumber`, `contactNumber`, `email`. Plus a seventh, top-level value: `termsAndConditions`.

Everything else stays read-only: quote number, created by/date, age, purchase amount, frequency, drawdown, guarantee fields, commissions, and all `inputs`/`outputs`.

## Implementation

### 1. Backend — new endpoint (`backend/server.js`)

Add `PATCH /api/new-quotes/:id/client` (authenticated) that:

- **Product-type guard:** loads the quote first and rejects with 400 unless `productType === "Exclusive Annuity"` — this endpoint is annuity-only, no other product type can be edited through it.
- **Role restriction:** `req.user.role` comes from the JWT (backend roles are `"user"`, `"admin"`, `"superuser"`). Only Advisor (`"user"`) and Admin (`"admin"`, plus `"superuser"` as the admin-level superrole) may update; anything else gets 403.
- Accepts only `{ client: {...}, termsAndConditions }`.
- Whitelists the six client fields server-side (`fullName`, `dateOfBirth`, `gender`, `idNumber`, `contactNumber`, `email`) plus top-level `termsAndConditions`, ignoring everything else in the payload, so `inputs`/`outputs`/`quoteId` can never be modified through this route.
- Does **not** replace the `client` object. Builds a `$set` using dotted paths (`client.fullName`, `client.email`, ...) for only the fields present in the request, so every other existing property inside the Mixed `client` object is preserved.
- Required-field validation matches the current annuity form exactly (verified in `LivingAnnuitiesQuotationForm.tsx`, line 306): `fullName`, `dateOfBirth`, `idNumber`, `contactNumber`, `email` are required; `gender` is optional.
- Logs an audit entry `QUOTE_UPDATED` with the changed fields.
- Returns the updated quote.

### 2. Frontend — edit UI on `QuoteDetail.tsx`

- Add an "Edit Quote" button (pencil icon) in the sticky action bar, next to Download PDF — visible **only** for new-schema quotes with `productType === "Exclusive Annuity"`. Legacy annuity quotes loaded via `legacy=true` (old `Quotations` model) stay read-only: no button, no dialog.
- Clicking it opens a dialog (reusing shadcn `Dialog`) titled "Edit Client Details" with inputs prefilled from `quote.client`:
  - Full Name (text), Date of Birth, Gender (select: Male/Female), ID Number (text), Contact Number (tel), Email (email).
  - Date of Birth displays as `dd.MM.yyyy` in the picker but is written back in the exact storage format already used at creation — `yyyy-MM-dd` (confirmed: `format(date, "yyyy-MM-dd")` in the annuity form). No format migration, and an unchanged DOB is sent back byte-identical.
  - Terms & Conditions (textarea), prefilled from `quote.termsAndConditions`.
- Required-field validation (fullName, dateOfBirth, idNumber, contactNumber, email; gender optional) with inline messages; Save disabled with a spinner while submitting.
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
