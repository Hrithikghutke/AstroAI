import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteGeneration } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const ref = doc(db, "generations", id);
    const snap = await getDoc(ref);

    if (!snap.exists())
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (snap.data().clerkUserId !== userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({
      generation: {
        id: snap.id,
        ...snap.data(),
        createdAt: snap.data().createdAt?.toDate?.()?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("Get generation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
