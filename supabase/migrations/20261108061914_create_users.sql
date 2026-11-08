-- Enums
create type public.user_role as enum ('staff', 'relative', 'admin');
create type public.user_status as enum ('pending', 'active', 'archived');

-- Tabla users
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  daycare_id uuid not null references public.daycares (id),
  role public.user_role not null,
  status public.user_status not null,
  first_name text not null,
  last_name text not null,
  full_name text generated always as (first_name || ' ' || last_name) stored,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_first_name_not_blank check (length(trim(first_name)) > 0),
  constraint users_last_name_not_blank check (length(trim(last_name)) > 0)
);

create index users_daycare_id_idx on public.users (daycare_id);

alter table public.users enable row level security;

-- updated_at genérico (reutilizable por otras tablas)
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Helpers: solo reconocen al usuario logueado si está active
create function public.current_user_daycare_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select daycare_id
  from public.users
  where id = auth.uid() and status = 'active';
$$;

create function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.users
  where id = auth.uid() and status = 'active';
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select public.current_user_role()) = 'admin', false);
$$;

revoke execute on function public.current_user_daycare_id() from public, anon;
revoke execute on function public.current_user_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.current_user_daycare_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Creación de la fila en users desde auth.users
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  new_daycare_id uuid := nullif(metadata ->> 'daycare_id', '')::uuid;
  new_role public.user_role := nullif(metadata ->> 'role', '')::public.user_role;
  new_first_name text := nullif(trim(metadata ->> 'first_name'), '');
  new_last_name text := nullif(trim(metadata ->> 'last_name'), '');
begin
  if new_daycare_id is null or new_role is null
     or new_first_name is null or new_last_name is null then
    raise exception 'raw_user_meta_data requires daycare_id, role, first_name and last_name';
  end if;

  -- Dentro de security definer current_user es el dueño de la función;
  -- session_user identifica quién ejecuta realmente (postgres = SQL Editor).
  if new_role = 'admin' and session_user <> 'postgres' then
    raise exception 'admin accounts can only be created from SQL';
  end if;

  insert into public.users (id, daycare_id, role, status, first_name, last_name)
  values (
    new.id,
    new_daycare_id,
    new_role,
    case when new_role = 'staff' then 'pending' else 'active' end::public.user_status,
    new_first_name,
    new_last_name
  );

  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Protección de columnas en users
create function public.protect_users_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
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
     and not (select public.is_admin()) then
    raise exception 'only an admin can change first_name, last_name or status';
  end if;

  if new.status is distinct from old.status and old.role = 'admin' then
    raise exception 'the status of an admin cannot be changed';
  end if;

  return new;
end;
$$;

create trigger users_protect_columns
  before update on public.users
  for each row execute function public.protect_users_columns();

-- Policies de users
create policy users_select_own on public.users
  for select to authenticated
  using (
    id = (select auth.uid())
    and (select public.current_user_daycare_id()) is not null
  );

create policy users_select_admin on public.users
  for select to authenticated
  using (
    (select public.is_admin())
    and daycare_id = (select public.current_user_daycare_id())
  );

create policy users_select_team on public.users
  for select to authenticated
  using (
    (select public.current_user_role()) in ('staff', 'relative')
    and role in ('staff', 'admin')
    and daycare_id = (select public.current_user_daycare_id())
  );

create policy users_update_own on public.users
  for update to authenticated
  using (
    id = (select auth.uid())
    and (select public.current_user_daycare_id()) is not null
  )
  with check (id = (select auth.uid()));

create policy users_update_admin on public.users
  for update to authenticated
  using (
    (select public.is_admin())
    and daycare_id = (select public.current_user_daycare_id())
  )
  with check (
    (select public.is_admin())
    and daycare_id = (select public.current_user_daycare_id())
  );

-- Policies de daycares (pendientes de la spec 09)
create policy daycares_select_member on public.daycares
  for select to authenticated
  using (id = (select public.current_user_daycare_id()));

create policy daycares_update_admin on public.daycares
  for update to authenticated
  using (
    (select public.is_admin())
    and id = (select public.current_user_daycare_id())
  )
  with check (
    (select public.is_admin())
    and id = (select public.current_user_daycare_id())
  );

revoke update on public.daycares from authenticated;
grant update (name) on public.daycares to authenticated;
