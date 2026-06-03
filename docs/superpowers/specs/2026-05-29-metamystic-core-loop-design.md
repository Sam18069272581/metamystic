# MetaMystic Core Loop Design

## Goal

Build the first production-shaped MVP loop for an AI metaphysics decision platform: user profile, Bazi chart generation, AI consultation, and conversation history.

## Scope

This phase intentionally avoids implementing Ziwei, full RAG, long-term memory, community, payment, and polished sharing flows. Those systems get stable module boundaries and database extension points, but the shippable slice is the Bazi plus AI decision loop.

## Product Loop

1. User enters birth time, gender, timezone, optional location, and a life decision question.
2. Backend creates or updates the profile.
3. Backend generates a deterministic Bazi chart through a replaceable chart engine.
4. Backend creates a consultation session linked to profile and chart.
5. Frontend subscribes to the SSE stream and renders structured AI sections.
6. Backend persists the final answer and exposes history.

## Architecture

The repository uses a simple monorepo shape:

```text
apps/
  frontend/
  backend/
packages/
  shared/
```

`packages/shared` owns request DTOs, response contracts, enums, and domain value shapes. `apps/backend` owns persistence, validation, business services, AI orchestration, and Bazi engine adapters. `apps/frontend` owns presentation, client state, and API clients.

## Backend Modules

`ProfileModule` manages user profile data. The first implementation uses a lightweight anonymous user ID so the data model can later accept Auth0, Clerk, Firebase, or custom auth without rewriting domain tables.

`BaziModule` exposes `POST /api/v1/charts/bazi` and stores chart snapshots. The calculation engine is hidden behind `BaziEngine`, with a deterministic MVP implementation that can be replaced by a stronger algorithm package later.

`ConsultationModule` exposes `POST /api/v1/consultations` and `GET /api/v1/consultations/:id/stream`. It composes chart data, user question, guardrails, and AI provider output into a structured answer.

`SafetyModule` performs lightweight policy checks and injects disclaimer metadata. It blocks absolute medical, death, gambling, and guaranteed-fate language from being treated as final product advice.

## Frontend Views

The first frontend surface is mobile-first because the reference image is a mobile app composition.

`/` is the home dashboard with today fortune, entry cards, and recent consultations.

`/consult` contains the profile and question form, starts a consultation, and renders the streaming answer.

`/charts/bazi/[id]` renders a reusable Bazi chart view with four pillars, ten gods, element distribution, and beginner/pro mode switch.

## Data Model

Core tables:

- `User`
- `Profile`
- `BaziChart`
- `Consultation`
- `ConsultationMessage`
- `KnowledgeSource` and `KnowledgeChunk` placeholders for phase-two RAG

JSON columns are allowed only for stable snapshots and future metadata, not as a substitute for core relational fields.

## AI Contract

AI output is represented as structured sections:

```ts
type AiSectionType = "verdict" | "logic" | "advice" | "disclaimer";
```

Streaming sends server-sent events with typed chunks. The frontend should never parse free-form XML tags as the source of truth. If the model returns text, the backend converts it into structured events before exposing it to the UI.

## Error Handling

All async backend endpoints return consistent error envelopes. Validation failures use 400, missing records use 404, AI provider failures use 502 with a graceful fallback message, and safety blocks use 422 with a user-facing reason.

Frontend API calls expose typed success and failure states. UI components render loading, streaming, error, empty, and success states.

## Future Expansion

Ziwei, Tarot, Chalice, RAG, and long-term memory should be added as separate modules that reference `Profile` and optionally `Consultation`, not by modifying the core Bazi service directly. This keeps the first loop small while preserving the platform shape.

