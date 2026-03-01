import { Layout } from "@/types/layout";

export function generateHtml(layout: Layout): string {
  const isDark = layout.theme === "dark";
  const primary = layout.branding?.primaryColor ?? "#6366f1";
  const bg = isDark ? "#0a0a0a" : "#ffffff";
  const text = isDark ? "#ffffff" : "#0a0a0a";
  const subtextColor = isDark ? "#a3a3a3" : "#525252";
  const cardBg = isDark ? "#111111" : "#f9f9f9";
  const borderColor = isDark ? "#2a2a2a" : "#e5e7eb";
  const navBg = isDark ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.95)";
  const altBg = isDark ? "#0f0f0f" : "#f9fafb";

  const sections = layout.sections ?? [];
  const heroSection = sections.find((s) => s.type === "hero") as any;
  const featuresSection = sections.find((s) => s.type === "features") as any;
  const pricingSection = sections.find((s) => s.type === "pricing") as any;
  const testimonialsSection = sections.find(
    (s) => s.type === "testimonials",
  ) as any;
  const contactSection = sections.find((s) => s.type === "contact") as any;

  const resizeSvg = (svg: string, size: number) =>
    svg
      .replace(/width="48"/, `width="${size}"`)
      .replace(/height="48"/, `height="${size}"`);

  const logoHtml = (size: number) =>
    layout.branding?.logo
      ? `<span style="display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${resizeSvg(layout.branding.logo, size)}</span>`
      : `<span style="width:${Math.round(size * 0.7)}px;height:${Math.round(size * 0.7)}px;border-radius:50%;background:${primary};display:inline-block;flex-shrink:0;"></span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${layout.branding?.logoText ?? "Website"}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: ${bg};
      color: ${text};
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow-x: hidden;
    }

    /* ── Utilities ── */
    .container { width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 16px; }
    .section-badge {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 11px; font-weight: 600; padding: 4px 12px;
      border-radius: 999px; background: ${primary}22; color: ${primary};
      margin-bottom: 16px; letter-spacing: 0.06em; text-transform: uppercase;
    }
    .card {
      background: ${cardBg}; border: 1px solid ${borderColor};
      border-radius: 16px; padding: 24px;
    }
    .primary-btn {
      display: inline-block; background: ${primary}; color: #fff;
      padding: 12px 28px; border-radius: 50px; font-weight: 700;
      font-size: 15px; border: none; cursor: pointer;
      text-decoration: none; transition: opacity 0.2s;
    }
    .primary-btn:hover { opacity: 0.85; }
    h1, h2, h3, h4 { color: ${text}; line-height: 1.2; }
    p { color: ${subtextColor}; line-height: 1.7; }
    a { color: ${subtextColor}; text-decoration: none; }
    a:hover { color: ${text}; }
    img { max-width: 100%; display: block; }

    /* ── Navbar ── */
    .navbar {
      background: ${navBg}; border-bottom: 1px solid ${borderColor};
      padding: 14px 16px; display: flex; justify-content: space-between;
      align-items: center; position: sticky; top: 0; z-index: 50;
      backdrop-filter: blur(12px); gap: 12px;
    }
    .navbar-logo {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; font-size: 16px; color: ${text};
      min-width: 0; flex-shrink: 0; max-width: 160px;
    }
    .navbar-logo span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .navbar-links { display: none; gap: 24px; font-size: 14px; font-weight: 500; opacity: 0.75; }
    .navbar-cta {
      background: ${primary}; color: #fff; padding: 7px 14px;
      border-radius: 8px; font-size: 13px; font-weight: 600;
      text-decoration: none; white-space: nowrap; flex-shrink: 0;
    }

    /* ── Hero ── */
    .hero {
      min-height: 85vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center; padding: 80px 16px 60px;
      position: relative; overflow: hidden;
    }
    .hero-overlay {
      position: absolute; inset: 0; pointer-events: none;
    }
    .hero-content { position: relative; z-index: 1; max-width: 800px; margin: 0 auto; }
    .hero h1 {
      font-size: clamp(28px, 8vw, 72px);
      font-weight: 800; line-height: 1.1; margin-bottom: 20px;
    }
    .hero p {
      font-size: clamp(15px, 3vw, 18px);
      max-width: 580px; margin: 0 auto 32px;
    }

    /* ── Features ── */
    .features { padding: 64px 16px; background: ${altBg}; }
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-header h2 { font-size: clamp(22px, 4vw, 44px); font-weight: 700; }
    .features-grid {
      display: grid; grid-template-columns: 1fr;
      gap: 16px;
    }
    .feature-card { background: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 16px; padding: 24px; }
    .feature-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; margin-bottom: 16px;
      background: ${primary}18;
    }
    .feature-card h3 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
    .feature-card p { font-size: 14px; }

    /* ── Pricing ── */
    .pricing { padding: 64px 16px; background: ${bg}; }
    .pricing-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .pricing-card {
      border-radius: 20px; padding: 28px; border: 1px solid ${borderColor};
      display: flex; flex-direction: column; position: relative;
      background: ${cardBg};
    }
    .pricing-card.highlighted {
      background: ${primary}; border-color: transparent;
      box-shadow: 0 20px 60px ${primary}44;
    }
    .pricing-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .pricing-price { font-size: 36px; font-weight: 800; margin-bottom: 10px; }
    .pricing-desc { font-size: 13px; opacity: 0.7; margin-bottom: 20px; }
    .pricing-divider { height: 1px; opacity: 0.15; margin-bottom: 20px; background: currentColor; }
    .pricing-features { list-style: none; margin-bottom: 24px; flex: 1; }
    .pricing-features li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; margin-bottom: 10px; }
    .check-icon {
      width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700;
    }
    .pricing-btn {
      display: block; width: 100%; padding: 12px; border-radius: 12px;
      font-weight: 700; font-size: 14px; text-align: center;
      border: none; cursor: pointer; text-decoration: none;
    }
    .popular-badge {
      position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
      background: #fff; font-size: 11px; font-weight: 700;
      padding: 5px 14px; border-radius: 999px; white-space: nowrap;
    }

    /* ── Testimonials ── */
    .testimonials { padding: 64px 16px; background: ${altBg}; }
    .testimonials-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .testimonial-card {
      background: ${cardBg}; border: 1px solid ${borderColor};
      border-radius: 16px; padding: 24px; position: relative;
      overflow: hidden; border-left-width: 4px; border-left-style: solid;
    }
    .testimonial-card p { font-size: 14px; margin-bottom: 16px; }
    .testimonial-author { display: flex; align-items: center; gap: 12px; }
    .author-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .author-name { font-size: 14px; font-weight: 700; color: ${text}; }
    .author-role { font-size: 12px; opacity: 0.5; color: ${subtextColor}; }
    .quote-mark {
      position: absolute; top: 8px; right: 14px;
      font-size: 52px; font-weight: 900; opacity: 0.08; line-height: 1;
    }

    /* ── Contact ── */
    .contact { padding: 64px 16px; background: ${bg}; text-align: center; }
    .contact-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 32px; text-align: left; }
    .contact-card { background: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 14px; padding: 18px; display: flex; align-items: flex-start; gap: 14px; }
    .contact-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; opacity: 0.5; margin-bottom: 4px; }
    .contact-value { font-size: 14px; font-weight: 600; color: ${text}; word-break: break-word; }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid ${borderColor}; padding: 28px 16px;
      display: flex; flex-direction: column; align-items: center;
      gap: 16px; text-align: center;
    }
    .footer-brand { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: ${text}; }
    .footer-copy { font-size: 12px; color: ${subtextColor}; }
    .footer-links { display: flex; gap: 20px; font-size: 12px; }

    /* ── RESPONSIVE: Tablet 600px+ ── */
    @media (min-width: 600px) {
      .container { padding: 0 24px; }
      .navbar { padding: 16px 24px; }
      .navbar-links { display: flex; }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .pricing-grid { grid-template-columns: repeat(2, 1fr); }
      .testimonials-grid { grid-template-columns: repeat(2, 1fr); }
      .contact-grid { grid-template-columns: repeat(2, 1fr); }
    }

    /* ── RESPONSIVE: Desktop 900px+ ── */
    @media (min-width: 900px) {
      .container { padding: 0 32px; }
      .navbar { padding: 18px 32px; }
      .navbar-logo { font-size: 18px; max-width: none; }
      .features { padding: 96px 32px; }
      .features-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
      .pricing { padding: 96px 32px; }
      .pricing-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
      .testimonials { padding: 96px 32px; }
      .testimonials-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
      .contact { padding: 96px 32px; }
      .footer { flex-direction: row; justify-content: space-between; padding: 36px 32px; text-align: left; }
    }
  </style>
</head>
<body>

<!-- Navbar -->
<nav class="navbar">
  <div class="navbar-logo">
    ${logoHtml(32)}
    <span>${layout.branding?.logoText ?? "Brand"}</span>
  </div>
  <div class="navbar-links">
    <a href="#features" style="color:${text};">Features</a>
    <a href="#pricing" style="color:${text};">Pricing</a>
    <a href="#contact" style="color:${text};">Contact</a>
  </div>
  <a href="#contact" class="navbar-cta">Get Started</a>
</nav>

${
  heroSection
    ? `
<!-- Hero -->
<section class="hero" style="${
        heroSection.imageUrl
          ? `background-image:url('${heroSection.imageUrl}');background-size:cover;background-position:center;`
          : `background:${bg};`
      }">
  <div class="hero-overlay" style="background:${
    heroSection.imageUrl
      ? "linear-gradient(to bottom,rgba(0,0,0,0.55),rgba(0,0,0,0.75))"
      : `radial-gradient(ellipse 80% 60% at 50% 0%,${primary}18,transparent)`
  };"></div>
  <div class="hero-content">
    <div class="section-badge" style="margin-bottom:20px;">
      ${logoHtml(18)}
      ${layout.branding?.logoText}
    </div>
    <h1 style="color:${heroSection.imageUrl ? "#ffffff" : text};">${heroSection.headline}</h1>
    ${
      heroSection.subtext
        ? `<p style="color:${heroSection.imageUrl ? "rgba(255,255,255,0.85)" : subtextColor};">${heroSection.subtext}</p>`
        : ""
    }
    ${
      heroSection.cta
        ? `<a href="#contact" class="primary-btn" style="background:${heroSection.cta.style?.background ?? primary};color:${heroSection.cta.style?.textColor ?? "#fff"};border-radius:${heroSection.cta.style?.borderRadius ?? "50px"};">${heroSection.cta.text}</a>`
        : ""
    }
    ${heroSection.imageUrl ? `<p style="position:absolute;bottom:12px;right:16px;font-size:11px;color:rgba(255,255,255,0.3);margin:0;">Photo via Unsplash</p>` : ""}
  </div>
</section>`
    : ""
}

${
  featuresSection
    ? `
<!-- Features -->
<section class="features" id="features">
  <div class="container">
    <div class="section-header">
      <span class="section-badge">Features</span>
      <h2>${featuresSection.headline}</h2>
    </div>
    <div class="features-grid">
      ${(featuresSection.features ?? [])
        .map(
          (f: any) => `
      <div class="feature-card">
        ${f.icon ? `<div class="feature-icon">${f.icon}</div>` : ""}
        <h3>${f.title}</h3>
        ${f.description ? `<p>${f.description}</p>` : ""}
      </div>`,
        )
        .join("")}
    </div>
  </div>
</section>`
    : ""
}

${
  pricingSection
    ? `
<!-- Pricing -->
<section class="pricing" id="pricing">
  <div class="container">
    <div class="section-header">
      <span class="section-badge">Pricing</span>
      <h2>${pricingSection.headline}</h2>
    </div>
    <div class="pricing-grid">
      ${(pricingSection.pricingOptions ?? [])
        .map((plan: any) => {
          const isH = !!plan.highlight;
          const cardText = isH ? "#ffffff" : text;
          const cardSubtext = isH ? "rgba(255,255,255,0.75)" : subtextColor;
          return `
      <div class="pricing-card${isH ? " highlighted" : ""}">
        ${plan.highlight ? `<div class="popular-badge" style="color:${primary};">⭐ ${plan.highlight.text}</div>` : ""}
        <h3 style="color:${cardText};">${plan.name}</h3>
        <div class="pricing-price" style="color:${cardText};">${plan.price}</div>
        ${plan.description ? `<p class="pricing-desc" style="color:${cardSubtext};">${plan.description}</p>` : ""}
        <div class="pricing-divider" style="color:${isH ? "#ffffff" : primary};"></div>
        <ul class="pricing-features">
          ${(plan.features ?? [])
            .map(
              (f: string) => `
          <li style="color:${cardText};">
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
<!-- Testimonials -->
<section class="testimonials" id="testimonials">
  <div class="container">
    <div class="section-header">
      <span class="section-badge">Testimonials</span>
      <h2>${testimonialsSection.headline}</h2>
    </div>
    <div class="testimonials-grid">
      ${(testimonialsSection.testimonials ?? [])
        .map(
          (t: any) => `
      <div class="testimonial-card" style="border-left-color:${t.style?.accentColor ?? primary};">
        <div class="quote-mark" style="color:${t.style?.accentColor ?? primary};">"</div>
        <p style="color:${subtextColor};">${t.review}</p>
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
  contactSection
    ? `
<!-- Contact -->
<section class="contact" id="contact">
  <div class="container">
    <span class="section-badge">Contact</span>
    <h2 style="font-size:clamp(22px,4vw,44px);font-weight:700;margin-bottom:12px;">${contactSection.headline}</h2>
    <p style="margin-bottom:40px;font-size:15px;">${contactSection.subtext ?? "We'd love to hear from you."}</p>
    <div class="contact-grid">
      ${
        contactSection.contactDetails?.phone
          ? `
      <div class="contact-card">
        <span style="font-size:20px;flex-shrink:0;">📞</span>
        <div><div class="contact-label">Phone</div><div class="contact-value">${contactSection.contactDetails.phone}</div></div>
      </div>`
          : ""
      }
      ${
        contactSection.contactDetails?.email
          ? `
      <div class="contact-card">
        <span style="font-size:20px;flex-shrink:0;">✉️</span>
        <div><div class="contact-label">Email</div><div class="contact-value" style="word-break:break-all;">${contactSection.contactDetails.email}</div></div>
      </div>`
          : ""
      }
      ${
        contactSection.contactDetails?.address
          ? `
      <div class="contact-card">
        <span style="font-size:20px;flex-shrink:0;">📍</span>
        <div><div class="contact-label">Address</div><div class="contact-value">${contactSection.contactDetails.address}</div></div>
      </div>`
          : ""
      }
      ${
        contactSection.contactDetails?.hours
          ? `
      <div class="contact-card">
        <span style="font-size:20px;flex-shrink:0;">🕐</span>
        <div>
          <div class="contact-label">Hours</div>
          <div class="contact-value">${contactSection.contactDetails.hours.open} – ${contactSection.contactDetails.hours.close}</div>
          ${contactSection.contactDetails.hours.days?.length ? `<div style="font-size:11px;opacity:0.5;margin-top:2px;">${contactSection.contactDetails.hours.days.slice(0, 5).join(", ")}</div>` : ""}
        </div>
      </div>`
          : ""
      }
    </div>
    ${
      contactSection.cta
        ? `
    <a href="mailto:${contactSection.contactDetails?.email ?? ""}" class="primary-btn"
      style="background:${contactSection.cta.style?.background ?? primary};color:${contactSection.cta.style?.textColor ?? "#fff"};border-radius:${contactSection.cta.style?.borderRadius ?? "12px"};">
      ${contactSection.cta.text}
    </a>`
        : ""
    }
  </div>
</section>`
    : ""
}

<!-- Footer -->
<footer class="footer">
  <div class="footer-brand">
    ${logoHtml(24)}
    ${layout.branding?.logoText ?? "Brand"}
  </div>
  <p class="footer-copy">© ${new Date().getFullYear()} ${layout.branding?.logoText ?? "Brand"}. All rights reserved.</p>
  <div class="footer-links">
    <a href="#" style="color:${subtextColor};">Privacy</a>
    <a href="#" style="color:${subtextColor};">Terms</a>
    <a href="#contact" style="color:${subtextColor};">Contact</a>
  </div>
</footer>

</body>
</html>`;
}
