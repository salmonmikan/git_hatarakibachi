-- =========================================
-- 1) 所属マスタ（member_affiliations）
-- =========================================
create table if not exists public.member_affiliations (
  code text primary key,             -- 'full' / 'associate' / 'retired'
  label text not null,               -- '正式所属' 等
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 初期データ（再実行してもOK）
insert into public.member_affiliations (code, label, is_active)
values
  ('full', '正式所属', true),
  ('associate', '準所属', true),
  ('retired', '退団', true)
on conflict (code) do update
set
  label = excluded.label,
  is_active = excluded.is_active;


-- =========================================
-- 2) members に所属コード（FK）を追加
-- =========================================
alter table public.members
  add column if not exists affiliation_code text;

-- 既存行を埋める（とりあえず準所属）
update public.members
set affiliation_code = 'associate'
where affiliation_code is null;

-- FK（同名制約が無ければ追加）
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'members_affiliation_code_fkey'
      and conrelid = 'public.members'::regclass
  ) then
    alter table public.members
      add constraint members_affiliation_code_fkey
      foreign key (affiliation_code)
      references public.member_affiliations(code)
      on update cascade
      on delete restrict;
  end if;
end $$;

-- NOT NULL（埋めた後に付ける）
alter table public.members
  alter column affiliation_code set not null;


-- =========================================
-- 3) 表示順（numeric）を members に追加
--    小数運用で D&D 並び替えに強い
-- =========================================
alter table public.members
  add column if not exists display_order numeric(12,6) not null default 0;

-- 既存データの穴埋め（念のため）
update public.members
set display_order = 0
where display_order is null;

-- 並び替え用 index（任意）
create index if not exists members_display_order_idx
  on public.members (display_order, created_at);

-- 所属×表示順でよく引くなら（任意）
create index if not exists members_affiliation_display_order_idx
  on public.members (affiliation_code, display_order, created_at);
