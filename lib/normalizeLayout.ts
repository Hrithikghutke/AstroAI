import {
  Layout,
  Section,
  HeroSection,
  StatsSection,
  FeaturesSection,
  PricingSection,
  TestimonialsSection,
  CtaBannerSection,
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
    logo: raw?.logo ?? null,
    socialLinks: raw?.socialLinks
      ? {
          instagram: raw.socialLinks.instagram ?? undefined,
          facebook: raw.socialLinks.facebook ?? undefined,
          twitter: raw.socialLinks.twitter ?? undefined,
          youtube: raw.socialLinks.youtube ?? undefined,
          linkedin: raw.socialLinks.linkedin ?? undefined,
        }
      : undefined,
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
    case "stats":
      return normalizeStats(section);
    case "features":
      return normalizeFeatures(section);
    case "pricing":
      return normalizePricing(section);
    case "testimonials":
      return normalizeTestimonials(section);
    case "cta_banner":
      return normalizeCtaBanner(section);
    case "contact":
      return normalizeContact(section);
    default:
      return null;
  }
}

function normalizeHero(raw: any): HeroSection {
  return {
    type: "hero",
    variant: raw?.variant ?? "centered",
    headline: raw?.headline ?? "Welcome",
    subtext: raw?.subtext ?? "",
    imageUrl: raw?.imageUrl ?? null,
    imageQuery: raw?.imageQuery ?? null,
    cta: raw?.cta ? normalizeCTA(raw.cta) : undefined,
    secondaryCta: raw?.secondaryCta
      ? normalizeCTA(raw.secondaryCta)
      : undefined,
  };
}

function normalizeStats(raw: any): StatsSection {
  return {
    type: "stats",
    headline: raw?.headline ?? null,
    stats: Array.isArray(raw?.stats)
      ? raw.stats.map((s: any) => ({
          value: s?.value ?? "0",
          label: s?.label ?? "",
          icon: s?.icon ?? null,
        }))
      : [],
  };
}

function normalizeFeatures(raw: any): FeaturesSection {
  let featuresArray: any[] = [];
  if (Array.isArray(raw?.features)) {
    featuresArray = raw.features.map((f: any) => {
      if (typeof f === "string") {
        return { title: f, description: "", icon: "✦" };
      }
      return {
        title: f?.title ?? "",
        description: f?.description ?? "",
        icon: f?.icon ?? "✦",
        imageUrl: f?.imageUrl ?? null,
      };
    });
  }
  return {
    type: "features",
    variant: raw?.variant ?? "grid",
    headline: raw?.headline ?? "Features",
    features: featuresArray,
  };
}

function normalizePricing(raw: any): PricingSection {
  const rawPlans = raw?.pricingOptions ?? raw?.plans ?? raw?.tiers ?? [];
  return {
    type: "pricing",
    headline: raw?.headline ?? "Pricing",
    pricingOptions: rawPlans.map((p: any) => ({
      name: p?.name ?? "",
      price: p?.price ?? "",
      description: p?.description ?? "",
      features: Array.isArray(p?.features) ? p.features : [],
      ctaText: p?.ctaText ?? "Get Started",
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
          role: t?.role ?? t?.title ?? "",
          review: t?.review ?? t?.text ?? t?.quote ?? "",
          style: { accentColor: t?.style?.accentColor ?? t?.color },
        }))
      : [],
  };
}

function normalizeCtaBanner(raw: any): CtaBannerSection {
  return {
    type: "cta_banner",
    headline: raw?.headline ?? "Ready to Get Started?",
    subtext: raw?.subtext ?? "",
    primaryCta: raw?.primaryCta ? normalizeCTA(raw.primaryCta) : undefined,
    secondaryCta: raw?.secondaryCta
      ? normalizeCTA(raw.secondaryCta)
      : undefined,
  };
}

function normalizeContact(raw: any): ContactSection {
  const source = raw?.contactDetails ?? raw?.contactInfo ?? raw?.contact ?? {};
  return {
    type: "contact",
    headline: raw?.headline ?? "Get In Touch",
    subtext: raw?.subtext ?? "",
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
  };
}
