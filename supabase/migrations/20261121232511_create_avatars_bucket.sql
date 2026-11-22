-- Bucket privado de avatares; la primera carpeta de la ruta es el user_id del dueño
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 204800, array['image/webp']);

-- Primera carpeta de la ruta de Storage como uuid; null si no tiene formato uuid
create function public.avatar_owner_from_path(p_path text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_path, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_path, '/', 1)::uuid
  end;
$$;

-- ¿Quien llama puede subir el avatar de p_user_id?
-- El dueño, o un admin con un staff/relative de su guardería que no esté archived
create function public.can_upload_avatar(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users caller
    where caller.id = (select auth.uid())
      and caller.status = 'active'
      and (
        caller.id = p_user_id
        or (
          caller.role = 'admin'
          and exists (
            select 1
            from public.users target
            where target.id = p_user_id
              and target.role in ('staff', 'relative')
              and target.daycare_id = caller.daycare_id
              and target.status <> 'archived'
          )
        )
      )
  );
$$;

-- ¿Quien llama puede borrar el avatar de p_user_id?
-- Igual que can_upload_avatar, pero el admin también puede con un archived
create function public.can_remove_avatar(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users caller
    where caller.id = (select auth.uid())
      and caller.status = 'active'
      and (
        caller.id = p_user_id
        or (
          caller.role = 'admin'
          and exists (
            select 1
            from public.users target
            where target.id = p_user_id
              and target.role in ('staff', 'relative')
              and target.daycare_id = caller.daycare_id
          )
        )
      )
  );
$$;

-- Email de un familiar de la guardería de quien llama. Solo para el admin; null en otro caso
create function public.get_relative_email(p_relative_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select au.email::text
  from public.users u
  join auth.users au on au.id = u.id
  where coalesce((select public.is_admin()), false)
    and u.id = p_relative_id
    and u.role = 'relative'
    and u.daycare_id = (select public.current_user_daycare_id());
$$;

revoke execute on function public.avatar_owner_from_path(text) from public, anon;
revoke execute on function public.can_upload_avatar(uuid) from public, anon;
revoke execute on function public.can_remove_avatar(uuid) from public, anon;
revoke execute on function public.get_relative_email(uuid) from public, anon;
grant execute on function public.avatar_owner_from_path(text) to authenticated;
grant execute on function public.can_upload_avatar(uuid) to authenticated;
grant execute on function public.can_remove_avatar(uuid) to authenticated;
grant execute on function public.get_relative_email(uuid) to authenticated;

-- Select: pasa por la RLS de users, así ve la foto quien ya ve a esa persona
create policy avatars_objects_select_visible on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.users
      where id = public.avatar_owner_from_path(name)
    )
  );

create policy avatars_objects_insert_owner_or_admin on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (select public.can_upload_avatar(public.avatar_owner_from_path(name)))
  );

create policy avatars_objects_delete_owner_or_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (select public.can_remove_avatar(public.avatar_owner_from_path(name)))
  );

-- No hay policy de update: cada subida es un archivo nuevo
