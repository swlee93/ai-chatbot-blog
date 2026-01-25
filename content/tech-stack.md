---
title: "Tech Stack"
description: "Default technology choices and selection criteria for the template"
tags: ["React", "Architecture", "Data Pipeline"]
icon: "Code"
order: 3
---

# Tech Stack

## Overview

This template is built around the Next.js App Router and TypeScript. Server actions and streaming UI are the default assumptions.

## Problem Context

Real-time chat UI and RAG context loading require clear separation of server and client responsibilities. Type safety and performance must be balanced.

## Solution Approach

- UI: React + Tailwind CSS
- Server: Next.js App Router, Server Actions
- Data: PostgreSQL + Drizzle ORM
- AI: Vercel AI SDK (multi-provider support)

## Implementation Details

- Minimize client state where possible in the UI layer.
- Manage data access in a shared query layer.
- Keep RAG logic in lib/blog to limit change impact.
