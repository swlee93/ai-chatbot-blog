---
title: "Building a RAG System (2/2): Experiments and Quality Validation"
description: "Validation of Vector RAG cost savings and response quality comparison"
tags: ["AI", "Architecture"]
icon: "FlaskConical"
order: 11
private: false
---

# RAG Experiments and Quality Validation

## Overview

The design predicted an 88% cost reduction, but theory and reality differ. I tested with portfolio data to validate not only cost but also retrieval quality and failure cases.

**What I wanted to validate:**
- Does Vector RAG actually reduce cost?
- How does response quality compare to Full Context?
- Which questions fail in retrieval?

Some issues that were not obvious during design surfaced during experiments.

## Experiment design

To make a data‑driven decision, I designed comparative tests. The same questions were run with Full Context and Vector RAG, and token usage and retrieval quality were measured quantitatively.

### Experiment environment

I used the live portfolio data under the same conditions as production.

**Portfolio data:**
- Size: 144KB (15 Markdown files)
- Vector DB: 213 chunks, avg 374 chars
- Embeddings: text-embedding-3-small (1536 dims)

**Variants:**
- **Full Context:** send full 144KB to the LLM
- **Vector RAG:** send top‑5 chunks by embedding similarity

**Metrics:**
- Token usage (input tokens)
- Cost (per 1,000 chats/month)
- Retrieval accuracy (similarity score)

### Test queries

To cover different question types, I chose three perspectives: tech stack, project experience, and learning/reflection. These mirror real questions in a portfolio chatbot.

```
1. "React와 TypeScript를 사용한 프로젝트 경험은?"
   → 기술 스택 중심 질문
   
2. "메이아이에서 데이터 플랫폼 구축한 경험을 알려줘"
   → 특정 회사/프로젝트 질문
   
3. "RAG 시스템 구현 과정에서 배운 점은?"
   → 학습/회고 중심 질문
```

Each query was answered with both methods for comparison.

## Experiment 1: Cost reduction

The first priority was validating the core assumption: cost reduction. I measured this with Query 3.

### Token usage comparison

I compared Full Context and Vector RAG using the most relevant Query 3.

Query 3 ("What did you learn while implementing the RAG system?"):

| Method       | Input tokens | Retrieved chunks | Cost/request | Monthly cost (1,000) |
| ------------ | ------------ | ---------------- | ------------ | -------------------- |
| Full Context | 22,103       | (all)            | $0.066       | $66.31               |
| Vector RAG   | 522          | 5                | $0.002       | $1.57                |
| **Savings**  | **-97.6%**   | -                | **-97.6%**   | **-97.6%**           |

Actual savings were 97.6%, higher than the 88% estimate.

**Cost calculation:**
- GPT‑4 input tokens: $0.003/1K tokens
- Full: 22,103 × $0.003/1K = $0.066/request
- RAG: 522 × $0.003/1K = $0.002/request

### Retrieval result analysis

Cost savings were confirmed, but I still needed to verify that selected chunks were actually relevant.

1. **64.3% 유사도** - content/rag-improvement-roadmap.md (Overview)
2. **56.3% 유사도** - content/rag-architecture-decision.md (구현: Static RAG)
3. **53.3% 유사도** - content/rag-architecture-decision.md (설계 원칙)
4. **53.1% 유사도** - content/writing-with-ai.md (기본 태도)
5. **50.7% 유사도** - content/writing-with-ai.md (RAG 아키텍처 결정 문서 개선)

**Average similarity: 55.5%**

The top results were clearly relevant to the question.

## Finding: similarity threshold issues

Query 3 succeeded, but Query 1 and 2 behaved differently. Query 1 failed entirely.

### Similarity calculation

To understand why some queries succeeded and others failed, I examined the similarity calculation.

Vector RAG uses **cosine similarity**:

```sql
1 - (embedding <=> query_embedding)::vector AS similarity
```

**Cosine similarity meaning:**
- 1.0 (100%): identical vector direction
- 0.5 (50%): 60° angle between vectors
- 0.0: orthogonal (unrelated)

**Process:**
1. Embed the user query with text-embedding-3-small (1536 dims)
2. Compute cosine distance against 213 chunks
3. Sort by distance (descending similarity)
4. Select top 5

The issue: **relevant content can still show low similarity**.

### Query 1: Retrieval failure

The most basic question failed. React/TypeScript projects existed, so why weren’t they retrieved?

```
✅ Embedding generated: 1536 dimensions
✅ Raw SQL: 0 results (20% threshold)
❌ Final: empty array
```

**Why did it fail?**

The portfolio **does contain** React/TypeScript projects, but:
- In projects.md, the terms appear **only in a table**
- The narrative focuses on **business problems** like “metric architecture” and “data pipeline”
- Tech stack is mentioned briefly in a single line

As a result, **content is relevant but similarity is low:**
```
Query embedding: [0.023, -0.145, 0.089, ...]  (React + TypeScript)
Content embedding: [0.012, -0.031, 0.156, ...] (metrics, pipeline concepts)

Cosine similarity: 0.18 (18%) → filtered out under 20%
```

**Embedding model limits:**
- Prioritizes **semantic similarity** over keyword matching
- “React project” vs “metric architecture” are semantically distant
- Same project, different perspective → low similarity

### Query 2: Success with low similarity

Query 1 failed, but Query 2 succeeded with low similarity. Why the difference?

| Rank | Similarity | File                     | Why it matched                                     |
| ---- | ---------- | ------------------------ | -------------------------------------------------- |
| 1    | 56.2%      | experience.md            | Direct mentions: “mAsh”, “data platform”           |
| 2    | 56.2%      | mayi-product-strategy.md | Synonyms: “mesh board”, “B2B data”                 |
| 3    | 55.4%      | mayi-data-pipeline.md    | Exact match: “pipeline build”                      |
| 4    | 52.7%      | mayi-product-strategy.md | Semantic links: “transition direction”, “platform” |
| 5    | 51.1%      | mayi-product-strategy.md | Context similarity: “problem solving”              |

**Average similarity: 54.3%**

**Why did it succeed?**

The content had **semantically aligned expressions**:
- “mAsh” → direct company name match
- “data platform” → related concepts like “B2B data”, “mesh board”
- “built experience” → action verbs like “design”, “implement”, “improve”

**Difference from Query 1:**
```
Query 1: “React + TypeScript” (tech keywords)
  → content: business‑focused narrative
  → semantic distance is large

Query 2: “mAsh + data platform” (proper noun + domain)
  → content: repeated matching terms
  → semantic distance is close
```

### Query 3: High similarity

Query 3 had high similarity from the start. What was different?

| Rank | Similarity | File                         | Key match                              |
| ---- | ---------- | ---------------------------- | -------------------------------------- |
| 1    | 64.3%      | rag-improvement-roadmap.md   | “RAG system”, “improvement”            |
| 2    | 56.3%      | rag-architecture-decision.md | “implementation process”, “Static RAG” |
| 3    | 53.3%      | rag-architecture-decision.md | “design principles”, “architecture”    |
| 4    | 53.1%      | writing-with-ai.md           | “lessons learned”, “retrospective”     |
| 5    | 50.7%      | writing-with-ai.md           | “doc improvement”, “learning”          |

**Average similarity: 55.5%**

**Why was it highest?**

All keywords appeared **explicitly** in the content:
- “RAG system” → repeated in file and section titles
- “implementation process” → described as “design”, “build”, “apply”
- “lessons learned” → “learning”, “retrospective”, “takeaways” sections

**Why embeddings worked well:**
1. **Keyword density:** “RAG” appears 40+ times
2. **Structural similarity:** “problem → solution → learning” matches the question intent
3. **Semantic consistency:** consistent implementation perspective

### Similarity distribution

Putting the three queries side by side clarified what drives success and failure.

| Query               | Max   | Avg   | Min   | Result    | Success factor                     |
| ------------------- | ----- | ----- | ----- | --------- | ---------------------------------- |
| 1. React/TypeScript | -     | -     | <20%  | ❌ Fail    | Tech keywords ≠ business narrative |
| 2. Data platform    | 56.2% | 54.3% | 51.1% | ✅ Success | Proper noun + domain terms         |
| 3. RAG system       | 64.3% | 55.5% | 50.7% | ✅ Strong  | Explicit keywords + structure      |

**Patterns observed:**

**Factors that raise similarity:**
1. **Explicit keywords:** repeated in the body
2. **Semantic density:** related concepts concentrated in one section
3. **Structural similarity:** question pattern matches content structure

**Factors that lower similarity:**
1. **Implicit context:** tech stack only in tables
2. **Perspective mismatch:** tech question vs business narrative
3. **Word mismatch:** expressed via synonyms or higher‑level concepts

## Response: similarity‑aware strategy

Rather than forcing higher similarity, I chose different responses based on similarity bands. Low similarity is treated as “needs more information,” not a failure.

### 1. Minimum threshold (20%)

Very low similarity is likely noise, so I excluded anything under 20%.

Hard cutoff to filter noise:

```typescript
WHERE (1 - (embedding <=> ${embeddingString}::vector)) >= 0.20
```

20% 미만은 아예 검색 결과에서 제외.

### 2. Quality warning threshold (35%)

20–35% is related but low confidence. In this band, the AI should ask clarifying questions.

```typescript
const avgSimilarity = results.reduce((sum, r) => 
  sum + r.similarity, 0) / results.length;

if (avgSimilarity < 0.35) {
  return `${context}\n\n---\n\n**NOTE TO AI**: 
    Low similarity (${(avgSimilarity * 100).toFixed(1)}%).
    Ask clarifying questions to narrow down the topic.`;
}
```

**Intent:**
- Signal low confidence
- Prompt clarifying questions instead of generic answers

### 3. Retrieval failure guidance

Zero results are not a technical error but a **chance to steer the conversation:**

```typescript
if (results.length === 0) {
  return `**NO RELEVANT CONTEXT**
  
  Ask user to clarify:
  - Specific project or company name?
  - Technical aspect or business perspective?
  - Timeframe or specific experience?`;
}
```

**Intent:**
- Respond with clear questions
- Ask what information is needed instead of “no data”
- Collect keywords through the conversation

### Live behavior scenarios

Based on patterns from the three queries, I wrote scenarios for how the system should respond.
```
User: “Do you have projects using React and TypeScript?”
AI: “I couldn’t find React/TypeScript content in the portfolio.
  If you share a specific company or project name, I can be more precise.
  Or are you asking about frontend experience in general?”
```

**시나리오 2: 프론트엔드 경험 질문 (30% 유사도)**
```
User: “How much frontend experience do you have?”
AI: “I’m not fully certain, but I worked on data visualization and dashboards at mAsh.
  Do you want details on a specific stack or project?”
```

**시나리오 3: 메이아이 데이터 질문 (54% 유사도)**
```
User: “Tell me about the mAsh data platform.”
AI: “mAsh is a retail visitor analytics platform.
  I worked on real‑time data collection, factor analysis, and funnel analysis…”
```

**Key**: treat low similarity as a prompt for better questions, not a hard failure.

## Current status

### What was achieved

Cost targets exceeded expectations:
- Input tokens: 22,103 → 522 (97.6% reduction)
- Monthly cost (1,000 chats): $66.31 → $1.57
- 9.6pp better than the 88% estimate

### Limitations found

Retrieval quality varied by query type:

| Query               | Similarity | Retrieval | Status                   |
| ------------------- | ---------- | --------- | ------------------------ |
| 1. React/TypeScript | 18%        | Failed    | ❌ Relevant but not found |
| 2. Data platform    | 54.3%      | Success   | ✅ Core info delivered    |
| 3. RAG system       | 55.5%      | Success   | ✅ Strong quality         |

Cost dropped by 97.6%, but retrieval can still fail depending on content structure.

## Lessons learned

### Embeddings capture meaning

I expected keyword‑style matching, but embeddings measure semantic distance.

Cosine similarity measures **semantic distance**, not word overlap:
- Same project, different perspective → larger distance
- “React project” vs “metric architecture” → 18% (tech vs business)
- “data platform” vs “B2B data” → 56% (domain match)

### Tables reduce retrieval quality

Analyzing Query 1 showed that tables lose context:
- Terms are embedded independently
- “What did you do with React?” loses linkage
- Higher risk of retrieval failure

Existing content should be rewritten in narrative form.

### Thresholds must be tested

Values like 20% and 35% can’t be predicted theoretically. They require repeated tests:
- 20%: below this is noise
- 35%: start asking clarifying questions
- 50%+: stable quality

More queries are still needed for validation.