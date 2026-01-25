#!/usr/bin/env tsx
/**
 * RAG Sync Script
 * 
 * This script synchronizes blog content to the vector database.
 * It reads markdown files from the content directory, chunks them,
 * generates embeddings, and stores them in Supabase with pgvector.
 * 
 * Usage:
 *   npm run rag:sync
 *   npm run rag:sync -- --user-id=<uuid>
 */

import { config } from 'dotenv';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { blogChunk, user } from '../lib/db/schema';
import {
    estimateTokens,
    formatSize,
    loadBlogContent,
    shouldUseRAG,
} from '../lib/blog/content';
import {
    chunkBlogContent,
    generateEmbeddings,
    getChunkStats,
} from '../lib/blog/embeddings';

// Load environment variables
config({ path: '.env.local' });

// Create database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

async function main() {
  console.log('🚀 Starting RAG synchronization...\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const userIdArg = args.find((arg) => arg.startsWith('--user-id='));
  let userId: string;

  if (userIdArg) {
    userId = userIdArg.split('=')[1];
    console.log(`📌 Using provided user ID: ${userId}`);
  } else {
    // Get the first user from the database
    console.log('🔍 Finding blog owner user...');
    const users = await db.select().from(user).limit(1);
    
    if (users.length === 0) {
      console.error('❌ No users found in database. Please create a user first.');
      process.exit(1);
    }
    
    userId = users[0].id;
    console.log(`✅ Using first user: ${userId} (${users[0].email})`);
  }

  // Load blog content
  console.log('\n📖 Loading blog content...');
  const content = await loadBlogContent();
  console.log(`   Total size: ${formatSize(content.totalSize)}`);
  console.log(`   Estimated tokens: ${estimateTokens(content.combined)}`);

  // Check if RAG is needed
  const needsRAG = shouldUseRAG(content);
  console.log(`   RAG needed: ${needsRAG ? 'YES ✅' : 'NO ⚠️  (content < 200KB)'}`);

  if (!needsRAG) {
    console.log('\n⚠️  Content is small enough to use direct context.');
    console.log('   Skipping RAG sync. You can still run this to populate the database.');
    console.log('   Continue anyway? (y/N)');
    
    // In CI/CD, we'll skip if not needed
    if (process.env.CI) {
      console.log('   CI environment detected. Exiting.');
      process.exit(0);
    }
  }

  // Enable pgvector extension
  console.log('\n🔧 Ensuring pgvector extension is enabled...');
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
    console.log('   ✅ pgvector extension enabled');
  } catch (error) {
    console.error('   ❌ Failed to enable pgvector extension:', error);
    console.error('   Please run this SQL manually in your database:');
    console.error('   CREATE EXTENSION IF NOT EXISTS vector;');
    process.exit(1);
  }

  // Create vector index for performance
  console.log('\n📊 Creating/verifying vector index...');
  try {
    // IVFFlat index: balance between accuracy and speed
    // lists = sqrt(total expected chunk count)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_blog_embedding_ivfflat
      ON "BlogChunk"
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);
    console.log('   ✅ Vector index created (IVFFlat)');
    console.log('   💡 Expected search speedup: 50-70%');
  } catch (error) {
    console.warn('   ⚠️  Failed to create index (may already exist):', error);
    console.log('   Continuing without index optimization...');
  }

  // Delete existing chunks for this user
  console.log('\n🗑️  Removing old chunks...');
  const deleteResult = await db
    .delete(blogChunk)
    .where(eq(blogChunk.userId, userId));
  console.log(`   ✅ Removed old chunks`);

  // Chunk the content
  console.log('\n✂️  Chunking content...');
  const chunks = chunkBlogContent(content);
  const stats = getChunkStats(chunks);
  
  console.log(`   ✅ Created ${stats.totalChunks} chunks`);
  console.log(`   Average chunk size: ${stats.averageChunkSize} chars`);
  console.log(`   Total tokens (estimated): ${stats.estimatedTokens}`);

  // Generate embeddings
  console.log('\n🧠 Generating embeddings with OpenAI...');
  console.log('   This may take a moment...');
  
  const startTime = Date.now();
  const embeddedChunks = await generateEmbeddings(chunks);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`   ✅ Generated ${embeddedChunks.length} embeddings in ${duration}s`);
  console.log(`   Cost estimate: ~$${(stats.estimatedTokens / 1000000 * 0.02).toFixed(4)}`);

  // Store in database
  console.log('\n💾 Storing chunks in database...');
  
  for (let i = 0; i < embeddedChunks.length; i++) {
    const { chunk, embedding } = embeddedChunks[i];
    
    await db.insert(blogChunk).values({
      userId,
      content: chunk.content,
      embedding: embedding as number[], // pgvector expects number array
      metadata: chunk.metadata,
      createdAt: new Date(),
    });

    // Progress indicator
    if ((i + 1) % 5 === 0 || i === embeddedChunks.length - 1) {
      process.stdout.write(`\r   Progress: ${i + 1}/${embeddedChunks.length} chunks`);
    }
  }

  console.log('\n   ✅ All chunks stored successfully');

  // Verify the data
  console.log('\n🔍 Verifying stored data...');
  const verifyResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogChunk)
    .where(eq(blogChunk.userId, userId));

  console.log(`   ✅ Found ${verifyResult[0].count} chunks in database`);

  console.log('\n✨ RAG synchronization completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - User ID: ${userId}`);
  console.log(`   - Total chunks: ${stats.totalChunks}`);
  console.log(`   - Total size: ${stats.sizeKB} KB`);
  console.log(`   - Estimated tokens: ${stats.estimatedTokens}`);
  console.log(`   - Generation time: ${duration}s`);
  console.log('\n🎉 Blog content is now searchable with semantic search!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
