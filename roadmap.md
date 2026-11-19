# Policy approval preview parity

- [x] Restore investment portfolio visibility for saved policies without a complete review snapshot; nine regression checks and sample advisor submission/reviewer readback pass, including absent and empty portfolio snapshots. Live policy readback remains unverified because authenticated API access is unavailable.
- [x] Share final-review display data between the wizard and approval preview.
- [x] Preserve submitted figures, selected funds and document details in the existing saved form.
- [x] Check all nine steps and submission/readback parity with sample API responses; frontend and regression tests pass. Hosted authenticated readback remains unverified because no managed session is available.

# Investment Managers interface

- [x] Build asset manager profile cards and create/edit forms.
- [x] Build manager-specific fund lists and create/edit forms with risk classification.
- [x] Verify interface flows with sample data, light/dark layouts and frontend checks.

Scope: frontend only; no persistent storage, APIs, investment calculations or changes to other administration tabs or the policy wizard. Editing workspace starts at the same revision as backup-main; no commit, push or deployment.