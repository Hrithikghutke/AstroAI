import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Razorpay from "razorpay";
import { TOPUP_PACKS } from "@/lib/razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { packId } = await req.json();
  const pack = TOPUP_PACKS.find((p) => p.id === packId);

  if (!pack) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }

  const amount = pack.priceINR; // always INR — single currency
  const currency = "INR";

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `tu_${userId.slice(-8)}_${Date.now().toString().slice(-10)}`,
      notes: {
        userId,
        packId,
        credits: pack.credits.toString(),
        type: "topup",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount,
      currency,
      credits: pack.credits,
    });
  } catch (err: any) {
    console.error("[Razorpay] Order creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
