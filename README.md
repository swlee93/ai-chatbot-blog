# AI Chatbot Blog Template

Next.js 16 App Router template for a streaming AI chat UI with Auth.js, PostgreSQL (pgvector), and a markdown-backed blog context.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/swlee93/ai-chatbot-blog)

## Overview

- Chat UI with streaming responses
- Auth.js (NextAuth v5)
- Blog content loaded from `content/`
- RAG sync via `pnpm rag:sync`
- UI copy and deploy link configured in YAML

## Screenshots

![Chat messages](public/images/demo-chat-messages.png)
![Chat history](public/images/demo-chat-history.png)
![Context list](public/images/demo-context-list.png)
![Context example](public/images/demo-context-example.png)
![Private context](public/images/demo-context-private.png)

## Local setup

1. Install dependencies
2. Configure `.env.local` using [.env.example](.env.example)
3. Run DB migration and dev server

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

## Content

Blog content lives under `content/`. Replace the sample docs with your own profile, experience, tech stack, and projects.

## UI config (YAML)

UI copy and the deploy link are defined in [public/ai-chatbot-blog.yaml](public/ai-chatbot-blog.yaml).

- `CHAT_GREETING`: welcome title/subtitle/cta
- `CHAT_SUGGESTED_ACTIONS`: quick-start prompts
- `DEPLOY_LINK`: deploy button (`hide: true` to hide)

## RAG setup

```bash
pnpm run rag:sync
```

## Vercel deploy

### Required services

- Postgres with pgvector enabled (Neon or Supabase)
- Vercel Blob (uploads)
- Optional: Vercel AI Gateway

### Environment variables

- `AUTH_SECRET`
- `POSTGRES_URL`
- `AI_GATEWAY_API_KEY` (if not using Vercel OIDC)
- `OPENAI_API_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `NEXTAUTH_URL`

Optional:

- `REDIS_URL`

