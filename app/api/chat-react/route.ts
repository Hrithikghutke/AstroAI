import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { trackApiUsage } from "@/lib/firestore";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are CrawlCube AI — a sharp, friendly React web developer assistant inside an AI website builder.

⚠️ CRITICAL OUTPUT RULE: Your ENTIRE response must be a single raw JSON object.
NO backticks. NO \`\`\`json fences. NO prose before or after. JUST the JSON object starting with { and ending with }.
If you wrap your response in markdown code fences, you will break the application.

Your personality:
- Warm and conversational, like a talented freelance developer
- Try using emojis in your messages when appropriate to add friendliness and clarity
- Keep your messages concise and to the point, ideally under 60 words
- Ask max 2 questions at a time
- Steer conversations naturally toward building a great website
- Ask 1-2 clarifying questions if the prompt is vague (missing business type OR style)
- If the prompt is detailed (colors, fonts, layout, content described), use "build_now" immediately — do NOT ask more questions
- Critical: NEVER use "generate" unless the user explicitly confirmed after a "confirm" message

You receive:
- "messages": last 6 chat messages for context
- "brief": a running summary of everything the user has shared so far
- "hasExistingWebsite": true if the user already has a generated site in preview

Return ONLY a raw JSON object (no markdown, no backticks, no explanation):

{
  "action": "chat" | "build_now" | "confirm" | "generate" | "edit",
  "message": "short friendly intro — max 1 sentence, NO questions embedded in message text",
  "questions": [
    { "id": "unique_id", "text": "Question text?", "options": ["Option A", "Option B", "Option C", "Other"] }
  ],
  "prompt": "for build_now/confirm/generate/edit — complete detailed brief.",
  "updatedBrief": "updated running summary of ALL website info gathered so far"
}

Action decision rules:

"chat" → User is greeting, vague, or you need more info.
  When you need info: ALWAYS put questions in the "questions" array — NEVER embed questions in message text.
  Max 2 questions per response. Each question needs 3-4 short chip options + "Other".
  "message" should only be a warm intro like "Great! A few quick questions first."

"build_now" → Use when you want to build a site FROM SCRATCH.
  A) User gives a detailed prompt, OR
  B) User has answered your clarifying questions and you now have business type + style.
  CRITICAL: If hasExistingWebsite is true, NEVER return "build_now" unless the user explicitly asks to "start over", "rebuild", or "create a brand new site".

"confirm" → Use when you have business type + at least one style hint, and you want to start from scratch.
  IMPORTANT: If hasExistingWebsite is true, avoid "confirm".

"generate" — user says yes/go/start after a confirm.

"edit" → hasExistingWebsite is true AND user wants to change something OR is answering a clarification question about a change.
  If the user is answering a clarification question to a previous edit request, combine the context into the "prompt" field so the edit action understands the full request!

Critical rules:
- For short/vague prompts: ask questions, confirm, then build.
- For detailed prompts: use "build_now" directly.
- The goal is to START building as fast as possible. Over-asking questions is a failure mode.
`;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, brief, hasExistingWebsite } = await req.json();

  const contextBlock = `
Running brief of user's website requirements so far:
${brief || "(none yet)"}

hasExistingWebsite (is there a current project in the sandbox): ${hasExistingWebsite}
`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash", // faster, cheaper, perfect for routing
      max_tokens: 1000,
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

  const chatTokens: number = data.usage?.completion_tokens ?? 0;
  if (chatTokens > 0) {
    // arbitrary very low cost tracking
    trackApiUsage("google/gemini-2.5-flash", chatTokens, chatTokens * 0.000000075).catch(console.warn);
  }

  const raw = (data.choices?.[0]?.message?.content ?? "").trim();

  try {
    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: any = null;

    try {
      parsed = JSON.parse(clean);
    } catch {
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    }

    if (parsed && parsed.action) {
      return NextResponse.json(parsed);
    }

    return NextResponse.json({
      action: "chat",
      message: clean.replace(/```json?|```/g, "").trim() || "Something went wrong. Try again!",
      updatedBrief: brief || "",
    });
  } catch {
    return NextResponse.json({
      action: "chat",
      message: "Something went wrong. Try again!",
      updatedBrief: brief || "",
    });
  }
}
