-- Ensure department_submissions has department_name (schema cache may be out of sync)
alter table public.department_submissions
  add column if not exists department_name text;

-- Backfill from department_code if that column exists and department_name is null
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'department_submissions'
      and column_name = 'department_code'
  ) then
    update public.department_submissions
    set department_name = coalesce(department_name, department_code, '')
    where department_name is null;
  end if;
end $$;

-- Make department_name not null (use '' for any remaining nulls)
update public.department_submissions set department_name = '' where department_name is null;
alter table public.department_submissions
  alter column department_name set not null;
