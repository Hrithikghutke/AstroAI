"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";

export default function Features({ data }: any) {
  const brand = useBrand();
  const theme = getThemeClasses(brand.themeStyle, brand.theme === "dark");

  return (
    <section className={`py-24 px-6 ${theme.altSectionBg}`}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className={`inline-block mb-4 ${theme.badgeClass}`}>
            Features
          </span>
          <h2
            className={`text-3xl md:text-5xl ${theme.headlineClass}`}
            style={{ color: brand.theme === "dark" ? "#ffffff" : "#0a0a0a" }}
          >
            {data.headline}
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.features?.map((feature: any, i: number) => (
            <div key={i} className={`${theme.card} ${theme.cardHover} group`}>
              {/* Emoji Icon */}
              {feature.icon && (
                <div
                  className="text-2xl mb-4 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${brand.primaryColor}22` }}
                >
                  {feature.icon}
                </div>
              )}

              <h3
                className="text-base font-semibold mb-2"
                style={{
                  color: brand.theme === "dark" ? "#ffffff" : "#0a0a0a",
                }}
              >
                {feature.title}
              </h3>

              {feature.description && (
                <p className={`text-sm leading-relaxed ${theme.subtextClass}`}>
                  {feature.description}
                </p>
              )}

              {/* Animated accent line on hover */}
              <div
                className="mt-4 h-0.5 w-0 group-hover:w-12 transition-all duration-300 rounded-full"
                style={{ backgroundColor: brand.primaryColor }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
