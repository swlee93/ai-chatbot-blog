import { blogReference } from '@/lib/db/schema';
import { count, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { unstable_noStore as noStore } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function GET(request: NextRequest) {
  noStore(); // Prevent static optimization for dynamic data
  
  try {
    console.log('📊 Fetching stats for content');

    // Get reference count per file path only (not per section)
    const stats = await db
      .select({
        filePath: blogReference.filePath,
        hitCount: count(blogReference.id),
      })
      .from(blogReference)
      .groupBy(blogReference.filePath)
      .orderBy(sql`count(${blogReference.id}) DESC`);

    console.log('📊 Stats results:', JSON.stringify(stats, null, 2));

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error loading blog stats:', error);
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    );
  }
}
