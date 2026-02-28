import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveGeneration, updateGeneration } from "@/lib/firestore";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, layout } = await req.json();

    if (!layout) {
      return NextResponse.json(
        { error: "No layout provided" },
        { status: 400 },
      );
    }

    const { id, shareId } = await saveGeneration(userId, prompt ?? "", layout);
    return NextResponse.json({ id, shareId });
  } catch (error) {
    console.error("Save generation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, prompt, layout } = await req.json();

    if (!id || !layout) {
      return NextResponse.json(
        { error: "Missing id or layout" },
        { status: 400 },
      );
    }

    await updateGeneration(id, userId, layout, prompt ?? "");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update generation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
