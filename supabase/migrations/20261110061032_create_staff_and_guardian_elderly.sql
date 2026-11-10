-- Tipo de relación del familiar con el adulto mayor
create type public.relationship_type as enum ('son', 'daughter', 'guardian');

-- Asignación de staff a adultos mayores
create table public.staff_elderly (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.users (id) on delete cascade,
  elderly_id uuid not null references public.elderly (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint staff_elderly_staff_id_elderly_id_key unique (staff_id, elderly_id)
);

create index staff_elderly_elderly_id_idx on public.staff_elderly (elderly_id);

-- Vínculo de familiares con adultos mayores
create table public.guardian_elderly (
  id uuid primary key default gen_random_uuid(),
  relative_id uuid not null references public.users (id) on delete cascade,
  elderly_id uuid not null references public.elderly (id) on delete cascade,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  constraint guardian_elderly_relative_id_elderly_id_key unique (relative_id, elderly_id)
);

create index guardian_elderly_elderly_id_idx on public.guardian_elderly (elderly_id);

-- Ancianos del usuario actual (asignados si es staff, vinculados si es relative).
-- SECURITY DEFINER para no pasar por las policies de las tablas y evitar recursión.
create function public.current_user_elderly_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select se.elderly_id
  from public.staff_elderly se
  where se.staff_id = auth.uid()
    and public.current_user_role() = 'staff'
  union
  select ge.elderly_id
  from public.guardian_elderly ge
  where ge.relative_id = auth.uid()
    and public.current_user_role() = 'relative';
$$;

revoke execute on function public.current_user_elderly_ids() from public, anon;
grant execute on function public.current_user_elderly_ids() to authenticated;

alter table public.staff_elderly enable row level security;
alter table public.guardian_elderly enable row level security;

-- Policies de staff_elderly
create policy staff_elderly_select_admin on public.staff_elderly
  for select to authenticated
  using (
    (select public.is_admin())
    and elderly_id in (
      select e.id
      from public.elderly e
      join public.rooms r on r.id = e.room_id
      where r.daycare_id = (select public.current_user_daycare_id())
    )
  );

create policy staff_elderly_select_own on public.staff_elderly
  for select to authenticated
  using (
    (select public.current_user_role()) = 'staff'
    and staff_id = (select auth.uid())
  );

create policy staff_elderly_select_relative on public.staff_elderly
  for select to authenticated
  using (
    (select public.current_user_role()) = 'relative'
    and elderly_id in (select public.current_user_elderly_ids())
  );

create policy staff_elderly_insert_admin on public.staff_elderly
  for insert to authenticated
  with check (
    (select public.is_admin())
    and elderly_id in (
      select e.id
      from public.elderly e
      join public.rooms r on r.id = e.room_id
      where r.daycare_id = (select public.current_user_daycare_id())
    )
    and exists (
      select 1 from public.users u
      where u.id = staff_id
        and u.role = 'staff'
        and u.status = 'active'
        and u.daycare_id = (select public.current_user_daycare_id())
    )
  );

create policy staff_elderly_delete_admin on public.staff_elderly
  for delete to authenticated
  using (
    (select public.is_admin())
    and elderly_id in (
      select e.id
      from public.elderly e
      join public.rooms r on r.id = e.room_id
      where r.daycare_id = (select public.current_user_daycare_id())
    )
  );

-- Policies de guardian_elderly
create policy guardian_elderly_select_admin on public.guardian_elderly
  for select to authenticated
  using (
    (select public.is_admin())
    and elderly_id in (
      select e.id
      from public.elderly e
      join public.rooms r on r.id = e.room_id
      where r.daycare_id = (select public.current_user_daycare_id())
    )
  );

create policy guardian_elderly_select_own on public.guardian_elderly
  for select to authenticated
  using (
    (select public.current_user_role()) = 'relative'
    and relative_id = (select auth.uid())
  );

create policy guardian_elderly_select_staff on public.guardian_elderly
  for select to authenticated
  using (
    (select public.current_user_role()) = 'staff'
    and elderly_id in (select public.current_user_elderly_ids())
  );

create policy guardian_elderly_insert_admin on public.guardian_elderly
  for insert to authenticated
  with check (
    (select public.is_admin())
    and elderly_id in (
      select e.id
      from public.elderly e
      join public.rooms r on r.id = e.room_id
      where r.daycare_id = (select public.current_user_daycare_id())
    )
    and exists (
      select 1 from public.users u
      where u.id = relative_id
        and u.role = 'relative'
        and u.status = 'active'
        and u.daycare_id = (select public.current_user_daycare_id())
    )
  );

create policy guardian_elderly_delete_admin on public.guardian_elderly
  for delete to authenticated
  using (
    (select public.is_admin())
    and elderly_id in (
      select e.id
      from public.elderly e
      join public.rooms r on r.id = e.room_id
      where r.daycare_id = (select public.current_user_daycare_id())
    )
  );

-- Permisos: sin update; para cambiar un vínculo se borra y se crea de nuevo
grant select, insert, delete on public.staff_elderly to authenticated;
grant select, insert, delete on public.guardian_elderly to authenticated;
revoke update on public.staff_elderly from authenticated;
revoke update on public.guardian_elderly from authenticated;

-- Policies sobre tablas existentes que dependen del helper
create policy elderly_select_linked on public.elderly
  for select to authenticated
  using (id in (select public.current_user_elderly_ids()));

create policy users_select_staff_relatives on public.users
  for select to authenticated
  using (
    (select public.current_user_role()) = 'staff'
    and role = 'relative'
    and daycare_id = (select public.current_user_daycare_id())
    and id in (
      select ge.relative_id
      from public.guardian_elderly ge
      where ge.elderly_id in (select public.current_user_elderly_ids())
    )
  );
