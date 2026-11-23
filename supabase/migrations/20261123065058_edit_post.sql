-- SPEC 36: editar una publicación

-- author_id sigue inmutable; audience ya puede cambiar.
-- La habitación solo se valida si cambia: el staff conserva la actual aunque ya no tenga asignados en ella.
create or replace function public.protect_posts_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.author_id is distinct from old.author_id then
    raise exception 'author_id cannot be changed';
  end if;
  if new.audience = 'room'
    and new.room_id is distinct from old.room_id
    and not (select public.can_post_to_room(new.room_id)) then
    raise exception 'cannot post to this room';
  end if;
  return new;
end;
$$;

-- Un post que pasa a elderly también debe tener al menos un etiquetado (se valida al hacer commit)
drop trigger posts_require_elderly_tag on public.posts;
create constraint trigger posts_require_elderly_tag
  after insert or update of audience on public.posts
  deferrable initially deferred
  for each row execute function public.require_elderly_tag_on_post();

-- ids de la lista que el usuario ve y tienen historial (reusa post_has_history)
create function public.posts_with_history(p_post_ids uuid[])
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select post_id
  from unnest(p_post_ids) as post_id
  where public.can_view_post(post_id)
    and public.post_has_history(post_id);
$$;

revoke execute on function public.posts_with_history(uuid[]) from public, anon;
grant execute on function public.posts_with_history(uuid[]) to authenticated;

-- Policies de posts
drop policy posts_update_author on public.posts;
create policy posts_update_author on public.posts
  for update to authenticated
  using (
    author_id = (select auth.uid())
    and (select public.current_user_role()) in ('staff', 'admin')
    and not (select public.post_has_history(id))
  )
  with check (
    author_id = (select auth.uid())
    and (audience <> 'daycare' or (select public.is_admin()))
  );

create policy posts_update_admin on public.posts
  for update to authenticated
  using ((select public.is_admin()) and (select public.can_view_post(id)))
  with check (
    (select public.is_admin())
    and (select public.can_view_post(id))
    and (audience <> 'daycare' or (select public.is_admin()))
  );

-- Policies de post_elderly
drop policy post_elderly_insert_author on public.post_elderly;
create policy post_elderly_insert_author on public.post_elderly
  for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.author_id = (select auth.uid())
        and p.audience = 'elderly'
        and (select public.current_user_role()) in ('staff', 'admin')
    )
    and not (select public.post_has_history(post_id))
    and exists (
      select 1 from public.elderly e
      where e.id = elderly_id
        and e.status = 'active'
        and (
          (
            (select public.is_admin())
            and e.room_id in (
              select r.id from public.rooms r
              where r.daycare_id = (select public.current_user_daycare_id())
            )
          )
          or e.id in (select public.current_user_elderly_ids())
        )
        and (
          e.photo_consent
          or not exists (select 1 from public.post_photos pp where pp.post_id = post_elderly.post_id)
        )
    )
  );

create policy post_elderly_insert_admin on public.post_elderly
  for insert to authenticated
  with check (
    (select public.is_admin())
    and (select public.can_view_post(post_id))
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.audience = 'elderly'
    )
    and exists (
      select 1 from public.elderly e
      join public.rooms r on r.id = e.room_id
      where e.id = elderly_id
        and e.status = 'active'
        and r.daycare_id = (select public.current_user_daycare_id())
        and (
          e.photo_consent
          or not exists (select 1 from public.post_photos pp where pp.post_id = post_elderly.post_id)
        )
    )
  );

drop policy post_elderly_delete_author on public.post_elderly;
create policy post_elderly_delete_author on public.post_elderly
  for delete to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.author_id = (select auth.uid())
        and (select public.current_user_role()) in ('staff', 'admin')
    )
    and not (select public.post_has_history(post_id))
  );

-- Policies de post_photos
drop policy post_photos_insert_author on public.post_photos;
create policy post_photos_insert_author on public.post_photos
  for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.author_id = (select auth.uid())
        and (select public.current_user_role()) in ('staff', 'admin')
    )
    and not (select public.post_has_history(post_id))
    and not (select public.post_has_tag_without_photo_consent(post_id))
  );

create policy post_photos_insert_admin on public.post_photos
  for insert to authenticated
  with check (
    (select public.is_admin())
    and (select public.can_view_post(post_id))
    and not (select public.post_has_tag_without_photo_consent(post_id))
  );

drop policy post_photos_delete_author on public.post_photos;
create policy post_photos_delete_author on public.post_photos
  for delete to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.author_id = (select auth.uid())
        and (select public.current_user_role()) in ('staff', 'admin')
    )
    and not (select public.post_has_history(post_id))
  );

-- Policies de Storage (insert)
drop policy post_photos_objects_insert_author on storage.objects;
create policy post_photos_objects_insert_author on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.posts p
      where p.id = public.post_id_from_path(name)
        and p.author_id = (select auth.uid())
        and (select public.current_user_role()) in ('staff', 'admin')
        and not (select public.post_has_history(p.id))
    )
    and not (select public.post_has_tag_without_photo_consent(public.post_id_from_path(name)))
  );

create policy post_photos_objects_insert_admin on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and (select public.is_admin())
    and (select public.can_view_post(public.post_id_from_path(name)))
  );

-- Edita la publicación en una sola transacción.
-- SECURITY INVOKER: aplican las policies y triggers; el orden evita que las de consentimiento vean un estado intermedio.
create function public.update_post(
  p_post_id uuid,
  p_audience public.post_audience,
  p_room_id uuid,
  p_type public.post_type,
  p_title text,
  p_body text,
  p_add_elderly_ids uuid[],
  p_remove_elderly_ids uuid[],
  p_new_photos jsonb,
  p_removed_photo_ids uuid[]
)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_updated int;
begin
  delete from public.post_photos
  where post_id = p_post_id
    and id = any(coalesce(p_removed_photo_ids, '{}'));

  if p_audience <> 'elderly' then
    delete from public.post_elderly where post_id = p_post_id;
  else
    delete from public.post_elderly
    where post_id = p_post_id
      and elderly_id = any(coalesce(p_remove_elderly_ids, '{}'));
  end if;

  update public.posts
  set audience = p_audience,
      room_id = p_room_id,
      type = p_type,
      title = p_title,
      body = p_body
  where id = p_post_id;
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'post not editable';
  end if;

  insert into public.post_elderly (post_id, elderly_id)
  select p_post_id, elderly_id
  from unnest(coalesce(p_add_elderly_ids, '{}')) as elderly_id;

  insert into public.post_photos (post_id, url, width, height, position)
  select p_post_id, photo.url, photo.width, photo.height, photo.position
  from jsonb_to_recordset(coalesce(p_new_photos, '[]'::jsonb))
    as photo(url text, width int, height int, position int);
end;
$$;

revoke execute on function public.update_post(uuid, public.post_audience, uuid, public.post_type, text, text, uuid[], uuid[], jsonb, uuid[]) from public, anon;
grant execute on function public.update_post(uuid, public.post_audience, uuid, public.post_type, text, text, uuid[], uuid[], jsonb, uuid[]) to authenticated;
