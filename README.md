# MetaMystic

AI-powered metaphysics decision platform for Bazi charting, AI consultation, RAG knowledge retrieval, user profiles, and long-term personal memory.

## Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand, Framer Motion
- Backend: NestJS, TypeScript, Prisma
- Database: PostgreSQL with pgvector
- AI: OpenAI-compatible chat providers, OpenAI embeddings, RAG
- Deployment: Vercel frontend, Railway backend and PostgreSQL

## Project Structure

```text
apps/
  frontend/       Next.js app
  backend/        NestJS API
packages/
  shared/         Shared API contracts and DTOs
docs/
  deployment.md   Cloud deployment notes
  product/        Product reference documents and UI reference
```

## Local Development

Install dependencies:

```powershell
corepack enable
corepack pnpm install
```

Start PostgreSQL with pgvector:

```powershell
docker compose up -d
```

Create local environment variables:

```powershell
Copy-Item .env.example .env
```

Run migrations:

```powershell
corepack pnpm --filter @metamystic/backend prisma:migrate
```

Start the frontend and backend:

```powershell
corepack pnpm dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/v1
- Health check: http://localhost:4000/api/v1/health

## Core Commands

```powershell
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Environment Notes

`.env` and `.env.*` are intentionally ignored. Use `.env.example` as the public template.

`AI_PROVIDER` supports `openai` and `deepseek`. DeepSeek is used through its OpenAI-compatible chat API; embeddings use the `OPENAI_*` settings by default.

RAG vector search is disabled in `.env.example` so first-time local setup works before embedding backfill. Enable it after configuring an embedding API key and generating knowledge vectors.

## Deployment

See [docs/deployment.md](docs/deployment.md).
