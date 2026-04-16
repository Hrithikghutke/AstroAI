import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserCredits, deductCredits, trackApiUsage } from "@/lib/firestore";
import { getModelConfig, calculateCredits } from "@/lib/modelConfig";
import { getReactArchitectPrompt } from "@/lib/reactAgents/architect";
import { getReactDeveloperPrompt } from "@/lib/reactAgents/developer";

export const maxDuration = 120;

const encoder = new TextEncoder();

const BANNED_FILES = [
  "index.html",
  "index.js",
  "package.json",
  "vite.config",
  "tailwind.config",
  "postcss.config",
  "tsconfig.json",
];



function repairJsx(content: string): string {
  let text = content.trim();
  if (text.startsWith("\`\`\`")) {
    text = text.replace(/^\`\`\`[a-z]*\n/i, "");
  }
  if (text.endsWith("\`\`\`")) {
    text = text.replace(/\n\`\`\`$/i, "");
  }

  // 1. (Removed broken quote heuristics)

  // 2. Close unclosed angle brackets
  const lastOpenAngle = text.lastIndexOf("<");
  const lastCloseAngle = text.lastIndexOf(">");
  if (lastOpenAngle > lastCloseAngle) {
    text += " />";
  }

  // 3. Close unclosed parentheses
  const openParens = (text.match(/\(/g) || []).length;
  const closeParens = (text.match(/\)/g) || []).length;
  if (openParens > closeParens) {
    text += "\n)".repeat(openParens - closeParens);
  }

  // 4. Close unclosed braces
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    text += "\n}".repeat(openBraces - closeBraces);
  }

  return text;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt, model, existingFiles } = await req.json();
  const GENERATION_MODEL = model ?? "anthropic/claude-3.5-sonnet";

  const credits = await getUserCredits(userId);
  const minRequired = getModelConfig(GENERATION_MODEL).minCreditsToStart;
  if (credits < minRequired) {
    return NextResponse.json(
      { error: "NO_CREDITS", message: "Insufficient credits." },
      { status: 402 },
    );
  }

  if (!prompt)
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      try {
        // --- PHASE 1: ARCHITECT ---
        send({
          action: "agent-update",
          step: {
            id: "architect",
            status: "running",
            message: "Planning architecture...",
            label: "Architect",
          },
        });

        const extFilesHint = existingFiles
          ? `\nCURRENT FILES MAP:\n${JSON.stringify(Object.keys(existingFiles))}`
          : "";

        const archRes = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: GENERATION_MODEL,
              max_tokens: 1000,
              temperature: 0.2,
              messages: [
                { role: "system", content: getReactArchitectPrompt() },
                {
                  role: "user",
                  content: `User Prompt: ${prompt}${extFilesHint}`,
                },
              ],
            }),
          },
        );

        if (!archRes.ok) throw new Error("Architect generation failed");
        const archData = await archRes.json();
        const archRaw = archData.choices?.[0]?.message?.content ?? "{}";

        totalInputTokens += archData.usage?.prompt_tokens ?? 0;
        totalOutputTokens += archData.usage?.completion_tokens ?? 0;

        const archResult = JSON.parse(
          archRaw
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim(),
        );
        let filesNeeded: string[] = archResult.files || [];
        const generatedSiteName = archResult.siteName || "React project";

        // Filter out strict root files and dangerous config files to avoid LLM breaking Nodebox Vite environment
        // We also now target ANY root file that the LLM tries to write outside of /src/
        filesNeeded = filesNeeded.filter((f: string) => {
          const clean = f.startsWith("/") ? f : `/${f}`;
          return !BANNED_FILES.some((b) => clean.includes(b));
        });

        // Base scaffolding defaults if entirely new project
        if (!existingFiles) {
          const requiredDefaults = ["/App.js", "/styles.css"];
          requiredDefaults.forEach((df) => {
            if (!filesNeeded.includes(df) && !filesNeeded.includes("/App.jsx")) filesNeeded.unshift(df);
          });
        }

        if (filesNeeded.length === 0) {
          throw new Error("Architect returned no files to modify.");
        }

        send({
          action: "agent-update",
          step: {
            id: "architect",
            status: "done",
            message: `Identified ${filesNeeded.length} file targets.`,
          },
          architectData: {
            brandName: generatedSiteName,
            colors: archResult.colors || {},
            fonts: archResult.fonts || {},
            manifest: archResult.manifest || {}
          }
        });
        send({
          action: "agent-update",
          step: {
            id: "developer",
            status: "running",
            message: `Compiling ${filesNeeded.length} files...`,
            label: "Developer",
          },
        });

        const developerPrompt = getReactDeveloperPrompt({
          theme: archResult.theme,
          colors: archResult.colors,
          fonts: archResult.fonts
        }, JSON.stringify(filesNeeded), JSON.stringify(archResult.manifest || {}));

        // --- PHASE 2: PARALLEL FILE WRITERS ---
        const filePromises = filesNeeded.map(async (filePath: string) => {
          send({
            action: "agent-update",
            step: {
              id: `page-${filePath}`,
              status: "running",
              label: filePath,
            },
          });

          const fileContextMsg = existingFiles
            ? `\nYou must UPDATE ${filePath}. If it exists, integrate seamlessly with repo context. EXTREMELY CRITICAL: RETURN RAW CODE ONLY.`
            : `\nYou must WRITE ${filePath}. EXTREMELY CRITICAL: RETURN RAW CODE ONLY. NO MARKDOWN BLOCK FORMATTING. NO BACKTICKS.`;

          let currentCodeInfo = "";
          if (existingFiles && existingFiles[filePath]) {
            currentCodeInfo = `\n[EXISTING CODE FOR ${filePath}]:\n${existingFiles[filePath]}`;
          }

          const pageRes = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: GENERATION_MODEL,
                max_tokens: 8000,
                temperature: 0.7,
                messages: [
                  { role: "system", content: developerPrompt },
                  {
                    role: "user",
                    content: `MAIN TASK: ${prompt}
CRITICAL: You are ONLY writing ${filePath}.
${currentCodeInfo}${fileContextMsg}`,
                  },
                ],
              }),
            },
          );

          if (!pageRes.ok) throw new Error(`Failed generating ${filePath}`);
          const pageData = await pageRes.json();
          const rawContent = pageData.choices?.[0]?.message?.content || "";

          totalInputTokens += pageData.usage?.prompt_tokens ?? 0;
          totalOutputTokens += pageData.usage?.completion_tokens ?? 0;

          const finalCode = repairJsx(rawContent);

          send({
            action: "agent-update",
            step: { id: `page-${filePath}`, status: "done", label: filePath },
          });
          return { path: filePath, content: finalCode };
        });

        const compiledFilesArray = await Promise.all(filePromises);

        send({
          action: "agent-update",
          step: {
            id: "developer",
            status: "done",
            message: "Compilation complete.",
          },
        });

        // Bill the user
        const creditsUsed = calculateCredits(
          totalOutputTokens,
          GENERATION_MODEL,
        );
        await deductCredits(userId, creditsUsed);
        trackApiUsage(
          GENERATION_MODEL,
          totalOutputTokens,
          totalOutputTokens *
            getModelConfig(GENERATION_MODEL).costPerOutputToken,
          false,
        ).catch(console.warn);

        // Convert the array back to Sandpack format and sanitize paths
        const finalFilesPayload: Record<string, string> = {};

        // Clean existing files (strip out bad root overwrites)
        // Replace your existingFiles cleanup loop:
        if (existingFiles) {
          for (const [k, v] of Object.entries(
            existingFiles as Record<string, string>,
          )) {
            let cleanKey = k.startsWith("/") ? k : `/${k}`;

            // Apply the same /src/ stripping to existing files too
            cleanKey = cleanKey.replace(/^\/src\//, "/");
            if (cleanKey === "/index.css") cleanKey = "/styles.css";
            if (cleanKey.endsWith(".jsx")) cleanKey = cleanKey.replace(/\.jsx$/, ".js");

            if (BANNED_FILES.some((b) => cleanKey.includes(b))) continue;
            finalFilesPayload[cleanKey] = v;
          }
        }

        // Clean newly generated files
        // In the path normalization loop — add this remapping:
        // Replace your entire path normalization loop with this:
        for (const file of compiledFilesArray) {
          let cleanKey = file.path.startsWith("/")
            ? file.path
            : `/${file.path}`;

          // Strip /src/ prefix from ALL paths — the react template is flat, not Vite-style
          // /src/App.jsx          → /App.js
          // /src/index.css        → /styles.css
          // /src/components/X.jsx → /components/X.js
          // /src/hooks/X.js       → /hooks/X.js
          cleanKey = cleanKey.replace(/^\/src\//, "/");

          // Special rename: index.css → styles.css (Sandpack react template convention)
          if (cleanKey === "/index.css") cleanKey = "/styles.css";
          
          // Rename JSX to JS universally to map to Sandpack's CRA-style environment
          if (cleanKey.endsWith(".jsx")) cleanKey = cleanKey.replace(/\.jsx$/, ".js");

          if (BANNED_FILES.some((b) => cleanKey.includes(b))) continue;
          finalFilesPayload[cleanKey] = file.content;
        }

        // Hard-inject bulletproof root files so Sandpack Vite compiler never crashes
        finalFilesPayload["/index.js"] = `import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);`;

        // --- CLOSURE ---
        send({
          action: "generation-complete",
          files: finalFilesPayload,
          siteName: generatedSiteName,
          tokens: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            creditsUsed: creditsUsed,
          },
        });
      } catch (err: any) {
        console.error("SSE Generation Error:", err);
        send({ action: "error", message: err.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
