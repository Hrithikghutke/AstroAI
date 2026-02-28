"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";

export default function BuildPage() {
  const router = useRouter();
  const [layout, setLayout] = useState<any>(null);
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [mobileView, setMobileView] = useState<"chat" | "preview">("preview");
  const [ready, setReady] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null); // persists across modifications

  useEffect(() => {
    const stored = sessionStorage.getItem("astroweb_layout");
    const storedPrompt = sessionStorage.getItem("astroweb_prompt");

    if (stored) {
      try {
        setLayout(JSON.parse(stored));
        setInitialPrompt(storedPrompt ?? "");
        setCurrentPrompt(storedPrompt ?? "");
      } catch {
        router.replace("/");
        return;
      }
    }
    setReady(true);
  }, [router]);

  const handleChatGenerate = (generatedLayout: any, prompt?: string) => {
    setLayout(generatedLayout);
    if (prompt) setCurrentPrompt(prompt);
    sessionStorage.setItem("astroweb_layout", JSON.stringify(generatedLayout));
    setMobileView("preview");
    // ✅ Do NOT clear savedId — modifications update the same entry
  };

  const handleNewChat = () => {
    setSavedId(null); // new chat = fresh save entry
    setLayout(null);
    setCurrentPrompt("");
    sessionStorage.removeItem("astroweb_layout");
    sessionStorage.removeItem("astroweb_prompt");
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
            initialLayout={layout}
            initialPrompt={initialPrompt}
            onNewChat={handleNewChat}
          />
        </div>

        <div className="hidden md:flex flex-1 flex-col">
          <PreviewPanel
            layout={layout}
            prompt={currentPrompt}
            savedId={savedId}
            onSaved={(id) => setSavedId(id)}
          />
        </div>

        {/* MOBILE */}
        <div className="flex md:hidden flex-1 flex-col overflow-hidden">
          {mobileView === "chat" ? (
            <ChatPanel
              setLayout={handleChatGenerate}
              initialLayout={layout}
              initialPrompt={initialPrompt}
              onShowPreview={() => setMobileView("preview")}
              hasLayout={!!layout}
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
                prompt={currentPrompt}
                savedId={savedId}
                onSaved={(id) => setSavedId(id)}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
