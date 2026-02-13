-- Catalog terms for 2026-2028 filter (replaces ad-hoc term list from courses)
create table if not exists public.catalog_terms (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  term text not null,
  year smallint not null,
  sort_order smallint not null
);

create index if not exists idx_catalog_terms_sort on public.catalog_terms(sort_order);

alter table public.catalog_terms enable row level security;

create policy "Catalog terms readable"
  on public.catalog_terms for select
  using (true);

-- Seed 2026-2028 catalog terms
insert into public.catalog_terms (label, term, year, sort_order) values
  ('Fall 2026', 'Fall', 2026, 1),
  ('Winter 2027', 'Winter', 2027, 2),
  ('Spring 2027', 'Spring', 2027, 3),
  ('Summer 2027', 'Summer', 2027, 4),
  ('Fall 2027', 'Fall', 2027, 5),
  ('Winter 2028', 'Winter', 2028, 6),
  ('Spring 2028', 'Spring', 2028, 7),
  ('Summer 2028', 'Summer', 2028, 8)
on conflict (label) do nothing;
