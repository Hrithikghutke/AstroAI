// types/layout.ts

export type ThemeStyle =
  | "minimal"
  | "bold"
  | "glassmorphism"
  | "elegant"
  | "corporate";

export interface Layout {
  theme: "light" | "dark";
  themeStyle: ThemeStyle;
  primaryColor: string;
  branding: Branding;
  sections: Section[];
  customCss?: string; // ← Developer Agent output
  customJs?: string; // ← Developer Agent output
  customFont?: {
    url: string; // Google Fonts CSS URL
    displayFamily: string; // For headings h1-h4, hero text, section headlines
    bodyFamily: string; // For navbar, footer, body text, buttons, badges
  };
}

export interface Branding {
  logoText: string;
  primaryColor: string;
  secondaryColor?: string;
  fontStyle?: "normal" | "bold" | "italic";
  logo?: string;
  socialLinks?: {
    // ← NEW
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
}

export interface BaseSection {
  type: SectionType;
  headline: string;
}

export type Section =
  | HeroSection
  | StatsSection
  | FeaturesSection
  | PricingSection
  | TestimonialsSection
  | CtaBannerSection
  | ContactSection;

export type SectionType =
  | "hero"
  | "stats"
  | "features"
  | "pricing"
  | "testimonials"
  | "cta_banner"
  | "contact";

export interface HeroSection extends BaseSection {
  type: "hero";
  subtext?: string;
  cta?: CTAButton;
  secondaryCta?: CTAButton; // ← NEW
  variant?: "centered" | "split" | "minimal";
  imageUrl?: string;
  imageQuery?: string;
}

// ← NEW: Stats bar section
export interface StatsSection {
  type: "stats";
  headline?: string;
  stats: StatItem[];
}

export interface StatItem {
  value: string; // e.g. "10,000+"
  label: string; // e.g. "Sq Ft Space"
  icon?: string; // optional emoji
}

export interface FeaturesSection extends BaseSection {
  type: "features";
  features: FeatureItem[];
  variant?: "grid" | "alternating" | "list";
}

export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
  imageUrl?: string;
}

export interface PricingSection extends BaseSection {
  type: "pricing";
  pricingOptions: PricingPlan[];
}

export interface PricingPlan {
  name: string;
  price: string;
  description?: string;
  features: string[];
  ctaText?: string;
  style?: StyleObject;
  highlight?: {
    text: string;
    color: string;
  };
}

export interface TestimonialsSection extends BaseSection {
  type: "testimonials";
  testimonials: TestimonialItem[];
}

export interface TestimonialItem {
  name: string;
  role?: string;
  review: string;
  style?: {
    accentColor?: string;
  };
}

// ← NEW: CTA Banner section
export interface CtaBannerSection {
  type: "cta_banner";
  headline: string;
  subtext?: string;
  primaryCta?: CTAButton;
  secondaryCta?: CTAButton;
}

export interface ContactSection extends BaseSection {
  type: "contact";
  subtext?: string;
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

export interface CTAButton {
  text: string;
  color?: string;
  style?: StyleObject;
}

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
