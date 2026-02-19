import Hero from "@/components/sections/Hero";
import Navbar from "@/components/ui/Navbar";
import { BrandContext } from "@/context/BrandContext";
import Features from "./sections/Features";
import Pricing from "./sections/Pricing";
import Testimonials from "./sections/Testimonials";
import Contact from "./sections/Contact";
import Footer from "./ui/Footer";

const sectionMap: any = {
  hero: Hero,
  features: Features,
  pricing: Pricing,
  testimonials: Testimonials,
  contact: Contact,
};

export default function PreviewFrame({ layout }: any) {
  if (!layout) return null;

  return (
    <BrandContext.Provider value={layout.branding}>
      <div
        className={`min-h-screen ${
          layout.theme === "dark"
            ? "bg-black text-white"
            : "bg-white text-black"
        }`}
      >
        <Navbar brand={layout.branding} />
        {layout.sections.map((section: any, index: number) => {
          const Component = sectionMap[section.type?.toLowerCase()];

          if (!Component) return null;

          return Component ? (
            <Component key={index} data={section} branding={layout.branding} />
          ) : null;
        })}
        <Footer brand={layout.branding} />
      </div>
    </BrandContext.Provider>
  );
}
