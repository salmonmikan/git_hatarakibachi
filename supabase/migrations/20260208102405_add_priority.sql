-- 1) カラム追加（未指定は0）
alter table public.member_affiliations
  add column if not exists sort_order int not null default 0;

-- 2) 既存データの穴埋め（念のため）
update public.member_affiliations
set sort_order = 0
where sort_order is null;

-- 3) 初期の並び順を付けたい場合（任意）
-- すでに運用してるならこのUPDATEは外してOK
update public.member_affiliations
set sort_order = case code
  when 'full' then 10
  when 'associate' then 20
  when 'retired' then 30
  else 999
end
where sort_order = 0;