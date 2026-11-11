-- Estado de la invitación a un familiar
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

-- Código de 5 caracteres sin ambigüedades (sin I, L, O, 0, 1).
-- Muestreo por rechazo: solo se aceptan bytes < 248 (31 * 8) para no sesgar la distribución.
create function public.generate_invitation_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  random_byte int;
begin
  while length(result) < 5 loop
    random_byte := get_byte(extensions.gen_random_bytes(1), 0);
    if random_byte < 248 then
      result := result || substr(alphabet, (random_byte % 31) + 1, 1);
    end if;
  end loop;
  return result;
end;
$$;

revoke execute on function public.generate_invitation_code() from public, anon;
grant execute on function public.generate_invitation_code() to authenticated;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly (id) on delete cascade,
  invited_by uuid not null references public.users (id),
  first_name text not null,
  last_name text not null,
  full_name text generated always as (first_name || ' ' || last_name) stored,
  email text not null,
  relationship public.relationship_type not null,
  code text not null default public.generate_invitation_code(),
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invitations_code_key unique (code),
  constraint invitations_first_name_not_blank check (btrim(first_name) <> ''),
  constraint invitations_first_name_max_length check (char_length(first_name) <= 80),
  constraint invitations_last_name_not_blank check (btrim(last_name) <> ''),
  constraint invitations_last_name_max_length check (char_length(last_name) <= 80),
  constraint invitations_email_normalized check (email = lower(btrim(email))),
  constraint invitations_email_max_length check (char_length(email) <= 254),
  constraint invitations_code_format check (code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$')
);

-- Una sola invitación pendiente por adulto mayor y email
create unique index invitations_elderly_id_email_pending_key
  on public.invitations (elderly_id, email)
  where status = 'pending';

create index invitations_elderly_id_idx on public.invitations (elderly_id);
create index invitations_invited_by_idx on public.invitations (invited_by);

alter table public.invitations enable row level security;

create policy invitations_select_admin on public.invitations
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

create policy invitations_insert_admin on public.invitations
  for insert to authenticated
  with check (
    (select public.is_admin())
    and invited_by = (select auth.uid())
    and status = 'pending'
    and elderly_id in (
      select e.id
      from public.elderly e
      join public.rooms r on r.id = e.room_id
      where r.daycare_id = (select public.current_user_daycare_id())
    )
  );

create policy invitations_update_admin on public.invitations
  for update to authenticated
  using (
    (select public.is_admin())
    and elderly_id in (
      select e.id
      from public.elderly e
      join public.rooms r on r.id = e.room_id
      where r.daycare_id = (select public.current_user_daycare_id())
    )
  )
  with check (
    (select public.is_admin())
    and elderly_id in (
      select e.id
      from public.elderly e
      join public.rooms r on r.id = e.room_id
      where r.daycare_id = (select public.current_user_daycare_id())
    )
  );

-- Sin delete; el admin solo puede cambiar el estado
grant select, insert on public.invitations to authenticated;
revoke update on public.invitations from authenticated;
grant update (status) on public.invitations to authenticated;
