-- Ensure resource_vote_stats includes all resources (even with zero votes)
create or replace view public.resource_vote_stats as
select
  r.id as resource_id,
  coalesce(sum(case when v.value = 1 then 1 end), 0) as upvotes,
  coalesce(sum(case when v.value = -1 then 1 end), 0) as downvotes,
  coalesce(sum(v.value), 0) as score
from public.resources r
left join public.votes v on v.resource_id = r.id
group by r.id;
