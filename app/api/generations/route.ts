import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserGenerations } from "@/lib/firestore";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const generations = await getUserGenerations(userId);
    return NextResponse.json({ generations });
  } catch (error) {
    console.error("Get generations error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
