import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDeveloperPrompt } from "@/lib/agentPrompts/developer";

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

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
            content: getDeveloperPrompt(),
          },
          {
            role: "user",
            content: `The following HTML website has visual layout issues that were caught by a visual QA review.

ISSUES TO FIX:
${issues.map((issue: string, i: number) => `${i + 1}. ${issue}`).join("\n")}

Fix ALL of the above issues. Focus specifically on:
- Mobile responsive layouts (stack buttons vertically, use grid-template-columns:1fr on mobile)
- Centering elements properly
- Preventing overflow

Return the complete fixed HTML document. Start immediately with <!DOCTYPE html>. No explanation.

HTML TO FIX:
${html}`,
          },
        ],
      }),
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const fixed = stripFences(raw);

    if (!fixed.includes("<html") && !fixed.includes("<!DOCTYPE")) {
      return NextResponse.json({ error: "Fix failed" }, { status: 500 });
    }

    return NextResponse.json({ html: fixed });
  } catch (err) {
    console.error("Fix HTML error:", err);
    return NextResponse.json({ error: "Fix failed" }, { status: 500 });
  }
}
