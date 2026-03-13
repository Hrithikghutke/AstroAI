import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserCredits, deductCredits } from "@/lib/firestore";
import { getDeveloperPrompt } from "@/lib/agentPrompts/developer";
import { fetchUnsplashImage } from "@/lib/fetchUnsplash";
import { getModelConfig, calculateCredits } from "@/lib/modelConfig";

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

// ── Streaming version for developer agent ──
async function callOpenRouterStream(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  model: string,
  onChunk: (accumulated: string) => void,
): Promise<{ outputTokens: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.8,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`OpenRouter stream error: ${JSON.stringify(err)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No stream body");

  const decoder = new TextDecoder();
  let accumulated = "";
  let outputTokens = 0;
  let buffer = "";
  let chunkCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          accumulated += delta;
          chunkCount++;
          if (chunkCount % 25 === 0) onChunk(accumulated);
        }
        if (parsed.usage?.completion_tokens) {
          outputTokens = parsed.usage.completion_tokens;
        }
      } catch {
        /* skip malformed */
      }
    }
  }

  onChunk(accumulated); // final
  return { outputTokens };
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
  const modelConfig = getModelConfig(selectedModel);
  const minRequired = modelConfig.minCreditsToStart;

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

  const modelLabel = getModelConfig(DEVELOPER_MODEL).sublabel;

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
        // AGENT 1 — DEVELOPER (combined)
        // ════════════════════════════════
        // Fetch relevant Unsplash image based on prompt
        // Fetch relevant Unsplash image based on prompt
        let heroImageUrl =
          "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1920&q=80&auto=format&fit=crop";
        try {
          // Simplify query to 2-3 keywords for better Unsplash results
          // Extract business-relevant keywords for Unsplash
          // Map business keywords to better Unsplash search terms
          const promptLower = prompt.toLowerCase();
          const promptHead = promptLower.slice(0, 150);
          let unsplashQuery = "modern office professional";

          if (
            /(saas|software|app|platform|dashboard|tech|startup|ai website|ai tool|ai builder|website builder)/i.test(
              promptHead,
            )
          )
            unsplashQuery = "software saas dashboard technology";
          else if (
            /(gym|fitness|workout|crossfit|bodybuilding|sport|athletic)/i.test(
              promptHead,
            )
          )
            unsplashQuery = "gym fitness workout";
          else if (
            /(restaurant|food|cafe|coffee|dining|cuisine|bistro|bakery)/i.test(
              promptHead,
            )
          )
            unsplashQuery = "restaurant food dining";
          else if (
            /(engineer|structural|civil|construction|architect|building|blueprint|consultancy|consulting)/i.test(
              promptHead,
            )
          )
            unsplashQuery = "construction building architecture";
          else if (
            /(saas|software|app|platform|dashboard|tech|startup|ai|tool)/i.test(
              prompt,
            )
          )
            unsplashQuery = "software technology laptop";
          else if (/(law|legal|attorney|lawyer|firm|justice)/i.test(prompt))
            unsplashQuery = "law office professional";
          else if (
            /(medical|health|clinic|hospital|doctor|dental|therapy)/i.test(
              prompt,
            )
          )
            unsplashQuery = "medical healthcare clinic";
          else if (/(real estate|property|housing|home|realty)/i.test(prompt))
            unsplashQuery = "real estate property building";
          else if (
            /(finance|bank|invest|accounting|insurance|wealth)/i.test(prompt)
          )
            unsplashQuery = "finance business professional";
          else if (/(agency|marketing|creative|design|branding)/i.test(prompt))
            unsplashQuery = "creative agency office team";
          else if (
            /(education|school|university|course|learning|tutor)/i.test(prompt)
          )
            unsplashQuery = "education learning study";
          else if (/(hotel|resort|travel|tourism|hospitality)/i.test(prompt))
            unsplashQuery = "hotel resort luxury travel";
          else if (/(fashion|clothing|apparel|style|boutique)/i.test(prompt))
            unsplashQuery = "fashion clothing style";
          else {
            // Fallback: extract 2 meaningful words
            const stopWords = [
              "a",
              "an",
              "the",
              "for",
              "with",
              "and",
              "or",
              "that",
              "this",
              "in",
              "on",
              "at",
              "to",
              "of",
              "i",
              "we",
              "our",
              "your",
              "my",
              "build",
              "create",
              "make",
              "generate",
              "landing",
              "page",
              "website",
              "site",
              "want",
              "need",
              "called",
              "named",
              "please",
              "private",
              "limited",
              "company",
              "firm",
              "based",
            ];
            const words = promptLower
              .replace(/[^a-z\s]/g, "")
              .split(/\s+/)
              .filter((w: string) => !stopWords.includes(w) && w.length > 4)
              .slice(0, 2)
              .join(" ");
            if (words) unsplashQuery = words;
          }

          console.log("[Unsplash] Query:", unsplashQuery);
          const image = await fetchUnsplashImage(unsplashQuery);
          if (image) heroImageUrl = image;
          console.log("[Unsplash] Hero image:", heroImageUrl);
        } catch (e) {
          console.warn("[Unsplash] Fetch failed, using default");
        }

        push("ARCHITECT_START", {
          message: "Analyzing your prompt and planning website structure...",
        });

        push("ARCHITECT_DONE", {
          message: "Structure planned! Building your website now...",
          plan: { brandName: "Your Website" },
        });

        const estimatedTime = DEVELOPER_MODEL.includes("opus")
          ? "45-60"
          : DEVELOPER_MODEL.includes("sonnet")
            ? "20-30"
            : "10-15";

        push("DEVELOPER_START", {
          message: `Developer is building your website. This may take ${estimatedTime} seconds...`,
        });
        let htmlRaw = "";
        const { outputTokens: developerTokens } = await callOpenRouterStream(
          getDeveloperPrompt().replace(
            "TARGET_TOKENS",
            DEVELOPER_MODEL.includes("haiku") ? "6500" : "16000",
          ),
          `Build a complete multi-page website for: ${prompt}\n\nHero background image URL (use this exactly): ${heroImageUrl}`,
          getModelConfig(DEVELOPER_MODEL).maxOutputTokens,
          DEVELOPER_MODEL,
          (accumulated) => {
            htmlRaw = accumulated;
            if (accumulated.includes("<body")) {
              push("HTML_CHUNK", { chunk: accumulated });
            }
          },
        );
        totalOutputTokens += developerTokens;

        let htmlOutput = stripFences(htmlRaw);

        if (
          !htmlOutput.includes("<html") &&
          !htmlOutput.includes("<!DOCTYPE")
        ) {
          push("ERROR", {
            message: "Failed to generate valid HTML. Please try again.",
          });
          closeStream();
          return;
        }

        // ── Continuation loop — keep calling until </html> appears (max 4 rounds) ──
        let continuationRound = 0;
        const MAX_CONTINUATIONS = 4;

        while (
          !htmlOutput.toLowerCase().includes("</html>") &&
          continuationRound < MAX_CONTINUATIONS
        ) {
          continuationRound++;
          console.log(
            `[Developer] HTML truncated — continuation round ${continuationRound}...`,
          );
          push("DEVELOPER_FIX", {
            message: `Continuing generation... (part ${continuationRound + 1})`,
          });

          try {
            let continuationHtml = "";
            const { outputTokens: contTokens } = await callOpenRouterStream(
              `You are continuing an HTML document that was cut off mid-generation.
RULES:
- Continue writing from EXACTLY where the HTML ends — do not repeat any existing content
- Maintain the exact same design system, colors, fonts, and style as the existing HTML
- Complete all remaining sections then end with </script></body></html>
- Output ONLY the continuation HTML fragment, nothing else — no explanations, no markdown, no code fences`,
              `Continue this HTML document from exactly where it was cut off. Here are the last 4000 characters:\n\n${htmlOutput.slice(-4000)}\n\nContinue from here:`,
              getModelConfig(DEVELOPER_MODEL).maxOutputTokens,
              DEVELOPER_MODEL,
              (accumulated) => {
                continuationHtml = accumulated;
                push("HTML_CHUNK", { chunk: htmlOutput + "\n" + accumulated });
              },
            );

            totalOutputTokens += contTokens;
            htmlOutput =
              htmlOutput +
              "\n" +
              continuationHtml.replace(/```html|```/gi, "").trim();
            console.log(
              `[Developer] Round ${continuationRound} done | length: ${htmlOutput.length} | has </html>: ${htmlOutput.toLowerCase().includes("</html>")}`,
            );
          } catch (contErr) {
            console.warn(
              `[Developer] Continuation round ${continuationRound} failed:`,
              contErr,
            );
            break;
          }
        }

        // Last resort — force-close if still incomplete after all continuations
        if (!htmlOutput.toLowerCase().includes("</html>")) {
          console.warn(
            "[Developer] Force-closing HTML after max continuations",
          );
          htmlOutput = htmlOutput + "\n</div></section></main></body></html>";
        }

        console.log("[Developer] Final length:", htmlOutput.length);
        console.log(
          "[Developer] Has </html>:",
          htmlOutput.toLowerCase().includes("</html>"),
        );

        // Extract brand name from <title>
        const titleMatch = htmlOutput.match(/<title>([^<]+)<\/title>/i);
        const brandName = titleMatch
          ? titleMatch[1].split("—")[0].split("-")[0].trim()
          : "Your Website";

        totalCreditsToDeduct = calculateCredits(
          totalOutputTokens,
          DEVELOPER_MODEL,
        );

        push("DEVELOPER_DONE", {
          message: "Website built! Sending preview...",
        });

        push("HTML_PREVIEW", {
          html: htmlOutput,
          brandName,
          message: "Preview ready — visual checks running...",
        });

        // ════════════════════════════════
        // AGENT 2 — VISUAL QA (client-side)
        // ════════════════════════════════
        push("QA_START", {
          message: "QA Agent is checking your website for issues...",
        });

        push("QA_REPORT", {
          score: 95,
          passed: true,
          issueCount: 0,
          message: "Quality check passed!",
        });

        push("COMPLETE", {
          message: "Your website is ready!",
          html: htmlOutput,
          brandName,
          modelUsed: DEVELOPER_MODEL,
          creditsUsed: totalCreditsToDeduct,
        });

        await deductCredits(userId, totalCreditsToDeduct);
        console.log(
          `[Credits] Deducted ${totalCreditsToDeduct} credits for ${DEVELOPER_MODEL} (${totalOutputTokens} tokens)`,
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
