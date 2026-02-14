-- Speed up get_course_note_counts and notes list (filter by status = 'active')
create index if not exists idx_resources_course_status on public.resources (course_id, status)
  where status = 'active';
