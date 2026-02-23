-- Prevent duplicate upload rewards from historical race windows and repair balances.
with ranked_upload_rewards as (
  select
    id,
    profile_id,
    amount,
    row_number() over (partition by resource_id order by id asc) as rn
  from public.credits_ledger
  where source = 'upload_reward'
    and resource_id is not null
), removed_rewards as (
  delete from public.credits_ledger cl
  using ranked_upload_rewards r
  where cl.id = r.id
    and r.rn > 1
  returning cl.profile_id, cl.amount
), removed_totals as (
  select profile_id, coalesce(sum(amount), 0) as removed_amount
  from removed_rewards
  group by profile_id
)
update public.profiles p
set credit_score = greatest(coalesce(p.credit_score, 0) - removed_totals.removed_amount, 0)
from removed_totals
where p.id = removed_totals.profile_id;

-- Enforce one upload_reward per resource at the database level.
create unique index if not exists idx_credits_ledger_upload_reward_one_per_resource
  on public.credits_ledger (resource_id)
  where source = 'upload_reward' and resource_id is not null;

create or replace function public.rpc_grant_upload_reward(
  p_profile_id uuid,
  p_resource_id uuid,
  p_amount integer default 5
)
returns table (
  granted boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_status public.resource_status;
  v_inserted boolean := false;
begin
  if p_amount <= 0 then
    raise exception 'p_amount must be positive';
  end if;

  select profile_id, status into v_owner, v_status
  from public.resources
  where id = p_resource_id;

  if v_owner is null then
    raise exception 'Resource % not found', p_resource_id;
  end if;

  if v_owner <> p_profile_id then
    raise exception 'Resource owner mismatch for %', p_resource_id;
  end if;

  if v_status <> 'active' then
    raise exception 'Resource % is not active', p_resource_id;
  end if;

  begin
    insert into public.credits_ledger (profile_id, resource_id, source, amount, metadata)
    values (
      p_profile_id,
      p_resource_id,
      'upload_reward',
      p_amount,
      jsonb_build_object('reason', 'upload_reward')
    );
    v_inserted := true;
  exception
    when unique_violation then
      v_inserted := false;
  end;

  if v_inserted then
    update public.profiles
    set credit_score = coalesce(credit_score, 0) + p_amount
    where id = p_profile_id;
  end if;

  return query select v_inserted;
end;
$$;

create or replace function public.fn_award_upload_reward_on_activation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'active' then
    perform public.rpc_grant_upload_reward(new.profile_id, new.id, 5);
  elsif tg_op = 'UPDATE'
    and old.status is distinct from new.status
    and new.status = 'active' then
    perform public.rpc_grant_upload_reward(new.profile_id, new.id, 5);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_resources_award_upload_reward on public.resources;

create trigger trg_resources_award_upload_reward
after insert or update of status on public.resources
for each row execute function public.fn_award_upload_reward_on_activation();

-- Harden RPC execution. These should only be callable by server-side role.
revoke all on function public.rpc_grant_upload_reward(uuid, uuid, integer) from public;
revoke all on function public.rpc_grant_upload_reward(uuid, uuid, integer) from anon;
revoke all on function public.rpc_grant_upload_reward(uuid, uuid, integer) from authenticated;
grant execute on function public.rpc_grant_upload_reward(uuid, uuid, integer) to service_role;

revoke all on function public.rpc_award_upload_credits(uuid) from public;
revoke all on function public.rpc_award_upload_credits(uuid) from anon;
revoke all on function public.rpc_award_upload_credits(uuid) from authenticated;
grant execute on function public.rpc_award_upload_credits(uuid) to service_role;
