"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";

export default function Hero({ data }: any) {
  const brand = useBrand();
  const theme = getThemeClasses(brand.themeStyle, brand.theme === "dark");
  const { headline, subtext, cta } = data;

  return (
    <section
      className={`relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-32 overflow-hidden ${theme.sectionBg}`}
    >
      {/* Subtle background glow using primaryColor */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 20%, ${brand.primaryColor}, transparent)`,
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Badge */}
        <span className={`inline-block mb-2 ${theme.badgeClass}`}>
          ✦ {brand.logoText}
        </span>

        {/* Headline */}
        <h1
          className={`text-4xl md:text-6xl lg:text-7xl leading-tight ${theme.headlineClass}`}
          style={{
            fontWeight:
              brand.themeStyle === "bold"
                ? "900"
                : brand.themeStyle === "elegant"
                  ? "400"
                  : "700",
          }}
        >
          {headline}
        </h1>

        {/* Subtext */}
        {subtext && (
          <p
            className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${theme.subtextClass}`}
          >
            {subtext}
          </p>
        )}

        {/* CTA Button */}
        {cta && (
          <div className="pt-4">
            <button
              className="px-8 py-4 text-base font-semibold transition-all duration-300 inline-block"
              style={{
                background: cta.style?.background ?? brand.primaryColor,
                color: cta.style?.textColor ?? "#ffffff",
                borderRadius: cta.style?.borderRadius ?? "12px",
                fontWeight: cta.style?.fontWeight ?? "600",
              }}
              onMouseEnter={(e) => {
                if (cta.style?.hoverEffect?.background) {
                  e.currentTarget.style.background =
                    cta.style.hoverEffect.background;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 8px 30px ${brand.primaryColor}66`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  cta.style?.background ?? brand.primaryColor;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {cta.text}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
