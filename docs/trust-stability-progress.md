# MetaMystic Trust & Stability Upgrade

Updated: 2026-07-13

## Current state

- Branch: `codex/trust-stability-v2`
- Pull request: https://github.com/Sam18069272581/metamystic/pull/1
- Production: https://metamystic.vercel.app (does not include this branch until merge/deploy)
- Estimated trust/stability plan completion: 94%
- Estimated precision/free-AI plan completion: 95%
- Current local verification: 153 backend tests, 96 frontend tests, shared typecheck, full typecheck, production build, Prisma validation, repository config check, production dependency audit, and desktop/mobile form smoke passed.

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
- Consultation streaming now uses a database-level pending-to-streaming claim, so duplicate workers do not perform duplicate AI calls.
- Refresh tokens now carry a session family; rotated-token replay revokes the family and prevents reuse.
- Profile memory is append-only through `ProfileMemoryEvent`, then materialized back to `Profile.memorySignals` under a row lock.
- Unknown birth time is treated as an unreliable hour pillar: BaZi strength, ten-god distribution, shensha, and UI display exclude the hour pillar.
- Unsupported explicit four-pillar input is removed from the public BirthInputV2 contract until it can be represented as a non-instant chart type.
- Route-level bilingual shell added with `/zh` as the default route and `/en` as the English route.
- Home page, bottom navigation, daily-reading fallback, primary CTA, auth/page titles, and core localized route entries now use a typed Chinese/English dictionary.
- Root `/` redirects to `/zh`; `/zh/consult`, `/en/consult`, `/zh/charts/bazi`, `/en/charts/bazi`, `/zh/me`, and `/en/me` build successfully.
- Knowledge retrieval now selects lexical candidates in PostgreSQL before vector/semantic ranking instead of loading the first 80 rows.
- Curated knowledge is explicitly labeled as platform commentary with a reference work, never as primary classical text.
- Ziwei calculation now uses pinned `iztro@2.5.8`; charts are fingerprinted and stored with engine/input metadata.
- Seeded Western astrology output is disabled until a precise ephemeris and house-system decision is implemented.
- GitHub CI now provisions PostgreSQL 16 with pgvector and applies all Prisma migrations before tests/build.
- Public-beta AI access is formalized behind `AiAccessPolicyService`: anonymous users receive 5 daily requests, authenticated users 30, both are limited to 3 per minute and 1200 output tokens, and all usage is atomically recorded in PostgreSQL without charging.
- Consultation records now retain access mode, charged status, provider/model, token usage, latency, and stable rate-limit metadata so a future metered strategy can replace the policy without rewriting consultation execution.
- RAG V2 separates classical originals, modern curation, and platform explanations; only reviewed/published sources participate in retrieval and platform explanations cannot be presented as classical originals.
- Knowledge search now fuses tag/topic, PostgreSQL trigram lexical, and pgvector semantic candidates with weighted RRF and stores the retrieval trace used by each consultation.
- A 30-question retrieval evaluation passes the `Hit@3 >= 85%` and `MRR >= 0.75` quality gates.
- BaZi V3 keeps pinned `tyme4ts@1.5.1` for calendar facts and applies a separate explainable rules layer for season, roots, momentum, relations, pattern, and four useful-god methods.
- DST overlap now defaults to rejection and supports explicit earlier/later disambiguation; the late-Zi implementation no longer double-advances the date.
- `ChildLimit`/`DecadeFortune` now produces traceable decade and annual-fortune timelines; new charts are stored as `tyme4ts+bazi-rules` version `3.0.0` while old chart rows remain unchanged.
- Golden boundary fixtures and a deterministic 100-chart shadow comparison confirm V3 preserves four pillars, hidden stems, and ten gods while adding versioned evidence.
- AI prompts treat deterministic BaZi results as immutable and include the V3 rule version, confidence, strength evidence, and useful-god methods for explanation.

## Database migrations

Apply in order with `pnpm --filter @metamystic/backend prisma:deploy`:

1. `20260622173000_trust_stability_v2`
2. `20260622180000_birth_input_v2`
3. `20260622204500_profile_memory_events`
4. `20260713184500_public_beta_ai_access`
5. `20260713193000_knowledge_rag_v2`

The first migration normalizes duplicate defaults before creating `Profile_one_default_per_user`.
The third migration creates append-only profile memory events and backfills non-empty legacy profile memory snapshots.

## In progress

- Continue migrating deep form labels and generated content to locale-aware copy.
- Add automatic birth-place geocoding and a profile review marker for legacy records.
- Add a legacy Ziwei recalculation action and richer four-transformations/three-directions display.
- Apply the two July migrations to a fresh PostgreSQL/pgvector database and run the authenticated profile -> BaZi -> free AI Playwright flow.
- Compare V3 output against 100 reviewed real charts before merging the branch to production.
- Add locale-aware AI prompt/output handling for English generated content.

## Next execution point

1. Run `git status --short` in `D:\Codex\.worktrees\metamystic-trust-stability`.
2. Start Docker Desktop, apply all Prisma migrations, and run the authenticated BaZi/free-AI browser flow.
3. Push this branch and wait for GitHub CI's PostgreSQL migration job.
4. Review the 100-chart shadow sample, then merge/deploy and perform production smoke tests.

Docker Desktop was unavailable on 2026-07-13, so Prisma schema validation passed but local execution of the July migrations against a fresh PostgreSQL database remains unverified. GitHub CI is the next database-backed gate after push.

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
