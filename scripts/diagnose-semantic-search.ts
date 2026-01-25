#!/usr/bin/env tsx
/**
 * Diagnostic script for the semanticSearch function
 */

import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { config } from 'dotenv';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { blogChunk, user } from '../lib/db/schema';
import { semanticSearch } from '../lib/blog/semantic-search';

config({ path: '.env.local' });

async function diagnose() {
  console.log('🔍 Diagnosing semanticSearch function\n');
  console.log('='.repeat(80));

  const client = postgres(process.env.POSTGRES_URL!);
  const db = drizzle(client);

  // Get user
  const users = await db.select().from(user).limit(1);
  if (users.length === 0) {
    console.error('❌ No users found');
    process.exit(1);
  }
  const userId = users[0].id;
  console.log(`✅ User ID: ${userId}\n`);

  // Check chunks exist
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogChunk)
    .where(eq(blogChunk.userId, userId));
  const chunkCount = Number(countResult[0].count);
  console.log(`✅ Total chunks in DB: ${chunkCount}\n`);

  if (chunkCount === 0) {
    console.error('❌ No chunks found. Run pnpm rag:sync first.');
    process.exit(1);
  }

  // Test queries
  const testQueries = [
    'What projects used React and TypeScript?',
    'Tell me about building a data platform at Mayi',
    'What did you learn while implementing the RAG system?',
  ];

  for (const query of testQueries) {
    console.log('='.repeat(80));
    console.log(`Query: "${query}"`);
    console.log('-'.repeat(80));

    try {
      // Test 1: Generate embedding directly
      console.log('\n1️⃣ Testing embedding generation...');
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: query,
      });
      console.log(`   ✅ Embedding generated: ${Array.from(embedding).length} dimensions`);

      // Test 2: Execute raw SQL query with 20% threshold
      console.log('\n2️⃣ Testing raw SQL query with 20% minimum similarity...');
      const embeddingString = `[${Array.from(embedding).join(',')}]`;
      const rawResults = await db.execute(sql`
        SELECT 
          content,
          metadata,
          1 - (embedding <=> ${embeddingString}::vector) AS similarity
        FROM "BlogChunk"
        WHERE "userId" = ${userId}
          AND (1 - (embedding <=> ${embeddingString}::vector)) >= 0.20
        ORDER BY embedding <=> ${embeddingString}::vector
        LIMIT 5
      `);
      const rows = Array.isArray(rawResults) ? rawResults : [];
      console.log(`   ✅ Raw query returned: ${rows.length} results`);

      // Test 3: Use semanticSearch function
      // Test 3: Test semanticSearch function (now without userId parameter)
      console.log('\n3️⃣ Testing semanticSearch function...');
      const searchResults = await semanticSearch(query, 5, 0.20);
      console.log(`   ${searchResults.length > 0 ? '✅' : '❌'} semanticSearch returned: ${searchResults.length} results`);

      if (searchResults.length > 0) {
        console.log('\n📊 Results:');
        searchResults.forEach((result, idx) => {
          console.log(`   ${idx + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
          console.log(`      File: ${result.metadata.filePath}`);
          console.log(`      Section: ${result.metadata.section}`);
        });
      } else {
        console.log('\n⚠️  No results found. Possible reasons:');
        console.log('   - Connection issue with postgres client in semantic-search.ts');
        console.log('   - results.rows is undefined or empty');
        console.log('   - Error caught and returned empty array');
      }

    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}`);
      console.error(error.stack);
    }

    console.log('');
  }

  console.log('='.repeat(80));
  console.log('\n💡 Diagnosis complete\n');

  await client.end();
}

diagnose().catch(console.error);
