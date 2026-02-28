import { Layout } from "@/types/layout";

export function generateHtml(layout: Layout): string {
  const isDark = layout.theme === "dark";
  const primary = layout.branding?.primaryColor ?? "#6366f1";
  const bg = isDark ? "#000000" : "#ffffff";
  const text = isDark ? "#ffffff" : "#0a0a0a";
  const subtextColor = isDark ? "#a3a3a3" : "#525252";
  const cardBg = isDark ? "#111111" : "#f9f9f9";
  const borderColor = isDark ? "#2a2a2a" : "#e5e7eb";
  const navBg = isDark ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.95)";

  const sections = layout.sections ?? [];
  const heroSection = sections.find((s) => s.type === "hero") as any;
  const featuresSection = sections.find((s) => s.type === "features") as any;
  const pricingSection = sections.find((s) => s.type === "pricing") as any;
  const testimonialsSection = sections.find(
    (s) => s.type === "testimonials",
  ) as any;
  const contactSection = sections.find((s) => s.type === "contact") as any;

  // Helper: resize SVG to given px
  const resizeSvg = (svg: string, size: number) =>
    svg
      .replace(/width="48"/, `width="${size}"`)
      .replace(/height="48"/, `height="${size}"`);

  const logoHtml = (size: number) =>
    layout.branding?.logo
      ? `<span style="display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${resizeSvg(layout.branding.logo, size)}</span>`
      : `<span style="width:${size * 0.33}px;height:${size * 0.33}px;border-radius:50%;background:${primary};display:inline-block;flex-shrink:0;"></span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${layout.branding?.logoText ?? "Website"}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${bg}; color: ${text}; font-family: system-ui, -apple-system, sans-serif; }
    .primary-btn {
      background: ${primary};
      color: #fff;
      padding: 14px 32px;
      border-radius: 50px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      font-size: 16px;
      transition: opacity 0.2s;
      display: inline-block;
      text-decoration: none;
    }
    .primary-btn:hover { opacity: 0.85; }
    .card {
      background: ${cardBg};
      border: 1px solid ${borderColor};
      border-radius: 16px;
      padding: 28px;
    }
    .section-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 999px;
      background: ${primary}22;
      color: ${primary};
      margin-bottom: 16px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    h1, h2, h3 { color: ${text}; }
    p { color: ${subtextColor}; }
    a { color: ${subtextColor}; text-decoration: none; }
    a:hover { color: ${text}; }
  </style>
</head>
<body>

<!-- Navbar -->
<nav style="background:${navBg}; border-bottom:1px solid ${borderColor}; padding:18px 32px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:50; backdrop-filter:blur(12px);">
  <div style="display:flex; align-items:center; gap:10px; font-weight:700; font-size:18px;">
    ${logoHtml(36)}
    ${layout.branding?.logoText ?? "Brand"}
  </div>
  <div style="display:flex; gap:28px; font-size:14px; font-weight:500; opacity:0.75;">
    <a href="#features" style="color:${text};">Features</a>
    <a href="#pricing" style="color:${text};">Pricing</a>
    <a href="#contact" style="color:${text};">Contact</a>
  </div>
  <a href="#contact" class="primary-btn" style="padding:8px 20px; border-radius:10px; font-size:14px;">Get Started</a>
</nav>

${
  heroSection
    ? `
<!-- Hero -->
<section style="min-height:90vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:80px 24px; background:${bg}; position:relative; overflow:hidden;">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%, ${primary}18, transparent);pointer-events:none;"></div>
  <div style="position:relative; max-width:800px; margin:0 auto;">
    <span class="section-badge">
      ${logoHtml(18)}
      ${layout.branding?.logoText}
    </span>
    <h1 style="font-size:clamp(36px,7vw,72px); font-weight:800; line-height:1.1; margin-bottom:24px; color:${text};">
      ${heroSection.headline}
    </h1>
    ${heroSection.subtext ? `<p style="font-size:18px; max-width:600px; margin:0 auto 36px; line-height:1.7; color:${subtextColor};">${heroSection.subtext}</p>` : ""}
    ${heroSection.cta ? `<a href="#contact" class="primary-btn">${heroSection.cta.text}</a>` : ""}
  </div>
</section>`
    : ""
}

${
  featuresSection
    ? `
<!-- Features -->
<section id="features" style="padding:96px 24px; background:${isDark ? "#0a0a0a" : "#f9fafb"};">
  <div style="max-width:1100px; margin:0 auto;">
    <div style="text-align:center; margin-bottom:60px;">
      <span class="section-badge">Features</span>
      <h2 style="font-size:clamp(28px,4vw,44px); font-weight:700;">${featuresSection.headline}</h2>
    </div>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">
      ${(featuresSection.features ?? [])
        .map(
          (f: any) => `
      <div class="card">
        ${f.icon ? `<div style="font-size:28px; margin-bottom:16px; width:52px; height:52px; display:flex; align-items:center; justify-content:center; background:${primary}18; border-radius:12px;">${f.icon}</div>` : ""}
        <h3 style="font-size:16px; font-weight:700; margin-bottom:8px; color:${text};">${f.title}</h3>
        ${f.description ? `<p style="font-size:14px; line-height:1.6; color:${subtextColor};">${f.description}</p>` : ""}
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
<section id="pricing" style="padding:96px 24px; background:${bg};">
  <div style="max-width:1100px; margin:0 auto;">
    <div style="text-align:center; margin-bottom:60px;">
      <span class="section-badge">Pricing</span>
      <h2 style="font-size:clamp(28px,4vw,44px); font-weight:700;">${pricingSection.headline}</h2>
    </div>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:24px; align-items:start;">
      ${(pricingSection.pricingOptions ?? [])
        .map((plan: any) => {
          const isHighlighted = !!plan.highlight;
          return `
      <div style="background:${isHighlighted ? primary : cardBg}; border:1px solid ${isHighlighted ? "transparent" : borderColor}; border-radius:20px; padding:36px; position:relative; ${isHighlighted ? `box-shadow:0 20px 60px ${primary}44; transform:scale(1.03);` : ""}">
        ${plan.highlight ? `<div style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);background:#fff;color:${primary};font-size:12px;font-weight:700;padding:6px 16px;border-radius:999px;white-space:nowrap;">⭐ ${plan.highlight.text}</div>` : ""}
        <h3 style="font-size:20px;font-weight:700;margin-bottom:6px;color:${isHighlighted ? "#fff" : text};">${plan.name}</h3>
        <div style="font-size:38px;font-weight:800;margin-bottom:12px;color:${isHighlighted ? "#fff" : text};">${plan.price}</div>
        ${plan.description ? `<p style="font-size:14px;margin-bottom:20px;opacity:0.75;color:${isHighlighted ? "#fff" : subtextColor};">${plan.description}</p>` : ""}
        <hr style="border:none;border-top:1px solid ${isHighlighted ? "rgba(255,255,255,0.2)" : borderColor};margin-bottom:20px;">
        <ul style="list-style:none;margin-bottom:28px;">
          ${(plan.features ?? [])
            .map(
              (f: string) => `
          <li style="display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:14px;color:${isHighlighted ? "#fff" : text};">
            <span style="width:18px;height:18px;border-radius:50%;background:${isHighlighted ? "rgba(255,255,255,0.25)" : primary + "33"};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${isHighlighted ? "#fff" : primary};flex-shrink:0;">✓</span>
            ${f}
          </li>`,
            )
            .join("")}
        </ul>
        <a href="#contact" style="display:block;text-align:center;padding:12px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;text-decoration:none;background:${isHighlighted ? "#fff" : primary};color:${isHighlighted ? primary : "#fff"};">Get Started</a>
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
<section id="testimonials" style="padding:96px 24px; background:${isDark ? "#0a0a0a" : "#f9fafb"};">
  <div style="max-width:1100px; margin:0 auto;">
    <div style="text-align:center; margin-bottom:60px;">
      <span class="section-badge">Testimonials</span>
      <h2 style="font-size:clamp(28px,4vw,44px); font-weight:700;">${testimonialsSection.headline}</h2>
    </div>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">
      ${(testimonialsSection.testimonials ?? [])
        .map(
          (t: any) => `
      <div class="card" style="border-left:4px solid ${t.style?.accentColor ?? primary}; position:relative; overflow:hidden;">
        <div style="position:absolute;top:12px;right:16px;font-size:48px;font-weight:900;opacity:0.08;color:${t.style?.accentColor ?? primary};">"</div>
        <p style="font-size:14px;line-height:1.7;margin-bottom:20px;color:${subtextColor};">${t.review}</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;border-radius:50%;background:${t.style?.accentColor ?? primary};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;">${(t.name ?? "?")[0]}</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:${text};">${t.name}</div>
            ${t.role ? `<div style="font-size:12px;opacity:0.5;color:${subtextColor};">${t.role}</div>` : ""}
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
<section id="contact" style="padding:96px 24px; background:${bg}; text-align:center;">
  <div style="max-width:680px; margin:0 auto;">
    <span class="section-badge">Contact</span>
    <h2 style="font-size:clamp(28px,4vw,44px); font-weight:700; margin-bottom:16px;">${contactSection.headline}</h2>
    <p style="margin-bottom:48px;font-size:16px;color:${subtextColor};">We'd love to hear from you. Reach out through any of the channels below.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:40px;text-align:left;">
      ${contactSection.contactDetails?.phone ? `<div class="card" style="display:flex;gap:16px;align-items:flex-start;"><span style="font-size:20px;">📞</span><div><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;opacity:.5;margin-bottom:4px;color:${subtextColor};">Phone</p><p style="font-size:14px;font-weight:600;color:${text};">${contactSection.contactDetails.phone}</p></div></div>` : ""}
      ${contactSection.contactDetails?.email ? `<div class="card" style="display:flex;gap:16px;align-items:flex-start;"><span style="font-size:20px;">✉️</span><div><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;opacity:.5;margin-bottom:4px;color:${subtextColor};">Email</p><p style="font-size:14px;font-weight:600;color:${text};">${contactSection.contactDetails.email}</p></div></div>` : ""}
      ${contactSection.contactDetails?.address ? `<div class="card" style="display:flex;gap:16px;align-items:flex-start;"><span style="font-size:20px;">📍</span><div><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;opacity:.5;margin-bottom:4px;color:${subtextColor};">Address</p><p style="font-size:14px;font-weight:600;color:${text};">${contactSection.contactDetails.address}</p></div></div>` : ""}
      ${contactSection.contactDetails?.hours ? `<div class="card" style="display:flex;gap:16px;align-items:flex-start;"><span style="font-size:20px;">🕐</span><div><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;opacity:.5;margin-bottom:4px;color:${subtextColor};">Hours</p><p style="font-size:14px;font-weight:600;color:${text};">${contactSection.contactDetails.hours.open} – ${contactSection.contactDetails.hours.close}</p></div></div>` : ""}
    </div>
    ${contactSection.cta ? `<a href="mailto:${contactSection.contactDetails?.email ?? ""}" class="primary-btn">${contactSection.cta.text}</a>` : ""}
  </div>
</section>`
    : ""
}

<!-- Footer -->
<footer style="border-top:1px solid ${borderColor};padding:36px 32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
  <div style="display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;">
    ${logoHtml(28)}
    ${layout.branding?.logoText ?? "Brand"}
  </div>
  <p style="font-size:12px;color:${subtextColor};">© ${new Date().getFullYear()} ${layout.branding?.logoText ?? "Brand"}. All rights reserved.</p>
  <div style="display:flex;gap:20px;font-size:12px;">
    <a href="#" style="color:${subtextColor};">Privacy</a>
    <a href="#" style="color:${subtextColor};">Terms</a>
    <a href="#contact" style="color:${subtextColor};">Contact</a>
  </div>
</footer>

</body>
</html>`;
}
