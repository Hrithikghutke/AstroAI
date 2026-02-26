"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import { useCredits } from "@/context/CreditsContext";
import Logo from "@/assets/logo.svg";
import Link from "next/link";

export default function Header() {
  const { isSignedIn } = useUser();
  const { credits } = useCredits();

  return (
    <header className="flex items-center justify-between px-6 lg:px-10 bg-neutral-950 py-4 border-b border-neutral-900">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <img src={Logo.src} className="w-7 h-7 mr-3" alt="Astro Web logo" />
        <h1 className="text-xl font-normal tracking-tight">
          Astro
          <span className="font-black pl-0.5 text-neutral-600">web</span>
        </h1>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {isSignedIn && credits !== null && (
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-neutral-200">
              {credits} {credits === 1 ? "credit" : "credits"}
            </span>
          </div>
        )}
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
