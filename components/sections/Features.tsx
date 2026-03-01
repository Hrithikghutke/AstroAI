"use client";

import { useBrand } from "@/context/BrandContext";
import { getThemeClasses } from "@/lib/themeConfig";
import EditableText from "@/components/ui/EditableText";

export default function Features({
  data,
  editable = false,
  onUpdate,
  onUpdateItem,
}: {
  data: any;
  editable?: boolean;
  onUpdate?: (field: string, value: string) => void;
  onUpdateItem?: (index: number, field: string, value: string) => void;
}) {
  const brand = useBrand();
  const theme = getThemeClasses(brand.themeStyle, brand.theme === "dark");

  return (
    <section className={`py-16 @md:py-24 px-4 @md:px-6 ${theme.altSectionBg}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 @md:mb-16">
          <span className={`inline-block mb-4 ${theme.badgeClass}`}>
            Features
          </span>
          <h2
            className={`text-2xl @md:text-3xl @lg:text-5xl ${theme.headlineClass}`}
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
        </div>

        <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4 @md:gap-6">
          {data.features?.map((feature: any, i: number) => (
            <div key={i} className={`${theme.card} ${theme.cardHover} group`}>
              {feature.icon && (
                <div
                  className="text-2xl mb-4 w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${brand.primaryColor}22` }}
                >
                  {feature.icon}
                </div>
              )}
              <h3
                className="text-sm @md:text-base font-semibold mb-2"
                style={{
                  color: brand.theme === "dark" ? "#ffffff" : "#0a0a0a",
                }}
              >
                {editable ? (
                  <EditableText
                    value={feature.title}
                    onSave={(v) => onUpdateItem?.(i, "title", v)}
                  />
                ) : (
                  feature.title
                )}
              </h3>
              {feature.description && (
                <div
                  className={`text-sm leading-relaxed ${theme.subtextClass}`}
                >
                  {editable ? (
                    <EditableText
                      value={feature.description}
                      onSave={(v) => onUpdateItem?.(i, "description", v)}
                      multiline
                    />
                  ) : (
                    feature.description
                  )}
                </div>
              )}
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
