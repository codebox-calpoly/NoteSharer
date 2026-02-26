-- Ensure department_submissions has justification column
alter table public.department_submissions
  add column if not exists justification text;
