"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoveRight, Zap, Telescope, ChevronDown } from "lucide-react";
import { normalizeLayout } from "@/lib/normalizeLayout";
import { THEME_STYLES, getThemeLabel } from "@/lib/themeConfig";
import { ThemeStyle } from "@/types/layout";
import { useCredits } from "@/context/CreditsContext";
import Logo from "@/assets/logo_light.svg";
import { DEEP_DIVE_MODELS, CLAUDE_LOGO_SVG } from "@/lib/modelConfig";
type GenerationMode = "fast" | "deep";

const useTypewriter = (
  words: string[],
  typingSpeed = 80,
  deletingSpeed = 40,
  pause = 1800,
) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !isDeleting) {
      setTimeout(() => setIsDeleting(true), pause);
      return;
    }
    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }
    const timeout = setTimeout(
      () => setSubIndex((prev) => prev + (isDeleting ? -1 : 1)),
      isDeleting ? deletingSpeed : typingSpeed,
    );
    setText(words[index].substring(0, subIndex));
    return () => clearTimeout(timeout);
  }, [subIndex, index, isDeleting, words, typingSpeed, deletingSpeed, pause]);

  return text;
};

const PLACEHOLDERS = [
  "Create a modern gym website with pricing plans...",
  "Design a SaaS landing page for a project management tool...",
  "Build a premium portfolio site for a photographer...",
  "Make a restaurant website with an elegant dark theme...",
  "Create a tech startup website with glassmorphism style...",
];

const THEME_DESCRIPTIONS: Record<ThemeStyle, string> = {
  minimal: "Clean & spacious",
  bold: "High contrast & punchy",
  glassmorphism: "Frosted glass effects",
  elegant: "Refined & sophisticated",
  corporate: "Professional & formal",
};

export default function LandingPrompt() {
  const router = useRouter();
  const { deductCredit, refreshCredits } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeStyle>("corporate");
  const [selectedMode, setSelectedMode] = useState<GenerationMode>("fast");
  const [selectedModel, setSelectedModel] = useState(
    "anthropic/claude-sonnet-4.5",
  );
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animatedPlaceholder = useTypewriter(PLACEHOLDERS);

  const MODELS = DEEP_DIVE_MODELS;
  const activeModel =
    MODELS.find((m) => m.model === selectedModel) ?? MODELS[0];

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);

    // ── DEEP DIVE MODE ──
    // Don't call any API here — just save the prompt + mode and navigate.
    // The Deep Dive pipeline runs inside BuildPage/ChatPanel after navigation.
    if (selectedMode === "deep") {
      sessionStorage.setItem("crawlcube_prompt", prompt);
      sessionStorage.setItem("crawlcube_mode", "deep");
      sessionStorage.setItem("crawlcube_model", selectedModel);
      sessionStorage.removeItem("crawlcube_layout");
      router.push("/build");
      return;
    }

    // ── FAST MODE ──
    deductCredit();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, themeStyle: selectedTheme }),
      });

      const data = await res.json();

      if (res.status === 402) throw new Error("NO_CREDITS");
      if (!res.ok || !data.layout) throw new Error("Generation failed");

      const normalized = normalizeLayout(data.layout);
      normalized.themeStyle = selectedTheme;

      sessionStorage.setItem("crawlcube_layout", JSON.stringify(normalized));
      sessionStorage.setItem("crawlcube_prompt", prompt);
      sessionStorage.setItem("crawlcube_mode", "fast");

      await refreshCredits();
      router.push("/build");
    } catch (err: any) {
      await refreshCredits();
      setError(
        err.message === "NO_CREDITS"
          ? "You're out of credits. Purchase more to keep building!"
          : "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-6 px-4 w-full min-h-full justify-center py-16 overflow-hidden">
      {/* Background texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(168,85,247,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "0%",
          left: "-5%",
          width: "400px",
          height: "300px",
          background:
            "radial-gradient(ellipse, rgba(236,72,153,0.07) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "0%",
          right: "-5%",
          width: "400px",
          height: "300px",
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-4xl lg:text-[52px] font-semibold bg-linear-to-r from-purple-400 via-pink-300 to-white bg-clip-text text-transparent leading-tight">
            What will you build today?
          </h2>
          <p className="text-sm text-neutral-500">
            Describe your website and pick a visual style below
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-stretch gap-3 w-full">
          <button
            onClick={() => setSelectedMode("fast")}
            className="flex-1 flex flex-col items-start gap-1.5 px-4 py-3 rounded-2xl border transition-all duration-200 cursor-pointer text-left"
            style={{
              borderColor: selectedMode === "fast" ? "#a855f7" : "#2a2a2a",
              background:
                selectedMode === "fast"
                  ? "rgba(168,85,247,0.12)"
                  : "rgba(255,255,255,0.02)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    selectedMode === "fast"
                      ? "rgba(168,85,247,0.25)"
                      : "rgba(255,255,255,0.05)",
                }}
              >
                <Zap
                  className="w-3.5 h-3.5"
                  style={{
                    color: selectedMode === "fast" ? "#d8b4fe" : "#525252",
                  }}
                />
              </div>
              <span
                className="text-sm font-semibold"
                style={{
                  color: selectedMode === "fast" ? "#d8b4fe" : "#525252",
                }}
              >
                Fast Mode
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background:
                    selectedMode === "fast"
                      ? "rgba(168,85,247,0.2)"
                      : "rgba(255,255,255,0.05)",
                  color: selectedMode === "fast" ? "#d8b4fe" : "#525252",
                }}
              >
                1 credit
              </span>
            </div>
            <p
              className="text-xs leading-relaxed"
              style={{
                color: selectedMode === "fast" ? "#a78bfa" : "#404040",
              }}
            >
              Structured components with AI-enhanced CSS, animations and custom
              fonts. Ready in ~15 seconds.
            </p>
          </button>

          <button
            onClick={() => setSelectedMode("deep")}
            className="flex-1 flex flex-col items-start gap-1.5 px-4 py-3 rounded-2xl border transition-all duration-200 cursor-pointer text-left"
            style={{
              borderColor: selectedMode === "deep" ? "#ec4899" : "#2a2a2a",
              background:
                selectedMode === "deep"
                  ? "rgba(236,72,153,0.10)"
                  : "rgba(255,255,255,0.02)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    selectedMode === "deep"
                      ? "rgba(236,72,153,0.2)"
                      : "rgba(255,255,255,0.05)",
                }}
              >
                <Telescope
                  className="w-3.5 h-3.5"
                  style={{
                    color: selectedMode === "deep" ? "#f9a8d4" : "#525252",
                  }}
                />
              </div>
              <span
                className="text-sm font-semibold"
                style={{
                  color: selectedMode === "deep" ? "#f9a8d4" : "#525252",
                }}
              >
                Deep Dive
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background:
                    selectedMode === "deep"
                      ? "rgba(236,72,153,0.2)"
                      : "rgba(255,255,255,0.05)",
                  color: selectedMode === "deep" ? "#f9a8d4" : "#525252",
                }}
              >
                3 credits
              </span>
            </div>
            <p
              className="text-xs leading-relaxed"
              style={{
                color: selectedMode === "deep" ? "#f9a8d4" : "#404040",
              }}
            >
              Full AI agent pipeline — Architect, Developer and QA work together
              to build a truly unique website. Takes ~45 seconds.
            </p>
          </button>
        </div>

        {/* Theme selector — only shown in Fast Mode */}
        {selectedMode === "fast" && (
          <div className="flex flex-wrap justify-center gap-2">
            {THEME_STYLES.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedTheme(style)}
                className="flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer"
                style={{
                  borderColor: selectedTheme === style ? "#a855f7" : "#2a2a2a",
                  background:
                    selectedTheme === style
                      ? "rgba(168,85,247,0.15)"
                      : "rgba(255,255,255,0.03)",
                  color: selectedTheme === style ? "#d8b4fe" : "#737373",
                }}
              >
                <span className="font-semibold">{getThemeLabel(style)}</span>
                <span className="text-[10px] opacity-70 mt-0.5">
                  {THEME_DESCRIPTIONS[style]}
                </span>
              </button>
            ))}
          </div>
        )}
        {/* Prompt input */}
        {/* Prompt input */}
        <div className="relative w-full">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={animatedPlaceholder}
            rows={4}
            className="scrollbar no-scrollbar w-full resize-none rounded-2xl bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 focus:border-purple-500/60 px-5 pt-4 pb-14 text-sm text-stone-300 outline-none placeholder:text-neutral-600 transition-all"
          />

          {/* Bottom bar inside textarea */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            {/* Model selector pill — Deep Dive only */}
            {selectedMode === "deep" ? (
              <div className="relative">
                <button
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: "rgba(236,72,153,0.12)",
                    border: "1px solid rgba(236,72,153,0.3)",
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

                {/* Dropdown */}
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
                              ? "rgba(236,72,153,0.1)"
                              : "transparent",
                        }}
                      >
                        <span
                          dangerouslySetInnerHTML={{
                            __html: logo ?? CLAUDE_LOGO_SVG,
                          }}
                          className="shrink-0"
                        />
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
                        </div>
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
              // Fast mode — just a static label
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
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

            {/* Send button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: selectedMode === "deep" ? "#ec4899" : "#a855f7",
              }}
            >
              {loading ? (
                <img
                  src={Logo.src}
                  alt="Loading"
                  className="w-4 h-4 animate-spin"
                />
              ) : (
                <MoveRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-600">
          Tip: Be specific — mention your industry, audience, and tone. Press
          ⌘+Enter to generate.
        </p>

        {error && (
          <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/30 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
