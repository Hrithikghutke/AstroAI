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

const sectionMap: Record<string, React.ComponentType<any>> = {
  hero: Hero,
  features: Features,
  pricing: Pricing,
  testimonials: Testimonials,
  contact: Contact,
};

export default function PreviewFrame({ layout }: { layout: Layout | null }) {
  if (!layout) return null;

  // Build the context value — merges branding + theme + themeStyle together
  const brandContextValue = {
    ...layout.branding,
    theme: layout.theme,
    themeStyle: layout.themeStyle,
    logo: layout.branding?.logo ?? undefined,
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
        <Navbar />
        {layout.sections.map((section, index) => {
          const Component = sectionMap[section.type?.toLowerCase()];
          if (!Component) return null;
          return (
            <Component
              key={index}
              data={section}
              branding={layout.branding}
              themeStyle={layout.themeStyle}
              isDark={layout.theme === "dark"}
            />
          );
        })}
        <Footer brand={layout.branding} theme={layout.theme} />
      </div>
    </BrandContext.Provider>
  );
}
