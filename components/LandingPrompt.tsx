"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoveRight, LoaderCircle } from "lucide-react";
import { normalizeLayout } from "@/lib/normalizeLayout";
import { THEME_STYLES, getThemeLabel } from "@/lib/themeConfig";
import { ThemeStyle } from "@/types/layout";
import { useCredits } from "@/context/CreditsContext";
import Logo from "@/assets/logo_light.svg";

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
  const [error, setError] = useState<string | null>(null);
  const animatedPlaceholder = useTypewriter(PLACEHOLDERS);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
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

      // Save to sessionStorage so /build can read it after navigation
      sessionStorage.setItem("astroweb_layout", JSON.stringify(normalized));
      sessionStorage.setItem("astroweb_prompt", prompt);

      await refreshCredits();

      // Navigate to /build — this is now a separate page
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

        {/* Theme selector */}
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
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="absolute bottom-5 right-3 flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <img
                  src={Logo.src}
                  alt="Loading"
                  className="w-4 h-4 animate-spin"
                />
                {/* <LoaderCircle className="w-4 h-4 animate-spin" /> */}
              </>
            ) : (
              <>
                <MoveRight className="w-4 h-4" />
              </>
            )}
          </button>
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
