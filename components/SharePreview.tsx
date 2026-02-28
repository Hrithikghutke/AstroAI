"use client";

import { useEffect, useState } from "react";
import PreviewFrame from "@/components/PreviewFrame";
import { normalizeLayout } from "@/lib/normalizeLayout";
import { Monitor, Smartphone, ExternalLink } from "lucide-react";
import Link from "next/link";
import Logo from "@/assets/logo.svg";
import cname from "@/assets/cname.svg";

export default function SharePreview({ shareId }: { shareId: string }) {
  const [layout, setLayout] = useState<any>(null);
  const [siteName, setSiteName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await fetch(`/api/preview/${shareId}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        const normalized = normalizeLayout(data.generation.layout);
        setLayout(normalized);
        setSiteName(data.generation.siteName ?? "Untitled");
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [shareId]);

  if (loading) {
    return (
      <div className="h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-500 text-sm">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (notFound || !layout) {
    return (
      <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-300 text-lg font-semibold">
          Preview not found
        </p>
        <p className="text-neutral-600 text-sm">
          This link may have expired or doesn't exist.
        </p>
        <Link
          href="/"
          className="mt-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold rounded-xl transition-all"
        >
          Build your own →
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-neutral-950 border-b border-neutral-800">
        {/* Left — CrawlCube branding */}
        <Link href="/" className="flex items-center gap-2">
          <img src={Logo.src} className="w-7 h-7" alt="logo" />
          <img src={cname.src} className="w-24 opacity-80" alt="CrawlCube" />
        </Link>

        {/* Center — site name */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/60" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
            <div className="w-2 h-2 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-neutral-500 truncate max-w-40">
            {siteName.toLowerCase().replace(/\s+/g, "")}.crawlcube.app
          </span>
        </div>

        {/* Right — viewport + CTA */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewport("desktop")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewport === "desktop" ? "bg-neutral-700 text-white" : "text-neutral-500"}`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewport === "mobile" ? "bg-neutral-700 text-white" : "text-neutral-500"}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 bg-purple-500 hover:bg-purple-400 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Build yours
          </Link>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-auto bg-neutral-800 flex items-start justify-center p-4">
        <div
          className="bg-white rounded-lg overflow-auto shadow-2xl transition-all duration-300"
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
