# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` — Next.js 16 app (App Router). Key files: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`. Shared configs: `eslint.config.mjs`, `tsconfig.json`, `next.config.ts`.
- `supabase/` — database migrations and CLI setup (see `supabase/README.md`); apply schema via Supabase CLI.
- `docs/` — contributor and process docs. Root files (`PRD.md`, `Note_Sharer_Tech_Stack.md`, `project-charter.md`) capture product intent.
- Keep new UI/features in `frontend/app/<feature>`; colocate helpers with components. Place future tests beside modules or under `frontend/__tests__`.

## Build, Test, and Development Commands
- Install deps: `cd frontend && npm install`.
- Local dev: `npm run dev` (Next.js with fast refresh). Uses `.env.local` for env vars.
- Build: `npm run build` (ensures production readiness) then `npm run start` to smoke-test the build.
- Lint: `npm run lint` (Next + ESLint rules).
- Supabase: `cd supabase && supabase link --project-ref prwaxvxppcbnoqwcvcjn` then `supabase db push` to apply migrations.

## Coding Style & Naming Conventions
- TypeScript, React 19, Next App Router. Prefer server components unless client features are required.
- Functional components only; PascalCase for components/hooks, camelCase for helpers, kebab-case for files and routes.
- Keep styling in dedicated files (route-scoped CSS like `app/auth/auth.css` or shared globals); use class names instead of inline utility chains for new UI.
- 2-space indentation; keep imports ordered (framework → libraries → project paths). Run `npm run lint` before PRs.

## Testing Guidelines
- No automated suite yet. For new work, add component/route tests (e.g., Jest/Testing Library or Playwright) under `frontend/__tests__` or alongside components.
- Name tests after the unit or page they cover (`<component>.test.tsx`). Ensure critical flows (auth, uploads, credit transfers) gain coverage as they land.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat: add upload form`, `fix: handle expired token`). Keep commits scoped and readable.
- Branch from `main`; keep changes small and focused. Reference issue IDs in commit bodies when applicable.
- PRs: fill out the template, link related issues, and add before/after notes or screenshots for UI changes. Mention any migrations or env var changes explicitly.

## Supabase & Configuration Tips
- Copy `.env.local` (not committed) and set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`; add server-only keys (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`) if needed for server actions.
- Protect secrets: never commit generated `.env*` files. Rotate keys if leaked.
- Before pushing schema changes, run `supabase db lint`; for drift, use `supabase db pull`. Document new migrations in PRs.
