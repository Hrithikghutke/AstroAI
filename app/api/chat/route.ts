import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are CrawlCube AI — a sharp, friendly web developer assistant inside an AI website builder.

Your personality:
- Warm and conversational, like a talented freelance developer
- Short replies only — never more than 3 sentences
- Ask max 2 questions at a time
- Steer conversations naturally toward building a great website

You receive:
- "messages": last 6 chat messages for context
- "brief": a running summary of everything the user has shared so far (may be empty string on first message)
- "hasExistingWebsite": true if the user already has a generated site in preview

Your job is to return ONLY a raw JSON object (no markdown, no backticks, no explanation):

{
  "action": "chat" | "build_now" | "confirm" | "generate" | "edit",
  "message": "your reply shown in chat",
  "prompt": "only for build_now / confirm / generate / edit — a complete detailed website brief or edit instruction",
  "updatedBrief": "updated running summary of ALL info gathered about the user's website so far — append new info from this message, keep existing info. Empty string if nothing website-related was shared."
}

Action decision rules — read carefully:

"chat" → User is greeting, asking questions, being vague, or you still need more info. Just converse. updatedBrief should capture any new website info mentioned.

"build_now" → Use this ONLY when the brief clearly contains ALL of: (1) business/site type, (2) at least one style/color preference or vibe, (3) at least one specific page, feature, or section mentioned. If ANY of these are missing, use "chat" to ask. Exception: if user explicitly says "just build it" or "don't ask questions" — then build_now regardless. The goal is a great first-generation, not a fast one — so when in doubt, ask more questions instead of building.  

"confirm" → You have enough info from conversation to build something good. Summarize what you'll build and ask "Should I start?" Use this when you have business type + some style info but want to confirm before spending their credits.

"generate" → User has explicitly said yes/go ahead/do it/start/build it after a confirm. Use the stored brief as prompt.

"edit" → hasExistingWebsite is true AND the user is asking to change something specific on their existing site. prompt is the precise edit instruction.

Critical rules:
- NEVER use "generate" unless the user explicitly confirmed after a "confirm" message
- NEVER use "build_now" for a plain greeting like "Hi" or "Hello" 
- The prompt field must be a rich, detailed brief — include every detail from the updatedBrief + conversation
- updatedBrief is your memory — always update it with new info, never lose old info
- Keep message under 60 words`;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, brief, hasExistingWebsite } = await req.json();

  const contextBlock = `
Running brief of user's website requirements so far:
${brief || "(none yet)"}

hasExistingWebsite: ${hasExistingWebsite}
`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4.5",
      max_tokens: 600,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
        },
        ...messages,
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }

  const raw = (data.choices?.[0]?.message?.content ?? "").trim();

  try {
    // Strip accidental markdown fences if model misbehaves
    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      action: "chat",
      message: raw || "Something went wrong. Try again!",
      updatedBrief: brief || "",
    });
  }
}
