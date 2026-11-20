# Policy approval preview parity

## Fund Details and Unit Price History

- [x] Implement fund-scoped valuation storage with six-decimal precision, unique valuation dates and append-only correction revisions.
- [x] Add simple Fund Details profile, latest valuation, history/chart and administrator recording/correction actions.
- [x] Prevent permanent deletion of funds/managers with valuation history or policy relationships; use Active/Inactive.
- [x] Test permissions, precision, history integrity and sample UI flows; document development MongoDB verification requirements.
- [ ] Verify live development MongoDB Decimal128 roundtrip, unique index/concurrent writes, persisted correction history and deletion guards. Blocker: no live development database/session access available in this workspace.

- [x] Sweep portfolio selection, draft resume, review entry points, client policy display and policy storage operations; 12 tests and sample browser flows pass. No settled records were written.
- [x] Restore investment portfolio visibility for saved policies without a complete review snapshot; nine regression checks and sample advisor submission/reviewer readback pass, including absent and empty portfolio snapshots. Live policy readback remains unverified because authenticated API access is unavailable.
- [x] Share final-review display data between the wizard and approval preview.
- [x] Preserve submitted figures, selected funds and document details in the existing saved form.
- [x] Check all nine steps and submission/readback parity with sample API responses; frontend and regression tests pass. Hosted authenticated readback remains unverified because no managed session is available.

## Portfolio flow audit

- Wizard selection: fixed manager name loss for manager-specific fund responses.
- Draft reopen (Conversions and preview Edit/Resubmit): fixed investment input restoring the already-deducted net value; original gross input now takes precedence without changing formulas.
- Step 9, queued autosave, final save before submit and approval preview: read code and ran sample submission/readback; saved snapshots and allocations remain intact.
- Conversions tabs, notification View Policy and Dashboard Recent Activity: read navigation code; all open the same policy review screen. Notification approval/return actions preserve the policy form.
- Client details and explicit client policy page: removed current-catalogue lookups; browser-tested saved portfolio readback and no mutation of the sample settled record.
- Policy create/edit/submit/readback/pipeline/reassign/approve/return/client-policy handlers: read code; the Mixed form is stored/returned unchanged, status actions do not recalculate allocations. Unused top-level fundAllocations is not accepted, but authoritative allocations and snapshots are stored inside form.
- Background calculation job context and socket/notification hooks: read code; no fund allocation calculation or storage. No matching portfolio path found in email sources.
- Live authenticated policy and database readback remain unverified; checks used sample responses. Permissions, settings, financial formulas and settled records were not modified.

# Investment Managers interface

- [x] Build asset manager profile cards and create/edit forms.
- [x] Build manager-specific fund lists and create/edit forms with risk classification.
- [x] Verify interface flows with sample data, light/dark layouts and frontend checks.

Scope: frontend only; no persistent storage, APIs, investment calculations or changes to other administration tabs or the policy wizard. Editing workspace starts at the same revision as backup-main; no commit, push or deployment.
## Interactive Policy Record & Investment Funding
- [x] Stage 1: clickable policy sections and per-fund details
- [x] Stage 2: Root Organisation funding permissions
- [x] Stage 2 revision: separate policy-scoped investment viewing/request permissions and administrator transaction authority; regression-test existing access without adding controls or workflows. Live development account checks remain unavailable; later-stage routes must wire the prepared guards before use.
- [x] Stage 3 (simplified): one-time Funds Received confirmation + Investment Funding card
- [x] Stage 3: trace investmentAmount as gross; flag when saved deductions don't reconcile
- [x] Stage 3: funding record extensible (status/revision/history) for a future reversal, which hasn't been built
- [ ] Verify against development MongoDB: PolicyFunding unique index, concurrent duplicate confirm returns 409, FUNDS_CONFIRMED audit entries persist (blocker: no live dev database/session access)
- [ ] Review: annuity quotes with separate living + life purchase amounts — confirm which one is the gross payable (blocker: business confirmation)
- [ ] Stage 4: Investment Funding section
- [ ] Stage 5: Tests and verification
