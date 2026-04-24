insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'member-images',
  'member-images',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists member_images_public_select on storage.objects;
create policy member_images_public_select
on storage.objects
for select
to public
using (bucket_id = 'member-images');

drop policy if exists member_images_admin_insert on storage.objects;
create policy member_images_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'member-images'
  and exists (
    select 1
    from public.admin_users au
    where au.uuid = auth.uid()
  )
);

drop policy if exists member_images_admin_update on storage.objects;
create policy member_images_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'member-images'
  and exists (
    select 1
    from public.admin_users au
    where au.uuid = auth.uid()
  )
)
with check (
  bucket_id = 'member-images'
  and exists (
    select 1
    from public.admin_users au
    where au.uuid = auth.uid()
  )
);

drop policy if exists member_images_admin_delete on storage.objects;
create policy member_images_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'member-images'
  and exists (
    select 1
    from public.admin_users au
    where au.uuid = auth.uid()
  )
);
