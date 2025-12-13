-- Add onboarding_complete tracking to profiles and default it to false
alter table public.profiles
add column if not exists onboarding_complete boolean;

alter table public.profiles
alter column onboarding_complete set default false;

update public.profiles
set onboarding_complete = false
where onboarding_complete is null;

alter table public.profiles
alter column onboarding_complete set not null;
