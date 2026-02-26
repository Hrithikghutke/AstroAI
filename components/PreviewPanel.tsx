"use client";

import { useState } from "react";
import PreviewFrame from "@/components/PreviewFrame";
import { Layout } from "@/types/layout";
import { Monitor, Smartphone, Download } from "lucide-react";

export default function PreviewPanel({ layout }: { layout: Layout | null }) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  if (!layout) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 gap-4">
        {/* Grid background */}
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
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-950">
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
            .astroweb.app
          </span>
        </div>

        {/* Viewport Toggle */}
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
          <button
            onClick={() => setViewport("desktop")}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewport === "desktop"
                ? "bg-neutral-700 text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewport === "mobile"
                ? "bg-neutral-700 text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-neutral-800 flex items-start justify-center p-4">
        <div
          className="bg-white rounded-lg overflow-auto shadow-2xl transition-all duration-300 origin-top"
          style={{
            width: viewport === "mobile" ? "390px" : "100%",
            minHeight: "100%",
          }}
        >
          <PreviewFrame layout={layout} />
        </div>
      </div>
    </div>
  );
}
