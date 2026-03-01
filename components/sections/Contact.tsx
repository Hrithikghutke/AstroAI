"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";
import EditableText from "@/components/ui/EditableText";

export default function Contact({
  data,
  editable = false,
  onUpdate,
}: {
  data: any;
  editable?: boolean;
  onUpdate?: (field: string, value: string) => void;
}) {
  const brand = useBrand();
  const theme = getThemeClasses(brand.themeStyle, brand.theme === "dark");
  const details = data.contactDetails;

  return (
    <section className={`py-16 @md:py-24 px-4 @md:px-6 ${theme.sectionBg}`}>
      <div className="max-w-3xl mx-auto text-center">
        <span className={`inline-block mb-4 ${theme.badgeClass}`}>Contact</span>
        <h2
          className={`text-2xl @md:text-3xl @lg:text-5xl mb-4 ${theme.headlineClass}`}
          style={{ color: brand.theme === "dark" ? "#ffffff" : "#0a0a0a" }}
        >
          {editable ? (
            <EditableText
              value={data.headline}
              onSave={(v) => onUpdate?.("headline", v)}
            />
          ) : (
            data.headline
          )}
        </h2>

        <div
          className={`text-sm @md:text-base mb-10 @md:mb-12 ${theme.subtextClass}`}
        >
          {editable ? (
            <EditableText
              value={
                data.subtext ??
                "We'd love to hear from you. Reach out through any of the channels below."
              }
              onSave={(v) => onUpdate?.("subtext", v)}
              multiline
            />
          ) : (
            (data.subtext ??
            "We'd love to hear from you. Reach out through any of the channels below.")
          )}
        </div>

        <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3 @md:gap-4 mb-8 @md:mb-10 text-left">
          {details?.phone && (
            <div className={`${theme.card} flex items-start gap-3`}>
              <span className="text-lg mt-0.5 shrink-0">📞</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-0.5">
                  Phone
                </div>
                <div
                  className="text-sm font-medium wrap-break-word"
                  style={{
                    color: brand.theme === "dark" ? "#e5e5e5" : "#1a1a1a",
                  }}
                >
                  {editable ? (
                    <EditableText
                      value={details.phone}
                      onSave={(v) => onUpdate?.("contactDetails.phone", v)}
                    />
                  ) : (
                    details.phone
                  )}
                </div>
              </div>
            </div>
          )}
          {details?.email && (
            <div className={`${theme.card} flex items-start gap-3`}>
              <span className="text-lg mt-0.5 shrink-0">✉️</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-0.5">
                  Email
                </div>
                <div
                  className="text-sm font-medium break-all"
                  style={{
                    color: brand.theme === "dark" ? "#e5e5e5" : "#1a1a1a",
                  }}
                >
                  {editable ? (
                    <EditableText
                      value={details.email}
                      onSave={(v) => onUpdate?.("contactDetails.email", v)}
                    />
                  ) : (
                    details.email
                  )}
                </div>
              </div>
            </div>
          )}
          {details?.address && (
            <div className={`${theme.card} flex items-start gap-3`}>
              <span className="text-lg mt-0.5 shrink-0">📍</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-0.5">
                  Address
                </div>
                <div
                  className="text-sm font-medium wrap-break-word"
                  style={{
                    color: brand.theme === "dark" ? "#e5e5e5" : "#1a1a1a",
                  }}
                >
                  {editable ? (
                    <EditableText
                      value={details.address}
                      onSave={(v) => onUpdate?.("contactDetails.address", v)}
                      multiline
                    />
                  ) : (
                    details.address
                  )}
                </div>
              </div>
            </div>
          )}
          {details?.hours && (
            <div className={`${theme.card} flex items-start gap-3`}>
              <span className="text-lg mt-0.5 shrink-0">🕐</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-0.5">
                  Hours
                </div>
                <div
                  className="text-sm font-medium"
                  style={{
                    color: brand.theme === "dark" ? "#e5e5e5" : "#1a1a1a",
                  }}
                >
                  {editable ? (
                    <EditableText
                      value={`${details.hours.open} – ${details.hours.close}`}
                      onSave={(v) => {
                        const parts = v.split("–").map((s: string) => s.trim());
                        if (parts.length === 2) {
                          onUpdate?.("contactDetails.hours.open", parts[0]);
                          onUpdate?.("contactDetails.hours.close", parts[1]);
                        }
                      }}
                    />
                  ) : (
                    `${details.hours.open} – ${details.hours.close}`
                  )}
                </div>
                {details.hours.days?.length > 0 && (
                  <div className="text-xs opacity-50 mt-0.5">
                    {details.hours.days.slice(0, 5).join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {data.cta && (
          <button
            className="px-8 @md:px-10 py-3 @md:py-4 font-semibold text-sm @md:text-base transition-all duration-200 hover:opacity-90 hover:scale-105"
            style={{
              background: data.cta.style?.background ?? brand.primaryColor,
              color: data.cta.style?.textColor ?? "#ffffff",
              borderRadius: data.cta.style?.borderRadius ?? "12px",
            }}
          >
            {editable ? (
              <EditableText
                value={data.cta.text}
                onSave={(v) => onUpdate?.("cta.text", v)}
              />
            ) : (
              data.cta.text
            )}
          </button>
        )}
      </div>
    </section>
  );
}
