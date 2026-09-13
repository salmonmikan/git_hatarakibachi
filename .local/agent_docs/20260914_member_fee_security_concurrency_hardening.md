# Member fee security / concurrency hardening

## Scope

- Make server-only billing RPCs explicitly non-executable by browser roles.
- Remove billing-email uniqueness because email is contact data, not contract identity.
- Prevent member payment history from cascading away on member hard deletion.
- Prevent out-of-order / concurrent Square Invoice webhooks from regressing the stored invoice projection.
- Bound public request bodies while streaming instead of buffering unbounded input.

## Result

- `claim_square_webhook_event`, `claim_member_fee_registration_attempt`, and `apply_member_fee_invoice_projection` explicitly revoke EXECUTE from `PUBLIC`, `anon`, and `authenticated`; only `service_role` receives API execution rights.
- Trigger helper `ensure_member_billing_row` is not granted to Data API roles.
- `billing_email` unique index and email-conflict branching were removed.
- `member_fee_payments.member_id` uses `ON DELETE RESTRICT`.
- `member_fee_payments` stores Square Invoice `version`.
- `apply_member_fee_invoice_projection` atomically accepts only an equal/newer Square Invoice version, preventing an older worker/webhook from overwriting a newer projection.
- Square webhook handling uses the version-aware DB RPC and treats an older projection as already superseded.
- Registration and webhook request bodies use the shared bounded stream reader.
- pgTAP covers browser-role function privileges and an older-version regression attempt.
