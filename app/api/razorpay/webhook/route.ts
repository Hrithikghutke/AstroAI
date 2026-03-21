import { NextResponse } from "next/server";
import crypto from "crypto";
import { addCredits, activateSubscription } from "@/lib/firestore";
import { SUBSCRIPTION_PLANS } from "@/lib/razorpay";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const notes =
    event.payload?.payment?.entity?.notes ??
    event.payload?.subscription?.entity?.notes ??
    {};

  console.log("[Webhook] Event:", event.event, "| Notes:", notes);

  switch (event.event) {
    // Top-up payment captured
    case "payment.captured": {
      if (notes.type === "topup" && notes.userId && notes.credits) {
        await addCredits(notes.userId, parseInt(notes.credits));
        console.log(
          `[Webhook] Top-up: +${notes.credits} credits → ${notes.userId}`,
        );
      }
      break;
    }

    // Subscription activated (first payment)
    case "subscription.activated": {
      const sub = event.payload.subscription.entity;
      if (notes.userId && notes.credits) {
        await activateSubscription(
          notes.userId,
          sub.id,
          notes.plan,
          notes.period,
          parseInt(notes.credits),
        );
        console.log(
          `[Webhook] Subscription activated: ${notes.plan} → ${notes.userId}`,
        );
      }
      break;
    }

    // Monthly renewal — add credits again
    case "subscription.charged": {
      const sub = event.payload.subscription.entity;
      if (notes.userId && notes.credits) {
        await addCredits(notes.userId, parseInt(notes.credits));
        console.log(
          `[Webhook] Renewal: +${notes.credits} credits → ${notes.userId}`,
        );
      }
      break;
    }

    // Subscription cancelled
    case "subscription.cancelled": {
      if (notes.userId) {
        const { cancelSubscription } = await import("@/lib/firestore");
        await cancelSubscription(notes.userId);
        console.log(`[Webhook] Cancelled → ${notes.userId}`);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
