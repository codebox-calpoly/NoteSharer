# Storage and Signed URLs

Note Sharer uses Supabase Storage with signed URLs for private file access.

## Buckets
- `resources`: PDFs and current preview images (fallback).
- `previews`: preview images when stored separately from PDFs.

## Signed URLs
- Generated server-side only via `frontend/lib/storage.ts`.
- Default TTL is 3600 seconds (1 hour) for previews.
- Download URLs use a 120 second TTL.
- Preview URLs in `frontend/app/api/notes/route.ts` return `null` if a signed URL
  cannot be generated (expired or missing files).

## Usage Notes
- Prefer `generateSignedUrl(bucket, filePath)` for any private file access.
- Download endpoints should reuse the same helper to keep TTL and error handling consistent.
