# Production Smoke Tests

Run the production smoke test after deployments or before handing a build to a tester:

```powershell
corepack pnpm smoke:prod
```

The script verifies:

- frontend app shell responds
- backend health endpoint responds
- anonymous profile can create a Bazi chart
- email registration, JWT auth, user profile, user Bazi chart, and daily fortune work
- AI consultation SSE stream completes and persists history

The smoke test writes a few `smoke-*` records to the target database. To test another environment:

```powershell
$env:SMOKE_FRONTEND_URL="https://your-preview.vercel.app"
$env:SMOKE_API_BASE_URL="https://your-api.example.com/api/v1"
corepack pnpm smoke:prod
```

To avoid an AI provider call while checking basic deployment health:

```powershell
$env:SMOKE_SKIP_AI="1"
corepack pnpm smoke:prod
```
