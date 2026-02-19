"use client";

import PromptBox from "@/components/PromptBox";
import PreviewFrame from "@/components/PreviewFrame";
import backgroundImage from "@/assets/background.png";
import Header from "@/components/Header";
import { useState } from "react";

export default function Home() {
  const [layout, setLayout] = useState(null);
  return (
    <main className="relative min-h-screen text-white overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0 -z-10">
        <img
          src={backgroundImage.src}
          alt="Background"
          className="h-full w-full lg:h-full lg:w-full object-cover opacity-40"
        />
      </div>

      {/* Optional dark overlay for readability */}
      <div className="absolute inset-0 -z-10 bg-black/60" />

      <Header />

      <section className="grid grid-cols-1 lg:grid-cols-1 gap-6 p-6">
        <PromptBox setLayout={setLayout} />
        <PreviewFrame layout={layout} />
      </section>
    </main>
  );
}
