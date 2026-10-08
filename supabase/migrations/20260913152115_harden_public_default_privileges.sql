-- Deny-by-default for future Data API objects in public.
-- Existing object privileges are intentionally unchanged; each migration must
-- explicitly grant only the roles it needs.

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;
