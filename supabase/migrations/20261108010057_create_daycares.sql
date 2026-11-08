create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint daycares_name_not_blank check (length(trim(name)) > 0),
  constraint daycares_name_key unique (name)
);

alter table public.daycares enable row level security;
-- Sin policies: se agregan en la spec de users.
