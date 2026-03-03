import { Layout } from "@/types/layout";

export function generateHtml(layout: Layout): string {
  const isDark = layout.theme === "dark";
  const primary = layout.branding?.primaryColor ?? "#6366f1";
  const bg = isDark ? "#0a0a0a" : "#ffffff";
  const text = isDark ? "#ffffff" : "#0a0a0a";
  const subtextColor = isDark ? "#a3a3a3" : "#525252";
  const cardBg = isDark ? "#111111" : "#f9f9f9";
  const borderColor = isDark ? "#2a2a2a" : "#e5e7eb";
  const navBg = isDark ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.98)";
  const altBg = isDark ? "#0f0f0f" : "#f9fafb";
  const inputBg = isDark ? "#0a0a0a" : "#f9fafb";

  const sections = layout.sections ?? [];
  const heroSection = sections.find((s) => s.type === "hero") as any;
  const featuresSection = sections.find((s) => s.type === "features") as any;
  const pricingSection = sections.find((s) => s.type === "pricing") as any;
  const testimonialsSection = sections.find(
    (s) => s.type === "testimonials",
  ) as any;
  const contactSection = sections.find((s) => s.type === "contact") as any;
  const statsSection = sections.find((s) => s.type === "stats") as any;
  const ctaBannerSection = sections.find((s) => s.type === "cta_banner") as any;

  const resizeSvg = (svg: string, size: number) =>
    svg
      .replace(/width="48"/, `width="${size}"`)
      .replace(/height="48"/, `height="${size}"`);

  const logoHtml = (size: number) =>
    layout.branding?.logo
      ? `<span style="display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${resizeSvg(layout.branding.logo, size)}</span>`
      : `<span style="width:${Math.round(size * 0.6)}px;height:${Math.round(size * 0.6)}px;border-radius:50%;background:${primary};display:inline-block;flex-shrink:0;"></span>`;

  // Parses <accent>text</accent> → styled span in brand color
  const parseAccent = (text: string) =>
    text.replace(
      /<accent>(.*?)<\/accent>/g,
      `<span style="color:${primary}">$1</span>`,
    );
  const heroVariant = heroSection?.variant ?? "centered";
  const featuresVariant = featuresSection?.variant ?? "grid";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${layout.branding?.logoText ?? "Website"}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background:${bg}; color:${text}; font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; overflow-x:hidden; }

    /* Utilities */
    .container { width:100%; max-width:1100px; margin:0 auto; padding:0 16px; }
    .section-badge { display:inline-flex; align-items:center; gap:8px; font-size:11px; font-weight:600; padding:4px 12px; border-radius:999px; background:${primary}22; color:${primary}; margin-bottom:16px; letter-spacing:.06em; text-transform:uppercase; width:fit-content; align-self:center; }
    .card { background:${cardBg}; border:1px solid ${borderColor}; border-radius:16px; padding:24px; }
    .primary-btn { display:inline-block; background:${primary}; color:#fff; padding:12px 28px; border-radius:50px; font-weight:700; font-size:15px; border:none; cursor:pointer; text-decoration:none; transition:opacity .2s,transform .2s,box-shadow .2s; }
    .primary-btn:hover { opacity:.88; transform:translateY(-2px); box-shadow:0 8px 28px ${primary}55; }
    h1,h2,h3,h4 { color:${text}; line-height:1.2; }
    p { color:${subtextColor}; line-height:1.7; }
    a { color:${subtextColor}; text-decoration:none; }
    a:hover { color:${text}; }

    /* ── Scroll Animations ── */
    .reveal { opacity:0; transform:translateY(32px); transition:opacity .6s ease,transform .6s ease; }
    .reveal.visible { opacity:1; transform:translateY(0); }
    .reveal-left { opacity:0; transform:translateX(-40px); transition:opacity .6s ease,transform .6s ease; }
    .reveal-left.visible { opacity:1; transform:translateX(0); }
    .reveal-right { opacity:0; transform:translateX(40px); transition:opacity .6s ease,transform .6s ease; }
    .reveal-right.visible { opacity:1; transform:translateX(0); }
    .stagger-1 { transition-delay:.1s; } .stagger-2 { transition-delay:.2s; } .stagger-3 { transition-delay:.3s; }
    .stagger-4 { transition-delay:.4s; } .stagger-5 { transition-delay:.5s; } .stagger-6 { transition-delay:.6s; }

    /* ── Navbar ── */
    .navbar { background:${navBg}; border-bottom:1px solid ${borderColor}; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; backdrop-filter:blur(16px); gap:12px; transition:padding .3s,box-shadow .3s; }
    .navbar.scrolled { padding-top:10px; padding-bottom:10px; box-shadow:0 4px 24px rgba(0,0,0,.15); }
    .navbar-logo { display:flex; align-items:center; gap:8px; font-weight:700; font-size:16px; color:${text}; flex-shrink:0; }
    .navbar-logo span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .navbar-links { display:none; gap:24px; font-size:14px; font-weight:500; opacity:.75; }
    .navbar-links a { color:${text}; }
    .navbar-links a:hover { opacity:1; }
    .navbar-cta { background:${primary}; color:#fff; padding:7px 14px; border-radius:8px; font-size:13px; font-weight:600; text-decoration:none; white-space:nowrap; flex-shrink:0; transition:opacity .2s; }
    .navbar-phone { display:none; align-items:center; gap:6px; font-size:13px; font-weight:500; color:${text}; text-decoration:none; opacity:.7; white-space:nowrap; }
    .navbar-phone:hover { opacity:1; color:${text}; }
    .navbar-cta:hover { opacity:.88; color:#fff; }

    /* ── Hero ── */
    .hero { min-height:auto; position:relative; overflow:hidden; }
    .hero-centered { min-height:85vh; }
    .hero-centered { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:80px 16px 60px; }
    .hero-overlay { position:absolute; inset:0; pointer-events:none; }
    .hero-content { position:relative; z-index:1; max-width:800px; margin:0 auto; }
    .hero-content h1 { font-size:clamp(28px,7vw,72px); font-weight:800; line-height:1.1; margin-bottom:20px; }
    .hero-content p { font-size:clamp(15px,2.5vw,18px); max-width:560px; margin:0 auto 32px; }
    /* Split hero */
    .hero-split { display:grid; grid-template-columns:1fr; align-items:center; padding:60px 16px; position:relative; background-size:cover; background-position:center; }
.hero-split.has-image::before { content:''; position:absolute; inset:0; background:linear-gradient(to bottom,rgba(0,0,0,0.5),rgba(0,0,0,0.75)); z-index:0; }
.hero-split .text-side { display:flex; flex-direction:column; gap:20px; align-items:center; text-align:center; position:relative; z-index:1; }
.hero-split h1 { font-size:clamp(28px,5vw,60px); font-weight:800; margin:0; color:${text}; }
.hero-split.has-image h1 { color:#ffffff; }
.hero-split.has-image p { color:rgba(255,255,255,0.85); }
.hero-split.has-image .section-badge { background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.2); }
.hero-split p { margin:0; color:${subtextColor}; font-size:clamp(15px,2vw,18px); max-width:480px; }
.hero-visual { display:none; }
    .hero-visual-inner { width:100%; aspect-ratio:4/3; border-radius:20px; overflow:hidden; position:relative; box-shadow:0 40px 80px ${primary}33; }
    .hero-visual-inner img { width:100%; height:100%; object-fit:cover; }
    .hero-orb { width:100%; aspect-ratio:1; max-width:360px; position:relative; }
    .orb-glow { position:absolute; inset:0; border-radius:999px; opacity:.15; background:radial-gradient(circle,${primary},transparent 70%); }
    .orb-ring { position:absolute; inset:24px; border-radius:999px; border:2px solid ${primary}55; }
    .orb-center { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
    .orb-logo { width:80px; height:80px; border-radius:20px; background:${primary}22; border:1px solid ${primary}44; display:flex; align-items:center; justify-content:center; }
    /* Minimal hero */
    .hero-minimal { padding:80px 16px 60px; }
    .hero-minimal h1 { font-size:clamp(36px,8vw,96px); font-weight:800; line-height:1; letter-spacing:-.03em; margin:16px 0 28px; color:${text}; }
    .hero-minimal p { font-size:clamp(16px,2vw,20px); max-width:520px; color:${subtextColor}; line-height:1.7; margin-bottom:32px; }
    .hero-minimal-cta { display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
    .hero-tagline { font-size:13px; opacity:.4; color:${text}; }
    .hero-accent-line { position:absolute; bottom:0; left:0; right:0; height:1px; background:linear-gradient(to right,transparent,${primary}44,transparent); }

    /* ── Features: Grid ── */
    .features { padding:64px 16px; background:${altBg}; }
    .section-header { text-align:center; margin-bottom:48px; }
    .section-header h2 { font-size:clamp(22px,4vw,44px); font-weight:700; }
    .features-grid { display:grid; grid-template-columns:1fr; gap:16px; }
    .feature-card { background:${cardBg}; border:1px solid ${borderColor}; border-radius:16px; padding:24px; transition:transform .2s,box-shadow .2s; }
    .feature-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px ${primary}22; }
    .feature-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:16px; background:${primary}18; }
    .feature-card h3 { font-size:15px; font-weight:700; margin-bottom:8px; color:${text}; }
    .feature-card p { font-size:14px; color:${subtextColor}; }
    .feature-accent { height:3px; width:0; border-radius:999px; background:${primary}; margin-top:16px; transition:width .3s ease; }
    .feature-card:hover .feature-accent { width:48px; }

    /* ── Features: Alternating ── */
    .features-alt { padding:64px 16px; background:${altBg}; }
    .alt-row { display:grid; grid-template-columns:1fr; gap:32px; align-items:center; margin-bottom:56px; }
    .alt-row:last-child { margin-bottom:0; }
    .alt-text { display:flex; flex-direction:column; gap:16px; }
    .alt-text h3 { font-size:clamp(18px,3vw,26px); font-weight:700; color:${text}; }
    .alt-text p { font-size:15px; line-height:1.7; color:${subtextColor}; }
    .alt-accent { height:3px; width:40px; border-radius:999px; background:${primary}; }
    .alt-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; background:${primary}18; }
    .alt-visual { aspect-ratio:4/3; border-radius:20px; overflow:hidden; position:relative; background:${isDark ? "#111" : "#f3f4f6"}; border:1px solid ${borderColor}; }
    .alt-visual-glow { position:absolute; inset:0; opacity:.12; }
    .alt-visual-emoji { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:64px; opacity:.25; }
    .alt-num { position:absolute; top:12px; right:12px; width:28px; height:28px; border-radius:50%; background:${primary}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; }

    /* ── Features: List ── */
    .features-list { padding:64px 16px; background:${altBg}; }
    .list-row { display:flex; align-items:flex-start; gap:20px; padding:20px 0; border-bottom:1px solid ${borderColor}; }
    .list-row:last-child { border-bottom:none; }
    .list-num-icon { display:flex; flex-direction:column; align-items:center; gap:4px; flex-shrink:0; }
    .list-num { font-size:11px; font-weight:700; opacity:.3; color:${text}; }
    .list-icon { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; background:${primary}18; }
    .list-content h3 { font-size:15px; font-weight:700; color:${text}; margin-bottom:6px; transition:color .2s; }
    .list-row:hover .list-content h3 { color:${primary}; }
    .list-content p { font-size:14px; color:${subtextColor}; }
    .list-arrow { flex-shrink:0; color:${primary}; opacity:0; transition:opacity .2s; margin-top:2px; font-size:16px; }
    .list-row:hover .list-arrow { opacity:1; }

    /* ── Pricing ── */
    .pricing { padding:64px 16px; background:${bg}; }
    .pricing-grid { display:grid; grid-template-columns:1fr; gap:16px; }
    .pricing-card { border-radius:20px; padding:28px; border:1px solid ${borderColor}; display:flex; flex-direction:column; position:relative; background:${cardBg}; transition:transform .2s; }
    .pricing-card:hover { transform:translateY(-4px); }
    .pricing-card.highlighted { background:${primary}; border-color:transparent; box-shadow:0 20px 60px ${primary}44; }
    .pricing-card h3 { font-size:20px; font-weight:700; margin-bottom:4px; }
    .pricing-price { font-size:36px; font-weight:800; margin-bottom:10px; }
    .pricing-desc { font-size:13px; opacity:.7; margin-bottom:20px; }
    .pricing-divider { height:1px; opacity:.15; margin-bottom:20px; background:currentColor; }
    .pricing-features { list-style:none; margin-bottom:24px; flex:1; }
    .pricing-features li { display:flex; align-items:flex-start; gap:10px; font-size:14px; margin-bottom:10px; }
    .check-icon { width:16px; height:16px; border-radius:50%; flex-shrink:0; margin-top:2px; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; }
    .pricing-btn { display:block; width:100%; padding:12px; border-radius:12px; font-weight:700; font-size:14px; text-align:center; border:none; cursor:pointer; text-decoration:none; transition:opacity .2s; }
    .pricing-btn:hover { opacity:.88; }
    .popular-badge { position:absolute; top:-14px; left:50%; transform:translateX(-50%); background:#fff; font-size:11px; font-weight:700; padding:5px 14px; border-radius:999px; white-space:nowrap; color:${primary}; }

    /* ── Testimonials ── */
    .testimonials { padding:64px 16px; background:${altBg}; }
    .testimonials-grid { display:grid; grid-template-columns:1fr; gap:16px; }
    .testimonial-card { background:${cardBg}; border:1px solid ${borderColor}; border-radius:16px; padding:24px; position:relative; overflow:hidden; border-left-width:4px; border-left-style:solid; }
    .testimonial-card p { font-size:14px; margin-bottom:16px; color:${subtextColor}; }
    .testimonial-author { display:flex; align-items:center; gap:12px; }
    .author-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; flex-shrink:0; }
    .author-name { font-size:14px; font-weight:700; color:${text}; }
    .author-role { font-size:12px; opacity:.5; color:${subtextColor}; }
    .quote-mark { position:absolute; top:8px; right:14px; font-size:52px; font-weight:900; opacity:.07; line-height:1; }

    /* ── Contact ── */
    .contact { padding:64px 16px; background:${bg}; }
    .contact-layout { display:grid; grid-template-columns:1fr; gap:40px; align-items:stretch; }
    .contact-details { display:flex; flex-direction:column; gap:14px; }
    .contact-subtext { font-size:15px; color:${subtextColor}; line-height:1.7; margin-bottom:8px; }
    .contact-card { background:${cardBg}; border:1px solid ${borderColor}; border-radius:14px; padding:16px; display:flex; align-items:flex-start; gap:14px; }
    .contact-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; opacity:.5; margin-bottom:4px; color:${subtextColor}; }
    .contact-value { font-size:14px; font-weight:600; color:${text}; word-break:break-word; }
    .contact-form-box { background:${cardBg}; border:1px solid ${borderColor}; border-radius:20px; padding:28px; }
    .form-group { margin-bottom:16px; }
    .form-label { display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; opacity:.5; margin-bottom:6px; color:${text}; }
    .form-input { width:100%; padding:10px 14px; border-radius:10px; font-size:14px; outline:none; font-family:inherit; border:1px solid ${borderColor}; background:${inputBg}; color:${text}; transition:border-color .2s; }
    .form-input:focus { border-color:${primary}; }
    .form-submit { width:100%; padding:12px; border-radius:12px; font-weight:700; font-size:14px; border:none; cursor:pointer; transition:opacity .2s,transform .2s; background:${primary}; color:#fff; margin-top:4px; }
    .form-submit:hover { opacity:.88; transform:translateY(-1px); }
    .form-submit:disabled { opacity:.5; cursor:not-allowed; transform:none; }
    #form-success { display:none; margin-top:16px; padding:12px 16px; border-radius:10px; background:#16a34a22; color:#4ade80; font-size:14px; text-align:center; }
    #form-error { display:none; margin-top:16px; padding:12px 16px; border-radius:10px; background:#dc262622; color:#f87171; font-size:14px; text-align:center; }


    /* ── Stats ── */
.stats { padding:40px 16px; border-top:1px solid ${borderColor}; border-bottom:1px solid ${borderColor}; background:${isDark ? "#080808" : "#fafafa"}; }
.stats-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:24px; max-width:900px; margin:0 auto; }
.stat-item { text-align:center; }
.stat-value { font-size:clamp(24px,5vw,40px); font-weight:800; color:${primary}; line-height:1; }
.stat-label { font-size:13px; color:${subtextColor}; margin-top:6px; }
.stat-line { width:32px; height:2px; border-radius:999px; background:${primary}; opacity:.4; margin:8px auto 0; }

/* ── CTA Banner ── */
.cta-banner { padding:80px 16px; position:relative; overflow:hidden; background:${isDark ? "#0a0a0a" : "#f9fafb"}; text-align:center; border-top:1px solid ${primary}22; }
.cta-banner-glow { position:absolute; inset:0; background:radial-gradient(ellipse 70% 80% at 50% 50%,${primary}15,transparent 70%); pointer-events:none; }
.cta-banner h2 { font-size:clamp(24px,5vw,52px); font-weight:800; margin-bottom:16px; }
.cta-banner p { font-size:clamp(15px,2vw,18px); max-width:560px; margin:0 auto 32px; color:${subtextColor}; }
.cta-buttons { display:flex; flex-wrap:wrap; gap:16px; justify-content:center; }
.outline-btn { display:inline-block; background:transparent; color:${primary}; padding:12px 28px; border-radius:50px; font-weight:700; font-size:15px; border:2px solid ${primary}; cursor:pointer; text-decoration:none; transition:background .2s; }
.outline-btn:hover { background:${primary}18; }

/* ── Footer ── */
    .footer { background:${isDark ? "#050505" : "#f9fafb"}; border-top:1px solid ${borderColor}; padding:48px 24px 24px; }
    .footer-grid { display:grid; grid-template-columns:1fr; gap:32px; max-width:1100px; margin:0 auto 32px; }
    .footer-col { display:flex; flex-direction:column; align-items:flex-start; gap:12px; }
    .footer-logo-row { display:flex; align-items:center; gap:10px; font-weight:700; font-size:15px; color:${text}; }
    .footer-desc { font-size:13px; color:${subtextColor}; line-height:1.6; max-width:240px; }
    .footer-socials { display:flex; gap:8px; flex-wrap:wrap; }
    .footer-social-icon { width:36px; height:36px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; border:1px solid ${borderColor}; font-size:15px; text-decoration:none; background:${isDark ? "#111" : "#f3f4f6"}; }
    .footer-col-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:${primary}; }
    .footer-col ul { list-style:none; display:flex; flex-direction:column; align-items:flex-start; gap:8px; padding:0; margin:0; }
    .footer-col ul li a { font-size:13px; color:${subtextColor}; text-decoration:none; }
    .footer-col ul li a:hover { color:${text}; }
    .footer-contact-item { display:flex; align-items:flex-start; gap:8px; font-size:13px; color:${subtextColor}; }
    .footer-contact-item a { color:${subtextColor}; text-decoration:none; }
    .footer-contact-item a:hover { color:${text}; }
    .footer-hours-row { display:flex; justify-content:space-around; gap:16px; font-size:13px; width:100%;  }
    .footer-hours-val { font-weight:600; color:${text}; }
    .footer-book-btn { display:inline-block; width:100%; text-align:center; padding:11px; border-radius:50px; background:${primary}; color:#fff; font-weight:700; font-size:13px; text-decoration:none; transition:opacity .2s; }
    .footer-book-btn:hover { opacity:.88; color:#fff; }
    .footer-bottom { border-top:1px solid ${borderColor}; padding-top:20px; display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; max-width:1100px; margin:0 auto; }
    .footer-copy { font-size:12px; color:${subtextColor}; }
    .footer-legal { display:flex; gap:16px; }
    .footer-legal a { font-size:12px; color:${subtextColor}; text-decoration:none; }
    .footer-legal a:hover { color:${text}; }

    /* ── Responsive 600px+ ── */
    @media (min-width:600px) {
      .container { padding:0 24px; }
      .navbar { padding:16px 24px; }
      .navbar-links { display:flex; }
      .features-grid { grid-template-columns:repeat(2,1fr); }
      .pricing-grid { grid-template-columns:repeat(2,1fr); }
      .hero-split { padding:60px 24px; }
      .testimonials-grid { grid-template-columns:repeat(2,1fr); }
      .contact-layout { grid-template-columns:1fr 1fr; }
      .navbar-phone { display:flex; }
      .footer-hours-row { justify-content:space-around; max-width:100%; }
      
    }
    /* ── Responsive 900px+ ── */
    @media (min-width:900px) {
      .container { padding:0 32px; }
      .navbar { padding:18px 32px; }
      .features { padding:96px 32px; }
      .features-grid { grid-template-columns:repeat(3,1fr); gap:24px; }
      .features-alt { padding:96px 32px; }
      .alt-row { grid-template-columns:1fr 1fr; gap:64px; margin-bottom:80px; }
      .alt-row.reverse .alt-text { order:2; }
      .alt-row.reverse .alt-visual { order:1; }
      .features-list { padding:96px 32px; }
      .stats-grid { grid-template-columns:repeat(4,1fr); }
      
      .hero-split { grid-template-columns:1fr 1fr; gap:64px; padding:100px 32px; min-height:85vh; background-image:none !important; }
      .hero-split::before { display:none !important; }
      .hero-split.has-image h1 { color:${text}; }
      .hero-split .text-side { align-items:flex-start; text-align:left; }
      .hero-split .text-side .section-badge { align-self:flex-start; }
      .hero-split.has-image .section-badge { background:${primary}22; color:${primary}; border:none; }
      .hero-visual { display:flex; align-items:center; justify-content:center; }
      .hero-split.has-image p { color:${subtextColor}; }
      .hero-minimal { padding:120px 32px 80px; }
      .pricing { padding:96px 32px; }
      .pricing-grid { grid-template-columns:repeat(3,1fr); gap:24px; }
      .testimonials { padding:96px 32px; }
      .testimonials-grid { grid-template-columns:repeat(3,1fr); gap:24px; }
      .contact { padding:96px 32px; }
      .footer { padding:60px 32px 28px; }
      .footer-grid { grid-template-columns:1.2fr 1fr 1fr 1fr; gap:40px; }
      .footer-bottom { flex-direction:row; justify-content:space-between; text-align:left; }
      .footer-col ul { list-style:none; display:flex; flex-direction:column; align-items:flex-start; gap:8px; }
      .footer-socials { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-start; }
      .footer-contact-item { display:flex; align-items:flex-start; gap:8px; font-size:13px; color:${subtextColor}; justify-content:flex-start; }
      .footer-book-btn {max-width:none;!important;}
      .footer-hours-row { justify-content:space-around; max-width:100%; }
      .footer-bottom { flex-direction:row; justify-content:space-between; text-align:left; }
    }
  </style>
</head>
<body>

<!-- Navbar -->
<nav class="navbar" id="navbar">
  <div class="navbar-logo">
    ${logoHtml(32)}
    <span>${layout.branding?.logoText ?? "Brand"}</span>
  </div>
  <div class="navbar-links">
    ${featuresSection ? `<a href="#features">Features</a>` : ""}
    ${pricingSection ? `<a href="#pricing">Pricing</a>` : ""}
    ${contactSection ? `<a href="#contact">Contact</a>` : ""}
  </div>
  <div style="display:flex;align-items:center;gap:16px;flex-shrink:0;">
    ${
      contactSection?.contactDetails?.phone
        ? `<a href="tel:${contactSection.contactDetails.phone}" class="navbar-phone">📞 ${contactSection.contactDetails.phone}</a>`
        : ""
    }
    <a href="#contact" class="navbar-cta">Get Started</a>
  </div>
</nav>

${
  heroSection
    ? (() => {
        // ── Hero: Split ──
        if (heroVariant === "split") {
          return `
<section class="hero">
  <div class="hero-split container ${heroSection.imageUrl ? "has-image" : ""}" style="${heroSection.imageUrl ? `background-image:url('${heroSection.imageUrl}');` : ""}">
    <div class="text-side reveal">
      <span class="section-badge">${logoHtml(16)} ${layout.branding?.logoText}</span>
     <h1>${parseAccent(heroSection.headline)}</h1>
      ${heroSection.subtext ? `<p>${heroSection.subtext}</p>` : ""}
      ${heroSection.cta ? `<div><a href="#contact" class="primary-btn" style="background:${heroSection.cta.style?.background ?? primary};border-radius:${heroSection.cta.style?.borderRadius ?? "50px"};">${heroSection.cta.text}</a></div>` : ""}
    </div>
    <div class="hero-visual reveal-right">
      ${
        heroSection.imageUrl
          ? `<div class="hero-visual-inner"><img src="${heroSection.imageUrl}" alt="hero" /><p style="position:absolute;bottom:8px;right:12px;font-size:10px;color:rgba(255,255,255,0.3);margin:0;">Photo via Unsplash</p></div>`
          : `<div class="hero-orb"><div class="orb-glow"></div><div class="orb-ring"></div><div class="orb-center"><div class="orb-logo">${logoHtml(48)}</div></div></div>`
      }
    </div>
  </div>
</section>`;
        }

        // ── Hero: Minimal ──
        if (heroVariant === "minimal") {
          return `
<section class="hero" style="background:${bg};position:relative;">
  <div class="hero-minimal container reveal">
    <span class="section-badge">${logoHtml(16)} ${layout.branding?.logoText}</span>
   <h1>${parseAccent(heroSection.headline)}</h1>
    ${heroSection.subtext ? `<p>${heroSection.subtext}</p>` : ""}
    ${
      heroSection.cta
        ? `
    <div class="hero-minimal-cta">
      <a href="#contact" class="primary-btn" style="background:${heroSection.cta.style?.background ?? primary};border-radius:${heroSection.cta.style?.borderRadius ?? "12px"};">${heroSection.cta.text}</a>
      <span class="hero-tagline">No commitment required</span>
    </div>`
        : ""
    }
  </div>
  <div class="hero-accent-line"></div>
</section>`;
        }

        // ── Hero: Centered (default) ──
        return `
<section class="hero hero-centered" data-parallax="${heroSection.imageUrl ? "true" : "false"}" style="${heroSection.imageUrl ? `background-image:url('${heroSection.imageUrl}');background-size:cover;background-position:center;` : `background:${bg};`}">
  <div class="hero-overlay" style="background:${heroSection.imageUrl ? "linear-gradient(to bottom,rgba(0,0,0,0.5),rgba(0,0,0,0.75))" : `radial-gradient(ellipse 80% 60% at 50% 0%,${primary}18,transparent)`};"></div>
  <div class="hero-content reveal">
    <span class="section-badge" style="margin-bottom:20px;${heroSection.imageUrl ? "background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.2);" : ""}">${logoHtml(16)} ${layout.branding?.logoText}</span>
    <h1 style="color:${heroSection.imageUrl ? "#fff" : text};">${parseAccent(heroSection.headline)}</h1>
    ${heroSection.subtext ? `<p style="color:${heroSection.imageUrl ? "rgba(255,255,255,0.85)" : subtextColor};">${heroSection.subtext}</p>` : ""}
    ${heroSection.cta ? `<a href="#contact" class="primary-btn" style="background:${heroSection.cta.style?.background ?? primary};border-radius:${heroSection.cta.style?.borderRadius ?? "50px"};">${heroSection.cta.text}</a>` : ""}
    ${heroSection.imageUrl ? `<p style="position:absolute;bottom:12px;right:16px;font-size:11px;color:rgba(255,255,255,0.3);margin:0;">Photo via Unsplash</p>` : ""}
  </div>
</section>`;
      })()
    : ""
}

${
  statsSection && statsSection.stats?.length
    ? `
<section class="stats">
  <div class="stats-grid reveal">
    ${statsSection.stats
      .map(
        (s: any) => `
    <div class="stat-item">
      ${s.icon ? `<div style="font-size:24px;margin-bottom:8px;">${s.icon}</div>` : ""}
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-line"></div>
    </div>`,
      )
      .join("")}
  </div>
</section>`
    : ""
}


${
  featuresSection
    ? (() => {
        const features = featuresSection.features ?? [];

        // ── Features: Alternating ──
        if (featuresVariant === "alternating") {
          return `
<section class="features-alt" id="features">
  <div class="container">
    <div class="section-header reveal">
      <span class="section-badge">Features</span>
      <h2>${featuresSection.headline}</h2>
    </div>
    ${features
      .map(
        (f: any, i: number) => `
    <div class="alt-row ${i % 2 !== 0 ? "reverse" : ""} reveal stagger-${(i % 3) + 1}">
      <div class="alt-text">
        <div class="alt-icon">${f.icon ?? ""}</div>
        <h3>${f.title}</h3>
        ${f.description ? `<p>${f.description}</p>` : ""}
        <div class="alt-accent"></div>
      </div>
      <div class="alt-visual">
  ${
    f.imageUrl
      ? `<img src="${f.imageUrl}" alt="${f.title}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;" />
       <div style="position:absolute;inset:0;border-radius:20px;background:${primary};opacity:0.08;pointer-events:none;"></div>
       <p style="position:absolute;bottom:8px;right:12px;font-size:10px;color:rgba(255,255,255,0.35);margin:0;">Photo via Unsplash</p>`
      : `<div class="alt-visual-glow" style="background:radial-gradient(circle at ${i % 2 === 0 ? "30%" : "70%"} 50%,${primary},transparent 70%);"></div>
       <div class="alt-visual-emoji">${f.icon ?? ""}</div>
       <div class="alt-num">${String(i + 1).padStart(2, "0")}</div>`
  }
</div>
    </div>`,
      )
      .join("")}
  </div>
</section>`;
        }

        // ── Features: List ──
        if (featuresVariant === "list") {
          return `
<section class="features-list" id="features">
  <div class="container" style="max-width:800px;">
    <div class="section-header reveal">
      <span class="section-badge">Features</span>
      <h2>${featuresSection.headline}</h2>
    </div>
    ${features
      .map(
        (f: any, i: number) => `
    <div class="list-row reveal stagger-${Math.min(i + 1, 6)}">
      <div class="list-num-icon">
        <span class="list-num">${String(i + 1).padStart(2, "0")}</span>
        <div class="list-icon">${f.icon ?? ""}</div>
      </div>
      <div class="list-content">
        <h3>${f.title}</h3>
        ${f.description ? `<p>${f.description}</p>` : ""}
      </div>
      <span class="list-arrow">→</span>
    </div>`,
      )
      .join("")}
  </div>
</section>`;
        }

        // ── Features: Grid (default) ──
        return `
<section class="features" id="features">
  <div class="container">
    <div class="section-header reveal">
      <span class="section-badge">Features</span>
      <h2>${featuresSection.headline}</h2>
    </div>
    <div class="features-grid">
      ${features
        .map(
          (f: any, i: number) => `
      <div class="feature-card reveal stagger-${Math.min(i + 1, 6)}">
        ${f.icon ? `<div class="feature-icon">${f.icon}</div>` : ""}
        <h3>${f.title}</h3>
        ${f.description ? `<p>${f.description}</p>` : ""}
        <div class="feature-accent"></div>
      </div>`,
        )
        .join("")}
    </div>
  </div>
</section>`;
      })()
    : ""
}

${
  pricingSection
    ? `
<section class="pricing" id="pricing">
  <div class="container">
    <div class="section-header reveal">
      <span class="section-badge">Pricing</span>
      <h2>${pricingSection.headline}</h2>
    </div>
    <div class="pricing-grid">
      ${(pricingSection.pricingOptions ?? [])
        .map((plan: any, i: number) => {
          const isH = !!plan.highlight;
          const ct = isH ? "#fff" : text;
          const cs = isH ? "rgba(255,255,255,0.75)" : subtextColor;
          return `
      <div class="pricing-card ${isH ? "highlighted" : ""} reveal stagger-${i + 1}">
        ${plan.highlight ? `<div class="popular-badge">⭐ ${plan.highlight.text}</div>` : ""}
        <h3 style="color:${ct};">${plan.name}</h3>
        <div class="pricing-price" style="color:${ct};">${plan.price}</div>
        ${plan.description ? `<p class="pricing-desc" style="color:${cs};">${plan.description}</p>` : ""}
        <div class="pricing-divider"></div>
        <ul class="pricing-features">
          ${(plan.features ?? [])
            .map(
              (f: string) => `
          <li style="color:${ct};">
            <span class="check-icon" style="background:${isH ? "rgba(255,255,255,0.25)" : primary + "33"};color:${isH ? "#fff" : primary};">✓</span>
            ${f}
          </li>`,
            )
            .join("")}
        </ul>
        <a href="#contact" class="pricing-btn" style="background:${isH ? "#fff" : primary};color:${isH ? primary : "#fff"};">
          ${plan.ctaText ?? "Get Started"}
        </a>
      </div>`;
        })
        .join("")}
    </div>
  </div>
</section>`
    : ""
}

${
  testimonialsSection
    ? `
<section class="testimonials" id="testimonials">
  <div class="container">
    <div class="section-header reveal">
      <span class="section-badge">Testimonials</span>
      <h2>${testimonialsSection.headline}</h2>
    </div>
    <div class="testimonials-grid">
      ${(testimonialsSection.testimonials ?? [])
        .map(
          (t: any, i: number) => `
      <div class="testimonial-card reveal stagger-${i + 1}" style="border-left-color:${t.style?.accentColor ?? primary};">
        <div class="quote-mark" style="color:${t.style?.accentColor ?? primary};">"</div>
        <p>${t.review}</p>
        <div class="testimonial-author">
          <div class="author-avatar" style="background:${t.style?.accentColor ?? primary};">${(t.name ?? "?")[0]}</div>
          <div>
            <div class="author-name">${t.name}</div>
            ${t.role ? `<div class="author-role">${t.role}</div>` : ""}
          </div>
        </div>
      </div>`,
        )
        .join("")}
    </div>
  </div>
</section>`
    : ""
}
${
  ctaBannerSection
    ? `
<section class="cta-banner">
  <div class="cta-banner-glow"></div>
  <div class="container reveal">
    <h2>${parseAccent(ctaBannerSection.headline ?? "")}</h2>
    ${ctaBannerSection.subtext ? `<p>${ctaBannerSection.subtext}</p>` : ""}
    <div class="cta-buttons">
      ${ctaBannerSection.primaryCta ? `<a href="#contact" class="primary-btn">${ctaBannerSection.primaryCta.text}</a>` : ""}
      ${ctaBannerSection.secondaryCta ? `<a href="#contact" class="outline-btn">${ctaBannerSection.secondaryCta.text}</a>` : ""}
    </div>
  </div>
</section>`
    : ""
}

${
  contactSection
    ? `
<!--
  TO ACTIVATE FORM SUBMISSIONS:
  1. Sign up free at https://formspree.io
  2. Create a new form → copy your endpoint URL
  3. Replace action="https://formspree.io/f/YOUR_FORM_ID" below with your URL
-->
<section class="contact" id="contact">
  <div class="container" style="max-width:1000px;">
    <div class="section-header reveal">
      <span class="section-badge">Contact</span>
      <h2>${contactSection.headline}</h2>
    </div>
    <div class="contact-layout">
      <div class="contact-details reveal reveal-left" style="background:${cardBg};border:1px solid ${borderColor};border-radius:20px;padding:28px;display:flex;flex-direction:column;gap:14px;">
        <p class="contact-subtext" style="margin-bottom:4px;">${contactSection.subtext ?? "We'd love to hear from you."}</p>
        ${contactSection.contactDetails?.phone ? `<div class="contact-card"><span style="font-size:20px;flex-shrink:0;">📞</span><div><div class="contact-label">Phone</div><div class="contact-value">${contactSection.contactDetails.phone}</div></div></div>` : ""}
        ${contactSection.contactDetails?.email ? `<div class="contact-card"><span style="font-size:20px;flex-shrink:0;">✉️</span><div><div class="contact-label">Email</div><div class="contact-value" style="word-break:break-all;">${contactSection.contactDetails.email}</div></div></div>` : ""}
        ${contactSection.contactDetails?.address ? `<div class="contact-card"><span style="font-size:20px;flex-shrink:0;">📍</span><div><div class="contact-label">Address</div><div class="contact-value">${contactSection.contactDetails.address}</div></div></div>` : ""}
        ${contactSection.contactDetails?.hours ? `<div class="contact-card"><span style="font-size:20px;flex-shrink:0;">🕐</span><div><div class="contact-label">Hours</div><div class="contact-value">${contactSection.contactDetails.hours.open} – ${contactSection.contactDetails.hours.close}</div>${contactSection.contactDetails.hours.days?.length ? `<div style="font-size:11px;opacity:.5;margin-top:2px;">${contactSection.contactDetails.hours.days.slice(0, 5).join(", ")}</div>` : ""}</div></div>` : ""}
      </div>
      <div class="contact-form-box reveal reveal-right">
        <form id="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input type="text" name="name" placeholder="John Smith" required class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" name="email" placeholder="john@example.com" required class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Message</label>
            <textarea name="message" rows="4" placeholder="Tell us how we can help..." required class="form-input" style="resize:none;"></textarea>
          </div>
          <button type="submit" class="form-submit" id="submit-btn">${contactSection.cta?.text ?? "Send Message"}</button>
          <div id="form-success">✅ Message sent! We'll get back to you soon.</div>
          <div id="form-error">❌ Something went wrong. Please try again.</div>
        </form>
      </div>
    </div>
  </div>
</section>`
    : ""
}

<!-- Footer -->
<footer class="footer">
  <div class="footer-grid">
    <div class="footer-col">
      <div class="footer-logo-row">${logoHtml(28)} <span>${layout.branding?.logoText ?? "Brand"}</span></div>
      <p class="footer-desc">${layout.branding?.logoText ?? "Brand"} — your trusted local partner.</p>
      ${
        layout.branding?.socialLinks &&
        Object.values(layout.branding.socialLinks).some(Boolean)
          ? `
      <div class="footer-socials">
        ${layout.branding.socialLinks.instagram ? `<a href="${layout.branding.socialLinks.instagram}" target="_blank" class="footer-social-icon">📸</a>` : ""}
        ${layout.branding.socialLinks.facebook ? `<a href="${layout.branding.socialLinks.facebook}" target="_blank" class="footer-social-icon">📘</a>` : ""}
        ${layout.branding.socialLinks.youtube ? `<a href="${layout.branding.socialLinks.youtube}" target="_blank" class="footer-social-icon">▶️</a>` : ""}
        ${layout.branding.socialLinks.linkedin ? `<a href="${layout.branding.socialLinks.linkedin}" target="_blank" class="footer-social-icon">💼</a>` : ""}
      </div>`
          : ""
      }
    </div>
    <div class="footer-col">
      <div class="footer-col-title">Quick Links</div>
      <ul>
        <li><a href="#">Home</a></li>
        ${featuresSection ? `<li><a href="#features">Features</a></li>` : ""}
        ${pricingSection ? `<li><a href="#pricing">Pricing</a></li>` : ""}
        ${contactSection ? `<li><a href="#contact">Contact</a></li>` : ""}
      </ul>
    </div>
    ${
      contactSection
        ? `
    <div class="footer-col">
      <div class="footer-col-title">Contact Us</div>
      ${contactSection.contactDetails?.address ? `<div class="footer-contact-item"><span>📍</span><span>${contactSection.contactDetails.address}</span></div>` : ""}
      ${contactSection.contactDetails?.phone ? `<div class="footer-contact-item"><span>📞</span><a href="tel:${contactSection.contactDetails.phone}">${contactSection.contactDetails.phone}</a></div>` : ""}
      ${contactSection.contactDetails?.hours ? `<div class="footer-contact-item"><span>🕐</span><span>Open daily · Closes at ${contactSection.contactDetails.hours.close}</span></div>` : ""}
      ${contactSection.contactDetails?.email ? `<div class="footer-contact-item"><span>✉️</span><a href="mailto:${contactSection.contactDetails.email}">${contactSection.contactDetails.email}</a></div>` : ""}
    </div>`
        : ""
    }
    ${
      contactSection?.contactDetails?.hours
        ? `
    <div class="footer-col">
      <div class="footer-col-title">Working Hours</div>
      <div class="footer-hours-row">
        <span style="color:${subtextColor};">${(() => {
          const d = contactSection.contactDetails.hours.days;
          return d?.length > 1
            ? `${d[0]} – ${d[d.length - 1]}`
            : (d?.[0] ?? "");
        })()}</span>
        <span class="footer-hours-val">${contactSection.contactDetails.hours.open} – ${contactSection.contactDetails.hours.close}</span>
      </div>
      <a href="#contact" class="footer-book-btn">Book Free Trial</a>
    </div>`
        : ""
    }
  </div>
  <div class="footer-bottom">
    <p class="footer-copy">© ${new Date().getFullYear()} ${layout.branding?.logoText ?? "Brand"}. All rights reserved.</p>
    <div class="footer-legal"><a href="#">Privacy</a><a href="#">Terms</a></div>
  </div>
</footer>

<script>
// Navbar shrink on scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));

// Parallax hero
const heroEl = document.querySelector('[data-parallax="true"]');
if (heroEl) {
  window.addEventListener('scroll', () => {
    heroEl.style.backgroundPositionY = \`calc(50% + \${window.scrollY * 0.35}px)\`;
  }, { passive: true });
}

// Contact form
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const success = document.getElementById('form-success');
    const error = document.getElementById('form-error');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    success.style.display = 'none';
    error.style.display = 'none';
    try {
      const res = await fetch(form.action, { method:'POST', body:new FormData(form), headers:{'Accept':'application/json'} });
      if (res.ok) { form.reset(); success.style.display='block'; btn.textContent='✓ Sent!'; }
      else throw new Error();
    } catch {
      error.style.display = 'block';
      btn.disabled = false;
      btn.textContent = '${contactSection?.cta?.text ?? "Send Message"}';
    }
  });
}
</script>

</body>
</html>`;
}
