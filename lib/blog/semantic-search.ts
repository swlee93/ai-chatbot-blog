import { blogChunk } from '@/lib/db/schema';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { desc, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import { readFileSync } from 'node:fs';
import path from 'path';
import postgres from 'postgres';
import YAML from 'yaml';

// Lazy connection - only create when needed
let _client: ReturnType<typeof postgres> | null = null;
let _db: PostgresJsDatabase | null = null;

function getDb() {
  if (!_db) {
    _client = postgres(process.env.POSTGRES_URL!, {
      max: 1, // Limit connection pool
      idle_timeout: 20,
      connect_timeout: 10,
    });
    _db = drizzle(_client);
  }
  return _db;
}

type RagConfig = {
  ragTopK?: number;
};

let _cachedRagConfig: RagConfig | null = null;

function getRagConfigSync(): RagConfig {
  if (_cachedRagConfig) return _cachedRagConfig;
  try {
    const configPath = path.join(process.cwd(), 'public', 'ai-chatbot-blog.yaml');
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = YAML.parse(raw) as { BLOG_CONFIG?: RagConfig };
    _cachedRagConfig = parsed?.BLOG_CONFIG || {};
    return _cachedRagConfig;
  } catch {
    _cachedRagConfig = {};
    return _cachedRagConfig;
  }
}


export interface SearchResult {
  content: string;
  similarity: number;
  metadata: {
    filePath: string;
    section: string;
    title?: string;
  };
}

/**
 * Perform semantic search on blog chunks using vector similarity
 * @param query - The search query
 * @param topK - Number of results to return (default: 5)
 * @param minSimilarity - Minimum similarity threshold (default: 0.20 = 20%)
 * @returns Array of relevant content chunks sorted by similarity
 */
export async function semanticSearch(
  query: string,
  topK: number = 5,
  minSimilarity: number = 0.20
): Promise<SearchResult[]> {
  const db = getDb();
  const configTopK = getRagConfigSync().ragTopK;
  const resolvedTopK = typeof configTopK === 'number' ? configTopK : topK;
  
  try {
    // Generate embedding for the query
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: query,
    });

    const embeddingArray = Array.from(embedding);
    const embeddingString = `[${embeddingArray.join(',')}]`;

    // Perform vector similarity search using cosine distance
    // The <=> operator computes cosine distance (1 - cosine similarity)
    const results = await db.execute<{
      content: string;
      similarity: number;
      metadata: { filePath: string; section: string; title?: string };
    }>(sql`
      SELECT 
        content,
        metadata,
        1 - (embedding <=> ${embeddingString}::vector) AS similarity
      FROM "BlogChunk"
      WHERE (1 - (embedding <=> ${embeddingString}::vector)) >= ${minSimilarity}
      ORDER BY embedding <=> ${embeddingString}::vector
      LIMIT ${resolvedTopK}
    `);

    const rows = Array.isArray(results) ? results : [];
    if (rows.length > 0) {
      const summary = rows.map((row) => ({
        similarity: Number(row.similarity),
        filePath: row.metadata.filePath,
        section: row.metadata.section,
        title: row.metadata.title,
      }));
      console.log('🔍 RAG similarity results:', summary);
    } else {
      console.log('🔍 RAG similarity results: no matches');
    }
    return rows.map((row) => ({
      content: row.content,
      similarity: Number(row.similarity),
      metadata: row.metadata,
    }));
  } catch (error) {
    console.error('Error performing semantic search:', error);
    // If vector search fails (e.g., table doesn't exist), return empty results
    return [];
  }
}

/**
 * Check if RAG is available (blogChunk table has data)
 */
export async function isRAGAvailable(): Promise<boolean> {
  const db = getDb();
  
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogChunk)
      .limit(1);

    return result.length > 0 && Number(result[0].count) > 0;
  } catch (error) {
    // Table might not exist yet
    return false;
  }
}

/**
 * Get all blog chunks for a user (for debugging)
 */
export async function getAllChunks() {
  const db = getDb();
  
  try {
    return await db
      .select({
        id: blogChunk.id,
        content: blogChunk.content,
        metadata: blogChunk.metadata,
        createdAt: blogChunk.createdAt,
      })
      .from(blogChunk)
      .orderBy(desc(blogChunk.createdAt));
  } catch (error) {
    console.error('Error fetching chunks:', error);
    return [];
  }
}

/**
 * Build context string from search results
 */
export function buildContextFromSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return '';
  }

  return results
    .map((result, index) => {
      return `## Relevant Context ${index + 1} (Similarity: ${(result.similarity * 100).toFixed(1)}%)
Source: ${result.metadata.filePath}${result.metadata.title ? ` - ${result.metadata.title}` : ''}

${result.content}`;
    })
    .join('\n\n---\n\n');
}
