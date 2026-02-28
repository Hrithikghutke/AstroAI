"use client";

import { useBrand } from "@/context/BrandContext";

export default function Navbar() {
  const brand = useBrand();

  return (
    <nav
      className="flex justify-between items-center px-8 py-5 sticky top-0 z-50 backdrop-blur-md border-b"
      style={{
        borderColor: `${brand.primaryColor}22`,
        backgroundColor:
          brand.theme === "dark" ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)",
        color: brand.theme === "dark" ? "#ffffff" : "#0a0a0a",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 font-semibold text-lg">
        {brand.logo && brand.logo.startsWith("<svg") ? (
          <span dangerouslySetInnerHTML={{ __html: brand.logo }} />
        ) : (
          <span className="w-3 h-3 rounded-full shrink-0" />
        )}
        {brand.logoText || "Brand"}
      </div>

      {/* Nav Links */}
      <div className="hidden md:flex gap-7 text-sm font-medium opacity-75">
        <a href="#" className="hover:opacity-100 transition-opacity">
          Features
        </a>
        <a href="#" className="hover:opacity-100 transition-opacity">
          Pricing
        </a>
        <a href="#" className="hover:opacity-100 transition-opacity">
          Contact
        </a>
      </div>

      {/* CTA */}
      <button
        className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
        style={{
          backgroundColor: brand.primaryColor,
          color: "#ffffff",
        }}
      >
        Get Started
      </button>
    </nav>
  );
}
