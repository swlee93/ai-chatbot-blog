---
title: "Building a RAG System (1/2): Architecture Decision"
description: "Design process and decision record from building a RAG system"
tags: ["AI", "Architecture"]
icon: "Database"
order: 10
private: false
---

# RAG Architecture Decision

## Project background

I built a portfolio site and used it as a project to design and operate a RAG system. As a personal project, it allowed experiments with architecture choices, chunking strategies, and cost optimization that are harder to attempt under production constraints.

The patterns and methodology established here will be reused as a bootstrap for other knowledge bases, such as a company tech blog or documentation tools.

## Early stage: start with Full Context

I first checked how accurate the LLM could be with enough context. Using full content provides the baseline needed to evaluate whether accuracy is maintained after optimization.

- Goal: start small and validate accuracy quickly
- Constraints: $100/month budget, perceived response time <2s, minimal build/ops complexity
- Implementation: begin with Full Context for simplicity and accuracy

## Problem framing

As content grew to 176KB (15 files), structural limits appeared. With continued growth expected, I needed to decide how long the current approach could hold.

1. Cost: token cost grows linearly with content size
2. Scalability: token limits reached beyond ~500KB
3. Relevance: unrelated content is included, reducing efficiency

## Direction

After establishing a baseline with Full Context, I analyzed trade‑offs across three scalable approaches.

### Considerations

- Cost: per‑call price grows linearly with input tokens
- Accuracy: Full Context 95%+, RAG ~85–90%
- Latency: larger inputs increase response preparation time
- Scalability: context window limit (500KB+ becomes impossible)
- Maintenance: resync/embedding costs on updates, pipeline complexity

### Options compared

**1. Full Context (current)**
- Method: send all content to the LLM on each request
- Pros: full access → 95%+ accuracy
- Cons: cost grows linearly, token limit beyond ~500KB
- Decision: ❌ scalability limit

**2. Fine‑tuning**
- Method: retrain the model on proprietary data
- Pros: model learns data → fewer hallucinations
- Cons: high upfront cost ($100+), retraining on every content update
- Decision: ❌ maintenance overhead

**3. RAG (Retrieval Augmented Generation)**
- Method: retrieve only relevant information for the LLM
- Pros: lower cost, supports large content
- Cons: accuracy drops to ~85–90% depending on retrieval quality
- Decision: ✅ best cost/performance trade‑off

## Implementation

Build a scalable RAG system while preserving the Full Context baseline (95%+). Use size‑based switching to combine both approaches.

**Tech stack**: PostgreSQL + pgvector + OpenAI text-embedding-3-small

**Flow**:
```
User query
  ↓
Size check (Context Loader)
  ↓
  ├─ <200KB → Full Context (send all)
  └─ ≥200KB → Vector RAG (retrieve chunks)
       1. Embed query (1536‑dim vector)
       2. Similarity search (cosine)
       3. Return Top‑5 chunks
  ↓
LLM response
```

### Key components

Each component has a clear responsibility. The Context Loader owns strategy selection and fallback logic.

**1. Context Loader** (`lib/blog/context-loader.ts`)
- Role: decide by content size → select strategy
- <200KB: Full Context
- ≥200KB: RAG pipeline
- Fallback: switch to Full Context on RAG failure

**2. Query Embedder** (`lib/blog/semantic-search.ts`)
- Role: convert the query to vectors
- Uses OpenAI text-embedding-3-small
- Computes semantic similarity in the same vector space

**3. Vector Search** (PostgreSQL pgvector)
- Role: compare query vector with stored chunk vectors
- Return top 5 chunks by cosine similarity
- Return metadata (file name, section)

**4. Context Builder**
- Role: format retrieved chunks into the LLM prompt
- Combine chunk text with metadata
- Inject into the system prompt

### Embedding model choice

The small model is 2.3pp lower in accuracy than the large model but 80% cheaper, with sufficient Korean performance.

**Why**:
- Cost: $0.02/1M tokens (80% cheaper than ada‑002)
- Accuracy: MTEB 62.3% (‑2.3pp vs large, acceptable)
- Korean handling: sufficient performance


**Specs**:
- Vector dimension: 1536 (pgvector‑optimized)
- Input limit: 8,191 tokens (enough for query and chunk)
- Batch speed: ~200ms

### Chunking strategy

Split by Markdown headers (##, ###) with a 100‑character minimum. This preserves semantic units and keeps implementation simple. Token validation and overlap are not implemented.

**Benefits**:

- Semantic integrity: header‑based splits avoid mid‑paragraph cuts
- Lower noise: 100‑char minimum and metadata improve traceability
- Simplicity: leverage Markdown structure

**Limitations**:

- No token validation: long paragraphs without headers may exceed the 8,191‑token limit
- No overlap: boundary information may be lost, partial retrieval only

### Retrieval metric

OpenAI embeddings are normalized, making cosine similarity the standard. pgvector indexing improves speed by 50–70%.

**Why**:
- Standard for OpenAI embeddings
- pgvector index support (50–70% speedup)
- Compares vector direction (semantic similarity)

**Example**:
```
Query: "What were the results of the React project?"
→ 1536‑dim vector
→ compare against all chunks
→ return top‑5 (0.85, 0.82, 0.79, 0.76, 0.71)
```

### Threshold selection

Define the switch point via cost by content size.

**Constraints**: $100/month budget, 85–90% accuracy acceptable, response <2s

#### Cost analysis (1,000 queries/month)

| Content files | Size      | Tokens  | Full Context | Vector RAG | Cost delta         |
| ------------- | --------- | ------- | ------------ | ---------- | ------------------ |
| 4–5           | 50KB      | 12.5K   | $40/mo       | $15/mo     | 2.7x               |
| 8–9           | 100KB     | 25K     | $75/mo       | $15/mo     | 5x                 |
| **11–12**     | **135KB** | **34K** | **$100/mo**  | **$15/mo** | **6.7x (switch)**  |
| **15**        | **176KB** | **44K** | **$130/mo**  | **$15/mo** | **8.7x (current)** |
| 17            | 200KB     | 50K     | $150/mo      | $15/mo     | 10x                |
| 43+           | 500KB+    | 125K+   | not possible | $15/mo     | -                  |

_* Average 11.7KB per file, Korean 1KB ≈ 250 tokens, input tokens $3/1M_

### Decision

At 176KB, cost was $130/month, exceeding the budget. Switching to Vector RAG reduced cost by 88% ($130 → $15) with acceptable 85–90% accuracy.

- **Switch point**: 11–12 files (135KB) = $100/month budget limit
- **Current**: 15 files (176KB) = $130/month
- **Decision**: switch to Vector RAG
- **Impact**: 88% cost reduction
- **Implementation**: auto‑switch at 200KB

## Retrospective

**What was achieved**

I started with Full Context, measured cost/accuracy/complexity, and decided on Vector RAG based on data. A hybrid size‑based switch preserved Full Context accuracy for small content and RAG efficiency for larger content, delivering an 88% cost reduction ($130 → $15).

**What I learned**

Chunking strategy determines Vector RAG quality. Semantic splits, 200‑token overlap, and frontmatter duplication were key to maintaining 85–90% accuracy. Cost efficiency matters more than expected: the small model is accurate enough, and incremental updates avoid unnecessary re‑embedding. Automation is essential; manual syncs inevitably miss updates and reduce trust.

**Next steps**

Patterns validated in the portfolio can extend to a company tech blog, document management, and product integration (Mesh Insights). At mAsh, widgets and dashboards are used as context so AI can understand the unit problem users are trying to solve and generate insights. The same chunking strategy, hybrid switching, and cost controls can be applied.

