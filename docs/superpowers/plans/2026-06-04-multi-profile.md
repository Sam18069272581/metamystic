# Multi Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build authenticated multi-profile management while preserving existing default-profile chart and consultation flows.

**Architecture:** Evolve the Prisma profile relation from one-to-one to one-to-many, then expose focused authenticated endpoints through the existing user/profile modules. The frontend account page consumes the new API but old pages continue to use the default profile contract.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Next.js, React, TypeScript, Vitest/Jest.

---

### Task 1: Backend Contract Tests

**Files:**
- Modify: `apps/backend/src/profile/profile-auth.service.spec.ts`
- Modify: `apps/backend/src/user/user-chart.service.spec.ts`

- [ ] Write failing tests for multi-profile creation, default switching, default upsert compatibility, and chart archive default lookup.
- [ ] Run targeted backend tests and confirm failure because service methods/query shapes are missing.

### Task 2: Backend Implementation

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/20260604120000_multi_profiles/migration.sql`
- Modify: `packages/shared/src/contracts.ts`
- Modify: `apps/backend/src/user/upsert-user-profile.dto.ts`
- Modify: `apps/backend/src/profile/profile.service.ts`
- Modify: `apps/backend/src/user/user.controller.ts`
- Modify: `apps/backend/src/user/user-chart.service.ts`

- [ ] Add `label`, `isDefault`, and one-to-many profile relation to Prisma schema.
- [ ] Add migration SQL that drops `Profile_userId_key`, adds columns, and marks existing profiles as default.
- [ ] Add shared DTOs for profile list and create requests.
- [ ] Implement list/create/set-default profile service methods.
- [ ] Keep legacy upsert endpoint targeting the default profile.
- [ ] Update chart archive service to find the default profile with `findFirst`.
- [ ] Run targeted backend tests and confirm pass.

### Task 3: Frontend API And Page

**Files:**
- Modify: `apps/frontend/src/lib/api-client.ts`
- Modify: `apps/frontend/src/lib/api-client.spec.ts`
- Modify: `apps/frontend/src/app/me/page.tsx`

- [ ] Write failing API client tests for list/create/set-default profile endpoints.
- [ ] Implement API client methods.
- [ ] Add account-page profile list, default marker, default action, and compact create form.
- [ ] Run targeted frontend tests and confirm pass.

### Task 4: Verification

**Files:**
- No new files.

- [ ] Run `corepack pnpm --filter @metamystic/backend prisma:generate`.
- [ ] Run `corepack pnpm test`.
- [ ] Run `corepack pnpm lint`.
- [ ] Run `corepack pnpm typecheck`.
- [ ] Run `corepack pnpm build`.
