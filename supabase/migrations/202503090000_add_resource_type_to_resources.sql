alter table public.resources
  add column if not exists resource_type text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'check_resource_type'
  ) then
    alter table public.resources
      add constraint check_resource_type
      check (resource_type in ('lecture_notes', 'study_guide', 'class_overview', 'link'));
  end if;
end $$;
