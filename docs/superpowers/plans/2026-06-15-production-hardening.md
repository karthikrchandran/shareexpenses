# Production Hardening Notes

Date: 2026-06-15

## Implemented Now

- Mutating API routes use an in-process rate limiter.
- Sensitive write paths create `audit_events` rows:
  - expense created, updated, deleted
  - member manually added
  - member joined through link
  - settlement recorded
  - closeout generated
- Activity feed shows recent audit events inside the selected Expense Set.
- Next.js sends baseline security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Repeatable Supabase migrations now live under `supabase/migrations`.

## Rate Limit Configuration

Defaults:

```text
API_RATE_LIMIT_REQUESTS=120
API_RATE_LIMIT_WINDOW_MS=60000
```

This is enough for the private trip pilot. For multi-instance Vercel production, replace the in-memory limiter with Upstash Redis, Vercel KV, or Supabase-backed rate state because each serverless instance has its own memory.

## Deployment Checklist

- Run Supabase migrations in order:
  - `supabase/migrations/202606150001_expense_sets_core.sql`
  - `supabase/migrations/202606150002_closeouts_and_audit.sql`
- Set production environment variables in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
  - optional `OPENAI_API_KEY`
  - optional `OPENAI_CLOSEOUT_MODEL`
  - optional `API_RATE_LIMIT_REQUESTS`
  - optional `API_RATE_LIMIT_WINDOW_MS`
- Enable Supabase point-in-time recovery or scheduled backups before inviting real users.
- Keep service role key server-only. Never expose it as `NEXT_PUBLIC_*`.
- Add hosted error tracking before public launch. Sentry is the smallest next step.

## Remaining Hardening Before Public Production

- Validate Supabase sessions server-side on API routes instead of relying on caller-supplied user IDs in request bodies or query strings.
- Replace in-memory rate limiting with shared durable rate limiting.
- Add structured server logs for failed authorization attempts and API 500s.
- Add request body size limits at the hosting edge if exposed publicly.
- Add automated migration execution to deployment workflow.
- Add a rollback runbook for failed migrations.
- Add a backup restore drill against a staging Supabase project.
