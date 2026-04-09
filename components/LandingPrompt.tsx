"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Zap, Telescope, Settings2, ChevronDown } from "lucide-react";
import { normalizeLayout } from "@/lib/normalizeLayout";
import { THEME_STYLES, getThemeLabel } from "@/lib/themeConfig";
import { ThemeStyle } from "@/types/layout";
import { useCredits } from "@/context/CreditsContext";
import Logo from "@/assets/logo.svg";
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
  const { credits, deductCredit, refreshCredits } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeStyle>("corporate");
  const [selectedMode, setSelectedMode] = useState<GenerationMode>("deep");
  const [selectedModel, setSelectedModel] = useState("google/gemini-3-flash-preview");
  
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const animatedPlaceholder = useTypewriter(PLACEHOLDERS);

  const MODELS = DEEP_DIVE_MODELS;
  const activeModel = MODELS.find((m) => m.model === selectedModel) ?? MODELS[0];

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);

    // ── DEEP DIVE MODE ──
    if (selectedMode === "deep") {
      const isDetailedPrompt = prompt.trim().length > 500;

      sessionStorage.setItem("crawlcube_mode", "deep");
      sessionStorage.setItem("crawlcube_model", selectedModel);
      sessionStorage.removeItem("crawlcube_layout");
      sessionStorage.removeItem("crawlcube_deep_html");
      sessionStorage.removeItem("crawlcube_messages");
      sessionStorage.removeItem("crawlcube_brief");

      if (isDetailedPrompt) {
        sessionStorage.setItem("crawlcube_prompt", prompt);
        sessionStorage.removeItem("crawlcube_seed_messages");
        router.push("/build");
        return;
      }

      try {
        const chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            brief: "",
            hasExistingWebsite: false,
            existingPages: [],
          }),
        });

        const chatData = await chatRes.json();
        const action = chatData.action ?? "chat";

        if (action === "build_now" || action === "generate") {
          sessionStorage.setItem("crawlcube_prompt", chatData.prompt ?? chatData.updatedBrief ?? prompt);
          sessionStorage.removeItem("crawlcube_seed_messages");
        } else {
          sessionStorage.removeItem("crawlcube_prompt");
          sessionStorage.setItem(
            "crawlcube_seed_messages",
            JSON.stringify([
              { role: "user", content: prompt },
              {
                role: "assistant",
                content: chatData.message ?? "Tell me more about what you'd like to build.",
                questions: chatData.questions ?? undefined,
              },
            ])
          );
        }

        router.push("/build");
      } catch {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
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
          : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey || e.shiftKey === false)) {
      if (!e.shiftKey) {
        e.preventDefault();
        handleGenerate();
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center w-full min-h-[70vh] justify-center pb-12 pt-8 sm:pt-20 px-4 md:px-0">

      
      
      {/* Deep Purple Aura / Glows */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden" 
        style={{ zIndex: 0 }}
      >
        {/* Top left geometric blocks pattern */}
        {/* <div 
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[70%] opacity-20 dark:opacity-[0.15] hidden sm:block"
          style={{
            backgroundImage: `linear-gradient(30deg, #6b21a8 12%, transparent 12.5%, transparent 87%, #6b21a8 87.5%, #6b21a8), linear-gradient(150deg, #6b21a8 12%, transparent 12.5%, transparent 87%, #6b21a8 87.5%, #6b21a8), linear-gradient(30deg, #6b21a8 12%, transparent 12.5%, transparent 87%, #6b21a8 87.5%, #6b21a8), linear-gradient(150deg, #6b21a8 12%, transparent 12.5%, transparent 87%, #6b21a8 87.5%, #6b21a8), linear-gradient(60deg, #86198f 25%, transparent 25.5%, transparent 75%, #86198f 75%, #86198f), linear-gradient(60deg, #86198f 25%, transparent 25.5%, transparent 75%, #86198f 75%, #86198f)`,
            backgroundSize: `80px 140px`,
            backgroundPosition: `0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px`,
            maskImage: "radial-gradient(ellipse at center, black 10%, transparent 60%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 10%, transparent 60%)"
          }}
        /> */}

        {/* Center Top Purple Glow */}
       

        {/* Floating Matrix Squares (Right side) */}
        <div 
          className="absolute top-[30%] right-[5%] w-[300px] h-[400px] opacity-60 hidden md:block"
          style={{
            backgroundImage: `radial-gradient(rgba(168, 85, 247, 0.4) 2px, transparent 2px)`,
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)"
          }}
        />
        
        {/* Decorative Floating Soft Squares */}
        <div className="absolute top-[35%] right-[12%] w-4 h-4 rounded-sm bg-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.6)] rotate-12 hidden lg:block" />
        <div className="absolute top-[25%] right-[8%] w-8 h-8 rounded-md border border-purple-400/20 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.2)] -rotate-6 hidden lg:block" />
        <div className="absolute bottom-[20%] left-[10%] w-6 h-6 rounded-md bg-purple-600/30 shadow-[0_0_20px_rgba(147,51,234,0.5)] rotate-45 hidden lg:block" />
      </div>

      {/* Floating Badge */}
      <div className="relative z-10 flex items-center justify-center mb-8">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 backdrop-blur-md text-[11px] font-semibold tracking-wide text-neutral-600 dark:text-neutral-300 shadow-sm">
          <svg className="w-3 h-3 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Website Generation Cannot Get Cheaper Than This.
        </div>
      </div>

      {/* Hero Headings */}
      <div className="relative z-10 text-center space-y-4 mb-10 w-full max-w-3xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Create beautiful designs
        </h1>
        <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto font-medium">
          Generate top-tier landing pages in seconds. <a href="#" className="underline decoration-neutral-300 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors">Watch video.</a>
        </p>
      </div>

      {/* Input Shell */}
      <div className="relative z-20 w-full max-w-3xl mx-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] shadow-2xl transition-colors">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={animatedPlaceholder}
          rows={3}
          className="w-full resize-none bg-transparent px-5 pt-5 pb-16 text-base text-neutral-800 dark:text-neutral-200 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 scrollbar-none"
        />

        {/* Bottom Toolbar inside textarea */}
        <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between pointer-events-none">
          
          {/* Action Chips */}
          <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
            {/* Mode Toggle Button */}
            <div className="relative">
              <button 
                onClick={() => setShowModePicker(!showModePicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                {selectedMode === "fast" 
                  ? <Zap className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                  : <Telescope className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />}
                {selectedMode === "fast" ? "Fast Mode" : "Deep Dive"}
                <ChevronDown className="w-3 h-3 opacity-40" />
              </button>
              
              {showModePicker && (
                <div className="absolute top-full mt-2 left-0 w-48 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden z-30">
                  <button onClick={() => { setSelectedMode("fast"); setShowModePicker(false); }} className="w-full flex items-center gap-2 p-3 text-left hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <Zap className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                    <div>
                      <span className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">Fast Mode</span>
                      <span className="block text-[10px] text-neutral-500">Structured layout (1 credit)</span>
                    </div>
                  </button>
                  <button onClick={() => { setSelectedMode("deep"); setShowModePicker(false); }} className="w-full flex items-center gap-2 p-3 text-left hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <Telescope className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                    <div>
                      <span className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">Deep Dive</span>
                      <span className="block text-[10px] text-neutral-500">Agent pipeline (3 credits)</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Model Toggle Button (Deep only) */}
            {selectedMode === "deep" && (
              <div className="relative">
                <button 
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  {/* Colored brand logo */}
                  <span
                    className="w-3.5 h-3.5 flex items-center justify-center shrink-0"
                    dangerouslySetInnerHTML={{ __html: activeModel.logo ?? CLAUDE_LOGO_SVG }}
                  />
                  {activeModel.label}
                  <ChevronDown className="w-3 h-3 opacity-40" />
                </button>
                {showModelPicker && (
                  <div className="absolute top-full mt-2 left-0 w-[300px] bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl z-30 p-2 overflow-hidden">
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-neutral-400 tracking-wider">
                      HTML GENERATION
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {MODELS.map(({ model, label, sublabel, minCreditsToStart, credits: estimatedCredits, logo }) => {
                        const currentCredits = credits ?? 0;
                        const insufficientCredits = currentCredits < minCreditsToStart;
                        return (
                        <button
                          key={model}
                          onClick={() => { 
                            if (!insufficientCredits) {
                              setSelectedModel(model); 
                              setShowModelPicker(false); 
                            }
                          }}
                          disabled={insufficientCredits}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${
                            insufficientCredits 
                              ? "opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-900" 
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                          }`}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-3">
                              <span 
                                className={`w-5 flex items-center justify-center shrink-0 transition-colors ${
                                  insufficientCredits 
                                    ? "text-neutral-400 dark:text-neutral-600" 
                                    : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200"
                                }`}
                                dangerouslySetInnerHTML={{ __html: logo ?? CLAUDE_LOGO_SVG }} 
                              />
                              <span className={`text-sm font-semibold ${
                                insufficientCredits ? "text-neutral-500 dark:text-neutral-500" : "text-neutral-800 dark:text-neutral-200"
                              }`}>{label}</span>
                            </div>
                            
                            <div className="pl-8 text-[10px] text-neutral-400 text-left leading-snug">
                              {sublabel && <span>{sublabel} • </span>}
                              <span className={insufficientCredits ? "" : "text-emerald-500 dark:text-emerald-400"}>
                                {estimatedCredits}
                              </span>
                              
                              {insufficientCredits && (
                                <div className="text-red-500 dark:text-red-400 font-semibold mt-1">
                                  Requires {minCreditsToStart} credits (You have {Math.floor(currentCredits)}) to avoid truncation.
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      )})}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theme Style Picker (Fast only) */}
            {selectedMode === "fast" && (
              <div className="relative">
                <button 
                  onClick={() => setShowThemePicker(!showThemePicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  <Settings2 className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                  {getThemeLabel(selectedTheme)}
                  <ChevronDown className="w-3 h-3 opacity-40" />
                </button>
                {showThemePicker && (
                  <div className="absolute top-full mt-2 left-0 w-[240px] bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl z-30 p-2 overflow-hidden">
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-neutral-400 tracking-wider">
                      STYLE OPTIONS
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {THEME_STYLES.map((style) => (
                        <button
                          key={style}
                          onClick={() => { setSelectedTheme(style); setShowThemePicker(false); }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
                        >
                          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                            {getThemeLabel(style)}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200/50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                            {style}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>

          {/* Submit Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="pointer-events-auto flex items-center justify-center p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <img src={Logo.src} alt="Loading" className="w-4 h-4 animate-spin dark:invert" />
            ) : (
              <ArrowUp className="w-4 h-4 font-bold" />
            )}
          </button>

        </div>
      </div>

      {error && (
        <div className="relative z-10 p-3 mt-4 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
}
