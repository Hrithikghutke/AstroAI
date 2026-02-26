"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";

export default function Testimonials({ data }: any) {
  const brand = useBrand();
  const theme = getThemeClasses(brand.themeStyle, brand.theme === "dark");

  return (
    <section className={`py-24 px-6 ${theme.altSectionBg}`}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className={`inline-block mb-4 ${theme.badgeClass}`}>
            Testimonials
          </span>
          <h2
            className={`text-3xl md:text-5xl ${theme.headlineClass}`}
            style={{ color: brand.theme === "dark" ? "#ffffff" : "#0a0a0a" }}
          >
            {data.headline}
          </h2>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {data.testimonials?.map((t: any, i: number) => (
            <div
              key={i}
              className={`${theme.testimonialCard} flex flex-col gap-4 relative overflow-hidden`}
              style={{
                borderLeftColor: t.style?.accentColor ?? brand.primaryColor,
              }}
            >
              {/* Large decorative quote mark */}
              <div
                className="text-5xl font-black leading-none absolute top-3 right-4 opacity-10 select-none"
                style={{ color: t.style?.accentColor ?? brand.primaryColor }}
              >
                "
              </div>

              {/* Review Text */}
              <p
                className={`text-sm leading-relaxed relative z-10 ${theme.subtextClass}`}
              >
                {t.review}
              </p>

              {/* Author Row */}
              <div className="flex items-center gap-3 mt-auto pt-2">
                {/* Avatar with first initial */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{
                    background: t.style?.accentColor ?? brand.primaryColor,
                  }}
                >
                  {t.name?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: brand.theme === "dark" ? "#ffffff" : "#0a0a0a",
                    }}
                  >
                    {t.name}
                  </p>
                  {/* Role — new field added by the upgraded AI prompt */}
                  {t.role && <p className="text-xs opacity-60">{t.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
