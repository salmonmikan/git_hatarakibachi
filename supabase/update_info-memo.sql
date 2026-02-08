insert into public.update_info
  (update_title, update_description, update_date, categories)
values
  (
    'メンバー紹介ページを追加',
    'メンバー紹介ページを公開しました。プロフィールと出演歴が閲覧できます。',
    -- now.
    '',
    -- web,admin,system,other
    array['web','admin']::public.update_info_category[]
  );
