
What I found

- The delay is coming from repeated heavy data loading, not just the page transition itself.
- Both `Dashboard.tsx` and `Quotes.tsx` refetch both quote collections every time the page mounts, then merge and sort everything on the client.
- The backend list endpoints currently return full quote documents, which is more data than those list screens need.
- `QuoteDetail.tsx` uses `navigate(-1)`, so going back remounts the previous page and triggers that full reload again.
- React Query is already installed in the app, but these pages are not using cached queries yet.

Plan

1. Create one shared cached quote-list source
- Add a shared frontend fetcher for quote lists.
- Use React Query so Dashboard and Quotes reuse the same cached data instead of refetching from scratch on every return.
- Set it up to keep previous data visible while refreshing in the background.

2. Make the backend list endpoints lightweight
- Update `/api/quotes` and `/api/new-quotes` list handlers to return only summary fields needed for tables and dashboard stats.
- Use `select(...)` and `lean()` so the payload is much smaller and faster.

3. Refactor Dashboard to use the shared cached data
- Keep the current stats cards and recent quotes UI.
- Stop doing a fresh full-page loader every time the user comes back from a quote.
- Use the cached list for stats + latest quotes.

4. Refactor Quotes to use the same shared cached data
- Reuse the same normalized quote list for search, sorting, and pagination.
- This should make returning to Quotes much faster after viewing a quote.

5. Improve Quote Detail back navigation
- Pass the source route when opening a quote.
- Replace raw `navigate(-1)` with route-aware back behavior so the user returns to the correct screen cleanly, with its cached state.

Files likely affected

- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Quotes.tsx`
- `frontend/src/pages/QuoteDetail.tsx`
- `frontend/src/App.tsx`
- `frontend/src/lib/quoteUtils.ts` or a new shared quotes list helper
- `backend/server.js`

Technical details

- The real issue is repeated remount + repeated fetching of both quote collections.
- Using cache plus slimmer list responses is the main fix, not just changing the loader.
- This should make going from quote detail back to Dashboard or Quotes feel near-instant after the first load.
