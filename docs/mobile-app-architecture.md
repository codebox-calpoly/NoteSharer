# Mobile App Architecture Note

## Recommendation
- Do not build a separate mobile app in this pass.
- Finish responsive web support first.
- If a native app becomes necessary, use Expo / React Native and reuse the existing Supabase backend plus current API contracts.

## Why Expo / React Native
- Lowest-friction path for a student project that already has a web app and Supabase backend.
- Keeps mobile-specific work focused on presentation and platform capabilities instead of redoing auth or data services.
- Supports staged rollout without changing the current web deployment model.

## Scope if pursued later
- Phase 1 native flows:
  - Authentication
  - Browse courses
  - Course detail and note download
  - Upload
  - Profile / enrolled courses
- Reuse current APIs and Supabase project.
- Keep shared product rules aligned with `docs/ui-system.md`.
