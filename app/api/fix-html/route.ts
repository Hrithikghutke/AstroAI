import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

function stripFences(raw: string): string {
  let result = raw
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const doctypeIndex = result.search(/<!DOCTYPE\s+html/i);
  const htmlTagIndex = result.search(/<html[\s>]/i);
  const startIndex =
    doctypeIndex !== -1 ? doctypeIndex : htmlTagIndex !== -1 ? htmlTagIndex : 0;
  if (startIndex > 0) result = result.substring(startIndex);
  return result;
}

// ── Surgical fixers — no AI needed, pure string manipulation ──

function fixMobileLayout(html: string): string {
  // Fix common mobile overflow issues
  return (
    html
      // Ensure responsive text sizes
      .replace(/\btext-8xl\b(?!\s+\w*md:)/g, "text-4xl md:text-8xl")
      .replace(/\btext-7xl\b(?!\s+\w*md:)/g, "text-4xl md:text-7xl")
      .replace(/\btext-6xl\b(?!\s+\w*md:)/g, "text-3xl md:text-6xl")
      // Fix non-responsive grids
      .replace(/\bgrid-cols-4\b(?!.*md:)/g, "grid-cols-2 md:grid-cols-4")
      .replace(/\bgrid-cols-3\b(?!.*md:)/g, "grid-cols-1 md:grid-cols-3")
      // Fix horizontal overflow
      .replace(/\bflex\b(?=.*gap-\d+)(?!.*flex-wrap)/g, "flex flex-wrap")
  );
}

function fixRouting(html: string): string {
  const routingJs = `function showPage(id){document.querySelectorAll('.page').forEach(p=>p.style.display='none');var el=document.getElementById('page-'+id);if(el){el.style.display='block';window.scrollTo(0,0);}document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('text-primary'));var al=document.querySelector('.nav-link[href="#'+id+'"]');if(al)al.classList.add('text-primary');}
window.addEventListener('hashchange',function(){showPage(window.location.hash.slice(1)||'home');});
window.addEventListener('load',function(){showPage(window.location.hash.slice(1)||'home');});`;

  // Replace whatever routing function exists with the correct one
  return html.replace(
    /function showPage[\s\S]*?window\.addEventListener\('load'[\s\S]*?\}\);/,
    routingJs,
  );
}

// ── AI fixer — for complex issues that need intelligence ──
async function aiFixSection(
  html: string,
  issues: string[],
  sectionName: string,
  extractRegex: RegExp,
): Promise<string> {
  const match = html.match(extractRegex);
  if (!match) return html; // section not found, return unchanged

  const sectionHtml = match[0];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4.5",
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content: `You are a frontend developer fixing a specific HTML section. 
Return ONLY the fixed section HTML — no explanation, no markdown, no surrounding document.
Maintain all existing classes and styles unless they are causing the reported issue.`,
        },
        {
          role: "user",
          content: `Fix this ${sectionName} section. Issues to fix:\n${issues.map((i, n) => `${n + 1}. ${i}`).join("\n")}\n\nSection HTML:\n${sectionHtml}\n\nReturn ONLY the fixed section HTML.`,
        },
      ],
    }),
  });

  const data = await res.json();
  const fixed = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!fixed) return html;

  // Splice fixed section back into full HTML
  return html.replace(sectionHtml, fixed);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { html, issues } = await req.json();
  if (!html || !issues?.length) {
    return NextResponse.json(
      { error: "Missing html or issues" },
      { status: 400 },
    );
  }

  // ── Route each issue to the cheapest fix strategy ──
  const NEEDS_FULL_REGEN = [
    "Missing sections",
    "Content not relevant",
    "Poor design quality",
    "HTML incomplete",
  ];
  const SURGICAL_REGEX = ["Mobile layout broken"];
  const ROUTING_FIX = ["Page routing broken"];
  const NAVBAR_AI_FIX = ["Navbar not working"];
  const COLOR_AI_FIX = ["Wrong colors/theme"];
  const needsFullRegen = issues.some((i: string) =>
    NEEDS_FULL_REGEN.includes(i),
  );

  if (needsFullRegen) {
    return NextResponse.json({ requiresFullRegen: true });
  }

  // Separate custom feedback (prefixed "Custom: ") from known issue types
  const customIssues = issues.filter((i: string) => i.startsWith("Custom: "));
  const knownIssues = issues.filter((i: string) => !i.startsWith("Custom: "));

  try {
    let fixedHtml = html;
    let tokensUsed = 0;

    // 1. Surgical regex fixes (free — no AI)
    if (issues.some((i: string) => SURGICAL_REGEX.includes(i))) {
      fixedHtml = fixMobileLayout(fixedHtml);
      console.log("[Fix] Applied surgical mobile layout fix");
    }

    // 2. Routing fix (free — no AI)
    if (issues.some((i: string) => ROUTING_FIX.includes(i))) {
      fixedHtml = fixRouting(fixedHtml);
      console.log("[Fix] Applied routing fix");
    }

    // 3. Navbar AI fix — extract just <nav> block (~200 lines → ~2K tokens)
    if (issues.some((i: string) => NAVBAR_AI_FIX.includes(i))) {
      fixedHtml = await aiFixSection(
        fixedHtml,
        issues.filter((i: string) => NAVBAR_AI_FIX.includes(i)),
        "navbar",
        /<nav[\s\S]*?<\/nav>/i,
      );
      tokensUsed += 2000;
      console.log("[Fix] Applied AI navbar fix");
    }

    // 4. Color/theme AI fix — extract just tailwind config + style block
    if (issues.some((i: string) => COLOR_AI_FIX.includes(i))) {
      fixedHtml = await aiFixSection(
        fixedHtml,
        issues.filter((i: string) => COLOR_AI_FIX.includes(i)),
        "theme config",
        /<script>tailwind\.config[\s\S]*?<\/script>/i,
      );
      tokensUsed += 500;
      console.log("[Fix] Applied AI color/theme fix");
    }

    // Handle custom feedback — targeted AI fix on the specific section described
    if (customIssues.length > 0) {
      const customDescriptions = customIssues.map((i: string) =>
        i.replace("Custom: ", "").trim(),
      );
      console.log(
        "[Fix] Applying AI fix for custom issues:",
        customDescriptions,
      );

      try {
        const res = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "anthropic/claude-haiku-4.5",
              max_tokens: 12000,
              messages: [
                {
                  role: "system",
                  content: `You are a frontend developer fixing specific issues in an HTML website.
Fix ONLY the reported issues — do not rewrite or restructure anything else.
Return the complete fixed HTML document starting with <!DOCTYPE html>. No explanation, no markdown.`,
                },
                {
                  role: "user",
                  content: `Fix these specific issues in the website:\n${customDescriptions.map((d: string, i: number) => `${i + 1}. ${d}`).join("\n")}\n\nReturn the complete fixed HTML.\n\nHTML:\n${fixedHtml}`,
                },
              ],
            }),
          },
        );

        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content ?? "";
        const cleaned = raw
          .replace(/^```html\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        const startIdx = cleaned.search(/<!DOCTYPE\s+html/i);
        const hasValidHtml =
          startIdx !== -1 && cleaned.toLowerCase().includes("</html>");
        console.log(
          `[Fix] Custom fix response: ${raw.length} chars, hasValidHtml=${hasValidHtml}, tokens=${data.usage?.completion_tokens}`,
        );
        if (hasValidHtml) {
          fixedHtml = cleaned.substring(startIdx);
          tokensUsed += data.usage?.completion_tokens ?? 4000;
          console.log("[Fix] Custom AI fix applied successfully");
        } else {
          // HTML too large for single pass — do surgical CSS-only fix instead
          console.log(
            "[Fix] HTML too large for full rewrite, applying targeted CSS injection",
          );
          const issueText = customDescriptions.join(" ").toLowerCase();
          if (
            issueText.includes("spacing") ||
            issueText.includes("overlap") ||
            issueText.includes("padding") ||
            issueText.includes("margin")
          ) {
            // Inject a <style> block just before </head> to fix spacing/overlap issues
            const styleRes = await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "anthropic/claude-haiku-4.5",
                  max_tokens: 500,
                  messages: [
                    {
                      role: "system",
                      content:
                        "You are a CSS expert. Output ONLY a <style> block (no explanation, no markdown) that fixes the reported layout issue. Keep it minimal — 3-8 CSS rules max.",
                    },
                    {
                      role: "user",
                      content: `Fix this issue with CSS only: ${customDescriptions.join(". ")}\n\nContext: This is a multi-page website with a fixed navbar, hero section with background image, and a ticker tape bar at the bottom of the hero.`,
                    },
                  ],
                }),
              },
            );
            const styleData = await styleRes.json();
            const styleBlock =
              styleData.choices?.[0]?.message?.content?.trim() ?? "";
            if (styleBlock.includes("<style>")) {
              fixedHtml = fixedHtml.replace(
                "</head>",
                `${styleBlock}\n</head>`,
              );
              tokensUsed += styleData.usage?.completion_tokens ?? 200;
              console.log("[Fix] CSS injection applied:", styleBlock);
            }
          }
        }
      } catch (err) {
        console.warn("[Fix] Custom AI fix failed:", err);
      }
    }

    console.log(
      `[Fix] Total estimated tokens: ${tokensUsed} (vs ~20K for full regen)`,
    );

    return NextResponse.json({ html: fixedHtml });
  } catch (err) {
    console.error("Fix HTML error:", err);
    return NextResponse.json({ error: "Fix failed" }, { status: 500 });
  }
}
