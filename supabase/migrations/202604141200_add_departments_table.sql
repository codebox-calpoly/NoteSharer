create table if not exists public.departments (
  code text primary key,
  name text not null,
  aliases text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_departments_touch_updated_at
before update on public.departments
for each row execute function public.fn_touch_updated_at();
