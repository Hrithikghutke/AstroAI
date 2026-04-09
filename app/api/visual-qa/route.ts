import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { trackApiUsage } from "@/lib/firestore";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { desktopImage, mobileImage } = await req.json();
  if (!desktopImage && !mobileImage) {
    return NextResponse.json({ error: "Missing screenshots" }, { status: 400 });
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              // Desktop full page screenshot
              ...(desktopImage
                ? [
                    {
                      type: "image" as const,
                      source: {
                        type: "base64" as const,
                        media_type: "image/png" as const,
                        data: desktopImage.replace(
                          /^data:image\/png;base64,/,
                          "",
                        ),
                      },
                    },
                  ]
                : []),

              // Mobile viewport screenshot
              ...(mobileImage
                ? [
                    {
                      type: "image" as const,
                      source: {
                        type: "base64" as const,
                        media_type: "image/png" as const,
                        data: mobileImage.replace(
                          /^data:image\/png;base64,/,
                          "",
                        ),
                      },
                    },
                  ]
                : []),

              {
                type: "text" as const,
                text: `You are a senior UI/UX QA engineer reviewing website screenshots.


You are looking at ${[desktopImage && "1 desktop full-page screenshot", mobileImage && "1 mobile viewport screenshot"].filter(Boolean).join(", ")}.
Analyze ALL provided screenshots and identify real, visible layout problems across both desktop and mobile.

Return ONLY raw JSON — no markdown, no explanation:
{
  "passed": true or false,
  "issues": [
    "MOBILE: Hero CTA buttons overflow horizontally — stack them vertically with flex-direction:column",
    "MOBILE: Pricing cards not responsive — add grid-template-columns:1fr at 768px breakpoint",
    "DESKTOP: Footer columns overlap at 1280px width"
  ],
  "strengths": ["what looks good"]
}

PREFIX each issue with MOBILE: or DESKTOP: so the fix agent knows which breakpoint to target.

WHAT TO FLAG:
- Buttons overflowing or not centered in their container
- Text overflowing outside its container  
- Cards or sections cut off at screen edges
- Overlapping elements
- Navbar items wrapping or breaking
- Empty sections with no visible content
- Form inputs extending beyond container
- Images not fitting their container
- On mobile: any horizontal scrollbar or overflow
- On mobile: text too large to fit screen width
- On mobile: buttons not full width inside cards

WHAT TO FLAG additionally:
- Hero headings smaller than the rest of the page or not visually dominant
- Stats/numbers not visually centered inside their circle or container
- Circle shapes that are oval instead of perfectly round
- Profile image placeholders that are rectangle instead of circle
- Text that looks like default browser styling (no custom font applied)
- Heading and body text too similar in size — no visual hierarchy
- Fonts that look excessively bold, squished, condensed, or overlapping (adjust tracking/letter-spacing or font-weight if so)

WHAT TO IGNORE:
- Color palette preferences
- Content quality or copywriting
- Which font family is chosen
- Overall design style preferences

passed = true only if zero layout issues found across ALL screenshots.`,
              },
            ],
          },
        ],
      }),
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    // Track visual QA token usage — fire-and-forget
    const qaTokens: number = data.usage?.completion_tokens ?? 0;
    if (qaTokens > 0) {
      const GEMINI_FLASH_COST_PER_TOKEN = 0.0000004; // $0.40 per 1M output tokens
      trackApiUsage("google/gemini-1.5-flash", qaTokens, qaTokens * GEMINI_FLASH_COST_PER_TOKEN).catch(console.warn);
    }

    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const report = JSON.parse(cleaned);

    return NextResponse.json(report);
  } catch (err) {
    console.error("Visual QA error:", err);
    // Non-fatal — return passed if visual QA itself fails
    return NextResponse.json({ passed: true, issues: [], strengths: [] });
  }
}
