# Fix: submitted conversions not appearing for the assigned Admin

The Admin gets the notification but the Conversions list stays empty. Those two things travel over completely different paths today, so the notification arriving proves nothing about the record:

- Notifications are delivered live over the socket and stored in the browser's own storage (`policy_notifications_v1`). They never touch the conversions collection.
- The Conversions list is rendered from a browser cache that is refreshed from `GET /api/conversions`. Every write to the server (`PUT /api/conversions/:id`) swallows its errors silently, and `refresh()` returns quietly when the request fails.

So an empty list with a live notification is exactly what you would see if the conversion never landed in the database, or if the list request came back without it. Which of the two it is has not been confirmed yet, so step 1 is to find out rather than guess.

## Step 1 — Confirm where the record is

- Query the conversions collection for the submitted client (e.g. "Test Lettah") and read back `status`, `initiatedBy`, `assignedTo`.
- Sign in as the Admin in the preview and inspect what `GET /api/conversions` actually returns, plus the token's `role` and `userId`.

Three possible outcomes, each with a known fix:

1. **No record on the server** — the advisor's submit never persisted; the browser cache is the only copy. Fix: make the writes non-silent (below).
2. **Record exists but `status` is still `draft`** — the reviewer query excludes drafts. Fix: the submit path must win over the autosave (an atomic submit endpoint exists; confirm the wizard actually awaits it before navigating).
3. **Record exists as `pending_approval` but the Admin's request excludes it** — the role in the JWT is not recognised as a reviewer, or `assignedTo` holds an id shape that does not match the Admin's `userId`. Fix: normalise the role check and the id comparison on the server.

## Step 2 — Stop failures from being invisible

Regardless of which cause it turns out to be, the current design hides the problem:

- `persist()` and `persistDelete()` catch and discard every error.
- `refresh()` returns silently on a non-OK response.

Changes:
- Surface sync failures: a toast on a failed submit ("Could not submit for approval — not saved"), and a small "Offline — changes not synced" indicator on the Conversions page when the last refresh failed.
- Never let the wizard navigate away or fire the notification unless the submit response came back OK.

## Step 3 — Make the server the source of truth for submitted work

Anything past `draft` should be read from the API, not merged with the local cache. The local cache stays only for in-progress drafts on the machine that created them. This removes the class of bug where one browser's stale copy shadows the shared record.

## Step 4 — Durable notifications

Notifications currently exist only in the recipient's browser and only if they were online when the socket fired. Move them to a `notifications` collection with `GET /api/notifications` and a read/unread flag, so the bell and the Conversions list are both derived from server data and can never disagree.

## Technical notes

- Files: `backend/server.js` (`GET /api/conversions` role and id matching, new notifications routes), `frontend/src/hooks/usePolicyDrafts.ts` (error propagation, server-authoritative merge), `frontend/src/hooks/useNotifications.ts` (API-backed), `frontend/src/pages/ConvertToPolicy.tsx` (await submit before notify/navigate), `frontend/src/pages/Conversions.tsx` (sync indicator).
- Steps 3 and 4 are the durable fix; step 1 decides which one-line cause also needs correcting.
