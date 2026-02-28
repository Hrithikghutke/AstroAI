import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserCredits, deductCredit } from "@/lib/firestore";
import { generateLogo } from "@/lib/generateLogo"; // ← NEW

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

OUTPUT this exact JSON shape (fill every field with real content):

{
  "theme": "dark",
  "themeStyle": "${themeStyle || "corporate"}",
  "primaryColor": "<main brand hex color>",
  "branding": {
    "logoText": "<short brand name>",
    "primaryColor": "<same main hex color>",
    "secondaryColor": "<complementary hex color>",
    "fontStyle": "bold"
  },
  "sections": [
    {
      "type": "hero",
      "headline": "<powerful, specific headline — at least 8 words>",
      "subtext": "<compelling subtitle — 1-2 sentences>",
      "cta": {
        "text": "<action-oriented button text>",
        "style": {
          "background": "<primaryColor hex>",
          "textColor": "#ffffff",
          "borderRadius": "50px",
          "fontWeight": "bold",
          "hoverEffect": {
            "background": "<slightly lighter/darker hex>",
            "textColor": "#ffffff"
          }
        }
      }
    },
    {
      "type": "features",
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
          "style": { "borderColor": "<primaryColor>" }
        },
        {
          "name": "<plan name>",
          "price": "<price>",
          "description": "<pitch>",
          "features": ["<feature 1>", "<feature 2>", "<feature 3>", "<feature 4>"],
          "highlight": { "text": "Most Popular", "color": "<primaryColor>" },
          "style": { "background": "<primaryColor>", "textColor": "#ffffff" }
        },
        {
          "name": "<plan name>",
          "price": "<price>",
          "description": "<pitch>",
          "features": ["<feature 1>", "<feature 2>", "<feature 3>", "<feature 4>", "<feature 5>"],
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
      "type": "contact",
      "headline": "<contact section headline>",
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
        "text": "<contact CTA button text>",
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

    // ── Call Sonnet for SVG logo directly (no internal fetch) ──
    const logoSvg = await generateLogo({
      brandName: parsedLayout?.branding?.logoText ?? "Brand",
      primaryColor: parsedLayout?.branding?.primaryColor ?? "#6366f1",
      secondaryColor: parsedLayout?.branding?.secondaryColor ?? "#ffffff",
      themeStyle: themeStyle ?? "corporate",
    });

    if (logoSvg) {
      parsedLayout.branding.logo = logoSvg;
      console.log("✅ Logo generated for:", parsedLayout.branding.logoText);
    } else {
      console.warn("⚠️ Logo generation failed, using dot fallback");
    }

    // ── Deduct credit after successful generation ──
    await deductCredit(userId);

    console.log(
      "Logo in final layout:",
      parsedLayout.branding?.logo?.slice(0, 50),
    );

    return NextResponse.json({ layout: parsedLayout });
  } catch (error) {
    console.error("Generate route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
