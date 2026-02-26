import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createUserRecord } from "@/lib/firestore";

export async function POST(req: Request) {
  console.log("=== Webhook received ===");

  // Step 1 — Check secret exists
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("❌ CLERK_WEBHOOK_SECRET is missing from .env.local");
    return NextResponse.json({ error: "No webhook secret" }, { status: 400 });
  }
  console.log("✅ Secret found:", WEBHOOK_SECRET.slice(0, 10) + "...");

  // Step 2 — Check svix headers
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  console.log("svix-id:", svix_id);
  console.log("svix-timestamp:", svix_timestamp);
  console.log("svix-signature:", svix_signature?.slice(0, 20) + "...");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("❌ Missing svix headers");
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }
  console.log("✅ Svix headers present");

  // Step 3 — Read raw body
  const body = await req.text();
  console.log("✅ Body length:", body.length);

  // Step 4 — Verify signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
    console.log("✅ Signature verified");
  } catch (err: any) {
    console.error("❌ Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Step 5 — Handle event
  console.log("Event type:", evt.type);

  if (evt.type === "user.created") {
    const { id, email_addresses } = evt.data;
    const email = email_addresses?.[0]?.email_address ?? "";
    console.log("Creating user record for:", id, email);

    try {
      await createUserRecord(id, email);
      console.log("✅ User created in Firestore");
    } catch (err: any) {
      console.error("❌ Firestore error:", err.message);
      return NextResponse.json({ error: "Firestore error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
