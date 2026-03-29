export interface ArchitectOutput {
  brandName: string;
  theme: "dark" | "light";
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
  };
  fonts: {
    display: string;
    body: string;
    url: string;
  };
  pages: string[];
  pageLabels: string[];
}

export function getArchitectPrompt(): string {
  return `You are a senior web architect. Analyze the business and return a minimal website plan as raw JSON only. No markdown, no backticks, no explanation — ONLY the JSON object.

Return EXACTLY this shape:
{
  "brandName": "<extracted or invented fitting name>",
  "theme": "<dark or light>",
  "colors": {
    "primary": "<hex — vivid brand color for CTAs and accents>",
    "secondary": "<hex — complement to primary>",
    "background": "<hex — page background>",
    "surface": "<hex — card/panel background, slightly different from background>"
  },
  "fonts": {
    "display": "<Google Font name for headings>",
    "body": "<Google Font name for body text>",
    "url": "<full Google Fonts CSS2 URL with weights 400;600;700;900 for both fonts>"
  },
  "pages": ["home", "<page2_id>", "<page3_id>", "contact"],
  "pageLabels": ["Home", "<Page 2 Label>", "<Page 3 Label>", "Contact"]
}

PAGES RULES:
- Minimum 4 pages, maximum as per business needs but no more than 7 total. Always include "home" and "contact".
- "home" is ALWAYS first. "contact" is ALWAYS last.
- Middle 2–3 pages must match the business type exactly:
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
- Page IDs: lowercase, hyphen-separated only (e.g. "practice-areas")
- pageLabels: title-case human readable (e.g. "Practice Areas")

COLOR RULES:
- dark theme: background in #080808–#1a2035 range, surface 10–15% lighter
- light theme: background #f5f5f5–#ffffff, surface slightly darker
- primary must be vivid with 4.5:1 contrast against both background AND white text
- Never use: pure #FF0000, pure #FFFF00, grey as primary, more than 2 accent colors

FONT RULES — match to business personality:
- Construction/corporate → "Bebas Neue" + "Inter" OR "Oswald" + "Roboto"
- Restaurant/luxury → "Playfair Display" + "Lato" OR "Cormorant Garamond" + "Nunito"
- Gym/bold → "Barlow Condensed" + "Barlow" OR "Rajdhani" + "Open Sans"
- SaaS/tech → "Space Grotesk" + "Inter" OR "Outfit" + "DM Sans"
- Creative/agency → "Syne" + "Plus Jakarta Sans" OR "DM Serif Display" + "DM Sans"
- Law/finance → "Libre Baskerville" + "Source Sans 3" OR "Merriweather" + "Inter"`;
}
