"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Layers, Globe, Lock, Atom, Code2 } from "lucide-react";
import PreviewFrame from "@/components/PreviewFrame";

interface Generation {
  id: string;
  shareId: string;
  siteName: string;
  prompt: string;
  themeStyle: string;
  createdAt: string | null;
  mode?: "fast" | "deep" | "react";
  layout?: any;
  deepHtml?: string | null;
  thumbnail?: string | null;
}

import LiveThumbnail from "@/components/LiveThumbnail";

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
    <div className="bg-white drop-shadow-2xl dark:bg-[#111111] py-10 px-10 rounded-2xl w-full max-w-5xl mx-auto mt-12 px-4 sm:px-6 mb-16 relative z-10 border-t border-neutral-200 dark:border-neutral-800/60 pt-6">
      
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
              href={gen.mode === "react" ? `/react-builder?continue=${gen.id}` : `/build?continue=${gen.id}`}
              className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all cursor-pointer group"
            >
              {/* Live thumbnail — CSS scaled component tree or fallback */}
              <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border border-neutral-300/60 dark:border-neutral-700/40 shadow-sm ring-1 ring-inset ring-black/5 group-hover:ring-black/10 transition-all bg-neutral-900">
                <LiveThumbnail gen={gen} scale={0.0625} />
                
                {/* Micro Badge */}
                <div className="absolute top-1 left-1 z-10 p-0.5 rounded-sm bg-neutral-950/80 backdrop-blur-sm border border-white/5">
                  {gen.mode === "react" ? (
                    <Atom className="w-2.5 h-2.5 text-blue-400" />
                  ) : (
                    <Code2 className="w-2.5 h-2.5 text-orange-400" />
                  )}
                </div>
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
