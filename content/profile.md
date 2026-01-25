---
title: "Profile & Approach"
description: "Problem-solving approach grounded in B2B data platform design and observability engineering"
tags: ["B2B SaaS", "Product Strategy", "Observability"]
icon: "User"
order: 1
private: false
---

# Profile & Approach

## Core strengths

I focus on turning complex requirements and imperfect data into scalable platform structures. In B2B enterprise environments, I absorb customer-specific needs, operations, and interpretation criteria into shared structures and standards rather than one-off customizations.

I work across the full stack, from data modeling and dashboard implementation to deployment, monitoring, and operations. The focus is on building systems that can be used reliably over time in enterprise settings, not on rigid role boundaries.

## Current role

I lead the product team at mAsh, an offline visitor analytics SaaS. Offline visitor data changes meaning by industry, venue, and operating goals, and it is hard to trust and interpret. Data exists, but it is often not directly usable for operations and decisions.

At mAsh, I led visitor data pipeline design, built a data integrity evaluation system, developed analytics such as factor analysis, funnel analysis, and real-time congestion, and designed an LLM-based insight generation system.

I designed and operated shared SaaS and on‑prem offerings, building a platform architecture that runs reliably in both cloud multitenant environments and customer‑dedicated infrastructure.

## Problem-solving approach

The problems I focus on in B2B data platforms are not just feature requests. They are questions like: “How far can we trust this data?”, “How do we handle heterogeneous customer requirements at scale?”, and “What makes data actually usable for operations and decisions?”

To address them, I prioritize platform‑level structures—shared data models, metadata, and interpretation standards—over per‑customer custom handling.

### Observability engineering perspective

I treat observability not as “show more data,” but as a way to define meaningful KPIs per customer and template them so the service can scale without fragmentation.

By structuring observation units and interpretation rules, the platform can absorb customer diversity without unnecessary complexity.

In practice:
- Build a metric dictionary that manages definitions and calculation rules as metadata.
- Convert customer‑specific configuration from code into metadata with defined meaning and relationships.
- Design widgets and dashboards as expressions of problem context, not just visualizations.

### Data reliability and scalability

I built a data integrity evaluation system to quantify reliability. Model evaluation metrics continuously monitor data quality and detect anomalies.

For scalability, I absorbed customer requirements into a configuration‑driven system rather than custom implementations. In factor and funnel analysis, KPI definitions, segments, and steps are managed as metadata so customer‑specific analysis can be assembled quickly.

## LLM and data platform integration

Recently, I have been designing conversational analysis experiences that layer LLMs on top of data and observability structures. The goal is not automation for its own sake, but reducing the cost of data exploration and interpretation so more stakeholders can participate in decision‑making.

Implementation direction:
- Use dashboards and widgets as problem context for AI insights.
- Improve consistency and trust in AI responses through the metric dictionary.
- Enrich context with unstructured data such as weather, location, surveys, and memos.
- Manage context efficiently with a RAG (Retrieval Augmented Generation) architecture.

## Tech stack

Frontend: React and TypeScript. I built a custom HTML Canvas charting library to optimize large‑scale visualization performance, and designed dashboard modules that support user customization.

Backend: Python/Django with PostgreSQL, Redis, object storage, and InfluxDB. I designed metric collection pipelines with Telegraf.

Infrastructure: Kubernetes and AWS services (ECS, Lambda, Batch, RDS, Bedrock). I set up monitoring and alerting with Datadog, Grafana, and Prometheus, tracking pipeline and service reliability metrics.

AI integration: Vercel AI SDK and LangChain with multiple LLM providers such as OpenAI and AWS Bedrock. I built semantic search using pgvector and a RAG architecture.

I have designed, built, and operated an enterprise‑grade data platform end‑to‑end—from agent layer to backend APIs and frontend dashboards. I implemented core components across data collection, processing, storage, analysis, visualization, and monitoring in production.

## Next direction

I focus on combining B2B data platforms, observability, and AI to handle complex requirements efficiently and make data usable for real operations and decisions. The goal is to build a Decision Layer that shows what judgment should be made now, rather than just displaying data.
