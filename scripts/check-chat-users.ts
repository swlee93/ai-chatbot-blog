import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { desc, eq } from "drizzle-orm";
import postgres from "postgres";
import { chat, user } from "@/lib/db/schema";

config({ path: ".env.local" });

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

async function main() {
  console.log("=== User list ===");
  const users = await db.select().from(user).orderBy(user.email);
  
  for (const u of users) {
    console.log(`ID: ${u.id}`);
    console.log(`Email: ${u.email}`);
    console.log(`Password exists: ${!!u.password}`);
    console.log("---");
  }

  console.log("\n=== Chat list (latest 20) ===");
  const chats = await db
    .select({
      chatId: chat.id,
      title: chat.title,
      userId: chat.userId,
      createdAt: chat.createdAt,
    })
    .from(chat)
    .orderBy(desc(chat.createdAt))
    .limit(20);

  for (const c of chats) {
    const owner = users.find(u => u.id === c.userId);
    console.log(`Chat ID: ${c.chatId}`);
    console.log(`Title: ${c.title}`);
    console.log(`Owner ID: ${c.userId}`);
    console.log(`Owner Email: ${owner?.email || "UNKNOWN"}`);
    console.log(`Created: ${c.createdAt}`);
    console.log("---");
  }

  console.log("\n=== Chat count by user ===");
  for (const u of users) {
    const userChats = await db
      .select()
      .from(chat)
      .where(eq(chat.userId, u.id));
    
    console.log(`${u.email}: ${userChats.length} chats`);
  }

  await client.end();
}

main().catch(console.error);
