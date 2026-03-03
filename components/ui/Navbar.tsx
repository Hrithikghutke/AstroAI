"use client";

import React from "react";
import { useBrand } from "@/context/BrandContext";
import EditableText from "@/components/ui/EditableText";

export default function Navbar({
  editable = false,
  onUpdate,
  phone,
}: {
  editable?: boolean;
  onUpdate?: (field: string, value: string) => void;
  phone?: string;
}) {
  const brand = useBrand();
  const isDark = brand.theme === "dark";

  return (
    <nav
      className="flex justify-between items-center px-4 @md:px-8 py-4 @md:py-5 sticky top-0 z-50 backdrop-blur-md border-b gap-3"
      style={{
        borderColor: brand.primaryColor + "22",
        backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)",
        color: isDark ? "#ffffff" : "#0a0a0a",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 font-semibold text-base @md:text-lg shrink-0">
        {brand.logo && brand.logo.startsWith("<svg") ? (
          <span
            style={{
              width: 32,
              height: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            dangerouslySetInnerHTML={{
              __html: brand.logo
                .replace(/width="48"/, 'width="32"')
                .replace(/height="48"/, 'height="32"'),
            }}
          />
        ) : (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: brand.primaryColor }}
          />
        )}
        <span className="truncate max-w-32 @md:max-w-none">
          {editable ? (
            <EditableText
              value={brand.logoText || "Brand"}
              onSave={(v) => onUpdate?.("logoText", v)}
            />
          ) : (
            brand.logoText || "Brand"
          )}
        </span>
      </div>

      {/* Nav Links */}
      <div className="hidden @md:flex gap-6 text-sm font-medium opacity-75">
        <a href="#features" className="hover:opacity-100 transition-opacity">
          Features
        </a>
        <a href="#pricing" className="hover:opacity-100 transition-opacity">
          Pricing
        </a>
        <a href="#contact" className="hover:opacity-100 transition-opacity">
          Contact
        </a>
      </div>

      {/* Right side: phone + CTA */}
      <div className="flex items-center gap-2 @md:gap-4 shrink-0">
        {phone
          ? React.createElement(
              "a",
              {
                href: "tel:" + phone,
                className:
                  "hidden @md:flex items-center gap-1.5 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity",
                style: { color: isDark ? "#ffffff" : "#0a0a0a" },
              },
              React.createElement("span", null, "📞"),
              React.createElement("span", null, phone),
            )
          : null}

        <button
          className="px-3 py-1.5 @md:px-5 @md:py-2 rounded-lg text-xs @md:text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: brand.primaryColor, color: "#ffffff" }}
        >
          <span className="hidden @sm:inline">Get Started</span>
          <span className="@sm:hidden">Start</span>
        </button>
      </div>
    </nav>
  );
}
