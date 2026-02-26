import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserCredits } from "@/lib/firestore";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credits = await getUserCredits(userId);
  return NextResponse.json({ credits });
}
