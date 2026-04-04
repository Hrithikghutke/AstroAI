// ══════════════════════════════════════════════════
// PARALLEL GENERATION PROMPTS (used by Deep Dive v2)
// ══════════════════════════════════════════════════

export function getShellPrompt(
  isSinglePage = false,
  architect?: import("./architect").ArchitectOutput,
): string {
  const navLinkDetails = architect
    ? architect.pages
        .map((id, i) => `href="#${id}" label="${architect.pageLabels[i]}"`)
        .join(", ")
    : `href="#home" label="Home", href="#features" label="Features", href="#pricing" label="Pricing", href="#contact" label="Contact"`;

  return `You are a world-class frontend developer building a stunning website shell.

OUTPUT RULES — CRITICAL:
- Start with <!DOCTYPE html>
- End your output with <!-- PAGES_START --> on its own line, then STOP
- Do NOT write any page sections or footer content
- Raw HTML only — no markdown, no backticks, no explanation
- Very important: Do not use backdrop-blur, backdrop-filter property at all even if the user requests a glassmorphic design. Instead, use a solid background with opacity (e.g. bg-black/40) for all elements that would traditionally use backdrop-blur. This ensures readability and usability across all browsers and devices, especially for critical elements like the mobile menu.
STACK (exact CDN links, in this order):
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css" rel="stylesheet">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>

GENERATE IN THIS EXACT ORDER:

1. <!DOCTYPE html><html lang="en" data-theme="dark" class="scroll-smooth">

2. <head> containing:
   - meta charset + viewport + descriptive <title>
   - CDN links above (in order)
   - Google Fonts link: USE EXACTLY THIS URL: ${architect?.fonts.url ?? "pick 2 fonts appropriate for the business type"}
   - tailwind.config script with THESE EXACT color and font values (do not substitute or change them):
     primary: '${architect?.colors.primary ?? "choose vivid brand color"}',
     secondary: '${architect?.colors.secondary ?? "choose complement color"}',
     surface: '${architect?.colors.surface ?? "choose card background color"}',
     display font: '${architect?.fonts.display ?? "choose heading font"}',
     body font: '${architect?.fonts.body ?? "choose body font"}',
     Plus any custom keyframes/animations needed for the design (e.g. marquee, gradient animation, fade-in,hover-glow effect etc). Remember: zero custom CSS outside of keyframes — use Tailwind classes for everything else.
   - <style> block with ALL shared CSS classes the pages will need:
     * body { font-family, background-color }
     * .font-display { font-family }
     * .glass { background: rgba(...); backdrop-filter: blur(...); border: 1px solid rgba(255,255,255,0.08); }
     * .page { display: none; }
     * .fade-in class (opacity, transform — JS will animate these)
     * .counter class
     * Any gradient helpers, glow effects, marquee/ticker animation, noise overlay, orb classes
     * ⚠️ NEVER use external URLs in CSS (no url("https://...") for textures/patterns)
     *    All textures MUST be CSS-only: use repeating-linear-gradient, SVG data URIs, or
     *    radial-gradient patterns. External texture URLs block rendering when they fail to load.
     * pricing-card-pro gradient border if needed
     * Everything the 4 page sections will reference by class name
   </head>

3. <body x-data="{ open: false }">

4. ROUTING SCRIPT — IMMEDIATELY after <body>, before navbar — no exceptions:
<script>
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.style.display='none');var el=document.getElementById('page-'+id);if(el){el.style.display='block';window.scrollTo(0,0);}document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('text-primary'));var al=document.querySelector('.nav-link[href="#'+id+'"]');if(al)al.classList.add('text-primary');}
window.addEventListener('hashchange',function(){showPage(window.location.hash.slice(1)||'home');});
window.addEventListener('load',function(){showPage(window.location.hash.slice(1)||'home');});
</script>

GLOBAL DESIGN PHILOSOPHY — apply to all elements:
- Less is more: prefer whitespace over density. Section padding py-24 minimum.
- Typography is the design: rely on huge font sizes (text-8xl, text-9xl) and weight contrast over decorative elements
- Accent color (text-primary) used SPARINGLY — stats numbers, quote marks, overline labels, active nav, CTA buttons ONLY
- Images: always use object-cover with grayscale(100%) filter for physical/corporate businesses. Hover to color transition adds interactivity.
- Borders over backgrounds: prefer border border-white/10 over glass cards for a more premium minimal look
- Letter spacing: uppercase labels always tracking-[0.25em] or wider

5. Complete <nav id="navbar"> — pick style by business type:
   - SaaS/tech/startup → pill floating: fixed top-4, max-w-5xl mx-auto, rounded-full, backdrop-blur-xl
   - Gym/restaurant/bold → fixed full-width with 2px primary border-bottom, backdrop-blur-lg
   - Corporate/elegant → fixed full-width minimal border-b border-white/5, backdrop-blur-lg
   - if not pill floating, navbar should be full-width with w-100% and either border-b or bottom-blur, never both
   Always include:
   - Logo: font-display font-black text-primary with nav-link class, href="#home"
   - Desktop nav: hidden lg:flex centered links. ${isSinglePage ? "Single page — use anchor links: #hero, #features, #pricing, #contact (smooth scroll sections, NOT separate pages)" : `Multi-page — use EXACTLY these nav links in this exact order: ${navLinkDetails}. Each gets class="nav-link". Active page link gets text-primary.`}
   - CTA button: hidden lg:flex btn btn-primary btn-sm rounded-full
   - Always implement glow effect on CTA buttons
   - Hamburger: lg:hidden
   - Mobile slide-out menu using x-show="open":
      ⚠️ MOBILE MENU BACKGROUND RULES — both are required:
     1. ALWAYS use a solid opaque hex color: style="background:#0f172a"
        NEVER use rgba, CSS variables, or opacity below 1 — menu will appear see-through
     2. NEVER put "display: none" in the style attribute — Alpine x-show manages display
        WRONG: style="background:#0f172a; display: none;"
        RIGHT: style="background:#0f172a"
   - Backdrop overlay: x-show="open" @click="open=false" fixed inset-0 bg-black/60
   CRITICAL: never use backdrop-blur property on the mobile menu itself — it must be solid. Even if the user requests a glassmorphic design, the mobile menu MUST have a solid background for readability and usability.

6. After </nav>, write this EXACT comment on its own line and then STOP:
<!-- PAGES_START -->`;
}

export function getPagePrompt(
  pageId: string,
  pageLabel: string,
  businessPrompt: string,
  designTokens: string,
  heroImageUrl?: string,
): string {
  const heroNote = heroImageUrl
    ? `\nHERO IMAGE URL (use exactly as src): ${heroImageUrl}`
    : "";

  const isHome = pageId === "home";
  const isContact = pageId === "contact";

  const homeContent = `Generate a rich home page with ALL of these sections in order:
⚠️ SECTION MARKERS — REQUIRED: Wrap each named section in HTML comments exactly like this:
<!-- CC:hero --><section ...>...</section><!-- /CC:hero -->
Use EXACTLY these marker names for each section, no variations:
hero, social-proof, stats, features-preview, testimonials, cta-banner

1. HERO — wrap in <!-- CC:hero -->...</!-- /CC:hero -->. split layout for physical businesses (gym/restaurant/hotel/construction): image card right, bold text left. Centered for digital (SaaS/tech/software). Include: badge pill, h1 with gradient accent span, subtext, 2 CTA buttons. pt-32 minimum to clear navbar. Use hero image URL provided.
2. SOCIAL PROOF STRIP — py-12 border-y border-white/5 bg-transparent. Two rows: TOP: text-center text-xs tracking-[0.4em] uppercase text-white/30 mb-8 "COLLABORATING WITH INDUSTRY LEADERS". BOTTOM: marquee animation, company names in font-display font-bold text-xl text-white/20 tracking-wider, 8+ names with wide gap (mx-12) between each. No logos, names only — the sparseness IS the design.
3. STATS ROW — NO glass cards. Full-width border-y border-white/10 bg-transparent py-16. Grid 3-col (or 4-col if 4 stats). Each stat: centered, counter div with data-target="NUMBER" class="counter font-display font-black text-7xl md:text-8xl lg:text-9xl text-primary", suffix like + or % as a separate span, label below in text-xs tracking-[0.3em] uppercase text-white/50. NO card backgrounds — numbers must be raw, massive, and dominant. Border-r border-white/10 between columns.
4. FEATURES PREVIEW — Two sub-sections:
   A) SPLIT SECTION: min-h-[70vh] grid lg:grid-cols-2. LEFT: full-height image using <img src="https://images.unsplash.com/photo-[relevant-keyword]?w=900&q=80" class="w-full h-full object-cover" style="filter:grayscale(100%) contrast(1.1)">. RIGHT: flex items-center px-16 py-24, small overline label (text-xs tracking-[0.25em] uppercase text-primary border-b border-primary pb-2 inline-block mb-6), h2 font-display font-black text-5xl md:text-6xl leading-tight, paragraph text-white/60, outline button btn btn-outline btn-primary rounded-none mt-8.
   B) FEATURE CARDS GRID: grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10. Each card: border-r border-white/10 p-10 hover:bg-white/5 transition-colors, icon emoji text-3xl mb-6, h3 font-display font-bold text-xl mb-3, description text-white/60.
5. TESTIMONIALS — Full carousel with Alpine.js. x-data="{active:0,items:[0,1,2]}". Show 3 cards visible on desktop (translate based on active index), 1 on mobile. Each card: .glass border border-white/10 p-10 rounded-2xl, large text-6xl font-display text-primary opacity-60 quote mark "❝", italic testimonial text text-lg, bottom section: avatar circle (initials, bg-primary/20 text-primary font-bold), name font-bold, role text-xs tracking-widest uppercase text-white/50. LEFT arrow button absolute left-0: @click="active=Math.max(0,active-1)" class="glass w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary/20". RIGHT arrow: @click="active=Math.min(2,active+1)". Dot indicators below: 3 dots, active dot bg-primary w-8, inactive bg-white/20 w-2, all h-2 rounded-full transition-all.
  -Carousel transition: use CSS transform, NOT Alpine x-show/x-if. The track div holds all cards in a flex row. Active index shifts the track: :style="'transform: translateX(-'+active*33.333+'%); transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)'". Cards never disappear — the whole row slides. This gives butter-smooth sliding instead of snap-show.
  -For ALL .fade-in elements: transition: opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94) — NOT linear, NOT ease. Cubic-bezier is mandatory.
6. CTA BANNER — wrap in <!-- CC:cta-banner -->...</!-- /CC:cta-banner -->. rounded-3xl gradient primary→secondary, dot grid overlay, centered headline + subtext + white button

REMINDER: Every section MUST have its <!-- CC:name --> opening and <!-- /CC:name --> closing comment. This is non-negotiable.`;

  const contactContent = `Generate a complete contact page with:
⚠️ SECTION MARKERS — REQUIRED: Wrap each section exactly like:
<!-- CC:contact-hero --><div>...</div><!-- /CC:contact-hero -->
Use EXACTLY these marker names: contact-hero, contact-form, contact-cta

1. HERO — wrap in <!-- CC:contact-hero -->...</!-- /CC:contact-hero -->. pt-40, h1 with primary accent span, subtext paragraph
2. TWO-COLUMN LAYOUT — grid lg:grid-cols-2 gap-16:
   LEFT: h2, subtext, then 3 contact detail rows. Each: icon in colored rounded-2xl bg, label small uppercase, value font-bold. Use: email, phone, location icons.
   RIGHT: .glass card p-10 rounded-3xl with contact form — name + email (grid-cols-2), message textarea, submit button btn-primary w-full. form action="https://formspree.io/f/YOUR_FORM_ID" method="POST"
3. CTA BAND — wrap in <!-- CC:contact-cta -->...</!-- /CC:contact-cta -->. py-20 gradient rounded-3xl, closing message relevant to business`;

  const genericContent = `Generate a complete, rich ${pageLabel} page tailored specifically to this business.
Think carefully: what would a visitor to the "${pageLabel}" page of THIS specific business expect and need?

⚠️ SECTION MARKERS — REQUIRED: Wrap each section exactly like:
<!-- CC:page-hero --><div>...</div><!-- /CC:page-hero -->
Use EXACTLY these marker names in order: page-hero, main-content-1, main-content-2, page-cta
Design sections that are genuinely relevant to "${pageLabel}" for this type of business — NOT generic placeholders.

REQUIRED structure (adapt content to suit "${pageLabel}"):
1. HERO BAND — pt-40 pb-16, gradient or dark bg, centered h1 (primary accent span on key word), compelling subtext
2. MAIN CONTENT — 2 to 3 rich sections relevant to "${pageLabel}":
   - Use real placeholder content specific to this business type (invent realistic details)
   - .glass cards in grids with hover:-translate-y-2 where appropriate
   - At least one section with a strong visual element (image card, icon grid, or data display)
   - For a "services" page: service cards with icons, process steps, or methodology
   - For a "projects" page: 
     * Hero: minimal pt-40 pb-8, left-aligned h1 font-display font-black text-6xl md:text-8xl, subtext text-white/50 max-w-2xl
     * Stats band: border-y border-white/10 py-12 grid grid-cols-3, each: huge counter text-7xl font-black text-primary font-display, label text-xs tracking-[0.3em] uppercase text-white/40
     * Image Grid: grid grid-cols-1 md:grid-cols-3 gap-1 (1px gap). Each cell: relative overflow-hidden aspect-[4/3] group. <img> with grayscale(100%) filter, group-hover:grayscale(0) transition-all duration-700. Overlay: absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-all. Bottom text: absolute bottom-0 p-6, project name font-bold, category text-xs text-primary uppercase tracking-widest.
   - For a "menu" page: menu categories, featured dishes, pricing
   - For a "classes" page: class schedule cards, instructor profiles, class types
   - For a "pricing" page: 3 pricing tiers with features list, FAQ accordion
   - For a "work" page: case study cards, client logos, results metrics
   - For a "team" or "our-team" page: team member cards with photos (placeholder), role, bio
   - For a "rooms" page: room type cards with amenities, gallery style layout
   - For any other page: use your best judgment for what makes sense
3. CTA BAND — wrap in <!-- CC:page-cta -->...</!-- /CC:page-cta -->. py-20 gradient rounded-3xl, headline and button relevant to ${pageLabel}`;

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
- Your output MUST start with EXACTLY this tag (nothing before it, no preamble):
  <section id="page-${pageId}" class="page">
- Your output MUST end with EXACTLY this (nothing after it):
  </section><!-- end page-${pageId} -->
- No markdown, no code fences, no explanation, no extra text outside the section tags

STYLE RULES:
- Use .glass for all cards and panels
- Use .fade-in on cards and section content
- Use font-display class for all headings (h1, h2, h3)
- Use text-primary for accent colors and highlights
- All sections: py-20 or py-24 spacing
- All containers: max-w-7xl mx-auto px-6
- Typography: h1 text-4xl sm:text-5xl md:text-6xl lg:text-8xl, h2 text-3xl md:text-5xl
- Buttons: <a> tags for navigation (not <button>), rounded-full

${pageLabel.toUpperCase()} PAGE CONTENT:
${pageContent}`;
}

export function getFooterPrompt(
  businessPrompt: string,
  designTokens: string,
  isSinglePage = false,
): string {
  return `You are generating the footer and all JavaScript for a multi-page website.

BUSINESS: ${businessPrompt}

DESIGN SYSTEM:
${designTokens}

⚠️ OUTPUT RULES — NON-NEGOTIABLE:
- Your output MUST start with <footer (nothing before it)
- Your output MUST end with </html> (nothing after it)
- No prose, no markdown, no code fences

GENERATE IN ORDER:

1. <footer> — Use .glass or bg-black/40 border-t border-white/5 py-20 px-6
   Inside: max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-20
   Col 1 (span 2 on mobile): Logo (font-display font-black text-primary) + brand tagline + 3 social icon buttons (circular .glass w-10 h-10)
   Col 2: Heading + 4 relevant page links appropriate for this specific business (e.g. for a restaurant: Menu, Reservations, Gallery, Events — for SaaS: Features, Pricing, Docs, Changelog) 
   Col 3: "Company" heading + 4 links (About, Blog, Careers, Contact)   
   Col 4: "Legal" heading + 3 links (Privacy Policy, Terms of Service, Cookie Policy)
   Bottom bar: border-t border-white/5 pt-8 flex justify-between — copyright text + "Status: Healthy 🟢" + region
   </footer>

${
  isSinglePage
    ? `
⚠️ SINGLE PAGE MODE — JavaScript rules:
- Do NOT include showPage() function
- Do NOT include hashchange or load event listeners for routing  
- Navbar links use smooth scroll: document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'}); }));
- Replace navbar scroll shrink with active section highlighting using IntersectionObserver
`
    : ""
}   

2. <script> block with ALL of these in order:
   a. Navbar scroll shrink:
      window.addEventListener('scroll',function(){var n=document.getElementById('navbar');if(n){var c=n.querySelector('div');c.style.background=window.scrollY>50?'rgba(15,23,42,0.98)':'rgba(15,23,42,0.85)';}});
   
   b. Counter animation:
      var co=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){var el=e.target,raw=el.dataset.target,t=parseFloat(raw);if(isNaN(t)){co.unobserve(el);return;}var suffix=el.dataset.suffix||'',c=0,i=t/60,tm=setInterval(function(){c+=i;if(c>=t){var display=t>=1000?Math.round(t).toLocaleString():Number.isInteger(t)?t:t;el.textContent=display+(t>=100?'+':'')+suffix;clearInterval(tm);}else{el.textContent=Math.floor(c)>=1000?Math.floor(c).toLocaleString():Math.floor(c);}},16);co.unobserve(el);}});});document.querySelectorAll('.counter').forEach(function(el){co.observe(el);});
   
   c. Fade-in observer:
      var fo=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.style.opacity='1';x.target.style.transform='translateY(0)';}});},{threshold:0.1});document.querySelectorAll('.fade-in').forEach(function(el){el.style.opacity='0';el.style.transform='translateY(24px)';el.style.transition='opacity 0.75s cubic-bezier(0.25,0.46,0.45,0.94),transform 0.75s cubic-bezier(0.25,0.46,0.45,0.94)';fo.observe(el);});
   
   d. Mobile menu background fix (in case of transparent bg):
      document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){var menu=document.querySelector('[x-show="open"].fixed.right-0');if(!menu)return;var bg=window.getComputedStyle(menu).backgroundColor;var isTransparent=!bg||bg==='rgba(0, 0, 0, 0)'||bg==='transparent';if(isTransparent){var cfg=window.tailwind?.config?.theme?.extend?.colors?.primary||'#1e293b';var r=parseInt(cfg.slice(1,3),16),g=parseInt(cfg.slice(3,5),16),b=parseInt(cfg.slice(5,7),16);var dark='rgb('+Math.max(0,Math.round(r*0.3))+','+Math.max(0,Math.round(g*0.3))+','+Math.max(0,Math.round(b*0.3))+')';menu.style.background=dark;}},500);});
   
   e. Mouse parallax for .orb elements (if used in home page):
      document.addEventListener('mousemove',function(e){document.querySelectorAll('.orb').forEach(function(orb,i){var speed=(i+1)*0.02;orb.style.transform='translate('+(e.clientX*speed)+'px,'+(e.clientY*speed)+'px)';});});

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
- End after the Features section — stop there, do NOT write pricing or contact
- No closing </body> or </html> tags — another call handles that

GENERATE IN ORDER:
1. HERO SECTION — id="hero", pt-32 min. Split layout for physical business (image card right, bold text left). Centered for digital/SaaS. Include: badge pill, h1 with primary accent span, subtext, 2 CTA buttons. Use hero image URL provided.

2. SOCIAL PROOF STRIP — py-8 border-y bg-white/5, marquee animation, "Trusted by" + 5 industry names, opacity-50.

3. STATS ROW — id="stats", grid 2-col mobile 4-col desktop. Each stat: .glass card, counter div with data-target (numbers only, no symbols), label below.

4. FEATURES SECTION — id="features", py-24. 6 feature cards in grid-cols-3, each .glass card with icon (emoji or SVG), h3 title, description. Add hover:-translate-y-2.

STYLE RULES:
- Use .glass for all cards
- Use .fade-in on section content  
- Use font-display for all headings
- Use text-primary for accents
- All containers: max-w-7xl mx-auto px-6`;
}

export function getSinglePageBottomPrompt(
  businessPrompt: string,
  designTokens: string,
): string {
  return `You are generating the BOTTOM HALF of a single-page website.

BUSINESS: ${businessPrompt}

DESIGN SYSTEM — use these classes and colors exactly:
${designTokens}

⚠️ OUTPUT RULES:
- Output raw HTML only — no markdown, no fences, no explanation
- Start directly with: <section id="pricing" class="pricing-section">
- End after the Contact section closing tag
- Do NOT write <footer>, </body> or </html> — another call handles that

GENERATE IN ORDER:
1. PRICING SECTION — id="pricing", py-24. 3 cards: Starter (outline), Pro (scale-105, gradient, "Most Popular" badge), Enterprise (outline). Each: plan name, price, 4 feature bullets, CTA button.

2. TESTIMONIALS SECTION — id="testimonials", py-24. 3 cards grid-cols-3, large " quote mark, testimonial text, avatar circle initials, name + role.

3. CTA BANNER — rounded-3xl mx-4 md:mx-8, gradient primary→secondary, dot overlay, centered headline + subtext + white button.

4. CONTACT SECTION — id="contact", py-24. Two columns: LEFT: contact details (email, phone, location) each with icon in colored rounded-2xl. RIGHT: .glass card with contact form (name, email, message textarea, submit button).

STYLE RULES:
- Use .glass for all cards
- Use .fade-in on section content
- Use font-display for all headings
- Use text-primary for accents
- All containers: max-w-7xl mx-auto px-6`;
}
