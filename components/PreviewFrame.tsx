"use client";

import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import Pricing from "@/components/sections/Pricing";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { BrandContext } from "@/context/BrandContext";
import { Layout } from "@/types/layout";

export default function PreviewFrame({
  layout,
  editable = false,
  onLayoutChange,
}: {
  layout: Layout | null;
  editable?: boolean;
  onLayoutChange?: (updated: Layout) => void;
}) {
  if (!layout) return null;

  const brandContextValue = {
    ...layout.branding,
    theme: layout.theme,
    themeStyle: layout.themeStyle,
    logo: layout.branding?.logo ?? undefined,
  };

  // Deep clone + update a top-level section field
  const updateSection = (
    sectionIndex: number,
    field: string,
    value: string,
  ) => {
    if (!onLayoutChange) return;
    const updated: Layout = JSON.parse(JSON.stringify(layout));
    const section = updated.sections[sectionIndex] as any;
    const parts = field.split(".");
    let target = section;
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
    onLayoutChange(updated);
  };

  // Update an item inside a section array (features, pricingOptions, etc.)
  const updateSectionArrayItem = (
    sectionIndex: number,
    arrayField: string,
    itemIndex: number,
    itemField: string,
    value: string,
  ) => {
    if (!onLayoutChange) return;
    const updated: Layout = JSON.parse(JSON.stringify(layout));
    (updated.sections[sectionIndex] as any)[arrayField][itemIndex][itemField] =
      value;
    onLayoutChange(updated);
  };

  // Update branding (logoText used in Navbar + Footer)
  const updateBranding = (field: string, value: string) => {
    if (!onLayoutChange) return;
    const updated: Layout = JSON.parse(JSON.stringify(layout));
    (updated.branding as any)[field] = value;
    onLayoutChange(updated);
  };

  return (
    <BrandContext.Provider value={brandContextValue}>
      <div
        className={`min-h-screen ${
          layout.theme === "dark"
            ? "bg-black text-white"
            : "bg-white text-black"
        }`}
      >
        <Navbar editable={editable} onUpdate={updateBranding} />

        {layout.sections.map((section, i) => {
          switch (section.type) {
            case "hero":
              return (
                <Hero
                  key={i}
                  data={section}
                  editable={editable}
                  onUpdate={(field: string, value: string) =>
                    updateSection(i, field, value)
                  }
                />
              );
            case "features":
              return (
                <Features
                  key={i}
                  data={section}
                  editable={editable}
                  onUpdate={(field: string, value: string) =>
                    updateSection(i, field, value)
                  }
                  onUpdateItem={(
                    itemIndex: number,
                    itemField: string,
                    value: string,
                  ) =>
                    updateSectionArrayItem(
                      i,
                      "features",
                      itemIndex,
                      itemField,
                      value,
                    )
                  }
                />
              );
            case "pricing":
              return (
                <Pricing
                  key={i}
                  data={section}
                  editable={editable}
                  onUpdate={(field: string, value: string) =>
                    updateSection(i, field, value)
                  }
                  onUpdateItem={(
                    itemIndex: number,
                    itemField: string,
                    value: string,
                  ) =>
                    updateSectionArrayItem(
                      i,
                      "pricingOptions",
                      itemIndex,
                      itemField,
                      value,
                    )
                  }
                  onUpdateFeature={(
                    planIndex: number,
                    featureIndex: number,
                    value: string,
                  ) => {
                    if (!onLayoutChange) return;
                    const updated: Layout = JSON.parse(JSON.stringify(layout));
                    (updated.sections[i] as any).pricingOptions[
                      planIndex
                    ].features[featureIndex] = value;
                    onLayoutChange(updated);
                  }}
                />
              );
            case "testimonials":
              return (
                <Testimonials
                  key={i}
                  data={section}
                  editable={editable}
                  onUpdate={(field: string, value: string) =>
                    updateSection(i, field, value)
                  }
                  onUpdateItem={(
                    itemIndex: number,
                    itemField: string,
                    value: string,
                  ) =>
                    updateSectionArrayItem(
                      i,
                      "testimonials",
                      itemIndex,
                      itemField,
                      value,
                    )
                  }
                />
              );
            case "contact":
              return (
                <Contact
                  key={i}
                  data={section}
                  editable={editable}
                  onUpdate={(field: string, value: string) =>
                    updateSection(i, field, value)
                  }
                />
              );
            default:
              return null;
          }
        })}

        <Footer editable={editable} onUpdate={updateBranding} />
      </div>
    </BrandContext.Provider>
  );
}
