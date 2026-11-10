-- Valida el array de alergias: máximo 15, cada una de 1 a 40 caracteres.
-- Es una función porque un check no admite subconsultas (unnest).
create function public.are_valid_allergy_tags(tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(tags) <= 15
    and not exists (
      select 1 from unnest(tags) as tag
      where tag is null
        or char_length(trim(tag)) = 0
        or char_length(tag) > 40
    );
$$;

alter table public.elderly
  add constraint elderly_first_name_max_length check (char_length(first_name) <= 80),
  add constraint elderly_last_name_max_length check (char_length(last_name) <= 80),
  add constraint elderly_medical_notes_max_length check (char_length(medical_notes) <= 2000),
  add constraint elderly_allergy_tags_valid check (public.are_valid_allergy_tags(allergy_tags));
