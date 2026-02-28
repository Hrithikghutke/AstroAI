"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Share2,
  Clock,
  Layers,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Header from "@/components/Header";

interface Generation {
  id: string;
  shareId: string;
  siteName: string;
  prompt: string;
  themeStyle: string;
  createdAt: string | null;
}

const THEME_COLORS: Record<string, string> = {
  minimal: "#a3a3a3",
  bold: "#f97316",
  glassmorphism: "#8b5cf6",
  elegant: "#d4af7a",
  corporate: "#3b82f6",
};

export default function Dashboard() {
  const router = useRouter();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  useEffect(() => {
    fetchGenerations();
  }, []);

  const fetchGenerations = async () => {
    try {
      const res = await fetch("/api/generations");
      const data = await res.json();
      setGenerations(data.generations ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (shareId: string) => {
    const url = `${window.location.origin}/preview/${shareId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGenerations((prev) => prev.filter((g) => g.id !== id));
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <Header />

      <div className="max-w-6xl mx-auto w-full px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Websites</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {generations.length} site{generations.length !== 1 ? "s" : ""}{" "}
              generated
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            New Website
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && generations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Layers className="w-7 h-7 text-neutral-600" />
            </div>
            <p className="text-neutral-400 font-medium">No websites yet</p>
            <p className="text-neutral-600 text-sm">
              Generate your first website to see it here
            </p>
            <Link
              href="/"
              className="mt-2 flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              Build your first site
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && generations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {generations.map((gen) => {
              const isExpanded = expandedPrompt === gen.id;
              const promptText = gen.prompt?.trim() || "";
              const isLong = promptText.length > 80;

              return (
                <div
                  key={gen.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-600 transition-all duration-200 flex flex-col"
                >
                  {/* Color accent top bar */}
                  <div
                    className="h-1.5 w-full shrink-0"
                    style={{
                      background: THEME_COLORS[gen.themeStyle] ?? "#6366f1",
                    }}
                  />

                  <div className="p-5 flex flex-col flex-1">
                    {/* Site name + theme badge + delete */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-base leading-tight truncate">
                          {gen.siteName}
                        </h3>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 mt-0.5"
                          style={{
                            background: `${THEME_COLORS[gen.themeStyle] ?? "#6366f1"}22`,
                            color: THEME_COLORS[gen.themeStyle] ?? "#6366f1",
                          }}
                        >
                          {gen.themeStyle}
                        </span>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(gen.id)}
                        disabled={deletingId === gen.id}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer disabled:opacity-40"
                        title="Delete"
                      >
                        {deletingId === gen.id ? (
                          <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Prompt */}
                    <div className="mb-3">
                      {promptText ? (
                        <>
                          <p
                            className={`text-xs text-neutral-500 leading-relaxed ${!isExpanded && isLong ? "line-clamp-2" : ""}`}
                          >
                            {promptText}
                          </p>
                          {isLong && (
                            <button
                              onClick={() =>
                                setExpandedPrompt(isExpanded ? null : gen.id)
                              }
                              className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-400 mt-1 transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  Show more
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-neutral-700 italic">
                          No prompt recorded
                        </p>
                      )}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mb-4">
                      <Clock className="w-3 h-3" />
                      {formatDate(gen.createdAt)}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/preview/${gen.shareId}`}
                        target="_blank"
                        className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-all"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleShare(gen.shareId)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer"
                        style={{
                          background:
                            copiedId === gen.shareId
                              ? "#16a34a22"
                              : "#7c3aed22",
                          color:
                            copiedId === gen.shareId ? "#4ade80" : "#a78bfa",
                        }}
                      >
                        <Share2 className="w-3 h-3" />
                        {copiedId === gen.shareId ? "Copied!" : "Share"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
