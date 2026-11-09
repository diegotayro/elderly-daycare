-- Tabla rooms
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  is_default boolean not null default false,
  name text not null,
  created_at timestamptz not null default now(),
  constraint rooms_name_not_blank check (length(trim(name)) > 0),
  constraint rooms_daycare_id_name_key unique (daycare_id, name)
);

-- Una sola habitación por defecto por guardería
create unique index rooms_one_default_per_daycare_idx
  on public.rooms (daycare_id)
  where is_default;

alter table public.rooms enable row level security;

-- Habitación por defecto de cada guardería nueva
create function public.create_default_room()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.rooms (daycare_id, name, is_default)
  values (new.id, 'Temporal', true);

  return new;
end;
$$;

revoke execute on function public.create_default_room() from public, anon, authenticated;

create trigger daycares_create_default_room
  after insert on public.daycares
  for each row execute function public.create_default_room();

-- Policies de rooms
create policy rooms_select_member on public.rooms
  for select to authenticated
  using (daycare_id = (select public.current_user_daycare_id()));

create policy rooms_insert_admin on public.rooms
  for insert to authenticated
  with check (
    (select public.is_admin())
    and daycare_id = (select public.current_user_daycare_id())
    and not is_default
  );

create policy rooms_update_admin on public.rooms
  for update to authenticated
  using (
    (select public.is_admin())
    and daycare_id = (select public.current_user_daycare_id())
  )
  with check (
    (select public.is_admin())
    and daycare_id = (select public.current_user_daycare_id())
  );

create policy rooms_delete_admin on public.rooms
  for delete to authenticated
  using (
    (select public.is_admin())
    and daycare_id = (select public.current_user_daycare_id())
    and not is_default
  );

-- Permisos: solo name es editable
grant select, insert, delete on public.rooms to authenticated;
revoke update on public.rooms from authenticated;
grant update (name) on public.rooms to authenticated;
