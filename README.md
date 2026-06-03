# MetaMystic MVP

第一阶段实现的是全栈核心闭环：用户档案、八字排盘、AI 命理咨询、SSE 流式输出和历史记录数据模型。

## Local Development

Install dependencies:

```powershell
corepack pnpm install
```

Start PostgreSQL with pgvector:

```powershell
docker compose up -d
```

Create `.env` from `.env.example`, then run migrations:

```powershell
Copy-Item .env.example .env
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/metamystic?schema=public"
corepack pnpm --filter @metamystic/backend prisma:migrate
```

Start frontend and backend:

```powershell
corepack pnpm dev
```

Frontend: http://localhost:3000
Backend: http://localhost:4000/api/v1

## Current Local Caveat

If clicking "开始 AI 命理分析" shows a backend connection error, the frontend is running but the backend API is unavailable. The backend requires PostgreSQL at `localhost:5432`; install/start Docker or provide another PostgreSQL `DATABASE_URL`.
