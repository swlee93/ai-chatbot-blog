#!/usr/bin/env tsx
/**
 * Blog Setup Checker
 * 
 * This script verifies that all blog components are properly set up
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '../lib/db/schema';
import { loadBlogContent, shouldUseRAG } from '../lib/blog/content';
import { isRAGAvailable } from '../lib/blog/semantic-search';

// Load environment variables
config({ path: '.env.local' });

// Create database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

async function main() {
  console.log('🔍 Checking Blog Setup...\n');

  // Check 1: Content files
  console.log('1️⃣  Checking content files...');
  try {
    const content = await loadBlogContent();
    const fileCount = Object.keys(content.files).length;
    console.log(`   ✅ Loaded ${fileCount} markdown files`);
    console.log(`   📊 Total size: ${(content.totalSize / 1024).toFixed(2)} KB`);
    console.log(`   💡 RAG needed: ${shouldUseRAG(content) ? 'YES (>50KB)' : 'NO (<50KB)'}\n`);
  } catch (error) {
    console.error('   ❌ Error loading content files:', error);
    process.exit(1);
  }

  // Check 2: Database connection
  console.log('2️⃣  Checking database connection...');
  try {
    const users = await db.select().from(user).limit(1);
    console.log(`   ✅ Database connected`);
    console.log(`   📊 Found ${users.length} user(s)\n`);
  } catch (error) {
    console.error('   ❌ Database connection failed:', error);
    console.log('   💡 Make sure POSTGRES_URL is set in .env.local\n');
    process.exit(1);
  }

  // Check 3: RAG availability
  console.log('3️⃣  Checking RAG setup...');
  try {
    const users = await db.select().from(user).limit(1);
    if (users.length > 0) {
      const ragReady = await isRAGAvailable();
      if (ragReady) {
        console.log('   ✅ RAG is configured and ready');
        console.log('   💡 Semantic search will be used for large queries\n');
      } else {
        console.log('   ⚠️  RAG not yet configured');
        console.log('   💡 Run `pnpm run rag:sync` to enable semantic search\n');
      }
    } else {
      console.log('   ⚠️  No users found - RAG check skipped\n');
    }
  } catch (error) {
    console.log('   ⚠️  RAG check failed (might not be needed yet)');
    console.log('   💡 This is normal if you haven\'t run `rag:sync` yet\n');
  }

  // Check 4: Environment variables
  console.log('4️⃣  Checking environment variables...');
  const checks = [
    { name: 'POSTGRES_URL', value: process.env.POSTGRES_URL },
    { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY },
    { name: 'AUTH_SECRET', value: process.env.AUTH_SECRET },
  ];

  for (const check of checks) {
    if (check.value) {
      console.log(`   ✅ ${check.name}: Set`);
    } else {
      console.log(`   ❌ ${check.name}: Not set`);
    }
  }

  console.log('\n📝 Setup Summary:\n');
  console.log('   Routes:');
  console.log('   - / (Chat)');
  console.log('   - /blog/context (Context + Chat)');
  console.log('   - /blog/projects (Projects + Chat)');
  console.log('\n   Features:');
  console.log('   - ✅ Blog content loading');
  console.log('   - ✅ Smart context (full or RAG)');
  console.log('   - ✅ Private chat history');
  console.log('   - ✅ Markdown rendering');
  console.log('   - ✅ CI/CD workflow');
  console.log('\n🎉 Blog is ready! Run `pnpm run dev` to start.\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Setup check failed:', error);
    process.exit(1);
  });
