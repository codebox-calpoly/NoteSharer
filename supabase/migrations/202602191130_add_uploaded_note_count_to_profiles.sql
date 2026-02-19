alter table public.profiles
  add column if not exists uploaded_note_count integer not null default 0
  check (uploaded_note_count >= 0);

-- Backfill from existing resources so the counter starts accurate.
update public.profiles p
set uploaded_note_count = c.upload_count
from (
  select p0.id as profile_id, count(r.id)::integer as upload_count
  from public.profiles p0
  left join public.resources r on r.profile_id = p0.id
  group by p0.id
) as c
where p.id = c.profile_id;

create or replace function public.fn_sync_uploaded_note_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
    set uploaded_note_count = uploaded_note_count + 1
    where id = new.profile_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.profiles
    set uploaded_note_count = greatest(uploaded_note_count - 1, 0)
    where id = old.profile_id;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if new.profile_id is distinct from old.profile_id then
      update public.profiles
      set uploaded_note_count = greatest(uploaded_note_count - 1, 0)
      where id = old.profile_id;

      update public.profiles
      set uploaded_note_count = uploaded_note_count + 1
      where id = new.profile_id;
    end if;
    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_resources_sync_uploaded_note_count on public.resources;

create trigger trg_resources_sync_uploaded_note_count
after insert or update of profile_id or delete on public.resources
for each row execute function public.fn_sync_uploaded_note_count();
