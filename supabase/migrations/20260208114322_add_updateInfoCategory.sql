-- 1) enum type を作成（なければ）
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'update_info_category'
      and n.nspname = 'public'
  ) then
    create type public.update_info_category as enum (
      'web',
      'system',
      'admin',
      'other'
    );
  end if;
end $$;

-- 2) update_info にカテゴリ列を追加（未指定は other に寄せるならこれ）
alter table public.update_info
  add column if not exists category public.update_info_category
  not null
  default 'other';
