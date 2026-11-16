-- protect_users_columns(): el admin solo cambia el status entre active y archived
create or replace function public.protect_users_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_staff_activation boolean :=
    coalesce(current_setting('app.staff_activation', true), '') = 'on'
    and old.id = auth.uid()
    and old.role = 'staff'
    and old.status = 'pending'
    and new.status = 'active'
    and new.first_name = old.first_name
    and new.last_name = old.last_name;
begin
  -- service_role o SQL (sin sesión de usuario): se permite todo
  if auth.uid() is null then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.daycare_id is distinct from old.daycare_id
     or new.role is distinct from old.role then
    raise exception 'id, daycare_id and role cannot be changed';
  end if;

  if (new.first_name is distinct from old.first_name
      or new.last_name is distinct from old.last_name
      or new.status is distinct from old.status)
     and not is_staff_activation
     and not (select public.is_admin()) then
    raise exception 'only an admin can change first_name, last_name or status';
  end if;

  if new.status is distinct from old.status and old.role = 'admin' then
    raise exception 'the status of an admin cannot be changed';
  end if;

  -- Admin: solo active <-> archived (pending -> active es exclusivo de activate_staff_account())
  if new.status is distinct from old.status
     and not is_staff_activation
     and (old.status, new.status) not in (('active', 'archived'), ('archived', 'active')) then
    raise exception 'status can only change between active and archived';
  end if;

  return new;
end;
$$;

-- staff_has_history(): true si el staff tiene posts, comentarios o reacciones
create function public.staff_has_history(p_staff_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    return false;
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = p_staff_id
      and u.role = 'staff'
      and u.daycare_id = (select public.current_user_daycare_id())
  ) then
    return false;
  end if;

  return exists (select 1 from public.posts where author_id = p_staff_id)
      or exists (select 1 from public.comments where author_id = p_staff_id)
      or exists (select 1 from public.reactions where user_id = p_staff_id);
end;
$$;

revoke execute on function public.staff_has_history(uuid) from public, anon;
grant execute on function public.staff_has_history(uuid) to authenticated;
