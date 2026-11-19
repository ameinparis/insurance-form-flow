# Fund Details and unit-price history

## What the inspection found

- The checked-out development branch is `backup-main`; no production deployment is proposed.
- The current Investment Managers page already calls the existing application API for manager and fund create/edit operations. It is no longer the earlier React-only prototype, despite an outdated “Interface Preview” label and project guidance describing that phase.
- The backend already stores `AssetManager` and `AssetManagerFund` records in MongoDB. Funds have stable IDs and an asset-manager reference, plus name, code, type, risk and status.
- There is no unit-price model, valuation history, correction endpoint or fund-details endpoint yet.
- Administration already allows Super Admins and root-organisation Admins. However, the shared backend organisation guard also allows root-organisation Advisors: the new valuation endpoints need an explicit administrator check as well as the existing organisation check. Existing unrelated permissions will not be changed.
- The backend has an audit-log helper and a standalone route-handler test harness. The frontend already has suitable dialogs, tables, date controls and a line-chart library.

## Smallest proposed changes

### 1. Dedicated Fund Details view

Open a Fund Details view from an existing fund card within Administration → Investment Managers, with a back action to that manager’s fund list. Keep existing manager/fund create and edit forms.

Display:
- Fund name, code, Asset Manager, type, risk and status.
- Latest recorded unit price in BWP and its valuation date, chosen by valuation date rather than recording time.
- Historical valuations in a date-ordered table and line chart.
- Record Unit Price and Correct Valuation dialogs for authorised administrators.
- Audit history with recorder/corrector identity, timestamp, previous and replacement values, correction reason and optional source/notes.

Use the current application styling and authenticated session. Include loading, empty, save-in-progress, duplicate-date and error states. Do not fabricate initial prices.

### 2. Prices linked to existing funds

Add a small valuation collection linked to the existing fund ID—not a second fund catalogue. Each fund/date pair has one valuation record, with an append-only revision history.

- Store valuation dates as calendar dates to avoid timezone shifts.
- Store BWP unit prices with decimal-safe precision rather than rounding them to currency-display cents.
- Enforce one record per fund and valuation date with a compound unique database index; reject duplicates, including simultaneous submissions.
- A correction changes the price/source/notes on that valuation only after a non-empty reason is provided; its date and fund identity remain fixed.
- Preserve the original value and every correction in the same record’s revision history, including server-derived actor identity and timestamps.
- Use an atomic version-checked correction so simultaneous edits cannot erase another administrator’s correction.
- Never delete valuation history or cascade-delete it when profiles are removed; retain historical identifiers and recorded fund/manager identity.

### 3. Extend the existing API, not the workflow

Add only fund-scoped read, record and correction operations, reusing the existing authentication and organisation checks plus the explicit administrator restriction. Verify the requested fund belongs to the requested manager.

Write price and its revision history together; optionally also mirror the event to the existing general audit log. The per-valuation history is authoritative even if the general audit logger fails.

Keep unit-price data out of policy conversion and approval payloads. Recording or correcting a price must not purchase units, change allocations, activate a policy or recalculate submitted figures.

## Technical changes

- Add focused administration Fund Details and valuation dialog components, and a small valuation request hook/model.
- Add a “View Details” action to the existing fund cards; avoid a broader administration redesign.
- Add a valuation schema and narrowly scoped handlers alongside the existing asset-manager/fund API. Preserve all current fund IDs and records.
- Add the unique fund/date index before allowing valuation writes; no backfill or alteration of existing policy records.
- Reuse the existing chart dependency and design tokens; no new chart library or authentication service.
- Update the outdated prototype-only project guidance for this explicitly requested persistent administration extension, while keeping it isolated from policy calculations.

## Verification

- Test that two funds with matching names remain independent.
- Test duplicate fund/date rejection, valid calendar dates, positive finite decimal prices and required correction reasons.
- Test unauthorised roles, external-organisation access and mismatched fund/manager IDs.
- Test preservation of original valuations and every revision, server-generated actor/timestamps, concurrent correction protection and latest-by-valuation-date behaviour.
- Browser-check opening an existing fund, recording a price, retrieving it again, viewing history/chart, correcting it with a reason and reading the audit trail on desktop/mobile.
- Run applicable frontend and backend tests and check preview build results; confirm no policy calculation or approval changes.

## Boundaries and verification limitation

This proposal does not modify production, migrate to a different storage service, change existing policy records or broaden administrator access. No application implementation has been written yet.

Live authenticated API/database access has not been verified in this workspace. Mocked route tests can verify handler behaviour, but persistent end-to-end recording and the database unique index must also be checked against the development backend before claiming the feature fully verified.