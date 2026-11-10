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


insert into public.elderly (id, room_id, first_name, last_name, birth_date, enrolled_at, allergy_tags, medical_notes) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Luis', 'Fernández', '1947-03-12', '2025-02-10', '{Maní}', 'Hipertensión: toma su pastilla a las 12:00.'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 'Carmen', 'Ruiz', '1950-01-20', '2024-09-02', '{}', 'Diabetes: toma su pastilla en el desayuno.'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000102', 'Jorge', 'Salazar', '1943-05-08', '2024-11-18', '{}', 'Artrosis: camina con bastón.'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000102', 'Rosa', 'Méndez', '1945-02-14', '2025-03-24', '{}', 'Asma: usa su inhalador por la mañana.'),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000101', 'Alberto', 'Díaz', '1939-04-03', '2024-07-15', '{Lactosa}', 'Colesterol alto: toma su pastilla en la cena.')
on conflict (id) do nothing;
