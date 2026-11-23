-- true si alguien distinto del autor reaccionó o comentó el post (false si no existe)
create function public.post_has_history(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and (
        exists (
          select 1 from public.reactions r
          where r.post_id = p.id and r.user_id <> p.author_id
        )
        or exists (
          select 1 from public.comments c
          where c.post_id = p.id and c.author_id <> p.author_id
        )
      )
  );
$$;

revoke execute on function public.post_has_history(uuid) from public, anon;
grant execute on function public.post_has_history(uuid) to authenticated;

drop policy posts_delete_author on public.posts;
create policy posts_delete_author on public.posts
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    and (select public.current_user_role()) in ('staff', 'admin')
    and not (select public.post_has_history(id))
  );

drop policy post_photos_objects_delete_author on storage.objects;
create policy post_photos_objects_delete_author on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.posts p
      where p.id = public.post_id_from_path(name)
        and p.author_id = (select auth.uid())
        and not (select public.post_has_history(p.id))
    )
  );
