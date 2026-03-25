-- Store catalog course numbers as integers. Migration keeps leading digits only
-- (e.g. '3384A' -> 3384) so existing text rows still cast cleanly.

alter table public.course_submissions
  alter column course_number type integer using (
    substring(trim(course_number) from '^[0-9]+')::integer
  );

alter table public.courses
  alter column course_number type integer using (
    substring(trim(course_number) from '^[0-9]+')::integer
  );
