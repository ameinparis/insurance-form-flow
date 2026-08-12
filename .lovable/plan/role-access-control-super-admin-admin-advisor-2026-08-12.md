# Role & Access Control: Super Admin, Admin, Advisor

Introduce three named roles across the app, gate menus/routes/actions by role, add a proper user management screen, and add an approval step to policy conversions with initiator/approver tracking.

## Role model

Existing accounts use `superuser`, `admin`, `user`. These map to the new names without any data migration:

| Stored value | Display name |
|---|---|
| `superuser` | Super Admin |
| `admin` | Admin |
| `user` | Advisor |

Permission matrix:

| Capability | Super Admin | Admin | Advisor |
|---|---|---|---|
| Manage users (add/edit/deactivate) | Yes | Yes (cannot create or edit Super Admins) | No |
| Manage investment / asset managers | Yes | Yes | No |
| Modify fee calculation percentages | Yes | Yes | No |
| Create quotes, initiate conversions | Yes | Yes | Yes |
| Approve conversions | Yes (incl. own) | Yes, except own | No |

## What gets built

**1. Permissions layer**
- Extend the auth context so it exposes the normalized role plus flags: `canManageUsers`, `canManageSuperAdmins`, `canConfigureFees`, `canManageInvestments`, `canApprove`, and a helper `canApproveConversion(draft)` that returns false for Admins when `initiatedBy === currentUserId`.
- A `RoleGuard` route wrapper that redirects unauthorized users to the dashboard with a toast, so direct URLs are not reachable.

**2. Sidebar & routes**
- Administration, Fee Configuration and Investment Management entries render only when the role permits; their routes are wrapped in `RoleGuard`.
- Advisors see Dashboard, Quotations, Clients, Claims, Settings only.

**3. User management (Administration page)**
- Table of all users: name, email, role (as the new display names), status active/inactive.
- Invite/add user with role dropdown; Admins only see Admin and Advisor options, Super Admins also see Super Admin.
- Edit role, and deactivate/reactivate or remove a user. Rows for Super Admin users are read-only for Admins.
- Keeps the existing API calls, table styling, badges and dialogs.

**4. Fee Configuration & Investment Managers (new settings, browser-stored)**
- New Administration tabs: "Fee Configuration" (Purchase Premium %, Upfront Commission %, Administration Fee %, Ongoing Advisory Fee max %, Switch Fee, Funeral Premium) and "Investment Managers" (add/edit/remove asset manager + fund options).
- Persisted in localStorage via hooks (`useFeeConfig`, `useInvestmentManagers`) following the `usePolicyDrafts` pattern.
- The Convert to Policy wizard reads its currently hardcoded percentages and fund list from these hooks instead of literals.

**5. Conversion approval**
- Policy drafts gain `initiatedBy`, `initiatedByName`, `initiatedAt`, `approvedBy`, `approvedByName`, `approvedAt`, and `status` (`draft` | `pending_approval` | `approved`).
- Submitting the wizard's Review step sets status to `pending_approval` and records the initiator.
- Approve action appears both on the wizard Review step and on the draft preview page (`/policies/drafts/:id`), only when the role permits and the user is not the initiator (Super Admins exempt). Otherwise a muted note: "Needs approval from another Admin or Super Admin".
- Clients table shows a status badge for each draft.

**6. Backend (`backend/server.js`) — you deploy**
- Role enum stays `user | admin | superuser`.
- `POST /api/users/register`: allow `admin` as well as `superuser`; block Admins from creating `superuser` accounts.
- Add/confirm `PATCH /api/users/:id` (role/status edit) and delete with the same rules: only a Super Admin may edit or create Super Admin accounts.
- Audit log entries for role changes and deactivations.

## Notes
- Fee config and investment manager options are stored per-browser for now; moving them to the API later is a drop-in swap behind the hooks.
- Backend edits in this repo do not affect njs.exclusivelife.co.bw until you deploy them; until then Admin user-management calls may still be rejected by the live server.
