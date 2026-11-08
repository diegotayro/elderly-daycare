insert into public.daycares (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Casa Nogal'),
  ('00000000-0000-0000-0000-000000000002', 'Casa Olivo'),
  ('00000000-0000-0000-0000-000000000003', 'Jardín del Sauce'),
  ('00000000-0000-0000-0000-000000000004', 'Casa Alameda'),
  ('00000000-0000-0000-0000-000000000005', 'Refugio Los Pinos')
on conflict (id) do nothing;
