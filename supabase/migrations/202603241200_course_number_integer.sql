-- Store catalog course numbers as integers.
-- Legacy rows may contain values like 'CSC 101' or '3384A', so extract the first
-- numeric run anywhere in the string. Any course_submission row without digits is
-- invalid under the current API contract and is removed before the type change.

delete from public.course_submissions
where course_number is null
   or substring(trim(course_number) from '([0-9]+)') is null;

with ranked_courses as (
  select
    id,
    row_number() over (
      partition by
        department,
        substring(trim(course_number) from '([0-9]+)'),
        term,
        year
      order by
        case
          when trim(course_number) ~ '^[0-9]+$' then 0
          else 1
        end,
        created_at asc,
        id asc
    ) as row_rank
  from public.courses
  where substring(trim(course_number) from '([0-9]+)') is not null
)
delete from public.courses c
using ranked_courses rc
where c.id = rc.id
  and rc.row_rank > 1;

alter table public.course_submissions
  alter column course_number type integer using (
    substring(trim(course_number) from '([0-9]+)')::integer
  );

alter table public.courses
  alter column course_number type integer using (
    substring(trim(course_number) from '([0-9]+)')::integer
  );
