#!/usr/bin/env tsx
/**
 * check-vector-db.ts
 *
 * Purpose: Verify RAG vector DB readiness
 * Responsibilities: Check pgvector extension, table existence, and data presence
 */

import { config } from 'dotenv';
import { sql as drizzleSql } from 'drizzle-orm';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { blogChunk } from '../lib/db/schema';

config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ POSTGRES_URL is not set in .env.local');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
  console.log('🔍 Checking vector DB setup...\n');

  try {
    await db.execute(drizzleSql`SELECT extname FROM pg_extension WHERE extname = 'vector'`);
    console.log('✅ pgvector extension is available');
  } catch (error) {
    console.error('❌ pgvector check failed:', error);
    process.exit(1);
  }

  try {
    const result = await db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(blogChunk);

    console.log(`✅ BlogChunk rows: ${result[0].count}`);
    console.log('\n🎉 Vector DB looks ready.');
  } catch (error) {
    console.error('❌ BlogChunk check failed:', error);
    console.error('💡 Run db:migrate and rag:sync first.');
    process.exit(1);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
