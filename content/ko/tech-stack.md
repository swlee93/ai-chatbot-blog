---
title: "기술 스택"
description: "템플릿 프로젝트의 기본 기술 구성과 선택 기준"
tags: ["React", "아키텍처", "데이터 파이프라인"]
icon: "Code"
order: 3
---

# 기술 스택

## Overview

이 템플릿은 Next.js App Router와 TypeScript를 기준으로 구성된다. 서버 액션과 스트리밍 UI를 기본 전제로 한다.

## Problem Context

실시간 대화 UI와 RAG 기반 컨텍스트 로딩은 서버와 클라이언트의 역할 분리가 중요하다. 타입 안정성과 성능 균형을 함께 고려해야 한다.

## Solution Approach

- UI: React + Tailwind CSS
- 서버: Next.js App Router, Server Actions
- 데이터: PostgreSQL + Drizzle ORM
- AI: Vercel AI SDK (멀티 프로바이더 지원)

## Implementation Details

- UI 레이어는 가능한 한 클라이언트 상태를 최소화한다.
- 데이터 접근은 공통 쿼리 레이어에서 관리한다.
- RAG 관련 로직은 lib/blog에 모아 변경 영향을 줄인다.
