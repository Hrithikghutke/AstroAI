"use client";

import Header from "@/components/Header";
import LandingPrompt from "@/components/LandingPrompt";
import RecentGenerations from "@/components/RecentGenerations";
import ShowcaseSection from "@/components/ShowcaseSection";
import GallerySection from "@/components/GallerySection";
import LandingFooter from "@/components/LandingFooter";

export default function Home() {
  return (
    <main className="h-screen flex flex-col bg-[#fafafa] dark:bg-[#050505] text-black dark:text-white transition-colors overflow-hidden relative">
      
      {/* Modern SaaS Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* CSS Mesh Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Glowing Asymmetrical Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 dark:bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 dark:bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-indigo-600/20 dark:bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <div className="z-10 relative flex-none">
        <Header transparent />
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-800 scrollbar-track-transparent relative z-10">
        <LandingPrompt />
        <RecentGenerations />
        <ShowcaseSection />
        <GallerySection />
        <LandingFooter />
      </div>
    </main>
  );
}
