import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId, plan, period, credits } = await req.json();

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: period === "annual" ? 1 : 12, // annual = 1 charge, monthly = 12
      quantity: 1,
      notes: {
        userId,
        plan,
        period,
        credits: credits.toString(),
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
    });
  } catch (err: any) {
    console.error("[Razorpay] Subscription creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}
