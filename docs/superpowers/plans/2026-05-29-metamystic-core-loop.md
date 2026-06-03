# MetaMystic Core Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable monorepo MVP for profile capture, Bazi chart generation, AI consultation streaming, and history.

**Architecture:** Use a small monorepo with `apps/frontend`, `apps/backend`, and `packages/shared`. Backend modules own business logic and persistence; frontend owns mobile-first UI and typed API clients; shared owns DTOs and contracts.

**Tech Stack:** Next.js 15, React, Tailwind, Zustand, NestJS, Prisma, PostgreSQL, TypeScript, OpenAI SDK-compatible provider boundary.

---

## File Structure

- Create `package.json`: root scripts for installing, developing, building, linting, and typechecking workspaces.
- Create `pnpm-workspace.yaml`: workspace package mapping.
- Create `tsconfig.base.json`: shared strict TypeScript baseline.
- Create `.env.example`: required frontend, backend, database, and AI env vars.
- Create `packages/shared/src/index.ts`: shared public exports.
- Create `packages/shared/src/contracts.ts`: DTOs, response envelopes, Bazi, consultation, and SSE event contracts.
- Create `apps/backend`: NestJS application with modules for profile, Bazi, consultation, safety, and Prisma.
- Create `apps/backend/prisma/schema.prisma`: database schema.
- Create `apps/frontend`: Next.js app with home, consult, and Bazi chart views.

## Task 1: Workspace Foundation

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create root workspace files**

```json
{
  "name": "metamystic",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "pnpm --parallel --filter @metamystic/backend --filter @metamystic/frontend dev",
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test"
  },
  "devDependencies": {
    "typescript": "^5.7.2"
  }
}
```

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 2: Add environment template**

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/metamystic?schema=public"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4.1-mini"
BACKEND_PORT="4000"
FRONTEND_PUBLIC_API_BASE_URL="http://localhost:4000/api/v1"
```

- [ ] **Step 3: Verify workspace shape**

Run: `pnpm -v`
Expected: prints pnpm version. If pnpm is missing, use `corepack enable` then retry.

## Task 2: Shared Contracts

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/contracts.ts`

- [ ] **Step 1: Add shared package metadata**

```json
{
  "name": "@metamystic/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit",
    "test": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 2: Define contracts**

```ts
export type Gender = "female" | "male" | "non_binary" | "unknown";
export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export type AiSectionType = "verdict" | "logic" | "advice" | "disclaimer";

export interface ApiSuccess<T> {
  status: "success";
  data: T;
}

export interface ApiFailure {
  status: "error";
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface UpsertProfileRequest {
  anonymousUserId: string;
  displayName?: string;
  birthTime: string;
  birthTimezone: string;
  gender: Gender;
  birthPlace?: string;
  latitude?: number;
  longitude?: number;
}

export interface ProfileDto extends UpsertProfileRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface BaziPillarDto {
  stem: string;
  branch: string;
  tenGod: string;
  hiddenStems: string[];
  nayin: string;
}

export interface BaziChartDto {
  id: string;
  profileId: string;
  dayMaster: string;
  dayMasterStatus: "strong" | "balanced" | "weak";
  mainPattern: string;
  pillars: {
    year: BaziPillarDto;
    month: BaziPillarDto;
    day: BaziPillarDto;
    hour: BaziPillarDto;
  };
  elements: Record<FiveElement, number>;
  createdAt: string;
}

export interface CreateBaziChartRequest {
  profileId: string;
}

export interface CreateConsultationRequest {
  profileId: string;
  chartId: string;
  question: string;
  tone: "strategic" | "gentle";
}

export interface ConsultationDto {
  id: string;
  profileId: string;
  chartId: string;
  question: string;
  tone: "strategic" | "gentle";
  status: "pending" | "streaming" | "completed" | "failed";
  summary?: string;
  createdAt: string;
}

export interface ConsultationChunkEvent {
  type: "chunk";
  consultationId: string;
  section: AiSectionType;
  content: string;
}

export interface ConsultationDoneEvent {
  type: "done";
  consultationId: string;
}

export interface ConsultationErrorEvent {
  type: "error";
  consultationId: string;
  message: string;
}

export type ConsultationStreamEvent =
  | ConsultationChunkEvent
  | ConsultationDoneEvent
  | ConsultationErrorEvent;
```

- [ ] **Step 3: Export contracts**

```ts
export * from "./contracts";
```

- [ ] **Step 4: Run shared typecheck**

Run: `pnpm --filter @metamystic/shared typecheck`
Expected: TypeScript completes without errors.

## Task 3: Backend Foundation and Prisma

**Files:**
- Create backend package and source files under `apps/backend`
- Create: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/src/main.ts`
- Create: `apps/backend/src/app.module.ts`
- Create: `apps/backend/src/prisma/prisma.module.ts`
- Create: `apps/backend/src/prisma/prisma.service.ts`

- [ ] **Step 1: Create backend package**

Use NestJS dependencies, Prisma, validation, config, RxJS, and shared contracts.

- [ ] **Step 2: Add Prisma schema**

Models: `User`, `Profile`, `BaziChart`, `Consultation`, `ConsultationMessage`, `KnowledgeSource`, `KnowledgeChunk`. Use `Json` for chart snapshots and future metadata, `Vector` support can be added in the migration SQL for phase two.

- [ ] **Step 3: Add NestJS bootstrap**

Bootstrap `ValidationPipe`, CORS for local frontend, and global prefix `api/v1`.

- [ ] **Step 4: Run Prisma validation**

Run: `pnpm --filter @metamystic/backend prisma validate`
Expected: Prisma schema is valid.

## Task 4: Backend Profile and Bazi Modules

**Files:**
- Create: `apps/backend/src/profile/profile.module.ts`
- Create: `apps/backend/src/profile/profile.controller.ts`
- Create: `apps/backend/src/profile/profile.service.ts`
- Create: `apps/backend/src/bazi/bazi.module.ts`
- Create: `apps/backend/src/bazi/bazi.controller.ts`
- Create: `apps/backend/src/bazi/bazi.service.ts`
- Create: `apps/backend/src/bazi/bazi-engine.ts`

- [ ] **Step 1: Implement profile upsert**

Expose `POST /api/v1/profiles` with validation. Upsert user by `anonymousUserId`, then upsert profile fields.

- [ ] **Step 2: Implement replaceable Bazi engine**

Create `BaziEngine` interface and `MvpBaziEngine`. The MVP engine must be deterministic for the same birth time and profile. Mark its output as MVP-calculation in `metadata` so it cannot be mistaken for a certified professional engine.

- [ ] **Step 3: Implement Bazi chart creation**

Expose `POST /api/v1/charts/bazi`. Load profile, calculate chart, save snapshot, return `BaziChartDto`.

- [ ] **Step 4: Add module tests**

Test profile upsert, missing profile chart creation, and deterministic chart output.

## Task 5: Backend Consultation and Safety Modules

**Files:**
- Create: `apps/backend/src/safety/safety.module.ts`
- Create: `apps/backend/src/safety/safety.service.ts`
- Create: `apps/backend/src/consultation/consultation.module.ts`
- Create: `apps/backend/src/consultation/consultation.controller.ts`
- Create: `apps/backend/src/consultation/consultation.service.ts`
- Create: `apps/backend/src/consultation/ai-provider.ts`

- [ ] **Step 1: Implement safety checks**

Flag medical, death, gambling, and guaranteed prediction patterns. Return a soft disclaimer for normal questions and a blocking reason for unsafe questions.

- [ ] **Step 2: Implement AI provider boundary**

Create `AiProvider` interface with `streamConsultation(input)` returning async chunks. Implement `MockAiProvider` first and keep OpenAI provider behind env-gated construction.

- [ ] **Step 3: Implement consultation REST creation**

Expose `POST /api/v1/consultations`, validate profile and chart, run safety, create pending consultation.

- [ ] **Step 4: Implement SSE stream**

Expose `GET /api/v1/consultations/:id/stream`. Emit typed events, persist assistant message, update consultation status.

- [ ] **Step 5: Add tests**

Test safety block, consultation creation, and stream event formatting.

## Task 6: Frontend Foundation

**Files:**
- Create frontend package and Next.js source files under `apps/frontend`
- Create: `apps/frontend/src/app/layout.tsx`
- Create: `apps/frontend/src/app/page.tsx`
- Create: `apps/frontend/src/app/globals.css`
- Create: `apps/frontend/src/lib/api-client.ts`
- Create: `apps/frontend/src/store/app-store.ts`

- [ ] **Step 1: Create Next.js app metadata and Tailwind setup**

Use dark theme tokens with restrained purple and gold. Avoid one-note palette by adding ink, muted blue-black, warm gold, jade/wood, and soft rose accents.

- [ ] **Step 2: Implement typed API client**

Wrap `fetch`, parse `ApiResponse<T>`, handle network and server errors, and expose `upsertProfile`, `createBaziChart`, `createConsultation`, and `streamConsultation`.

- [ ] **Step 3: Implement Zustand store**

Store profile, current chart, current consultation, stream sections, loading state, and error state.

## Task 7: Frontend Core UI

**Files:**
- Create: `apps/frontend/src/components/shell/mobile-shell.tsx`
- Create: `apps/frontend/src/components/home/home-dashboard.tsx`
- Create: `apps/frontend/src/components/bazi/bazi-chart-card.tsx`
- Create: `apps/frontend/src/components/consultation/consultation-form.tsx`
- Create: `apps/frontend/src/components/consultation/consultation-stream.tsx`
- Create: `apps/frontend/src/app/consult/page.tsx`
- Create: `apps/frontend/src/app/charts/bazi/[id]/page.tsx`

- [ ] **Step 1: Build mobile shell**

Implement top status area, content container, and bottom navigation matching the reference direction without copying the mockup literally.

- [ ] **Step 2: Build home dashboard**

Show today fortune, AI consultation entry, Bazi chart entry, Tarot and Chalice disabled/coming-soon entries, and recent consultation placeholders.

- [ ] **Step 3: Build consultation form and stream**

Collect profile fields and question. Submit profile, create chart, create consultation, then stream sections into cards.

- [ ] **Step 4: Build Bazi chart card**

Render pillars, day master, pattern, element distribution, and beginner/pro switch.

## Task 8: Verification

**Files:**
- Modify package scripts if needed.

- [ ] **Step 1: Install dependencies**

Run: `pnpm install`
Expected: install completes and creates lockfile.

- [ ] **Step 2: Validate backend**

Run: `pnpm --filter @metamystic/backend typecheck`
Expected: no TypeScript errors.

- [ ] **Step 3: Validate frontend**

Run: `pnpm --filter @metamystic/frontend typecheck`
Expected: no TypeScript errors.

- [ ] **Step 4: Run development servers**

Run: `pnpm dev`
Expected: backend serves `http://localhost:4000/api/v1`, frontend serves `http://localhost:3000`.

- [ ] **Step 5: Browser verification**

Open frontend, submit a consultation, confirm Bazi chart renders and AI answer streams into structured cards.

## Self-Review

Spec coverage: the plan covers monorepo setup, shared contracts, backend profile, Bazi, consultation, safety, frontend state, UI, and verification. Deferred modules are intentionally excluded and represented by extension boundaries.

Placeholder scan: no `TBD` or unresolved placeholder sections remain. Tasks that mention dependency creation are allowed because exact package versions may resolve through `pnpm`.

Type consistency: shared contract names are used consistently across backend and frontend tasks.

