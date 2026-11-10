-- Familiares de los ancianos del staff logueado.
-- SECURITY DEFINER para que la policy de users no lea guardian_elderly con RLS:
-- guardian_elderly_insert_admin lee users, y eso causaba recursión infinita.
create function public.current_user_relative_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select ge.relative_id
  from public.guardian_elderly ge
  where ge.elderly_id in (select public.current_user_elderly_ids())
    and public.current_user_role() = 'staff';
$$;

revoke execute on function public.current_user_relative_ids() from public, anon;
grant execute on function public.current_user_relative_ids() to authenticated;

drop policy users_select_staff_relatives on public.users;

create policy users_select_staff_relatives on public.users
  for select to authenticated
  using (
    role = 'relative'
    and daycare_id = (select public.current_user_daycare_id())
    and id in (select public.current_user_relative_ids())
  );
