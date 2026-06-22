# MetaMystic Trust & Stability Upgrade

Updated: 2026-06-22

## Current state

- Branch: `codex/trust-stability-v2`
- Pull request: https://github.com/Sam18069272581/metamystic/pull/1
- Production: https://metamystic.vercel.app (does not include this branch until merge/deploy)
- Estimated plan completion: 85%
- Current local verification: 213 tests, typecheck, production build, Prisma validation, and production dependency audit passed.

## Completed

- Single-flight access-token refresh and stable unauthenticated errors.
- Google OAuth state validation, verified-email account linking, and refresh-token revocation on logout.
- Sanitized HTTP 500 responses with request IDs and server-side logging.
- Same-origin production cookie policy and production-safe Google auth URL construction.
- Tyme4ts chart calculation now uses the declared birth timezone rather than UTC date fields.
- Normalized five-element compatibility threshold fixed.
- Default-profile replacement is transactional and protected by a partial unique index.
- Chart engine/version/input snapshot fields, consultation idempotency/run metadata fields, and knowledge provenance fields added.
- Vulnerable transitive `form-data`, `multer`, and `postcss` versions overridden; `pnpm audit --prod` returned no known vulnerabilities.
- BirthInputV2 contract and backend resolver implemented for solar/lunar local date-time, IANA timezone conversion, DST gap rejection, true-solar correction metadata, and late-Zi rollover.
- Main profile creation, BaZi, consultation, Ziwei, and astrology entry points no longer convert local birth clocks with browser `toISOString()`.
- BaZi UI now supports solar/lunar input, leap month, exact/unknown time, IANA timezone, editable coordinates, true solar time, and late-Zi rollover.
- Consultation creation uses user-scoped idempotency keys; concurrent SSE subscribers share one model execution and record run timestamps/errors.
- Knowledge retrieval now selects lexical candidates in PostgreSQL before vector/semantic ranking instead of loading the first 80 rows.
- Curated knowledge is explicitly labeled as platform commentary with a reference work, never as primary classical text.
- Ziwei calculation now uses pinned `iztro@2.5.8`; charts are fingerprinted and stored with engine/input metadata.
- Seeded Western astrology output is disabled until a precise ephemeris and house-system decision is implemented.
- GitHub CI now provisions PostgreSQL 16 with pgvector and applies all Prisma migrations before tests/build.

## Database migrations

Apply in order with `pnpm --filter @metamystic/backend prisma:deploy`:

1. `20260622173000_trust_stability_v2`
2. `20260622180000_birth_input_v2`

The first migration normalizes duplicate defaults before creating `Profile_one_default_per_user`.

## In progress

- Add automatic birth-place geocoding and a profile review marker for legacy records.
- Add golden fixtures for Shanghai/Berlin, solar-term boundaries, DST overlap, true-solar day crossing, and late-Zi month/year boundaries.
- Add a legacy Ziwei recalculation action and richer four-transformations/three-directions display.
- Add an exact PostgreSQL migration test once Docker Desktop or CI Postgres is available.
- Merge vector and lexical ranks rather than preferring vector results when available.
- Add PostgreSQL integration tests and Playwright browser flows.

## Next execution point

1. Run `git status --short` in `D:\Codex\.worktrees\metamystic-trust-stability`.
2. Run focused BirthInputV2 tests and `pnpm typecheck`.
3. Add legacy `needsBirthReview` behavior and the Ziwei recalculation action.
4. Add PostgreSQL integration and Playwright browser coverage, then perform deployment smoke tests.

Docker Desktop was unavailable on 2026-06-22, so Prisma schema validation passed but migration execution against a fresh PostgreSQL database remains unverified.

## Verification commands

```powershell
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/metamystic?schema=public'
corepack pnpm --filter @metamystic/backend exec prisma validate
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
corepack pnpm audit --prod
```

Do not commit `.env`, OAuth secrets, provider API keys, generated logs, or local database data.
