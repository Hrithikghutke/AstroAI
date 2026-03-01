// types/layout.ts

/* ============================
   Root Layout
============================ */

// ADD this new type above the Layout interface
export type ThemeStyle =
  | "minimal"
  | "bold"
  | "glassmorphism"
  | "elegant"
  | "corporate";

// REPLACE the existing Layout interface with this:
export interface Layout {
  theme: "light" | "dark";
  themeStyle: ThemeStyle; // <-- NEW
  primaryColor: string;
  branding: Branding;
  sections: Section[];
}

/* ============================
   Branding
============================ */

export interface Branding {
  logoText: string;
  primaryColor: string;
  secondaryColor?: string;
  fontStyle?: "normal" | "bold" | "italic";
  logo?: string; // ← NEW: raw SVG string
}

/* ============================
   Base Section
============================ */

export interface BaseSection {
  type: SectionType;
  headline: string;
}

/* ============================
   Section Union
============================ */

export type Section =
  | HeroSection
  | FeaturesSection
  | PricingSection
  | TestimonialsSection
  | ContactSection;

export type SectionType =
  | "hero"
  | "features"
  | "pricing"
  | "testimonials"
  | "contact";

/* ============================
   Hero Section
============================ */

export interface HeroSection extends BaseSection {
  type: "hero";
  subtext?: string;
  cta?: CTAButton;
  imageUrl?: string; // ← NEW: Unsplash photo URL
  imageQuery?: string; // ← NEW: search keyword AI generated
}

/* ============================
   Features Section
============================ */

export interface FeaturesSection extends BaseSection {
  type: "features";
  features: FeatureItem[];
}

export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

/* ============================
   Pricing Section
============================ */

export interface PricingSection extends BaseSection {
  type: "pricing";
  pricingOptions: PricingPlan[];
}

export interface PricingPlan {
  name: string;
  price: string;
  description?: string;
  features: string[];
  style?: StyleObject;
  highlight?: {
    text: string;
    color: string;
  };
}

/* ============================
   Testimonials Section
============================ */

export interface TestimonialsSection extends BaseSection {
  type: "testimonials";
  testimonials: TestimonialItem[];
}

// REPLACE the existing TestimonialItem interface:
export interface TestimonialItem {
  name: string;
  role?: string; // <-- NEW: e.g. "Founder @ Acme"
  review: string;
  style?: {
    accentColor?: string;
  };
}

/* ============================
   Contact Section
============================ */

export interface ContactSection extends BaseSection {
  type: "contact";
  contactDetails: ContactDetails;
  cta?: CTAButton;
}

export interface ContactDetails {
  phone?: string;
  email?: string;
  address?: string;
  hours?: {
    open: string;
    close: string;
    days: string[];
  };
}

/* ============================
   CTA
============================ */

export interface CTAButton {
  text: string;
  color?: string;
  style?: StyleObject;
}

/* ============================
   Reusable Style Object
============================ */

export interface StyleObject {
  background?: string;
  textColor?: string;
  borderRadius?: string;
  fontWeight?: string;
  borderColor?: string;
  hoverEffect?: {
    background?: string;
    textColor?: string;
  };
}
