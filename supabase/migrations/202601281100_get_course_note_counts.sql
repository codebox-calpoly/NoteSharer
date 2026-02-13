-- RPC to get active resource counts per course (avoids 1000-row limit when counting in API)
create or replace function public.get_course_note_counts(p_course_ids uuid[])
returns table(course_id uuid, note_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.course_id, count(*)::bigint
  from public.resources r
  where r.status = 'active' and r.course_id = any(p_course_ids)
  group by r.course_id;
$$;

comment on function public.get_course_note_counts(uuid[]) is 'Returns (course_id, note_count) for active resources; used by /api/classes for browse card counts.';

grant execute on function public.get_course_note_counts(uuid[]) to anon;
grant execute on function public.get_course_note_counts(uuid[]) to authenticated;
grant execute on function public.get_course_note_counts(uuid[]) to service_role;
