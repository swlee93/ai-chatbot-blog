# Project Structure & Architecture

This document provides a comprehensive overview of the project structure for GitHub Copilot to better understand the codebase.

## Project Overview

**Project Name**: AI Chatbot with Blog Integration  
**Framework**: Next.js 16 (App Router)  
**Language**: TypeScript  
**Database**: PostgreSQL (via Drizzle ORM)  
**AI Integration**: Vercel AI SDK with multiple model providers  
**Styling**: Tailwind CSS + shadcn/ui  
**Authentication**: Auth.js (NextAuth v5)

## Core Architecture

### 1. Next.js App Router Structure (`/app`)

#### Authentication Routes (`/app/(auth)`)

- **Purpose**: Handles user authentication flows
- **Key Files**:
  - `auth.ts`: Auth.js configuration
  - `auth.config.ts`: Auth configuration options
  - `actions.ts`: Server actions for auth operations
  - `login/` & `register/`: Auth UI pages

#### Chat Routes (`/app/(chat)`)

- **Purpose**: Main AI chatbot interface
- **Key Files**:
  - `page.tsx`: Main chat interface
  - `layout.tsx`: Chat layout with sidebar
  - `actions.ts`: Server actions for chat operations
  - `chat/[id]/`: Dynamic chat session routes
  - `api/`: API routes for chat functionality

#### Blog Routes (`/app/blog`)

- **Purpose**: Personal blog pages with RAG-powered content
- **Key Files**:
  - `layout.tsx`: Blog layout
  - `projects/`: Project showcase pages
  - `context/`: Blog context management

#### API Routes (`/app/api`)

- `blog/`: Blog-related API endpoints
- Various chat and data endpoints

### 2. Library Code (`/lib`)

#### AI Module (`/lib/ai`)

- **Purpose**: AI/LLM integration and configuration
- **Key Files**:
  - `models.ts`: LLM model configurations
  - `providers.ts`: AI provider setups (xAI, OpenAI, etc.)
  - `prompts.ts`: System prompts and prompt templates
  - `entitlements.ts`: Feature access control
  - `tools/`: AI tool implementations

#### Database Module (`/lib/db`)

- **Purpose**: Database schema and migrations
- **Stack**: Drizzle ORM + PostgreSQL
- **Key Files**:
  - `schema.ts`: Database schema definitions
  - `migrate.ts`: Migration runner
  - `migrations/`: SQL migration files
  - `queries.ts`: Common database queries

#### Artifacts Module (`/lib/artifacts`)

- **Purpose**: Handles AI-generated artifacts (code, images, documents)
- **Key Files**:
  - `server.ts`: Server-side artifact operations

#### Blog Module (`/lib/blog`)

- **Purpose**: RAG (Retrieval Augmented Generation) for blog content
- **Key Files**:
  - `embeddings.ts`: Vector embeddings generation
  - `semantic-search.ts`: Semantic search implementation
  - `content.ts`: Blog content management
  - `context-loader.ts`: Smart context loading for chat
  - `context-items.ts`: Context item definitions

#### Editor Module (`/lib/editor`)

- **Purpose**: Code and document editor configurations
- Uses CodeMirror for code editing

#### Utilities

- `types.ts`: Shared TypeScript types
- `utils.ts`: Common utility functions
- `constants.ts`: Application constants
- `errors.ts`: Error handling utilities
- `language-context.tsx`: Internationalization context

### 3. Components (`/components`)

#### Core Chat Components

- `chat.tsx`: Main chat component
- `messages.tsx` & `message.tsx`: Message rendering
- `multimodal-input.tsx`: Rich input with file attachments
- `suggested-actions.tsx`: Quick action suggestions
- `message-reasoning.tsx`: AI reasoning display

#### Artifact Components

- `artifact.tsx`: Artifact container
- `artifact-messages.tsx`: Artifact-specific messages
- `create-artifact.tsx`: Artifact creation UI
- `code-editor.tsx`: Code artifact editor
- `document-editor.tsx`: Document artifact editor
- `image-editor.tsx`: Image artifact editor
- `sheet-editor.tsx`: Spreadsheet artifact editor

#### Blog Components

- `blog-greeting.tsx`: Blog welcome screen
- `blog-markdown.tsx`: Markdown renderer for blog
- `blog-nav.tsx`: Blog navigation
- `blog-suggested-actions.tsx`: Blog quick actions

#### UI Components (`/components/ui`)

- shadcn/ui components (button, dialog, dropdown, etc.)

#### Sidebar & Navigation

- `app-sidebar.tsx`: Main sidebar
- `sidebar-history.tsx`: Chat history
- `sidebar-user-nav.tsx`: User navigation
- `chat-header.tsx`: Chat header with controls

### 4. Artifacts (`/artifacts`)

AI-generated content handlers:

- `code/`: Code artifact handling (client & server)
- `image/`: Image generation and editing
- `sheet/`: Spreadsheet functionality
- `text/`: Text document handling
- `actions.ts`: Artifact CRUD operations

### 5. Content (`/content`)

Blog content in Markdown:

- `ko/`: Korean language content
  - Project descriptions
  - About information
  - Skills and experience

### 6. Hooks (`/hooks`)

Custom React hooks:

- `use-artifact.ts`: Artifact state management
- `use-chat-visibility.ts`: Chat visibility control
- `use-messages.tsx`: Message state management
- `use-scroll-to-bottom.tsx`: Auto-scroll functionality
- `use-auto-resume.ts`: Session auto-resume
- `use-mobile.ts`: Mobile detection

### 7. Scripts (`/scripts`)

Utility scripts:

- `rag-sync.ts`: Sync blog content to vector database
- `check-setup.ts`: Verify blog setup

### 8. Tests (`/tests`)

E2E testing with Playwright:

- `e2e/`: End-to-end test scenarios
- `pages/`: Page object models
- `prompts/`: Test prompt fixtures
- `fixtures.ts` & `helpers.ts`: Test utilities

## Key Technologies & Patterns

### State Management

- React Server Components (RSC)
- Server Actions for mutations
- Client-side hooks for local state

### Data Flow

1. User input → Server Action
2. Server Action → AI SDK
3. AI response → Stream to client
4. Client updates UI reactively

### RAG (Retrieval Augmented Generation)

1. Blog content stored in Markdown
2. Content chunked and embedded (vector DB)
3. Semantic search retrieves relevant chunks
4. Context injected into AI prompts

### Database Schema

- `User`: User accounts
- `Chat`: Chat sessions
- `Message`: Chat messages
- `Vote`: Message feedback
- `Document`: Shared documents
- `Suggestion`: Saved suggestions
- `BlogChunk`: Embedded blog content

## Development Commands

```bash
# Development
pnpm dev                 # Start dev server with Turbo

# Database
pnpm db:generate        # Generate migrations
pnpm db:migrate         # Run migrations
pnpm db:studio          # Open Drizzle Studio
pnpm db:push            # Push schema changes

# Blog
pnpm rag:sync           # Sync blog content to DB
pnpm blog:check    # Check blog setup

# Code Quality
pnpm lint               # Check code quality
pnpm format             # Format code

# Testing
pnpm test               # Run Playwright tests
```

## Environment Variables

Required environment variables (see `.env.local`):

- `POSTGRES_URL`: PostgreSQL connection string
- `AUTH_SECRET`: NextAuth secret
- `AI_GATEWAY_API_KEY`: Vercel AI Gateway key (optional for Vercel)

## File Naming Conventions

- **Routes**: Follows Next.js App Router conventions
  - `page.tsx`: Route page
  - `layout.tsx`: Route layout
  - `loading.tsx`: Loading UI
  - `error.tsx`: Error boundary
- **Components**: PascalCase for components, kebab-case for files
  - Example: `ChatHeader` → `chat-header.tsx`

- **Utilities**: camelCase for functions
  - Example: `getUserId()` in `utils.ts`

## Important Implementation Notes

### Authentication

- Uses Auth.js v5 (beta) with PostgreSQL adapter
- Custom auth pages in `/app/(auth)`
- Protected routes use middleware

### AI Integration

- Default provider: xAI (Grok models)
- Supports multiple providers via AI SDK
- Streaming responses for real-time UX

### Blog RAG System

- Content in `/content` directory
- Vector embeddings stored in PostgreSQL with pgvector
- Semantic search retrieves relevant context
- Context automatically injected into chat prompts

### Artifacts

- AI-generated content (code, images, documents)
- Versioned and stored in database
- Live editing with preview

## Design Patterns

1. **Server-First**: Maximize server components, minimize client JS
2. **Progressive Enhancement**: Works without JS when possible
3. **Optimistic UI**: Immediate feedback, sync in background
4. **Streaming**: Real-time AI responses via RSC and streaming
5. **Type Safety**: Strict TypeScript throughout

## Code Style

- **Format**: Biome (configured in `biome.jsonc`)
- **Imports**: Absolute imports from `@/` for project files
- **CSS**: Tailwind utility classes, CSS variables for theming
- **Components**: Prefer composition over prop drilling

## Common Patterns to Follow

### Server Actions

```typescript
"use server";

export async function myAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Validation
  // Database operation
  // Return result
}
```

### Client Components with Hooks

```typescript
"use client";

import { useState } from "react";

export function MyComponent() {
  const [state, setState] = useState();
  // Component logic
}
```

### API Routes

```typescript
import { auth } from "@/app/(auth)/auth";

export async function GET(request: Request) {
  const session = await auth();
  // Handle request
  return Response.json(data);
}
```

## Debugging Setup

VS Code configurations in `.vscode/`:

- `launch.json`: Debug configurations
- `tasks.json`: Build/run tasks

Available debug configs:

1. Next.js: debug server-side
2. Next.js: debug client-side
3. Next.js: debug full stack
4. Next.js: debug with DB migration

---

## Documentation Guidelines

### Writing Tone & Style

**Core Principles:**

- **문제 분석 중심**: 감정적 깨달음이 아니라 문제 구조 분석 → 설계 → 실행 과정을 명확히
- **사실 기반 서술**: "~을 깨달았다", "놀랍게도" 같은 감정 표현 지양, "문제는 X다", "Y 방식으로 구현했다" 같은 사실 중심
- **간결한 문장**: 한 문장에 하나의 생각, 짧게 끊기
- **과장 제거**: "기하급수적으로", "근본적으로" 같은 과도한 수식어 최소화
- **구조 강조**: "설계 근거", "구현 방법", "확장 한계" 같은 구조적 요소 명시
- **단계 명시**: "1단계 → 2단계 → 향후" 같이 시간 흐름과 진화 과정 표시

**Tone:**

- 분석적이고 간결하게 (Analytical and concise)
- 직설적이고 명료하게 (Direct and clear)
- 구조적이고 체계적으로 (Structured and systematic)

**Language:**

- 한국어: 기본 문서, 비즈니스 로직, 제품 전략, 회고
- 영어: 기술 용어, 코드 주석, API 문서
- 혼용 시: 영문 기술 용어는 한글 설명과 함께 병기, 처음 등장 시 괄호로 영문 표기

**회고/기록 문서 특화 원칙:**

- 1인칭 복수형 자연스럽게 사용 ("우리는", "메이아이는" 혼용)
- 의사결정 과정과 트레이드오프 투명하게
- 실패와 한계도 솔직하게, 단 감정적이지 않게
- 측정 가능한 결과로 효과 입증

### Document Structure

**표준 문서 구조:**

```markdown
# [기능명/모듈명]

## Overview

간단한 소개와 핵심 가치

## Problem Context

해결하고자 하는 문제와 배경

## Solution Approach

접근 방법과 핵심 아이디어

## Implementation Details

구현 세부사항 (필요시)

## Usage Examples

사용 예시 (해당시)

## Related

연관 문서나 참고 자료
```

**문서 유형별 가이드:**

1. **기능 명세 (Feature Specs)**
   - 문제 정의 → 해결 방향 → 핵심 개념 → 구현 요소 순서
   - "무엇을"보다 "왜"를 먼저 설명
2. **기술 문서 (Technical Docs)**
   - 아키텍처 다이어그램 또는 구조 설명
   - 데이터 흐름과 상태 관리 방식
   - 주요 의사결정 사항과 트레이드오프
3. **API 문서**
   - Endpoint 목적과 사용 시나리오
   - Request/Response 명세
   - 에러 케이스와 처리 방법

### Product Philosophy & Direction

#### 핵심 방향성: AS-IS to TO-BE

**AS-IS: 커스터마이징 + 데이터 통합**

한국의 B2B 데이터 플랫폼 환경에서는 고객사별 업무 방식과 의사결정 구조가 크게 달라, 지표·대시보드·데이터 연계를 적극적으로 커스터마이징하는 전략이 필수적이라고 판단했다.

다만 이러한 접근은 고객별 설정이 누적될수록 커뮤니케이션 공수와 시스템 복잡성이 증가해 운영 안정성과 확장성에 한계를 드러낸다.

이에 메이아이에선 지표와 대시보드를 코드나 설정이 아닌 **의미와 관계가 정의된 메타 정보**로 관리하는 아키텍처로 전환해, 커스터마이징 부담을 줄이고 재사용성과 안정성을 확보했으며, 이는 이후 AI 기반 분석과 인사이트 자동화를 위한 구조적 전제가 되었다.

**문제 의식**

기존 데이터 플랫폼은 데이터를 모으고 보여주는 역할에는 충실하지만, 해석·판단·다음 행동은 여전히 사람과 조직의 경험에 의존한다.

이로 인해 판단 속도가 느려지고 인사이트가 특정 개인에게 종속되며, 분석과 실행 사이에 불필요한 회의와 커뮤니케이션 비용이 반복적으로 발생한다.

결과적으로 사용자는 데이터는 보지만, 실질적인 의사결정과 실행에 도움이 된다는 효용을 느끼기 어려운 구조에 머물러 있다.

**Palantir의 접근 (벤치마크)**

Palantir는 이 문제를 단순한 데이터 플랫폼의 확장이 아니라, **의사결정을 다루는 새로운 계층의 도입**으로 해결했다.

이를 위해 Palantir는:

1. 지표나 테이블이 아니라 **객체와 관계, 상태 변화**를 중심으로 데이터를 정의해 시스템이 숫자가 아닌 상황과 맥락을 이해하게 만들고(Ontology)
2. 분석 결과를 설명이나 리포트가 아니라 **선택 가능한 판단 상태**로 제공하며(Decision Layer)
3. 분석과 실행 사이의 전달·정리 과정을 줄여 **조직이 바로 움직일 수 있도록** 설계했다(Actionability)

데이터를 더 많이 보여주는 대신, 조직이 지금 어떤 판단을 내려야 하는지를 데이터 위에 직접 드러내는 구조를 만든 것이다.

**TO-BE: 메이아이의 전환 방향**

메이아이는 이 접근을 **방문객 데이터와 리테일 운영 영역**에 맞게 재해석한다.

- 전환의 핵심은 위젯·대시보드·고객사 고유 정보를 단순한 시각화 결과가 아니라, AI 인사이트를 만들기 위한 문제 맥락(Context)으로 사용하는 것이다
- 메이아이에서 대시보드는 사용자가 해결하고자 하는 **단위 문제**를 의미하고, 그 안에 포함된 위젯 구성 자체가 문제를 바라보는 관점을 담는다
- 여기에 방문객 데이터뿐 아니라 상권, 날씨, 고객사 데이터, 설문·메모와 같은 비정형 정보까지 함께 묶어, AI가 하나의 상황으로 이해할 수 있는 구조를 만든다

#### 핵심 구현 전략

**1. Context 관리**

- 문제 단위로 정의된 대시보드와 위젯을 중심으로, AI가 질문을 이해하고 답을 생성할 수 있는 맥락을 명확히 구성
- 요인 분석, 트레이스 분석, 날씨/상권 위젯, 위젯 제목과 설명, 레이아웃 요소 등을 활용

**2. 데이터 정제**

- 데이터 지표 사전, 컬럼 의미 정의를 통해 정보를 압축적으로 관리하고 의미 단위로 구조화

**3. Decision-ready Insight**

- AI는 여러 컨텍스트를 연결해 변화의 의미를 설명하고, 가능한 다음 행동 후보를 제시한다. 인사이트는 리포트로 끝나지 않고 알림을 통해 전달되며, 협업 도구나 업무 흐름과 자연스럽게 연결되어 실행으로 이어진다

#### 설계 원칙

1. **Context-Driven Design**
   - 위젯과 대시보드는 단순한 시각화가 아니라 문제 맥락(Context)의 표현
   - 대시보드 = 사용자가 해결하고자 하는 단위 문제
   - 위젯 구성 = 문제를 바라보는 관점

2. **Semantic Data Management**
   - 데이터를 단순한 숫자가 아니라 의미와 관계를 포함한 정보 단위로 관리
   - 지표 사전을 통해 일관된 해석 기준 제공
   - 객체와 상태 변화 중심의 데이터 모델링

3. **Decision-Ready Insights**
   - 분석 결과는 설명이 아니라 선택 가능한 판단 상태로 제공
   - 인사이트는 리포트로 끝나지 않고 알림·협업·업무 흐름으로 연결
   - 실행 가능성(Actionability)을 항상 고려

4. **Progressive Enhancement**
   - 단계별 확장 가능한 구조
   - 위젯 단위 → 대시보드 단위 → 크로스 대시보드 인사이트
   - 정형 데이터 → 비정형 정보 통합

#### 주요 기능별 철학 및 현황

**매쉬 인사이트 (AI 분석)**

위젯 단위 분석에서 출발해 **대시보드 단위 분석**으로 확장하고 있다. 대시보드는 사용자가 해결하고자 하는 단위 문제를 의미하며, 그 안에 포함된 위젯과 비교 조건, 외부 정보가 AI 인사이트를 위한 컨텍스트로 활용된다.

날씨·장소 관련 이슈 검색을 통해 분석 맥락을 보강하고, 설문·메모 등 비정형 정보를 **AI 메모리 관리 기능**으로 누적 관리한다. 데이터 지표 사전을 활용해 AI 응답의 해석 일관성과 신뢰도를 높인다.

앞으로 계획:

- 사용자 대시보드에 포함된 컨텍스트를 활용하여 종합적인 인사이트 제공
- 컨텍스트 증가에 따른 응답 지연 문제를 토큰 관리·정보 압축 관점에서 개선

**데이터 지표 사전 (메트릭 메타)**

지표 정의와 계산 방식을 일관되게 관리하기 위한 메타 정보로 출발했다. 현재는 AI 구현 단계에서 **컨텍스트 보강과 사용자 피드백의 기준점**으로 활용되고 있다.

지표를 단순한 숫자가 아니라 의미와 해석 기준을 포함한 정보 단위로 관리함으로써, AI가 수치를 나열하는 것이 아니라 변화의 의미를 설명할 수 있도록 하는 데 주안점을 둔다.

**요인 분석**

결과 지표를 비교하는 데서 나아가, **왜 이런 결과가 나왔는지를 설명 가능한 구조로 만들기 위해** 설계되었다.

마케팅 업무 프로세스에서의 타깃 세그먼트 선정을 염두에 두고, 핵심 KPI, 세그먼트 구성비, 신뢰도를 함께 고려해 집중 효율·보완 효율·종합 효율을 산출한다. 이를 통해 "성과가 좋아 보이는 대상"이 아니라 **선택할 근거가 명확한 타깃**을 제시하는 데 목적이 있다.

**퍼널 분석 vs 저니맵**

두 기능은 비슷해 보이지만 유용한 상황이 다르다.

- **퍼널 분석**: 분석 대상과 목표가 명확한 경우에 유용하다. 단계별 이탈·전환을 정량적으로 측정하여 보고 자료 구성과 의사결정에 직접 활용된다
- **저니맵**: 문제를 구체화하기 전 단계에서 유용하다. 방문객 행동의 전반적인 흐름과 현황을 빠르게 파악하여 분석 방향을 설정하는 데 활용된다

**상권 분석**

기존 방문객 데이터 파이프라인에 **외부 데이터를 통합**하려는 첫 시도였다. 생활인구, 통신사 유동인구와 같은 외부 지표를 결합해 매장 내부 데이터만으로는 설명하기 어려운 변화를 해석하고, 데이터 활용 범위를 매장 밖으로 확장했다.

특히 매쉬 인사이트와 연계해 단순 비교가 아니라 **상황에 맞는 해석과 솔루션을 함께 제시하는 방향**을 검증했으며, 설문조사 분석 역시 정형 데이터에 비정형 정보를 결합하려는 같은 흐름의 시도로 볼 수 있다.

**실시간 혼잡도**

대규모 공간과 시설 운영 환경에서 **즉각적인 현황 판단**을 지원하기 위해 구현되었다. 현재는 혼잡도 산출과 시각화 중심으로 활용되고 있으며, 향후 혼잡 발생 원인과 대응 액션을 인사이트·알림과 연결하는 방향을 검토 중이다.

**데이터 정합성 평가**

데이터 신뢰성을 정량적으로 측정하고 이상치를 탐지하는 시스템. 모델 평가 지표를 통해 데이터 품질을 지속적으로 모니터링하고 개선 포인트를 식별한다.

**모니터**

메트릭·이상치·실시간 모니터링을 통해 **이상 징후를 놓치지 않고 반응할 수 있도록 돕는 것**을 목표로 설계되었다.

웹훅을 통한 워크플로우 연동과 인사이트 첨가를 통해, 단순 알림을 넘어 분석 결과가 다음 행동으로 이어질 수 있도록 확장 중이다.

**트레이스 분석 (개발 중)**

방문객 행동을 더 깊이 이해해보자는 문제의식에서 출발했다. 집계 메트릭으로 뭉개진 평균값이 아니라, **행동의 흐름과 분포 단위로 방문객을 이해**하는 데 초점을 둔다.

타깃 탐색 → 타깃 선택 → 메시지·캠페인 실행으로 이어지는 마케팅 업무 흐름 관점에서:

- 트레이스 분석은 캠페인 기획 이전 단계에서 방문객의 실제 행동 흐름을 기준으로 다양한 행동 패턴을 식별하고, 이를 바탕으로 마케팅 타깃 풀을 정의
- cf. 요인 분석은 발굴된 타깃 후보들이 핵심 KPI에 어떤 영향을 미치는지를 비교·정량화해, 집중해야 할 마케팅 대상의 우선순위를 결정

한편 데이터 신뢰성 측면에서는 불규칙하거나 물리적으로 설명하기 어려운 동선과 의미 있는 행동 흐름을 구분하고, 그 차이가 발생하는 지점을 식별해 개선 포인트를 찾는 과정에 활용할 수 있다.

#### 용어 및 개념 정의

**핵심 용어:**

- **Context**: 문제를 이해하고 판단하기 위한 모든 배경 정보 (대시보드 구성, 위젯 설정, 비교 조건, 외부 데이터 등)
- **Decision Layer**: 분석 결과를 실행 가능한 판단 상태로 변환하는 계층
- **Actionability**: 인사이트가 다음 행동으로 이어질 수 있는 속성
- **Ontology**: 데이터를 객체, 관계, 상태 변화 중심으로 정의하는 방식

**데이터 계층:**

- **지표(Metric)**: 측정 가능한 정량적 값
- **위젯(Widget)**: 특정 관점의 데이터 시각화 단위
- **대시보드(Dashboard)**: 문제 해결을 위한 위젯과 컨텍스트의 조합

**분석 유형:**

- **탐색적 분석**: 문제를 구체화하기 위한 현황 파악 (저니맵)
- **진단적 분석**: 결과의 원인과 요인 파악 (요인 분석, 트레이스 분석)
- **의사결정 분석**: 선택 근거를 제공하는 비교 분석 (퍼널 분석)
- **예측적 분석**: 미래 상황과 대응 방안 제시 (개발 예정)

### Code Documentation Standards

**파일 헤더 주석:**

```typescript
/**
 * [파일명]
 *
 * 목적: [이 파일이 해결하는 문제]
 * 주요 책임: [핵심 역할]
 *
 * @see [관련 문서나 파일]
 */
```

**함수/메서드 주석:**

```typescript
/**
 * [간단한 설명]
 *
 * @param name - 파라미터 설명 (필요시 비즈니스 맥락 포함)
 * @returns 반환값 설명
 *
 * @example
 * // 사용 예시
 *
 * @remarks
 * 특이사항이나 주의할 점
 */
```

**비즈니스 로직 주석:**

- 복잡한 계산이나 로직은 "무엇을" 하는지뿐 아니라 "왜" 필요한지 설명
- 제품 요구사항이나 비즈니스 규칙을 명시적으로 언급
- 참고한 명세나 이슈 번호 포함

### Content Management Guidelines

#### Blog Content Structure (`/content`)

포트폴리오 콘텐츠는 RAG(Retrieval Augmented Generation) 시스템의 핵심 지식 베이스입니다. AI가 사용자의 질문에 답할 때 참조할 수 있도록 마크다운 형식으로 작성되며, 벡터 임베딩을 통해 의미 기반 검색이 가능합니다.

**콘텐츠 카테고리:**

1. **개인 정보** (`profile.md`, `personal.md`)
   - 핵심 역량과 현재 포지션
   - 문제 해결 접근 방식
   - 기술적 강점과 관심사

2. **경력 및 실적** (`experience.md`, `2024-achievements.md`, `2025-achievements.md`)
   - 연도별 주요 성과
   - 프로젝트 히스토리
   - 측정 가능한 임팩트

3. **프로젝트** (`projects.md`)
   - 주요 프로젝트 상세 설명
   - 기술 스택과 아키텍처
   - 성과 지표 및 링크

4. **기술 문서** (`tech-stack.md`, `approach.md`)
   - 기술 선택 기준과 철학
   - 개발 방법론
   - 툴 체인과 워크플로우

5. **도메인 지식** (`b2b-web-analytics-guide.md`, `mayi-data-pipeline.md`, `factor-analysis.md`, `funnel-analysis.md`)
   - 전문 영역 가이드
   - 데이터 파이프라인 설계
   - 분석 방법론

**문서 연결 (Related):**

문서 끝에 관련 문서 링크를 추가하지 않음. 이유:

- RAG 시스템이 의미 기반 검색으로 자동 연결
- 수동 링크 관리 부담 제거 (링크가 깨지는 문제 방지)
- 태그 기반 필터링으로 관련 문서 탐색 가능

문서 내에서 다른 문서를 언급할 때도 링크를 사용하지 않음:

- ❌ `[요인 분석](./factor-analysis.md)을 통해...`
- ✅ `요인 분석을 통해 타깃을 선정한다.`
- RAG가 "요인 분석"이라는 키워드로 자동으로 관련 문서를 찾아줌

**Frontmatter 필수 항목:**

모든 콘텐츠 파일은 다음 frontmatter를 포함해야 함:

```markdown
---
title: "문서 제목" # 필수: 명확하고 간결한 제목
description: "간단한 설명" # 필수: 1-2문장 요약 (검색 최적화)
tags: ["태그1", "태그2"] # 필수: 관련 키워드 (의미 검색 향상)
icon: "IconName" # 선택: Lucide 아이콘 이름
order: 1 # 선택: 표시 순서 (숫자가 작을수록 먼저)
---
```

- `title`: 사용자에게 표시되는 제목, 검색 결과에 사용
- `description`: RAG 검색 시 문서 요약으로 활용, 간결하고 핵심적으로
- `tags`: 의미 검색 품질 향상, 관련 용어와 동의어 포함 (아래 표준 태그 참조)
- `icon`: 포트폴리오 네비게이션에서 시각적 구분
- `order`: 동일 카테고리 내 문서 정렬 순서

**표준 태그 목록 (15개):**

태그는 아래 중앙 관리됨. 문서당 3-5개 권장.

| 태그                | 설명                                  | 사용 예시                     |
| ------------------- | ------------------------------------- | ----------------------------- |
| **핵심 기술**       |                                       |                               |
| `AI`                | AI/LLM, RAG, 에이전트 등 AI 기술 전반 | 매쉬 인사이트, RAG 아키텍처   |
| `데이터 분석`       | 데이터 수집, 처리, 분석 방법론        | 요인 분석, 퍼널 분석          |
| `데이터 파이프라인` | 데이터 수집, 저장, 처리 인프라        | 메이아이 파이프라인           |
| **제품/비즈니스**   |                                       |                               |
| `제품 전략`         | 제품 기획, 비즈니스 모델, 의사결정    | 메이아이 전략, AS-IS to TO-BE |
| `B2B SaaS`          | B2B 플랫폼 설계, 커스터마이징         | 데이터 플랫폼, 웹 분석        |
| **도메인**          |                                       |                               |
| `오프라인`          | 오프라인 매장, 방문객 분석, 동선      | 동선 분석, 혼잡도             |
| **기술 스택**       |                                       |                               |
| `React`             | React, Next.js 프론트엔드             | 웹 애플리케이션, 대시보드     |
| `Python`            | Python 백엔드, 데이터 처리            | FastAPI, 스크립트             |
| **방법론/프로세스** |                                       |                               |
| `아키텍처`          | 시스템 설계, 의사결정, 트레이드오프   | RAG 아키텍처                  |
| `데이터 품질`       | 데이터 정합성, 신뢰도, 품질 검증      | 정합성 평가                   |
| `데이터 모델링`     | 데이터 구조 설계, 스키마, 메타 정보   | 지표 사전                     |
| `협업`              | 팀 협업, 커뮤니케이션, 프로세스       | 팀 프로세스, 문서화           |
| `옵저버빌리티`      | 모니터링, 로깅, 트레이싱              | WhaTap, 웹 분석               |
| **프로젝트**        |                                       |                               |
| `메이아이`          | 메이아이 관련 콘텐츠                  | 매쉬 인사이트                 |
| `WhaTap`            | WhaTap 경험 및 프로젝트               | RUM, 웹 분석                  |

**태그 선택 가이드:**

- 핵심 기술(1-2) + 도메인(0-1) + 방법론(1) 조합 권장
- 회사/프로젝트 태그는 관련도 높을 때만
- 예시:
  - 매쉬 인사이트: `["AI", "제품 전략", "메이아이"]`
  - 요인 분석: `["데이터 분석", "오프라인", "메이아이"]`
  - RAG 아키텍처: `["AI", "아키텍처"]`
  - 데이터 정확도: `["데이터 파이프라인", "데이터 품질", "메이아이"]`

**콘텐츠 작성 원칙:**

1. **구조화**: Frontmatter → 명확한 개요 → 점진적 상세화

2. **검색 가능성**: 핵심 키워드 자연스럽게 포함, 동의어 사용, 질문 형태 제목 ("어떻게...", "왜...")

3. **맥락 제공**: 배경과 문제 정의, "왜" 이렇게 했는지, 의사결정 과정과 트레이드오프

4. **구체성**: 추상적 표현보다 구체적 사례·수치·코드·측정 가능한 결과

5. **최신성**: 날짜·버전 명시, 변경 이력 관리, 유효하지 않은 정보 아카이브/업데이트

**콘텐츠 업데이트 프로세스:**

```bash
# 1. 새 콘텐츠 추가
# content/ 디렉토리에 마크다운 생성 → Frontmatter 작성 → 콘텐츠 작성 → RAG 동기화
pnpm rag:sync

# 2. 기존 콘텐츠 수정
# 마크다운 수정 → 변경 이력 주석 (필요시) → RAG 재동기화
pnpm rag:sync

# 3. 콘텐츠 검증
pnpm blog:check
```

**RAG 시스템 통합:**

- **벡터 임베딩**: OpenAI text-embedding-3-small
- **청킹**: 최대 1000 토큰, 200 토큰 오버랩, 의미 단위 (섹션·문단) 분할
- **검색**: 코사인 유사도 기반
- **컨텍스트 로딩**: 질문 관련도 기반 자동 선택, 토큰 제한 고려 동적 구성, 언어별 자동 매칭

**콘텐츠 자동화 가이드 (에이전트):**

1. **신규 성과/프로젝트**: 해당 카테고리 파일 추가 (예: `2025-achievements.md`), 구조화 형식 유지, 측정 가능 임팩트, RAG 동기화
2. **기술 스택 변경**: `tech-stack.md` 업데이트, 변경 이유·기대 효과, 관련 프로젝트 참조 업데이트
3. **새 인사이트/학습**: 적절 카테고리 판단 (또는 새 파일), 실무 적용 사례와 함께, 이론보다 실전 경험 중심
4. **정기 업데이트 (분기/반기)**: 카테고리별 최신성 검토, 유효하지 않은 정보 수정/제거, 새 트렌드 반영

**주의사항:**

- 개인정보나 기밀 정보는 포함하지 않음
- 구체적인 회사/고객 정보는 일반화하거나 익명화
- 소스 코드는 공개 가능한 범위만 포함
- 링크는 검증 후 추가 (깨진 링크 방지)

### 문서 작성 및 검토 프로세스

기술 문서 작성 시, [AI 협업 문서 작성 가이드](writing-with-ai.md)의 원칙과 프롬프트 템플릿을 참조한다.

**작성 중 AI 활용:**

```
@workspace .github/writing-with-ai.md를 참고해서 이 문서를 검토해줘
```

**체크 포인트:**

- 전문가의 저주: 기본 개념 생략하지 않았는지
- 맥락 제공: 의사결정 배경과 트레이드오프 명시
- 구체성: 추상적 표현을 예시·숫자·비유로 보완
- 논리 일관성: 비교 축이 일관되고, 개념 정의가 명확한지

**검토 체크리스트:**

- [ ] 개념 정의가 명확한가?
- [ ] 비교가 동일 차원에서 이루어지는가?
- [ ] 추상적 설명에 구체적 예시가 있는가?
- [ ] 트레이드오프가 설명되었는가?
- [ ] 숫자로 정량화할 수 있는 부분이 정량화되었는가?

---

_This document should be referenced when making architectural decisions, understanding the codebase structure, or creating new documentation._
