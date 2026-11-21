-- list_notices devuelve además post_id (null en account_activated) para enlazar al detalle.
-- Misma lógica que antes; solo se agrega la columna al final.

drop function public.list_notices(timestamptz, int);

create function public.list_notices(p_since timestamptz, p_limit int)
returns table (
  id text,
  kind text,
  occurred_at timestamptz,
  actor_name text,
  others_count int,
  post_audience public.post_audience,
  post_title text,
  room_name text,
  elderly_names text[],
  elderly_first_name text,
  is_first_link boolean,
  post_id uuid
)
language sql
stable
security invoker
set search_path = ''
as $$
  with comment_notices as (
    select
      'comment:' || c.id::text as id,
      'comment'::text as kind,
      c.created_at as occurred_at,
      author.full_name as actor_name,
      0 as others_count,
      c.post_id,
      null::text as elderly_first_name,
      null::boolean as is_first_link
    from public.comments c
    left join public.users author on author.id = c.author_id
    where c.created_at >= p_since
      and c.author_id <> (select auth.uid())
  ),
  ranked_reactions as (
    select
      r.post_id,
      r.created_at,
      r.user_id,
      row_number() over (partition by r.post_id order by r.created_at desc, r.id desc) as position,
      count(*) over (partition by r.post_id) as total
    from public.reactions r
    where r.created_at >= p_since
      and r.user_id <> (select auth.uid())
  ),
  reaction_notices as (
    select
      'reaction:' || rr.post_id::text as id,
      'reaction'::text as kind,
      rr.created_at as occurred_at,
      reactor.full_name as actor_name,
      (rr.total - 1)::int as others_count,
      rr.post_id,
      null::text as elderly_first_name,
      null::boolean as is_first_link
    from ranked_reactions rr
    left join public.users reactor on reactor.id = rr.user_id
    where rr.position = 1
  ),
  post_notices as (
    select
      n.id, n.kind, n.occurred_at, n.actor_name, n.others_count,
      p.audience as post_audience,
      p.title as post_title,
      room.name as room_name,
      (
        select coalesce(array_agg(e.first_name order by e.first_name), '{}')
        from public.post_elderly pe
        join public.elderly e on e.id = pe.elderly_id
        where pe.post_id = n.post_id
      ) as elderly_names,
      n.elderly_first_name,
      n.is_first_link,
      n.post_id
    from (
      select * from comment_notices
      union all
      select * from reaction_notices
    ) n
    join public.posts p on p.id = n.post_id
    left join public.rooms room on room.id = p.room_id
  ),
  link_notices as (
    select
      'link:' || link.id::text as id,
      'account_activated'::text as kind,
      link.created_at as occurred_at,
      relative.full_name as actor_name,
      0 as others_count,
      null::public.post_audience as post_audience,
      null::text as post_title,
      null::text as room_name,
      null::text[] as elderly_names,
      e.first_name as elderly_first_name,
      (select public.is_first_guardian_link(link.id)) as is_first_link,
      null::uuid as post_id
    from public.guardian_elderly link
    join public.users relative on relative.id = link.relative_id
    join public.elderly e on e.id = link.elderly_id
    where link.created_at >= p_since
  )
  select * from (
    select * from post_notices
    union all
    select * from link_notices
  ) notices
  order by notices.occurred_at desc
  limit p_limit;
$$;

revoke execute on function public.list_notices(timestamptz, int) from public, anon;
grant execute on function public.list_notices(timestamptz, int) to authenticated;
