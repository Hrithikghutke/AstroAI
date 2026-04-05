import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveGeneration, updateGeneration } from "@/lib/firestore";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, layout, deepHtml, thumbnail } = await req.json();

    if (!layout && !deepHtml) {
      return NextResponse.json(
        { error: "No content provided" },
        { status: 400 },
      );
    }

    const { id, shareId } = await saveGeneration(
      userId,
      prompt ?? "",
      layout ?? null,
      deepHtml ?? null,
      thumbnail ?? null
    );
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

    const { id, prompt, layout, deepHtml, thumbnail } = await req.json();

    if (!id || (!layout && !deepHtml)) {
      return NextResponse.json(
        { error: "Missing id or content" },
        { status: 400 },
      );
    }

    await updateGeneration(
      id,
      userId,
      layout ?? null,
      prompt ?? "",
      deepHtml ?? null,
      thumbnail ?? null
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update generation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
