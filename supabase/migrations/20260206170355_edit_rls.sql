-- =========================================
-- RLS: member_affiliations
-- =========================================
alter table public.member_affiliations enable row level security;

-- 誰でも閲覧OK（公開サイト用）
drop policy if exists member_affiliations_select_all on public.member_affiliations;
create policy member_affiliations_select_all
on public.member_affiliations
for select
to public
using (true);

-- adminだけ更新系OK（管理画面用）
drop policy if exists member_affiliations_admin_all on public.member_affiliations;
create policy member_affiliations_admin_all
on public.member_affiliations
for all
to public
using (
  exists (
    select 1
    from public.admin_users au
    where au.uuid = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.uuid = auth.uid()
  )
);