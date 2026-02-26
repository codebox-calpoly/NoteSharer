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
  v_exists boolean;
begin
  if p_amount <= 0 then
    raise exception 'p_amount must be positive';
  end if;

  select profile_id into v_owner
  from public.resources
  where id = p_resource_id;

  if v_owner is null then
    raise exception 'Resource % not found', p_resource_id;
  end if;

  if v_owner <> p_profile_id then
    raise exception 'Resource owner mismatch for %', p_resource_id;
  end if;

  select exists (
    select 1
    from public.credits_ledger
    where resource_id = p_resource_id
      and source = 'upload_reward'
  ) into v_exists;

  if v_exists then
    return query select false;
    return;
  end if;

  insert into public.credits_ledger (profile_id, resource_id, source, amount, metadata)
  values (
    p_profile_id,
    p_resource_id,
    'upload_reward',
    p_amount,
    jsonb_build_object('reason', 'upload_reward')
  );

  update public.profiles
  set credit_score = coalesce(credit_score, 0) + p_amount
  where id = p_profile_id;

  return query select true;
end;
$$;
