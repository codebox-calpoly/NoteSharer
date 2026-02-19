alter table public.profiles
  add column if not exists total_credits_earned bigint not null default 0
  check (total_credits_earned >= 0);

-- Backfill using current balance + historical credits spent on downloads.
-- This gives a practical lifetime-earned baseline for existing users.
update public.profiles p
set total_credits_earned =
  greatest(coalesce(p.credit_score, 0), 0)::bigint
  + coalesce(
    (
      select sum(greatest(rd.credits_spent, 0))::bigint
      from public.resource_downloads rd
      where rd.profile_id = p.id
    ),
    0
  );

create or replace function public.fn_track_total_credits_earned()
returns trigger
language plpgsql
as $$
declare
  v_old_score integer;
  v_new_score integer;
  v_delta integer;
begin
  if tg_op = 'INSERT' then
    new.total_credits_earned := greatest(
      coalesce(new.total_credits_earned, 0),
      greatest(coalesce(new.credit_score, 0), 0)::bigint
    );
    return new;
  end if;

  v_old_score := coalesce(old.credit_score, 0);
  v_new_score := coalesce(new.credit_score, 0);
  v_delta := greatest(v_new_score - v_old_score, 0);

  new.total_credits_earned := coalesce(old.total_credits_earned, 0) + v_delta;
  return new;
end;
$$;

drop trigger if exists trg_profiles_track_total_credits_earned on public.profiles;

create trigger trg_profiles_track_total_credits_earned
before insert or update of credit_score on public.profiles
for each row execute function public.fn_track_total_credits_earned();
