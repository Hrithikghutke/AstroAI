"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Layers, Globe, Lock } from "lucide-react";
import PreviewFrame from "@/components/PreviewFrame";

interface Generation {
  id: string;
  shareId: string;
  siteName: string;
  prompt: string;
  themeStyle: string;
  createdAt: string | null;
  mode?: "fast" | "deep";
  layout?: any;
  deepHtml?: string | null;
  thumbnail?: string | null;
}

// CSS-based themed thumbnail — derived from themeStyle so each card looks distinct
const THEME_PALETTES: Record<string, { bg: string; accent: string; bar: string; blocks: string[] }> = {
  minimal:        { bg: "#f9fafb", accent: "#111827", bar: "#e5e7eb", blocks: ["#f3f4f6","#e5e7eb","#d1d5db"] },
  bold:           { bg: "#0f0f0f", accent: "#facc15", bar: "#1f1f1f", blocks: ["#facc15","#f97316","#1f1f1f"] },
  glassmorphism:  { bg: "linear-gradient(135deg,#1e1b4b,#312e81)", accent: "#818cf8", bar: "rgba(255,255,255,0.1)", blocks: ["rgba(129,140,248,0.4)","rgba(196,181,253,0.3)","rgba(255,255,255,0.1)"] },
  elegant:        { bg: "#1a1209", accent: "#d4a855", bar: "#2d2215", blocks: ["#d4a855","#a37c32","#2d2215"] },
  corporate:      { bg: "#f8fafc", accent: "#2563eb", bar: "#e2e8f0", blocks: ["#2563eb","#3b82f6","#e2e8f0"] },
  "deep-dive":    { bg: "#0a0a0a", accent: "#a855f7", bar: "#1a1a1a", blocks: ["#a855f7","#ec4899","#1a1a1a"] },
};

function ThemeThumbnail({ themeStyle }: { themeStyle: string }) {
  const p = THEME_PALETTES[themeStyle] ?? THEME_PALETTES["corporate"];
  const isGradientBg = p.bg.startsWith("linear");
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ background: isGradientBg ? p.bg : p.bg }}
    >
      {/* Nav bar simulation */}
      <div className="absolute top-0 left-0 right-0 h-[18%] flex items-center px-2 gap-1" style={{ background: p.bar }}>
        <div className="w-3 h-1.5 rounded-sm" style={{ background: p.accent, opacity: 0.9 }} />
        <div className="flex-1" />
        <div className="w-2 h-1 rounded-sm" style={{ background: p.accent, opacity: 0.4 }} />
        <div className="w-2 h-1 rounded-sm" style={{ background: p.accent, opacity: 0.4 }} />
      </div>
      {/* Hero block */}
      <div className="absolute top-[22%] left-2 right-2 h-[28%] rounded-sm" style={{ background: p.blocks[0], opacity: 0.7 }} />
      {/* Two feature cards */}
      <div className="absolute top-[55%] left-2 right-[52%] h-[20%] rounded-sm" style={{ background: p.blocks[1], opacity: 0.55 }} />
      <div className="absolute top-[55%] left-[52%] right-2 h-[20%] rounded-sm" style={{ background: p.blocks[2], opacity: 0.45 }} />
      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[12%]" style={{ background: p.bar, opacity: 0.6 }} />
    </div>
  );
}

function LiveThumbnail({ gen }: { gen: Generation }) {
  if (gen.thumbnail) {
    return (
      <img 
        src={gen.thumbnail} 
        alt={gen.siteName || "Site thumbnail"} 
        className="w-full h-full object-cover object-top"
      />
    );
  }

  if (gen.mode === "deep" && gen.deepHtml) {
    return (
      <div className="w-full h-full bg-white relative overflow-hidden pointer-events-none select-none">
        <iframe
          srcDoc={gen.deepHtml}
          style={{
            width: "1280px",
            height: "896px",
            transform: "scale(0.0625)",
            transformOrigin: "top left",
            border: "none",
          }}
          scrolling="no"
          tabIndex={-1}
        />
      </div>
    );
  }

  if (gen.layout) {
    return (
      <div className="w-full h-full bg-white relative overflow-hidden pointer-events-none select-none">
        <div
          style={{
            width: "1280px",
            height: "896px",
            transform: "scale(0.0625)",
            transformOrigin: "top left",
          }}
        >
          <PreviewFrame layout={gen.layout} editable={false} isThumbnail={true} />
        </div>
      </div>
    );
  }

  return <ThemeThumbnail themeStyle={gen.themeStyle} />;
}

export default function RecentGenerations() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchGenerations();
  }, []);

  const fetchGenerations = async () => {
    try {
      const res = await fetch("/api/generations");
      const data = await res.json();
      setGenerations(data.generations?.slice(0, 4) ?? []);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const filtered = query.trim()
    ? generations.filter((g) =>
        (g.siteName ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (g.prompt ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : generations;

  if (loading || generations.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 px-4 sm:px-6 mb-16 relative z-10 border-t border-neutral-200 dark:border-neutral-800/60 pt-6">
      
      {/* Top Header / Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-6">
          <button className="text-sm font-bold text-neutral-900 dark:text-white transition-colors cursor-pointer border-b-2 border-neutral-900 dark:border-white pb-1">
            Recent Chats
          </button>
          <button className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer pb-1">
            Collaborations
          </button>
          <button className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer pb-1">
            Iterations
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-neutral-400">
            <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"><Layers className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"><Globe className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"><Lock className="w-4 h-4" /></button>
          </div>
          
          <div className="relative w-full sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${generations.length} project${generations.length === 1 ? "" : "s"}...`}
              className="w-full bg-transparent border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 rounded-full py-1.5 pl-8 pr-4 text-xs text-neutral-800 dark:text-neutral-200 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <p className="col-span-4 text-center text-xs text-neutral-500 dark:text-neutral-600 py-4">
            No projects match &ldquo;{query}&rdquo;
          </p>
        ) : (
          filtered.map((gen) => (
            <Link
              key={gen.id}
              href={`/build?continue=${gen.id}`}
              className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all cursor-pointer group"
            >
              {/* Live thumbnail — CSS scaled component tree or fallback */}
              <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 border border-neutral-300/60 dark:border-neutral-700/40 shadow-sm ring-1 ring-inset ring-black/5 group-hover:ring-black/10 transition-all bg-neutral-900">
                <LiveThumbnail gen={gen} />
              </div>

              {/* Details */}
              <div className="flex flex-col min-w-0">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate mb-1">
                  {gen.siteName || "Untitled Project"}
                </h3>
                <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-500">
                  {formatDate(gen.createdAt)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

    </div>
  );
}
