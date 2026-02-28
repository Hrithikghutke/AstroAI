"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import { useCredits } from "@/context/CreditsContext";
import Logo from "@/assets/logo.svg";
import cname from "@/assets/cname.svg";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function Header() {
  const { isSignedIn } = useUser();
  const { credits } = useCredits();

  return (
    <header className="flex items-center justify-between px-6 lg:px-10 bg-neutral-950 py-4 border-b border-neutral-900">
      {/* Logo */}
      <Link href="/" className="flex items-center ml-7">
        <img src={Logo.src} className="w-10 mr-3" alt="Astro Web logo" />
        <img
          src={cname.src}
          className="w-30 ml-1 opacity-90"
          alt="Astro Web logo"
        />
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

        {isSignedIn && (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        )}

        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
