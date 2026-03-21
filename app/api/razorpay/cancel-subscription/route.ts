import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Razorpay from "razorpay";
import { cancelSubscription, getUserSubscription } from "@/lib/firestore";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sub = await getUserSubscription(userId);
    if (!sub?.subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 },
      );
    }

    // Fetch subscription details to get current period end date
    const rzpSub = await razorpay.subscriptions.fetch(sub.subscriptionId);

    // current_end is Unix timestamp of when current billing period ends
    const endDate = rzpSub.current_end
      ? new Date((rzpSub.current_end as number) * 1000)
      : null;

    // Cancel at Razorpay — cancel_at_cycle_end=1 means
    // user keeps access till end of billing period
    await razorpay.subscriptions.cancel(sub.subscriptionId, true);

    // Update Firestore with end date so UI knows when access expires
    await cancelSubscription(userId, endDate ?? undefined);

    console.log(`[Razorpay] Cancelled subscription — access until: ${endDate}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Razorpay] Cancel failed:", err);
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }
}
