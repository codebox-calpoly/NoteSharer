-- Add column to store text extracted from PDFs (typed layer or OCR) for search.
alter table public.resources
  add column if not exists extracted_text text;

-- Include extracted_text in full-text search so search can match note content.
drop index if exists public.idx_resources_fts;
create index idx_resources_fts on public.resources using gin (
  to_tsvector(
    'english',
    coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(extracted_text, '')
  )
);

comment on column public.resources.extracted_text is 'Text extracted from the PDF (typed layer or OCR) for full-text and keyword search.';
