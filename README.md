<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">AI Chatbot with Blog RAG</h1>
</a>

<p align="center">
    AI Chatbot with Blog RAG is a Next.js 16 App Router project that combines a streaming chat UI, Auth.js authentication, and a blog knowledge base with semantic search.
</p>

<p align="center">
  Based on <a href="https://github.com/vercel/ai-chatbot">vercel/ai-chatbot</a>.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a> ·
  <a href="#blog-setup-rag"><strong>Blog setup</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://ai-sdk.dev/docs/introduction)
  - Unified API for streaming chat responses and tool calls
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication
- Blog RAG
  - Markdown content ingestion with pgvector + semantic search
  - Smart context loading for blog-related queries

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

### Template content

The template ships with sample documents under content/ko. Replace these files with your own profile, experience, tech stack, and project descriptions before running RAG sync.

### UI message config (YAML)

Greeting and quick-start copy live in [public/ai-chatbot-blog.yaml](public/ai-chatbot-blog.yaml). Edit this file to update the chat welcome text and suggested prompts.

### Fork quickstart (local bootstrap)

1. `pnpm install`
2. `cp .env.example .env.local` and set `AUTH_SECRET`, `POSTGRES_URL`, `AI_GATEWAY_API_KEY`, `OPENAI_API_KEY` (optional: `BLOB_READ_WRITE_TOKEN`, `REDIS_URL`)
3. `pnpm db:migrate`
4. `pnpm dev` (open the app and sign up or use guest login once)
5. `pnpm rag:sync`

Your app template should now be running on [localhost:3000](http://localhost:3000).

## Blog setup (RAG)

### 1. Apply database migrations

```bash
pnpm run db:migrate
```

### 2. Initial RAG sync (required)

Make sure at least one user exists (sign up or use guest login once), then:

```bash
pnpm run rag:sync
```

