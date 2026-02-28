import { NextResponse } from "next/server";
import { getGenerationByShareId } from "@/lib/firestore";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    const generation = await getGenerationByShareId(shareId);

    if (!generation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ generation });
  } catch (error) {
    console.error("Preview fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
