-- Department request submissions (mirrors course_submissions pattern)
create table if not exists public.department_submissions (
  id bigserial primary key,
  submitter_id uuid references public.profiles on delete set null,
  department_code text not null,
  department_name text,
  justification text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewer_id uuid references public.profiles on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.department_submissions enable row level security;

create policy "Department submissions by owner or moderator" on public.department_submissions
for select using (
  auth.uid() = submitter_id
  or exists (
    select 1 from public.user_roles
    where user_roles.profile_id = auth.uid() and user_roles.role in ('admin','moderator','teacher','ta')
  )
);

create policy "Insert department submission" on public.department_submissions
for insert with check (auth.uid() = submitter_id);
