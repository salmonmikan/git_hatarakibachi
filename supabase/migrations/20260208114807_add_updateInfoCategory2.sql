-- 0) 念のため：categories を新規追加（まだ無ければ）
alter table public.update_info
  add column if not exists categories public.update_info_category[]
  not null
  default '{}';

-- 1) 既存の category を categories に移行（空配列の行だけ上書き）
update public.update_info
set categories = array[category]::public.update_info_category[]
where (categories is null or cardinality(categories) = 0)
  and category is not null;

-- 2) category カラムを消す（必要なら）
alter table public.update_info
  drop column if exists category;
