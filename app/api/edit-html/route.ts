import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserCredits, deductCredits } from "@/lib/firestore";

export const maxDuration = 60;

function stripFences(raw: string): string {
  return raw
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credits = await getUserCredits(userId);
  if (credits < 1) {
    return NextResponse.json(
      {
        error: "NO_CREDITS",
        message: "You need at least 1 credit for a surgical edit.",
      },
      { status: 402 },
    );
  }

  const { html, instruction } = await req.json();
  if (!html || !instruction) {
    return NextResponse.json(
      { error: "Missing html or instruction" },
      { status: 400 },
    );
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4.5",
      max_tokens: 16000,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a precise HTML editor. Apply ONLY the user's requested change to the HTML.
Do NOT restructure, rewrite, or improve anything else.
Return the COMPLETE HTML file with only that one change applied.
Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no backticks, no explanation.`,
        },
        {
          role: "user",
          content: `HTML:\n${html}\n\nChange to apply: ${instruction}`,
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: "OpenRouter error" }, { status: 500 });
  }

  const edited = stripFences(data.choices?.[0]?.message?.content ?? "");

  if (!edited.includes("<html") && !edited.includes("<!DOCTYPE")) {
    return NextResponse.json(
      { error: "Invalid HTML returned" },
      { status: 500 },
    );
  }

  const outputTokens = data.usage?.completion_tokens ?? 0;
  const creditsUsed = Math.max(
    1,
    Math.ceil(((outputTokens * 0.000004) / 0.005) * 2),
  );

  await deductCredits(userId, creditsUsed);

  return NextResponse.json({ html: edited, creditsUsed });
}
