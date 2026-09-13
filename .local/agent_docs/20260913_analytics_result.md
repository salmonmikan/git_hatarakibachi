# Analytics / registration token hardening result

Implemented the member-fee registration token hardening on top of the latest Square Phase 1 branch.

## Implemented

- Admin registration links now use `/member-fee/register#token=<uuid>` instead of a token path segment.
- URL fragments are not sent in the HTTP request, keeping the capability token out of the initial Cloudflare request URL.
- Before GTM loads, a valid fragment token is copied to same-tab sessionStorage and the browser URL is replaced with `/member-fee/register`.
- If sessionStorage is unavailable, analytics loading is skipped and the React page can consume the fragment directly.
- The parameterized `/member-fee/register/:token` route was removed because this feature is not released yet and does not need a compatibility URL.
- The registration page uses the sanitized route only and clears temporary token storage after an existing registration is confirmed or before navigating to Square.
- Analytics page paths classify the sanitized registration and completion routes without carrying a member token.
- `Referrer-Policy: same-origin` is set in the document.

The branch was reset onto the current `feature/member-fee-square-phase1` head before these changes were applied, so the latest Square webhook/security fixes are retained.
