-- ¿Ese email ya está vinculado a este adulto mayor? Solo para el admin de su guardería.
create function public.is_email_linked_to_elderly(p_elderly_id uuid, p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((select public.is_admin()), false)
    and exists (
      select 1
      from public.elderly e
      join public.rooms r on r.id = e.room_id
      where e.id = p_elderly_id
        and r.daycare_id = (select public.current_user_daycare_id())
    )
    and exists (
      select 1
      from public.guardian_elderly ge
      join auth.users au on au.id = ge.relative_id
      where ge.elderly_id = p_elderly_id
        and lower(au.email) = lower(btrim(p_email))
    );
$$;

-- ¿Ese email es de un staff o admin de la guardería de quien llama? Solo para admin.
create function public.is_team_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((select public.is_admin()), false)
    and exists (
      select 1
      from public.users u
      join auth.users au on au.id = u.id
      where u.role in ('staff', 'admin')
        and u.daycare_id = (select public.current_user_daycare_id())
        and lower(au.email) = lower(btrim(p_email))
    );
$$;

-- Vista previa de una invitación vigente para /activate-account (solo service_role)
create function public.get_invitation_preview(p_code text)
returns table (
  email text,
  first_name text,
  last_name text,
  elderly_full_name text,
  elderly_first_name text,
  elderly_id uuid,
  room_name text,
  daycare_id uuid,
  has_account boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.email,
    i.first_name,
    i.last_name,
    e.full_name,
    e.first_name,
    e.id,
    r.name,
    r.daycare_id,
    exists (select 1 from auth.users au where lower(au.email) = i.email)
  from public.invitations i
  join public.elderly e on e.id = i.elderly_id
  join public.rooms r on r.id = e.room_id
  where i.code = upper(btrim(p_code))
    and i.status = 'pending'
    and i.expires_at > now()
    and e.status = 'active';
$$;

-- Acepta la invitación con la sesión del familiar: crea el vínculo y devuelve el id del adulto mayor
create function public.accept_invitation(p_code text, p_photo_consent boolean)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_invitation public.invitations;
  v_session_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if (select public.current_user_role()) is distinct from 'relative' then
    raise exception 'not_a_relative';
  end if;

  select i.* into v_invitation
  from public.invitations i
  join public.elderly e on e.id = i.elderly_id
  join public.rooms r on r.id = e.room_id
  where i.code = upper(btrim(p_code))
    and i.status = 'pending'
    and i.expires_at > now()
    and e.status = 'active'
    and r.daycare_id = (select public.current_user_daycare_id())
  for update of i;

  if not found then
    raise exception 'invitation_not_found';
  end if;

  if v_invitation.email <> v_session_email then
    raise exception 'invitation_email_mismatch';
  end if;

  insert into public.guardian_elderly (relative_id, elderly_id, relationship)
  values ((select auth.uid()), v_invitation.elderly_id, v_invitation.relationship)
  on conflict (relative_id, elderly_id) do nothing;

  -- Siempre gana el "no": un familiar nunca pasa el consentimiento de false a true
  if not p_photo_consent then
    update public.elderly set photo_consent = false where id = v_invitation.elderly_id;
  end if;

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invitation.id;

  return v_invitation.elderly_id;
end;
$$;

revoke execute on function public.is_email_linked_to_elderly(uuid, text) from public, anon;
revoke execute on function public.is_team_email(text) from public, anon;
revoke execute on function public.accept_invitation(text, boolean) from public, anon;
revoke execute on function public.get_invitation_preview(text) from public, anon, authenticated;

grant execute on function public.is_email_linked_to_elderly(uuid, text) to authenticated;
grant execute on function public.is_team_email(text) to authenticated;
grant execute on function public.accept_invitation(text, boolean) to authenticated;
grant execute on function public.get_invitation_preview(text) to service_role;
