"use client";

import { useState, useEffect } from "react";
import PreviewFrame from "@/components/PreviewFrame";
import { Layout } from "@/types/layout";
import {
  Monitor,
  Smartphone,
  Save,
  Share2,
  Download,
  Check,
  Pencil,
} from "lucide-react";
import { generateHtml } from "@/lib/generateHtml";

export default function PreviewPanel({
  layout,
  prompt,
  savedId,
  onSaved,
  onLayoutChange,
}: {
  layout: Layout | null;
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
  const [pendingChanges, setPendingChanges] = useState(false); // ← NEW

  // When layout changes:
  // - If never saved: reset saved so POST can happen
  // - If already saved: mark pending changes so PATCH happens on next save
  useEffect(() => {
    if (savedId) {
      setPendingChanges(true); // inline edit — will PATCH on save
    } else {
      setSaved(false); // new generation — will POST on save
    }
    setCopied(false);
  }, [layout]);

  // New chat → clear everything
  useEffect(() => {
    if (!savedId) {
      setShareId(null);
      setSaved(false);
      setPendingChanges(false);
    }
  }, [savedId]);

  const handleSave = async () => {
    if (!layout || saving) return;
    if (saved && !pendingChanges) return; // nothing changed since last save
    setSaving(true);

    try {
      if (savedId) {
        // ✅ Already exists — always PATCH
        const res = await fetch("/api/generations/save", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: savedId, layout, prompt: prompt ?? "" }),
        });
        if (res.ok) {
          setSaved(true);
          setPendingChanges(false); // ← clear pending after successful PATCH
        }
      } else {
        // ✅ First save — POST
        const res = await fetch("/api/generations/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout, prompt: prompt ?? "" }),
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
          body: JSON.stringify({ layout, prompt: prompt ?? "" }),
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

  const handleDownload = () => {
    if (!layout) return;
    const html = generateHtml(layout);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layout.branding?.logoText?.toLowerCase().replace(/\s+/g, "-") ?? "website"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save button label logic
  const saveLabel = () => {
    if (saving) return "Saving…";
    if (saved && !pendingChanges) return savedId ? "Saved!" : "Saved!";
    if (saved && pendingChanges) return "Save changes";
    return "Save";
  };

  const saveDisabled = saving || (saved && !pendingChanges);

  if (!layout) {
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
            {layout.branding?.logoText?.toLowerCase().replace(/\s+/g, "") ||
              "preview"}
            .crawlcube.app
          </span>
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

      {/* Edit hint bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border-b border-purple-500/20 text-xs text-purple-400">
        <Pencil className="w-3 h-3 shrink-0" />
        <span>Click any text in the preview to edit it directly</span>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-neutral-800 flex items-start justify-center p-4">
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
      </div>
    </div>
  );
}
