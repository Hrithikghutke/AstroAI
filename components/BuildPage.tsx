"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { Layout } from "@/types/layout";

type GenerationMode = "fast" | "deep";

export default function BuildPage() {
  const router = useRouter();
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
  ); // ← add this
  useEffect(() => {
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
      // Deep dive mode — no layout yet, just the prompt
      // ChatPanel will auto-start the pipeline
      setInitialPrompt(storedPrompt ?? "");
      setCurrentPrompt(storedPrompt ?? "");
    }

    setReady(true);
  }, [router]);

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
              initialMode={initialMode}
              onShowPreview={() => setMobileView("preview")}
              hasLayout={!!(layout || deepHtml)}
              onNewChat={handleNewChat}
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
