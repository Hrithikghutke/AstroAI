"use client";

import Header from "@/components/Header";
import LandingPrompt from "@/components/LandingPrompt";
import RecentGenerations from "@/components/RecentGenerations";

export default function Home() {
  return (
    <main className="h-screen flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-white transition-colors overflow-hidden">
      <Header />
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-800 scrollbar-track-transparent">
        <LandingPrompt />
        <RecentGenerations />
      </div>
    </main>
  );
}
