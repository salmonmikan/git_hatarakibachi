# Ticket reservation gateway plan

Move public reservation writes behind a Cloudflare Pages Function while keeping the existing Supabase reservation RPC as the database authority.

- Add Turnstile verification before the RPC call.
- Call the RPC only from the server-side Pages Function.
- Remove browser roles from the public reservation RPC execution grant.
- Keep public ticket reads unchanged.
- Keep the existing request ID idempotency and database locking behavior unchanged.
- Configure Cloudflare rate limiting for the reservation API path outside the repository.
- Update database tests for the new execution boundary.
- Document required Cloudflare and Pages environment settings.

Verify lint, Node tests, frontend build, Pages Functions build, fresh Supabase migrations, and pgTAP.
