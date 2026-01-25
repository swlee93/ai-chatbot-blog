import { auth } from "@/app/(auth)/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    userId: session.user.id,
    email: session.user.email,
    type: session.user.type,
    fullSession: session,
  });
}
