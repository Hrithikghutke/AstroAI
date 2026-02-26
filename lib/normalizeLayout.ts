import {
  Layout,
  Section,
  HeroSection,
  FeaturesSection,
  PricingSection,
  TestimonialsSection,
  ContactSection,
  CTAButton,
  StyleObject,
  ThemeStyle,
} from "@/types/layout";

const VALID_THEME_STYLES: ThemeStyle[] = [
  "minimal",
  "bold",
  "glassmorphism",
  "elegant",
  "corporate",
];

export function normalizeLayout(raw: any): Layout {
  return {
    theme: raw?.theme === "light" ? "light" : "dark",
    themeStyle: VALID_THEME_STYLES.includes(raw?.themeStyle)
      ? raw.themeStyle
      : "corporate",
    primaryColor: raw?.primaryColor ?? "#6366f1",
    branding: normalizeBranding(raw?.branding),
    sections: normalizeSections(raw?.sections),
  };
}

function normalizeBranding(raw: any) {
  return {
    logoText: raw?.logoText ?? "Brand",
    primaryColor: raw?.primaryColor ?? "#6366f1",
    secondaryColor: raw?.secondaryColor ?? "#ffffff",
    fontStyle:
      raw?.fontStyle === "bold" || raw?.fontStyle === "italic"
        ? raw.fontStyle
        : "normal",
  };
}

function normalizeSections(rawSections: any[]): Section[] {
  if (!Array.isArray(rawSections)) return [];
  return rawSections.map(normalizeSection).filter(Boolean) as Section[];
}

function normalizeSection(section: any): Section | null {
  switch (section?.type?.toLowerCase()) {
    case "hero":
      return normalizeHero(section);
    case "features":
      return normalizeFeatures(section);
    case "pricing":
      return normalizePricing(section);
    case "testimonials":
      return normalizeTestimonials(section);
    case "contact":
      return normalizeContact(section);
    default:
      return null;
  }
}

function normalizeHero(raw: any): HeroSection {
  return {
    type: "hero",
    headline: raw?.headline ?? "Welcome",
    subtext: raw?.subtext ?? "",
    cta: raw?.cta
      ? normalizeCTA(raw.cta)
      : raw?.callToAction // some models return a plain string
        ? {
            text: raw.callToAction,
            style: {
              background: raw.primaryColor ?? "#6366f1",
              textColor: "#ffffff",
              borderRadius: "50px",
              fontWeight: "bold",
            },
          }
        : undefined,
  };
}

function normalizeFeatures(raw: any): FeaturesSection {
  let featuresArray: any[] = [];

  if (Array.isArray(raw?.features)) {
    featuresArray = raw.features.map((f: any) => {
      if (typeof f === "string") {
        // model returned plain string array
        return { title: f, description: "", icon: "✦" };
      }
      return {
        title: f?.title ?? "",
        description: f?.description ?? "",
        icon: f?.icon ?? "✦",
      };
    });
  }

  return {
    type: "features",
    headline: raw?.headline ?? "Features",
    features: featuresArray,
  };
}

function normalizePricing(raw: any): PricingSection {
  // Support pricingOptions, plans, or tiers — whichever the model returns
  const rawPlans = raw?.pricingOptions ?? raw?.plans ?? raw?.tiers ?? [];

  return {
    type: "pricing",
    headline: raw?.headline ?? "Pricing",
    pricingOptions: rawPlans.map((p: any) => ({
      name: p?.name ?? "",
      price: p?.price ?? "",
      description: p?.description ?? "",
      features: Array.isArray(p?.features) ? p.features : [],
      style: p?.style ? normalizeStyle(p.style) : undefined,
      highlight: p?.highlight,
    })),
  };
}

function normalizeTestimonials(raw: any): TestimonialsSection {
  return {
    type: "testimonials",
    headline: raw?.headline ?? "What Our Customers Say",
    testimonials: Array.isArray(raw?.testimonials)
      ? raw.testimonials.map((t: any) => ({
          name: t?.name ?? "",
          role: t?.role ?? t?.title ?? "", // NEW: role field
          review: t?.review ?? t?.text ?? t?.quote ?? "",
          style: { accentColor: t?.style?.accentColor ?? t?.color },
        }))
      : [],
  };
}

function normalizeContact(raw: any): ContactSection {
  // Support contactDetails, contactInfo, or contact
  const source = raw?.contactDetails ?? raw?.contactInfo ?? raw?.contact ?? {};

  return {
    type: "contact",
    headline: raw?.headline ?? "Get In Touch",
    contactDetails: {
      phone: source?.phone ?? "",
      email: source?.email ?? "",
      address: source?.address ?? "",
      hours: source?.hours ?? source?.workingHours,
    },
    cta: raw?.cta ? normalizeCTA(raw.cta) : undefined,
  };
}

function normalizeCTA(raw: any): CTAButton {
  return {
    text: raw?.text ?? "Get Started",
    color: raw?.color,
    style: raw?.style
      ? normalizeStyle(raw.style)
      : {
          background: raw?.background ?? raw?.color ?? "#6366f1",
          textColor: "#ffffff",
          borderRadius: "50px",
        },
  };
}

function normalizeStyle(raw: any): StyleObject {
  return {
    background: raw?.background ?? raw?.backgroundColor ?? raw?.ctaColor,
    textColor: raw?.textColor,
    borderRadius: raw?.borderRadius,
    fontWeight: raw?.fontWeight,
    borderColor: raw?.borderColor,
    hoverEffect: raw?.hoverEffect
      ? {
          background:
            raw.hoverEffect.background ?? raw.hoverEffect.backgroundColor,
          textColor: raw.hoverEffect.textColor,
        }
      : undefined,
  };
}
