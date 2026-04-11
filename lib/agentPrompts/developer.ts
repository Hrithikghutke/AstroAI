


// ══════════════════════════════════════════════════
// PARALLEL GENERATION PROMPTS (used by Deep Dive v2)
// ══════════════════════════════════════════════════

import type { ArchitectOutput } from "./architect";
import type { UIDesignSpec } from "./uiDesigner";
import type { ContentBrief } from "./contentStrategist";

// ── Navbar CSS helper ──
function navbarCss(style: UIDesignSpec["navbarStyle"] | undefined): string {
  if (style === "pill-floating") {
    return `fixed top-4 left-0 right-0 z-50 flex justify-center`;
  }
  if (style === "full-border-bottom") {
    return `fixed top-0 left-0 right-0 z-50 w-full border-b-2 border-primary`;
  }
  // full-minimal (default)
  return `fixed top-0 left-0 right-0 z-50 w-full border-b border-white/5`;
}

// Add this helper function near the top of developer.ts, outside any function

// Simple hash for deterministic variety within a mood
function fontHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface FontConfig {
  display: string;
  body: string;
  displayUrl: string;
  bodyUrl: string;
}

const SOCIAL_SVGS: Record<string, string> = {
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  twitter: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.41 19.1C5.12 19.56 12 19.56 12 19.56s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>`,
};

// ── Curated Fontshare-first font pairs ──
const FONT_POOLS: Record<string, FontConfig[]> = {
  corporate: [
    {
      display: "Satoshi",
      body: "General Sans",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500&display=swap" rel="stylesheet">`,
    },
    {
      display: "Cabinet Grotesk",
      body: "Satoshi",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500&display=swap" rel="stylesheet">`,
    },
    {
      display: "Switzer",
      body: "Satoshi",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500&display=swap" rel="stylesheet">`,
    },
  ],
  elegant: [
    {
      display: "Zodiak",
      body: "Switzer",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=zodiak@400,500,700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500&display=swap" rel="stylesheet">`,
    },
    {
      display: "Boska",
      body: "General Sans",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=boska@400,500,700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500&display=swap" rel="stylesheet">`,
    },
    {
      display: "Sentient",
      body: "Supreme",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=sentient@400,500,700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=supreme@400,500&display=swap" rel="stylesheet">`,
    },
  ],
  tech: [
    {
      display: "Clash Display",
      body: "Archivo",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&display=swap" rel="stylesheet">`,
    },
    {
      display: "Outfit",
      body: "Switzer",
      displayUrl: `<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=switzer@300,400,500&display=swap" rel="stylesheet">`,
    },
    {
      display: "Archivo",
      body: "Satoshi",
      displayUrl: `<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500&display=swap" rel="stylesheet">`,
    },
  ],
  creative: [
    {
      display: "Pally",
      body: "Neco",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=pally@400,500,700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=neco@400&display=swap" rel="stylesheet">`,
    },
    {
      display: "Chubbo",
      body: "Supreme",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=chubbo@400,500,700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=supreme@400,500&display=swap" rel="stylesheet">`,
    },
    {
      display: "Amulya",
      body: "Synonym",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=amulya@400,500,700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=synonym@400,500&display=swap" rel="stylesheet">`,
    },
  ],
  boldEnergy: [
    {
      display: "Khand",
      body: "Hind",
      displayUrl: `<link href="https://fonts.googleapis.com/css2?family=Khand:wght@400;500;700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://fonts.googleapis.com/css2?family=Hind:wght@400;500&display=swap" rel="stylesheet">`,
    },
    {
      display: "Stardom",
      body: "Satoshi",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=stardom@400,700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500&display=swap" rel="stylesheet">`,
    },
  ],
  technical: [
    {
      display: "JetBrains Mono",
      body: "General Sans",
      displayUrl: `<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500&display=swap" rel="stylesheet">`,
    },
    {
      display: "Khand",
      body: "Hind",
      displayUrl: `<link href="https://fonts.googleapis.com/css2?family=Khand:wght@400;500;700&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://fonts.googleapis.com/css2?family=Hind:wght@400;500&display=swap" rel="stylesheet">`,
    },
    {
      display: "Tanker",
      body: "Bespoke Serif",
      displayUrl: `<link href="https://api.fontshare.com/v2/css?f[]=tanker@400&display=swap" rel="stylesheet">`,
      bodyUrl: `<link href="https://api.fontshare.com/v2/css?f[]=bespoke-serif@400,500&display=swap" rel="stylesheet">`,
    },
  ],
};

function resolveFonts(architect?: ArchitectOutput): {
  displayUrl: string;
  bodyUrl: string;
  monoUrl: string;
  display: string;
  body: string;
  mono: string;
} {
  const mood = architect?.visualMood;
  const monoUrl = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/geist-mono@5.0.1/400.css">`;
  const mono = "Geist Mono";
  const brand = architect?.brandName ?? "default";

  // Map visual mood → font pool
  let pool: FontConfig[];
  switch (mood) {
    case "corporate-precision":
      pool = FONT_POOLS.corporate;
      break;
    case "editorial-clean":
      pool = FONT_POOLS.tech;
      break;
    case "luxury-minimal":
      pool = FONT_POOLS.elegant;
      break;
    case "bold-energy":
      pool = FONT_POOLS.boldEnergy;
      break;
    case "cinematic-dark":
      // Cinematic-dark spans construction (technical) + restaurant (elegant)
      pool = [...FONT_POOLS.technical, ...FONT_POOLS.elegant];
      break;
    default:
      pool = FONT_POOLS.corporate;
  }

  // Deterministic variety: pick from pool based on brand name hash
  const pick = pool[fontHash(brand) % pool.length];

  return {
    display: pick.display,
    body: pick.body,
    mono,
    displayUrl: pick.displayUrl,
    bodyUrl: pick.bodyUrl,
    monoUrl,
  };
}

function navbarInnerCss(style: UIDesignSpec["navbarStyle"] | undefined): string {
  if (style === "pill-floating") {
    return `max-w-5xl w-full mx-auto rounded-full px-6 py-3 flex items-center justify-between`;
  }
  return `max-w-7xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between`;
}


export function getShellPrompt(
  isSinglePage = false,
  architect?: ArchitectOutput,
  uiSpec?: UIDesignSpec,
): string {
  // Resolve fonts from architect if provided, otherwise fallback to deterministic hash
  const resolvedFonts = architect?.fonts || resolveFonts(architect);
  const isBold = architect?.visualMood === "bold-energy"; // ← add this
  const navLinkDetails = architect
    ? architect.pages
        .map((id, i) => `href="#${id}" label="${architect.pageLabels[i]}"`)
        .join(", ")
    : `href="#home" label="Home", href="#features" label="Features", href="#pricing" label="Pricing", href="#contact" label="Contact"`;

  const navCls = navbarCss(uiSpec?.navbarStyle);
  const navInnerCls = navbarInnerCss(uiSpec?.navbarStyle);
  const isPill = uiSpec?.navbarStyle === "pill-floating";

  return `You are a world-class frontend developer building a stunning website shell.

OUTPUT RULES — CRITICAL:
- Start with <!DOCTYPE html>
- End your output with <!-- PAGES_START --> on its own line, then STOP
- Do NOT write any page sections or footer content
- Raw HTML only — no markdown, no backticks, no explanation
- NEVER use backdrop-blur or backdrop-filter anywhere — use solid backgrounds with opacity instead.

STACK (exact CDN links, in this order):
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css" rel="stylesheet">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>

GENERATE IN THIS EXACT ORDER:

1. <!DOCTYPE html><html lang="en" data-theme="dark" class="scroll-smooth">

2. <head> containing:
   - meta charset + viewport + descriptive <title>
   - CDN links above (in order)
   - Font CDN links — paste ALL THREE in this exact order:
     ${resolvedFonts.displayUrl}
     ${resolvedFonts.bodyUrl}
     ${resolvedFonts.monoUrl}
   - tailwind.config script with THESE EXACT values (do not change them):
     primary: '${architect?.colors.primary ?? "choose vivid brand color"}',
     secondary: '${architect?.colors.secondary ?? "choose complement"}',
     surface: '${architect?.colors.surface ?? "choose card bg"}',
     fontFamily: { display: ['${resolvedFonts.display}'], body: ['${resolvedFonts.body}'], mono: ['${resolvedFonts.mono}'] },
     Plus custom keyframes needed (marquee, gradient-shift, fade-in, counter, orb-float). No other custom CSS outside keyframes.
   - <style> block with ALL shared CSS classes pages will reference:
     * body { font-family: '${resolvedFonts.body}', sans-serif; background-color: ${architect?.colors.background ?? "#0a0a0a"}; }
     * .font-display { font-family: '${resolvedFonts.display}', sans-serif; }
     * .font-mono-ui { font-family: '${resolvedFonts.mono}', monospace; letter-spacing: 0.06em; }
     * .glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
     * .page { display: none; }
     * .fade-in { } (JS will set opacity/transform via IntersectionObserver)
     * .counter { }
     * Any orb / glow gradient helpers
    ⚠️ DO NOT add any noise, grain, or texture overlay classes — they degrade image quality and look unprofessional.
    ⚠️ NEVER use external URLs in CSS (no url("https://...") for textures). CSS-only patterns only.
     ${(architect?.visualMood === "luxury-minimal" || architect?.visualMood === "cinematic-dark")
       ? "⚠️ LUXURY MODE: Do NOT add .orb class or any blurred blob elements — these look cheap in luxury contexts."
       : ""}
   </head>

3. <body x-data="{ open: false }">

4. ROUTING SCRIPT — IMMEDIATELY after <body>, before navbar — no exceptions:
<script>
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.style.display='none');var el=document.getElementById('page-'+id);if(el){el.style.display='block';window.scrollTo(0,0);if(window.lucide)lucide.createIcons();}else{showPage('home');return;}}
window.addEventListener('hashchange',function(){showPage(window.location.hash.slice(1)||'home');});
window.addEventListener('load',function(){showPage(window.location.hash.slice(1)||'home');if(window.lucide)lucide.createIcons();});
</script>

GLOBAL DESIGN PHILOSOPHY:
- Less is more: prefer whitespace over density. Section padding py-28 minimum, py-32 for key sections.
- Container discipline — ALL sections must use: max-w-6xl mx-auto px-8 sm:px-12 lg:px-20 xl:px-24. NEVER use px-6 alone as the only horizontal padding. Always include responsive steps. max-w-6xl (1152px) keeps content centered with generous margins on wide screens.
- Hero text panels specifically need generous breathing room: minimum px-10 lg:px-20 xl:px-28 for corporate/luxury, px-8 lg:px-16 for bold contexts.
- Typography scale — be refined, NOT oversized:
  Hero h1: text-4xl sm:text-5xl lg:text-6xl (standard). NEVER exceed text-7xl unless bold-energy mood.
  Section h2: text-3xl sm:text-4xl lg:text-5xl — NEVER bigger.
  Card h3: text-lg md:text-xl — always subtle.
  Body copy: text-base leading-relaxed, max-w-prose (65ch) for readability.
- Accent color (text-primary) SPARINGLY: stats numbers, overline labels, active nav, CTA buttons ONLY.
- Borders over backgrounds: border border-white/10 preferred over glass cards for premium minimal look.
- Letter spacing: uppercase labels always tracking-[0.25em] or wider.
- Cubic-bezier transitions always: transition: X 0.7s cubic-bezier(0.25,0.46,0.45,0.94) — NEVER linear.
- ICONS: Use Lucide icons via <i data-lucide="icon-name" class="w-5 h-5"></i>. Common icons: shield-check, target, flame, gem, rocket, settings, mail, phone, map-pin, star, users, trending-up, zap, award, clock, check-circle, arrow-right. ⚠️ CRITICAL: Lucide REMOVED all brand icons! NEVER use facebook, twitter, instagram, linkedin, youtube, or tiktok. Use raw SVGs instead for these. Do NOT use emoji for UI elements — always use Lucide.

5. Complete <nav id="navbar"> — implement EXACTLY this style: ${uiSpec?.navbarStyle ?? "full-minimal"}
   
   Outer nav class="${navCls}"
   Inner div class="${navInnerCls}"${isPill ? ` style="background:rgba(${architect ? "10,10,10" : "15,15,15"},0.85);"` : ""}

   ${isPill
     ? `Pill navbar inner div: backdrop is SOLID dark opacity (style="background:rgba(10,10,10,0.85)") — NOT backdrop-blur`
     : `Full-width navbar background: style="background:rgba(${architect?.colors.background ? architect.colors.background.replace("#", "").match(/.{2}/g)?.map(h => parseInt(h, 16)).join(",") : "6,6,6"},0.93)" on scroll this changes to 0.98 via JS`
   }

   Always include:
   - Logo: font-display ${uiSpec?.typographyWeight === "medium" ? "font-medium text-xl" : uiSpec?.typographyWeight === "black" ? "font-black text-2xl" : "font-bold text-2xl"} ${uiSpec?.typographyTracking === "relaxed" ? "tracking-wide" : uiSpec?.typographyTracking === "normal" ? "tracking-normal" : "tracking-normal"} text-primary with nav-link class, href="#home"
     ${(architect?.visualMood === "luxury-minimal") ? "Luxury logo style: small dot (w-2 h-2 rounded-full bg-secondary mr-2) + brand name in font-medium text-lg tracking-tighter uppercase" : ""}
   - Desktop nav: hidden lg:flex centered links. ${isSinglePage ? "Single page — anchor links #hero #features #pricing #contact" : `Multi-page — use EXACTLY: ${navLinkDetails}. Each gets class="nav-link". Active gets text-primary.`}
  Nav link style: text-sm font-medium tracking-wide${isBold ? " uppercase tracking-[0.15em]" : ""} text-white/70 hover:text-white transition-colors — do NOT add uppercase unless bold-energy mood
   - CTA button: hidden lg:flex btn btn-primary btn-sm rounded-full with subtle box-shadow glow
   - Hamburger: lg:hidden
   - Mobile slide-out menu — x-show="open":
     ⚠️ MOBILE MENU — rules required:
     1. ALWAYS solid opaque background: style="background:${architect?.colors.background ?? "#0a0a0a"}"
     2. NEVER put display:none in style attribute — Alpine x-show manages display.
     3. ALWAYS include a completely visible close button at the top right of the menu (e.g., <button @click="open=false" class="absolute top-6 right-6 p-4">...</button>).
   - Backdrop overlay: x-show="open" @click="open=false" fixed inset-0 bg-black/60

6. After </nav>, write this EXACT comment and STOP:
<!-- PAGES_START -->`;
}

export function getPagePrompt(
  pageId: string,
  pageLabel: string,
  businessPrompt: string,
  designTokens: string,
  heroImageUrl?: string,
  architect?: ArchitectOutput,
  uiSpec?: UIDesignSpec,
  contentBrief?: ContentBrief,
): string {
  const heroNote = heroImageUrl
    ? `\nHERO IMAGE URL (use exactly as src): ${heroImageUrl}`
    : "";

  const isHome = pageId === "home";
  const isContact = pageId === "contact";

  // ── Build content variables from ContentBrief or defaults ──
  const tagline = contentBrief?.tagline ?? "Build Something Remarkable";
  const subtagline = contentBrief?.subtagline ?? "We help ambitious businesses achieve their goals.";
  const rawStats = contentBrief?.stats ?? [
    { value: "500+", label: "Projects Completed" },
    { value: "12", label: "Years of Experience" },
    { value: "98%", label: "Client Satisfaction" },
  ];
  // Auto-format large numbers to use 'k' abbreviation (e.g. 10,000+ -> 10k+) to prevent wrap/overflow
  const stats = rawStats.map(s => ({
    ...s,
    value: s.value.replace(/(\d+),?000(\+?)/g, '$1k$2')
  }));
  const socialProofNames = contentBrief?.socialProofNames ?? [
    "ArchGroup", "MetroBuilds", "UrbanFrame", "SteelCore", "NovaCivil", "ApexEng", "CityDev", "StructWorks"
  ];
  const testimonials = contentBrief?.testimonials ?? [
    { quote: "They transformed our vision into reality. On time, on budget, zero compromises.", name: "James Morrison", role: "CEO", company: "Vertex Holdings" },
    { quote: "The attention to structural detail was unlike anything we had seen. Outstanding.", name: "Sarah Chen", role: "Project Director", company: "MetroGroup" },
    { quote: "Our most complex project yet. They handled it with precision and professionalism.", name: "David Okafor", role: "CFO", company: "Summit Real Estate" },
  ];
  const ctaHeadline = contentBrief?.ctaHeadline ?? "Ready to Start Building?";
  const ctaSubtext = contentBrief?.ctaSubtext ?? "Let's turn your vision into a reality.";
  const ctaButtonText = contentBrief?.ctaButtonText ?? "Start Your Project";
  const featureNames = contentBrief?.featureNames ?? ["Premium Quality", "Expert Team", "On-Time Delivery", "Clear Communication", "Proven Results", "Full Support"];
  const featureDescriptions = contentBrief?.featureDescriptions ?? [
    "Uncompromising standards at every stage.",
    "Specialists with decades of hands-on experience.",
    "We hit deadlines — every single time.",
    "Transparent updates throughout the process.",
    "A portfolio that speaks louder than promises.",
    "We're with you long after completion.",
  ];
  const valueProps = contentBrief?.valueProps ?? ["Quality that speaks for itself", "Teams that deliver on promises", "Systems built to last"];

  // ── UI spec defaults ──
  const heroVariant = uiSpec?.heroVariant ?? "split-image-right";
  const featuresVariant = uiSpec?.featuresVariant ?? "editorial-strips";
  const imageStyle = uiSpec?.imageStyle ?? "full-color-cinematic";
  const cardStyle = uiSpec?.cardStyle ?? "glass-elevated";
  const typographyScale = uiSpec?.typographyScale ?? "balanced";
  const heroOverlay = uiSpec?.heroOverlayStyle ?? "cinematic-dark";
    // ── Font weight based on visual mood ──
  const mood = architect?.visualMood ?? "cinematic-dark";
  const isLuxury = mood === "luxury-minimal" || mood === "editorial-clean";
  const isBold = mood === "bold-energy";

  const h1Size = isBold
    ? (typographyScale === "display-dominant"
        ? "text-5xl sm:text-6xl lg:text-7xl"
        : "text-4xl sm:text-5xl lg:text-6xl")
    : isLuxury
      ? "text-4xl sm:text-5xl lg:text-6xl"
      : (typographyScale === "display-dominant"
          ? "text-4xl sm:text-5xl lg:text-6xl"
          : "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl");

  const h2Size = isBold
    ? "text-4xl sm:text-5xl lg:text-6xl"
    : "text-3xl sm:text-4xl lg:text-5xl";

  // ── Spacing system — derived from mood, not hardcoded ──
  const heroTextPadding = isLuxury
    ? "px-12 sm:px-16 lg:px-24 xl:px-32 py-36"
    : isBold
      ? "px-8 sm:px-12 lg:px-16 xl:px-20 py-28"
      : "px-10 sm:px-14 lg:px-20 xl:px-28 py-32";

  const sectionContainer = "max-w-6xl mx-auto px-8 sm:px-12 lg:px-20 xl:px-24";

  const headingWeight = uiSpec?.typographyWeight === "black" ? "font-black" : uiSpec?.typographyWeight === "bold" ? "font-bold" : uiSpec?.typographyWeight === "medium" ? "font-medium" : (isLuxury ? "font-medium" : isBold ? "font-black" : "font-semibold");
  const headingTracking = uiSpec?.typographyTracking === "relaxed" ? "tracking-wide" : uiSpec?.typographyTracking === "normal" ? "tracking-normal" : uiSpec?.typographyTracking === "tight" ? "tracking-tight" : (isLuxury ? "tracking-tighter" : isBold ? "tracking-tight" : "tracking-tight");
  const bodyTextColor = isLuxury ? "text-zinc-400" : "text-white/60";
  const bodyFontWeight = isLuxury ? "font-light" : "font-normal";
  const accentOnHeadline = isLuxury ? "text-white/50" : "text-primary";
  const ctaClass = isLuxury
    ? `inline-flex items-center justify-center gap-2 h-14 px-8 bg-primary text-background text-sm ${headingWeight} tracking-[0.15em] uppercase leading-none hover:bg-white transition-all duration-500 shadow-[0_0_20px_rgba(var(--primary-rgb,201,168,76),0.3)]`
    : `inline-flex items-center justify-center gap-2 h-14 px-8 bg-primary text-background text-sm font-bold tracking-widest uppercase leading-none hover:opacity-90 transition-all duration-300 rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb,201,168,76),0.4)]`;
  const outlineCta = isLuxury
    ? `inline-flex items-center justify-center gap-2 h-14 px-8 border border-white/20 text-white text-sm ${bodyFontWeight} tracking-[0.15em] uppercase leading-none hover:border-primary hover:text-primary transition-all duration-500`
    : `inline-flex items-center justify-center gap-2 h-14 px-8 border border-white/30 text-white text-sm font-medium tracking-widest uppercase leading-none hover:border-primary hover:text-primary transition-all duration-300 rounded-full`;
  const statNumberClass = isLuxury
    ? `font-display ${headingWeight} text-5xl md:text-6xl text-primary`
    : `counter font-display ${headingWeight} ${headingTracking} text-4xl md:text-5xl text-primary`;
  const imageHover = isLuxury
    ? `grayscale-[20%] group-hover:grayscale-0 transition-all duration-700`
    : `transition-transform duration-700 group-hover:scale-105`;
  const imageFrame = isLuxury
    ? `<div class="absolute -inset-3 border border-primary/15 pointer-events-none translate-x-3 translate-y-3 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-700"></div>`
    : ``;

  const cardCss = cardStyle === "glass-elevated"
    ? "glass border border-white/10 rounded-2xl hover:-translate-y-2 transition-transform duration-300"
    : cardStyle === "solid-dark"
      ? "bg-surface border-l-2 border-primary"
      : cardStyle === "outlined"
        ? "border border-white/20 rounded-xl hover:border-primary/60 transition-colors"
        : "border-b border-white/10 hover:border-primary/40 transition-colors"; // borderless-hover

  // ── IMAGE TREATMENT ──
  const imgGrayscaleStyle = imageStyle === "grayscale-hover-color"
    ? `style="filter:grayscale(100%) contrast(1.1)"`
    : "";
  const imgHoverClass = imageStyle === "grayscale-hover-color"
    ? "transition-all duration-700 group-hover:grayscale-0"
    : "";
  const featureOverlay = imageStyle === "grayscale-hover-color"
    ? `<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"></div>`
    : imageStyle === "full-color-cinematic"
      ? `<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>`
      : "";

  // ── HERO VARIANT TEMPLATES ──
  const heroTemplates: Record<string, string> = {
    "split-image-right": `
<!-- CC:hero --><section class="relative pt-32 pb-0 min-h-screen grid lg:grid-cols-2 items-center">
  <!-- Left: Text panel -->
  <div class="flex flex-col justify-center ${heroTextPadding} fade-in">
    <span class="inline-block text-xs tracking-[0.4em] uppercase text-primary border-b border-primary pb-2 mb-8 self-start">${valueProps[0]}</span>
    <h1 class="font-display ${headingWeight} ${h1Size} leading-[1.05] ${headingTracking} mb-6">
      ${tagline.split(" ").slice(0, Math.ceil(tagline.split(" ").length / 2)).join(" ")}<br>
      <span class="${accentOnHeadline}">${tagline.split(" ").slice(Math.ceil(tagline.split(" ").length / 2)).join(" ")}</span>
    </h1>
    <p class="${bodyTextColor} text-lg max-w-lg mb-10 leading-relaxed ${bodyFontWeight}">${subtagline}</p>
    <div class="flex flex-wrap gap-4">
     <a href="#contact" class="${ctaClass}">${ctaButtonText}</a>
      <a href="#" class="${outlineCta}">View Portfolio</a>
    </div>
  </div>


  
     <!-- Right: Image panel -->
  <div class="relative h-[60vh] lg:h-screen overflow-hidden group">
    <img src="${heroImageUrl}" alt="hero" class="w-full h-full object-cover ${imgHoverClass}" ${imgGrayscaleStyle}>
    <div class="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/40 pointer-events-none"></div>
    ${heroOverlay === "cinematic-dark" ? `<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"></div>` : ""}
    <!-- Floating stat card -->
    <div class="absolute bottom-8 left-8 glass border border-white/10 rounded-2xl px-6 py-4">
      <div class="font-display \ text-4xl text-primary">${stats[0]?.value ?? "500+"}</div>
      <div class="text-xs tracking-[0.2em] uppercase text-white/50 mt-1">${stats[0]?.label ?? "Projects"}</div>
    </div>
  </div>
</section><!-- /CC:hero -->`,

    "split-image-left": `
<!-- CC:hero --><section class="relative pt-0 min-h-screen grid lg:grid-cols-2 items-stretch">
  <!-- Left: Image panel (full height) -->
  <div class="relative h-[50vh] lg:h-screen overflow-hidden group order-last lg:order-first">
    <img src="${heroImageUrl}" alt="hero" class="w-full h-full object-cover ${imgHoverClass}" ${imgGrayscaleStyle}>
    ${heroOverlay === "cinematic-dark" ? `<div class="absolute inset-0 bg-gradient-to-r from-transparent to-black/40 pointer-events-none"></div>` : ""}
    ${heroOverlay === "tinted-primary" ? `<div class="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none"></div>` : ""}
    <!-- Floating stat -->
    <div class="absolute top-8 right-8 glass border border-white/10 rounded-2xl px-6 py-4 text-center">
      <div class="font-display \ text-5xl text-primary">${stats[0]?.value ?? "500+"}</div>
      <div class="text-xs tracking-[0.25em] uppercase text-white/50">${stats[0]?.label ?? "Projects"}</div>
    </div>
  </div>
  <!-- Right: Text panel -->
 <div class="flex flex-col justify-center ${heroTextPadding} lg:pt-40 fade-in">
    <span class="inline-block text-xs tracking-[0.4em] uppercase text-primary border-b border-primary pb-2 mb-8 self-start">${valueProps[0]}</span>
    <h1 class="font-display \ ${h1Size} leading-[1.05]\ mb-6">
      ${tagline.split(" ").slice(0, Math.ceil(tagline.split(" ").length / 2)).join(" ")}<br>
      <span class="text-primary">${tagline.split(" ").slice(Math.ceil(tagline.split(" ").length / 2)).join(" ")}</span>
    </h1>
    <p class="${bodyTextColor} text-lg mb-10 leading-relaxed max-w-md ${bodyFontWeight}">${subtagline}</p>
    <div class="flex flex-wrap gap-4">
      <a href="#contact" class="${ctaClass}">${ctaButtonText}</a>
      <a href="#" class="${outlineCta}">Learn More</a>
    </div>
  </div>
</section><!-- /CC:hero -->`,

    "centered-fullbleed": `
<!-- CC:hero --><section class="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
  <!-- Full-bleed background image -->
 <img src="${heroImageUrl}" alt="hero" class="absolute inset-0 w-full h-full object-cover scale-105" style="${isLuxury ? "filter:brightness(0.65);opacity:0.9" : "opacity:0.8"}">
  <!-- Cinematic dark overlay -->
  <div class="absolute inset-0 ${isLuxury ? "bg-gradient-to-t from-background via-background/55 to-background/20" : "bg-gradient-to-b from-black/60 via-black/40 to-black/85"} pointer-events-none"></div>
  <!-- Content -->
  <div class="relative z-10 px-6 sm:px-10 max-w-5xl mx-auto pt-32 pb-24 fade-in">
    <div class="flex items-center justify-center gap-4 mb-8">
      <div class="w-8 h-[1px] bg-primary"></div>
      <span class="text-xs ${bodyFontWeight} tracking-[0.3em] uppercase text-primary">${valueProps[0]}</span>
      <div class="w-8 h-[1px] bg-primary"></div>
    </div>
    <h1 class="font-display ${headingWeight} ${h1Size} leading-[1.05] ${headingTracking} mb-6 text-white">
      ${tagline}
    </h1>
    <p class="${bodyTextColor} text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${bodyFontWeight}">${subtagline}</p>
    <div class="flex flex-wrap gap-4 justify-center">
    <a href="#contact" class="${ctaClass}">${ctaButtonText}</a>
    </div>
  </div>
</section><!-- /CC:hero -->`,

    "minimal-text-only": `
<!-- CC:hero --><section class="relative min-h-screen flex items-center justify-center px-6 sm:px-10 max-w-6xl mx-auto pt-24 overflow-hidden text-center">
  <div class="fade-in flex flex-col items-center">
    <span class="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-8 px-4 py-1.5 border border-primary/30 rounded-full">${valueProps[0]}</span>
    <h1 class="font-display ${headingWeight} ${h1Size} leading-[1.05] ${headingTracking} max-w-5xl mx-auto mb-8">
      ${tagline.split(" ").slice(0, Math.ceil(tagline.split(" ").length / 2)).join(" ")}
      <span class="text-primary/90">${tagline.split(" ").slice(Math.ceil(tagline.split(" ").length / 2)).join(" ")}</span>
    </h1>
    <p class="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">${subtagline}</p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-5">
      <a href="#contact" class="${ctaClass}">${ctaButtonText}</a>
      <a href="#" class="${outlineCta}">Our Work</a>
    </div>
  </div>
</section><!-- /CC:hero -->`,

    "overlay-panel": `
<!-- CC:hero --><section class="relative min-h-screen grid lg:grid-cols-[55%_45%]">
  <!-- Left: Full-height sticky image panel -->
  <div class="relative h-[50vh] lg:h-screen overflow-hidden group sticky top-0">
    <img src="${heroImageUrl}" alt="hero" class="w-full h-full object-cover ${imgHoverClass}" ${imgGrayscaleStyle}>
    <div class="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/60 pointer-events-none"></div>
    ${heroOverlay === "cinematic-dark" ? `<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>` : ""}
    <!-- Bottom-left overline in image -->
    <div class="absolute bottom-10 left-10">
      <div class="text-xs tracking-[0.4em] uppercase text-white/60 mb-2">${valueProps[1] ?? "Since " + new Date().getFullYear()}</div>
      <div class="font-display \ text-4xl text-white">${stats[0]?.value ?? "250+"}<span class="text-xs font-normal tracking-widest text-white/50 ml-2">${stats[0]?.label ?? "Projects"}</span></div>
    </div>
  </div>
  <!-- Right: Text panel -->
  <div class="flex flex-col justify-center bg-surface ${heroTextPadding} pt-40 lg:pt-40 fade-in">
    <span class="inline-block text-xs tracking-[0.4em] uppercase text-primary border-b border-primary pb-2 mb-8 self-start">${valueProps[0]}</span>
    <h1 class="font-display \ ${h1Size} leading-[1.05] \ mb-6 text-white">
      ${tagline.split(" ").slice(0, Math.ceil(tagline.split(" ").length / 2)).join(" ")}<br>
      <span class="text-primary">${tagline.split(" ").slice(Math.ceil(tagline.split(" ").length / 2)).join(" ")}</span>
    </h1>
    <p class="text-white/60 text-base leading-relaxed mb-10 max-w-sm">${subtagline}</p>
    <div class="flex flex-col gap-4">
      <a href="#contact" class="btn btn-primary rounded-none w-full">${ctaButtonText}</a>
      <a href="#" class="btn btn-outline rounded-none w-full">View Portfolio</a>
    </div>
    <!-- Stat list below CTA -->
    <div class="mt-12 pt-8 border-t border-white/10 flex gap-8">
      ${stats.slice(1, 3).map(s => `<div><div class="font-display \ text-3xl text-primary">${s.value}</div><div class="text-xs tracking-[0.25em] uppercase text-white/40">${s.label}</div></div>`).join("")}
    </div>
  </div>
</section><!-- /CC:hero -->`,
  };

  // ── FEATURES VARIANT TEMPLATES ──
  const featuresTemplates: Record<string, string> = {
    "editorial-strips": `
<!-- CC:features-preview -->
<section class="py-0 overflow-hidden">
  <!-- Strip 1: Image left, text right -->
  <div class="grid lg:grid-cols-[55%_45%] min-h-[70vh] group">
    <div class="relative overflow-hidden h-[50vh] lg:h-auto">
      <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80" alt="${featureNames[0]}" class="w-full h-full object-cover ${imgHoverClass}" ${imgGrayscaleStyle}>
      ${featureOverlay}
    </div>
    <div class="flex flex-col justify-center px-10 md:px-16 lg:px-20 py-20 bg-surface fade-in">
      <span class="text-xs tracking-[0.4em] uppercase text-primary border-b border-primary pb-2 inline-block mb-8 self-start">Our DNA</span>
      <h2 class="font-display \ ${h2Size} leading-tight mb-6">${featureNames[0]}<br><span class="text-primary">${featureNames[1]}</span></h2>
      <p class="text-white/60 leading-relaxed mb-10 max-w-sm">${featureDescriptions[0]}</p>
      <a href="#contact" class="btn btn-outline btn-primary rounded-none self-start px-8">${ctaButtonText}</a>
    </div>
  </div>
  <!-- Strip 2: Text left, image right -->
  <div class="grid lg:grid-cols-[45%_55%] min-h-[70vh] group">
    <div class="flex flex-col justify-center px-10 md:px-16 lg:px-20 py-20 bg-black/20 fade-in order-last lg:order-first">
      <span class="text-xs tracking-[0.4em] uppercase text-primary border-b border-primary pb-2 inline-block mb-8 self-start">Methodology</span>
      <h2 class="font-display \ ${h2Size} leading-tight mb-6">${featureNames[2]}<br><span class="text-white/40">${featureNames[3]}</span></h2>
      <p class="text-white/60 leading-relaxed mb-10 max-w-sm">${featureDescriptions[2]}</p>
      <a href="#" class="btn btn-outline rounded-none self-start px-8">Learn More</a>
    </div>
    <div class="relative overflow-hidden h-[50vh] lg:h-auto group">
      <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80" alt="${featureNames[2]}" class="w-full h-full object-cover ${imgHoverClass}" ${imgGrayscaleStyle}>
      ${featureOverlay}
    </div>
  </div>
</section><!-- /CC:features-preview -->`,

    "bold-stacked": `
<!-- CC:features-preview -->
<section class="py-0">
  ${[0, 1, 2].map((i) => `
  <div class="relative min-h-[60vh] flex items-end overflow-hidden group">
    <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80" alt="${featureNames[i]}" class="absolute inset-0 w-full h-full object-cover ${imgHoverClass}" ${imgGrayscaleStyle}>
    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 pointer-events-none"></div>
    <div class="relative z-10 p-10 md:p-16 pb-16 fade-in max-w-2xl">
      <span class="text-xs tracking-[0.5em] uppercase text-primary mb-4 block">0${i + 1}</span>
    <h2 class="font-display ${headingWeight} ${headingTracking} ${h2Size} leading-tight text-white mb-4">${featureNames[i]}</h2>
      <p class="text-white/60 text-base leading-relaxed mb-6 max-w-md">${featureDescriptions[i]}</p>
      <a href="#contact" class="btn btn-outline btn-sm rounded-none px-8 text-white border-white/40 hover:border-primary hover:text-primary">${ctaButtonText}</a>
    </div>
  </div>`).join("")}
</section><!-- /CC:features-preview -->`,

    "magazine-grid": `
<!-- CC:features-preview -->
<section class="py-24 max-w-7xl mx-auto px-6">
  <div class="mb-16 fade-in">
    <span class="text-xs tracking-[0.4em] uppercase text-primary mb-4 block">What We Do</span>
    <h2 class="font-display \ ${h2Size} max-w-xl">${featureNames[0]} &amp; <span class="text-primary">${featureNames[1]}</span></h2>
  </div>
  <div class="grid grid-cols-12 gap-4">
    <!-- Large card spanning 8 cols -->
    <div class="col-span-12 md:col-span-8 relative h-[500px] overflow-hidden rounded-2xl group fade-in">
      <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80" alt="${featureNames[0]}" class="w-full h-full object-cover ${imgHoverClass}" ${imgGrayscaleStyle}>
      ${featureOverlay}
      <div class="absolute bottom-0 left-0 right-0 p-8">
        <h3 class="font-display \ text-3xl text-white">${featureNames[0]}</h3>
        <p class="text-white/60 mt-2">${featureDescriptions[0]}</p>
      </div>
    </div>
    <!-- Small card 4 cols -->
    <div class="col-span-12 md:col-span-4 relative h-[500px] overflow-hidden rounded-2xl group fade-in">
      <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80" alt="${featureNames[1]}" class="w-full h-full object-cover ${imgHoverClass}" ${imgGrayscaleStyle}>
      ${featureOverlay}
      <div class="absolute bottom-0 left-0 right-0 p-8">
        <h3 class="font-display \ text-2xl text-white">${featureNames[1]}</h3>
        <p class="text-white/60 mt-2 text-sm">${featureDescriptions[1]}</p>
      </div>
    </div>
    <!-- 3 equal cards below -->
    ${[2, 3, 4].map((i) => `
    <div class="col-span-12 md:col-span-4 relative h-[300px] overflow-hidden rounded-2xl group fade-in">
      <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&q=80" alt="${featureNames[i]}" class="w-full h-full object-cover ${imgHoverClass}" ${imgGrayscaleStyle}>
      ${featureOverlay}
      <div class="absolute bottom-0 left-0 right-0 p-6">
        <h3 class="font-display \ text-xl text-white">${featureNames[i]}</h3>
        <p class="text-white/50 mt-1 text-sm">${featureDescriptions[i]}</p>
      </div>
    </div>`).join("")}
  </div>
</section><!-- /CC:features-preview -->`,

    "corporate-3col": `
<!-- CC:features-preview -->
<section class="py-28 max-w-6xl mx-auto px-8 sm:px-12 lg:px-20">
  <div class="mb-16 text-center fade-in">
    <span class="text-xs tracking-[0.4em] uppercase text-primary mb-4 block">What We Offer</span>
    <h2 class="font-display \ ${h2Size}">Built for <span class="text-primary">${featureNames[0]}</span></h2>
    <p class="text-white/50 max-w-xl mx-auto mt-4">${subtagline}</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10">
    ${featureNames.slice(0, 6).map((name, i) => `
    <div class="${cardCss} ${i % 3 !== 2 ? "border-r border-white/10" : ""} p-10 fade-in">
      <i data-lucide="${["zap","target","flame","gem","rocket","settings"][i]}" class="w-8 h-8 text-primary mb-4"></i>
      <h3 class="font-display \ text-xl mb-3">${name}</h3>
      <p class="text-white/50 text-sm leading-relaxed">${featureDescriptions[i]}</p>
    </div>`).join("")}
  </div>
  <!-- Process steps below grid -->
  <div class="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
    ${valueProps.map((vp, i) => `
    <div class="fade-in">
      <div class="font-display \ text-5xl text-primary/20 mb-4">0${i + 1}</div>
      <h3 class="font-display \ text-xl mb-2">${vp}</h3>
      <p class="text-white/40 text-sm">${featureDescriptions[i] ?? ""}</p>
    </div>`).join("")}
  </div>
</section><!-- /CC:features-preview -->`,

    "elegant-split": `
<!-- CC:features-preview -->
<section class="py-0">
  <!-- Section 1 -->
  <div class="grid lg:grid-cols-2 min-h-screen">
    <div class="relative overflow-hidden h-[50vh] lg:h-auto group">
      <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80" alt="${featureNames[0]}" class="w-full h-full object-cover ${imgHoverClass}" ${imgGrayscaleStyle}>
      ${featureOverlay}
    </div>
    <div class="flex flex-col justify-center px-12 md:px-24 py-32 fade-in bg-black/20">
      <span class="text-xs tracking-[0.5em] uppercase text-primary mb-10 block">${valueProps[0]}</span>
      <h2 class="font-display \ ${h2Size} leading-tight mb-8">${featureNames[0]}<br><span class="text-primary">${featureNames[1]}</span></h2>
      <p class="text-white/60 text-lg leading-loose mb-12 max-w-md">${featureDescriptions[0]}</p>
      <a href="#contact" class="btn btn-outline btn-primary rounded-none self-start px-10">${ctaButtonText}</a>
    </div>
  </div>
  <!-- Section 2 (reversed) -->
  <div class="grid lg:grid-cols-2 min-h-screen">
    <div class="flex flex-col justify-center px-12 md:px-24 py-32 fade-in order-last lg:order-first">
      <span class="text-xs tracking-[0.5em] uppercase text-primary mb-10 block">${valueProps[1] ?? "Approach"}</span>
      <h2 class="font-display \ ${h2Size} leading-tight mb-8">${featureNames[2]}<br><span class="text-white/40">${featureNames[3]}</span></h2>
      <p class="text-white/60 text-lg leading-loose mb-12 max-w-md">${featureDescriptions[2]}</p>
      <a href="#" class="btn btn-ghost border border-white/20 rounded-none self-start px-10 hover:border-primary hover:text-primary">Explore More</a>
    </div>
    <div class="relative overflow-hidden h-[50vh] lg:h-auto group">
      <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80" alt="${featureNames[2]}" class="w-full h-full object-cover ${imgHoverClass}" ${imgGrayscaleStyle}>
      ${featureOverlay}
    </div>
  </div>
</section><!-- /CC:features-preview -->`,
  };

  // ── SOCIAL PROOF STRIP ──
  const socialProofStrip = `
<!-- CC:social-proof -->
<section class="py-12 border-y border-white/5">
  <p class="text-center text-xs tracking-[0.4em] uppercase text-white/30 mb-8">Trusted by Industry Leaders</p>
  <div class="overflow-hidden" style="mask-image:linear-gradient(to right,transparent,black 15%,black 85%,transparent)">
    <div class="flex gap-12 animate-marquee whitespace-nowrap" style="animation:marquee 30s linear infinite">
      ${[...socialProofNames, ...socialProofNames].map(name => `<span class="font-display ${headingWeight} tracking-wider text-xl text-white/40">${name}</span>`).join("")}
    </div>
  </div>
</section><!-- /CC:social-proof -->`;

  // ── STATS ROW ──
const statsRow = `
<!-- CC:stats -->
<section class="py-20 md:py-24">
  <div class="max-w-6xl mx-auto px-8 sm:px-12 lg:px-20 grid gap-8" style="grid-template-columns:repeat(${Math.min(stats.length, 4)},1fr)">
    ${stats.map(s => `
    <div class="text-center px-4 md:px-8 fade-in min-w-0">
      <div class="${statNumberClass.replace("text-7xl md:text-8xl lg:text-9xl", "text-5xl md:text-6xl lg:text-7xl")}" data-target="${s.value.replace(/[^0-9.]/g, "")}">${s.value}</div>
      <div class="text-[10px] md:text-xs tracking-[0.3em] uppercase text-white/40 mt-3 md:mt-4 ${bodyFontWeight}">${s.label}</div>
    </div>`).join("")}
  </div>
</section><!-- /CC:stats -->`;

  // ── TESTIMONIALS ──
  const testimonialsSection = `
<!-- CC:testimonials -->
<section class="py-24 px-6 overflow-hidden" x-data="{ active: 0, get isMobile() { return window.innerWidth < 768 } }" @resize.window="active = 0">
  <div class="max-w-7xl mx-auto">
    <div class="mb-12 text-center fade-in">
      <span class="text-xs tracking-[0.4em] uppercase text-primary mb-4 block">Social Proof</span>
      <h2 class="font-display \ ${h2Size}">What Clients <span class="text-primary">Say</span></h2>
    </div>
    <div class="overflow-hidden">
      <div class="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
           :style="'transform:translateX(-' + active * (isMobile ? 100 : 33.333) + '%)'">
        ${testimonials.map(t => `
        <div class="w-full md:w-[33.333%] px-4 shrink-0">
          <div class="${cardCss} p-8 md:p-10 rounded-2xl h-full flex flex-col overflow-hidden">
            <div class="font-display text-6xl text-primary opacity-40 leading-tight mb-6 shrink-0">❝</div>
            <p class="text-white/70 text-base leading-relaxed italic flex-1 break-words">${t.quote}</p>
            <div class="flex items-center gap-4 mt-8 pt-6 border-t border-white/10 shrink-0">
              <div class="w-10 h-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center \ text-primary font-bold">${t.name.split(" ").map(n => n[0]).join("")}</div>
              <div class="min-w-0">
                <div class="\ text-sm font-semibold truncate">${t.name}</div>
                <div class="text-xs text-white/40 tracking-widest uppercase truncate">${t.role}, ${t.company}</div>
              </div>
            </div>
          </div>
        </div>`).join("")}
      </div>
    </div>
    <div class="flex items-center justify-center gap-4 mt-8">
      <button @click="active=Math.max(0,active-1)" class="glass w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">←</button>
      <div class="flex gap-2">
        ${testimonials.map((_, i) => `<button @click="active=${i}" x-show="isMobile || ${i} <= ${Math.max(0, testimonials.length - 3)}" class="h-2 rounded-full transition-all" :class="active===${i}?'w-8 bg-primary':'w-2 bg-white/20'"></button>`).join("")}
      </div>
      <button @click="active=Math.min(isMobile ? ${testimonials.length - 1} : ${Math.max(0, testimonials.length - 3)}, active+1)" class="glass w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">→</button>
    </div>
  </div>
</section><!-- /CC:testimonials -->`;

  // ── CTA BANNER ──
const ctaBanner = isLuxury ? `
<!-- CC:cta-banner -->
<section class="py-32 px-6">
  <div class="max-w-5xl mx-auto text-center fade-in">
    <div class="w-12 h-[1px] bg-primary mx-auto mb-8"></div>
    <h2 class="font-display ${headingWeight} text-5xl md:text-6xl ${headingTracking} mb-6">${ctaHeadline}</h2>
    <p class="${bodyTextColor} text-lg mb-12 max-w-xl mx-auto leading-relaxed ${bodyFontWeight}">${ctaSubtext}</p>
    <a href="#contact" class="${ctaClass}">${ctaButtonText}</a>
  </div>
</section><!-- /CC:cta-banner -->` : `
<!-- CC:cta-banner -->
<section class="py-24 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="rounded-3xl p-16 text-center relative overflow-hidden fade-in" style="background:linear-gradient(135deg,${architect?.colors.primary ?? "#6366f1"},${architect?.colors.secondary ?? "#8b5cf6"})">
      <div class="absolute inset-0 opacity-10" style="background-image:radial-gradient(circle,rgba(255,255,255,0.4) 1px,transparent 1px);background-size:24px 24px"></div>
      <div class="relative z-10">
        <h2 class="font-display \ text-5xl md:text-6xl text-white mb-4">${ctaHeadline}</h2>
        <p class="text-white/80 text-lg mb-10">${ctaSubtext}</p>
        <a href="#contact" class="${ctaClass}">${ctaButtonText}</a>
      </div>
    </div>
  </div>
</section><!-- /CC:cta-banner -->`;

  // ── FULL HOME PAGE ──
  const homeContent = `Generate the home page section based on the core templates below.

⚠️ SECTION MARKERS — REQUIRED: keep all <!-- CC:xyz --> and <!-- /CC:xyz --> comments exactly as provided in the core sections. Do NOT remove or modify them.

Your job is to assemble these core sections faithfully. HOWEVER, if the BUSINESS prompt specifically requests custom sections (like a masonry grid, pricing table, FAQ, or any other unique layout) that are not covered by these core templates, you MUST write them and insert them in the appropriate order based on the prompt. For any custom section you write, wrap it with a contextual marker (e.g., <!-- CC:custom-masonry --> ... <!-- /CC:custom-masonry -->) and ensure it perfectly matches the DESIGN SYSTEM classes and tokens.

Core section order:
1. HERO (variant: ${heroVariant})
2. SOCIAL PROOF STRIP
3. STATS ROW
4. FEATURES (variant: ${featuresVariant})
5. TESTIMONIALS
6. CTA BANNER

══ HERO ══
${heroTemplates[heroVariant] ?? heroTemplates["split-image-right"]}

══ SOCIAL PROOF STRIP ══
${socialProofStrip}

══ STATS ROW ══
${statsRow}

══ FEATURES ══
${featuresTemplates[featuresVariant] ?? featuresTemplates["editorial-strips"]}

══ TESTIMONIALS ══
${testimonialsSection}

══ CTA BANNER ══
${ctaBanner}

IMPORTANT: Replace ALL placeholder Unsplash photo IDs with relevant real Unsplash photo IDs appropriate for this business type. Use URL format: https://images.unsplash.com/photo-XXXXXXXXXXXXXXXXXXXXXXXXXX?w=900&q=80
Keep all class names exactly as specified. Use the design tokens from the shell.`;

  const contactContent = `Generate a complete contact page with:
⚠️ SECTION MARKERS — REQUIRED: wrap each section:
<!-- CC:contact-hero --><div>...</div><!-- /CC:contact-hero -->
Marker names: contact-hero, contact-form, contact-cta

1. HERO — pt-40, font-display h1 ${h1Size}, primary accent span, subtext
2. TWO-COLUMN LAYOUT — grid lg:grid-cols-2 gap-16:
   LEFT: h2, para, 3 contact rows (icons + label + value). Use email, phone, location.
   RIGHT: ${cardCss} p-10 rounded-3xl contact form — name+email grid-cols-2, message textarea rows-5, btn-primary w-full submit button. Real form action removed — use #.
3. CTA BAND — wrap in <!-- CC:contact-cta -->...<!-- /CC:contact-cta -->. Gradient rounded-3xl, headline, subtext, button.`;

  const genericContent = `Generate a complete, genuinely rich ${pageLabel} page for this specific business.

⚠️ SECTION MARKERS REQUIRED:
<!-- CC:page-hero --><div>...</div><!-- /CC:page-hero -->
<!-- CC:main-content-1 --><div>...</div><!-- /CC:main-content-1 -->
<!-- CC:main-content-2 --><div>...</div><!-- /CC:main-content-2 -->
<!-- CC:page-cta --><div>...</div><!-- /CC:page-cta -->

1. HERO BAND — pt-40 pb-16, font-display h1 with primary accent span, subtext
2. MAIN CONTENT — 2-3 rich, real sections for "${pageLabel}":
   - Use ${cardCss} for cards
   - Image style: ${imageStyle} (apply accordingly)
   - For "services": icon cards + process steps
   - For "projects": stats band + image grid with overlay (group-hover to color)
   - For "menu": categories with dish cards, descriptions, realistic prices
   - For "classes": class schedule cards, instructor profiles
   - For "pricing": 3 tiers, Starter/Pro/Enterprise pattern
   - For "team": cards with avatar circles (initials), role, bio
   - For "rooms": room type cards, amenities, gallery style
3. PAGE CTA — gradient rounded-3xl, headline relevant to ${pageLabel}, button`;

  const pageContent = isHome
    ? homeContent
    : isContact
      ? contactContent
      : genericContent;

  return `You are generating ONE page section for a multi-page website.

BUSINESS: ${businessPrompt}${heroNote}

PAGE YOU ARE BUILDING: ${pageLabel} (id: ${pageId})

DESIGN SYSTEM — already in the HTML shell, use these classes and colors exactly:
${designTokens}

⚠️ OUTPUT RULES — NON-NEGOTIABLE:
- Your output MUST start with EXACTLY: <section id="page-${pageId}" class="page">
- Your output MUST end with EXACTLY: </section><!-- end page-${pageId} -->
- No markdown, no code fences, no explanation anywhere

STYLE RULES:
- Use .glass for panels (or ${cardCss} for feature cards)
- Use .fade-in on sections and cards
- font-display class for all headings, ${headingWeight} for all headings
- Heading size scale — follow exactly:
  * Section h2: ${h2Size} leading-[1.1] — NEVER bigger than this
  * Card/item h3: text-lg md:text-xl font-display — NOT text-3xl or text-4xl
  * Overline (above h2): text-xs font-mono-ui tracking-[0.2em] uppercase text-primary
  * Body copy: text-base leading-relaxed text-white/60 max-w-prose
  * Mobile: always start from text-2xl minimum for h2, text-base for body
- ${bodyFontWeight} for body text and captions
- Section padding: py-28 minimum. ${isLuxury ? "py-32 for key sections" : ""}
- Containers: ${sectionContainer} — always use this exact string, never just px-6 alone
- ALL CTA buttons must use href="#contact" — NEVER href="#apply", href="#fund", href="#signup" or any other hash. The contact page is the only valid destination for CTAs. This is non-negotiable.
- Cubic-bezier transitions: 0.75s cubic-bezier(0.25,0.46,0.45,0.94) — NEVER linear
- Image overlay: always use a cinematic gradient overlay on feature images for depth
- ICONS: Use Lucide icons — <i data-lucide="icon-name" class="w-6 h-6"></i>. NEVER use emoji for UI elements. Use contextual icons: shield-check, target, flame, gem, rocket, settings, mail, phone, map-pin, star, users, trending-up, zap, award, clock, check-circle, arrow-right, building, heart, globe, layers, code, palette, truck, utensils, dumbbell, briefcase, stethoscope, home, key. ⚠️ CRITICAL: Lucide REMOVED all brand icons! NEVER use facebook, twitter, instagram, linkedin, youtube, or tiktok. Use raw SVGs instead for these.

ACCENT COLOR RULES — THE ONE-RULE SYSTEM:
ACCENT COLOR BUDGET — treat text-primary like a limited resource:
- You get a MAXIMUM of 6 uses of text-primary OR bg-primary per page. Count them.
- ALLOWED: (1) CTA buttons, (2) active nav link, (3) overline label text, (4) stats/counter numbers, (5) one word in the hero h1 via <span>, (6) thin hr lines
- BANNED on: logo, all card titles, all h2/h3 headings, body paragraphs, footer text, nav links, borders, badges, icons

TYPOGRAPHY SYSTEM — 3 font roles, strict hierarchy:
  .font-display → section h1, h2 only. Size: ${h1Size} for h1, ${h2Size} for h2 — do not deviate. Weight: font-semibold or font-bold ONLY (no font-black on display). NOT uppercase by default — only uppercase for bold-energy/gym contexts.
  body font → all p, li, span description text. Size: text-sm to text-lg. Weight: font-normal or font-medium.
  .font-mono-ui → overline labels, metadata, step numbers, bracket UI, data labels. Size: text-xs or text-sm. Weight: font-medium. Always tracking-[0.15em] uppercase.

HEADING SIZE DISCIPLINE — follow this scale exactly:
  Hero h1: ${h1Size}, leading-[1.05], font-display ${headingWeight}
  Section h2: ${h2Size}, leading-[1.1], font-display ${headingWeight}
  Card/item h3: text-lg md:text-xl, font-display font-semibold (NOT font-bold, NOT uppercase, NOT text-3xl or bigger)
  Overline (above h2): text-xs font-mono-ui tracking-[0.2em] uppercase text-primary (NOT font-display)
  Body copy: text-base leading-relaxed text-white/60
  Captions/meta: text-xs font-mono-ui text-white/30

UPPERCASE DISCIPLINE:
  Only use uppercase for: overline labels, navbar links in bold-energy mood, gym/construction contexts.
  For VC, SaaS, luxury, law, restaurant — headings are sentence case or title case. NEVER ALL-CAPS on h2/h3.

${isLuxury ? `LUXURY DESIGN RULES:
- Add image offset frame to hero/about images: absolute border border-primary/15 translate-x-3 translate-y-3
- Use grayscale-[20%] group-hover:grayscale-0 on all section images
- No orb blobs, no gradient backgrounds on CTA sections
- Overlines: w-8 h-[1px] bg-primary inline-block mr-3 (horizontal rule before text)
- Image captions: absolute corner element with brand initials, rotated 3-6deg
- Prefer borderless dividers (w-full h-[1px] bg-white/10) over card boxes for lists` : `
BOLD DESIGN RULES:
- Orb blobs are allowed for tech/SaaS/gym contexts only
- CTA sections: use gradient from primary to secondary`}

⚠️ BANNED EVERYWHERE: noise textures, grain overlays, external CSS url() patterns

${pageLabel.toUpperCase()} PAGE CONTENT:
${pageContent}`;
}

export function getFooterPrompt(
  businessPrompt: string,
  designTokens: string,
  isSinglePage = false,
  architect?: ArchitectOutput,
): string {
  const bgColor = architect?.colors.background ?? "#0a0a0a";
  const bgOpaque = bgColor;

  return `You are generating the footer and all JavaScript for a multi-page website.

BUSINESS: ${businessPrompt}

DESIGN SYSTEM:
${designTokens}

⚠️ OUTPUT RULES — NON-NEGOTIABLE:
- Your output MUST start with <footer (nothing before it)
- Your output MUST end with </html> (nothing after it)
- No prose, no markdown, no code fences

GENERATE IN ORDER:

1. Wrap the entire footer in exact comments: <!-- CC:footer --> and <!-- /CC:footer -->
   <footer class="bg-black/40 border-t border-white/5 py-20 px-6">
   Inside: max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-20
   Col 1 (span 2 on mobile): Logo font-display font-black text-primary + brand tagline + 3 social buttons circular glass w-10 h-10 (⚠️ Lucide removed brand icons. Use these exact SVGs inside the buttons: Instagram: '${SOCIAL_SVGS.instagram}', Facebook: '${SOCIAL_SVGS.facebook}', Twitter: '${SOCIAL_SVGS.twitter}')
   Col 2: "Quick Links" heading + 4 relevant page links for this business type
   Col 3: "Company" heading + 4 links (About, Blog, Careers, Contact)
   Col 4: "Legal" heading + 3 links (Privacy Policy, Terms of Service, Cookie Policy)
   Bottom bar: border-t border-white/5 pt-8 flex justify-between — copyright + "Built with CrawlCube" + region
   </footer>

${isSinglePage
    ? `⚠️ SINGLE PAGE MODE:
- Do NOT include showPage()
- Do NOT include hashchange/load routing listeners
- Navbar smooth scroll: document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'});}));`
    : ""}

2. <script> block in this exact order:
   a. Navbar scroll — changes background on scroll using architect's bg color:
      window.addEventListener('scroll',function(){var n=document.getElementById('navbar');if(n){var c=n.querySelector('div');if(c)c.style.background=window.scrollY>50?'${bgOpaque}F5':'${bgOpaque}DD';}});

   b. Counter animation:
      var co=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){var el=e.target,raw=el.dataset.target,t=parseFloat(raw);if(isNaN(t)){co.unobserve(el);return;}var suffix=el.dataset.suffix||'',c=0,i=t/60,tm=setInterval(function(){c+=i;if(c>=t){var display=t>=1000?Math.round(t).toLocaleString():Number.isInteger(t)?t:t;el.textContent=display+(t>=100?'+':'')+suffix;clearInterval(tm);}else{el.textContent=Math.floor(c)>=1000?Math.floor(c).toLocaleString():Math.floor(c);}},16);co.unobserve(el);}});});document.querySelectorAll('.counter').forEach(function(el){co.observe(el);});

   c. Fade-in observer (cubic-bezier ONLY):
      var fo=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.style.opacity='1';x.target.style.transform='translateY(0)';}});},{threshold:0.1});document.querySelectorAll('.fade-in').forEach(function(el){el.style.opacity='0';el.style.transform='translateY(24px)';el.style.transition='opacity 0.75s cubic-bezier(0.25,0.46,0.45,0.94),transform 0.75s cubic-bezier(0.25,0.46,0.45,0.94)';fo.observe(el);});

   d. Mobile menu background safety fix:
      document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){var menu=document.querySelector('[x-show="open"].fixed.right-0');if(!menu)return;var bg=window.getComputedStyle(menu).backgroundColor;var isTransparent=!bg||bg==='rgba(0, 0, 0, 0)'||bg==='transparent';if(isTransparent)menu.style.background='${bgOpaque}';},500);});

   ${architect?.visualMood === "bold-energy" || architect?.visualMood === "editorial-clean"
     ? `e. Mouse parallax for .orb elements:\\n      document.addEventListener('mousemove',function(e){document.querySelectorAll('.orb').forEach(function(orb,i){var speed=(i+1)*0.02;orb.style.transform='translate('+(e.clientX*speed)+'px,'+(e.clientY*speed)+'px)';});});`
     : "// no orb parallax for this visual mood"}

   f. Lucide icon initialization — REQUIRED, must be LAST in the script block:
      lucide.createIcons();

3. </body></html>`;
}

export function getSinglePageTopPrompt(
  businessPrompt: string,
  designTokens: string,
  heroImageUrl?: string,
): string {
  const heroNote = heroImageUrl
    ? `\nHERO IMAGE URL (use exactly as src): ${heroImageUrl}`
    : "";

  return `You are generating the TOP HALF of a single-page website.

BUSINESS: ${businessPrompt}${heroNote}

DESIGN SYSTEM — use these classes and colors exactly:
${designTokens}

⚠️ OUTPUT RULES:
- Output raw HTML only — no markdown, no fences, no explanation
- Start with: <section id="hero" class="hero-section">
- End after the Features section — stop there
- No closing </body> or </html> tags

GENERATE IN ORDER:
1. HERO — id="hero", pt-32 min. Split layout: image right, text left for physical businesses. Centered for SaaS/tech. Include: badge pill, h1 (text-4xl sm:text-5xl lg:text-6xl font-display) with primary accent span, subtext max-w-prose, 2 CTAs. Use hero image URL. Container: max-w-6xl mx-auto px-8 sm:px-12 lg:px-20.
2. SOCIAL PROOF STRIP — py-8 border-y border-white/5, marquee animation, 8 industry names, text-white/20.
3. STATS ROW — id="stats", grid 4-col desktop, max-w-6xl mx-auto. Each: counter div data-target="NUMBER" class="counter font-display font-bold text-4xl md:text-5xl text-primary", label below in text-xs tracking-[0.3em] uppercase text-white/40.
4. FEATURES — id="features", py-28. 6 feature cards grid-cols-3, each .glass, Lucide icon (<i data-lucide="icon-name" class="w-7 h-7 text-primary mb-4"></i>), h3 (text-lg font-display), description. hover:-translate-y-2. Container: max-w-6xl mx-auto px-8 sm:px-12 lg:px-20.

⚠️ NO noise overlays. NO emoji — use Lucide icons only. Cinematic gradient on hero image. Grayscale only for corporate/construction businesses.`;
}

export function getSinglePageBottomPrompt(
  businessPrompt: string,
  designTokens: string,
): string {
  return `You are generating the BOTTOM HALF of a single-page website.

BUSINESS: ${businessPrompt}

DESIGN SYSTEM:
${designTokens}

⚠️ OUTPUT RULES:
- Output raw HTML only
- Start with: <section id="pricing" class="pricing-section">
- End after Contact section
- Do NOT write <footer>, </body> or </html>

GENERATE IN ORDER:
1. PRICING — 3 cards: Starter (outline), Pro (scale-105, gradient, Most Popular badge), Enterprise. Container: max-w-6xl mx-auto px-8 sm:px-12 lg:px-20. py-28.
2. TESTIMONIALS — 3 cards grid-cols-3, large ❝ quote mark, testimonial, avatar initials, name+role. py-28.
3. CTA BANNER — rounded-3xl gradient primary→secondary, dot grid overlay, centered headline+button. max-w-6xl mx-auto.
4. CONTACT — id="contact", grid lg:grid-cols-2. LEFT: contact details with Lucide icons (<i data-lucide="mail" class="w-5 h-5"></i>, <i data-lucide="phone">, <i data-lucide="map-pin">). RIGHT: .glass form card. Container: max-w-6xl mx-auto px-8 sm:px-12 lg:px-20. py-28.

⚠️ NO noise overlays. NO emoji — use Lucide icons only.`;
}
