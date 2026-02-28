"use client";

import { useState, useRef, useEffect } from "react";
import { Send, LoaderCircle, Sparkles, RotateCcw } from "lucide-react";
import { normalizeLayout } from "@/lib/normalizeLayout";
import { THEME_STYLES, getThemeLabel } from "@/lib/themeConfig";
import { ThemeStyle } from "@/types/layout";
import { useCredits } from "@/context/CreditsContext";
import Logo from "@/assets/logo.svg";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isGenerating?: boolean;
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

export default function ChatPanel({
  setLayout,
  initialLayout,
  initialPrompt,
  onShowPreview,
  hasLayout,
  onNewChat,
}: {
  setLayout: (layout: any, prompt?: string) => void;
  initialLayout?: any;
  initialPrompt?: string;
  onShowPreview?: () => void;
  hasLayout?: boolean;
  onNewChat?: () => void; // ← NEW
}) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialLayout && initialPrompt) {
      return [
        // First — the user's original prompt
        {
          id: "initial-user",
          role: "user" as const,
          content: initialPrompt,
        },
        // Second — the AI's response
        {
          id: "initial-response",
          role: "assistant" as const,
          content: `Done! I've generated a **${getThemeLabel(initialLayout.themeStyle ?? "corporate")}** style website for **${initialLayout.branding?.logoText || "your brand"}**. It's showing in the preview.\n\nDescribe changes you want or generate something completely new!`,
        },
      ];
    }
    return [
      {
        id: "welcome",
        role: "assistant" as const,
        content:
          "Hi! I'm Astroweb AI. Describe the website you want to build and I'll generate it instantly.",
      },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeStyle>("corporate");
  const [showThemes, setShowThemes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { deductCredit, refreshCredits } = useCredits();
  const [currentLayout, setCurrentLayout] = useState<any>(
    initialLayout ?? null,
  );

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleGenerate = async (promptOverride?: string) => {
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
    setError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Optimistic deduction — header updates instantly
    deductCredit();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          themeStyle: selectedTheme,
          currentLayout: currentLayout ?? null, // ← send current layout as context
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        throw new Error("NO_CREDITS");
      }
      if (!res.ok || !data.layout) {
        throw new Error("Generation failed");
      }

      const normalized = normalizeLayout(data.layout);

      setCurrentLayout(normalized); // ← keep track of latest layout
      setLayout(normalized, prompt);
      normalized.themeStyle = selectedTheme;
      setLayout(normalized, prompt);

      // Sync real credit value from server
      await refreshCredits();

      setMessages((prev) =>
        prev.map((m) =>
          m.isGenerating
            ? {
                ...m,
                isGenerating: false,
                content: `Done! I've generated a **${getThemeLabel(selectedTheme)}** style website for **${normalized.branding?.logoText || "your brand"}**. It's now showing in the preview.\n\nWant to try a different style or tweak anything?`,
              }
            : m,
        ),
      );
    } catch (err: any) {
      // Reverse optimistic deduction if failed
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
          "Hi! I'm crawlcube. Describe the website you want to build and I'll generate it instantly.",
      },
    ]);
    setCurrentLayout(null);
    setLayout(null);
    setError(null);
    onNewChat?.(); // ← notify BuildPage to clear savedId
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
          {/* Preview button — mobile only, shown when layout exists */}
          {hasLayout && onShowPreview && (
            <button
              onClick={onShowPreview}
              className="flex md:hidden items-center gap-1.5 text-xs font-medium bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Preview
            </button>
          )}

          {/* New chat */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            New chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* AI Avatar */}
            {message.role === "assistant" && (
              <div className="w-7 h-7 rounded-full  flex items-center justify-center shrink-0 mt-0.5">
                {/* <Sparkles className="w-3.5 h-3.5 text-purple-400" /> */}
                <img
                  src={Logo.src}
                  alt="Astro Web logo"
                  className="w-6 h-6 animate-bounce"
                />
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-purple-600 text-white rounded-tr-sm"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-sm"
              }`}
            >
              {message.isGenerating ? (
                <div className="flex items-center gap-2 text-neutral-400">
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating your website...</span>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">
                  {/* Render bold markdown */}
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
              )}
            </div>
          </div>
        ))}

        {/* Suggestion chips — only show when no user messages yet */}
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

      {/* Theme selector */}
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
                  borderColor: selectedTheme === style ? "#a855f7" : "#2a2a2a",
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

      {/* Input area */}
      <div className="px-4 pb-4">
        <div className="flex items-end gap-2 bg-neutral-900 border border-neutral-800 focus-within:border-purple-500/60 rounded-2xl px-4 py-3 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe your website..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-neutral-200 placeholder:text-neutral-600 outline-none resize-none max-h-30 scrollbar-none"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={loading || !input.trim()}
            className="shrink-0 w-8 h-8 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 cursor-pointer mb-0.5"
          >
            {loading ? (
              <LoaderCircle className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-neutral-700 mt-1.5 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
