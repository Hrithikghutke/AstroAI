"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";

export default function Pricing({ data }: any) {
  const brand = useBrand();
  const theme = getThemeClasses(brand.themeStyle, brand.theme === "dark");

  return (
    <section className={`py-24 px-6 ${theme.sectionBg}`}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className={`inline-block mb-4 ${theme.badgeClass}`}>
            Pricing
          </span>
          <h2
            className={`text-3xl md:text-5xl ${theme.headlineClass}`}
            style={{ color: brand.theme === "dark" ? "#ffffff" : "#0a0a0a" }}
          >
            {data.headline}
          </h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {data.pricingOptions?.map((plan: any, i: number) => {
            const isHighlighted = !!plan.highlight;

            return (
              <div
                key={i}
                className={`relative flex flex-col rounded-2xl p-8 border transition-all duration-200 ${theme.cardHover}`}
                style={{
                  background: plan.style?.background
                    ? plan.style.background
                    : brand.theme === "dark"
                      ? isHighlighted
                        ? brand.primaryColor
                        : "#111111"
                      : isHighlighted
                        ? brand.primaryColor
                        : "#ffffff",
                  color: plan.style?.textColor
                    ? plan.style.textColor
                    : isHighlighted
                      ? "#ffffff"
                      : brand.theme === "dark"
                        ? "#ffffff"
                        : "#0a0a0a",
                  borderColor: plan.style?.borderColor
                    ? plan.style.borderColor
                    : isHighlighted
                      ? "transparent"
                      : brand.theme === "dark"
                        ? "#2a2a2a"
                        : "#e5e7eb",
                  boxShadow: isHighlighted
                    ? `0 20px 60px ${brand.primaryColor}44`
                    : "none",
                  transform: isHighlighted ? "scale(1.03)" : "scale(1)",
                }}
              >
                {/* Most Popular Badge */}
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span
                      className="text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap"
                      style={{
                        background: "#ffffff",
                        color: brand.primaryColor,
                      }}
                    >
                      ⭐ {plan.highlight.text}
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>

                {/* Price */}
                <div className="mb-3">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {plan.price}
                  </span>
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="text-sm opacity-70 mb-6 leading-relaxed">
                    {plan.description}
                  </p>
                )}

                {/* Divider */}
                <div
                  className="h-px mb-6 opacity-20"
                  style={{
                    background: isHighlighted ? "#ffffff" : brand.primaryColor,
                  }}
                />

                {/* Features List */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features?.map((f: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <span
                        className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: isHighlighted
                            ? "rgba(255,255,255,0.3)"
                            : `${brand.primaryColor}33`,
                          color: isHighlighted ? "#fff" : brand.primaryColor,
                        }}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
                  style={{
                    background: isHighlighted ? "#ffffff" : brand.primaryColor,
                    color: isHighlighted ? brand.primaryColor : "#ffffff",
                  }}
                >
                  Get Started
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
