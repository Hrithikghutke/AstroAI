"use client";

import Header from "@/components/Header";
import LandingPrompt from "@/components/LandingPrompt";

export default function Home() {
  return (
    <main className="h-screen flex flex-col bg-neutral-950 text-white overflow-hidden">
      <Header />
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <LandingPrompt />
      </div>
    </main>
  );
}
