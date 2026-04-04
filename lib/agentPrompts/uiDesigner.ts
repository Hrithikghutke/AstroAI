// ══════════════════════════════════════════════════
// UI DESIGN SPEC AGENT
// Runs in parallel with Shell generation.
// Produces a precise visual brief so the Developer
// implements a spec instead of inventing layouts.
// Model: Claude Haiku | max_tokens: 1000
// ══════════════════════════════════════════════════

export type HeroVariant =
  | "split-image-right"   // text left, image right (gym, law, corporate)
  | "split-image-left"    // image left, text right (restaurant, agency)
  | "centered-fullbleed"  // fullscreen image with centered overlay text (hotel, luxury restaurant)
  | "minimal-text-only"   // no image, pure giant typography (SaaS, portfolio, agency)
  | "overlay-panel";      // tall left image panel + full-height right text panel (construction, editorial)

export type FeaturesVariant =
  | "editorial-strips"    // alternating full-width image+text horizontal strips
  | "bold-stacked"        // 3 full-bleed image strips with overlay text (gym, events)
  | "magazine-grid"       // asymmetric masonry layout, mixed card sizes (creative, agency)
  | "corporate-3col"      // uniform 3-column feature cards, no image strips (SaaS, tech, law)
  | "elegant-split";      // 2 generous 50/50 sections, maximum whitespace (luxury, hotel)

export type NavbarStyle =
  | "pill-floating"       // fixed top-4, max-w-5xl mx-auto, rounded-full (SaaS, tech, startup)
  | "full-border-bottom"  // full-width w-full, 2px primary border-bottom (gym, restaurant, bold)
  | "full-minimal";       // full-width w-full, subtle border-b border-white/5 (corporate, law, hotel)

export type CardStyle =
  | "borderless-hover"    // no card bg, border-b border-white/10 dividers, glow on hover
  | "glass-elevated"      // .glass card, border border-white/10, hover:-translate-y-2
  | "solid-dark"          // bg-surface, hard edges, no rounding (industrial, bold)
  | "outlined";           // transparent bg, full border, rounded-xl

export type ImageStyle =
  | "grayscale-hover-color"   // grayscale filter, color on hover, dark cinematic overlay
  | "full-color-cinematic"    // full color, gradient cinematic overlay (from-black/60 to transparent)
  | "full-color-clean";       // full color, no overlay (SaaS, minimal)

export type TypographyScale =
  | "display-dominant"    // h1: text-9xl, sections h2: text-7xl — maximum visual impact
  | "balanced"            // h1: text-7xl, h2: text-5xl — professional, readable
  | "editorial";          // variable: some h1 massive, others small for contrast

export type AccentUsage =
  | "minimal"             // primary color ONLY on CTAs and active nav link
  | "moderate"            // primary on CTAs, key headline word, overline labels
  | "expressive";         // primary on large graphic elements, section accents

export interface UIDesignSpec {
  heroVariant: HeroVariant;
  featuresVariant: FeaturesVariant;
  navbarStyle: NavbarStyle;
  cardStyle: CardStyle;
  imageStyle: ImageStyle;
  typographyScale: TypographyScale;
  accentUsage: AccentUsage;
  sectionSpacing: "generous" | "standard" | "dense";
  heroOverlayStyle: "cinematic-dark" | "tinted-primary" | "subtle" | "none";
}

export function getUIDesignerPrompt(): string {
  return `You are a senior UI designer at a top creative agency. You decide the visual design system for websites — layout patterns, image treatments, typography scale, and component styles.

You receive a business brief and the brand plan from the Architect. Output a precise design specification as raw JSON only. No markdown, no backticks, no explanation.

Return EXACTLY this shape:
{
  "heroVariant": "<one of: split-image-right | split-image-left | centered-fullbleed | minimal-text-only | overlay-panel>",
  "featuresVariant": "<one of: editorial-strips | bold-stacked | magazine-grid | corporate-3col | elegant-split>",
  "navbarStyle": "<one of: pill-floating | full-border-bottom | full-minimal>",
  "cardStyle": "<one of: borderless-hover | glass-elevated | solid-dark | outlined>",
  "imageStyle": "<one of: grayscale-hover-color | full-color-cinematic | full-color-clean>",
  "typographyScale": "<one of: display-dominant | balanced | editorial>",
  "accentUsage": "<one of: minimal | moderate | expressive>",
  "sectionSpacing": "<one of: generous | standard | dense>",
  "heroOverlayStyle": "<one of: cinematic-dark | tinted-primary | subtle | none>"
}

DECISION RULES — follow these precisely:

heroVariant — pick based on business type (VARY: don't always choose the same one):
  Restaurant high-end / fine dining / luxury bar: ALWAYS "centered-fullbleed" — no exceptions
  Restaurant casual / fast casual:  "split-image-left" OR "centered-fullbleed"
  Hotel / resort / luxury:          "centered-fullbleed" OR "overlay-panel"
  Gym / fitness / sports:      "split-image-right" OR "overlay-panel"
  Construction / engineering:  "overlay-panel" OR "split-image-right"
  Law firm / legal:            "split-image-right" OR "minimal-text-only"
  SaaS / tech / software:      "minimal-text-only" OR "centered-fullbleed"
  Agency / creative / design:  "split-image-left" OR "minimal-text-only"
  Medical / clinic:            "split-image-right" OR "centered-fullbleed"
  Real estate / property:      "overlay-panel" OR "centered-fullbleed"
  Finance / consulting:        "minimal-text-only" OR "split-image-right"
  E-commerce / retail:         "split-image-left" OR "centered-fullbleed"

featuresVariant:
  Restaurant / bar / cafe:     "editorial-strips"
  Hotel / luxury:              "elegant-split"
  Gym / sports / fitness:      "bold-stacked"
  Construction / industrial:   "editorial-strips" OR "elegant-split"
  Law / finance / consulting:  "corporate-3col"
  SaaS / tech / startup:       "corporate-3col" OR "magazine-grid"
  Agency / creative:           "magazine-grid" OR "editorial-strips"
  Medical / clinic:            "corporate-3col"
  Real estate:                 "editorial-strips" OR "elegant-split"

navbarStyle:
  pill-floating:       SaaS, tech, startup, agency, creative, portfolio
  full-border-bottom:  gym, CASUAL restaurant, bar, events, bold brands
  full-minimal:        construction, law, finance, hotel, medical, real estate, LUXURY restaurant, fine dining

imageStyle:
  grayscale-hover-color:  construction, law, finance, corporate, industrial — ONLY these
  full-color-cinematic:   restaurant, gym, hotel, medical, real estate, agency
  full-color-clean:       SaaS, tech, software, edu-tech, fintech without photos

cardStyle:
  borderless-hover:  luxury, hotel, agency, editorial, SaaS
  glass-elevated:    restaurant, gym, medical, real estate, creative
  solid-dark:        construction, industrial, gym (aggressive), events
  outlined:          tech, SaaS, law, finance

typographyScale:
  display-dominant:  gym, construction, agency, events, bold brands
  balanced:          restaurant, law, medical, real estate, finance
  editorial:         hotel, luxury, creative, agency, SaaS

accentUsage:
  minimal:     law, finance, medical, hotel, luxury, corporate
  moderate:    restaurant, real estate, SaaS, tech, consulting
  expressive:  gym, events, agency, creative, nightlife, entertainment

heroOverlayStyle:
  cinematic-dark:   construction, gym, hotel, luxury, events, restaurant (at night / upscale)
  tinted-primary:   restaurant (casual/colourful), gym (energy), agency
  subtle:           SaaS, tech, medical, law (light overlay only)
  none:             SaaS "minimal-text-only" hero (no image = no overlay)

CRITICAL RULES:
- Read the business brief carefully — a high-end restaurant and a fast-casual diner get different specs
- For "minimal-text-only" hero: heroOverlayStyle MUST be "none"
- NavbarStyle MUST be "full-border-bottom" or "full-minimal" if heroVariant is NOT "pill-floating"
- Aim for maximum variety — avoid always defaulting to the same layout combination`;
}
