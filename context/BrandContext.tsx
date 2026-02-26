"use client";

import { createContext, useContext } from "react";
import { Branding, ThemeStyle } from "@/types/layout";

interface BrandContextValue extends Branding {
  theme: "light" | "dark";
  themeStyle: ThemeStyle;
}

export const BrandContext = createContext<BrandContextValue | null>(null);

export const useBrand = (): BrandContextValue => {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    // Safe fallback so components never crash if context is missing
    return {
      logoText: "Brand",
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      fontStyle: "normal",
      theme: "dark",
      themeStyle: "corporate",
    };
  }
  return ctx;
};
