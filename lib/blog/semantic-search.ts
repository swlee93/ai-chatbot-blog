import { blogChunk } from '@/lib/db/schema';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { desc, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Lazy connection - only create when needed
let _client: ReturnType<typeof postgres> | null = null;
let _db: PostgresJsDatabase | null = null;
let _cachedUserId: string | null = null;

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

/**
 * Get the default blog owner's user ID
 * Caches the result to avoid repeated queries
 */
async function getUserId(): Promise<string> {
  if (_cachedUserId) {
    return _cachedUserId;
  }

  const db = getDb();
  try {
    const result = await db.execute<{ id: string }>(
      sql`SELECT id FROM "User" LIMIT 1`
    );
    const rows = Array.isArray(result) ? result : [];
    if (rows.length === 0) {
      throw new Error('No user found in database');
    }
    _cachedUserId = rows[0].id;
    return _cachedUserId;
  } catch (error) {
    console.error('Error fetching user ID:', error);
    throw error;
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
  const userId = await getUserId();
  
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
      WHERE "userId" = ${userId}
        AND (1 - (embedding <=> ${embeddingString}::vector)) >= ${minSimilarity}
      ORDER BY embedding <=> ${embeddingString}::vector
      LIMIT ${topK}
    `);

    const rows = Array.isArray(results) ? results : [];
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
    const userId = await getUserId();
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogChunk)
      .where(eq(blogChunk.userId, userId))
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
    const userId = await getUserId();
    return await db
      .select({
        id: blogChunk.id,
        content: blogChunk.content,
        metadata: blogChunk.metadata,
        createdAt: blogChunk.createdAt,
      })
      .from(blogChunk)
      .where(eq(blogChunk.userId, userId))
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
