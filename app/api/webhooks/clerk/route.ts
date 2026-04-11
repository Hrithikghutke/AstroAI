import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createUserRecord } from "@/lib/firestore";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No webhook secret" }, { status: 400 });
  }

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const body = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err: any) {
    console.error("[Clerk Webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses } = evt.data;
    const email = email_addresses?.[0]?.email_address ?? "";

    try {
      await createUserRecord(id, email);
      console.log("[Clerk Webhook] User created:", id);
    } catch (err: any) {
      console.error("[Clerk Webhook] Firestore error:", err.message);
      return NextResponse.json({ error: "Firestore error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
