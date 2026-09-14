# Edit Quote

Let an advisor correct a saved quote instead of rebuilding it from scratch, with pricing figures always recalculated rather than typed in by hand.

## Behaviour

- An **Edit** button appears on the quote view page next to Back and Download PDF.
- Editing opens the quote in the same form the advisor originally used, prefilled with the saved values.
- Client details and product inputs are editable. Calculated results are shown read-only.
- If any pricing input changed, the quote is re-priced on save and the new figures replace the old ones. If only names, contacts or text changed, nothing is re-priced.
- Saving keeps the same quote number and updates the record in place. Who edited it and when is recorded in the audit trail.
- Permissions: the advisor who created the quote, plus Admin and Super Admin.
- A quote that has already been converted into a policy is locked — the Edit button is hidden with a short note explaining why.
- After saving, the advisor lands back on the quote view showing the updated document, ready to download.

## Fields

Editable:

- Annuity / Individual Life client: full name, date of birth, gender, ID number, contact number, email
- Funeral client: company name, registration number, company contact, company email
- Group Life client: scheme name and contact details
- Annuity inputs: age, purchase amount, frequency, drawdown, guaranteed start age, guarantee period, life purchase amount, upfront and ongoing commission
- Individual Life inputs: age, gender, smoker status, education, income, marital status, product, term, cashback option, death / disability / critical illness cover
- Funeral inputs: profit target, member list
- Group Life inputs: max death benefit, max ODB, salary multiplier, member roster
- Terms & conditions, medical underwriting notes

Not editable (recalculated or system-owned):

- All result figures: guaranteed annuity, funds remaining, retirement annuity, monthly and annual life annuity, funeral premiums per member status, Individual Life premium breakdown, Group Life cover results
- Quote number, created-by, created date

## Technical notes

Backend (`backend/server.js`):

- Add `PUT /api/new-quotes/:id` — accepts `{ client, inputs, outputs, termsAndConditions }`, preserves `quoteId`, `createdBy`, `createdAt`; per-product required-field validation reused from the `POST /api/new-quotes` handler (lines 1178-1193); writes a `QUOTE_UPDATED` audit entry via `logAudit`.
- Guard: reject if the quote is referenced by an approved policy/conversion; return a clear message.
- Legacy quotes (`Quotations` collection, `/api/quotes`) stay read-only in this pass.

Frontend:

- `frontend/src/pages/QuoteDetail.tsx` — add the Edit action, hidden when locked or when the user lacks permission (`frontend/src/lib/permissions.ts`).
- `frontend/src/components/FormRouter.tsx` and the four live forms (`LivingAnnuitiesQuotationForm`, `LifeFuneralQuotationForm`, `IndividualLifeCoverForm`, `GroupLifeAssuranceForm`) — accept optional `initialQuote` / `editingQuoteId` props to hydrate state from a saved quote and switch the submit path from POST-create to PUT-update.
- New route `/quotes/:id/edit` in `frontend/src/App.tsx` loading via `fetchQuoteDetails` (`frontend/src/lib/quoteUtils.ts`).
- Recalculation reuses the existing `/api/quotes/calculate-*` calls each form already makes; a dirty-check on the pricing inputs decides whether to call them.
- Invalidate the `quotes-list` query (`frontend/src/hooks/useQuotesList.ts`) after a successful update.

Scope note: `CriticalIllnessCoverForm`, `CreditLifeCoverForm` and `OccupationalDisabilityForm` are stubs with no saved quotes, so they are out of scope.
