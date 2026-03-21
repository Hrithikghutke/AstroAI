import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { addCredits, activateSubscription } from "@/lib/firestore";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type } = body;

  if (type === "topup") {
    // Verify one-time payment
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      credits,
    } = body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    await addCredits(userId, parseInt(credits));
    return NextResponse.json({ success: true, credits });
  }

  if (type === "subscription") {
    // Verify subscription payment
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      plan,
      period,
      credits,
    } = body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    await activateSubscription(
      userId,
      razorpay_subscription_id,
      plan,
      period,
      parseInt(credits),
    );
    return NextResponse.json({ success: true, credits });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
