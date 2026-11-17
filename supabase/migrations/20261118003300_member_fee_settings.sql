create table public.member_fee_settings (
  id smallint primary key default 1 check (id = 1),
  square_environment text not null check (square_environment in ('sandbox', 'production')),
  square_location_id text not null check (square_location_id ~ '[^[:space:]]'),
  square_plan_variation_id text not null check (square_plan_variation_id ~ '[^[:space:]]')
);

alter table public.member_fee_settings enable row level security;

revoke all on table public.member_fee_settings from PUBLIC, anon, authenticated, service_role;
grant select on table public.member_fee_settings to service_role;
