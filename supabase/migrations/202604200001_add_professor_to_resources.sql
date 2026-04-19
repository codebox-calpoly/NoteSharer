-- Add professor field to resources table
alter table public.resources
  add column if not exists professor text;

-- Index for filtering by professor
create index if not exists idx_resources_professor on public.resources(professor);
