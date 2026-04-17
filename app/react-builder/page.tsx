"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Monitor, Smartphone, Maximize2, Minimize2 } from "lucide-react";
import type { GeneratedReactFiles } from "@/types/react-generation";
import ReactChatPanel from "@/components/ReactChatPanel";
import Logo from "@/assets/logo.svg"

// IMPORTANT: Sandpack must be dynamically imported with ssr: false
const ReactSandpack = dynamic(
  () => import("@/components/ReactPreview/ReactSandpack"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-screen text-white">Loading editor...</div> }
);

function ReactBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const continueId = searchParams.get("continue");

  const [files, setFiles] = useState<GeneratedReactFiles | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(!!continueId);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"code" | "preview" | "design">("code");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const [fullscreen, setFullscreen] = useState(false);
  // Counter that increments ONLY on new AI generations or DB restores.
  // User edits from the Sandpack editor do NOT increment this.
  const generationKeyRef = useRef(0);

  // Ref that holds the latest editor content WITHOUT triggering re-renders.
  // This breaks the feedback loop: edits stay in the ref, not in state,
  // so SandpackProvider never receives updated files as a prop.
  const getSandpackFilesRef = useRef<(() => GeneratedReactFiles) | null>(null);

  // STABLE handler for when the AI generates new files.
  // We MUST use useCallback here. Because ReactChatPanel has a useEffect
  // dependent on this function, an inline function would trigger a reset
  // of the files back to the original AI snapshot every time page.tsx re-rendered (e.g. during Save).
  const handleChatFilesChange = useCallback((f: GeneratedReactFiles | null) => {
    // Only increment generationKey if files actually changed identity, 
    // to prevent unnecessary Sandpack remounts.
    setFiles((prev) => {
      if (prev !== f) {
        generationKeyRef.current += 1;
        setSaved(false);
      }
      return f;
    });
  }, []);

  // Wakes up the Save button whenever the user types in the editor.
  // Using useCallback so we don't trigger unnecessary child re-renders.
  const handleCodeEdit = useCallback(() => {
    setSaved(false);
  }, []);

  useEffect(() => {
    // If continuing from DB
    if (continueId) {
      fetch(`/api/generations/${continueId}`)
        .then(res => res.json())
        .then(data => {
            if (data?.generation?.reactFiles) {
               setFiles(data.generation.reactFiles);
               setPrompt(data.generation.prompt);
            }
        })
        .finally(() => setInitLoading(false));
      return;
    }

    const savedPrompt = sessionStorage.getItem("crawlcube_react_prompt");
    if (savedPrompt) {
      setPrompt(savedPrompt);
      sessionStorage.removeItem("crawlcube_react_prompt");
      return;
    }

    const savedFiles = sessionStorage.getItem("crawlcube_react_files");
    if (savedFiles) {
      try {
        setFiles(JSON.parse(savedFiles));
      } catch (e) {
        sessionStorage.removeItem("crawlcube_react_files");
      }
    }
  }, [continueId]);

  const handleSave = async () => {
    // Read the exact latest files from the Sandpack editor right now
    const filesToSave = getSandpackFilesRef.current ? getSandpackFilesRef.current() : files;
    if (!filesToSave || saving) return;
    
    // CRITICAL FIX: We MUST update the React state with the newly extracted files!
    // If we don't, when `setSaving(true)` causes a re-render, Sandpack sees the old
    // `files` prop and aggressively resets its internal editor back to the old code.
    setFiles(filesToSave);
    
    // Save locally for reload persistence
    sessionStorage.setItem("crawlcube_react_files", JSON.stringify(filesToSave));
    
    setSaving(true);
    try {
      const res = await fetch("/api/generations/save", {
        method: continueId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(continueId ? {
          id: continueId,
          prompt: prompt,
          reactFiles: filesToSave,
        } : {
          prompt: prompt,
          reactFiles: filesToSave,
        }),
      });
      if (res.ok) setSaved(true);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (initLoading) {
    return (
       <div className="h-screen bg-[#0a0a0a] flex items-center justify-center text-white flex-col gap-4">
         <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
         <p className="text-white/50 animate-pulse font-medium">Loading workspace...</p>
       </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <div className="h-12 bg-neutral-900 flex justify-between items-center px-4  border-b border-white/10 shrink-0">
         <button onClick={() => router.push("/")} className="text-white/60 hover:text-white flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
         </button>
         <img src={Logo.src} alt="Logo" className="w-8 h-8 mr-4 " />
      </div>

      <div className="flex flex-1 overflow-hidden">
         {/* LEFT SIDEBAR (ReactChatPanel) */}
         <ReactChatPanel 
            onFilesChange={handleChatFilesChange} 
            initialPrompt={prompt || undefined} 
            initialFiles={files} 
         />

         {/* MAIN CONTENT (ReactSandpack) */}
         <div className="flex-1 bg-[#151515] flex flex-col min-w-0 relative">
            {/* Top Toolbar overlay */}
            {files && (
              <div className="h-14 bg-[#111] border-b border-white/10 flex items-center justify-center relative px-4 shrink-0">
                
                {/* Left: Device Toggles */}
                <div className="absolute left-4 flex items-center gap-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewWidth("desktop")}
                    className={`p-1.5 rounded-md transition-all ${previewWidth === "desktop" ? "bg-[#252525] text-white" : "text-neutral-500 hover:text-white"}`}
                    title="Desktop view"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewWidth("mobile")}
                    className={`p-1.5 rounded-md transition-all ${previewWidth === "mobile" ? "bg-[#252525] text-white" : "text-neutral-500 hover:text-white"}`}
                    title="Mobile view"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Center Toggles */}
                <div className="flex items-center p-1 bg-[#1a1a1a] border border-white/10 rounded-full">
                  <button onClick={() => setViewMode("preview")} className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${viewMode === "preview" ? "bg-[#252525] text-white shadow-sm" : "text-neutral-500 hover:text-white"}`}>Preview</button>
                  <button onClick={() => setViewMode("design")} className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${viewMode === "design" ? "bg-[#252525] text-white shadow-sm" : "text-neutral-500 hover:text-white"}`}>Design</button>
                  <button onClick={() => setViewMode("code")} className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${viewMode === "code" ? "bg-[#252525] text-white shadow-sm" : "text-neutral-500 hover:text-white"}`}>Code</button>
                </div>

                {/* Right Actions */}
                <div className="absolute right-4 flex items-center gap-2">
                  <button
                    onClick={() => setFullscreen(true)}
                    className="p-1.5 text-neutral-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-lg transition-colors"
                    title="Fullscreen preview"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button disabled className="px-3 py-1.5 text-xs text-white/50 border border-white/10 hover:bg-white/5 rounded-lg transition-colors cursor-not-allowed">Export</button>
                  <button onClick={handleSave} disabled={saving || saved} className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors rounded-lg flex items-center gap-1.5">
                    {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
                  </button>
                </div>
              </div>
            )}

            {files ? (
                <div className="flex-1 min-h-0 relative">
                  <ReactSandpack files={files} getFilesRef={getSandpackFilesRef} onCodeEdit={handleCodeEdit} viewMode={viewMode} previewWidth={previewWidth} generationKey={generationKeyRef.current} />
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white/40">
                   <div className="w-16 h-16 mb-4 border border-white/10 shadow-xl rounded-2xl flex items-center justify-center bg-white/5">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                   </div>
                   <p className="font-semibold text-white/70">Your React workspace is ready.</p>
                   <p className="text-sm mt-1">Enter a prompt to generate your first website build.</p>
                </div>
            )}

            {/* Fullscreen Preview Overlay */}
            {fullscreen && files && (
              <div className="fixed inset-0 z-[100] bg-black flex flex-col">
                <div className="h-12 bg-neutral-900 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
                  <span className="text-white/60 text-sm font-medium">Full-Screen Preview</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-0.5">
                      <button
                        onClick={() => setPreviewWidth("desktop")}
                        className={`p-1.5 rounded-md transition-all ${previewWidth === "desktop" ? "bg-[#252525] text-white" : "text-neutral-500 hover:text-white"}`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPreviewWidth("mobile")}
                        className={`p-1.5 rounded-md transition-all ${previewWidth === "mobile" ? "bg-[#252525] text-white" : "text-neutral-500 hover:text-white"}`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => setFullscreen(false)}
                      className="p-1.5 text-neutral-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ReactSandpack files={files} getFilesRef={getSandpackFilesRef} onCodeEdit={handleCodeEdit} viewMode="preview" previewWidth={previewWidth} generationKey={generationKeyRef.current} />
                </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}

export default function ReactBuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black" />}>
      <ReactBuilderContent />
    </Suspense>
  );
}
