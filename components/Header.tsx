"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import { useCredits } from "@/context/CreditsContext";
import Logo from "@/assets/logo.svg";
import cname from "@/assets/cname.svg";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { isSignedIn } = useUser();
  const { credits } = useCredits();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 lg:px-10 bg-neutral-950 py-3 sm:py-4 border-b border-neutral-900">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <img src={Logo.src} className="w-8 sm:w-10" alt="CrawlCube logo" />
        <img
          src={cname.src}
          className="w-22 sm:w-30 opacity-90"
          alt="CrawlCube"
        />
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {isSignedIn && credits !== null && (
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-full px-2.5 sm:px-3 py-1.5 transition-colors"
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-neutral-200">
              {credits}
              <span className="hidden sm:inline">
                {" "}
                {credits === 1 ? "credit" : "credits"}
              </span>
            </span>
          </Link>
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
