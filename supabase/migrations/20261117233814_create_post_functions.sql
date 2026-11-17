-- Crea la publicación y sus etiquetas en una sola transacción.
-- SECURITY INVOKER: aplican posts_insert_team y post_elderly_insert_author, y el trigger
-- diferido posts_require_elderly_tag se valida al terminar la llamada.
-- No usa RETURNING: la policy de select (can_view_post) no ve la fila recién insertada.
create function public.create_post(
  p_audience public.post_audience,
  p_room_id uuid,
  p_type public.post_type,
  p_title text,
  p_body text,
  p_elderly_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_post_id uuid := gen_random_uuid();
begin
  insert into public.posts (id, author_id, audience, room_id, type, title, body)
  values (v_post_id, (select auth.uid()), p_audience, p_room_id, p_type, p_title, p_body);

  insert into public.post_elderly (post_id, elderly_id)
  select v_post_id, elderly_id
  from unnest(coalesce(p_elderly_ids, '{}')) as elderly_id;

  return v_post_id;
end;
$$;

-- true si el usuario puede publicar en la habitación y hay algún adulto mayor activo sin
-- consentimiento de fotos, asignado o no. Solo devuelve true/false, nunca nombres ni filas.
create function public.room_has_elderly_without_photo_consent(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select public.can_post_to_room(p_room_id))
    and exists (
      select 1 from public.elderly e
      where e.room_id = p_room_id
        and e.status = 'active'
        and not e.photo_consent
    );
$$;

-- Días (hora de Lima) con publicaciones visibles, anteriores a p_before, del más nuevo al más viejo
create function public.visible_post_days(p_before date, p_limit int)
returns setof date
language sql
stable
security invoker
set search_path = ''
as $$
  select days.day
  from (
    select distinct (p.published_at at time zone 'America/Lima')::date as day
    from public.posts p
  ) days
  where days.day < p_before
  order by days.day desc
  limit p_limit;
$$;

revoke execute on function public.create_post(public.post_audience, uuid, public.post_type, text, text, uuid[]) from public, anon;
revoke execute on function public.room_has_elderly_without_photo_consent(uuid) from public, anon;
revoke execute on function public.visible_post_days(date, int) from public, anon;
grant execute on function public.create_post(public.post_audience, uuid, public.post_type, text, text, uuid[]) to authenticated;
grant execute on function public.room_has_elderly_without_photo_consent(uuid) to authenticated;
grant execute on function public.visible_post_days(date, int) to authenticated;

-- Límites del bucket: solo WebP de hasta 200 KB (la compresión se hace en el navegador)
update storage.buckets
set file_size_limit = 204800, allowed_mime_types = array['image/webp']
where id = 'post-photos';
