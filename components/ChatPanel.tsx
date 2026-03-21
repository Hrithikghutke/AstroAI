"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  LoaderCircle,
  RotateCcw,
  CheckCircle,
  XCircle,
  Zap,
  Telescope,
  Eye,
  ChevronDown,
  Square,
} from "lucide-react";
import html2canvas from "html2canvas";
import { normalizeLayout } from "@/lib/normalizeLayout";
import { rateGeneration, updateRating } from "@/lib/firestore";
import { THEME_STYLES, getThemeLabel } from "@/lib/themeConfig";
import { ThemeStyle } from "@/types/layout";
import { useCredits } from "@/context/CreditsContext";
import { useAuth } from "@clerk/nextjs";
import Logo from "@/assets/logo.svg";
import { DEEP_DIVE_MODELS, CLAUDE_LOGO_SVG } from "@/lib/modelConfig";

type GenerationMode = "fast" | "deep";

// ── Agent pipeline step state ──
type AgentStatus = "idle" | "running" | "done" | "error";

interface AgentStep {
  id: string;
  label: string;
  status: AgentStatus;
  message?: string;
  detail?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isGenerating?: boolean;
  agentSteps?: AgentStep[];
  thumbnail?: string | null; // base64 screenshot shown in chat bubble
}

const THEME_DESCRIPTIONS: Record<ThemeStyle, string> = {
  minimal: "Clean & spacious",
  bold: "High contrast & punchy",
  glassmorphism: "Frosted glass effects",
  elegant: "Refined & sophisticated",
  corporate: "Professional & formal",
};

const SUGGESTIONS = [
  "Modern gym website with pricing plans",
  "SaaS landing page for project management",
  "Restaurant website with elegant dark theme",
  "Portfolio site for a photographer",
  "Tech startup with glassmorphism style",
];

// ── Agent step progress UI ──
function AgentStepRow({ step }: { step: AgentStep }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="shrink-0 mt-0.5">
        {step.status === "idle" && (
          <div className="w-4 h-4 rounded-full border border-neutral-700" />
        )}
        {step.status === "running" && (
          <LoaderCircle className="w-4 h-4 text-pink-400 animate-spin" />
        )}
        {step.status === "done" && (
          <CheckCircle className="w-4 h-4 text-green-400" />
        )}
        {step.status === "error" && (
          <XCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span
          className="text-xs font-semibold"
          style={{
            color:
              step.status === "idle"
                ? "#404040"
                : step.status === "running"
                  ? "#f9a8d4"
                  : step.status === "done"
                    ? "#86efac"
                    : "#fca5a5",
          }}
        >
          {step.label}
        </span>
        {step.message && (
          <span className="text-xs text-neutral-500 leading-relaxed">
            {step.message}
          </span>
        )}
        {step.detail && (
          <span className="text-xs text-neutral-600 italic">{step.detail}</span>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({
  setLayout,
  setDeepHtml,
  onStreamCode,
  onGeneratingChange,
  initialLayout,
  initialPrompt,
  initialMode,
  initialModel,
  onShowPreview,
  hasLayout,
  onNewChat,
  restoredDeepHtml,
}: {
  setLayout: (layout: any, prompt?: string) => void;
  setDeepHtml?: (html: string, brandName?: string) => void;
  onStreamCode?: (code: string) => void;
  onGeneratingChange?: (generating: boolean) => void;
  initialLayout?: any;
  initialPrompt?: string;
  initialMode?: GenerationMode;
  initialModel?: string;
  onShowPreview?: () => void;
  hasLayout?: boolean;
  onNewChat?: () => void;
  restoredDeepHtml?: string | null;
}) {
  const [mode, setMode] = useState<GenerationMode>(initialMode ?? "fast");
  const [selectedModel, setSelectedModel] = useState(
    initialModel ?? "anthropic/claude-haiku-4.5",
  );
  const [showModelPicker, setShowModelPicker] = useState(false);

  const MODELS = DEEP_DIVE_MODELS;
  const activeModel =
    MODELS.find((m) => m.model === selectedModel) ?? MODELS[0];
  const [messages, setMessages] = useState<Message[]>(() => {
    // Restored from dashboard — show continuation message
    if (restoredDeepHtml && initialPrompt) {
      return [
        {
          id: "initial-user",
          role: "user" as const,
          content: initialPrompt,
        },
        {
          id: "initial-response",
          role: "assistant" as const,
          content: `Welcome back! Your website is loaded in the preview.\n\nDescribe any changes you want — I'll regenerate it with your updates.`,
        },
      ];
    }
    if (initialLayout && initialPrompt) {
      return [
        {
          id: "initial-user",
          role: "user" as const,
          content: initialPrompt,
        },
        {
          id: "initial-response",
          role: "assistant" as const,
          content: `Welcome back! Your **${getThemeLabel(initialLayout.themeStyle ?? "corporate")}** website for **${initialLayout.branding?.logoText || "your brand"}** is loaded.\n\nDescribe changes you want or generate something completely new!`,
        },
      ];
    }
    return [
      {
        id: "welcome",
        role: "assistant" as const,
        content:
          initialMode === "deep"
            ? "Hi! I'm CrawlCube AI. I'm ready to build your website using the full agent pipeline."
            : "Hi! I'm CrawlCube AI. Describe the website you want to build and I'll generate it instantly.",
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeStyle>("corporate");
  const [showThemes, setShowThemes] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { deductCredit, refreshCredits } = useCredits();
  const [currentLayout, setCurrentLayout] = useState<any>(
    initialLayout ?? null,
  );
  const hasAutoStarted = useRef(false);
  // Hash-like key — length + first 40 chars makes collisions extremely unlikely
  const autoStartKey = initialPrompt
    ? `cc_as_${initialPrompt.length}_${initialPrompt.slice(0, 40).replace(/\s+/g, "_")}`
    : null;
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { userId } = useAuth();
  const [fixLoading, setFixLoading] = useState(false);
  const [ratingState, setRatingState] = useState<{
    prompt: string;
    html: string;
    model: string;
    submitted: boolean;
    rating: "positive" | "negative" | null;
    showFeedback: boolean;
    feedbackItems: string[];
    feedbackText: string;
    docId: string | null;
    submittedFeedback: string[]; // stored after submit for fix button
  } | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto-start Deep Dive if navigated from landing page ──

  const initialPromptRef = useRef(initialPrompt);
  const initialModeRef = useRef(initialMode);
  useEffect(() => {
    initialPromptRef.current = initialPrompt;
    initialModeRef.current = initialMode;
  });

  useEffect(() => {
    if (
      initialModeRef.current === "deep" &&
      initialPromptRef.current &&
      !initialLayout &&
      !restoredDeepHtml &&
      !hasAutoStarted.current
    ) {
      hasAutoStarted.current = true;
      handleDeepDive(initialPromptRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, initialMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // ════════════════════════════════
  // FAST MODE generation
  // ════════════════════════════════
  const handleFastGenerate = async (promptOverride?: string) => {
    const prompt = promptOverride ?? input.trim();
    if (!prompt || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
    };
    const thinkingMessage: Message = {
      id: Date.now().toString() + "-thinking",
      role: "assistant",
      content: "",
      isGenerating: true,
    };

    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setInput("");
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    deductCredit();
    onGeneratingChange?.(true);
    onStreamCode?.("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          themeStyle: selectedTheme,
          currentLayout: currentLayout ?? null,
        }),
      });

      const data = await res.json();
      if (res.status === 402) {
        const errData = await res.json();
        throw new Error(errData.message ?? "Not enough credits.");
      }
      if (!res.ok || !data.layout) throw new Error("Generation failed");

      const normalized = normalizeLayout(data.layout);
      normalized.themeStyle = selectedTheme;
      setCurrentLayout(normalized);
      setLayout(normalized, prompt);
      await refreshCredits();

      // Typewriter effect — feeds JSON into Code tab character by character
      const jsonStr = JSON.stringify(normalized, null, 2);
      let charIdx = 0;
      const typeNext = () => {
        charIdx += Math.floor(Math.random() * 10) + 6; // 6-16 chars per tick
        if (charIdx >= jsonStr.length) {
          onStreamCode?.(jsonStr);
          onGeneratingChange?.(false); // unlock Preview tab
          return;
        }
        onStreamCode?.(jsonStr.slice(0, charIdx));
        typewriterRef.current = setTimeout(typeNext, 16);
      };
      typewriterRef.current = setTimeout(typeNext, 50);

      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? {
                ...m,
                isGenerating: false,
                content: `Done! I've generated a **${getThemeLabel(selectedTheme)}** style website for **${normalized.branding?.logoText || "your brand"}**. It's now showing in the preview.\n\nWant to tweak anything?`,
              }
            : m,
        ),
      );
    } catch (err: any) {
      onGeneratingChange?.(false);
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
      await refreshCredits();
      const errorMsg =
        err.message === "NO_CREDITS"
          ? "You're out of credits. Purchase more to keep building!"
          : "Something went wrong. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? { ...m, isGenerating: false, content: `❌ ${errorMsg}` }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════
  // DEEP DIVE MODE generation
  // ════════════════════════════════
  const handleDeepDive = async (promptOverride?: string, fixes?: string[]) => {
    const prompt = promptOverride ?? input.trim();
    if (!prompt || loading) return;

    // Initial agent steps — all idle
    const initialSteps: AgentStep[] = [
      {
        id: "architect",
        label: "🏗️  Crawl Architect is designing your website.",
        status: "idle",
      },
      {
        id: "developer",
        label: "⌨️  Crawl Developer is developing your website.",
        status: "idle",
      },
      {
        id: "qa",
        label: "🔍  Crawl QA is testing your website for any bug.",
        status: "idle",
      },
      {
        id: "visual-qa",
        label:
          "👁️  Crawl Visual QA is scanning your website for visual issues.",
        status: "idle",
      },
    ];

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
    };
    const agentMessage: Message = {
      id: Date.now().toString() + "-agents",
      role: "assistant",
      content: "",
      isGenerating: true,
      agentSteps: initialSteps,
    };

    setMessages((prev) => [...prev, userMessage, agentMessage]);
    setInput("");
    setLoading(true);
    onGeneratingChange?.(true);
    onStreamCode?.("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Helper to update a specific agent step in the message
    const updateStep = (
      stepId: string,
      status: AgentStatus,
      message?: string,
      detail?: string,
    ) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMessage.id
            ? {
                ...m,
                agentSteps: m.agentSteps?.map((s) =>
                  s.id === stepId ? { ...s, status, message, detail } : s,
                ),
              }
            : m,
        ),
      );
    };

    // Create a new AbortController for this generation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Warn user if generation takes too long (likely timeout approaching)
    const timeoutWarning = setTimeout(() => {
      if (loading) {
        updateStep(
          "developer",
          "running",
          "Still working... Opus takes longer for complex sites. If this hangs, try Sonnet instead.",
        );
      }
    }, 50000); // warn at 50 seconds

    try {
      const res = await fetch("/api/generate-deep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-generation-id": Date.now().toString(),
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          fixes: fixes ?? [],
        }),
        signal: abortController.signal,
      });

      if (res.status === 402) {
        const errData = await res.json();
        throw new Error(errData.message ?? "Not enough credits.");
      }
      if (!res.ok) throw new Error("Pipeline failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

      let buffer = "";

      let receivedComplete = false;
      let receivedError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Only show timeout message if:
          // 1. We never got COMPLETE, AND
          // 2. We never got an ERROR event (ERROR already showed its own message)
          if (!receivedComplete && !receivedError) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMessage.id
                  ? {
                      ...m,
                      isGenerating: false,
                      content: `⚠️ Generation completed on the server but the response timed out before reaching your browser.\n\nTry regenerating with **Sonnet** instead — it completes in 25-35 seconds reliably.`,
                      agentSteps: m.agentSteps?.map((s) =>
                        s.status === "running"
                          ? {
                              ...s,
                              status: "error" as AgentStatus,
                              message: "Connection timed out.",
                            }
                          : s,
                      ),
                    }
                  : m,
              ),
            );
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          let event: any;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          // ── Handle each event type ──
          switch (event.event) {
            case "ARCHITECT_START":
              updateStep("architect", "running", event.message);
              break;

            case "ARCHITECT_DONE":
              updateStep(
                "architect",
                "done",
                event.message,
                event.plan?.overallStyle,
              );
              break;

            case "DEVELOPER_START":
              // Show estimated credit range based on model
              const estimates: Record<string, string> = {
                "anthropic/claude-haiku-4.5": "~5 credits",
                "anthropic/claude-sonnet-4.6": "~20-30 credits",
                "anthropic/claude-opus-4": "~300-500 credits",
              };
              const estimate = estimates[selectedModel] ?? "variable";
              updateStep(
                "developer",
                "running",
                `${event.message} (estimated ${estimate})`,
              );
              break;
            case "DEVELOPER_DONE":
              updateStep("developer", "done", event.message);
              break;

            case "HTML_CHUNK":
              // Live streaming — feed into Code tab
              onStreamCode?.(event.chunk);
              break;

            case "HTML_PREVIEW":
              // Show HTML in preview immediately — don't wait for QA
              setDeepHtml?.(event.html, event.brandName);
              updateStep(
                "developer",
                "done",
                "Code complete! Showing preview...",
              );
              break;

            case "DEVELOPER_FIX":
              updateStep("developer", "running", event.message);
              break;

            case "QA_START":
              updateStep("qa", "running", event.message);
              break;

            case "QA_REPORT":
              updateStep(
                "qa",
                event.passed ? "done" : "running",
                event.message,
              );
              break;

            case "COMPLETE":
              receivedComplete = true;
              updateStep("qa", "done", "All checks passed!");
              onStreamCode?.(event.html); // show final HTML in code tab
              onGeneratingChange?.(false); // unlock Preview tab

              setDeepHtml?.(event.html, event.brandName);

              const finalHtml = await runVisualQA(
                event.html,
                agentMessage.id,
                updateStep,
              );

              if (finalHtml !== event.html) {
                setDeepHtml?.(finalHtml, event.brandName);
              }

              const thumb = await captureScreenshot(finalHtml);
              setRatingState({
                prompt,
                html: finalHtml,
                model: selectedModel,
                submitted: false,
                rating: null,
                showFeedback: false,
                feedbackItems: [],
                feedbackText: "",
                docId: null,
                submittedFeedback: [],
              });

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMessage.id
                    ? {
                        ...m,
                        isGenerating: false,
                        content: `Your **${event.brandName}** website is ready! It's showing in the preview.\n\n${event.creditsUsed ? `**${event.creditsUsed} credits** used for this generation.` : ""}\n\nDescribe changes and I'll rebuild it for you. modal used was **${activeModel.label}**.`,
                        thumbnail: thumb,
                      }
                    : m,
                ),
              );

              await refreshCredits();
              if (autoStartKey) sessionStorage.removeItem(autoStartKey);
              break;

            case "ERROR":
              receivedError = true;
              onGeneratingChange?.(false);
              updateStep("architect", "error", event.message);
              updateStep("developer", "error");
              updateStep("qa", "error");
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMessage.id
                    ? {
                        ...m,
                        isGenerating: false,
                        content: `❌ ${event.message}`,
                      }
                    : m,
                ),
              );
              await refreshCredits();
              if (autoStartKey) sessionStorage.removeItem(autoStartKey);
              break;
          }
        }
      }
    } catch (err: any) {
      // Ignore abort errors — handleStop already updated the UI
      if (err.name === "AbortError") return;

      await refreshCredits();
      // NO_CREDITS message comes directly from the server with exact counts
      const errorMsg = err.message.startsWith("Not enough")
        ? `💳 ${err.message}`
        : "Something went wrong. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMessage.id
            ? { ...m, isGenerating: false, content: `❌ ${errorMsg}` }
            : m,
        ),
      );
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      clearTimeout(timeoutWarning);
    }
  };

  const handleGenerate = (promptOverride?: string) => {
    if (mode === "deep") {
      handleDeepDive(promptOverride);
    } else {
      handleFastGenerate(promptOverride);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant" as const,
        content:
          "Hi! I'm CrawlCube. Describe the website you want to build and I'll generate it instantly.",
      },
    ]);
    setCurrentLayout(null);
    setLayout(null);
    onNewChat?.();
  };

  // ── Capture screenshot of HTML string using a hidden iframe + html2canvas ──
  // Capture a single screenshot from an already-loaded iframe document
  const captureIframeDoc = async (
    doc: Document,
    width: number,
    fullPage: boolean,
  ): Promise<string | null> => {
    try {
      const scrollHeight = doc.documentElement.scrollHeight;
      // Cap full page height at 4000px — beyond that adds cost with no QA benefit
      const captureHeight = fullPage
        ? Math.min(scrollHeight, 4000)
        : Math.min(scrollHeight, 900);

      const canvas = await html2canvas(doc.body, {
        width,
        height: captureHeight,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: width,
        windowHeight: captureHeight,
        scrollX: 0,
        scrollY: 0,
      });

      // Scale down to max 800px wide for smaller base64 payload
      const MAX_WIDTH = 800;
      const scale = Math.min(1, MAX_WIDTH / canvas.width);
      const scaledWidth = Math.floor(canvas.width * scale);
      const scaledHeight = Math.floor(canvas.height * scale);

      const scaled = document.createElement("canvas");
      scaled.width = scaledWidth;
      scaled.height = scaledHeight;
      const ctx = scaled.getContext("2d");
      if (!ctx) return canvas.toDataURL("image/jpeg", 0.7);

      ctx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);

      // JPEG at 70% quality — much smaller than PNG, still readable by vision model
      return scaled.toDataURL("image/jpeg", 0.7);
    } catch {
      return null;
    }
  };

  // Load HTML into an iframe at a given width, wait for render, return doc
  const loadIframe = (
    html: string,
    width: number,
  ): Promise<{ doc: Document; cleanup: () => void } | null> => {
    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;height:900px;opacity:0;pointer-events:none;border:none;`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      const cleanup = () => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 15000);

      iframe.onload = async () => {
        clearTimeout(timeout);
        await new Promise((r) => setTimeout(r, 4000)); // wait for fonts + images
        const doc = iframe.contentDocument;
        if (!doc?.body) {
          cleanup();
          resolve(null);
          return;
        }
        resolve({ doc, cleanup });
      };

      iframe.onerror = () => {
        clearTimeout(timeout);
        cleanup();
        resolve(null);
      };
      document.body.appendChild(iframe);
      iframe.src = url;
    });
  };

  // Main screenshot function — captures desktop + mobile, full page
  const captureScreenshot = async (html: string): Promise<string | null> => {
    // We return only the desktop viewport screenshot for the chat thumbnail
    // but runVisualQA uses captureAllScreenshots for thorough review
    const result = await loadIframe(html, 1280);
    if (!result) return null;
    const { doc, cleanup } = result;
    const screenshot = await captureIframeDoc(doc, 1280, false);
    cleanup();
    return screenshot;
  };

  // Full QA screenshots — desktop full page + mobile viewport + mobile full page
  const captureAllScreenshots = async (
    html: string,
  ): Promise<{
    desktopFull: string | null;
    mobileViewport: string | null;
    mobileFull: string | null;
  }> => {
    // Desktop — full page
    const desktopResult = await loadIframe(html, 1280);
    let desktopFull: string | null = null;
    if (desktopResult) {
      desktopFull = await captureIframeDoc(desktopResult.doc, 1280, true);
      desktopResult.cleanup();
    }

    // Mobile — viewport only (full page mobile adds minimal QA value)
    const mobileResult = await loadIframe(html, 390);
    let mobileViewport: string | null = null;
    if (mobileResult) {
      mobileViewport = await captureIframeDoc(mobileResult.doc, 390, false);
      mobileResult.cleanup();
    }

    return { desktopFull, mobileViewport, mobileFull: null };
  };

  // ── Run visual QA on generated HTML ──
  const runVisualQA = async (
    html: string,
    agentMessageId: string,
    updateStep: (
      id: string,
      status: AgentStatus,
      message?: string,
      detail?: string,
    ) => void,
  ): Promise<string> => {
    updateStep(
      "visual-qa",
      "running",
      "Capturing desktop + mobile screenshots...",
    );

    const screenshots = await captureAllScreenshots(html);
    const hasAnyScreenshot =
      screenshots.desktopFull || screenshots.mobileViewport;

    if (!hasAnyScreenshot) {
      updateStep(
        "visual-qa",
        "done",
        "Visual review skipped (screenshot unavailable)",
      );
      return html;
    }

    try {
      updateStep(
        "visual-qa",
        "running",
        "Analyzing desktop and mobile layouts...",
      );

      const qaRes = await fetch("/api/visual-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desktopImage: screenshots.desktopFull,
          mobileImage: screenshots.mobileViewport,
          // html intentionally excluded — vision model reviews images only
          // html is still passed to /api/fix-html separately
        }),
      });

      const qaReport = await qaRes.json();

      if (qaReport.passed || !qaReport.issues?.length) {
        updateStep(
          "visual-qa",
          "done",
          "Layout looks great! No visual issues found.",
        );
        if (screenshots.desktopFull) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMessageId
                ? { ...m, thumbnail: screenshots.desktopFull }
                : m,
            ),
          );
        }
        return html;
      }

      // Issues found — send to fix
      updateStep(
        "visual-qa",
        "running",
        `Found ${qaReport.issues.length} layout issue(s). Fixing...`,
        qaReport.issues.slice(0, 2).join(" · "),
      );

      const fixRes = await fetch("/api/fix-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, issues: qaReport.issues }),
      });

      const fixData = await fixRes.json();

      if (fixData.html) {
        updateStep(
          "visual-qa",
          "done",
          `Fixed ${qaReport.issues.length} layout issue(s) ✓`,
        );
        // Show before/after screenshots in chat
        if (screenshots.desktopFull) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMessageId
                ? { ...m, thumbnail: screenshots.desktopFull }
                : m,
            ),
          );
        }
        return fixData.html;
      } else {
        updateStep("visual-qa", "done", "Fix attempted — showing best result.");
        return html;
      }
    } catch {
      updateStep("visual-qa", "done", "Visual review completed.");
      return html;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear the auto-start lock so user can retry from landing page
    if (autoStartKey) sessionStorage.removeItem(autoStartKey);

    setLoading(false);

    // Mark any in-progress agent message as stopped
    setMessages((prev) =>
      prev.map((m) =>
        m.isGenerating
          ? {
              ...m,
              isGenerating: false,
              content: "Generation stopped.",
              agentSteps: m.agentSteps?.map((s) =>
                s.status === "running"
                  ? {
                      ...s,
                      status: "error" as AgentStatus,
                      message: "Stopped by user.",
                    }
                  : s,
              ),
            }
          : m,
      ),
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-neutral-300">
            crawlcube.ai
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasLayout && onShowPreview && (
            <button
              onClick={onShowPreview}
              className="flex md:hidden items-center gap-1.5 text-xs font-medium bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Preview
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            New chat
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      {/* Mode toggle */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-neutral-800 shrink-0">
        <button
          onClick={() => setMode("fast")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          style={{
            background:
              mode === "fast" ? "rgba(168,85,247,0.15)" : "transparent",
            color: mode === "fast" ? "#d8b4fe" : "#525252",
            border: `1px solid ${mode === "fast" ? "#a855f7" : "#2a2a2a"}`,
          }}
        >
          <Zap className="w-3 h-3" />
          Fast · 1 credit
        </button>
        <button
          onClick={() => setMode("deep")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          style={{
            background:
              mode === "deep" ? "rgba(236,72,153,0.15)" : "transparent",
            color: mode === "deep" ? "#f9a8d4" : "#525252",
            border: `1px solid ${mode === "deep" ? "#ec4899" : "#2a2a2a"}`,
          }}
        >
          <Telescope className="w-3 h-3" />
          Deep Dive
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">
                <img
                  src={Logo.src}
                  alt="CrawlCube"
                  className="w-6 h-6 animate-bounce"
                />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-purple-600 text-white rounded-tr-sm"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-sm"
              }`}
            >
              {/* Agent pipeline steps */}
              {message.agentSteps && message.agentSteps.length > 0 && (
                <div className="mb-3 space-y-0.5 border-b border-neutral-800 pb-3">
                  {message.agentSteps.map((step) => (
                    <AgentStepRow key={step.id} step={step} />
                  ))}
                </div>
              )}

              {/* Thumbnail — shown after Deep Dive completes */}
              {message.thumbnail && (
                <div
                  className="mb-3 rounded-lg overflow-hidden border border-neutral-700 cursor-pointer"
                  onClick={() => window.open(message.thumbnail!, "_blank")}
                  title="Click to view full screenshot"
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingBottom: "56.25%",
                    }}
                  >
                    <img
                      src={message.thumbnail}
                      alt="Website preview"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "top",
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-800 border-t border-neutral-700">
                    <Eye className="w-3 h-3 text-pink-400" />
                    <span className="text-[10px] text-neutral-400">
                      Visual QA screenshot · Click to expand
                    </span>
                  </div>
                </div>
              )}

              {/* Message text */}
              {/* Rating UI — shown after Deep Dive completes */}
              {!message.isGenerating &&
                message.content?.includes("website is ready") &&
                ratingState &&
                (() => {
                  const FEEDBACK_OPTIONS = [
                    "Mobile layout broken",
                    "Navbar not working",
                    "Wrong colors/theme",
                    "Missing sections",
                    "HTML incomplete",
                    "Content not relevant",
                    "Poor design quality",
                    "Page routing broken",
                  ];

                  const handlePositive = async () => {
                    setRatingState((r) =>
                      r
                        ? {
                            ...r,
                            rating: "positive",
                            submitted: true,
                            showFeedback: false,
                          }
                        : r,
                    );
                    try {
                      if (ratingState.docId) {
                        // Update existing record
                        await updateRating(ratingState.docId, "positive", []);
                      } else {
                        // First time rating — create record and store doc ID
                        const docId = await rateGeneration(
                          userId!,
                          "positive",
                          ratingState.prompt,
                          ratingState.html,
                          ratingState.model,
                        );
                        setRatingState((r) => (r ? { ...r, docId } : r));
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  };

                  const handleNegative = () => {
                    setRatingState((r) =>
                      r ? { ...r, rating: "negative", showFeedback: true } : r,
                    );
                  };

                  const handleFeedbackSubmit = async () => {
                    const feedback = [
                      ...ratingState.feedbackItems,
                      ...(ratingState.feedbackText.trim()
                        ? [`Custom: ${ratingState.feedbackText.trim()}`]
                        : []),
                    ];
                    setRatingState((r) =>
                      r
                        ? { ...r, submitted: true, submittedFeedback: feedback }
                        : r,
                    );
                    try {
                      if (ratingState.docId) {
                        // Update existing record
                        await updateRating(
                          ratingState.docId,
                          "negative",
                          feedback,
                        );
                      } else {
                        // First time rating — create record and store doc ID
                        const docId = await rateGeneration(
                          userId!,
                          "negative",
                          ratingState.prompt,
                          ratingState.html,
                          ratingState.model,
                          feedback,
                        );
                        setRatingState((r) => (r ? { ...r, docId } : r));
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  };

                  const handleRerate = () => {
                    setRatingState((r) =>
                      r
                        ? {
                            ...r,
                            submitted: false,
                            rating: null,
                            showFeedback: false,
                            feedbackItems: [],
                            feedbackText: "",
                            submittedFeedback: [],
                          }
                        : r,
                    );
                  };

                  const toggleFeedbackItem = (item: string) => {
                    setRatingState((r) =>
                      r
                        ? {
                            ...r,
                            feedbackItems: r.feedbackItems.includes(item)
                              ? r.feedbackItems.filter((i) => i !== item)
                              : [...r.feedbackItems, item],
                          }
                        : r,
                    );
                  };

                  return (
                    <div className="mt-3 pt-3 border-t border-neutral-800">
                      {/* Submitted — positive */}
                      {ratingState.submitted &&
                        ratingState.rating === "positive" && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-600">
                              ✓ Thanks! This helps train our model.
                            </span>
                            <button
                              onClick={handleRerate}
                              className="text-[10px] text-neutral-700 hover:text-neutral-400 transition-colors cursor-pointer underline"
                            >
                              Change rating
                            </button>
                          </div>
                        )}

                      {/* Submitted — negative */}
                      {ratingState.submitted &&
                        ratingState.rating === "negative" && (
                          <div className="space-y-2">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs text-neutral-600">
                                ✓ Feedback saved — we'll fix this.
                              </span>
                              <button
                                onClick={handleRerate}
                                className="text-[10px] text-neutral-700 hover:text-neutral-400 transition-colors cursor-pointer underline"
                              >
                                Change rating
                              </button>
                            </div>
                            {ratingState.submittedFeedback.length > 0 && (
                              <button
                                onClick={async () => {
                                  const fixPrompt = ratingState.prompt;
                                  const fixes = ratingState.submittedFeedback;
                                  const currentHtml = ratingState.html;

                                  setFixLoading(true);

                                  // Try surgical fix first
                                  try {
                                    const res = await fetch("/api/fix-html", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        html: currentHtml,
                                        issues: fixes,
                                      }),
                                    });
                                    const data = await res.json();

                                    if (data.requiresFullRegen) {
                                      // Issues need full rebuild
                                      handleDeepDive(fixPrompt, fixes);
                                    } else if (data.html) {
                                      // Surgical fix succeeded — update preview AND rating state html
                                      setDeepHtml?.(data.html);
                                      setRatingState((r) =>
                                        r
                                          ? {
                                              ...r,
                                              html: data.html,
                                              submittedFeedback: [],
                                              submitted: false,
                                              rating: null,
                                              showFeedback: false,
                                            }
                                          : r,
                                      );
                                    }
                                  } catch {
                                    // Fallback to full regen
                                    setRatingState(null); // clear UI before full regen
                                    handleDeepDive(fixPrompt, fixes);
                                  } finally {
                                    setFixLoading(false);
                                    // Note: ratingState is NOT nulled here — surgical fix
                                    // already reset it via setRatingState({...r, submitted:false})
                                    // Full regen path nulls it above before calling handleDeepDive
                                  }
                                }}
                                disabled={fixLoading}
                                className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
                                style={{
                                  background: "rgba(168,85,247,0.15)",
                                  border: "1px solid rgba(168,85,247,0.35)",
                                  color: "#d8b4fe",
                                }}
                              >
                                {fixLoading ? (
                                  <>
                                    <LoaderCircle className="w-3 h-3 animate-spin" />
                                    Applying fix...
                                  </>
                                ) : (
                                  <>✨ Auto-fix and regenerate</>
                                )}
                              </button>
                            )}
                          </div>
                        )}

                      {/* Not yet submitted — show buttons */}
                      {!ratingState.submitted && !ratingState.showFeedback && (
                        <div className="my-4 mb-5 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-neutral-600">
                            Rate this generation:
                          </span>
                          <button
                            onClick={handlePositive}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
                            style={{
                              background:
                                ratingState.rating === "positive"
                                  ? "rgba(34,197,94,0.25)"
                                  : "rgba(34,197,94,0.12)",
                              border: "1px solid rgba(34,197,94,0.3)",
                              color: "#86efac",
                            }}
                          >
                            👍 Looks great
                          </button>
                          <button
                            onClick={handleNegative}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
                            style={{
                              background: "rgba(239,68,68,0.12)",
                              border: "1px solid rgba(239,68,68,0.3)",
                              color: "#fca5a5",
                            }}
                          >
                            👎 Needs work
                          </button>
                        </div>
                      )}

                      {/* Negative feedback form */}
                      {!ratingState.submitted && ratingState.showFeedback && (
                        <div className="space-y-3">
                          <p className="text-xs text-neutral-400 font-semibold">
                            What went wrong? (select all that apply)
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {FEEDBACK_OPTIONS.map((item) => (
                              <button
                                key={item}
                                onClick={() => toggleFeedbackItem(item)}
                                className="text-[11px] px-2.5 py-1 rounded-full transition-all cursor-pointer"
                                style={{
                                  background:
                                    ratingState.feedbackItems.includes(item)
                                      ? "rgba(239,68,68,0.2)"
                                      : "rgba(255,255,255,0.05)",
                                  border: `1px solid ${ratingState.feedbackItems.includes(item) ? "rgba(239,68,68,0.5)" : "#2a2a2a"}`,
                                  color: ratingState.feedbackItems.includes(
                                    item,
                                  )
                                    ? "#fca5a5"
                                    : "#737373",
                                }}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={ratingState.feedbackText}
                            onChange={(e) =>
                              setRatingState((r) =>
                                r ? { ...r, feedbackText: e.target.value } : r,
                              )
                            }
                            placeholder="Anything else? (optional)"
                            rows={2}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-300 placeholder:text-neutral-600 outline-none resize-none"
                          />
                          <div className="mb-4 flex items-center gap-2">
                            <button
                              onClick={handleFeedbackSubmit}
                              className=" px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
                              style={{
                                background: "rgba(239,68,68,0.2)",
                                border: "1px solid rgba(239,68,68,0.4)",
                                color: "#fca5a5",
                              }}
                            >
                              Submit feedback
                            </button>
                            <button
                              onClick={() =>
                                setRatingState((r) =>
                                  r ? { ...r, showFeedback: false } : r,
                                )
                              }
                              className=" text-xs text-neutral-700 hover:text-neutral-400 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Message text */}
              {message.isGenerating && !message.agentSteps ? (
                <div className="flex items-center gap-2 text-neutral-400">
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating your website...</span>
                </div>
              ) : message.isGenerating && message.agentSteps ? (
                <div className="flex items-center gap-2 text-neutral-500 text-xs">
                  <LoaderCircle className="w-3 h-3 animate-spin" />
                  <span>Working on it...</span>
                </div>
              ) : (
                message.content && (
                  <p className="whitespace-pre-wrap">
                    {message.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                      i % 2 === 1 ? (
                        <strong key={i} className="font-semibold text-white">
                          {part}
                        </strong>
                      ) : (
                        part
                      ),
                    )}
                  </p>
                )
              )}
            </div>
          </div>
        ))}

        {/* Suggestion chips */}
        {messages.length === 1 && (
          <div className="space-y-2 mt-4">
            <p className="text-xs text-neutral-600 text-center">
              Try one of these:
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleGenerate(s)}
                  className="text-left text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 hover:text-neutral-200 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Theme selector — Fast Mode only */}
      {mode === "fast" && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  selectedTheme === "corporate"
                    ? "#3b82f6"
                    : selectedTheme === "minimal"
                      ? "#a3a3a3"
                      : selectedTheme === "bold"
                        ? "#f97316"
                        : selectedTheme === "glassmorphism"
                          ? "#8b5cf6"
                          : "#d4af7a",
              }}
            />
            <span>
              Style:{" "}
              <strong className="text-neutral-300">
                {getThemeLabel(selectedTheme)}
              </strong>
            </span>
            <span className="opacity-50">
              · {THEME_DESCRIPTIONS[selectedTheme]}
            </span>
          </button>
          {showThemes && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {THEME_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setSelectedTheme(style);
                    setShowThemes(false);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer"
                  style={{
                    borderColor:
                      selectedTheme === style ? "#a855f7" : "#2a2a2a",
                    background:
                      selectedTheme === style
                        ? "rgba(168,85,247,0.15)"
                        : "transparent",
                    color: selectedTheme === style ? "#d8b4fe" : "#737373",
                  }}
                >
                  {getThemeLabel(style)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      {/* Input area */}
      <div className="px-4 pb-4">
        <div
          className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl transition-all duration-200 overflow-visible"
          style={{
            borderColor: loading
              ? mode === "deep"
                ? "#ec489944"
                : "#a855f744"
              : undefined,
          }}
        >
          {/* Textarea */}
          <div className="flex items-end gap-2 px-4 pt-3 pb-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "deep"
                  ? "Describe your website for Deep Dive generation..."
                  : "Describe your website..."
              }
              rows={1}
              className="flex-1 bg-transparent text-sm text-neutral-200 placeholder:text-neutral-600 outline-none resize-none max-h-30 scrollbar-none"
            />
          </div>

          {/* Bottom bar — model pill + send button */}
          <div className="flex items-center justify-between px-3 pb-2.5">
            {/* Left: model selector (Deep Dive) or fast mode label */}
            {mode === "deep" ? (
              <div className="relative">
                {selectedModel === "anthropic/claude-opus-4" && !loading && (
                  <div
                    className="mb-2 flex items-start gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{
                      background: "rgba(234,179,8,0.08)",
                      border: "1px solid rgba(234,179,8,0.25)",
                      color: "#fde68a",
                    }}
                  >
                    <span className="shrink-0 mt-0.5">⏳</span>
                    <span>
                      Opus takes <strong>3–5 minutes</strong> and uses{" "}
                      <strong>300–500 credits</strong> for a complete site. For
                      faster results, try{" "}
                      <button
                        onClick={() =>
                          setSelectedModel("anthropic/claude-sonnet-4.6")
                        }
                        className="underline cursor-pointer hover:text-yellow-200 transition-colors"
                      >
                        Sonnet instead
                      </button>
                      .
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: "rgba(236,72,153,0.08)",
                    border: "1px solid rgba(236,72,153,0.25)",
                    color: "#f9a8d4",
                  }}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: activeModel.logo ?? CLAUDE_LOGO_SVG,
                    }}
                    className="shrink-0"
                  />
                  <span>{activeModel.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>

                {/* Dropdown — opens upward */}
                {showModelPicker && (
                  <div
                    className="absolute bottom-full mb-2 left-0 rounded-xl overflow-hidden z-50 min-w-48"
                    style={{
                      background: "#141414",
                      border: "1px solid #2a2a2a",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                    }}
                  >
                    {MODELS.map(({ model, label, sublabel, credits, logo }) => (
                      <button
                        key={model}
                        onClick={() => {
                          setSelectedModel(model);
                          setShowModelPicker(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer hover:bg-white/5"
                        style={{
                          background:
                            selectedModel === model
                              ? "rgba(236,72,153,0.08)"
                              : "transparent",
                        }}
                      >
                        {/* Claude logo */}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: logo ?? CLAUDE_LOGO_SVG,
                          }}
                          className="shrink-0"
                        />

                        {/* Label + sublabel */}
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span
                            className="text-xs font-semibold truncate"
                            style={{
                              color:
                                selectedModel === model ? "#f9a8d4" : "#e5e5e5",
                            }}
                          >
                            {label}
                          </span>
                          <span className="text-[10px] text-neutral-500 truncate">
                            {sublabel}
                          </span>
                          {model === "anthropic/claude-opus-4" && (
                            <span
                              className="text-[10px] mt-0.5"
                              style={{ color: "#fde68a" }}
                            >
                              ⏳ 3–5 min · 300–500 credits
                            </span>
                          )}
                        </div>

                        {/* Credits + checkmark */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{
                              background:
                                selectedModel === model
                                  ? "rgba(236,72,153,0.2)"
                                  : "rgba(255,255,255,0.06)",
                              color:
                                selectedModel === model ? "#f9a8d4" : "#525252",
                            }}
                          >
                            {credits}
                          </span>
                          {selectedModel === model && (
                            <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(168,85,247,0.12)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  color: "#d8b4fe",
                }}
              >
                <Zap className="w-3 h-3" />
                <span>Fast Mode · 1 credit</span>
              </div>
            )}

            {/* Stop button (Deep Dive while loading) or Send button */}
            {mode === "deep" && loading ? (
              <button
                onClick={handleStop}
                className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-xl cursor-pointer transition-all duration-200 text-xs font-semibold"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  color: "#fca5a5",
                }}
              >
                <Square className="w-3 h-3 fill-current" />
                Stop
              </button>
            ) : (
              <button
                onClick={() => handleGenerate()}
                disabled={loading || !input.trim()}
                className="shrink-0 w-8 h-8 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 cursor-pointer"
                style={{ background: mode === "deep" ? "#ec4899" : "#a855f7" }}
              >
                {loading ? (
                  <LoaderCircle className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-neutral-700 mt-1.5 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
