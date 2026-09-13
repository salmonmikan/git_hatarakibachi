# Analytics URL handling result

Implemented a separate hardening change for the member-fee registration URL.

## Implemented

- Before GTM loads, registration URLs containing the per-member UUID are detected.
- The UUID is temporarily moved to sessionStorage and the visible browser URL is replaced with `/member-fee/register` before analytics loads.
- If the temporary storage step fails, GTM loading is skipped rather than exposing the original registration path.
- Added a sanitized `/member-fee/register` route while retaining the original parameterized route as a compatibility entry point.
- The registration page resolves the UUID from the route or temporary session storage and clears it when registration is already complete or before navigating to Square.
- Custom analytics paths are normalized so member-fee registration events do not contain the unique path segment.
- Referrer policy is set to `same-origin`.

This branch is based on the latest Square member-fee Phase 1 branch and is intentionally kept as a separate PR.

GitHub Actions CI is used as the final lint/build validation after opening the PR.
