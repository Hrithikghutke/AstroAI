"use client";

import { useState, useEffect } from "react";
import PreviewFrame from "@/components/PreviewFrame";
import DeepPreview from "@/components/DeepPreview";
import { Layout } from "@/types/layout";
import {
  Monitor,
  Smartphone,
  Save,
  Share2,
  Download,
  Check,
  Pencil,
  Telescope,
} from "lucide-react";
import { generateHtml } from "@/lib/generateHtml";

export default function PreviewPanel({
  layout,
  deepHtml,
  deepBrandName,
  prompt,
  savedId,
  onSaved,
  onLayoutChange,
}: {
  layout: Layout | null;
  deepHtml?: string | null;
  deepBrandName?: string | null;
  prompt?: string;
  savedId?: string | null;
  onSaved?: (id: string) => void;
  onLayoutChange?: (updated: Layout) => void;
}) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);

  // Determine active mode
  const isDeepMode = !!deepHtml && !layout;

  // Brand name for URL bar — works for both modes
  const brandName = isDeepMode
    ? (deepBrandName ?? "preview")
    : (layout?.branding?.logoText ?? "preview");

  const urlBarName = brandName.toLowerCase().replace(/\s+/g, "");

  // Reset save state when content changes
  useEffect(() => {
    if (savedId) {
      setPendingChanges(true);
    } else {
      setSaved(false);
    }
    setCopied(false);
  }, [layout, deepHtml]);

  useEffect(() => {
    if (!savedId) {
      setShareId(null);
      setSaved(false);
      setPendingChanges(false);
    }
  }, [savedId]);

  // ── Save ──
  const handleSave = async () => {
    if ((!layout && !deepHtml) || saving) return;
    if (saved && !pendingChanges) return;
    setSaving(true);

    try {
      if (savedId) {
        const res = await fetch("/api/generations/save", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: savedId,
            layout: layout ?? null,
            deepHtml: deepHtml ?? null,
            prompt: prompt ?? "",
          }),
        });
        if (res.ok) {
          setSaved(true);
          setPendingChanges(false);
        }
      } else {
        const res = await fetch("/api/generations/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layout: layout ?? null,
            deepHtml: deepHtml ?? null,
            prompt: prompt ?? "",
          }),
        });
        const data = await res.json();
        if (data.id && data.shareId) {
          setShareId(data.shareId);
          onSaved?.(data.id);
          setSaved(true);
          setPendingChanges(false);
        }
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  // ── Share ──
  const handleShare = async () => {
    if (saving) return;

    if (shareId) {
      const url = `${window.location.origin}/preview/${shareId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    setSaving(true);
    try {
      let sid: string | null = null;

      if (savedId) {
        const res = await fetch(`/api/generations/${savedId}/share`);
        if (res.ok) {
          const data = await res.json();
          sid = data.shareId;
          setShareId(sid);
        }
      }

      if (!sid) {
        const res = await fetch("/api/generations/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layout: layout ?? null,
            deepHtml: deepHtml ?? null,
            prompt: prompt ?? "",
          }),
        });
        const data = await res.json();
        if (data.id && data.shareId) {
          sid = data.shareId;
          setShareId(sid);
          onSaved?.(data.id);
          setSaved(true);
          setPendingChanges(false);
        }
      }

      if (sid) {
        const url = `${window.location.origin}/preview/${sid}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  // ── Download ──
  // Fast mode: generate HTML from layout JSON
  // Deep mode: download the raw HTML string directly
  const handleDownload = () => {
    let html = "";
    let filename = "website";

    if (isDeepMode && deepHtml) {
      html = deepHtml;
      filename = brandName.toLowerCase().replace(/\s+/g, "-");
    } else if (layout) {
      html = generateHtml(layout);
      filename =
        layout.branding?.logoText?.toLowerCase().replace(/\s+/g, "-") ??
        "website";
    } else {
      return;
    }

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveLabel = () => {
    if (saving) return "Saving…";
    if (saved && !pendingChanges) return "Saved!";
    if (saved && pendingChanges) return "Save changes";
    return "Save";
  };

  const saveDisabled = saving || (saved && !pendingChanges);
  const hasContent = !!(layout || deepHtml);

  // ── Empty state ──
  if (!hasContent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 gap-4 relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none" />
        <div className="relative text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
            <Monitor className="w-7 h-7 text-neutral-600" />
          </div>
          <p className="text-neutral-500 text-sm font-medium">
            Your website preview will appear here
          </p>
          <p className="text-neutral-700 text-xs max-w-60 mx-auto">
            Describe your website in the chat on the left and hit Enter to
            generate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-950 gap-3">
        {/* URL bar */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/60" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
            <div className="w-2 h-2 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-neutral-600 truncate">
            {urlBarName}.crawlcube.app
          </span>
          {/* Deep Dive badge in toolbar */}
          {isDeepMode && (
            <span className="ml-1 flex items-center gap-1 text-[10px] font-semibold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded-full shrink-0">
              <Telescope className="w-2.5 h-2.5" />
              Deep
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saveDisabled}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                saved && !pendingChanges
                  ? "#16a34a22"
                  : pendingChanges
                    ? "#7c3aed22"
                    : "#ffffff11",
              color:
                saved && !pendingChanges
                  ? "#4ade80"
                  : pendingChanges
                    ? "#a78bfa"
                    : "#a3a3a3",
              border: `1px solid ${saved && !pendingChanges ? "#16a34a44" : pendingChanges ? "#7c3aed44" : "#2a2a2a"}`,
            }}
          >
            {saved && !pendingChanges ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{saveLabel()}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            style={{
              background: copied ? "#7c3aed33" : "#ffffff11",
              color: copied ? "#a78bfa" : "#a3a3a3",
              border: `1px solid ${copied ? "#7c3aed44" : "#2a2a2a"}`,
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {copied ? "Copied!" : "Share"}
            </span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Viewport toggle */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewport("desktop")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewport === "desktop" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewport === "mobile" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hint bar — edit hint for Fast Mode, info bar for Deep Dive */}
      {isDeepMode ? (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-pink-500/10 border-b border-pink-500/20 text-xs text-pink-400">
          <Telescope className="w-3 h-3 shrink-0" />
          <span>
            Deep Dive website — describe changes in the chat to regenerate
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border-b border-purple-500/20 text-xs text-purple-400">
          <Pencil className="w-3 h-3 shrink-0" />
          <span>Click any text in the preview to edit it directly</span>
        </div>
      )}

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-neutral-800 flex items-start justify-center p-4">
        {isDeepMode ? (
          // Deep Dive — raw HTML in iframe
          <DeepPreview html={deepHtml!} viewport={viewport} />
        ) : (
          // Fast Mode — React component tree
          <div
            className="@container rounded-lg shadow-2xl transition-all duration-300 origin-top overflow-x-hidden overflow-y-auto"
            style={{
              width: viewport === "mobile" ? "390px" : "100%",
              minHeight: "100%",
              background: "white",
            }}
          >
            <PreviewFrame
              layout={layout}
              editable={true}
              onLayoutChange={onLayoutChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
