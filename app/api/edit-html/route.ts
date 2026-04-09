import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserCredits, deductCredits } from "@/lib/firestore";
import { getPagePrompt } from "@/lib/agentPrompts/developer";

export const maxDuration = 120;

// ── Extract design tokens from existing HTML (same logic as generate-deep) ──
function extractDesignTokens(html: string): string {
  const tailwindMatch = html.match(
    /<script>\s*tailwind\.config[\s\S]*?<\/script>/,
  );
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  const fontMatch = html.match(/fonts\.googleapis\.com\/css2\?[^"']+/);
  const tailwind = tailwindMatch
    ? tailwindMatch[0].replace(/<\/?script>/g, "").trim()
    : "";
  const styles = styleMatch ? styleMatch[1].trim() : "";
  const fonts = fontMatch ? `Google Fonts URL: ${fontMatch[0]}` : "";
  return [tailwind, styles, fonts]
    .filter(Boolean)
    .join("\n\n---\n\n")
    .slice(0, 2500);
}

// ── Extract a named CC section from HTML ──
// Returns { found: true, content, before, after } or { found: false }
function extractSection(html: string, sectionName: string) {
  const open = `<!-- CC:${sectionName} -->`;
  const close = `<!-- /CC:${sectionName} -->`;
  const startIdx = html.indexOf(open);
  const endIdx = html.indexOf(close);
  if (startIdx === -1 || endIdx === -1) {
    if (sectionName === "footer") {
      const footerStart = html.search(/<footer\b/i);
      const footerEnd = html.indexOf("</footer>", Math.max(0, footerStart));
      if (footerStart !== -1 && footerEnd !== -1) {
        const afterFooter = footerEnd + "</footer>".length;
        return {
          found: true as const,
          content: html.slice(footerStart, afterFooter).trim(),
          before: html.slice(0, footerStart),
          after: html.slice(afterFooter),
        };
      }
    }
    return { found: false as const };
  }
  return {
    found: true as const,
    content: html.slice(startIdx + open.length, endIdx).trim(),
    before: html.slice(0, startIdx + open.length),
    after: html.slice(endIdx),
  };
}

// ── Find all CC section names in HTML ──
function findAllSections(html: string): string[] {
  const matches = [...html.matchAll(/<!-- CC:([a-z0-9-]+) -->/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

// ── Extract page IDs from HTML (id="page-X") ──
function findAllPages(html: string): { id: string; label: string }[] {
  const matches = [...html.matchAll(/id="page-([a-z0-9-]+)"/g)];
  return [...new Set(matches.map((m) => m[1]))].map((id) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
  }));
}

// ── Extract navbar HTML block ──
function extractNavbar(html: string): string {
  const start = html.search(/<nav\b/i);
  if (start === -1) return "";
  let depth = 0;
  let i = start;
  while (i < html.length) {
    if (html.slice(i, i + 4).toLowerCase() === "<nav") depth++;
    else if (html.slice(i, i + 5).toLowerCase() === "</nav") {
      depth--;
      if (depth === 0) return html.slice(start, i + 6);
    }
    i++;
  }
  return html.slice(start); // unclosed — return from start
}

// ── Call OpenRouter (non-streaming) ──
async function callModel(
  system: string,
  user: string,
  maxTokens = 8000,
  modelId = "anthropic/claude-haiku-4.5",
): Promise<{ content: string; tokens: number }> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OpenRouter error: ${JSON.stringify(data)}`);
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    tokens: data.usage?.completion_tokens ?? 0,
  };
}

function stripFences(raw: string): string {
  let cleaned = raw;
  const match = cleaned.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    cleaned = match[1];
  }
  return cleaned
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function calcCredits(tokens: number, modelId: string): number {
  // Cost per output token varies significantly by model
  const costPerToken: Record<string, number> = {
    "anthropic/claude-haiku-4.5": 0.000004,
    "anthropic/claude-sonnet-4.6": 0.000015,
    "anthropic/claude-opus-4": 0.000075,
    "deepseek/deepseek-v3.2": 0.0000009,
    "google/gemini-3-flash-preview": 0.0000004,
    "openai/gpt-5-mini": 0.000004,
  };
  const cost = costPerToken[modelId] ?? 0.000004;
  return Math.max(1, Math.ceil(((tokens * cost) / 0.005) * 2));
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const credits = await getUserCredits(userId);
  if (credits < 1) {
    return NextResponse.json(
      {
        error: "NO_CREDITS",
        message: "You need at least 1 credit for an edit.",
      },
      { status: 402 },
    );
  }

  const {
    html,
    instruction,
    targetSection,
    targetPage,
    action,
    model,
    pageLabel,
  } = await req.json();
  // Use the same model that generated the site — matches cost expectations.
  // Fall back to Haiku only for JSON classification calls (cheap, fast).
  // For page generation (add_page), use the user's selected model.
  const GENERATION_MODEL = model ?? "anthropic/claude-haiku-4.5";
  if (!html || !instruction) {
    return NextResponse.json(
      { error: "Missing html or instruction" },
      { status: 400 },
    );
  }

  const designTokens = extractDesignTokens(html);
  let totalTokens = 0;

  // ══════════════════════════════════════════════
  // ACTION: add_page — generate + inject new page
  // ══════════════════════════════════════════════
  if (action === "add_page") {
    const { pageId, pageLabel, businessContext } = await req
      .json()
      .catch(() => ({}));
    // pageId and pageLabel come from the classifier in /api/chat
    // We already have them from the outer req.json() via instruction field
    // Parse them from instruction if not provided directly
    const pid = targetPage ?? pageId ?? "new-page";
    const plabel =
      pageLabel ??
      pid.charAt(0).toUpperCase() + pid.slice(1).replace(/-/g, " ");

    // Step 1 — Generate the new page section
    const { content: newPageHtml, tokens: pageTokens } = await callModel(
      getPagePrompt(pid, plabel, instruction, designTokens),
      `Generate the complete ${plabel} page section.`,
      16000,
      GENERATION_MODEL, // use same model as original generation
    );
    totalTokens += pageTokens;

    const cleanPage = stripFences(newPageHtml);
    // Ensure correct wrapper
    const pageSection = cleanPage.includes(`id="page-${pid}"`)
      ? cleanPage
      : `<section id="page-${pid}" class="page">\n${cleanPage}\n</section><!-- end page-${pid} -->`;

    // Step 2 — Update navbar via Haiku
    const existingNav = extractNavbar(html);
    const { content: updatedNav, tokens: navTokens } = await callModel(
      // Haiku for navbar — small structural task, model quality doesn't matter
      `You are updating a website navbar to add one new navigation link.
Return ONLY the updated <nav>...</nav> block. No explanation, no markdown, no other HTML.
RULES:
- Add the new link in BOTH the desktop nav links AND the mobile menu links
- Match the exact style, classes, and pattern of existing nav links
- Place the new link BEFORE the last link (which is always Contact/contact)
- Do NOT change anything else about the navbar`,
      `Existing navbar HTML:\n${existingNav}\n\nAdd a nav link: href="#${pid}" label="${plabel}"`,
      4000,
    );
    totalTokens += navTokens;

    // Step 3 — Inject page section + replace navbar in HTML
    let updatedHtml = html;

    // Replace navbar
    if (updatedNav.trim().startsWith("<nav") && existingNav) {
      updatedHtml = updatedHtml.replace(existingNav, stripFences(updatedNav));
    }

    // Inject new page section before </main>
    updatedHtml = updatedHtml.replace("</main>", `\n${pageSection}\n</main>`);

    const creditsUsed = calcCredits(totalTokens, GENERATION_MODEL);
    await deductCredits(userId, creditsUsed);

    return NextResponse.json({
      html: updatedHtml,
      creditsUsed,
      addedPage: { id: pid, label: plabel },
    });
  }

  // ══════════════════════════════════════════════
  // ACTION: section_edit — surgical section fix
  // ══════════════════════════════════════════════
  if (action === "section_edit" && targetSection) {
    // Find the section in HTML
    const extracted = extractSection(html, targetSection);

    if (!extracted.found) {
      // Section markers missing — fall back to full edit
      console.warn(
        `[Edit] CC:${targetSection} not found — falling back to full edit`,
      );
      return NextResponse.json({ fallback: true, reason: "section_not_found" });
    }

    const { content: fixedSection, tokens } = await callModel(
      `You are surgically fixing one HTML section.
Return ONLY the fixed inner HTML content — do NOT include the <!-- CC:${targetSection} --> marker comments themselves.
Do NOT add any wrapping divs or sections that weren't there before.
Match the existing design system exactly — same classes, same color variables, same structure.
Fix ONLY what the instruction asks. Change nothing else.

DESIGN SYSTEM (for reference — use these classes/colors):
${designTokens}`,
      `Current section HTML:\n${extracted.content}\n\nFix instruction: ${instruction}`,
      8000,
    );
    totalTokens += tokens;

    // Reconstruct: before + open marker + fixed content + close marker + after
    const close = `<!-- /CC:${targetSection} -->`;
    const updatedHtml =
      extracted.before +
      "\n" +
      stripFences(fixedSection) +
      "\n" +
      extracted.after;

    const creditsUsed = calcCredits(totalTokens, GENERATION_MODEL);
    await deductCredits(userId, creditsUsed);

    return NextResponse.json({
      html: updatedHtml,
      creditsUsed,
      editedSection: targetSection,
    });
  }

  // ══════════════════════════════════════════════
  // ACTION: navbar_edit — update navbar only
  // ══════════════════════════════════════════════
  if (action === "navbar_edit") {
    const existingNav = extractNavbar(html);
    if (!existingNav) {
      return NextResponse.json({ fallback: true, reason: "navbar_not_found" });
    }

    const { content: updatedNav, tokens } = await callModel(
      `You are updating a website navbar based on the user's instruction.
Return ONLY the updated <nav>...</nav> block. No explanation, no markdown.
Match the existing style exactly. Change only what is asked.`,
      `Existing navbar:\n${existingNav}\n\nInstruction: ${instruction}`,
      4000,
    );
    totalTokens += tokens;

    const updatedHtml = html.replace(existingNav, stripFences(updatedNav));
    const creditsUsed = calcCredits(totalTokens, GENERATION_MODEL);
    await deductCredits(userId, creditsUsed);

    return NextResponse.json({ html: updatedHtml, creditsUsed });
  }

  // ══════════════════════════════════════════════
  // FALLBACK — global edit (no section identified)
  // Smarter than before: only sends relevant chunk
  // ══════════════════════════════════════════════
  // For color/font changes: only send <head> block
  const isHeadEdit = /(color|font|theme|background|primary|palette)/i.test(
    instruction,
  );
  if (isHeadEdit) {
    const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      const { content: fixedHead, tokens } = await callModel(
        `You are editing the <head> block of a website to apply a style change.
Return ONLY the complete updated <head>...</head> block including the tags themselves.
No explanation, no markdown.`,
        `Head block:\n${headMatch[0]}\n\nChange: ${instruction}`,
        4000,
      );
      totalTokens += tokens;
      const updatedHtml = html.replace(headMatch[0], stripFences(fixedHead));
      const creditsUsed = calcCredits(totalTokens, GENERATION_MODEL);
      await deductCredits(userId, creditsUsed);
      return NextResponse.json({ html: updatedHtml, creditsUsed });
    }
  }

  // True fallback — whole HTML (last resort, should rarely hit)
  const { content: edited, tokens } = await callModel(
    `You are a precise HTML editor. Apply ONLY the requested change.
Return the COMPLETE HTML file with only that change applied.
Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no backticks.`,
    `HTML:\n${html}\n\nChange: ${instruction}`,
    16000,
  );
  totalTokens += tokens;

  const editedHtml = stripFences(edited);
  if (!editedHtml.includes("<html") && !editedHtml.includes("<!DOCTYPE")) {
    return NextResponse.json(
      { error: "Invalid HTML returned" },
      { status: 500 },
    );
  }

  const creditsUsed = calcCredits(totalTokens, GENERATION_MODEL);
  await deductCredits(userId, creditsUsed);
  return NextResponse.json({ html: editedHtml, creditsUsed });
}
