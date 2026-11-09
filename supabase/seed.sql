insert into public.daycares (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Casa Nogal'),
  ('00000000-0000-0000-0000-000000000002', 'Casa Olivo'),
  ('00000000-0000-0000-0000-000000000003', 'Jardín del Sauce'),
  ('00000000-0000-0000-0000-000000000004', 'Casa Alameda'),
  ('00000000-0000-0000-0000-000000000005', 'Refugio Los Pinos')
on conflict (id) do nothing;

-- Habitación por defecto de cada guardería.
-- En un entorno nuevo el trigger ya la creó; en el remoto cubre las que faltan.
insert into public.rooms (daycare_id, name, is_default)
select id, 'Temporal', true
from public.daycares
on conflict do nothing;

insert into public.rooms (id, daycare_id, name) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Roble'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Cedro')
on conflict (id) do nothing;
