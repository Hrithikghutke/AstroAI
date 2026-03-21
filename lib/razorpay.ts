export type Currency = "INR" | "USD";
export type BillingPeriod = "monthly" | "annual";

export interface SubscriptionPlan {
  id: string;
  label: string;
  sublabel: string;
  creditsPerMonth: number;
  monthlyPriceINR: number; // paise — single source of truth
  annualPriceINR: number; // paise — total per year
  popular?: boolean;
  razorpayPlanIdMonthly: string;
  razorpayPlanIdAnnual: string;
}

export interface TopUpPack {
  id: string;
  label: string;
  credits: number;
  priceINR: number; // paise
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    label: "Starter",
    sublabel: "Perfect for individuals",
    creditsPerMonth: 300,
    monthlyPriceINR: 29900, // ₹299
    annualPriceINR: 298800, // ₹2,988 (₹249/mo)
    razorpayPlanIdMonthly:
      process.env.NEXT_PUBLIC_RZP_PLAN_STARTER_MONTHLY ?? "",
    razorpayPlanIdAnnual: process.env.NEXT_PUBLIC_RZP_PLAN_STARTER_ANNUAL ?? "",
  },
  {
    id: "pro",
    label: "Pro",
    sublabel: "For serious builders",
    creditsPerMonth: 1000,
    monthlyPriceINR: 79900, // ₹799
    annualPriceINR: 766800, // ₹7,668 (₹639/mo)
    popular: true,
    razorpayPlanIdMonthly: process.env.NEXT_PUBLIC_RZP_PLAN_PRO_MONTHLY ?? "",
    razorpayPlanIdAnnual: process.env.NEXT_PUBLIC_RZP_PLAN_PRO_ANNUAL ?? "",
  },
  {
    id: "agency",
    label: "Agency",
    sublabel: "For teams and agencies",
    creditsPerMonth: 3000,
    monthlyPriceINR: 199900, // ₹1,999
    annualPriceINR: 1929900, // ₹19,299 (₹1,608/mo)
    razorpayPlanIdMonthly:
      process.env.NEXT_PUBLIC_RZP_PLAN_AGENCY_MONTHLY ?? "",
    razorpayPlanIdAnnual: process.env.NEXT_PUBLIC_RZP_PLAN_AGENCY_ANNUAL ?? "",
  },
];

export const TOPUP_PACKS: TopUpPack[] = [
  {
    id: "topup_100",
    label: "Quick Boost",
    credits: 100,
    priceINR: 14900, // ₹149
  },
  {
    id: "topup_500",
    label: "Power Pack",
    credits: 500,
    priceINR: 59900, // ₹599
    popular: true,
  },
  {
    id: "topup_1500",
    label: "Mega Pack",
    credits: 1500,
    priceINR: 149900, // ₹1,499
  },
];

// ── Display helpers ──
// USD conversion rate — update periodically or fetch live
const USD_TO_INR = 84;

export function formatPrice(
  priceINR: number,
  userCurrency: "INR" | "USD",
): string {
  if (userCurrency === "INR") {
    return `₹${(priceINR / 100).toLocaleString("en-IN")}`;
  }
  // Show USD equivalent as display label only — actual charge is INR
  const usd = Math.round(priceINR / 100 / USD_TO_INR);
  return `$${usd}`;
}

export function getMonthlyEquivalent(
  plan: SubscriptionPlan,
  period: BillingPeriod,
  userCurrency: "INR" | "USD",
): string {
  if (period === "monthly")
    return formatPrice(plan.monthlyPriceINR, userCurrency);
  const monthlyINR = Math.round(plan.annualPriceINR / 12);
  return formatPrice(monthlyINR, userCurrency);
}

export function getRazorpayPlanId(
  plan: SubscriptionPlan,
  period: BillingPeriod,
): string {
  return period === "monthly"
    ? plan.razorpayPlanIdMonthly
    : plan.razorpayPlanIdAnnual;
}
