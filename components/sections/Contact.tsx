"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";

export default function Contact({ data }: any) {
  const brand = useBrand();
  const theme = getThemeClasses(brand.themeStyle, brand.theme === "dark");
  const details = data.contactDetails;

  // Build the list of contact items — only show ones that have a value
  const contactItems = [
    details?.phone && { icon: "📞", label: "Phone", value: details.phone },
    details?.email && { icon: "✉️", label: "Email", value: details.email },
    details?.address && {
      icon: "📍",
      label: "Address",
      value: details.address,
    },
    details?.hours && {
      icon: "🕐",
      label: "Hours",
      value: `${details.hours.open} – ${details.hours.close}${
        details.hours.days?.length
          ? ` · ${details.hours.days.slice(0, 5).join(", ")}`
          : ""
      }`,
    },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  return (
    <section className={`py-24 px-6 ${theme.sectionBg}`}>
      <div className="max-w-3xl mx-auto text-center">
        {/* Section Header */}
        <span className={`inline-block mb-4 ${theme.badgeClass}`}>Contact</span>
        <h2
          className={`text-3xl md:text-5xl mb-4 ${theme.headlineClass}`}
          style={{ color: brand.theme === "dark" ? "#ffffff" : "#0a0a0a" }}
        >
          {data.headline}
        </h2>
        <p className={`text-base mb-12 ${theme.subtextClass}`}>
          We'd love to hear from you. Reach out through any of the channels
          below.
        </p>

        {/* Contact Detail Cards */}
        {contactItems.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4 mb-10 text-left">
            {contactItems.map((item, i) => (
              <div key={i} className={`${theme.card} flex items-start gap-4`}>
                <span className="text-xl mt-0.5 shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-0.5">
                    {item.label}
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: brand.theme === "dark" ? "#e5e5e5" : "#1a1a1a",
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        {data.cta && (
          <button
            className="px-10 py-4 font-semibold text-base transition-all duration-200 hover:opacity-90 hover:scale-105"
            style={{
              background: data.cta.style?.background ?? brand.primaryColor,
              color: data.cta.style?.textColor ?? "#ffffff",
              borderRadius: data.cta.style?.borderRadius ?? "12px",
              fontWeight: data.cta.style?.fontWeight ?? "600",
            }}
          >
            {data.cta.text}
          </button>
        )}
      </div>
    </section>
  );
}
