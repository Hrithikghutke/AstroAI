import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserCredits, deductCredits } from "@/lib/firestore";
import { getArchitectPrompt } from "@/lib/agentPrompts/architect";
import { getDeveloperPrompt } from "@/lib/agentPrompts/developer";
import { getQaPrompt } from "@/lib/agentPrompts/qa";

// Increase max duration for Deep Dive — Opus can take 45-60s
export const maxDuration = 120; // seconds — requires Vercel Pro or hobby with override

// ── Shared OpenRouter fetch helper ──
async function callOpenRouter(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 12000,
  model: string = "anthropic/claude-haiku-4.5",
): Promise<{ content: string; outputTokens: number }> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`OpenRouter error: ${JSON.stringify(data)}`);
  }

  const content = data.choices?.[0]?.message?.content ?? "";
  const outputTokens = data.usage?.completion_tokens ?? 0;

  console.log(`[OpenRouter] model=${model} | output_tokens=${outputTokens}`);

  return { content, outputTokens };
}

// OpenRouter output cost per token (in dollars)
const MODEL_COST_PER_TOKEN: Record<string, number> = {
  "anthropic/claude-haiku-4.5": 0.000004, // $0.004 per 1K
  "anthropic/claude-sonnet-4.5": 0.000015, // $0.015 per 1K
  "anthropic/claude-opus-4": 0.000075, // $0.075 per 1K
};

const CREDIT_VALUE_USD = 0.005; // 1 credit = $0.005
const PROFIT_MARGIN = 2; // 40% margin

function calculateCredits(outputTokens: number, model: string): number {
  const costPerToken = MODEL_COST_PER_TOKEN[model] ?? 0.000004;
  const actualCost = outputTokens * costPerToken;
  const rawCredits = (actualCost / CREDIT_VALUE_USD) * PROFIT_MARGIN;
  // Round up to nearest integer, minimum 2 credits
  return Math.max(2, Math.ceil(rawCredits));
}

// ── Strip markdown code fences if AI wraps output ──
function stripFences(raw: string): string {
  let result = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Strip any prose preamble before the DOCTYPE/html tag
  // Model sometimes says "Here's the website:" before the actual HTML
  const doctypeIndex = result.search(/<!DOCTYPE\s+html/i);
  const htmlTagIndex = result.search(/<html[\s>]/i);
  const startIndex =
    doctypeIndex !== -1 ? doctypeIndex : htmlTagIndex !== -1 ? htmlTagIndex : 0;

  if (startIndex > 0) {
    result = result.substring(startIndex);
  }

  return result;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, model: selectedModel } = await req.json();

  // Minimum credits needed to even start (actual cost calculated after generation)
  // Use a small upfront check so users with 0 credits can't start at all
  const MIN_CREDITS_TO_START: Record<string, number> = {
    "anthropic/claude-haiku-4.5": 3,
    "anthropic/claude-sonnet-4.5": 10,
    "anthropic/claude-opus-4": 50,
  };
  const minRequired = MIN_CREDITS_TO_START[selectedModel] ?? 3;

  const credits = await getUserCredits(userId);
  if (credits < minRequired) {
    return NextResponse.json(
      {
        error: "NO_CREDITS",
        message: `You need at least ${minRequired} credits to start a Deep Dive with this model. You have ${credits}.`,
      },
      { status: 402 },
    );
  }
  if (!prompt) {
    return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
  }

  // Model config — Architect and QA always use Haiku (JSON only)
  // Developer uses user-selected model
  const DEVELOPER_MODEL = selectedModel ?? "anthropic/claude-haiku-4.5";

  const MODEL_LABELS: Record<string, string> = {
    "anthropic/claude-haiku-4.5": "Haiku (Fast & Cost-Effective)",
    "anthropic/claude-sonnet-4.5": "Sonnet (Balanced Quality & Cost)",
    "anthropic/claude-opus-4":
      "Opus (Premium & Expensive, best for complex sites)",
  };

  const modelLabel = MODEL_LABELS[DEVELOPER_MODEL] ?? DEVELOPER_MODEL;

  // ── Set up streaming response ──
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Track whether stream is still open
      let isClosed = false;

      const closeStream = () => {
        if (!isClosed) {
          isClosed = true;
          controller.close(); // ← actually closes the stream
        }
      };

      // Helper to push a status event to the client
      const push = (event: string, data: Record<string, any>) => {
        if (isClosed) return;
        const payload = JSON.stringify({ event, ...data });
        try {
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (e) {
          isClosed = true;
        }
      };

      // Accumulate total output tokens across all agent calls
      let totalOutputTokens = 0;
      let totalCreditsToDeduct = 2; // base minimum

      try {
        // ════════════════════════════════
        // AGENT 1 — ARCHITECT
        // ════════════════════════════════
        push("ARCHITECT_START", {
          message:
            "Architect is analyzing your prompt and designing the website structure...",
        });

        const { content: architectRaw, outputTokens: architectTokens } =
          await callOpenRouter(getArchitectPrompt(), prompt, 2000);
        totalOutputTokens += architectTokens;

        const architectCleaned = stripFences(architectRaw);
        let architectPlan: any;

        try {
          // First attempt — direct parse
          architectPlan = JSON.parse(architectCleaned);
        } catch {
          // Second attempt — extract JSON object from anywhere in the response
          const jsonMatch = architectCleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              architectPlan = JSON.parse(jsonMatch[0]);
            } catch {
              // Both attempts failed
            }
          }

          if (!architectPlan) {
            push("ERROR", {
              message:
                "Architect failed to produce a valid plan. Please try again.",
            });
            closeStream();
            return;
          }
        }

        push("ARCHITECT_DONE", {
          message: `Architecture complete! Designing a ${architectPlan.theme} ${architectPlan.businessType} website for ${architectPlan.brandName}.`,
          plan: {
            brandName: architectPlan.brandName,
            businessType: architectPlan.businessType,
            theme: architectPlan.theme,
            sections: architectPlan.sections?.map((s: any) => s.id),
            overallStyle: architectPlan.overallStyle,
          },
        });

        // ════════════════════════════════
        // AGENT 2 — DEVELOPER
        // ════════════════════════════════
        const estimatedTime = DEVELOPER_MODEL.includes("opus")
          ? "45-60"
          : DEVELOPER_MODEL.includes("sonnet")
            ? "25-35"
            : "15-20";

        push("DEVELOPER_START", {
          message: `Developer [${modelLabel}] is writing your website code. This may take ${estimatedTime} seconds...`,
        });

        const developerUserMessage = `
Here is the architecture plan from the Architect Agent:
${JSON.stringify(architectPlan, null, 2)}

Original user request: "${prompt}"

Build the complete website now. Return ONLY the raw HTML document.`;

        // Developer uses Sonnet for higher quality output
        const { content: htmlRaw, outputTokens: developerTokens } =
          await callOpenRouter(
            getDeveloperPrompt(),
            developerUserMessage,
            12000,
            DEVELOPER_MODEL,
          );
        totalOutputTokens += developerTokens;
        // Calculate credits after Developer finishes — most expensive step
        totalCreditsToDeduct = calculateCredits(
          totalOutputTokens,
          DEVELOPER_MODEL,
        );
        const htmlOutput = stripFences(htmlRaw);

        if (
          !htmlOutput.includes("<!DOCTYPE html") &&
          !htmlOutput.includes("<html")
        ) {
          push("ERROR", {
            message:
              "Developer failed to generate valid HTML. Please try again.",
          });
          closeStream();
          return;
        }

        // Truncation check — HTML must end with </html>
        // Check for truncation — HTML must contain </html> somewhere near the end
        const htmlTrimmed = htmlOutput
          .replace(/<!--[\s\S]*?-->/g, "")
          .trimEnd()
          .toLowerCase();
        const hasClosingTag =
          htmlTrimmed.endsWith("</html>") || htmlTrimmed.endsWith("</html>\n");
        const hasClosingTagNearEnd =
          htmlOutput.toLowerCase().lastIndexOf("</html>") >
          htmlOutput.length - 200;

        if (!hasClosingTag && !hasClosingTagNearEnd) {
          push("ERROR", {
            message:
              "Website generation was incomplete — the output was too large. Try a simpler prompt with fewer sections, or use Fast Mode for complex websites.",
          });
          closeStream();
          return;
        }

        push("DEVELOPER_DONE", {
          message: "Code complete! Running quality checks...",
        });

        // Send HTML immediately so client can render it
        // QA may further improve it — client will update if COMPLETE arrives
        push("HTML_PREVIEW", {
          html: htmlOutput,
          brandName: architectPlan.brandName,
          message: "Preview ready — quality checks running in background...",
        });

        // ════════════════════════════════
        // AGENT 3 — QA (max 2 attempts)
        // ════════════════════════════════
        push("QA_START", {
          message: "QA Agent is reviewing your website for issues...",
        });

        let finalHtml = htmlOutput;
        let qaAttempts = 0;
        const MAX_QA_ATTEMPTS = 2;

        while (qaAttempts < MAX_QA_ATTEMPTS) {
          const { content: qaRaw, outputTokens: qaTokens } =
            await callOpenRouter(
              getQaPrompt(),
              `Review this HTML website:\n\n${finalHtml}`,
              1000,
            );
          totalOutputTokens += qaTokens;

          const qaCleaned = stripFences(qaRaw);
          let qaReport: any;

          try {
            qaReport = JSON.parse(qaCleaned);
          } catch {
            // QA failed to parse — treat as passed and move on
            console.warn("QA report parse failed, skipping");
            break;
          }

          push("QA_REPORT", {
            score: qaReport.score,
            passed: qaReport.passed,
            issueCount: qaReport.criticalIssues?.length ?? 0,
            message: qaReport.passed
              ? `Quality score: ${qaReport.score}/100. All checks passed!`
              : `Found ${qaReport.criticalIssues?.length} issue(s). Sending back to Developer for fixes...`,
          });

          if (qaReport.passed || qaReport.score >= 70) {
            // Good enough — ship it
            break;
          }

          qaAttempts++;

          if (qaAttempts < MAX_QA_ATTEMPTS) {
            // Send back to Developer with the issues list
            push("DEVELOPER_FIX", {
              message: `Developer is fixing ${qaReport.criticalIssues?.length} issue(s)...`,
            });

            const fixMessage = `
The following HTML has quality issues that need to be fixed:

ISSUES TO FIX:
${qaReport.criticalIssues?.map((issue: any) => `- ${issue.type}: ${issue.description}\n  FIX: ${issue.fix}`).join("\n")}

Original HTML to fix:
${finalHtml}

Return the complete fixed HTML document. Return ONLY raw HTML, no explanation.`;
            const { content: fixedHtml, outputTokens: fixedTokens } =
              await callOpenRouter(
                getDeveloperPrompt(),
                fixMessage,
                8000,
                DEVELOPER_MODEL, // use same model for fixes
              );
            totalOutputTokens += fixedTokens;

            const fixedCleaned = stripFences(fixedHtml);
            if (
              fixedCleaned.includes("<html") ||
              fixedCleaned.includes("<!DOCTYPE")
            ) {
              finalHtml = fixedCleaned;
            }
          }
        }

        // ════════════════════════════════
        // DONE — Send final HTML
        // ════════════════════════════════
        // Final credit calculation including all agents
        totalCreditsToDeduct = calculateCredits(
          totalOutputTokens,
          DEVELOPER_MODEL,
        );

        push("COMPLETE", {
          message: `Your website is ready!`,
          html: finalHtml,
          brandName: architectPlan.brandName,
          modelUsed: DEVELOPER_MODEL,
          creditsUsed: totalCreditsToDeduct,
        });

        await deductCredits(userId, totalCreditsToDeduct);
        console.log(
          `[Credits] Deducted ${totalCreditsToDeduct} credits for ${DEVELOPER_MODEL} (${totalOutputTokens} total tokens)`,
        );
      } catch (err: any) {
        console.error("Deep dive pipeline error:", err);
        push("ERROR", {
          message: "Something went wrong during generation. Please try again.",
        });
      } finally {
        closeStream();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
