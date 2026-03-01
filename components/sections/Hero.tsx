"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";
import EditableText from "@/components/ui/EditableText";

export default function Hero({
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
  const { headline, subtext, cta, imageUrl } = data;
  const hasImage = !!imageUrl;

  return (
    <section
      className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 @md:px-6 py-20 @md:py-32 overflow-hidden"
      style={
        hasImage
          ? {
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
    >
      {hasImage ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 100%)",
          }}
        />
      ) : (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 20%, ${brand.primaryColor}, transparent)`,
          }}
        />
      )}

      <div className="relative z-10 max-w-4xl mx-auto space-y-5 w-full">
        {/* Badge */}
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center gap-2 ${
              hasImage
                ? "bg-white/15 backdrop-blur-sm text-white border border-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest"
                : theme.badgeClass
            }`}
          >
            {brand.logo && brand.logo.startsWith("<svg") ? (
              <span
                style={{
                  width: 18,
                  height: 18,
                  display: "inline-flex",
                  flexShrink: 0,
                }}
                dangerouslySetInnerHTML={{
                  __html: brand.logo
                    .replace(/width="48"/, 'width="18"')
                    .replace(/height="48"/, 'height="18"'),
                }}
              />
            ) : (
              <span>✦</span>
            )}
            {editable ? (
              <EditableText
                value={brand.logoText}
                onSave={(v) => onUpdate?.("badgeText", v)}
              />
            ) : (
              brand.logoText
            )}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-3xl @sm:text-4xl @md:text-5xl @lg:text-7xl leading-tight"
          style={{
            fontWeight:
              brand.themeStyle === "bold"
                ? "900"
                : brand.themeStyle === "elegant"
                  ? "400"
                  : "700",
            color: hasImage ? "#ffffff" : undefined,
          }}
        >
          {editable ? (
            <EditableText
              value={headline}
              onSave={(v) => onUpdate?.("headline", v)}
              className={!hasImage ? theme.headlineClass : ""}
            />
          ) : (
            <span className={!hasImage ? theme.headlineClass : ""}>
              {headline}
            </span>
          )}
        </h1>

        {/* Subtext */}
        {subtext && (
          <div
            className="text-base @md:text-xl max-w-2xl mx-auto leading-relaxed px-2 @md:px-0"
            style={{ color: hasImage ? "rgba(255,255,255,0.85)" : undefined }}
          >
            {editable ? (
              <EditableText
                value={subtext}
                onSave={(v) => onUpdate?.("subtext", v)}
                className={!hasImage ? theme.subtextClass : ""}
                multiline
              />
            ) : (
              <span className={!hasImage ? theme.subtextClass : ""}>
                {subtext}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        {cta && (
          <div className="pt-2">
            <button
              className="px-6 @md:px-8 py-3 @md:py-4 text-sm @md:text-base font-semibold transition-all duration-300 inline-block"
              style={{
                background: cta.style?.background ?? brand.primaryColor,
                color: cta.style?.textColor ?? "#ffffff",
                borderRadius: cta.style?.borderRadius ?? "12px",
                fontWeight: cta.style?.fontWeight ?? "600",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 30px ${brand.primaryColor}66`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {editable ? (
                <EditableText
                  value={cta.text}
                  onSave={(v) => onUpdate?.("cta.text", v)}
                />
              ) : (
                cta.text
              )}
            </button>
          </div>
        )}

        {hasImage && (
          <p className="absolute bottom-3 right-3 text-white/30 text-[10px]">
            Photo via Unsplash
          </p>
        )}
      </div>
    </section>
  );
}
