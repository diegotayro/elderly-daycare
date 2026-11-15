-- Enums del feed
create type public.post_type as enum ('meal', 'nap', 'activity', 'achievement', 'announcement');
create type public.post_audience as enum ('elderly', 'room', 'daycare');

-- Publicaciones
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete restrict,
  audience public.post_audience not null,
  room_id uuid references public.rooms (id) on delete restrict,
  type public.post_type not null,
  title text,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_room_id_matches_audience check ((audience = 'room') = (room_id is not null)),
  constraint posts_title_length check (title is null or char_length(btrim(title)) between 1 and 120),
  constraint posts_body_length check (char_length(btrim(body)) between 1 and 2000)
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_room_id_idx on public.posts (room_id);
create index posts_published_at_idx on public.posts (published_at desc);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- Adultos mayores etiquetados en la publicación
create table public.post_elderly (
  post_id uuid not null references public.posts (id) on delete cascade,
  elderly_id uuid not null references public.elderly (id) on delete restrict,
  primary key (post_id, elderly_id)
);

create index post_elderly_elderly_id_idx on public.post_elderly (elderly_id);

-- Fotos de la publicación
create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  url text not null,
  width int check (width > 0),
  height int check (height > 0),
  position int not null check (position >= 0),
  created_at timestamptz not null default now(),
  constraint post_photos_post_id_position_key unique (post_id, position),
  constraint post_photos_url_in_post_folder check (split_part(url, '/', 1) = post_id::text)
);

-- Reacciones
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete restrict,
  type text not null check (type = 'love'),
  created_at timestamptz not null default now(),
  constraint reactions_post_id_user_id_key unique (post_id, user_id)
);

create index reactions_user_id_idx on public.reactions (user_id);

-- Comentarios
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete restrict,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_post_id_idx on public.comments (post_id);
create index comments_author_id_idx on public.comments (author_id);

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- Regla de visibilidad del feed: única implementación (según audience, nunca type).
-- SECURITY DEFINER para no pasar por las policies de las tablas y evitar recursión.
create function public.can_view_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    join public.users author on author.id = p.author_id
    where p.id = p_post_id
      and author.daycare_id = (select public.current_user_daycare_id())
      and (
        (select public.current_user_role()) = 'admin'
        or (
          (select public.current_user_role()) in ('staff', 'relative')
          and (
            p.audience = 'daycare'
            or (
              p.audience = 'elderly'
              and exists (
                select 1 from public.post_elderly pe
                where pe.post_id = p.id
                  and pe.elderly_id in (select public.current_user_elderly_ids())
              )
            )
            or (
              p.audience = 'room'
              and p.room_id in (
                select e.room_id from public.elderly e
                where e.id in (select public.current_user_elderly_ids())
              )
            )
          )
        )
        or ((select public.current_user_role()) = 'staff' and p.author_id = (select auth.uid()))
      )
  );
$$;

-- Habitaciones donde el usuario puede publicar: admin, las de su guardería; staff, donde tiene asignados
create function public.can_post_to_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case (select public.current_user_role())
    when 'admin' then exists (
      select 1 from public.rooms r
      where r.id = p_room_id
        and r.daycare_id = (select public.current_user_daycare_id())
    )
    when 'staff' then exists (
      select 1 from public.elderly e
      where e.room_id = p_room_id
        and e.id in (select public.current_user_elderly_ids())
    )
    else false
  end;
$$;

-- true si algún adulto mayor etiquetado en el post no tiene consentimiento de fotos.
-- SECURITY DEFINER: la validación no debe depender de qué adultos mayores ve el que sube la foto.
create function public.post_has_tag_without_photo_consent(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.post_elderly pe
    join public.elderly e on e.id = pe.elderly_id
    where pe.post_id = p_post_id
      and not e.photo_consent
  );
$$;

-- Primera carpeta de la ruta de Storage como uuid; null si no tiene formato uuid
create function public.post_id_from_path(p_path text)
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

revoke execute on function public.can_view_post(uuid) from public, anon;
revoke execute on function public.can_post_to_room(uuid) from public, anon;
revoke execute on function public.post_has_tag_without_photo_consent(uuid) from public, anon;
grant execute on function public.can_view_post(uuid) to authenticated;
grant execute on function public.can_post_to_room(uuid) to authenticated;
grant execute on function public.post_has_tag_without_photo_consent(uuid) to authenticated;

-- author_id y audience no cambian
create function public.protect_posts_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.author_id is distinct from old.author_id
    or new.audience is distinct from old.audience then
    raise exception 'author_id and audience cannot be changed';
  end if;
  return new;
end;
$$;

create trigger posts_protect_columns
  before update on public.posts
  for each row execute function public.protect_posts_columns();

-- Un post elderly tiene al menos un etiquetado (se valida al hacer commit)
create function public.require_elderly_tag_on_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.audience = 'elderly'
    and not exists (select 1 from public.post_elderly where post_id = new.id) then
    raise exception 'elderly post requires at least one tagged elderly';
  end if;
  return null;
end;
$$;

create function public.keep_one_elderly_tag_on_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
      select 1 from public.posts p
      where p.id = old.post_id and p.audience = 'elderly'
    )
    and not exists (select 1 from public.post_elderly where post_id = old.post_id) then
    raise exception 'elderly post requires at least one tagged elderly';
  end if;
  return null;
end;
$$;

create constraint trigger posts_require_elderly_tag
  after insert on public.posts
  deferrable initially deferred
  for each row execute function public.require_elderly_tag_on_post();

create constraint trigger post_elderly_keep_one_tag
  after delete on public.post_elderly
  deferrable initially deferred
  for each row execute function public.keep_one_elderly_tag_on_post();

-- RLS
alter table public.posts enable row level security;
alter table public.post_elderly enable row level security;
alter table public.post_photos enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;

-- Policies de posts
create policy posts_select_visible on public.posts
  for select to authenticated
  using ((select public.can_view_post(id)));

create policy posts_insert_team on public.posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select public.current_user_role()) in ('staff', 'admin')
    and case audience
      when 'elderly' then true
      when 'room' then (select public.can_post_to_room(room_id))
      when 'daycare' then (select public.is_admin())
    end
  );

create policy posts_update_author on public.posts
  for update to authenticated
  using (
    author_id = (select auth.uid())
    and (select public.current_user_role()) in ('staff', 'admin')
  )
  with check (
    author_id = (select auth.uid())
    and (select public.current_user_role()) in ('staff', 'admin')
    and (audience <> 'room' or (select public.can_post_to_room(room_id)))
  );

create policy posts_delete_author on public.posts
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    and (select public.current_user_role()) in ('staff', 'admin')
  );

create policy posts_delete_admin on public.posts
  for delete to authenticated
  using (
    (select public.is_admin())
    and author_id in (
      select u.id from public.users u
      where u.daycare_id = (select public.current_user_daycare_id())
    )
  );

-- Policies de post_elderly
create policy post_elderly_select_visible on public.post_elderly
  for select to authenticated
  using ((select public.can_view_post(post_id)));

create policy post_elderly_insert_author on public.post_elderly
  for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.author_id = (select auth.uid())
        and p.audience = 'elderly'
        and (select public.current_user_role()) in ('staff', 'admin')
    )
    and exists (
      select 1 from public.elderly e
      where e.id = elderly_id
        and e.status = 'active'
        and (
          (
            (select public.is_admin())
            and e.room_id in (
              select r.id from public.rooms r
              where r.daycare_id = (select public.current_user_daycare_id())
            )
          )
          or e.id in (select public.current_user_elderly_ids())
        )
        and (
          e.photo_consent
          or not exists (select 1 from public.post_photos pp where pp.post_id = post_elderly.post_id)
        )
    )
  );

create policy post_elderly_delete_author on public.post_elderly
  for delete to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.author_id = (select auth.uid())
        and (select public.current_user_role()) in ('staff', 'admin')
    )
  );

create policy post_elderly_delete_admin on public.post_elderly
  for delete to authenticated
  using (
    (select public.is_admin())
    and exists (
      select 1 from public.posts p
      join public.users author on author.id = p.author_id
      where p.id = post_id
        and author.daycare_id = (select public.current_user_daycare_id())
    )
  );

-- Policies de post_photos
create policy post_photos_select_visible on public.post_photos
  for select to authenticated
  using ((select public.can_view_post(post_id)));

create policy post_photos_insert_author on public.post_photos
  for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.author_id = (select auth.uid())
        and (select public.current_user_role()) in ('staff', 'admin')
    )
    and not (select public.post_has_tag_without_photo_consent(post_id))
  );

create policy post_photos_delete_author on public.post_photos
  for delete to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.author_id = (select auth.uid())
        and (select public.current_user_role()) in ('staff', 'admin')
    )
  );

create policy post_photos_delete_admin on public.post_photos
  for delete to authenticated
  using (
    (select public.is_admin())
    and exists (
      select 1 from public.posts p
      join public.users author on author.id = p.author_id
      where p.id = post_id
        and author.daycare_id = (select public.current_user_daycare_id())
    )
  );

-- Policies de reactions
create policy reactions_select_visible on public.reactions
  for select to authenticated
  using ((select public.can_view_post(post_id)));

create policy reactions_insert_own on public.reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.can_view_post(post_id))
  );

create policy reactions_update_own on public.reactions
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select public.can_view_post(post_id))
  )
  with check (
    user_id = (select auth.uid())
    and (select public.can_view_post(post_id))
  );

create policy reactions_delete_own on public.reactions
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and (select public.current_user_role()) is not null
  );

-- Policies de comments
create policy comments_select_visible on public.comments
  for select to authenticated
  using ((select public.can_view_post(post_id)));

create policy comments_insert_own on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select public.can_view_post(post_id))
  );

create policy comments_update_author on public.comments
  for update to authenticated
  using (
    author_id = (select auth.uid())
    and (select public.current_user_role()) is not null
  )
  with check (
    author_id = (select auth.uid())
    and (select public.current_user_role()) is not null
    and (select public.can_view_post(post_id))
  );

create policy comments_delete_author on public.comments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    and (select public.current_user_role()) is not null
  );

create policy comments_delete_admin on public.comments
  for delete to authenticated
  using (
    (select public.is_admin())
    and exists (
      select 1 from public.posts p
      join public.users author on author.id = p.author_id
      where p.id = post_id
        and author.daycare_id = (select public.current_user_daycare_id())
    )
  );

-- Autores de comentarios de posts visibles (la subconsulta pasa por la RLS de comments)
create policy users_select_comment_authors on public.users
  for select to authenticated
  using (id in (select author_id from public.comments));

-- Storage: bucket privado; la primera carpeta de la ruta es el post_id
insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', false);

create policy post_photos_objects_select_visible on storage.objects
  for select to authenticated
  using (
    bucket_id = 'post-photos'
    and (select public.can_view_post(public.post_id_from_path(name)))
  );

create policy post_photos_objects_insert_author on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.posts p
      where p.id = public.post_id_from_path(name)
        and p.author_id = (select auth.uid())
        and (select public.current_user_role()) in ('staff', 'admin')
    )
    and not (select public.post_has_tag_without_photo_consent(public.post_id_from_path(name)))
  );

create policy post_photos_objects_delete_author on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.posts p
      where p.id = public.post_id_from_path(name)
        and p.author_id = (select auth.uid())
    )
  );

create policy post_photos_objects_delete_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-photos'
    and (select public.is_admin())
    and exists (
      select 1 from public.posts p
      join public.users author on author.id = p.author_id
      where p.id = public.post_id_from_path(name)
        and author.daycare_id = (select public.current_user_daycare_id())
    )
  );

-- Permisos
revoke all on public.posts, public.post_elderly, public.post_photos, public.reactions, public.comments from anon;
revoke all on public.posts, public.post_elderly, public.post_photos, public.reactions, public.comments from authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, delete on public.post_elderly to authenticated;
grant select, insert, delete on public.post_photos to authenticated;
grant select, insert, update, delete on public.reactions to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
