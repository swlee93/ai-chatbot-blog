import { config } from "dotenv";
import { loadBlogContent } from "../lib/blog/content.js";
import { chunkBlogContent } from "../lib/blog/embeddings.js";

// Load environment variables
config({ path: ".env.local" });

async function checkChunking() {
  console.log("🔍 Checking content chunking...\n");

  const content = await loadBlogContent("ko");
  const chunks = chunkBlogContent(content);

  console.log(`📊 Total chunks: ${chunks.length}\n`);

  // Group chunks by file
  const chunksByFile = new Map<string, number>();
  chunks.forEach((chunk) => {
    const count = chunksByFile.get(chunk.metadata.filePath) || 0;
    chunksByFile.set(chunk.metadata.filePath, count + 1);
  });

  console.log("📁 Chunks by file:");
  Array.from(chunksByFile.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([filePath, count]) => {
      console.log(`  ${filePath}: ${count} chunks`);
    });

  // Check for factor-analysis
  const factorChunks = chunks.filter(c => 
    c.metadata.filePath.includes('factor')
  );

  console.log(`\n🔎 factor-analysis chunks: ${factorChunks.length}`);
  if (factorChunks.length > 0) {
    console.log('\nFirst 3 sections:');
    factorChunks.slice(0, 3).forEach((chunk, idx) => {
      console.log(`  ${idx + 1}. Section: ${chunk.metadata.section}`);
      console.log(`     Content: ${chunk.content.substring(0, 100)}...`);
      console.log('');
    });
  }

  process.exit(0);
}

checkChunking().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
