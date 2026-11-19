# Interactive Client Policy Record + Investment Funding

## What exists today (inspected)
- Approved policies show in Client Details through a read-only `PolicyRecordView` (Policy Details, Premiums, Investment Portfolio, Documents cards). Portfolio data comes from the submitted snapshot (`readSubmittedPortfolio`), never the live catalogue.
- Policies endpoints: create/patch/submit/reassign/approve/return, pipeline, `GET /api/clients/:id/policies`. No funding, receipt or unit-holding data exists.
- Roles: only Super Admin (`superuser`), Admin (`admin`), Advisor (`user`) in both the backend user model and `permissions.ts`. **There is no Finance role yet.**
- Backend already has multer (memory storage), an audit-log helper and a route-test harness; the fund valuation module shows the pattern for Decimal128 + append-only history.

## Stage 1 — Clickable sections (UI only, no backend)
- Keep current card design; make each card (Policy Details, Premiums, Portfolio, Documents) open a full-detail panel (side sheet) with every saved field from the submitted policy.
- Each fund row in Investment Portfolio opens a **Policy Fund Details** view: fund name, asset manager, approved %, approved BWP amount (exactly as submitted), funding status, "Units purchased: No".
- Placeholder sections for Unit Holdings, Applicable Unit Price, Valuation, Performance and Growth Chart, labelled "Available after investment activation".
- Nothing recalculated; values come only from the submitted snapshot.

## Stage 2 — Finance role and permissions
- Add a `finance` role value (label "Finance") to the user model enum and `permissions.ts`, assignable by Super Admin (and Admin, if you want). New permission `canConfirmFunding`: Finance and Super Admin.
- Advisors and Admins: read-only on funding. Backend enforces this server-side; the UI only hides buttons.

## Stage 3 — Investment Funding backend
- New module `backend/policyFunding.cjs` (registered like fund valuations), collection `PolicyFunding` linked by policy ID:
  - receipts: amount (Decimal128, 2 dp), receipt date (calendar date, separate from entry time), bank reference, evidence file, notes, recordedBy + timestamp, status Recorded → Confirmed.
  - confirmation by a different user from the recorder (four-eyes); corrections need a reason and keep append-only history.
  - Unique bank reference per policy to prevent duplicates.
- Endpoints: `GET /api/policies/:id/funding`, `POST .../funding/receipts` (multipart evidence), `PATCH .../receipts/:receiptId/confirm`, `PATCH .../receipts/:receiptId` (correction), `GET .../evidence`.
- Only approved policies accept receipts. Every action written to the audit log.
- Funding status derived for display: Awaiting funds / Partially funded / Funded (confirmed total vs. approved net investment) — display only, does not touch the policy.
- Confirmation never purchases units, activates investments or edits the policy/allocations.

## Stage 4 — Investment Funding section in the UI
- New card directly below Investment Portfolio: status badge, expected vs. confirmed amount, receipts table, evidence links, audit trail.
- Finance/Super Admin see Record Receipt and Confirm buttons; Advisors see read-only.
- Fund Details view reads the funding status from here.

## Stage 5 — Tests and verification
- Backend tests: role guards (advisor/admin blocked), approved-only, duplicate reference, self-confirm blocked, correction requires reason, no policy/allocation mutation.
- Browser check with sample data for each role; build passes.
- Still needs your development MongoDB: evidence storage size limits and live authenticated readback.

## Out of scope
Unit purchases, investment activation, valuation of holdings, changes to approvals, calculations, net investment or allocations. No commit/push/deploy without approval; backup-main only.

## Decisions to confirm
1. Add a new Finance role (proposed) vs. reuse Admin.
2. Evidence storage: in MongoDB (simple, 5 MB limit per file proposed) vs. existing file storage if you have one.
3. Require a second person to confirm a receipt (proposed) or allow the recorder to confirm.
