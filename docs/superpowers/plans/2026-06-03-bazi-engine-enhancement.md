# Bazi Engine Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured professional Bazi analysis for strength details, ten-god distribution, useful-god details, and risk flags without breaking existing chart APIs.

**Architecture:** Extend the existing `BaziChartDto.analysis` object with optional professional fields, then compute those fields inside `professional-bazi.ts`. Keep persistence unchanged because chart metadata already stores analysis JSON.

**Tech Stack:** TypeScript, NestJS backend, Vitest, shared workspace DTOs.

---

### Task 1: Professional Analysis Types

**Files:**
- Modify: `packages/shared/src/contracts.ts`
- Test: `apps/backend/src/bazi/professional-bazi.spec.ts`

- [ ] Add optional fields to `BaziChartDto.analysis`: `strength`, `tenGodDistribution`, `usefulGodDetails`, `unfavorableGodDetails`, `pattern`, and `riskFlags`.
- [ ] Keep all existing analysis fields unchanged for frontend compatibility.
- [ ] Run `corepack pnpm --filter @metamystic/backend test -- src/bazi/professional-bazi.spec.ts` and expect the new assertions to fail before implementation.

### Task 2: Professional Bazi Computation

**Files:**
- Modify: `apps/backend/src/bazi/professional-bazi.ts`
- Test: `apps/backend/src/bazi/professional-bazi.spec.ts`

- [ ] Compute ten-god weights from pillar stems and hidden stems.
- [ ] Compute detailed strength metrics using day element, generated-by element, draining element, wealth element, officer element, and month branch signal.
- [ ] Add useful/unfavorable god details and actionable strategy summary.
- [ ] Add pattern confidence and risk flags.
- [ ] Run the focused backend test until it passes.

### Task 3: Verification

**Files:**
- Verify: `packages/shared/src/contracts.ts`
- Verify: `apps/backend/src/bazi/professional-bazi.ts`
- Verify: `apps/backend/src/bazi/professional-bazi.spec.ts`

- [ ] Run `corepack pnpm -r test`.
- [ ] Run `corepack pnpm -r build`.
- [ ] Report exact verification results and commit only the scoped changes.
