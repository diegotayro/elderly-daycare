-- Estado del adulto mayor
create type public.elderly_status as enum ('active', 'archived');

-- Tabla elderly
create table public.elderly (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete restrict,
  first_name text not null,
  last_name text not null,
  full_name text generated always as (first_name || ' ' || last_name) stored,
  birth_date date not null,
  enrolled_at date not null,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.elderly_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint elderly_first_name_not_blank check (length(trim(first_name)) > 0),
  constraint elderly_last_name_not_blank check (length(trim(last_name)) > 0),
  constraint elderly_enrolled_after_birth check (enrolled_at > birth_date)
);

create index elderly_room_id_idx on public.elderly (room_id);

create trigger elderly_set_updated_at
  before update on public.elderly
  for each row execute function public.set_updated_at();

alter table public.elderly enable row level security;

-- Policies de elderly (solo admin; staff y relative llegan en specs futuras)
create policy elderly_select_admin on public.elderly
  for select to authenticated
  using (
    (select public.is_admin())
    and room_id in (
      select id from public.rooms
      where daycare_id = (select public.current_user_daycare_id())
    )
  );

create policy elderly_insert_admin on public.elderly
  for insert to authenticated
  with check (
    (select public.is_admin())
    and room_id in (
      select id from public.rooms
      where daycare_id = (select public.current_user_daycare_id())
    )
  );

create policy elderly_update_admin on public.elderly
  for update to authenticated
  using (
    (select public.is_admin())
    and room_id in (
      select id from public.rooms
      where daycare_id = (select public.current_user_daycare_id())
    )
  )
  with check (
    (select public.is_admin())
    and room_id in (
      select id from public.rooms
      where daycare_id = (select public.current_user_daycare_id())
    )
  );

-- Permisos: sin delete (borrado lógico con status) y sin editar id ni created_at
grant select, insert on public.elderly to authenticated;
revoke update, delete on public.elderly from authenticated;
grant update (
  room_id, first_name, last_name, birth_date, enrolled_at,
  medical_notes, allergy_tags, photo_consent, status
) on public.elderly to authenticated;
