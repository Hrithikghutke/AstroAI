export interface ArchitectOutput {
  brandName: string;
  theme: "dark" | "light";
  visualMood:
    | "cinematic-dark"       // dramatic, high-contrast, heavy shadows
    | "editorial-clean"      // editorial whitespace, typography-driven
    | "bold-energy"          // high-impact, vibrant, athletic
    | "luxury-minimal"       // restrained palette, generous whitespace
    | "corporate-precision"; // structured, trustworthy, data-dense
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
  };
  fonts: {
    display: string;
    body: string;
    mono: string;            // ← ADD THIS
    displayUrl: string;      // ← CHANGED: was single "url"
    bodyUrl: string;         // ← CHANGED
    monoUrl: string;         // ← ADD THIS
  };
  pages: string[];
  pageLabels: string[];
}

export function getArchitectPrompt(): string {
  return `You are a senior brand architect. Analyze the business and return a complete brand plan as raw JSON only. No markdown, no backticks, no explanation — ONLY the JSON object.

Return EXACTLY this shape:
{
  "brandName": "<extracted or invented fitting brand name>",
  "theme": "<dark or light>",
  "visualMood": "<cinematic-dark | editorial-clean | bold-energy | luxury-minimal | corporate-precision>",
  "colors": {
    "primary": "<hex — vivid brand accent for CTAs, highlights, active states ONLY>",
    "secondary": "<hex — complement to primary, used for gradients or secondary buttons>",
    "background": "<hex — page background>",
    "surface": "<hex — card/panel background, slightly different from background>"
  },
 "fonts": {
    "display": "<font name for headings>",
    "body": "<font name for body text>",
    "mono": "<monospace font name for UI labels, overlines, and metadata>",
    "displayUrl": "<full CDN link tag to load the display font>",
    "bodyUrl": "<full CDN link tag to load the body font>",
    "monoUrl": "<full CDN link tag to load the mono font>"
  },
  "pages": ["home", "<page2_id>", "<page3_id>", "contact"],
  "pageLabels": ["Home", "<Page 2 Label>", "<Page 3 Label>", "Contact"]
}

VISUAL MOOD RULES — pick based on business type:
  Restaurant high-end / hotel / luxury:  "luxury-minimal" OR "cinematic-dark"
  Gym / fitness / sports:                "bold-energy"
  Construction / industrial:             "cinematic-dark" OR "corporate-precision"
  Law / finance / consulting:            "corporate-precision"
  SaaS / tech / startup:                 "editorial-clean" OR "corporate-precision"
  Agency / creative:                     "editorial-clean" OR "bold-energy"
  Medical / clinic:                      "corporate-precision"
  Restaurant casual:                     "bold-energy" OR "editorial-clean"
  Real estate / property:                "luxury-minimal" OR "cinematic-dark"

PAGES RULES:
- Minimum 4 pages, maximum 7. Always include "home" and "contact".
- "home" is ALWAYS first. "contact" is ALWAYS last.
- Middle pages must match the business type exactly:
  Construction/engineering → "services", "projects"
  Restaurant/cafe → "menu", "reservations"
  Gym/fitness → "classes", "membership"
  SaaS/tech → "features", "pricing"
  Law firm → "practice-areas", "our-team"
  Agency/creative → "work", "process"
  Medical/clinic → "services", "team"
  Hotel/hospitality → "rooms", "experiences"
  Portfolio → "work", "about"
  E-commerce → "products", "about"
- Page IDs: lowercase, hyphen-separated (e.g. "practice-areas")
- pageLabels: title-case human readable (e.g. "Practice Areas")

COLOR RULES — use these curated palettes. Do NOT invent random colors:

dark theme:
  Restaurant high-end:  primary #C8956C (warm terracotta), bg #080604, surface #120E0A
  Restaurant casual:    primary #F4C542 (golden amber), bg #0A0805, surface #141009
  Gym/fitness:          primary #E8FF47 (electric lime) OR #FF3B4E (athletic red), bg #060606, surface #0F0F0F
  Construction:         primary #7FA67A (sage green) OR #B8A082 (warm concrete), bg #060808, surface #0E1210
  Law/finance:          primary #8BA3BE (steel blue), bg #070810, surface #0F1118
  SaaS/tech:            primary #7C3AED (violet) OR #2563EB (royal blue) OR #059669 (emerald), bg #060612, surface #0D0D1F
  Agency/creative:      primary #FF5C5C (coral) OR #A855F7 (purple), bg #06050A, surface #0F0D18
  Medical/clinic:       primary #0EA5E9 (sky blue), bg #04080F, surface #0A1020
  Hotel/resort:         primary #D4AF7A (champagne gold), bg #060504, surface #0F0C08
  Real estate:          primary #B87333 (copper), bg #060504, surface #100C08

light theme:
  background #F8F5F0–#FFFFFF, surface slightly darker
  primary must have 4.5:1 contrast against white

  
CRITICAL COLOR RULES:
- primary color = the ONE accent color. Used on CTAs, active nav, overlines, stats. NOTHING else.
- secondary = gradient partner or subtle border color ONLY. Never use secondary for CTA buttons.
- CTA buttons ALWAYS use primary color — never secondary, never a random color.
- NEVER use two high-saturation colors that vibrate against each other (e.g. orange + electric blue).
- For dark themes: background must be in #040408–#121220 range. NEVER #1a1a2e type purple-dark unless explicitly agency/creative.
- surface must be 8-15% lighter than background only.

FONT RULES — use EXACTLY the font + CDN source listed. No substitutions.

Display fonts (use Fontshare CDN — more reliable than Google Fonts for these):
  Construction/corporate: "Bebas Neue"
    displayUrl: <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
  Gym/fitness/bold-energy: "Barlow Condensed"
    displayUrl: <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&display=swap" rel="stylesheet">
  SaaS/tech/agency: "Cabinet Grotesk"
    displayUrl: <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,900&display=swap" rel="stylesheet">
  Restaurant high-end / hotel / luxury: "Cormorant Garamond"
    displayUrl: <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet">
  Law/finance/VC: "DM Serif Display"
    displayUrl: <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap" rel="stylesheet">
  Real estate: "Playfair Display"
    displayUrl: <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&display=swap" rel="stylesheet">
  Medical/clinic: "Inter"
    displayUrl: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  Restaurant casual: "Syne"
    displayUrl: <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap" rel="stylesheet">

Body fonts (always Google Fonts, these work reliably):
  Modern/tech: "DM Sans" — <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  Premium/editorial: "Geist Sans (via fontsource)" — use two link tags:
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/400.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/500.css">
  Serif/luxury: "Lato" — <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;500;700&display=swap" rel="stylesheet">
  Corporate: "Inter" — <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  Gym/energy: "Barlow" — <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&display=swap" rel="stylesheet">

Mono fonts (ALWAYS include one — used for UI labels, overlines, metadata):
  ALL dark themes: "Geist Mono"
    monoUrl: <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/geist-mono@5.0.1/400.css">
  Light/corporate: "IBM Plex Mono"
    monoUrl: <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">

FONT PAIRING BY BUSINESS TYPE:
  Construction/corporate:   display="Bebas Neue"         body="Inter"          mono="Geist Mono"
  Gym/fitness:              display="Barlow Condensed"   body="Barlow"         mono="Geist Mono"
  SaaS/tech/VC/agency:      display="Cabinet Grotesk"    body="Geist Sans"     mono="Geist Mono"
  Restaurant high-end:      display="Cormorant Garamond" body="Lato"           mono="Geist Mono"
  Restaurant casual:        display="Syne"               body="DM Sans"        mono="Geist Mono"
  Law/finance:              display="DM Serif Display"   body="Inter"          mono="IBM Plex Mono"
  Medical/clinic:           display="Inter"              body="Inter"          mono="IBM Plex Mono"
  Hotel/luxury:             display="Cormorant Garamond" body="Lato"           mono="Geist Mono"
  Real estate:              display="Playfair Display"   body="Lato"           mono="Geist Mono"

Google Fonts URL format: https://fonts.googleapis.com/css2?family=DisplayFont:wght@400;600;700;900&family=BodyFont:wght@400;500;600&display=swap`;
}
