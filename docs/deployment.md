# MetaMystic Deployment

This project is deployed as two services:

- Frontend: Vercel, serving the Next.js app in `apps/frontend`.
- Backend: Railway, serving the NestJS API in `apps/backend`.
- Database: managed PostgreSQL with pgvector enabled.

## Frontend on Vercel

Use the repository root as the Vercel project root. The root `vercel.json` builds only the frontend workspace with `corepack pnpm --filter @metamystic/frontend build`.

The monorepo root only owns workspace orchestration and shared dev tooling. Next.js runtime dependencies (`next`, `react`, `react-dom`) belong to `apps/frontend/package.json`, so backend-oriented installs and Railway builds do not pull frontend dependencies from the root importer.

Required frontend environment variables:

```ini
NEXT_PUBLIC_API_BASE_URL="https://<backend-domain>/api/v1"
NEXT_PUBLIC_APP_URL="https://<frontend-domain>"
```

After the backend has a public URL, update these values in Vercel and redeploy the frontend. `NEXT_PUBLIC_APP_URL` should match the public frontend origin exactly so metadata and share links resolve to the correct domain.

## Backend on Railway

Use the repository root as the Railway project root. The root `railway.toml` builds and starts only the backend workspace.

This repository is a shared pnpm workspace, so Railway builds from the repository root and uses backend-specific commands instead of setting the service root to `apps/backend`. Watch patterns are configured in `railway.toml` to avoid backend deploys for unrelated frontend-only changes.

Required backend environment variables:

```ini
DATABASE_URL="postgresql://..."
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4.1-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
OPENAI_EMBEDDING_DIMENSIONS="1536"
JWT_ACCESS_SECRET="<long-random-secret>"
JWT_REFRESH_SECRET="<different-long-random-secret>"
GOOGLE_CLIENT_ID="<google-client-id>"
GOOGLE_CLIENT_SECRET="<google-client-secret>"
GOOGLE_CALLBACK_URL="https://<backend-domain>/api/v1/auth/google/callback"
FRONTEND_APP_URL="https://<frontend-domain>"
CORS_ORIGINS="https://<frontend-domain>"
```

Keep `FRONTEND_APP_URL` and `CORS_ORIGINS` entries as plain origins when possible. The backend now normalizes accidental path suffixes, but clean origin-only values are still preferred for deployment review and debugging.

For DeepSeek-compatible chat generation, keep the embedding variables above and switch the consultation provider:

```ini
AI_PROVIDER="deepseek"
DEEPSEEK_API_KEY="<deepseek-compatible-api-key>"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-chat"
```

The backend still accepts `AI_PROVIDER="hermes"` as a backward-compatible alias for older deployments, but new environments should use `deepseek`.

Railway injects `PORT`; the backend also supports `BACKEND_PORT` for local development.

## Database

The production database must support pgvector. Enable the extension before running embedding backfills:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Run Prisma migrations during deployment setup:

```powershell
corepack pnpm --filter @metamystic/backend prisma:migrate
```

For production, prefer `prisma migrate deploy` in CI or a one-off Railway job once the database is provisioned.

## Smoke Checks

Backend health check:

```text
GET https://<backend-domain>/api/v1/health
```

Expected response:

```json
{
  "status": "success",
  "data": {
    "service": "metamystic-backend",
    "ok": true
  }
}
```

Frontend smoke flow:

1. Open the Vercel frontend URL.
2. Sign in or create a profile.
3. Create a Bazi chart.
4. Start an AI consultation.
5. Confirm SSE stream events render in the consultation page.
