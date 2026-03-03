import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserCredits, deductCredit } from "@/lib/firestore";
import { generateLogo } from "@/lib/generateLogo";
import { fetchUnsplashImage } from "@/lib/fetchUnsplash"; // ← NEW

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credits = await getUserCredits(userId);
    if (credits < 1) {
      return NextResponse.json(
        { error: "NO_CREDITS", message: "You have no credits left." },
        { status: 402 },
      );
    }

    const { prompt, themeStyle, currentLayout } = await req.json();

    const systemContext = currentLayout
      ? `The user currently has this website layout JSON:
${JSON.stringify(currentLayout, null, 2)}
The user wants to modify it. Apply ONLY the changes they request. Keep everything else exactly the same unless explicitly asked to change it.`
      : `You are generating a brand new website from scratch.`;

    // ── Call Haiku for layout JSON ──
    const layoutResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          max_tokens: 3000,
          messages: [
            {
              role: "system",
              content: `You are an expert website architect and UI designer. Your job is to produce a complete, richly detailed website layout in JSON format.

CRITICAL RULES:
- For any headline field, you MAY wrap one key phrase in <accent> tags to render it in the brand color. Example: "Best Gym in Town – <accent>Gold's Gym</accent>". Use this sparingly — max one accent per headline.
- Return ONLY valid raw JSON. No markdown. No explanation. No code blocks.
- Every string field must have real, meaningful content — never empty strings.
- All colors must be valid hex codes (e.g. "#ff6b00").
- All icons must be a single relevant emoji character.


${systemContext}

The themeStyle requested is: "${themeStyle || "corporate"}".
Adjust your color palette and tone to match this style:
- minimal: muted, neutral palette, clean and spacious
- bold: high contrast, vivid accent colors, punchy copy
- glassmorphism: rich gradient backgrounds, vibrant but translucent accents
- elegant: muted gold/cream palette, sophisticated copy, serif-friendly
- corporate: professional blues/teals, trust-focused, formal tone

LAYOUT VARIANT RULES:
- If the user EXPLICITLY requests a specific hero variant (e.g. "split hero", "minimal layout", "centered hero"), you MUST use that variant — it overrides everything below.
- Otherwise, choose the best variant for the business type:

Hero variants:
- "centered": headline centered with full background. Best for: restaurants, gyms, events, bold brands.
- "split": text on left, visual on right. Best for: SaaS, apps, tech, agencies.
- "minimal": huge clean headline, no background image. Best for: portfolios, consultants, elegant brands.

Features variants:
- "grid": 3-column card grid. Best for: SaaS, general services (use when 5-6 features).
- "alternating": text+visual rows alternating. Best for: agencies, detailed services (use when 3-4 features).
- "list": icon+text rows, no cards. Best for: simple benefit lists, minimal brands (use when 4-8 features).

OUTPUT this exact JSON shape (fill every field with real content):

{
  "theme": "dark",
  "themeStyle": "${themeStyle || "corporate"}",
  "primaryColor": "<main brand hex color>",
 "branding": {
  "logoText": "<short brand name>",
  "primaryColor": "<same main hex color>",
  "secondaryColor": "<complementary hex color>",
  "fontStyle": "bold",
  "socialLinks": {
    "instagram": "<instagram URL or null>",
    "facebook": "<facebook URL or null>",
    "youtube": "<youtube URL or null>"
  }
},
  "sections": [
    {
      "type": "hero",
      "variant": "<centered|split|minimal>",
      "headline": "<powerful, specific headline — at least 8 words>",
      "subtext": "<compelling subtitle — 1-2 sentences>",
      "imageQuery": "<3-5 word Unsplash search query matching the business>",
      "cta": {
  "text": "<primary action button text>",
  "style": {
    "background": "<primaryColor hex>",
    "textColor": "#ffffff",
    "borderRadius": "50px",
    "fontWeight": "bold"
  }
},
"secondaryCta": {
  "text": "<secondary action e.g. Learn More, Watch Demo, Book Free Trial>",
  "style": {
    "background": "transparent",
    "textColor": "<primaryColor hex>",
    "borderRadius": "50px",
    "borderColor": "<primaryColor hex>"
  }
}
    },

    {
  "type": "stats",
  "stats": [
    { "value": "<number e.g. 10,000+>", "label": "<short label e.g. Sq Ft Space>", "icon": "<emoji>" },
    { "value": "<number>", "label": "<label>", "icon": "<emoji>" },
    { "value": "<number>", "label": "<label>", "icon": "<emoji>" },
    { "value": "<number e.g. 4.9★>", "label": "<label e.g. Average Rating>", "icon": "<emoji>" }
  ]
},

    {
      "type": "features",
      "variant": "<grid|alternating|list>",
      "headline": "<features section headline>",
      "features": [
        { "title": "<feature name>", "description": "<1-2 sentence description>", "icon": "<single emoji>" },
        { "title": "<feature name>", "description": "<1-2 sentence description>", "icon": "<single emoji>" },
        { "title": "<feature name>", "description": "<1-2 sentence description>", "icon": "<single emoji>" },
        { "title": "<feature name>", "description": "<1-2 sentence description>", "icon": "<single emoji>" },
        { "title": "<feature name>", "description": "<1-2 sentence description>", "icon": "<single emoji>" },
        { "title": "<feature name>", "description": "<1-2 sentence description>", "icon": "<single emoji>" }
      ]
    },
    {
      "type": "pricing",
      "headline": "<pricing section headline>",
      "pricingOptions": [
        {
          "name": "<plan name>",
          "price": "<price with currency and period>",
          "description": "<1-sentence pitch>",
          "features": ["<feature 1>", "<feature 2>", "<feature 3>"],
          "ctaText": "<button text>",
          "style": { "borderColor": "<primaryColor>" }
        },
        {
          "name": "<plan name>",
          "price": "<price>",
          "description": "<pitch>",
          "features": ["<feature 1>", "<feature 2>", "<feature 3>", "<feature 4>"],
          "ctaText": "<button text>",
          "highlight": { "text": "Most Popular", "color": "<primaryColor>" },
          "style": { "background": "<primaryColor>", "textColor": "#ffffff" }
        },
        {
          "name": "<plan name>",
          "price": "<price>",
          "description": "<pitch>",
          "features": ["<feature 1>", "<feature 2>", "<feature 3>", "<feature 4>", "<feature 5>"],
          "ctaText": "<button text>",
          "style": { "borderColor": "<secondaryColor>" }
        }
      ]
    },
    {
      "type": "testimonials",
      "headline": "<testimonials section headline>",
      "testimonials": [
        { "name": "<realistic full name>", "role": "<job title>", "review": "<genuine 2-3 sentence review>", "style": { "accentColor": "<primaryColor>" } },
        { "name": "<realistic full name>", "role": "<job title>", "review": "<2-3 sentence review>", "style": { "accentColor": "<primaryColor>" } },
        { "name": "<realistic full name>", "role": "<job title>", "review": "<2-3 sentence review>", "style": { "accentColor": "<primaryColor>" } }
      ]
    },
    {
  "type": "cta_banner",
  "headline": "<compelling CTA headline — can use <accent>key phrase</accent> for brand color highlight>",
  "subtext": "<1 sentence supporting text>",
  "primaryCta": {
    "text": "<primary CTA text>",
    "style": { "background": "<primaryColor>", "textColor": "#ffffff", "borderRadius": "50px" }
  },
  "secondaryCta": {
    "text": "<secondary CTA e.g. phone number or secondary action>",
    "style": { "background": "transparent", "textColor": "<primaryColor>", "borderRadius": "50px", "borderColor": "<primaryColor>" }
  }
},
    {
      "type": "contact",
      "headline": "<contact section headline>",
      "subtext": "<1-2 sentences inviting people to reach out>",
      "contactDetails": {
        "phone": "<realistic phone number>",
        "email": "<realistic email address>",
        "address": "<realistic street address>",
        "hours": {
          "open": "9:00 AM",
          "close": "6:00 PM",
          "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]
        }
      },
      "cta": {
        "text": "<send message button text e.g. Send Message>",
        "style": {
          "background": "<primaryColor>",
          "textColor": "#ffffff",
          "borderRadius": "12px",
          "fontWeight": "bold"
        }
      }
    }
  ]
}`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8,
        }),
      },
    );

    const layoutData = await layoutResponse.json();

    if (!layoutResponse.ok) {
      console.error("Haiku error:", layoutData);
      return NextResponse.json(
        { error: "Layout generation failed" },
        { status: 500 },
      );
    }

    const raw = layoutData.choices[0].message.content;
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsedLayout = JSON.parse(cleaned);
    // ── DEBUG: log what AI returned for variants ──
    const _hero = parsedLayout.sections?.find((s: any) => s.type === "hero");
    const _feat = parsedLayout.sections?.find(
      (s: any) => s.type === "features",
    );
    console.log(
      "🔍 AI variant debug →",
      JSON.stringify({
        heroVariant: _hero?.variant,
        featuresVariant: _feat?.variant,
        imageQuery: _hero?.imageQuery,
      }),
    );

    // ── Variant override — parse user's prompt directly, don't trust AI ──
    // Regex matches things like "split hero", "hero split", "split section", "split layout"
    const heroSec = parsedLayout.sections?.find((s: any) => s.type === "hero");
    const featuresSec = parsedLayout.sections?.find(
      (s: any) => s.type === "features",
    );

    if (heroSec) {
      if (
        /(split[\s-]hero|hero[\s-]split|split[\s-]section|split[\s-]layout)/i.test(
          prompt,
        )
      ) {
        heroSec.variant = "split";
      } else if (
        /(minimal[\s-]hero|hero[\s-]minimal|minimal[\s-]layout|minimal[\s-]section)/i.test(
          prompt,
        )
      ) {
        heroSec.variant = "minimal";
      } else if (
        /(centered[\s-]hero|hero[\s-]centered|centered[\s-]layout)/i.test(
          prompt,
        )
      ) {
        heroSec.variant = "centered";
      }
      // If no explicit request, keep whatever Haiku chose (its heuristics are fine as fallback)
    }

    if (featuresSec) {
      if (
        /(alternating[\s-]features?|features?[\s-]alternating)/i.test(prompt)
      ) {
        featuresSec.variant = "alternating";
      } else if (/(list[\s-]features?|features?[\s-]list)/i.test(prompt)) {
        featuresSec.variant = "list";
      } else if (/(grid[\s-]features?|features?[\s-]grid)/i.test(prompt)) {
        featuresSec.variant = "grid";
      }
    }

    console.log(
      "✅ Final variants →",
      JSON.stringify({
        heroVariant: heroSec?.variant,
        featuresVariant: featuresSec?.variant,
      }),
    );

    // ── Run logo + image fetch in PARALLEL ──
    const heroSection = parsedLayout.sections?.find(
      (s: any) => s.type === "hero",
    );
    const imageQuery = heroSection?.imageQuery ?? null;

    const [logoSvg, imageUrl] = await Promise.all([
      // Call 1: Sonnet generates SVG logo
      generateLogo({
        brandName: parsedLayout?.branding?.logoText ?? "Brand",
        primaryColor: parsedLayout?.branding?.primaryColor ?? "#6366f1",
        secondaryColor: parsedLayout?.branding?.secondaryColor ?? "#ffffff",
        themeStyle: themeStyle ?? "corporate",
      }),
      // Call 2: Unsplash fetches hero image
      imageQuery ? fetchUnsplashImage(imageQuery) : Promise.resolve(null),
    ]);

    // ── Attach logo ──
    if (logoSvg) {
      parsedLayout.branding.logo = logoSvg;
      console.log("✅ Logo generated for:", parsedLayout.branding.logoText);
    } else {
      console.warn("⚠️ Logo generation failed, using dot fallback");
    }

    // ── Attach image URL to hero section ──
    if (imageUrl && heroSection) {
      heroSection.imageUrl = imageUrl;
      console.log("✅ Hero image fetched:", imageUrl.slice(0, 60));
    } else {
      console.warn("⚠️ Hero image fetch failed, using gradient fallback");
    }

    // ── Fetch Unsplash images for alternating features ──
    // Only runs for alternating variant since grid/list don't show images
    if (
      featuresSec?.variant === "alternating" &&
      Array.isArray(featuresSec.features)
    ) {
      const featureImagePromises = featuresSec.features.map((f: any) =>
        fetchUnsplashImage(`${f.title} professional`),
      );
      const featureImages = await Promise.all(featureImagePromises);
      featureImages.forEach((url, i) => {
        if (url) featuresSec.features[i].imageUrl = url;
      });
      console.log(
        "✅ Feature images fetched:",
        featureImages.filter(Boolean).length,
        "/",
        featuresSec.features.length,
      );
    }
    // ── Deduct credit ──
    await deductCredit(userId);

    return NextResponse.json({ layout: parsedLayout });
  } catch (error) {
    console.error("Generate route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
