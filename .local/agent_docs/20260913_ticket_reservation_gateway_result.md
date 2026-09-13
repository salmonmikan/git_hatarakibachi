# Ticket reservation gateway result

Implemented a server-side reservation write boundary on top of the existing ticket reservation stack.

## Implemented

- Added a Cloudflare Pages Function at `/api/tickets/reservations`.
- Added server-side Turnstile Siteverify validation with action and hostname checks.
- Kept the existing Supabase reservation RPC as the authority for availability, time boundaries, locking, and request-ID idempotency.
- Changed the browser reservation client so public reads remain direct Supabase reads while reservation writes use the protected API.
- Added an explicit Turnstile helper that resets the widget after each attempt so retries receive a fresh single-use token.
- Restricted direct execution of `create_ticket_reservation` to `service_role`; `anon` and `authenticated` cannot bypass the Cloudflare entry point. Because the ticket feature is still unreleased, this final permission state is defined directly in the initial ticket migration rather than a later hardening migration.
- Added ordered pgTAP setup/teardown permission tests (`000` setup, existing reservation domain tests, `zzz` teardown) so the production permission boundary is asserted while the existing 80 domain tests continue to exercise the RPC under browser roles in the ephemeral test DB only.
- Documented required Turnstile, Pages Function, Supabase server credential, and Cloudflare Rate Limiting Rule settings.

## Error / retry contract

- On a new reservation attempt, client / Turnstile / rate-limit failures are definitive for that attempt because the request did not reach the reservation RPC, so the temporary pending request can be cleared.
- Once a previous reservation submission has an unknown DB outcome, a later Turnstile / WAF / request-validation failure during result recovery does **not** clear that pending request. It only proves that the recovery attempt did not reach the DB; the earlier DB outcome remains unknown.
- A DB business rejection on an idempotent retry is definitive: if the original request ID had already succeeded, the RPC would return its existing reservation code first.
- Network or upstream failures where the DB result is unknown do not return a definitive error code, so the existing pending transaction retains the same request ID.
- Every retry generates a fresh Turnstile token while reusing the original reservation request ID, allowing the DB idempotency contract to recover the reservation code.

## External configuration not applied from this repository

The code is ready for the following Cloudflare settings, but they require account-side configuration:

- Production and staging Turnstile widgets / keys.
- Pages environment variables and secrets.
- WAF Rate Limiting Rule for `/api/tickets/reservations` (initial recommendation: 5 requests per 10 seconds per IP, 10-second mitigation timeout).

GitHub Actions CI is used as the final lint/build/database validation after opening the PR.
