import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { blogReference } from "../lib/db/schema.js";

// Load environment variables from .env.local
config({ path: ".env.local" });

// Initialize connection
const connectionString = process.env.POSTGRES_URL!;
if (!connectionString) {
  console.error("❌ POSTGRES_URL not found in environment variables");
  process.exit(1);
}
const client = postgres(connectionString);
const db = drizzle(client);

async function checkReferences() {
  console.log("🔍 Checking blog references...\n");

  // Total reference count
  const totalCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogReference);
  console.log(`📊 Total references: ${totalCount[0].count}\n`);

  // Reference count by file
  const byFile = await db
    .select({
      filePath: blogReference.filePath,
      count: sql<number>`count(*)`,
    })
    .from(blogReference)
    .groupBy(blogReference.filePath)
    .orderBy(sql`count(*) DESC`);

  console.log("📁 References by file:");
  byFile.forEach((row) => {
    console.log(`  ${row.filePath}: ${row.count}`);
  });

  // Find references containing "factor"
  console.log('\n🔎 References containing "factor":');
  const factorRefs = await db
    .select()
    .from(blogReference)
    .where(
      sql`${blogReference.filePath} ILIKE '%factor%' OR ${blogReference.title} ILIKE '%factor%'`
    )
    .limit(20);

  if (factorRefs.length === 0) {
    console.log("  ❌ No references found");
  } else {
    factorRefs.forEach((ref) => {
      console.log(`  ✅ ${ref.filePath}`);
      console.log(`     Title: ${ref.title}`);
      console.log(`     Message ID: ${ref.messageId}`);
      console.log(`     Created: ${ref.createdAt}`);
      console.log("");
    });
  }

  // Print all references
  console.log("\n📋 All references:");
  const allRefs = await db
    .select()
    .from(blogReference)
    .orderBy(sql`${blogReference.createdAt} DESC`);
  
  allRefs.forEach((ref) => {
    console.log(`  ${ref.filePath} - ${ref.title}`);
  });

  // Latest 10 references
  console.log("\n⏰ Recent 10 references:");
  const recent = await db
    .select()
    .from(blogReference)
    .orderBy(sql`${blogReference.createdAt} DESC`)
    .limit(10);

  recent.forEach((ref) => {
    console.log(`  ${ref.filePath} - ${ref.title}`);
    console.log(`    Created: ${ref.createdAt}`);
  });

  await client.end();
  process.exit(0);
}

checkReferences().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
