-- Update upvote credit awarding to 3 credits per upvote with a 10-credit cap per resource.
-- Also update profiles.credit_score when credits are awarded.

-- Ensure credit_score exists (app uses it; may have been added out-of-band).
alter table public.profiles
add column if not exists credit_score integer default 0;

create or replace function public.fn_handle_vote_credits()
returns trigger
language plpgsql
as $$
declare
  v_owner uuid;
  v_awarded integer;
  v_remaining integer;
  v_grant integer;
begin
  if tg_op = 'INSERT' and new.value = 1 then
    select profile_id into v_owner from public.resources where id = new.resource_id;
    if v_owner is null then
      return new;
    end if;

    select coalesce(sum(amount), 0) into v_awarded
    from public.credits_ledger
    where resource_id = new.resource_id
      and source = 'upvote_bonus';

    v_remaining := 10 - v_awarded;
    if v_remaining > 0 then
      v_grant := least(3, v_remaining);
      insert into public.credits_ledger (profile_id, resource_id, source, amount, metadata)
      values (v_owner, new.resource_id, 'upvote_bonus', v_grant, jsonb_build_object('vote_id', new.id));

      update public.profiles
      set credit_score = coalesce(credit_score, 0) + v_grant
      where id = v_owner;
    end if;
  end if;

  /*if tg_op = 'DELETE' and old.value = 1 then
    insert into public.credits_ledger (profile_id, resource_id, source, amount, metadata)
    values (
      (select profile_id from public.resources where id = old.resource_id),
      old.resource_id,
      'upvote_bonus_reversal',
      -1,
      jsonb_build_object('vote_id', old.id)
    );
  end if;*/

  return new;
end;
$$;

-- Replace vote policies to require purchase/download before voting.
drop policy if exists "Users upsert own vote" on public.votes;
drop policy if exists "Users update own vote" on public.votes;

create policy "Users upsert own vote" on public.votes
for insert
with check (
  auth.uid() = profile_id
  and exists (
    select 1
    from public.resource_downloads d
    where d.resource_id = votes.resource_id
      and d.profile_id = auth.uid()
  )
);

create policy "Users update own vote" on public.votes
for update
using (
  auth.uid() = profile_id
  and exists (
    select 1
    from public.resource_downloads d
    where d.resource_id = votes.resource_id
      and d.profile_id = auth.uid()
  )
)
with check (
  auth.uid() = profile_id
  and exists (
    select 1
    from public.resource_downloads d
    where d.resource_id = votes.resource_id
      and d.profile_id = auth.uid()
  )
);
