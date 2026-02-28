import { createContext, useContext } from "react";
import { Branding, ThemeStyle } from "@/types/layout";

interface BrandContextValue extends Branding {
  theme: "light" | "dark";
  themeStyle: ThemeStyle;
  logo?: string; // ← NEW
}

export const BrandContext = createContext<BrandContextValue | null>(null);

export const useBrand = (): BrandContextValue => {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    return {
      logoText: "Brand",
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      fontStyle: "normal",
      theme: "dark",
      themeStyle: "corporate",
      logo: undefined, // ← NEW
    };
  }
  return ctx;
};
