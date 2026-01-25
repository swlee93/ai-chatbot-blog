import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { blogChunk } from "../lib/db/schema.js";

// Load environment variables
config({ path: ".env.local" });

// Initialize connection
const connectionString = process.env.POSTGRES_URL!;
if (!connectionString) {
  console.error("❌ POSTGRES_URL not found in environment variables");
  process.exit(1);
}
const client = postgres(connectionString);
const db = drizzle(client);

async function checkDB() {
  console.log("🔍 Checking DB chunks by file...\n");

  const allChunks = await db.select().from(blogChunk);

  // Group by file
  const byFile = new Map<string, number>();
  allChunks.forEach((chunk) => {
    const filePath = chunk.metadata?.filePath || 'unknown';
    const count = byFile.get(filePath) || 0;
    byFile.set(filePath, count + 1);
  });

  console.log(`📊 Total chunks in DB: ${allChunks.length}\n`);

  console.log("📁 Chunks by file:");
  Array.from(byFile.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([filePath, count]) => {
      console.log(`  ${filePath}: ${count} chunks`);
    });

  // Check for factor
  const hasFactor = Array.from(byFile.keys()).some(path => 
    path.toLowerCase().includes('factor')
  );

  console.log(`\n🔎 Contains factor-analysis: ${hasFactor ? '✅ YES' : '❌ NO'}`);

  await client.end();
  process.exit(0);
}

checkDB().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
