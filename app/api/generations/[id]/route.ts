import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteGeneration } from "@/lib/firestore";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteGeneration(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete generation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
