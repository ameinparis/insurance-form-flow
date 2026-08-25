# Conversions workspace + Clients as approved policies only

Clients becomes a pure list of approved policyholders. Everything before approval — drafting, submitting, reviewing, approving or rejecting — moves into one section.

## Naming recommendation

Go with **Conversions**. It is accurate for every state a record can be in (draft, pending review, approved, rejected), it matches the language already used in the app and API (`/api/conversions`, "Convert to Policy"), and it reads naturally for both roles: an Advisor has "my conversions", a reviewer sees "conversions awaiting review". "Policy Pipeline" implies a sales funnel with stages and forecasting, which is not what this screen does. Page subtitle can carry the nuance: "Draft, submit and review quote-to-policy conversions."

## Changes

**1. Clients page**
- Remove the "In Progress" block entirely (and its Continue Editing / Resubmit / delete actions).
- Keep the approved-conversion backfill so every approved record still produces a client row.
- Add an empty state pointing to Conversions when there are no approved policies yet.

**2. Conversions page** (renames/extends the existing Approvals page)
- Sidebar entry: "Conversions" for all roles, same route behaviour, `/approvals` redirects to `/conversions`.
- Heading: "Conversions" with a role-aware subtitle instead of the current My Submissions / Approvals title split.
- New **Drafts** tab, first in the tab list, listing records with status `draft`. Scoped to the creator for everyone — reviewers do not see other people's unsubmitted drafts.
- Draft rows keep the actions that used to live on Clients: View, Continue Editing, Delete.
- Rejected rows keep the existing Resubmit action.
- Tab order — Advisor: Drafts, Pending, Approved, Rejected. Reviewer: Drafts, All, Assigned to me, Pending, Approved, Rejected.
- Add a Drafts tally card alongside Pending / Approved / Rejected.

**3. Cross-links**
- After saving a conversion draft, "back" destinations that currently point at Clients point at Conversions.

## Technical notes

- Files: `frontend/src/pages/Clients.tsx`, `frontend/src/pages/Approvals.tsx` (renamed to `Conversions.tsx`), `frontend/src/components/AppSidebar.tsx`, `frontend/src/App.tsx`.
- The `scoped` filter in the current Approvals page drops `draft` records; it changes to keep them and gate visibility by `initiatedBy` for the Drafts tab only.
- No data model or backend change — status values (`draft`, `pending_approval`, `approved`, `rejected`) and `usePolicyDrafts` stay as they are.
