-- Emails de los staff de la guardería de quien llama. Solo para el admin.
create function public.get_staff_emails()
returns table (id uuid, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, au.email::text
  from public.users u
  join auth.users au on au.id = u.id
  where coalesce((select public.is_admin()), false)
    and u.role = 'staff'
    and u.daycare_id = (select public.current_user_daycare_id());
$$;

-- ¿Quien llama es un staff que aún no activó su cuenta?
create function public.is_pending_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and role = 'staff'
      and status = 'pending'
  );
$$;

-- Pasa a active la cuenta de quien llama, solo si es un staff pending.
create function public.activate_staff_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_pending_staff()) then
    raise exception 'not_a_pending_staff';
  end if;

  -- Flag local a la transacción: solo protect_users_columns() lo lee
  perform set_config('app.staff_activation', 'on', true);

  update public.users
  set status = 'active'
  where id = (select auth.uid());
end;
$$;

revoke execute on function public.get_staff_emails() from public, anon;
revoke execute on function public.is_pending_staff() from public, anon;
revoke execute on function public.activate_staff_account() from public, anon;
grant execute on function public.get_staff_emails() to authenticated;
grant execute on function public.is_pending_staff() to authenticated;
grant execute on function public.activate_staff_account() to authenticated;

-- protect_users_columns(): permite pending -> active solo desde activate_staff_account()
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

  return new;
end;
$$;
