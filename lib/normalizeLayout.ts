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
} from "@/types/layout";

export function normalizeLayout(raw: any): Layout {
  return {
    theme: raw?.theme === "light" ? "light" : "dark",
    primaryColor: raw?.primaryColor ?? "#000000",
    branding: normalizeBranding(raw?.branding),
    sections: normalizeSections(raw?.sections),
  };
}

function normalizeBranding(raw: any) {
  return {
    logoText: raw?.logoText ?? "Brand",
    primaryColor: raw?.primaryColor ?? "#000000",
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

function normalizeHero(raw: any) {
  return {
    type: "hero" as const,
    headline: raw?.headline ?? "",
    subtext: raw?.subtext ?? "",
    cta: raw?.cta
      ? normalizeCTA(raw.cta)
      : raw?.callToAction
        ? {
            text: raw.callToAction,
            style: {
              background: raw.primaryColor ?? "#ff6b00",
              textColor: "#ffffff",
            },
          }
        : undefined,
  };
}

function normalizeFeatures(raw: any) {
  let featuresArray = [];

  if (Array.isArray(raw?.features)) {
    featuresArray = raw.features.map((f: any) => {
      // Case 1 — New model returns string
      if (typeof f === "string") {
        return {
          title: f,
          description: "",
        };
      }

      // Case 2 — Old structured format
      return {
        title: f?.title ?? "",
        description: f?.description ?? "",
        icon: f?.icon,
      };
    });
  }

  return {
    type: "features" as const,
    headline: raw?.headline ?? "",
    features: featuresArray,
  };
}

function normalizePricing(raw: any): PricingSection {
  const rawPlans = raw?.pricingOptions || raw?.plans || [];

  const pricingOptions = rawPlans.map((p: any) => ({
    name: p?.name ?? "",
    price: p?.price ?? "",
    description: p?.description ?? "",
    features: Array.isArray(p?.features) ? p.features : [],
    style: p?.style ? normalizeStyle(p.style) : undefined,
    highlight: p?.highlight,
  }));

  return {
    type: "pricing",
    headline: raw?.headline ?? "",
    pricingOptions,
  };
}

function normalizeTestimonials(raw: any): TestimonialsSection {
  const testimonials = Array.isArray(raw?.testimonials)
    ? raw.testimonials.map((t: any) => ({
        name: t?.name ?? "",
        review: t?.review ?? "",
        style: {
          accentColor: t?.style?.accentColor || t?.color,
        },
      }))
    : [];

  return {
    type: "testimonials",
    headline: raw?.headline ?? "",
    testimonials,
  };
}

function normalizeContact(raw: any) {
  const source = raw?.contactDetails ?? raw?.contactInfo ?? {};

  return {
    type: "contact" as const,
    headline: raw?.headline ?? "",
    contactDetails: {
      phone: source?.phone ?? "",
      email: source?.email ?? "",
      address: source?.address ?? "",
      hours: source?.hours ?? source?.workingHours,
    },
  };
}

function normalizeCTA(raw: any): CTAButton {
  return {
    text: raw?.text ?? "Click Here",
    color: raw?.color,
    style: raw?.style
      ? normalizeStyle(raw.style)
      : {
          background: raw?.background ?? raw?.color,
          textColor: "#ffffff",
          borderRadius: raw?.borderRadius ?? "50px",
        },
  };
}

function normalizeStyle(raw: any): StyleObject {
  return {
    background: raw?.background ?? raw?.backgroundColor ?? raw?.ctaColor, // 🔥 also handle pricing ctaColor

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
