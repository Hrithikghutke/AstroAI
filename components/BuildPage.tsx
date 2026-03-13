"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { Layout } from "@/types/layout";

type GenerationMode = "fast" | "deep";

export default function BuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [layout, setLayout] = useState<any>(null);
  const [deepHtml, setDeepHtml] = useState<string | null>(null);
  const [deepBrandName, setDeepBrandName] = useState<string | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [initialMode, setInitialMode] = useState<GenerationMode>("fast");
  const [mobileView, setMobileView] = useState<"chat" | "preview">("preview");
  const [ready, setReady] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [initialModel, setInitialModel] = useState(
    "anthropic/claude-haiku-4.5",
  );
  const [streamingCode, setStreamingCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const typewriterQueue = useRef<string>("");
  const typewriterDisplayed = useRef<string>("");
  const typewriterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typewriter drain — called recursively until queue is empty
  const drainQueue = useCallback(() => {
    const queue = typewriterQueue.current;
    const displayed = typewriterDisplayed.current;
    if (displayed.length >= queue.length) {
      typewriterTimer.current = null;
      return;
    }
    // Advance by 8-20 chars per tick for fast but visible typing
    const charsPerTick = Math.floor(Math.random() * 12) + 8;
    const next = queue.slice(0, displayed.length + charsPerTick);
    typewriterDisplayed.current = next;
    setStreamingCode(next);
    typewriterTimer.current = setTimeout(drainQueue, 16); // ~60fps
  }, []);

  // Called by ChatPanel with each new server chunk
  const handleStreamCode = useCallback(
    (code: string) => {
      if (!code) {
        // Reset on new generation
        typewriterQueue.current = "";
        typewriterDisplayed.current = "";
        setStreamingCode("");
        if (typewriterTimer.current) clearTimeout(typewriterTimer.current);
        typewriterTimer.current = null;
        return;
      }
      typewriterQueue.current = code;
      // Start draining if not already running
      if (!typewriterTimer.current) {
        typewriterTimer.current = setTimeout(drainQueue, 16);
      }
    },
    [drainQueue],
  );

  useEffect(() => {
    const continueId = searchParams.get("continue");

    // ── Continue from dashboard ──
    if (continueId) {
      const restoreGeneration = async () => {
        try {
          const res = await fetch(`/api/generations/${continueId}`);
          if (!res.ok) {
            router.replace("/");
            return;
          }
          const data = await res.json();
          const gen = data.generation;

          setSavedId(continueId);
          setInitialPrompt(gen.prompt ?? "");
          setCurrentPrompt(gen.prompt ?? "");

          if (gen.deepHtml) {
            // Restore Deep Dive
            setDeepHtml(gen.deepHtml);
            setDeepBrandName(gen.siteName ?? null);
            setInitialMode("deep");
            sessionStorage.setItem("crawlcube_mode", "deep");
          } else if (gen.layout) {
            // Restore Fast Mode
            setLayout(gen.layout);
            setInitialMode("fast");
            sessionStorage.setItem(
              "crawlcube_layout",
              JSON.stringify(gen.layout),
            );
            sessionStorage.setItem("crawlcube_mode", "fast");
          }

          if (gen.prompt) {
            sessionStorage.setItem("crawlcube_prompt", gen.prompt);
          }
        } catch {
          router.replace("/");
          return;
        } finally {
          setReady(true);
        }
      };

      restoreGeneration();
      return;
    }

    // ── Normal flow from sessionStorage ──
    const stored = sessionStorage.getItem("crawlcube_layout");
    const storedPrompt = sessionStorage.getItem("crawlcube_prompt");
    const storedMode = sessionStorage.getItem(
      "crawlcube_mode",
    ) as GenerationMode | null;
    const storedModel = sessionStorage.getItem("crawlcube_model");
    setInitialMode(storedMode === "deep" ? "deep" : "fast");
    if (storedModel) setInitialModel(storedModel);

    if (stored) {
      try {
        setLayout(JSON.parse(stored));
        setInitialPrompt(storedPrompt ?? "");
        setCurrentPrompt(storedPrompt ?? "");
      } catch {
        router.replace("/");
        return;
      }
    } else if (storedMode === "deep" && storedPrompt) {
      setInitialPrompt(storedPrompt ?? "");
      setCurrentPrompt(storedPrompt ?? "");
    }

    setReady(true);
  }, [router, searchParams]);

  // ── Fast Mode: layout JSON from ChatPanel ──
  const handleChatGenerate = (generatedLayout: any, prompt?: string) => {
    setLayout(generatedLayout);
    setDeepHtml(null); // clear any deep dive output
    if (prompt) setCurrentPrompt(prompt);
    if (generatedLayout) {
      sessionStorage.setItem(
        "crawlcube_layout",
        JSON.stringify(generatedLayout),
      );
    }
    setMobileView("preview");
  };

  // ── Deep Dive Mode: raw HTML from ChatPanel ──
  const handleDeepHtml = (html: string, brandName?: string) => {
    setDeepHtml(html);
    setDeepBrandName(brandName ?? null);
    setLayout(null); // clear any fast mode layout
    setMobileView("preview");
  };

  const handleNewChat = () => {
    setSavedId(null);
    setLayout(null);
    setDeepHtml(null);
    setDeepBrandName(null);
    setCurrentPrompt("");
    sessionStorage.removeItem("crawlcube_layout");
    sessionStorage.removeItem("crawlcube_prompt");
    sessionStorage.removeItem("crawlcube_mode");
  };

  const handleLayoutChange = (updated: Layout) => {
    setLayout(updated);
    sessionStorage.setItem("crawlcube_layout", JSON.stringify(updated));
  };

  if (!ready) {
    return (
      <div className="h-screen flex flex-col bg-neutral-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-neutral-950 text-white overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP */}
        <div className="hidden md:flex w-[38%] shrink-0 border-r border-neutral-800 flex-col">
          <ChatPanel
            setLayout={handleChatGenerate}
            setDeepHtml={handleDeepHtml}
            initialLayout={layout}
            initialPrompt={initialPrompt}
            initialMode={initialMode}
            onNewChat={handleNewChat}
            initialModel={initialModel}
            restoredDeepHtml={deepHtml}
            onStreamCode={handleStreamCode}
            onGeneratingChange={setIsGenerating}
          />
        </div>

        <div className="hidden md:flex flex-1 flex-col">
          <PreviewPanel
            layout={layout}
            deepHtml={deepHtml}
            deepBrandName={deepBrandName}
            prompt={currentPrompt}
            savedId={savedId}
            onSaved={(id) => setSavedId(id)}
            onLayoutChange={handleLayoutChange}
            streamingCode={streamingCode}
            isGenerating={isGenerating}
          />
        </div>

        {/* MOBILE */}
        <div className="flex md:hidden flex-1 flex-col overflow-hidden">
          {mobileView === "chat" ? (
            <ChatPanel
              setLayout={handleChatGenerate}
              setDeepHtml={handleDeepHtml}
              initialLayout={layout}
              initialPrompt={initialPrompt}
              initialModel={initialModel}
              restoredDeepHtml={deepHtml}
              initialMode={initialMode}
              onShowPreview={() => setMobileView("preview")}
              hasLayout={!!(layout || deepHtml)}
              onNewChat={handleNewChat}
              onStreamCode={handleStreamCode}
              onGeneratingChange={setIsGenerating}
            />
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-950 border-b border-neutral-800">
                <button
                  onClick={() => setMobileView("chat")}
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to chat
                </button>
                <span className="text-xs text-neutral-500 font-medium">
                  Preview
                </span>
                <div className="w-16" />
              </div>
              <PreviewPanel
                layout={layout}
                deepHtml={deepHtml}
                deepBrandName={deepBrandName}
                prompt={currentPrompt}
                savedId={savedId}
                onSaved={(id) => setSavedId(id)}
                onLayoutChange={handleLayoutChange}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
