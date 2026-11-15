-- comments_delete_admin leía users (con RLS), y users_select_comment_authors lee comments: recursión infinita.
-- Para un admin, can_view_post() equivale a "el autor del post es de su guardería" y no pasa por la RLS de users.
drop policy posts_delete_admin on public.posts;
create policy posts_delete_admin on public.posts
  for delete to authenticated
  using ((select public.is_admin()) and (select public.can_view_post(id)));

drop policy post_elderly_delete_admin on public.post_elderly;
create policy post_elderly_delete_admin on public.post_elderly
  for delete to authenticated
  using ((select public.is_admin()) and (select public.can_view_post(post_id)));

drop policy post_photos_delete_admin on public.post_photos;
create policy post_photos_delete_admin on public.post_photos
  for delete to authenticated
  using ((select public.is_admin()) and (select public.can_view_post(post_id)));

drop policy comments_delete_admin on public.comments;
create policy comments_delete_admin on public.comments
  for delete to authenticated
  using ((select public.is_admin()) and (select public.can_view_post(post_id)));

drop policy post_photos_objects_delete_admin on storage.objects;
create policy post_photos_objects_delete_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-photos'
    and (select public.is_admin())
    and (select public.can_view_post(public.post_id_from_path(name)))
  );
