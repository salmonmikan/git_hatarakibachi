-- =========================================
-- RLS: update_info
-- =========================================

-- 既存の「Policy with security definer functions」があれば一度削除（重複防止）
drop policy if exists "Policy with security definer functions" on public.update_info;

-- 管理者（admin_users に存在するUUIDを持つユーザー）に全権限を付与
create policy "Policy with security definer functions"
on "public"."update_info"
as permissive
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
