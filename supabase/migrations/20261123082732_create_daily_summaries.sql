-- Resumen del día: ánimo y siesta escritos por el equipo; comidas y momentos se calculan de los posts
create table public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly (id) on delete restrict,
  date date not null,
  mood text,
  sleep_minutes int,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_summaries_elderly_date_key unique (elderly_id, date),
  constraint daily_summaries_mood_length check (mood is null or char_length(btrim(mood)) between 1 and 80),
  constraint daily_summaries_sleep_minutes_range check (sleep_minutes is null or sleep_minutes between 0 and 300),
  constraint daily_summaries_sent_requires_fields check (sent_at is null or (mood is not null and sleep_minutes is not null))
);

create trigger daily_summaries_set_updated_at
  before update on public.daily_summaries
  for each row execute function public.set_updated_at();

-- elderly_id y date son inmutables; un resumen enviado no se "des-envía"
create function public.protect_daily_summaries_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.elderly_id is distinct from old.elderly_id or new.date is distinct from old.date then
    raise exception 'elderly_id and date are immutable';
  end if;
  if old.sent_at is not null and new.sent_at is distinct from old.sent_at then
    raise exception 'summary already sent';
  end if;
  return new;
end;
$$;

create trigger daily_summaries_protect_columns
  before update on public.daily_summaries
  for each row execute function public.protect_daily_summaries_columns();

revoke execute on function public.protect_daily_summaries_columns() from public, anon, authenticated;

-- Quién puede escribir: admin de la guardería o staff asignado, solo si el adulto mayor está active
create function public.can_write_daily_summary(p_elderly_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.elderly e
    join public.rooms r on r.id = e.room_id
    where e.id = p_elderly_id
      and e.status = 'active'
      and (
        (public.is_admin() and r.daycare_id = public.current_user_daycare_id())
        or (
          public.current_user_role() = 'staff'
          and p_elderly_id in (select public.current_user_elderly_ids())
        )
      )
  );
$$;

revoke execute on function public.can_write_daily_summary(uuid) from public, anon;
grant execute on function public.can_write_daily_summary(uuid) to authenticated;

alter table public.daily_summaries enable row level security;

create policy daily_summaries_select_relative on public.daily_summaries
  for select to authenticated
  using (
    (select public.current_user_role()) = 'relative'
    and elderly_id in (select public.current_user_elderly_ids())
    and sent_at is not null
  );

create policy daily_summaries_select_staff on public.daily_summaries
  for select to authenticated
  using (
    (select public.current_user_role()) = 'staff'
    and elderly_id in (select public.current_user_elderly_ids())
  );

create policy daily_summaries_select_admin on public.daily_summaries
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

-- Ventana de escritura: hoy y ayer en hora de Lima
create policy daily_summaries_insert_team on public.daily_summaries
  for insert to authenticated
  with check (
    (select public.can_write_daily_summary(elderly_id))
    and date between ((now() at time zone 'America/Lima')::date - 1) and (now() at time zone 'America/Lima')::date
  );

create policy daily_summaries_update_team on public.daily_summaries
  for update to authenticated
  using (
    (select public.can_write_daily_summary(elderly_id))
    and date between ((now() at time zone 'America/Lima')::date - 1) and (now() at time zone 'America/Lima')::date
  )
  with check (
    (select public.can_write_daily_summary(elderly_id))
    and date between ((now() at time zone 'America/Lima')::date - 1) and (now() at time zone 'America/Lima')::date
  );

-- Posts del día (hora de Lima) que alcanzan al adulto mayor; la RLS de posts decide qué ve quien llama
create function public.list_summary_posts(p_elderly_id uuid, p_day date)
returns table (
  id uuid,
  type public.post_type,
  title text,
  body text,
  published_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.id, p.type, p.title, p.body, p.published_at
  from public.posts p
  join public.elderly e on e.id = p_elderly_id
  where (p.published_at at time zone 'America/Lima')::date = p_day
    and p.type <> 'announcement'
    and (
      (p.audience = 'elderly' and exists (
        select 1 from public.post_elderly pe
        where pe.post_id = p.id and pe.elderly_id = p_elderly_id
      ))
      or (p.audience = 'room' and p.room_id = e.room_id)
      or p.audience = 'daycare'
    )
  order by p.published_at asc;
$$;

revoke execute on function public.list_summary_posts(uuid, date) from public, anon;
grant execute on function public.list_summary_posts(uuid, date) to authenticated;
