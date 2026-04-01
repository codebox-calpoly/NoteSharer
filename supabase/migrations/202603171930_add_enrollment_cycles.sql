create table if not exists public.enrollment_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  catalog_term text,
  is_active boolean not null default false,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_course_enrollments (
  profile_id uuid not null references public.profiles on delete cascade,
  course_id uuid not null references public.courses on delete cascade,
  cycle_id uuid not null references public.enrollment_cycles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, course_id, cycle_id)
);

create index if not exists idx_profile_course_enrollments_profile_cycle
  on public.profile_course_enrollments(profile_id, cycle_id);

create index if not exists idx_profile_course_enrollments_cycle
  on public.profile_course_enrollments(cycle_id);

alter table public.profiles
  add column if not exists last_completed_enrollment_cycle_id uuid
  references public.enrollment_cycles on delete set null;

create trigger trg_enrollment_cycles_touch_updated_at
before update on public.enrollment_cycles
for each row execute function public.fn_touch_updated_at();

alter table public.enrollment_cycles enable row level security;
alter table public.profile_course_enrollments enable row level security;

create policy "Enrollment cycles readable"
  on public.enrollment_cycles for select
  using (auth.role() = 'authenticated');

create policy "Profile enrollments readable by owner"
  on public.profile_course_enrollments for select
  using (auth.uid() = profile_id);

create policy "Profile enrollments writable by owner"
  on public.profile_course_enrollments for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

insert into public.enrollment_cycles (name, catalog_term, is_active)
select 'Current enrollment', null, true
where not exists (
  select 1
  from public.enrollment_cycles
  where is_active = true
);
