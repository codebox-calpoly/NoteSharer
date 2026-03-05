create index if not exists idx_courses_title_trgm
  on public.courses using gin (title gin_trgm_ops);
