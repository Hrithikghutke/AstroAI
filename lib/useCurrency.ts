"use client";

import { useState, useEffect } from "react";
import type { Currency } from "./razorpay";

export function useCurrency(): Currency {
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");

  useEffect(() => {
    fetch(
      `https://ipinfo.io/json${process.env.NEXT_PUBLIC_IPINFO_TOKEN ? `?token=${process.env.NEXT_PUBLIC_IPINFO_TOKEN}` : ""}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.country === "IN") setCurrency("INR");
      })
      .catch(() => {}); // fallback to USD on error
  }, []);

  return currency;
}
