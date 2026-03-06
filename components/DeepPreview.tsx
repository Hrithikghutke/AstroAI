"use client";

import { useEffect, useRef } from "react";

export default function DeepPreview({
  html,
  viewport = "desktop",
}: {
  html: string;
  viewport?: "desktop" | "mobile";
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;

    // Revoke previous blob URL to free memory
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    iframe.src = url;

    // Cleanup on unmount
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      className="rounded-lg shadow-2xl transition-all duration-300 border-0"
      style={{
        width: viewport === "mobile" ? "390px" : "100%",
        minHeight: "100%",
        background: "white",
      }}
      sandbox="allow-scripts allow-same-origin allow-forms"
      title="Deep Dive Preview"
    />
  );
}
