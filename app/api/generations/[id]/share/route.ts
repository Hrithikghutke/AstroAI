import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    return NextResponse.json({ shareId: snap.data().shareId });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
