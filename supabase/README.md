# Supabase Setup

These steps link this codebase to the existing Supabase project at `https://prwaxvxppcbnoqwcvcjn.supabase.co`, apply the schema derived from the PRD/Tech Stack, and keep local migrations in sync.

## 1. Prerequisites
- Install the [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase` or `brew install supabase/tap/supabase`).
- Log into the CLI once so it can obtain an access token: `supabase login`.

## 2. Link the Local Repo to the Hosted Project

```bash
supabase link --project-ref prwaxvxppcbnoqwcvcjn
```

The CLI will ask for an access token (found in the Supabase dashboard). Linking lets you run migrations directly against the remote project.

## 3. Configure Environment Variables
1. Copy the example file and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```
2. Populate:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (provided anon public key)
   - Optional server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`)
3. Load the env file when running local scripts (Next.js automatically reads `.env.local`).

## 4. Apply the Schema from This Repo

```bash
supabase db push
```

This runs the SQL in `supabase/migrations` against the linked project. Review the SQL beforehand if you already have data—running migrations on a live database may require downtime or backfills.

## 5. Catalog Data (Courses & Terms)
After `supabase db push`, the `catalog_terms` table is seeded with the 2026–2028 catalog terms (Fall 2026 through Summer 2028). To populate the `courses` table with all Cal Poly catalog courses for those terms, run from the **frontend** directory:

```bash
cd frontend && npm run db:seed-catalog
```

This reads `app/dashboard/calpoly-catalog.ts` and upserts one row per (department, course_number, term, year). Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` so the script can connect.

## 6. Keeping the Schema in Sync
- When making DB changes locally, create a new migration file with `supabase migration new <name>` and edit the generated SQL.
- Use `supabase db lint` to catch obvious issues before pushing.
- If you edit the schema in the hosted project directly, run `supabase db pull` to update the local shadow schema and resolve drift.

## 7. Helpful Commands

| Command | Purpose |
| --- | --- |
| `supabase status` | Verify linked project + service health |
| `supabase db dump --schema public` | Export the current schema (good for backups) |
| `supabase functions deploy <name>` | Deploy Edge Functions (future work) |

## 8. Storage Buckets
Create these buckets in the Supabase dashboard (Storage → Buckets):
- `resources` — original PDFs (private, access via signed URLs)
- `previews` — blurred teaser PNGs

Set each bucket to **private** and let the API create signed URLs after credit/voucher checks.

## 9. Next Steps
- Wire these env vars into the Next.js frontend (`createClient` helpers for client/server).
- Implement server actions/API routes that call the provided SQL RPC helpers for credits, vouchers, and downloads.
- Add RLS policies once the Auth flows are ready (policies are noted inside the migration file but left `ALTER POLICY ... USING (...)` editable so you can fine-tune them per route).
