# Stage 3 (simplified): Funds Received confirmation

Replaces the earlier receipt/reference/evidence/partial-payment/reconciliation design.

## What users will see
On an approved Client Policy Record, a new **Investment Funding** card:
- Gross Investment Amount and Net Investment Amount, read from the approved submitted policy snapshot. If the gross amount is missing or unclear, the card says "Gross Investment Amount not reliably available — please verify" instead of guessing.
- Before confirmation: the checkbox "I confirm that the client's investment funds have been received." and a **Confirm Funds Received** button that stays disabled until the box is ticked. Only Root Organisation Admins and Super Admins see these controls.
- Everyone else who can already open the policy (for example Advisors) sees a read-only status: "Awaiting funds confirmation".
- After confirmation: "Funds Confirmed", plus who confirmed it and the date and time.

## Rules
- Confirmation happens once. A second attempt is refused and nothing changes.
- Each confirmation is recorded in the existing audit log.
- Confirming does not change approval status, fund allocations, net investment, quote calculations or the saved policy form. It does not purchase units or activate the investment.
- Existing organisation and client access restrictions stay as they are. External organisations can't open client policies now, and this stage won't change that.

## Technical details
- **Storage:** a small `PolicyFunding` collection with policyId (unique index), status `"confirmed"`, confirmedBy (user ID), confirmedByName and confirmedAt. Policy documents are not touched.
- **Backend:** new module `backend/fundingConfirmation.cjs`, registered in server.js:
  - `GET /api/policies/:id/funding`: authenticateToken, then the existing approved/active client-policy access lookup through `investmentAccess.cjs`. Returns the status and `canConfirm`.
  - `POST /api/policies/:id/funding/confirm`: `requireFundingManager` from fundingAccess.cjs, the same policy-access lookup, and a check that the policy is approved. Body must contain `confirmed: true`. Writes with an atomic insert, so a duplicate key returns 409. Calls `logAudit` with action `FUNDS_CONFIRMED`. Never writes to policies, allocations or valuations.
- **Frontend:** a `usePolicyFunding(policyId)` hook and an `InvestmentFundingCard` in PolicyRecordView. Amounts come from the submitted-snapshot reader with no recalculation. The gross amount comes from the snapshot's saved investmentAmount only, never from netInvestment; if it's missing, the card shows the flag above. The panel's "Funding Status" line shows the real status.
- **Tests** (`backend/fundingConfirmation.test.cjs`, run with the existing harness): Super Admin and root Admin can confirm; Advisors (root and external), external Admins and users without policy access get 403; unapproved policies are rejected; confirming without `confirmed: true` gets 400; a duplicate gets 409; the audit entry is written; and the policy document, allocations, net investment and status come through unchanged, with no unit or activation fields written. A frontend test checks that the gross amount is flagged, not filled in from net, when it's missing.
- Verify with sample data in the browser: the button stays disabled until ticked, the card shows confirmed details after confirming, and Advisors only get the read-only view. Update roadmap.md and AGENTS.md. Work on backup-main only, with no push or deploy. I'll stop and report when this is done.

## Final requirements (approved)
- **Gross amount check:** before showing it, trace `investmentAmount` from the quote inputs (purchaseAmount / lifePurchaseAmount), through the wizard and the Premium/Fees and Salary steps, into the submitted snapshot. Confirm whether it is the full amount the client pays, before purchase premium and commission are deducted. If that can't be confirmed for a policy, or the paths disagree, the card shows "Gross Investment Amount requires review" instead of a figure. The trace findings will be in the report.
- **Room for a future reversal:** the funding record gets a `status` field (`confirmed`, with `reversed` reserved for later), a `revision` number and an append-only `history` list (action, actor, timestamp, reason). The first confirmation writes the first history entry. There's no reversal endpoint or button in this stage, and confirmation stays one-time. Roadmap and AGENTS.md will record that a future reversal needs a mandatory reason and must add to the history.
- Keep roadmap.md updated with both items.
