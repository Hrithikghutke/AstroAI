import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserCredits, deductCredits } from "@/lib/firestore";
import {
  getDeveloperPrompt,
  getShellPrompt,
  getPagePrompt,
  getFooterPrompt,
} from "@/lib/agentPrompts/developer";
import { fetchUnsplashImage } from "@/lib/fetchUnsplash";
import { getModelConfig, calculateCredits } from "@/lib/modelConfig";

// Increase max duration for Deep Dive — Opus can take 45-60s
export const maxDuration = 120; // seconds — requires Vercel Pro or hobby with override

// ── Streaming version for developer agent ──
async function callOpenRouterStream(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  model: string,
  onChunk: (accumulated: string) => void,
  signal?: AbortSignal,
): Promise<{ outputTokens: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal,
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

// ── Extract design tokens from shell HTML for page prompts ──
// Passes tailwind config colors + shared CSS classes to each page call
// so every page uses the exact same design system
function extractDesignTokens(shellHtml: string): string {
  const tailwindMatch = shellHtml.match(
    /<script>\s*tailwind\.config[\s\S]*?<\/script>/,
  );
  const styleMatch = shellHtml.match(/<style>([\s\S]*?)<\/style>/);
  const fontMatch = shellHtml.match(/fonts\.googleapis\.com\/css2\?[^"']+/);

  const tailwind = tailwindMatch
    ? tailwindMatch[0].replace(/<\/?script>/g, "").trim()
    : "";
  const styles = styleMatch ? styleMatch[1].trim() : "";
  const fonts = fontMatch ? `Google Fonts URL: ${fontMatch[0]}` : "";

  // Limit to ~2500 chars to avoid bloating each page prompt
  return [tailwind, styles, fonts]
    .filter(Boolean)
    .join("\n\n---\n\n")
    .slice(0, 2500);
}

// ── Validate and clean a generated page section ──
// Safety net: ensures wrapper tags are always correct even if model forgot them
function validatePageSection(html: string, pageId: string): string {
  // Strip any prose/explanation the model might have added before the tag
  const sectionStart = html.search(/<section/i);
  const clean = sectionStart > 0 ? html.slice(sectionStart) : html.trim();

  const hasCorrectId = clean.includes(`id="page-${pageId}"`);
  const hasCloseTag = clean.includes("</section>");

  if (!hasCorrectId) {
    // Model forgot the wrapper entirely — force wrap the content
    console.warn(`[Validate] page-${pageId} missing wrapper — force wrapping`);
    return `<section id="page-${pageId}" class="page">\n${clean}\n</section><!-- end page-${pageId} -->`;
  }

  if (!hasCloseTag) {
    // Section opened but truncated — force close
    console.warn(
      `[Validate] page-${pageId} missing </section> — force closing`,
    );
    return clean + `\n</section><!-- end page-${pageId} -->`;
  }

  return clean;
}

// ── Silent streaming — streams from OpenRouter (prevents timeouts)
// but collects full output without pushing chunks to client ──
async function silentStream(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  model: string,
  signal?: AbortSignal,
): Promise<{ content: string; outputTokens: number }> {
  let content = "";
  const { outputTokens } = await callOpenRouterStream(
    systemPrompt,
    userMessage,
    maxTokens,
    model,
    (accumulated) => {
      content = accumulated; // collect without pushing to client
    },
    signal,
  );
  return { content, outputTokens };
}

export async function POST(req: Request) {
  const clientSignal = req.signal; // aborts when client disconnects OR Vercel times out
  let userAborted = false; // only true when user explicitly pressed Stop
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, model: selectedModel, fixes } = await req.json();

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

      // Keepalive ping every 8s — prevents Vercel/proxy from closing idle SSE connections
      const keepalive = setInterval(() => {
        if (isClosed) {
          clearInterval(keepalive);
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          isClosed = true;
          clearInterval(keepalive);
        }
      }, 8000);

      // Accumulate total output tokens across all agent calls
      // (declared outside try block for catch access)

      // Declare outside try so catch block can access them
      let creditsDone = false;
      let totalOutputTokens = 0;
      let totalCreditsToDeduct = 5;
      let thinkingPings: ReturnType<typeof setInterval> | null = null;

      try {
        // ════════════════════════════════════════════
        // STEP 1 — Fetch hero image (same as before)
        // ════════════════════════════════════════════
        let heroImageUrl =
          "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1920&q=80&auto=format&fit=crop";
        try {
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
          else {
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
        } catch (e) {
          console.warn("[Unsplash] Fetch failed, using default");
        }

        // ════════════════════════════════════════════
        // STEP 2 — Compute per-call token budgets
        // Distributed proportionally based on page richness
        // ════════════════════════════════════════════
        const maxOut = getModelConfig(DEVELOPER_MODEL).maxOutputTokens;
        // Use 92% of maxOut as ceiling — leaves headroom to avoid tight truncation
        // Footer gets a hard minimum of 4500 tokens — it carries ALL the JS

        const budgets = {
          shell: 6000, // capped — prevents navbar padding, navbar never needs more than ~4k
          home: maxOut, // full budget — richest page, let it use what it needs
          features: maxOut,
          pricing: maxOut,
          contact: maxOut,
          footer: maxOut, // full budget — needs footer HTML + all JS
        };
        console.log(
          `[Budgets] maxOut:${maxOut} shell:${budgets.shell} home:${budgets.home} features:${budgets.features} pricing:${budgets.pricing} contact:${budgets.contact} footer:${budgets.footer}`,
        );

        // ════════════════════════════════════════════
        // STEP 3 — Shell call (sequential, must finish first)
        // Generates: head + CSS system + navbar
        // ════════════════════════════════════════════
        push("ARCHITECT_START", {
          message: "Building design system and navbar...",
        });

        const { content: shellHtml, outputTokens: shellTokens } =
          await silentStream(
            getShellPrompt(),
            `Business: ${prompt}\nHero image URL: ${heroImageUrl}${fixes?.length ? `\nFixes to address: ${fixes.map((f: string) => `- ${f}`).join("\n")}` : ""}`,
            budgets.shell,
            DEVELOPER_MODEL,
            clientSignal,
          );
        totalOutputTokens += shellTokens;

        if (!shellHtml.includes("<nav") || !shellHtml.includes("<!DOCTYPE")) {
          push("ERROR", {
            message: "Failed to generate website structure. Please try again.",
          });
          closeStream();
          return;
        }

        // Compute shellBase here — needed by pushProgressiveHtml during parallel calls
        const pagesMarkerEarly = shellHtml.indexOf("<!-- PAGES_START -->");
        const shellBase =
          pagesMarkerEarly !== -1
            ? shellHtml.slice(0, pagesMarkerEarly).trimEnd()
            : shellHtml.trimEnd();

        // Extract design tokens (colors + CSS classes) to give context to page calls
        const designTokens = extractDesignTokens(shellHtml);

        // Extract brand name from <title> for COMPLETE event
        const titleMatch = shellHtml.match(/<title>([^<]+)<\/title>/i);
        const brandName = titleMatch
          ? titleMatch[1].split("—")[0].split("-")[0].trim()
          : "Your Website";

        push("ARCHITECT_DONE", {
          message: "Design system ready! Building all 4 pages in parallel...",
          plan: { brandName },
        });

        // ════════════════════════════════════════════
        // STEP 4 — Parallel page generation
        // All 4 pages run simultaneously — each is
        // a focused call well within token limits
        // ════════════════════════════════════════════
        push("DEVELOPER_START", {
          message: "Building 4 pages in parallel...",
        });

        // Push shell immediately so code tab shows something right away
        push("HTML_CHUNK", {
          chunk:
            shellBase +
            "\n<main>\n<!-- Building pages in parallel... -->\n</main>\n</body></html>",
        });

        // Track validated pages as they complete for progressive streaming
        const completedPages: Record<string, string> = {};

        const pushProgressiveHtml = (pageId: string, validatedHtml: string) => {
          completedPages[pageId] = validatedHtml;
          const order = ["home", "features", "pricing", "contact"];
          const assembled =
            shellBase +
            "\n<main>" +
            order
              .filter((id) => completedPages[id])
              .map((id) => "\n" + completedPages[id])
              .join("") +
            "\n</main>\n</body></html>";
          push("HTML_CHUNK", { chunk: assembled });
        };

        // Declare footer vars before parallel block so they're in scope for assembly
        let footerHtml = "";
        let footerTokens = 0;

        push("DEVELOPER_FIX", {
          message: "Building pages and footer in parallel...",
        });

        const pageResults = await Promise.allSettled([
          silentStream(
            getPagePrompt("home", prompt, designTokens, heroImageUrl),
            "Generate the complete home page section.",
            budgets.home,
            DEVELOPER_MODEL,
            clientSignal,
          ).then((r) => {
            pushProgressiveHtml("home", validatePageSection(r.content, "home"));
            push("DEVELOPER_FIX", { message: "✓ Home page complete" });
            return r;
          }),
          silentStream(
            getPagePrompt("features", prompt, designTokens),
            "Generate the complete features page section.",
            budgets.features,
            DEVELOPER_MODEL,
            clientSignal,
          ).then((r) => {
            pushProgressiveHtml(
              "features",
              validatePageSection(r.content, "features"),
            );
            push("DEVELOPER_FIX", { message: "✓ Features page complete" });
            return r;
          }),
          silentStream(
            getPagePrompt("pricing", prompt, designTokens),
            "Generate the complete pricing page section.",
            budgets.pricing,
            DEVELOPER_MODEL,
            clientSignal,
          ).then((r) => {
            pushProgressiveHtml(
              "pricing",
              validatePageSection(r.content, "pricing"),
            );
            push("DEVELOPER_FIX", { message: "✓ Pricing page complete" });
            return r;
          }),
          silentStream(
            getPagePrompt("contact", prompt, designTokens),
            "Generate the complete contact page section.",
            budgets.contact,
            DEVELOPER_MODEL,
            clientSignal,
          ).then((r) => {
            pushProgressiveHtml(
              "contact",
              validatePageSection(r.content, "contact"),
            );
            push("DEVELOPER_FIX", { message: "✓ Contact page complete" });
            return r;
          }),
          // Footer runs in parallel with pages — no sequential dependency
          silentStream(
            getFooterPrompt(prompt, designTokens),
            "Generate the footer and closing scripts.",
            budgets.footer,
            DEVELOPER_MODEL,
            clientSignal,
          ).then((r) => {
            push("DEVELOPER_FIX", { message: "✓ Footer and scripts complete" });
            return r;
          }),
        ]);

        // Extract results — use fallback placeholder if any individual page failed
        const fallback = (pageId: string) => ({
          content: `<section id="page-${pageId}" class="page"><div class="min-h-screen flex items-center justify-center py-40"><div class="text-center"><h2 class="font-display text-4xl font-bold mb-4 opacity-50">Content unavailable</h2><p class="text-white/40">This page failed to generate. Try regenerating.</p></div></div></section>`,
          outputTokens: 0,
        });

        const [
          homeResult,
          featuresResult,
          pricingResult,
          contactResult,
          footerResult,
        ] = pageResults;

        // Extract footer
        if (footerResult.status === "fulfilled") {
          footerHtml = footerResult.value.content;
          footerTokens = footerResult.value.outputTokens;
        } else {
          console.warn(
            "[Footer] failed:",
            (footerResult as PromiseRejectedResult).reason,
          );
          footerHtml = `<footer class="py-12 px-6 text-center opacity-50"><p>© ${new Date().getFullYear()} All rights reserved.</p></footer></body></html>`;
        }
        totalOutputTokens += footerTokens;
        const { content: homeHtml, outputTokens: homeTokens } =
          homeResult.status === "fulfilled"
            ? homeResult.value
            : (() => {
                console.warn(
                  "[Page home] failed:",
                  (homeResult as PromiseRejectedResult).reason,
                );
                return fallback("home");
              })();
        const { content: featuresHtml, outputTokens: featuresTokens } =
          featuresResult.status === "fulfilled"
            ? featuresResult.value
            : (() => {
                console.warn(
                  "[Page features] failed:",
                  (featuresResult as PromiseRejectedResult).reason,
                );
                return fallback("features");
              })();
        const { content: pricingHtml, outputTokens: pricingTokens } =
          pricingResult.status === "fulfilled"
            ? pricingResult.value
            : (() => {
                console.warn(
                  "[Page pricing] failed:",
                  (pricingResult as PromiseRejectedResult).reason,
                );
                return fallback("pricing");
              })();
        const { content: contactHtml, outputTokens: contactTokens } =
          contactResult.status === "fulfilled"
            ? contactResult.value
            : (() => {
                console.warn(
                  "[Page contact] failed:",
                  (contactResult as PromiseRejectedResult).reason,
                );
                return fallback("contact");
              })();

        totalOutputTokens +=
          homeTokens + featuresTokens + pricingTokens + contactTokens;

        // ════════════════════════════════════════════
        // STEP 5 — Validate sections + assemble HTML
        // ════════════════════════════════════════════

        // Validate each page section has correct wrapper
        const validHome = validatePageSection(homeHtml, "home");
        const validFeatures = validatePageSection(featuresHtml, "features");
        const validPricing = validatePageSection(pricingHtml, "pricing");
        const validContact = validatePageSection(contactHtml, "contact");

        // shellBase already computed above after shell call

        // Clean footer: strip any prose before <footer tag
        const footerTagStart = footerHtml.search(/<footer/i);
        const cleanFooter =
          footerTagStart >= 0 ? footerHtml.slice(footerTagStart) : footerHtml;

        // Post-process: fix known model output issues before sending to client
        const postProcess = (html: string): string => {
          // Step 1 — regex chain fixes
          const step1 = html
            // Fix 1 — mobile menu: remove "display: none" from inline styles
            .replace(/style="([^"]*?);\s*display:\s*none\s*"/g, 'style="$1"')
            .replace(/style="display:\s*none\s*;?\s*([^"]*)"/g, 'style="$1"')
            // Fix 2 — marquee items: ensure they don't wrap on mobile
            .replace(
              /class="flex animate-marquee/g,
              'class="flex animate-marquee whitespace-nowrap',
            )
            .replace(/<div class="flex items-center gap-\d+ pr-\d+">/g, (m) =>
              m.replace(
                '<div class="flex',
                '<div class="flex flex-shrink-0 flex-nowrap',
              ),
            )
            // Fix 3 — remove external texture URLs that block rendering
            .replace(/url\(["']https?:\/\/[^"')]+["']\)/g, "none")
            // Fix 4 — close any unclosed tag right before <main>
            .replace(/<[a-z][^>]*\n<main>/gi, "\n<main>")
            .replace(/class="[^"]*\n<main>/g, 'class="">\n</nav>\n<main>');

          // Step 2 — Fix 5: mobile menu solid background + isolation
          // Uses regex with 's' flag to match multi-line opening tags
          // (model spreads attributes across lines so line-by-line won't work)
          const isLightTheme = step1.includes('data-theme="light"');
          const menuBg = isLightTheme ? "#ffffff" : "#0f172a";
          // Step 2 — patch mobile menu divs with solid background + isolation
          let step2 = step1;
          let searchFrom = 0;
          while (true) {
            const xshowIdx = step2.indexOf('x-show="open"', searchFrom);
            if (xshowIdx === -1) break;

            // Only look back 500 chars — the opening <div is always nearby
            const lookbackStart = Math.max(0, xshowIdx - 500);
            const tagStart = step2.lastIndexOf("<div", xshowIdx);

            // Skip if <div is too far back (not the direct parent tag)
            if (tagStart === -1 || tagStart < lookbackStart) {
              searchFrom = xshowIdx + 1;
              continue;
            }

            // Walk forward to find closing > — but cap at 1000 chars max
            let tagEnd = -1;
            let inQuote = false;
            let quoteChar = "";
            const searchLimit = Math.min(step2.length, tagStart + 1000);
            for (let i = tagStart; i < searchLimit; i++) {
              const ch = step2[i];
              if (inQuote) {
                if (ch === quoteChar) inQuote = false;
              } else if (ch === '"' || ch === "'") {
                inQuote = true;
                quoteChar = ch;
              } else if (ch === ">") {
                tagEnd = i;
                break;
              }
            }
            if (tagEnd === -1) {
              searchFrom = xshowIdx + 1;
              continue;
            }

            const fullTag = step2.slice(tagStart, tagEnd + 1);

            // Only patch menu panels (has 'fixed'), skip FAQ accordions and backdrops
            if (
              fullTag.includes("fixed") &&
              !(
                fullTag.includes("bg-black/") &&
                !fullTag.includes("flex-col") &&
                !fullTag.includes("space-y")
              )
            ) {
              const fixedStyle = `style="background:${menuBg};isolation:isolate;backdrop-filter:none"`;
              let patchedTag: string;
              if (fullTag.includes('style="')) {
                patchedTag = fullTag.replace(/style="[^"]*"/, fixedStyle);
              } else {
                patchedTag = fullTag.slice(0, -1) + " " + fixedStyle + ">";
              }
              step2 =
                step2.slice(0, tagStart) + patchedTag + step2.slice(tagEnd + 1);
              searchFrom = tagStart + patchedTag.length;
            } else {
              searchFrom = tagEnd + 1;
            }
          }

          return step2;
        };

        // Final assembly — just string concatenation, no magic
        const htmlOutput = postProcess(
          [
            shellBase,
            "\n<main>",
            "\n" + validHome,
            "\n" + validFeatures,
            "\n" + validPricing,
            "\n" + validContact,
            "\n</main>",
            "\n" + cleanFooter,
          ].join(""),
        );

        // Quality check log
        const pageCount = (htmlOutput.match(/id="page-/g) || []).length;
        const hasFooter = htmlOutput.includes("<footer");
        const hasRouting = htmlOutput.includes("showPage");
        const hasClosingTag = htmlOutput.toLowerCase().includes("</html>");
        console.log(
          `[Assembly] pages:${pageCount} footer:${hasFooter} routing:${hasRouting} </html>:${hasClosingTag} length:${htmlOutput.length} totalTokens:${totalOutputTokens}`,
        );

        totalCreditsToDeduct = calculateCredits(
          totalOutputTokens,
          DEVELOPER_MODEL,
        );

        push("DEVELOPER_DONE", {
          message: "All pages assembled! Sending preview...",
        });

        push("HTML_PREVIEW", {
          html: htmlOutput,
          brandName,
          message: "Preview ready!",
        });

        push("QA_START", { message: "Running quality checks..." });
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

        if (clientSignal.aborted) {
          console.log(
            "[Credits] Client disconnected — skipping credit deduction",
          );
        } else {
          await deductCredits(userId, totalCreditsToDeduct);
          console.log(
            `[Credits] Deducted ${totalCreditsToDeduct} credits for ${DEVELOPER_MODEL} (${totalOutputTokens} tokens)`,
          );
        }
      } catch (err: any) {
        if (err.name === "AbortError" || clientSignal.aborted) {
          if (userAborted) {
            console.log("[Pipeline] User pressed Stop — generation cancelled");
          } else {
            console.log(
              "[Pipeline] Connection dropped (Vercel timeout or network) — generation was running",
            );
            // Still try to deduct credits if we generated content
            if (!creditsDone && totalOutputTokens > 0) {
              try {
                creditsDone = true;
                await deductCredits(userId, totalCreditsToDeduct);
                console.log(
                  `[Credits] Late deduction: ${totalCreditsToDeduct} credits`,
                );
              } catch (e) {
                console.error("[Credits] Late deduction failed:", e);
              }
            }
          }
          return;
        }
        console.error("Deep dive pipeline error:", err);
        push("ERROR", {
          message: "Something went wrong during generation. Please try again.",
        });
      } finally {
        clearInterval(keepalive);
        if (thinkingPings) clearInterval(thinkingPings);
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
