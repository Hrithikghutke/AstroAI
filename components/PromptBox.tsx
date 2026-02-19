"use client";

import { useState, useEffect } from "react";
import { MoveRight } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { normalizeLayout } from "@/lib/normalizeLayout";

const useTypewriter = (
  words: string[],
  typingSpeed = 100,
  deletingSpeed = 50,
  pause = 1500,
) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !isDeleting) {
      setTimeout(() => setIsDeleting(true), pause);
      return;
    }

    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(
      () => {
        setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
      },
      isDeleting ? deletingSpeed : typingSpeed,
    );

    setText(words[index].substring(0, subIndex));

    return () => clearTimeout(timeout);
  }, [subIndex, index, isDeleting, words]);

  return text;
};

const PLACEHOLDERS = [
  "Create a modern gym website...",
  "Design a landing page for a SaaS...",
  "Build a portfolio with dark mode...",
];

export default function PromptBox({ setLayout }: any) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      console.log("AI Layout:", JSON.stringify(data.layout, null, 2)); // Debugging log

      if (data.layout) {
        const stableLayout = normalizeLayout(data.layout);
        setLayout(stableLayout); // Ensure we pass a fully normalized layout to the preview
        console.log(
          "Normalized Layout:",
          JSON.stringify(stableLayout, null, 2),
        ); // Debugging log
      }
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const animatedPlaceholder = useTypewriter(PLACEHOLDERS);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl p-4 mb-10 pt-[20vh]">
      <h2 className="text-2xl font-semibold lg:text-[40px] bg-linear-to-r from-purple-400 to-white bg-clip-text text-transparent text-center ">
        What will you build today?
      </h2>

      <div className="relative w-full lg:w-[50%] flex flex-col items-center gap-4  ">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={animatedPlaceholder}
          className="mt-2 lg:mt-5 h-20 lg:h-40 w-full resize-none rounded-lg bg-black p-4 text-sm text-stone-400 outline-none ring-1 ring-neutral-800 focus:ring-2 placeholder:text-md lg:placeholder:text-lg placeholder:font-normal lg:placeholder:font-medium transition-all scrollbar scrollbar-thumb-gray-600 scrollbar-track-black scrollbar-thumb-rounded-full"
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="absolute bottom-4 right-4 rounded-lg bg-purple-400 px-2 lg:px-4 py-0.5  lg:py-2 text-sm font-medium hover:bg-purple-500 transition-all duration-300 ease-in-out cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <LoaderCircle
              strokeWidth={2}
              className="animate-spin w-4 h-5 lg:w-7 lg:h-8 "
            />
          ) : (
            <MoveRight
              strokeWidth={2}
              className="inline-block w-4 h-5 lg:w-7 lg:h-8"
            />
          )}
        </button>
      </div>

      <p className="text-xs lg:text-[14px] text-neutral-500">
        Tip: Be specific about layout, sections, and style.
      </p>
    </div>
  );
}
